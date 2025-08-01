from django.core.management.base import BaseCommand
from api.models import User, Tool, RentalTransaction
from datetime import date, timedelta

class Command(BaseCommand):
    help = 'Create test rental data for dashboard testing'

    def handle(self, *args, **options):
        self.stdout.write('Creating test rental data...')
        
        try:
            # Get existing users
            tool_owner = User.objects.get(username='tool_owner')
            demo_borrower = User.objects.get(username='demo_borrower')
            demo_user2 = User.objects.get(username='demo_user2')
            
            # Get existing tools
            tools = Tool.objects.all()
            
            if not tools.exists():
                self.stdout.write(self.style.WARNING('No tools found. Creating some test tools first...'))
                # Create some test tools
                tool1 = Tool.objects.create(
                    name='Drill Set',
                    description='Professional drill set with multiple bits',
                    daily_rate=25.00,
                    image_url='https://placehold.co/400x300.png',
                    available=True,
                    owner=tool_owner
                )
                tool2 = Tool.objects.create(
                    name='Garden Shovel',
                    description='Heavy-duty garden shovel',
                    daily_rate=15.00,
                    image_url='https://placehold.co/400x300.png',
                    available=True,
                    owner=tool_owner
                )
                tool3 = Tool.objects.create(
                    name='Ladder',
                    description='10-foot aluminum ladder',
                    daily_rate=20.00,
                    image_url='https://placehold.co/400x300.png',
                    available=True,
                    owner=demo_user2
                )
                tools = [tool1, tool2, tool3]
            
            # Create active rentals
            today = date.today()
            
            # Rental 1: demo_borrower renting from tool_owner
            rental1 = RentalTransaction.objects.create(
                owner=tool_owner,
                borrower=demo_borrower,
                tool=tools[0],  # Drill Set
                start_date=today - timedelta(days=2),
                end_date=today + timedelta(days=3),
                total_price=125.00,
                payment_status='paid',
                status='active'
            )
            
            # Rental 2: demo_user2 renting from tool_owner
            rental2 = RentalTransaction.objects.create(
                owner=tool_owner,
                borrower=demo_user2,
                tool=tools[1],  # Garden Shovel
                start_date=today - timedelta(days=1),
                end_date=today + timedelta(days=5),
                total_price=90.00,
                payment_status='pending',
                status='active'
            )
            
            # Rental 3: demo_borrower renting from demo_user2
            rental3 = RentalTransaction.objects.create(
                owner=demo_user2,
                borrower=demo_borrower,
                tool=tools[2],  # Ladder
                start_date=today,
                end_date=today + timedelta(days=2),
                total_price=40.00,
                payment_status='paid',
                status='active'
            )
            
            # Create some completed rentals for history
            completed_rental1 = RentalTransaction.objects.create(
                owner=tool_owner,
                borrower=demo_borrower,
                tool=tools[0],
                start_date=today - timedelta(days=10),
                end_date=today - timedelta(days=5),
                total_price=125.00,
                payment_status='paid',
                status='completed'
            )
            
            completed_rental2 = RentalTransaction.objects.create(
                owner=demo_user2,
                borrower=tool_owner,
                tool=tools[2],
                start_date=today - timedelta(days=15),
                end_date=today - timedelta(days=10),
                total_price=100.00,
                payment_status='paid',
                status='completed'
            )
            
            # Update tool availability
            tools[0].available = False  # Drill Set is rented
            tools[0].save()
            tools[1].available = False  # Garden Shovel is rented
            tools[1].save()
            tools[2].available = False  # Ladder is rented
            tools[2].save()
            
            self.stdout.write(self.style.SUCCESS('Test rental data created successfully!'))
            self.stdout.write(f'✓ Created {RentalTransaction.objects.filter(status="active").count()} active rentals')
            self.stdout.write(f'✓ Created {RentalTransaction.objects.filter(status="completed").count()} completed rentals')
            self.stdout.write(f'✓ Updated tool availability')
            
            # Show summary
            self.stdout.write('\nActive Rentals Summary:')
            active_rentals = RentalTransaction.objects.filter(status='active')
            for rental in active_rentals:
                self.stdout.write(f'  - {rental.borrower.username} rented {rental.tool.name} from {rental.owner.username}')
                self.stdout.write(f'    Due: {rental.end_date}, Status: {rental.payment_status}')
            
        except User.DoesNotExist as e:
            self.stdout.write(self.style.ERROR(f'User not found: {e}'))
            self.stdout.write('Please run "python manage.py setup_users" first to create users.')
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error creating test rentals: {e}')) 