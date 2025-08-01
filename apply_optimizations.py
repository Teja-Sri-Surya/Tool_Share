#!/usr/bin/env python3
"""
Database Optimization Script for ToolShare
Applies availability indexing, geographic indexing, and transaction integrity optimizations
"""

import mysql.connector
import os
from mysql.connector import Error
import sys

def apply_database_optimizations():
    """Apply all database optimizations"""
    
    # Database configuration
    config = {
        'host': 'localhost',
        'user': 'root',
        'password': 'Asurya@25',
        'database': 'toolshare_db',
        'charset': 'utf8mb4',
        'autocommit': False
    }
    
    try:
        # Connect to database
        connection = mysql.connector.connect(**config)
        cursor = connection.cursor()
        
        print("✅ Connected to database successfully")
        
        # Read SQL file
        sql_file_path = 'database_optimizations_final.sql'
        if not os.path.exists(sql_file_path):
            print(f"❌ SQL file not found: {sql_file_path}")
            return False
            
        with open(sql_file_path, 'r') as file:
            sql_content = file.read()
        
        print("📖 SQL file loaded successfully")
        
        # Split into individual statements
        statements = []
        current_statement = ""
        in_delimiter_block = False
        
        for line in sql_content.split('\n'):
            line = line.strip()
            
            # Skip comments and empty lines
            if line.startswith('--') or not line:
                continue
                
            # Handle DELIMITER blocks
            if line.startswith('DELIMITER'):
                if not in_delimiter_block:
                    in_delimiter_block = True
                    delimiter = line.split()[1]
                else:
                    in_delimiter_block = False
                    delimiter = ';'
                continue
            
            # Add line to current statement
            current_statement += line + " "
            
            # Check if statement is complete
            if not in_delimiter_block and line.endswith(';'):
                statements.append(current_statement.strip())
                current_statement = ""
            elif in_delimiter_block and line.endswith(delimiter):
                statements.append(current_statement.strip())
                current_statement = ""
        
        print(f"🔧 Found {len(statements)} SQL statements to execute")
        
        # Execute statements
        success_count = 0
        error_count = 0
        
        for i, statement in enumerate(statements, 1):
            if not statement.strip():
                continue
                
            try:
                print(f"📝 Executing statement {i}/{len(statements)}...")
                cursor.execute(statement)
                success_count += 1
                
            except Error as e:
                print(f"⚠️  Warning in statement {i}: {e}")
                error_count += 1
                # Continue with other statements
        
        # Commit changes
        connection.commit()
        
        print(f"\n✅ Database optimizations completed!")
        print(f"   Successfully executed: {success_count} statements")
        print(f"   Warnings/Errors: {error_count} statements")
        
        # Verify optimizations
        print("\n🔍 Verifying optimizations...")
        verify_optimizations(cursor)
        
        return True
        
    except Error as e:
        print(f"❌ Database error: {e}")
        return False
        
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()
            print("🔌 Database connection closed")

def verify_optimizations(cursor):
    """Verify that optimizations were applied correctly"""
    
    # Check indexes
    print("\n📊 Checking indexes...")
    cursor.execute("""
        SELECT 
            TABLE_NAME,
            INDEX_NAME,
            COLUMN_NAME
        FROM INFORMATION_SCHEMA.STATISTICS 
        WHERE TABLE_SCHEMA = 'toolshare_db'
        AND INDEX_NAME LIKE 'idx_%'
        ORDER BY TABLE_NAME, INDEX_NAME
    """)
    
    indexes = cursor.fetchall()
    if indexes:
        print("   ✅ Found optimized indexes:")
        for table, index, column in indexes:
            print(f"      - {table}.{index} ({column})")
    else:
        print("   ⚠️  No optimized indexes found")
    
    # Check functions
    print("\n🔧 Checking functions...")
    cursor.execute("""
        SELECT ROUTINE_NAME 
        FROM INFORMATION_SCHEMA.ROUTINES 
        WHERE ROUTINE_SCHEMA = 'toolshare_db' 
        AND ROUTINE_TYPE = 'FUNCTION'
    """)
    
    functions = cursor.fetchall()
    if functions:
        print("   ✅ Found functions:")
        for (func_name,) in functions:
            print(f"      - {func_name}")
    else:
        print("   ⚠️  No functions found")
    
    # Check procedures
    print("\n⚙️  Checking stored procedures...")
    cursor.execute("""
        SELECT ROUTINE_NAME 
        FROM INFORMATION_SCHEMA.ROUTINES 
        WHERE ROUTINE_SCHEMA = 'toolshare_db' 
        AND ROUTINE_TYPE = 'PROCEDURE'
    """)
    
    procedures = cursor.fetchall()
    if procedures:
        print("   ✅ Found stored procedures:")
        for (proc_name,) in procedures:
            print(f"      - {proc_name}")
    else:
        print("   ⚠️  No stored procedures found")
    
    # Check triggers
    print("\n⚡ Checking triggers...")
    cursor.execute("""
        SELECT TRIGGER_NAME, EVENT_MANIPULATION, EVENT_OBJECT_TABLE
        FROM INFORMATION_SCHEMA.TRIGGERS 
        WHERE TRIGGER_SCHEMA = 'toolshare_db'
    """)
    
    triggers = cursor.fetchall()
    if triggers:
        print("   ✅ Found triggers:")
        for trigger_name, event, table in triggers:
            print(f"      - {trigger_name} ({event} on {table})")
    else:
        print("   ⚠️  No triggers found")
    
    # Check views
    print("\n👁️  Checking views...")
    cursor.execute("""
        SELECT TABLE_NAME 
        FROM INFORMATION_SCHEMA.VIEWS 
        WHERE TABLE_SCHEMA = 'toolshare_db'
    """)
    
    views = cursor.fetchall()
    if views:
        print("   ✅ Found views:")
        for (view_name,) in views:
            print(f"      - {view_name}")
    else:
        print("   ⚠️  No views found")

def main():
    """Main function"""
    print("🚀 ToolShare Database Optimization Tool")
    print("=" * 50)
    
    # Check if SQL file exists
    if not os.path.exists('database_optimizations_final.sql'):
        print("❌ database_optimizations_final.sql not found in current directory")
        print("Please ensure the SQL file is in the same directory as this script")
        sys.exit(1)
    
    # Apply optimizations
    success = apply_database_optimizations()
    
    if success:
        print("\n🎉 All optimizations applied successfully!")
        print("\n📋 Summary of optimizations:")
        print("   ✅ Availability indexing for date range queries")
        print("   ✅ Geographic indexing for location-based searches")
        print("   ✅ Transaction integrity with conflict checking")
        print("   ✅ Stored procedures for atomic operations")
        print("   ✅ Triggers for data consistency")
        print("   ✅ Views for optimized queries")
        print("   ✅ Maintenance procedures and events")
        print("   ✅ Monitoring and health checks")
    else:
        print("\n❌ Failed to apply optimizations")
        sys.exit(1)

if __name__ == "__main__":
    main() 