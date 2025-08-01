#!/usr/bin/env python3
"""
Script to disable Prisma usage in Next.js API routes
Since we're using Django with MySQL, we don't need Prisma
"""

import os
import re

def disable_prisma_in_file(file_path):
    """Disable Prisma usage in a single file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Skip if already disabled
        if 'DISABLED: Using Django with MySQL' in content:
            return False
        
        # Replace Prisma imports
        content = re.sub(
            r'import\s+\{\s*PrismaClient\s*\}\s+from\s+[\'"]@prisma/client[\'"];?',
            '// DISABLED: Using Django with MySQL instead of Prisma\n// import { PrismaClient } from \'@prisma/client\';',
            content
        )
        
        # Replace prisma client initialization
        content = re.sub(
            r'const\s+client\s*=\s*globalThis\.prisma\s*\|\|\s*new\s+PrismaClient\(\);',
            '// Disable Prisma client to prevent connection errors\nconst client = null;',
            content
        )
        
        # Replace prisma variable declarations
        content = re.sub(
            r'let\s+prisma:\s*PrismaClient;',
            '// let prisma: PrismaClient;',
            content
        )
        
        # Replace prisma usage in functions
        content = re.sub(
            r'await\s+prisma\.(\w+)\.(\w+)\([^)]*\);',
            '// await prisma.\\1.\\2(...); // DISABLED',
            content
        )
        
        # Add return message for disabled functions
        content = re.sub(
            r'return\s+Response\.json\([^)]*\);',
            'return Response.json({ message: "Prisma disabled - using Django API instead" });',
            content
        )
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        return True
    except Exception as e:
        print(f"Error processing {file_path}: {e}")
        return False

def find_and_disable_prisma():
    """Find all TypeScript files with Prisma usage and disable them"""
    api_routes = [
        'src/components/User/route.ts',
        'src/components/Feedbacks/route.ts',
        'src/components/BorrowRequests/route.ts',
        'src/components/auth/Signup/route.ts',
        'src/components/auth/Login/route.ts',
        'src/app/api/test-db/route.ts',
        'src/app/api/tools/route.ts',
        'src/app/api/rentals/create/route.ts',
        'src/app/api/profile/update/route.ts',
        'src/app/api/login/route.ts',
        'src/app/api/auth/me/route.ts',
    ]
    
    disabled_count = 0
    for route in api_routes:
        if os.path.exists(route):
            if disable_prisma_in_file(route):
                print(f"✓ Disabled Prisma in {route}")
                disabled_count += 1
            else:
                print(f"- Already disabled or no changes needed in {route}")
        else:
            print(f"! File not found: {route}")
    
    print(f"\nTotal files processed: {disabled_count}")

if __name__ == "__main__":
    print("Disabling Prisma usage in Next.js API routes...")
    find_and_disable_prisma()
    print("\nPrisma has been disabled. The application will now use Django with MySQL only.") 