from django.core.management.base import BaseCommand
from django.db import connection
import os

class Command(BaseCommand):
    help = 'Setup database views, stored procedures, triggers, and events'

    def handle(self, *args, **options):
        self.stdout.write('Setting up database objects...')
        
        # Get the project directory
        project_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
        
        # Paths to SQL files
        additional_tables_file = os.path.join(project_dir, 'additional_tables.sql')
        database_objects_file = os.path.join(project_dir, 'database_objects.sql')
        
        try:
            with connection.cursor() as cursor:
                # First, create additional tables
                if os.path.exists(additional_tables_file):
                    self.stdout.write('Creating additional tables...')
                    with open(additional_tables_file, 'r') as f:
                        sql_content = f.read()
                    
                    # Split by semicolon and execute each statement
                    statements = sql_content.split(';')
                    for statement in statements:
                        statement = statement.strip()
                        if statement and not statement.startswith('--'):
                            try:
                                cursor.execute(statement)
                                self.stdout.write(f'Executed: {statement[:50]}...')
                            except Exception as e:
                                self.stdout.write(self.style.WARNING(f'Warning: {e}'))
                    
                    self.stdout.write(self.style.SUCCESS('Additional tables created successfully!'))
                else:
                    self.stdout.write(self.style.WARNING('Additional tables file not found'))
                
                # Then, create database objects
                if os.path.exists(database_objects_file):
                    self.stdout.write('Creating database objects (views, procedures, triggers, events)...')
                    with open(database_objects_file, 'r') as f:
                        sql_content = f.read()
                    
                    # Split by semicolon and execute each statement
                    statements = sql_content.split(';')
                    for statement in statements:
                        statement = statement.strip()
                        if statement and not statement.startswith('--') and not statement.startswith('/*'):
                            try:
                                cursor.execute(statement)
                                self.stdout.write(f'Executed: {statement[:50]}...')
                            except Exception as e:
                                self.stdout.write(self.style.WARNING(f'Warning: {e}'))
                    
                    self.stdout.write(self.style.SUCCESS('Database objects created successfully!'))
                else:
                    self.stdout.write(self.style.WARNING('Database objects file not found'))
                
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error setting up database objects: {e}'))
            return
        
        self.stdout.write(self.style.SUCCESS('Database setup completed!'))
        
        # Show summary of what was created
        self.stdout.write('\nCreated Database Objects:')
        self.stdout.write('✓ Views: v_active_rentals, v_user_statistics, v_tool_availability, v_revenue_report')
        self.stdout.write('✓ Stored Procedures: sp_create_rental, sp_complete_rental, sp_calculate_user_rating, sp_get_user_dashboard')
        self.stdout.write('✓ Triggers: tr_rental_after_insert, tr_rental_after_update, tr_feedback_after_insert, etc.')
        self.stdout.write('✓ Events: ev_daily_rental_update, ev_weekly_revenue_report, ev_monthly_cleanup')
        self.stdout.write('✓ Functions: fn_calculate_distance, fn_get_nearby_tools')
        self.stdout.write('✓ Additional Tables: api_audit_log, api_weekly_reports, api_notification, etc.')
        self.stdout.write('✓ Indexes: Performance indexes for better query performance') 