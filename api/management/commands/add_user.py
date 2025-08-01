from django.core.management.base import BaseCommand
from api.models import User as CustomUser

class Command(BaseCommand):
    help = 'Add a new user to the system'

    def add_arguments(self, parser):
        parser.add_argument('username', type=str, help='Username for the new user')
        parser.add_argument('email', type=str, help='Email for the new user')
        parser.add_argument('password', type=str, help='Password for the new user')
        parser.add_argument('--first-name', type=str, default='', help='First name')
        parser.add_argument('--last-name', type=str, default='', help='Last name')
        parser.add_argument('--phone', type=str, default='555-0000', help='Phone number')
        parser.add_argument('--city', type=str, default='Default City', help='City')
        parser.add_argument('--state', type=str, default='CA', help='State')
        parser.add_argument('--zip', type=str, default='12345', help='Zip code')
        parser.add_argument('--country', type=str, default='USA', help='Country')
        parser.add_argument('--is-owner', action='store_true', help='User can be a tool owner')
        parser.add_argument('--is-borrower', action='store_true', help='User can be a borrower')

    def handle(self, *args, **options):
        username = options['username']
        email = options['email']
        password = options['password']
        
        # Check if user already exists
        if CustomUser.objects.filter(username=username).exists():
            self.stdout.write(
                self.style.ERROR(f'User with username "{username}" already exists!')
            )
            return
        
        if CustomUser.objects.filter(email=email).exists():
            self.stdout.write(
                self.style.ERROR(f'User with email "{email}" already exists!')
            )
            return
        
        try:
            # Create the user
            user = CustomUser.objects.create_user(
                username=username,
                email=email,
                password=password,
                first_name=options['first_name'],
                last_name=options['last_name'],
                phone_number=options['phone'],
                city=options['city'],
                state=options['state'],
                zip_code=options['zip'],
                country=options['country'],
                is_owner=options['is_owner'],
                is_borrower=options['is_borrower']
            )
            
            self.stdout.write(
                self.style.SUCCESS(f'Successfully created user: {username} (ID: {user.id})')
            )
            self.stdout.write(f'Email: {email}')
            self.stdout.write(f'Full Name: {user.get_full_name() or "Not set"}')
            self.stdout.write(f'Is Owner: {user.is_owner}')
            self.stdout.write(f'Is Borrower: {user.is_borrower}')
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error creating user: {str(e)}')
            ) 