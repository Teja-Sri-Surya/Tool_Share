-- =====================================================
-- Simple Views for Tool Sharing Application
-- =====================================================

USE toolshare_db;

-- 1. Active Rentals View
CREATE OR REPLACE VIEW v_active_rentals AS
SELECT 
    rt.id as rental_id,
    rt.start_date,
    rt.end_date,
    rt.total_price,
    rt.status,
    rt.payment_status,
    t.id as tool_id,
    t.name as tool_name,
    t.daily_rate,
    t.image_url,
    owner.username as owner_username,
    owner.email as owner_email,
    borrower.username as borrower_username,
    borrower.email as borrower_email,
    DATEDIFF(rt.end_date, rt.start_date) as rental_days,
    CASE 
        WHEN rt.end_date < CURDATE() THEN 'Overdue'
        WHEN rt.end_date = CURDATE() THEN 'Due Today'
        ELSE 'Active'
    END as rental_status
FROM api_rentaltransaction rt
JOIN api_tool t ON rt.tool_id = t.id
JOIN api_user owner ON rt.owner_id = owner.id
JOIN api_user borrower ON rt.borrower_id = borrower.id
WHERE rt.status = 'active';

-- 2. User Statistics View
CREATE OR REPLACE VIEW v_user_statistics AS
SELECT 
    u.id,
    u.username,
    u.email,
    u.first_name,
    u.last_name,
    u.rating,
    u.total_rentals,
    COUNT(DISTINCT t.id) as tools_owned,
    COUNT(DISTINCT rt.id) as total_rentals_made,
    COUNT(DISTINCT CASE WHEN rt.status = 'active' THEN rt.id END) as active_rentals,
    COUNT(DISTINCT CASE WHEN rt.status = 'completed' THEN rt.id END) as completed_rentals,
    AVG(rt.total_price) as avg_rental_price,
    SUM(rt.total_price) as total_rental_revenue
FROM api_user u
LEFT JOIN api_tool t ON u.id = t.owner_id
LEFT JOIN api_rentaltransaction rt ON u.id = rt.borrower_id
GROUP BY u.id, u.username, u.email, u.first_name, u.last_name, u.rating, u.total_rentals;

-- 3. Tool Availability View
CREATE OR REPLACE VIEW v_tool_availability AS
SELECT 
    t.id,
    t.name,
    t.description,
    t.daily_rate,
    t.image_url,
    t.available,
    u.username as owner_username,
    u.email as owner_email,
    COUNT(rt.id) as total_rentals,
    AVG(rt.total_price) as avg_rental_price,
    MAX(rt.end_date) as last_rental_date,
    CASE 
        WHEN t.available = 1 THEN 'Available'
        ELSE 'Not Available'
    END as availability_status
FROM api_tool t
JOIN api_user u ON t.owner_id = u.id
LEFT JOIN api_rentaltransaction rt ON t.id = rt.tool_id
GROUP BY t.id, t.name, t.description, t.daily_rate, t.image_url, t.available, u.username, u.email;

-- 4. Revenue Report View
CREATE OR REPLACE VIEW v_revenue_report AS
SELECT 
    DATE_FORMAT(rt.start_date, '%Y-%m') as month,
    u.username as owner_username,
    COUNT(rt.id) as total_rentals,
    SUM(rt.total_price) as total_revenue,
    AVG(rt.total_price) as avg_rental_price,
    COUNT(DISTINCT rt.tool_id) as unique_tools_rented
FROM api_rentaltransaction rt
JOIN api_user u ON rt.owner_id = u.id
WHERE rt.status = 'completed'
GROUP BY DATE_FORMAT(rt.start_date, '%Y-%m'), u.username
ORDER BY month DESC, total_revenue DESC;

-- 5. Simple User Dashboard View
CREATE OR REPLACE VIEW v_user_dashboard AS
SELECT 
    u.id,
    u.username,
    u.email,
    u.rating,
    u.total_rentals,
    COUNT(DISTINCT t.id) as tools_owned,
    COUNT(DISTINCT rt.id) as total_rentals_made,
    SUM(CASE WHEN rt.status = 'active' THEN 1 ELSE 0 END) as active_rentals,
    SUM(CASE WHEN rt.status = 'completed' THEN 1 ELSE 0 END) as completed_rentals
FROM api_user u
LEFT JOIN api_tool t ON u.id = t.owner_id
LEFT JOIN api_rentaltransaction rt ON u.id = rt.borrower_id
GROUP BY u.id, u.username, u.email, u.rating, u.total_rentals;

-- 6. Tool Performance View
CREATE OR REPLACE VIEW v_tool_performance AS
SELECT 
    t.id,
    t.name,
    t.daily_rate,
    t.available,
    u.username as owner_username,
    COUNT(rt.id) as total_rentals,
    SUM(rt.total_price) as total_revenue,
    AVG(rt.total_price) as avg_rental_price,
    AVG(DATEDIFF(rt.end_date, rt.start_date)) as avg_rental_days,
    MAX(rt.end_date) as last_rental_date
FROM api_tool t
JOIN api_user u ON t.owner_id = u.id
LEFT JOIN api_rentaltransaction rt ON t.id = rt.tool_id AND rt.status = 'completed'
GROUP BY t.id, t.name, t.daily_rate, t.available, u.username; 