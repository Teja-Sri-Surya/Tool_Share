from django.core.management.base import BaseCommand
from api.models import RentalTransaction, Deposit, DepositTransaction
from datetime import date, timedelta
from django.utils import timezone

class Command(BaseCommand):
    help = 'Process overdue rentals and forfeit deposits to tool owners'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be processed without making changes',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        
        if dry_run:
            self.stdout.write('DRY RUN MODE - No changes will be made')
        
        today = date.today()
        
        # Find all active rentals that are overdue
        overdue_rentals = RentalTransaction.objects.filter(
            status='active',
            end_date__lt=today
        )
        
        self.stdout.write(f'Found {overdue_rentals.count()} overdue rentals')
        
        processed_count = 0
        forfeited_deposits = 0
        
        for rental in overdue_rentals:
            try:
                # Get the deposit for this rental
                deposit = Deposit.objects.get(rental_transaction=rental)
                
                if deposit.status == 'pending':
                    if not dry_run:
                        # Forfeit the deposit to the tool owner
                        deposit.status = 'forfeited'
                        deposit.notes = f'Deposit forfeited due to overdue rental (due date: {rental.end_date})'
                        deposit.save()
                        
                        # Create forfeit transaction record
                        DepositTransaction.objects.create(
                            deposit=deposit,
                            transaction_type='forfeit',
                            amount=deposit.amount,
                            description=f'Deposit forfeited to {rental.owner.username} due to overdue rental',
                            processed_by=rental.owner
                        )
                        
                        # Update rental status to completed (overdue)
                        rental.status = 'completed'
                        rental.save()
                        
                        # Mark tool as available again
                        rental.tool.available = True
                        rental.tool.save()
                        
                        forfeited_deposits += 1
                        self.stdout.write(
                            self.style.SUCCESS(
                                f'✓ Forfeited ${deposit.amount} deposit for {rental.tool.name} '
                                f'(rented by {rental.borrower.username} to {rental.owner.username})'
                            )
                        )
                    else:
                        self.stdout.write(
                            f'Would forfeit ${deposit.amount} deposit for {rental.tool.name} '
                            f'(rented by {rental.borrower.username} to {rental.owner.username})'
                        )
                        forfeited_deposits += 1
                else:
                    self.stdout.write(
                        self.style.WARNING(
                            f'Deposit for {rental.tool.name} already processed (status: {deposit.status})'
                        )
                    )
                
                processed_count += 1
                
            except Deposit.DoesNotExist:
                self.stdout.write(
                    self.style.ERROR(
                        f'No deposit found for rental {rental.id} ({rental.tool.name})'
                    )
                )
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(
                        f'Error processing rental {rental.id}: {str(e)}'
                    )
                )
        
        # Summary
        self.stdout.write('\n' + '='*50)
        self.stdout.write('PROCESSING SUMMARY')
        self.stdout.write('='*50)
        self.stdout.write(f'Total overdue rentals found: {overdue_rentals.count()}')
        self.stdout.write(f'Rentals processed: {processed_count}')
        self.stdout.write(f'Deposits forfeited: {forfeited_deposits}')
        
        if dry_run:
            self.stdout.write('\nThis was a dry run. No changes were made.')
        else:
            self.stdout.write('\nProcessing completed successfully!')
            
        # Show upcoming rentals that will be due soon
        upcoming_due = RentalTransaction.objects.filter(
            status='active',
            end_date__gte=today,
            end_date__lte=today + timedelta(days=3)
        )
        
        if upcoming_due.exists():
            self.stdout.write('\n' + '='*50)
            self.stdout.write('UPCOMING DUE RENTALS (Next 3 days)')
            self.stdout.write('='*50)
            for rental in upcoming_due:
                days_until_due = (rental.end_date - today).days
                self.stdout.write(
                    f'{rental.tool.name} - Due in {days_until_due} days '
                    f'(Rented by {rental.borrower.username} to {rental.owner.username})'
                ) 