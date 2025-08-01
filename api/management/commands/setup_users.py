from django.core.management.base import BaseCommand
from django.contrib.auth.models import User as DjangoUser
from api.models import User, Tool

class Command(BaseCommand):
    help = 'Set up default users and tools for the application'

    def handle(self, *args, **options):
        self.stdout.write('Setting up default users and tools...')
        
        # Create Django Users first
        django_users = []
        
        # Create owner user
        owner_django_user, created = DjangoUser.objects.get_or_create(
            username='tool_owner',
            defaults={
                'email': 'owner@example.com',
                'first_name': 'Tool',
                'last_name': 'Owner',
                'password': 'ownerpass123'
            }
        )
        if created:
            owner_django_user.set_password('ownerpass123')
            owner_django_user.save()
            self.stdout.write(f'Created Django User: {owner_django_user.username}')
        django_users.append(owner_django_user)
        
        # Create borrower user
        borrower_django_user, created = DjangoUser.objects.get_or_create(
            username='tool_borrower',
            defaults={
                'email': 'borrower@example.com',
                'first_name': 'Tool',
                'last_name': 'Borrower',
                'password': 'borrowerpass123'
            }
        )
        if created:
            borrower_django_user.set_password('borrowerpass123')
            borrower_django_user.save()
            self.stdout.write(f'Created Django User: {borrower_django_user.username}')
        django_users.append(borrower_django_user)
        
        # Create User profiles
        user_profiles = []
        for django_user in django_users:
            user_profile, created = User.objects.get_or_create(
                user=django_user,
                defaults={
                    'phone_number': '555-1234',
                    'city': 'Example City',
                    'state': 'CA',
                    'zip_code': '12345',
                    'country': 'USA'
                }
            )
            if created:
                self.stdout.write(f'Created User Profile for: {django_user.username}')
            user_profiles.append(user_profile)
        
        # Create tools for the owner
        owner_profile = user_profiles[0]  # First user is owner
        
        tools_data = [
            {
                'name': 'Drill Set',
                'description': 'Professional drill set with multiple bits',
                'pricing_type': 'daily',
                'price_per_day': 25.00,
                'replacement_value': 150.00
            },
            {
                'name': 'Hammer',
                'description': 'Standard claw hammer',
                'pricing_type': 'daily',
                'price_per_day': 10.00,
                'replacement_value': 30.00
            },
            {
                'name': 'Lawn Mower',
                'description': 'Electric lawn mower',
                'pricing_type': 'daily',
                'price_per_day': 40.00,
                'replacement_value': 200.00
            }
        ]
        
        for tool_data in tools_data:
            tool, created = Tool.objects.get_or_create(
                name=tool_data['name'],
                owner=owner_profile,
                defaults=tool_data
            )
            if created:
                self.stdout.write(f'Created Tool: {tool.name}')
        
        self.stdout.write(
            self.style.SUCCESS('Successfully set up users and tools!')
        )
        self.stdout.write('Users created:')
        for profile in user_profiles:
            self.stdout.write(f'  - {profile.user.username} (ID: {profile.id})') 