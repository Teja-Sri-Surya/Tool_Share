#!/usr/bin/env python
import os
import sys
import django
from django.core.management import execute_from_command_line
from django.conf import settings

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'toolshare_backend.settings')
django.setup()

from api.models import User, Tool

def setup_database():
    print("Setting up database...")
    
    # Create Users
    users = []
    
    # Create owner user
    owner_user, created = User.objects.get_or_create(
        username='tool_owner',
        defaults={
            'email': 'tool_owner@example.com',
            'first_name': 'Tool',
            'last_name': 'Owner',
            'phone_number': '555-1234',
            'city': 'Example City',
            'state': 'CA',
            'zip_code': '12345',
            'country': 'USA',
            'is_owner': True,
            'is_borrower': True
        }
    )
    if created:
        owner_user.set_password('password123')
        owner_user.save()
        print(f'Created User: {owner_user.username}')
    users.append(owner_user)
    
    # Create borrower user
    borrower_user, created = User.objects.get_or_create(
        username='tool_borrower',
        defaults={
            'email': 'borrower@example.com',
            'first_name': 'Tool',
            'last_name': 'Borrower',
            'phone_number': '555-5678',
            'city': 'Example City',
            'state': 'CA',
            'zip_code': '12345',
            'country': 'USA',
            'is_owner': False,
            'is_borrower': True
        }
    )
    if created:
        borrower_user.set_password('borrowerpass123')
        borrower_user.save()
        print(f'Created User: {borrower_user.username}')
    users.append(borrower_user)
    
    # Create tools for the owner
    owner_profile = users[0]  # First user is owner
    
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
            print(f'Created Tool: {tool.name}')
    
    print("Database setup completed successfully!")
    print("Users created:")
    for user in users:
        print(f"  - {user.username} (ID: {user.id})")

if __name__ == "__main__":
    setup_database() 