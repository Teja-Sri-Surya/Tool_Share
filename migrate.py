#!/usr/bin/env python
import os
import sys
import django
from django.core.management import execute_from_command_line
from django.conf import settings

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'toolshare_backend.settings')
django.setup()

# Run migrations non-interactively
sys.argv = ['manage.py', 'makemigrations', '--noinput']
execute_from_command_line(sys.argv)

sys.argv = ['manage.py', 'migrate', '--noinput']
execute_from_command_line(sys.argv)

print("Migrations completed successfully!") 