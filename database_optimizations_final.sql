-- =====================================================
-- ToolShare Database Optimizations (Final)
-- Availability Indexing, Geographic Indexing, and Transaction Integrity
-- =====================================================

-- =====================================================
-- 1. AVAILABILITY INDEXING
-- =====================================================

-- Create indexes for efficient date range queries
CREATE INDEX idx_rental_transactions_dates ON api_rentaltransaction (start_date, end_date);
CREATE INDEX idx_rental_transactions_status_dates ON api_rentaltransaction (status, start_date, end_date);
CREATE INDEX idx_rental_transactions_tool_dates ON api_rentaltransaction (tool_id, start_date, end_date);

-- Create composite index for availability checking
CREATE INDEX idx_availability_check ON api_rentaltransaction (tool_id, status, start_date, end_date);

-- Index for active rentals
CREATE INDEX idx_active_rentals ON api_rentaltransaction (tool_id, status);

-- =====================================================
-- 2. GEOGRAPHIC INDEXING
-- =====================================================

-- Location columns already exist in api_tool table
-- Create spatial indexes for geographic queries
CREATE INDEX idx_tools_location ON api_tool (latitude, longitude);

-- Create composite index for location-based tool search
CREATE INDEX idx_tools_location_available ON api_tool (latitude, longitude, available);

-- =====================================================
-- 3. TRANSACTION INTEGRITY
-- =====================================================

-- Create a function to check for booking conflicts
DELIMITER //
CREATE FUNCTION check_booking_conflicts(
    p_tool_id INT,
    p_start_date DATE,
    p_end_date DATE,
    p_exclude_rental_id INT
) RETURNS BOOLEAN
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE conflict_count INT DEFAULT 0;
    
    -- Check for overlapping bookings
    SELECT COUNT(*) INTO conflict_count
    FROM api_rentaltransaction
    WHERE tool_id = p_tool_id
      AND status IN ('active', 'confirmed', 'pending')
      AND (
          (start_date <= p_start_date AND end_date >= p_start_date) OR
          (start_date <= p_end_date AND end_date >= p_end_date) OR
          (start_date >= p_start_date AND end_date <= p_end_date)
      )
      AND (p_exclude_rental_id IS NULL OR id != p_exclude_rental_id);
    
    RETURN conflict_count > 0;
END //
DELIMITER ;

-- Create a function to calculate distance between two points
DELIMITER //
CREATE FUNCTION calculate_distance(
    lat1 DECIMAL(10, 8),
    lon1 DECIMAL(11, 8),
    lat2 DECIMAL(10, 8),
    lon2 DECIMAL(11, 8)
) RETURNS DECIMAL(10, 2)
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE distance DECIMAL(10, 2);
    
    -- Haversine formula for distance calculation
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

-- =====================================================
-- 4. AVAILABILITY VIEWS
-- =====================================================

-- Create view for available tools
CREATE OR REPLACE VIEW available_tools AS
SELECT 
    t.id,
    t.name,
    t.description,
    t.price_per_day as daily_rate,
    t.image as image_url,
    t.available,
    t.owner_id,
    t.latitude,
    t.longitude,
    u.username as owner_username
FROM api_tool t
JOIN api_user u ON t.owner_id = u.id
WHERE t.available = TRUE
  AND t.id NOT IN (
    SELECT DISTINCT tool_id 
    FROM api_rentaltransaction 
    WHERE status IN ('active', 'confirmed', 'pending')
  );

-- =====================================================
-- 5. STORED PROCEDURES FOR TRANSACTION INTEGRITY
-- =====================================================

-- Procedure to create rental with conflict checking
DELIMITER //
CREATE PROCEDURE create_rental_with_integrity(
    IN p_tool_id INT,
    IN p_borrower_id INT,
    IN p_owner_id INT,
    IN p_start_date DATE,
    IN p_end_date DATE,
    IN p_total_price DECIMAL(10, 2),
    OUT p_rental_id INT,
    OUT p_success BOOLEAN,
    OUT p_message VARCHAR(255)
)
MODIFIES SQL DATA
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_success = FALSE;
        SET p_message = 'Database error occurred';
    END;
    
    START TRANSACTION;
    
    -- Check if tool exists and is available
    IF NOT EXISTS (SELECT 1 FROM api_tool WHERE id = p_tool_id AND available = TRUE) THEN
        SET p_success = FALSE;
        SET p_message = 'Tool is not available for rental';
        ROLLBACK;
    ELSE
        -- Check for booking conflicts
        IF check_booking_conflicts(p_tool_id, p_start_date, p_end_date, NULL) THEN
            SET p_success = FALSE;
            SET p_message = 'Tool is not available for the selected dates';
            ROLLBACK;
        ELSE
            -- Create rental transaction
            INSERT INTO api_rentaltransaction (
                tool_id, borrower_id, owner_id, start_date, end_date, 
                total_price, status, payment_status, created_at
            ) VALUES (
                p_tool_id, p_borrower_id, p_owner_id, p_start_date, p_end_date,
                p_total_price, 'active', 'pending', NOW()
            );
            
            SET p_rental_id = LAST_INSERT_ID();
            
            -- Create deposit
            INSERT INTO api_deposit (
                rental_transaction_id, amount, status, created_at
            ) VALUES (
                p_rental_id, 50.00, 'paid', NOW()
            );
            
            -- Update tool availability
            UPDATE api_tool SET available = FALSE WHERE id = p_tool_id;
            
            SET p_success = TRUE;
            SET p_message = 'Rental created successfully';
            COMMIT;
        END IF;
    END IF;
END //
DELIMITER ;

-- Procedure to complete rental and return deposit
DELIMITER //
CREATE PROCEDURE complete_rental_with_refund(
    IN p_rental_id INT,
    IN p_return_date DATE,
    OUT p_success BOOLEAN,
    OUT p_message VARCHAR(255)
)
MODIFIES SQL DATA
BEGIN
    DECLARE v_tool_id INT;
    DECLARE v_deposit_id INT;
    DECLARE v_deposit_amount DECIMAL(10, 2);
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_success = FALSE;
        SET p_message = 'Database error occurred';
    END;
    
    START TRANSACTION;
    
    -- Get rental details
    SELECT tool_id INTO v_tool_id 
    FROM api_rentaltransaction 
    WHERE id = p_rental_id AND status = 'active';
    
    IF v_tool_id IS NULL THEN
        SET p_success = FALSE;
        SET p_message = 'Rental not found or not active';
        ROLLBACK;
    ELSE
        -- Get deposit details
        SELECT id, amount INTO v_deposit_id, v_deposit_amount
        FROM api_deposit 
        WHERE rental_transaction_id = p_rental_id AND status = 'paid';
        
        -- Update rental status
        UPDATE api_rentaltransaction 
        SET status = 'completed'
        WHERE id = p_rental_id;
        
        -- Refund deposit
        UPDATE api_deposit 
        SET status = 'refunded', return_date = p_return_date
        WHERE id = v_deposit_id;
        
        -- Make tool available again
        UPDATE api_tool 
        SET available = TRUE
        WHERE id = v_tool_id;
        
        SET p_success = TRUE;
        SET p_message = 'Rental completed and deposit refunded';
        COMMIT;
    END IF;
END //
DELIMITER ;

-- =====================================================
-- 6. TRIGGERS FOR DATA INTEGRITY
-- =====================================================

-- Trigger to update tool availability when rental status changes
DELIMITER //
CREATE TRIGGER update_tool_availability_on_rental_change
AFTER UPDATE ON api_rentaltransaction
FOR EACH ROW
BEGIN
    IF OLD.status != NEW.status THEN
        IF NEW.status IN ('active', 'confirmed', 'pending') THEN
            -- Make tool unavailable
            UPDATE api_tool SET available = FALSE WHERE id = NEW.tool_id;
        ELSEIF NEW.status IN ('completed', 'cancelled', 'forfeited') THEN
            -- Make tool available
            UPDATE api_tool SET available = TRUE WHERE id = NEW.tool_id;
        END IF;
    END IF;
END //
DELIMITER ;

-- Trigger to prevent self-rental
DELIMITER //
CREATE TRIGGER prevent_self_rental
BEFORE INSERT ON api_rentaltransaction
FOR EACH ROW
BEGIN
    IF NEW.owner_id = NEW.borrower_id THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Users cannot rent their own tools';
    END IF;
END //
DELIMITER ;

-- Trigger to validate rental dates
DELIMITER //
CREATE TRIGGER validate_rental_dates
BEFORE INSERT ON api_rentaltransaction
FOR EACH ROW
BEGIN
    IF NEW.start_date >= NEW.end_date THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Start date must be before end date';
    END IF;
    
    IF NEW.start_date < CURDATE() THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Start date cannot be in the past';
    END IF;
END //
DELIMITER ;

-- =====================================================
-- 7. PERFORMANCE OPTIMIZATION QUERIES
-- =====================================================

-- Query to find available tools near a location
DELIMITER //
CREATE PROCEDURE find_tools_near_location(
    IN p_latitude DECIMAL(10, 8),
    IN p_longitude DECIMAL(11, 8),
    IN p_radius_km DECIMAL(10, 2),
    IN p_start_date DATE,
    IN p_end_date DATE
)
READS SQL DATA
BEGIN
    SELECT 
        t.id,
        t.name,
        t.description,
        t.price_per_day as daily_rate,
        t.image as image_url,
        t.latitude,
        t.longitude,
        u.username as owner_username,
        calculate_distance(p_latitude, p_longitude, t.latitude, t.longitude) as distance_km
    FROM api_tool t
    JOIN api_user u ON t.owner_id = u.id
    WHERE t.available = TRUE
      AND t.latitude IS NOT NULL
      AND t.longitude IS NOT NULL
      AND calculate_distance(p_latitude, p_longitude, t.latitude, t.longitude) <= p_radius_km
      AND t.id NOT IN (
        SELECT DISTINCT tool_id 
        FROM api_rentaltransaction 
        WHERE status IN ('active', 'confirmed', 'pending')
          AND (
              (start_date <= p_start_date AND end_date >= p_start_date) OR
              (start_date <= p_end_date AND end_date >= p_end_date) OR
              (start_date >= p_start_date AND end_date <= p_end_date)
          )
      )
    ORDER BY distance_km;
END //
DELIMITER ;

-- Query to get rental statistics
CREATE OR REPLACE VIEW rental_statistics AS
SELECT 
    COUNT(*) as total_rentals,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_rentals,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_rentals,
    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_rentals,
    SUM(total_price) as total_revenue,
    AVG(total_price) as avg_rental_price,
    COUNT(DISTINCT tool_id) as unique_tools_rented,
    COUNT(DISTINCT borrower_id) as unique_borrowers
FROM api_rentaltransaction;

-- =====================================================
-- 8. MAINTENANCE PROCEDURES
-- =====================================================

-- Procedure to clean up expired rentals
DELIMITER //
CREATE PROCEDURE cleanup_expired_rentals()
MODIFIES SQL DATA
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
    END;
    
    START TRANSACTION;
    
    -- Update overdue rentals to forfeited status
    UPDATE api_rentaltransaction 
    SET status = 'forfeited'
    WHERE status = 'active' AND end_date < CURDATE();
    
    -- Forfeit deposits for overdue rentals
    UPDATE api_deposit d
    JOIN api_rentaltransaction rt ON d.rental_transaction_id = rt.id
    SET d.status = 'forfeited'
    WHERE rt.status = 'forfeited' AND d.status = 'paid';
    
    COMMIT;
END //
DELIMITER ;

-- Event to run cleanup daily
CREATE EVENT IF NOT EXISTS daily_rental_cleanup
ON SCHEDULE EVERY 1 DAY
STARTS CURRENT_TIMESTAMP
DO CALL cleanup_expired_rentals();

-- =====================================================
-- 9. INDEX MAINTENANCE
-- =====================================================

-- Procedure to analyze and optimize indexes
DELIMITER //
CREATE PROCEDURE optimize_indexes()
MODIFIES SQL DATA
BEGIN
    -- Analyze tables for better query optimization
    ANALYZE TABLE api_user, api_tool, api_rentaltransaction, api_deposit;
    
    -- Optimize tables
    OPTIMIZE TABLE api_user, api_tool, api_rentaltransaction, api_deposit;
END //
DELIMITER ;

-- =====================================================
-- 10. MONITORING VIEWS
-- =====================================================

-- View for monitoring system health
CREATE OR REPLACE VIEW system_health AS
SELECT 
    'api_rentaltransaction' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_records,
    COUNT(CASE WHEN created_at < DATE_SUB(NOW(), INTERVAL 1 DAY) THEN 1 END) as stale_records
FROM api_rentaltransaction
UNION ALL
SELECT 
    'api_tool' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN available = TRUE THEN 1 END) as active_records,
    COUNT(CASE WHEN created_at < DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as stale_records
FROM api_tool
UNION ALL
SELECT 
    'api_deposit' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN status = 'paid' THEN 1 END) as active_records,
    COUNT(CASE WHEN created_at < DATE_SUB(NOW(), INTERVAL 1 DAY) THEN 1 END) as stale_records
FROM api_deposit;

-- =====================================================
-- END OF OPTIMIZATIONS
-- =====================================================

-- Show summary of optimizations
SELECT 'Database optimizations completed successfully!' as status;
SELECT 'Indexes created for availability and geographic queries' as optimization;
SELECT 'Transaction integrity procedures implemented' as integrity;
SELECT 'Triggers added for data consistency' as triggers;
SELECT 'Maintenance procedures created' as maintenance; 