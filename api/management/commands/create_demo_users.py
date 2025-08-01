from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from api.models import User as CustomUser

class Command(BaseCommand):
    help = 'Create demo users for testing rental functionality'

    def handle(self, *args, **options):
        # Create demo borrower user
        demo_username = 'demo_borrower'
        demo_email = 'demo_borrower@example.com'
        
        # Check if demo user already exists
        if not CustomUser.objects.filter(username=demo_username).exists():
            # Create the custom user
            demo_user = CustomUser.objects.create_user(
                username=demo_username,
                email=demo_email,
                password='demo123',
                first_name='Demo',
                last_name='Borrower',
                phone_number='555-5678',
                city='Demo City',
                state='CA',
                zip_code='54321',
                country='USA',
                is_owner=False,
                is_borrower=True
            )
            self.stdout.write(
                self.style.SUCCESS(f'Successfully created demo borrower user: {demo_username}')
            )
        else:
            self.stdout.write(
                self.style.WARNING(f'Demo borrower user {demo_username} already exists')
            )
        
        # Create another demo user for variety
        demo2_username = 'demo_user2'
        demo2_email = 'demo_user2@example.com'
        
        if not CustomUser.objects.filter(username=demo2_username).exists():
            demo2_user = CustomUser.objects.create_user(
                username=demo2_username,
                email=demo2_email,
                password='demo123',
                first_name='Demo',
                last_name='User2',
                phone_number='555-8765',
                city='Demo City 2',
                state='CA',
                zip_code='65432',
                country='USA',
                is_owner=True,
                is_borrower=True
            )
            self.stdout.write(
                self.style.SUCCESS(f'Successfully created demo user2: {demo2_username}')
            )
        else:
            self.stdout.write(
                self.style.WARNING(f'Demo user2 {demo2_username} already exists')
            )
        
        self.stdout.write(
            self.style.SUCCESS('Demo users creation completed!')
        ) 