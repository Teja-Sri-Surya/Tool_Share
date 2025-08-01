# Database Objects Usage Guide

## Overview
This guide explains how to use the database views, stored procedures, triggers, and events created for the Tool Sharing application.

## 📊 Views

### 1. Active Rentals View (`v_active_rentals`)
Shows all currently active rentals with status information.

```sql
-- View all active rentals
SELECT * FROM v_active_rentals;

-- View overdue rentals
SELECT * FROM v_active_rentals WHERE rental_status = 'Overdue';

-- View rentals due today
SELECT * FROM v_active_rentals WHERE rental_status = 'Due Today';
```

### 2. User Statistics View (`v_user_statistics`)
Provides comprehensive user statistics and metrics.

```sql
-- View all user statistics
SELECT * FROM v_user_statistics;

-- Find top users by revenue
SELECT username, total_rental_revenue 
FROM v_user_statistics 
ORDER BY total_rental_revenue DESC;

-- Find users with most tools
SELECT username, tools_owned 
FROM v_user_statistics 
ORDER BY tools_owned DESC;
```

### 3. Tool Availability View (`v_tool_availability`)
Shows tool availability and rental history.

```sql
-- View all tools and their availability
SELECT * FROM v_tool_availability;

-- Find available tools
SELECT * FROM v_tool_availability WHERE availability_status = 'Available';

-- Find most popular tools
SELECT tool_name, total_rentals 
FROM v_tool_availability 
ORDER BY total_rentals DESC;
```

### 4. Revenue Report View (`v_revenue_report`)
Monthly revenue reports by user.

```sql
-- View all revenue reports
SELECT * FROM v_revenue_report;

-- View current month revenue
SELECT * FROM v_revenue_report 
WHERE month = DATE_FORMAT(CURDATE(), '%Y-%m');

-- Find top earners
SELECT owner_username, SUM(total_revenue) as total_earnings
FROM v_revenue_report 
GROUP BY owner_username 
ORDER BY total_earnings DESC;
```

## 🔧 Stored Procedures

### 1. Create Rental (`sp_create_rental`)
Creates a new rental transaction with validation.

```sql
-- Create a rental
CALL sp_create_rental(1, 2, 1, '2025-08-01', '2025-08-03', 150.00, @rental_id, @status);
SELECT @rental_id, @status;

-- Parameters:
-- 1: owner_id (tool owner)
-- 2: borrower_id (person renting)
-- 3: tool_id (tool being rented)
-- 4: start_date (rental start date)
-- 5: end_date (rental end date)
-- 6: total_price (total rental cost)
-- 7: @rental_id (output: created rental ID)
-- 8: @status (output: success/error message)
```

### 2. Complete Rental (`sp_complete_rental`)
Marks a rental as completed and makes tool available again.

```sql
-- Complete a rental
CALL sp_complete_rental(1, @status);
SELECT @status;

-- Parameters:
-- 1: rental_id (ID of rental to complete)
-- 2: @status (output: success/error message)
```

### 3. Calculate User Rating (`sp_calculate_user_rating`)
Recalculates user rating based on feedback.

```sql
-- Calculate rating for user ID 1
CALL sp_calculate_user_rating(1);
```

### 4. Get User Dashboard (`sp_get_user_dashboard`)
Gets dashboard data for a specific user.

```sql
-- Get dashboard data for user ID 1
CALL sp_get_user_dashboard(1);
```

## ⚡ Triggers

### Automatic Actions
The following triggers run automatically:

1. **Tool Availability**: When a rental is created, the tool becomes unavailable
2. **User Statistics**: When a rental is created, user rental count increases
3. **Rating Updates**: When feedback is added/updated, user rating is recalculated
4. **Audit Trail**: When rentals are created, audit logs are generated

## 🕒 Events

### Scheduled Tasks
The following events run automatically:

1. **Daily Rental Update** (`ev_daily_rental_update`)
   - Runs every day
   - Marks overdue rentals
   - Updates user statistics

2. **Weekly Revenue Report** (`ev_weekly_revenue_report`)
   - Runs every week
   - Creates weekly revenue summaries

3. **Monthly Cleanup** (`ev_monthly_cleanup`)
   - Runs every month
   - Archives old rentals
   - Cleans up old sessions

## 📈 Common Queries

### Business Intelligence Queries

```sql
-- 1. Total revenue this month
SELECT SUM(total_revenue) as monthly_revenue
FROM v_revenue_report 
WHERE month = DATE_FORMAT(CURDATE(), '%Y-%m');

-- 2. Most active users
SELECT username, total_rentals_made
FROM v_user_statistics 
ORDER BY total_rentals_made DESC 
LIMIT 10;

-- 3. Tool utilization rate
SELECT 
    t.name,
    COUNT(rt.id) as total_rentals,
    DATEDIFF(MAX(rt.end_date), MIN(rt.start_date)) as days_available,
    (COUNT(rt.id) / DATEDIFF(MAX(rt.end_date), MIN(rt.start_date))) * 100 as utilization_rate
FROM api_tool t
LEFT JOIN api_rentaltransaction rt ON t.id = rt.tool_id
GROUP BY t.id, t.name;

-- 4. Average rental duration
SELECT 
    AVG(DATEDIFF(end_date, start_date)) as avg_rental_days
FROM api_rentaltransaction 
WHERE status = 'completed';

-- 5. Revenue by tool category
SELECT 
    tc.name as category,
    SUM(rt.total_price) as total_revenue,
    COUNT(rt.id) as total_rentals
FROM api_rentaltransaction rt
JOIN api_tool t ON rt.tool_id = t.id
JOIN api_tool_category tc ON t.category_id = tc.id
WHERE rt.status = 'completed'
GROUP BY tc.id, tc.name;
```

### User Management Queries

```sql
-- 1. Users who haven't logged in recently
SELECT username, email, last_login
FROM api_user 
WHERE last_login < DATE_SUB(NOW(), INTERVAL 30 DAY);

-- 2. Users with pending payments
SELECT 
    u.username,
    rt.id as rental_id,
    rt.total_price,
    rt.payment_status
FROM api_rentaltransaction rt
JOIN api_user u ON rt.borrower_id = u.id
WHERE rt.payment_status = 'pending';

-- 3. Users with low ratings
SELECT username, rating
FROM api_user 
WHERE rating < 3.0
ORDER BY rating ASC;
```

### Tool Management Queries

```sql
-- 1. Tools that haven't been rented
SELECT t.name, t.created_at
FROM api_tool t
LEFT JOIN api_rentaltransaction rt ON t.id = rt.tool_id
WHERE rt.id IS NULL;

-- 2. Tools with maintenance due
SELECT 
    t.name,
    ml.maintenance_date,
    ml.next_maintenance_date
FROM api_tool t
JOIN api_maintenance_log ml ON t.id = ml.tool_id
WHERE ml.next_maintenance_date <= CURDATE();

-- 3. Tools with highest revenue
SELECT 
    t.name,
    SUM(rt.total_price) as total_revenue
FROM api_tool t
JOIN api_rentaltransaction rt ON t.id = rt.tool_id
WHERE rt.status = 'completed'
GROUP BY t.id, t.name
ORDER BY total_revenue DESC;
```

## 🔍 Performance Tips

### Using Indexes
The database includes indexes for better performance:

```sql
-- Check if indexes are being used
EXPLAIN SELECT * FROM api_rentaltransaction WHERE status = 'active';

-- Monitor slow queries
SHOW VARIABLES LIKE 'slow_query_log';
```

### Query Optimization

```sql
-- Use LIMIT for large result sets
SELECT * FROM v_user_statistics LIMIT 100;

-- Use specific columns instead of *
SELECT username, email, rating FROM api_user WHERE rating > 4.0;

-- Use date ranges for time-based queries
SELECT * FROM api_rentaltransaction 
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY);
```

## 🛠️ Maintenance

### Regular Maintenance Tasks

```sql
-- 1. Update user statistics
UPDATE api_user u
SET total_rentals = (
    SELECT COUNT(*) 
    FROM api_rentaltransaction rt 
    WHERE rt.borrower_id = u.id
);

-- 2. Clean up old sessions
DELETE FROM django_session 
WHERE expire_date < NOW();

-- 3. Archive old rentals
INSERT INTO api_rental_archive
SELECT * FROM api_rentaltransaction 
WHERE status = 'completed' 
AND updated_at < DATE_SUB(NOW(), INTERVAL 1 YEAR);

-- 4. Update tool availability
UPDATE api_tool t
SET available = NOT EXISTS (
    SELECT 1 FROM api_rentaltransaction rt
    WHERE rt.tool_id = t.id 
    AND rt.status = 'active'
);
```

## 📊 Reporting Examples

### Daily Report
```sql
-- Generate daily report
SELECT 
    COUNT(DISTINCT rt.id) as new_rentals,
    COUNT(DISTINCT rt.borrower_id) as active_users,
    SUM(rt.total_price) as daily_revenue,
    COUNT(DISTINCT rt.tool_id) as tools_rented
FROM api_rentaltransaction rt
WHERE DATE(rt.created_at) = CURDATE();
```

### Weekly Report
```sql
-- Generate weekly report
SELECT 
    DATE_FORMAT(rt.created_at, '%Y-%m-%d') as date,
    COUNT(rt.id) as rentals,
    SUM(rt.total_price) as revenue
FROM api_rentaltransaction rt
WHERE rt.created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
GROUP BY DATE(rt.created_at)
ORDER BY date;
```

### Monthly Report
```sql
-- Generate monthly report
SELECT 
    DATE_FORMAT(rt.created_at, '%Y-%m') as month,
    COUNT(rt.id) as total_rentals,
    SUM(rt.total_price) as total_revenue,
    COUNT(DISTINCT rt.borrower_id) as unique_users,
    COUNT(DISTINCT rt.tool_id) as unique_tools
FROM api_rentaltransaction rt
WHERE rt.created_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
GROUP BY DATE_FORMAT(rt.created_at, '%Y-%m')
ORDER BY month DESC;
```

## 🚀 Advanced Features

### Distance Calculation
```sql
-- Find tools within 10km of a location
SELECT 
    t.name,
    t.daily_rate,
    fn_calculate_distance(30.2672, -97.7431, t.latitude, t.longitude) as distance_km
FROM api_tool t
WHERE t.available = TRUE
AND fn_calculate_distance(30.2672, -97.7431, t.latitude, t.longitude) <= 10
ORDER BY distance_km;
```

### User Recommendations
```sql
-- Recommend tools based on user history
SELECT 
    t.name,
    t.daily_rate,
    COUNT(rt.id) as rental_count
FROM api_tool t
JOIN api_rentaltransaction rt ON t.id = rt.tool_id
WHERE rt.borrower_id = 1  -- User ID
AND t.available = TRUE
GROUP BY t.id, t.name, t.daily_rate
ORDER BY rental_count DESC;
```

This guide provides a comprehensive overview of how to use all the database objects created for your Tool Sharing application. Use these queries and procedures to build reports, manage users, and optimize your application's performance. 