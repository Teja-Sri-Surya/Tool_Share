from django.core.management.base import BaseCommand
from django.db import connection
import os

class Command(BaseCommand):
    help = 'Apply database optimizations for availability indexing, geographic indexing, and transaction integrity'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting database optimizations...'))
        
        # Read the SQL file
        sql_file_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), 'database_optimizations.sql')
        
        try:
            with open(sql_file_path, 'r') as file:
                sql_content = file.read()
            
            # Split the SQL content into individual statements
            statements = sql_content.split(';')
            
            with connection.cursor() as cursor:
                for statement in statements:
                    statement = statement.strip()
                    if statement and not statement.startswith('--'):
                        try:
                            cursor.execute(statement)
                            self.stdout.write(f'Executed: {statement[:50]}...')
                        except Exception as e:
                            self.stdout.write(self.style.WARNING(f'Warning: {e}'))
                            # Continue with other statements
                
                connection.commit()
            
            self.stdout.write(self.style.SUCCESS('Database optimizations completed successfully!'))
            
        except FileNotFoundError:
            self.stdout.write(self.style.ERROR('SQL file not found. Please ensure database_optimizations.sql exists in the project root.'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error applying optimizations: {e}')) 