-- =====================================================
-- Tool Sharing Application Database Objects
-- Views, Stored Procedures, Triggers, and Events
-- =====================================================

USE toolshare_db;

-- =====================================================
-- VIEWS
-- =====================================================

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

-- =====================================================
-- STORED PROCEDURES
-- =====================================================

-- 1. Create Rental Transaction Procedure
DELIMITER //
CREATE PROCEDURE sp_create_rental(
    IN p_owner_id INT,
    IN p_borrower_id INT,
    IN p_tool_id INT,
    IN p_start_date DATE,
    IN p_end_date DATE,
    IN p_total_price DECIMAL(10,2),
    OUT p_rental_id INT,
    OUT p_status VARCHAR(50)
)
BEGIN
    DECLARE v_tool_available BOOLEAN DEFAULT FALSE;
    DECLARE v_owner_exists BOOLEAN DEFAULT FALSE;
    DECLARE v_borrower_exists BOOLEAN DEFAULT FALSE;
    DECLARE v_conflict_exists BOOLEAN DEFAULT FALSE;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_status = 'Error occurred during rental creation';
    END;
    
    START TRANSACTION;
    
    -- Check if owner exists
    SELECT COUNT(*) > 0 INTO v_owner_exists FROM api_user WHERE id = p_owner_id;
    IF NOT v_owner_exists THEN
        SET p_status = 'Owner not found';
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Owner not found';
    END IF;
    
    -- Check if borrower exists
    SELECT COUNT(*) > 0 INTO v_borrower_exists FROM api_user WHERE id = p_borrower_id;
    IF NOT v_borrower_exists THEN
        SET p_status = 'Borrower not found';
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Borrower not found';
    END IF;
    
    -- Check if owner and borrower are different
    IF p_owner_id = p_borrower_id THEN
        SET p_status = 'Owner and borrower cannot be the same';
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Owner and borrower cannot be the same';
    END IF;
    
    -- Check if tool exists and is available
    SELECT available INTO v_tool_available FROM api_tool WHERE id = p_tool_id;
    IF NOT v_tool_available THEN
        SET p_status = 'Tool is not available';
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Tool is not available';
    END IF;
    
    -- Check for date conflicts
    SELECT COUNT(*) > 0 INTO v_conflict_exists 
    FROM api_rentaltransaction 
    WHERE tool_id = p_tool_id 
    AND status = 'active'
    AND (
        (start_date <= p_start_date AND end_date >= p_start_date) OR
        (start_date <= p_end_date AND end_date >= p_end_date) OR
        (start_date >= p_start_date AND end_date <= p_end_date)
    );
    
    IF v_conflict_exists THEN
        SET p_status = 'Date conflict exists';
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Date conflict exists';
    END IF;
    
    -- Create rental transaction
    INSERT INTO api_rentaltransaction (
        owner_id, borrower_id, tool_id, start_date, end_date, 
        total_price, payment_status, status, created_at, updated_at
    ) VALUES (
        p_owner_id, p_borrower_id, p_tool_id, p_start_date, p_end_date,
        p_total_price, 'pending', 'active', NOW(), NOW()
    );
    
    SET p_rental_id = LAST_INSERT_ID();
    
    -- Update tool availability
    UPDATE api_tool SET available = FALSE WHERE id = p_tool_id;
    
    -- Update user statistics
    UPDATE api_user SET total_rentals = total_rentals + 1 WHERE id = p_borrower_id;
    
    COMMIT;
    SET p_status = 'Rental created successfully';
    
END //
DELIMITER ;

-- 2. Complete Rental Procedure
DELIMITER //
CREATE PROCEDURE sp_complete_rental(
    IN p_rental_id INT,
    OUT p_status VARCHAR(50)
)
BEGIN
    DECLARE v_tool_id INT;
    DECLARE v_rental_exists BOOLEAN DEFAULT FALSE;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_status = 'Error occurred during rental completion';
    END;
    
    START TRANSACTION;
    
    -- Check if rental exists and is active
    SELECT COUNT(*) > 0, tool_id INTO v_rental_exists, v_tool_id
    FROM api_rentaltransaction 
    WHERE id = p_rental_id AND status = 'active';
    
    IF NOT v_rental_exists THEN
        SET p_status = 'Rental not found or not active';
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Rental not found or not active';
    END IF;
    
    -- Update rental status
    UPDATE api_rentaltransaction 
    SET status = 'completed', updated_at = NOW()
    WHERE id = p_rental_id;
    
    -- Make tool available again
    UPDATE api_tool SET available = TRUE WHERE id = v_tool_id;
    
    COMMIT;
    SET p_status = 'Rental completed successfully';
    
END //
DELIMITER ;

-- 3. Calculate User Rating Procedure
DELIMITER //
CREATE PROCEDURE sp_calculate_user_rating(
    IN p_user_id INT
)
BEGIN
    DECLARE v_avg_rating DECIMAL(3,2);
    
    -- Calculate average rating from feedback
    SELECT AVG(rating) INTO v_avg_rating
    FROM api_feedback 
    WHERE recipient_id = p_user_id;
    
    -- Update user rating
    UPDATE api_user 
    SET rating = COALESCE(v_avg_rating, 0.00)
    WHERE id = p_user_id;
    
END //
DELIMITER ;

-- 4. Get User Dashboard Data Procedure
DELIMITER //
CREATE PROCEDURE sp_get_user_dashboard(
    IN p_user_id INT
)
BEGIN
    -- Active rentals for the user
    SELECT 
        rt.id, rt.start_date, rt.end_date, rt.total_price,
        t.name as tool_name, t.image_url,
        CASE WHEN rt.borrower_id = p_user_id THEN 'Renting' ELSE 'Lending' END as rental_type
    FROM api_rentaltransaction rt
    JOIN api_tool t ON rt.tool_id = t.id
    WHERE (rt.borrower_id = p_user_id OR rt.owner_id = p_user_id)
    AND rt.status = 'active';
    
    -- User statistics
    SELECT 
        u.username, u.email, u.rating, u.total_rentals,
        COUNT(DISTINCT t.id) as tools_owned,
        COUNT(DISTINCT rt.id) as total_rentals
    FROM api_user u
    LEFT JOIN api_tool t ON u.id = t.owner_id
    LEFT JOIN api_rentaltransaction rt ON u.id = rt.borrower_id
    WHERE u.id = p_user_id
    GROUP BY u.id, u.username, u.email, u.rating, u.total_rentals;
    
END //
DELIMITER ;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- 1. Update Tool Availability Trigger
DELIMITER //
CREATE TRIGGER tr_rental_after_insert
AFTER INSERT ON api_rentaltransaction
FOR EACH ROW
BEGIN
    -- Update tool availability when rental is created
    UPDATE api_tool 
    SET available = FALSE 
    WHERE id = NEW.tool_id;
END //
DELIMITER ;

-- 2. Update Tool Availability on Rental Completion
DELIMITER //
CREATE TRIGGER tr_rental_after_update
AFTER UPDATE ON api_rentaltransaction
FOR EACH ROW
BEGIN
    -- If rental status changed to completed, make tool available
    IF OLD.status != 'completed' AND NEW.status = 'completed' THEN
        UPDATE api_tool 
        SET available = TRUE 
        WHERE id = NEW.tool_id;
    END IF;
    
    -- If rental status changed from completed to active, make tool unavailable
    IF OLD.status = 'completed' AND NEW.status = 'active' THEN
        UPDATE api_tool 
        SET available = FALSE 
        WHERE id = NEW.tool_id;
    END IF;
END //
DELIMITER ;

-- 3. Update User Total Rentals Trigger
DELIMITER //
CREATE TRIGGER tr_rental_after_insert_user_stats
AFTER INSERT ON api_rentaltransaction
FOR EACH ROW
BEGIN
    -- Update borrower's total rentals count
    UPDATE api_user 
    SET total_rentals = total_rentals + 1 
    WHERE id = NEW.borrower_id;
END //
DELIMITER ;

-- 4. Update User Rating Trigger
DELIMITER //
CREATE TRIGGER tr_feedback_after_insert
AFTER INSERT ON api_feedback
FOR EACH ROW
BEGIN
    -- Recalculate user rating when new feedback is added
    CALL sp_calculate_user_rating(NEW.recipient_id);
END //
DELIMITER ;

-- 5. Update User Rating on Feedback Update
DELIMITER //
CREATE TRIGGER tr_feedback_after_update
AFTER UPDATE ON api_feedback
FOR EACH ROW
BEGIN
    -- Recalculate user rating when feedback is updated
    CALL sp_calculate_user_rating(NEW.recipient_id);
END //
DELIMITER ;

-- 6. Audit Trail Trigger
DELIMITER //
CREATE TRIGGER tr_rental_audit
AFTER INSERT ON api_rentaltransaction
FOR EACH ROW
BEGIN
    -- Log rental creation (you can create an audit table if needed)
    INSERT INTO api_audit_log (
        action, table_name, record_id, user_id, action_date, details
    ) VALUES (
        'INSERT', 'api_rentaltransaction', NEW.id, NEW.borrower_id, NOW(),
        CONCAT('Rental created: Tool ID ', NEW.tool_id, ' from ', NEW.start_date, ' to ', NEW.end_date)
    );
END //
DELIMITER ;

-- =====================================================
-- EVENTS
-- =====================================================

-- 1. Daily Rental Status Update Event
DELIMITER //
CREATE EVENT ev_daily_rental_update
ON SCHEDULE EVERY 1 DAY
STARTS CURRENT_TIMESTAMP
DO
BEGIN
    -- Mark overdue rentals
    UPDATE api_rentaltransaction 
    SET status = 'overdue'
    WHERE status = 'active' 
    AND end_date < CURDATE();
    
    -- Update user statistics
    UPDATE api_user u
    SET total_rentals = (
        SELECT COUNT(*) 
        FROM api_rentaltransaction rt 
        WHERE rt.borrower_id = u.id
    );
END //
DELIMITER ;

-- 2. Weekly Revenue Report Event
DELIMITER //
CREATE EVENT ev_weekly_revenue_report
ON SCHEDULE EVERY 1 WEEK
STARTS CURRENT_TIMESTAMP
DO
BEGIN
    -- Create weekly revenue summary (you can insert into a reporting table)
    INSERT INTO api_weekly_reports (
        week_start, total_rentals, total_revenue, active_users, new_users
    )
    SELECT 
        DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY) as week_start,
        COUNT(rt.id) as total_rentals,
        SUM(rt.total_price) as total_revenue,
        COUNT(DISTINCT rt.borrower_id) as active_users,
        COUNT(DISTINCT u.id) as new_users
    FROM api_rentaltransaction rt
    CROSS JOIN api_user u
    WHERE rt.created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
    AND u.created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY);
END //
DELIMITER ;

-- 3. Monthly Cleanup Event
DELIMITER //
CREATE EVENT ev_monthly_cleanup
ON SCHEDULE EVERY 1 MONTH
STARTS CURRENT_TIMESTAMP
DO
BEGIN
    -- Archive old completed rentals (older than 1 year)
    INSERT INTO api_rental_archive
    SELECT * FROM api_rentaltransaction 
    WHERE status = 'completed' 
    AND updated_at < DATE_SUB(NOW(), INTERVAL 1 YEAR);
    
    -- Delete archived rentals from main table
    DELETE FROM api_rentaltransaction 
    WHERE status = 'completed' 
    AND updated_at < DATE_SUB(NOW(), INTERVAL 1 YEAR);
    
    -- Clean up old sessions
    DELETE FROM django_session 
    WHERE expire_date < NOW();
END //
DELIMITER ;

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- 1. Calculate Distance Function
DELIMITER //
CREATE FUNCTION fn_calculate_distance(
    lat1 DECIMAL(9,6), 
    lon1 DECIMAL(9,6), 
    lat2 DECIMAL(9,6), 
    lon2 DECIMAL(9,6)
)
RETURNS DECIMAL(10,2)
DETERMINISTIC
BEGIN
    DECLARE distance DECIMAL(10,2);
    
    SET distance = (
        6371 * acos(
            cos(radians(lat1)) * cos(radians(lat2)) * 
            cos(radians(lon2) - radians(lon1)) + 
            sin(radians(lat1)) * sin(radians(lat2))
        )
    );
    
    RETURN distance;
END //
DELIMITER ;

-- 2. Get Available Tools Near User Function
DELIMITER //
CREATE FUNCTION fn_get_nearby_tools(
    user_lat DECIMAL(9,6), 
    user_lon DECIMAL(9,6), 
    max_distance DECIMAL(10,2)
)
RETURNS TEXT
READS SQL DATA
BEGIN
    DECLARE result TEXT DEFAULT '';
    DECLARE done INT DEFAULT FALSE;
    DECLARE tool_name VARCHAR(255);
    DECLARE tool_distance DECIMAL(10,2);
    
    DECLARE tool_cursor CURSOR FOR
        SELECT 
            t.name,
            fn_calculate_distance(user_lat, user_lon, t.latitude, t.longitude) as distance
        FROM api_tool t
        JOIN api_user u ON t.owner_id = u.id
        WHERE t.available = TRUE
        AND t.latitude IS NOT NULL 
        AND t.longitude IS NOT NULL
        AND fn_calculate_distance(user_lat, user_lon, t.latitude, t.longitude) <= max_distance
        ORDER BY distance;
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    OPEN tool_cursor;
    
    read_loop: LOOP
        FETCH tool_cursor INTO tool_name, tool_distance;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        SET result = CONCAT(result, tool_name, ' (', ROUND(tool_distance, 2), ' km), ');
    END LOOP;
    
    CLOSE tool_cursor;
    
    RETURN TRIM(TRAILING ', ' FROM result);
END //
DELIMITER ;

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Create indexes for better performance
CREATE INDEX idx_rental_status ON api_rentaltransaction(status);
CREATE INDEX idx_rental_dates ON api_rentaltransaction(start_date, end_date);
CREATE INDEX idx_tool_available ON api_tool(available);
CREATE INDEX idx_user_rating ON api_user(rating);
CREATE INDEX idx_feedback_recipient ON api_feedback(recipient_id);
CREATE INDEX idx_rental_owner ON api_rentaltransaction(owner_id);
CREATE INDEX idx_rental_borrower ON api_rentaltransaction(borrower_id);
CREATE INDEX idx_tool_owner ON api_tool(owner_id);

-- =====================================================
-- SAMPLE DATA INSERTS (Optional)
-- =====================================================

-- Insert sample feedback for testing
INSERT INTO api_feedback (sender_id, recipient_id, rating, comment, created_at) VALUES
(2, 1, 5.0, 'Great tool, very helpful!', NOW()),
(3, 1, 4.5, 'Good quality tool', NOW()),
(4, 2, 4.0, 'Tool worked as expected', NOW());

-- =====================================================
-- USAGE EXAMPLES
-- =====================================================

/*
-- Example 1: Create a rental
CALL sp_create_rental(1, 2, 1, '2025-08-01', '2025-08-03', 150.00, @rental_id, @status);
SELECT @rental_id, @status;

-- Example 2: Complete a rental
CALL sp_complete_rental(1, @status);
SELECT @status;

-- Example 3: Get user dashboard data
CALL sp_get_user_dashboard(1);

-- Example 4: View active rentals
SELECT * FROM v_active_rentals;

-- Example 5: Get user statistics
SELECT * FROM v_user_statistics WHERE id = 1;

-- Example 6: Find nearby tools
SELECT fn_get_nearby_tools(30.2672, -97.7431, 10.0) as nearby_tools;
*/ 