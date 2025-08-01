from django.core.management.base import BaseCommand
from api.models import RentalTransaction, Deposit, DepositTransaction

class Command(BaseCommand):
    help = 'Add $50 deposits to existing rentals that don\'t have deposits'

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
        
        # Find all rentals that don't have deposits
        rentals_without_deposits = []
        all_rentals = RentalTransaction.objects.all()
        
        for rental in all_rentals:
            try:
                deposit = Deposit.objects.get(rental_transaction=rental)
            except Deposit.DoesNotExist:
                rentals_without_deposits.append(rental)
        
        self.stdout.write(f'Found {len(rentals_without_deposits)} rentals without deposits')
        
        if not rentals_without_deposits:
            self.stdout.write(self.style.SUCCESS('All rentals already have deposits!'))
            return
        
        created_deposits = 0
        
        for rental in rentals_without_deposits:
            try:
                if not dry_run:
                    # Create deposit record for the rental
                    deposit = Deposit.objects.create(
                        rental_transaction=rental,
                        amount=50.00,  # Fixed $50 deposit
                        status='pending'
                    )
                    
                    # Create initial deposit transaction record
                    DepositTransaction.objects.create(
                        deposit=deposit,
                        transaction_type='payment',
                        amount=50.00,
                        description=f'Deposit payment for {rental.tool.name} rental (added retroactively)',
                        processed_by=rental.borrower
                    )
                    
                    created_deposits += 1
                    self.stdout.write(
                        self.style.SUCCESS(
                            f'✓ Added ${deposit.amount} deposit for {rental.tool.name} '
                            f'(rented by {rental.borrower.username} to {rental.owner.username})'
                        )
                    )
                else:
                    self.stdout.write(
                        f'Would add $50.00 deposit for {rental.tool.name} '
                        f'(rented by {rental.borrower.username} to {rental.owner.username})'
                    )
                    created_deposits += 1
                    
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(
                        f'Error adding deposit for rental {rental.id}: {str(e)}'
                    )
                )
        
        # Summary
        self.stdout.write('\n' + '='*50)
        self.stdout.write('DEPOSIT ADDITION SUMMARY')
        self.stdout.write('='*50)
        self.stdout.write(f'Rentals without deposits: {len(rentals_without_deposits)}')
        self.stdout.write(f'Deposits created: {created_deposits}')
        
        if dry_run:
            self.stdout.write('\nThis was a dry run. No changes were made.')
        else:
            self.stdout.write('\nDeposit addition completed successfully!') 