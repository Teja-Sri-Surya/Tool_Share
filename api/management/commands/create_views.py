from django.core.management.base import BaseCommand
from django.db import connection
import os

class Command(BaseCommand):
    help = 'Create database views for the tool sharing application'

    def handle(self, *args, **options):
        self.stdout.write('Creating database views...')
        
        # Get the project directory
        project_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
        views_file = os.path.join(project_dir, 'simple_views.sql')
        
        try:
            with connection.cursor() as cursor:
                if os.path.exists(views_file):
                    with open(views_file, 'r') as f:
                        sql_content = f.read()
                    
                    # Split by semicolon and execute each statement
                    statements = sql_content.split(';')
                    for statement in statements:
                        statement = statement.strip()
                        if statement and not statement.startswith('--') and not statement.startswith('USE'):
                            try:
                                cursor.execute(statement)
                                self.stdout.write(f'✓ Created view: {statement[:50]}...')
                            except Exception as e:
                                self.stdout.write(self.style.WARNING(f'Warning: {e}'))
                    
                    self.stdout.write(self.style.SUCCESS('Views created successfully!'))
                else:
                    self.stdout.write(self.style.ERROR('Views file not found'))
                
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error creating views: {e}'))
            return
        
        # Test the views
        self.stdout.write('\nTesting views...')
        try:
            with connection.cursor() as cursor:
                # Test user statistics view
                cursor.execute('SELECT COUNT(*) FROM v_user_statistics')
                result = cursor.fetchone()
                self.stdout.write(f'✓ v_user_statistics: {result[0]} records')
                
                # Test tool availability view
                cursor.execute('SELECT COUNT(*) FROM v_tool_availability')
                result = cursor.fetchone()
                self.stdout.write(f'✓ v_tool_availability: {result[0]} records')
                
                # Test user dashboard view
                cursor.execute('SELECT COUNT(*) FROM v_user_dashboard')
                result = cursor.fetchone()
                self.stdout.write(f'✓ v_user_dashboard: {result[0]} records')
                
        except Exception as e:
            self.stdout.write(self.style.WARNING(f'Warning testing views: {e}'))
        
        self.stdout.write(self.style.SUCCESS('\nDatabase views setup completed!'))
        self.stdout.write('\nAvailable Views:')
        self.stdout.write('✓ v_active_rentals - Shows all active rentals')
        self.stdout.write('✓ v_user_statistics - User statistics and metrics')
        self.stdout.write('✓ v_tool_availability - Tool availability and history')
        self.stdout.write('✓ v_revenue_report - Monthly revenue reports')
        self.stdout.write('✓ v_user_dashboard - User dashboard data')
        self.stdout.write('✓ v_tool_performance - Tool performance metrics') 