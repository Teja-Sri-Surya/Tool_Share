# ToolShare Database Optimizations

This document describes the database optimizations implemented for the ToolShare application, including availability indexing, geographic indexing, and transaction integrity.

## 🚀 Quick Start

### Apply Optimizations

1. **Using Python Script (Recommended):**
   ```bash
   cd "New folder"
   python apply_optimizations.py
   ```

2. **Using Django Management Command:**
   ```bash
   cd "New folder/New folder"
   python manage.py apply_database_optimizations
   ```

3. **Manual SQL Execution:**
   ```bash
   mysql -u root -p toolshare_db < database_optimizations.sql
   ```

## 📊 Optimizations Overview

### 1. Availability Indexing

**Purpose:** Optimize queries for finding available tools in specific date ranges.

**Indexes Created:**
- `idx_rental_transactions_dates` - Basic date range queries
- `idx_rental_transactions_status_dates` - Status-based date queries
- `idx_rental_transactions_tool_dates` - Tool-specific date queries
- `idx_availability_check` - Composite index for availability checking
- `idx_active_rentals` - Filtered index for active rentals only

**Benefits:**
- Faster "available between dates" queries
- Improved performance for calendar-based searches
- Reduced query execution time for availability checks

### 2. Geographic Indexing

**Purpose:** Enable location-based tool searches and proximity filtering.

**New Columns Added:**
- `users.latitude`, `users.longitude` - User location coordinates
- `tools.latitude`, `tools.longitude` - Tool location coordinates
- `location_updated_at` - Timestamp for location updates

**Indexes Created:**
- `idx_users_location` - User location queries
- `idx_tools_location` - Tool location queries
- `idx_tools_location_available` - Available tools near location

**Functions Created:**
- `calculate_distance(lat1, lon1, lat2, lon2)` - Haversine distance calculation

**Benefits:**
- "Find tools near me" functionality
- Distance-based search results
- Geographic proximity filtering

### 3. Transaction Integrity

**Purpose:** Ensure data consistency and prevent booking conflicts.

**Functions Created:**
- `check_booking_conflicts(tool_id, start_date, end_date, exclude_rental_id)` - Conflict detection

**Stored Procedures:**
- `create_rental_with_integrity()` - Atomic rental creation with conflict checking
- `complete_rental_with_refund()` - Atomic rental completion with deposit refund
- `find_tools_near_location()` - Location-based tool search
- `cleanup_expired_rentals()` - Automatic cleanup of overdue rentals

**Triggers:**
- `update_tool_availability_on_rental_change` - Auto-update tool availability
- `prevent_self_rental` - Prevent users from renting their own tools
- `validate_rental_dates` - Validate rental date ranges

**Benefits:**
- Prevents double-booking
- Ensures data consistency
- Automatic tool availability management
- Atomic operations for complex transactions

## 🔧 Usage Examples

### 1. Find Available Tools Near Location

```sql
-- Find tools within 10km of coordinates
CALL find_tools_near_location(40.7128, -74.0060, 10.0, '2024-01-15', '2024-01-17');
```

### 2. Create Rental with Integrity Check

```sql
-- Create rental with automatic conflict checking
CALL create_rental_with_integrity(
    1,           -- tool_id
    2,           -- borrower_id
    1,           -- owner_id
    '2024-01-15', -- start_date
    '2024-01-17', -- end_date
    150.00,      -- total_price
    @rental_id,  -- output rental_id
    @success,    -- output success
    @message     -- output message
);
```

### 3. Complete Rental and Refund Deposit

```sql
-- Complete rental and automatically refund deposit
CALL complete_rental_with_refund(
    1,           -- rental_id
    '2024-01-17', -- return_date
    @success,    -- output success
    @message     -- output message
);
```

### 4. Check for Booking Conflicts

```sql
-- Check if tool is available for specific dates
SELECT check_booking_conflicts(1, '2024-01-15', '2024-01-17') as has_conflicts;
```

### 5. Calculate Distance Between Points

```sql
-- Calculate distance between two coordinates
SELECT calculate_distance(40.7128, -74.0060, 40.7589, -73.9851) as distance_km;
```

## 📈 Performance Views

### 1. Available Tools View

```sql
-- Get all currently available tools
SELECT * FROM available_tools;
```

### 2. Rental Statistics View

```sql
-- Get comprehensive rental statistics
SELECT * FROM rental_statistics;
```

### 3. System Health View

```sql
-- Monitor system health and data quality
SELECT * FROM system_health;
```

## 🛠️ Maintenance

### Automatic Cleanup

The system includes automatic maintenance:

- **Daily Event:** `daily_rental_cleanup` - Automatically processes overdue rentals
- **Index Optimization:** `optimize_indexes()` - Analyzes and optimizes table indexes

### Manual Maintenance

```sql
-- Run cleanup manually
CALL cleanup_expired_rentals();

-- Optimize indexes
CALL optimize_indexes();

-- Check system health
SELECT * FROM system_health;
```

## 🔍 Monitoring

### Check Optimization Status

```sql
-- Verify indexes exist
SELECT 
    TABLE_NAME,
    INDEX_NAME,
    COLUMN_NAME
FROM INFORMATION_SCHEMA.STATISTICS 
WHERE TABLE_SCHEMA = 'toolshare_db'
AND INDEX_NAME LIKE 'idx_%';

-- Check functions
SELECT ROUTINE_NAME 
FROM INFORMATION_SCHEMA.ROUTINES 
WHERE ROUTINE_SCHEMA = 'toolshare_db' 
AND ROUTINE_TYPE = 'FUNCTION';

-- Check procedures
SELECT ROUTINE_NAME 
FROM INFORMATION_SCHEMA.ROUTINES 
WHERE ROUTINE_SCHEMA = 'toolshare_db' 
AND ROUTINE_TYPE = 'PROCEDURE';

-- Check triggers
SELECT TRIGGER_NAME, EVENT_MANIPULATION, EVENT_OBJECT_TABLE
FROM INFORMATION_SCHEMA.TRIGGERS 
WHERE TRIGGER_SCHEMA = 'toolshare_db';
```

## 🚨 Important Notes

### 1. Location Data

- Location columns are added with `NULL` defaults
- Update user and tool locations as needed
- Use `location_updated_at` to track when locations were last updated

### 2. Transaction Safety

- All rental operations use transactions
- Automatic rollback on errors
- Conflict checking prevents double-booking

### 3. Performance Impact

- Indexes improve query performance but add storage overhead
- Monitor index usage and remove unused indexes if needed
- Regular index optimization recommended

### 4. Backup Strategy

- Always backup database before applying optimizations
- Test optimizations in development environment first
- Monitor application performance after applying changes

## 🔄 Integration with Django

### Using Stored Procedures in Django

```python
from django.db import connection

def create_rental_with_integrity(tool_id, borrower_id, owner_id, start_date, end_date, total_price):
    with connection.cursor() as cursor:
        cursor.callproc('create_rental_with_integrity', [
            tool_id, borrower_id, owner_id, start_date, end_date, total_price,
            None, None, None  # Output parameters
        ])
        
        # Get output parameters
        cursor.execute('SELECT @rental_id, @success, @message')
        rental_id, success, message = cursor.fetchone()
        
        return {
            'rental_id': rental_id,
            'success': success,
            'message': message
        }
```

### Using Views in Django

```python
from django.db import connection

def get_available_tools():
    with connection.cursor() as cursor:
        cursor.execute('SELECT * FROM available_tools')
        return cursor.fetchall()

def get_rental_statistics():
    with connection.cursor() as cursor:
        cursor.execute('SELECT * FROM rental_statistics')
        return cursor.fetchone()
```

## 📞 Support

If you encounter issues with the database optimizations:

1. Check the error logs for specific error messages
2. Verify database permissions for creating indexes and procedures
3. Ensure MySQL version supports all features (5.7+ recommended)
4. Test optimizations in a development environment first

## 🎯 Next Steps

After applying optimizations:

1. **Update Application Code:** Integrate stored procedures and views
2. **Add Location Features:** Implement location-based search in frontend
3. **Monitor Performance:** Track query performance improvements
4. **Add Location Data:** Populate location coordinates for users and tools
5. **Test Thoroughly:** Verify all functionality works with optimizations 