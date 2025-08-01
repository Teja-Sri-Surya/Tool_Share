from django.core.management.base import BaseCommand
from api.models import Tool, RentalTransaction, Availability, Message, UserReview, Feedback, BorrowRequest

class Command(BaseCommand):
    help = 'Clear all tool data and related records from the database'

    def add_arguments(self, parser):
        parser.add_argument(
            '--confirm',
            action='store_true',
            help='Confirm that you want to delete all tool data',
        )

    def handle(self, *args, **options):
        if not options['confirm']:
            self.stdout.write(
                self.style.WARNING(
                    'This will delete ALL tool data, rental transactions, availability records, '
                    'messages, reviews, feedback, and borrow requests. '
                    'Use --confirm to proceed.'
                )
            )
            return

        # Delete related data first (due to foreign key constraints)
        self.stdout.write('Deleting user reviews...')
        UserReview.objects.all().delete()
        
        self.stdout.write('Deleting messages...')
        Message.objects.all().delete()
        
        self.stdout.write('Deleting availability records...')
        Availability.objects.all().delete()
        
        self.stdout.write('Deleting rental transactions...')
        RentalTransaction.objects.all().delete()
        
        self.stdout.write('Deleting feedback...')
        Feedback.objects.all().delete()
        
        self.stdout.write('Deleting borrow requests...')
        BorrowRequest.objects.all().delete()
        
        self.stdout.write('Deleting tools...')
        Tool.objects.all().delete()
        
        self.stdout.write(
            self.style.SUCCESS(
                'Successfully cleared all tool data and related records from the database!'
            )
        ) 