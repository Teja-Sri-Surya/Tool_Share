-- =====================================================
-- Additional Tables for Tool Sharing Application
-- =====================================================

USE toolshare_db;

-- =====================================================
-- AUDIT LOG TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS api_audit_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    action VARCHAR(50) NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    record_id BIGINT NOT NULL,
    user_id BIGINT,
    action_date DATETIME(6) NOT NULL,
    details TEXT,
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6)
);

-- =====================================================
-- WEEKLY REPORTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS api_weekly_reports (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    week_start DATE NOT NULL,
    total_rentals INT DEFAULT 0,
    total_revenue DECIMAL(10,2) DEFAULT 0.00,
    active_users INT DEFAULT 0,
    new_users INT DEFAULT 0,
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    UNIQUE KEY unique_week (week_start)
);

-- =====================================================
-- RENTAL ARCHIVE TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS api_rental_archive (
    id BIGINT PRIMARY KEY,
    owner_id BIGINT NOT NULL,
    borrower_id BIGINT NOT NULL,
    tool_id BIGINT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    payment_status VARCHAR(20) DEFAULT 'pending',
    status VARCHAR(20) DEFAULT 'active',
    created_at DATETIME(6),
    updated_at DATETIME(6),
    archived_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    INDEX idx_archive_dates (start_date, end_date),
    INDEX idx_archive_status (status)
);

-- =====================================================
-- TOOL CATEGORIES TABLE (if needed)
-- =====================================================

CREATE TABLE IF NOT EXISTS api_tool_category (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(50),
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
);

-- =====================================================
-- NOTIFICATIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS api_notification (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(50) DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    related_rental_id BIGINT,
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    read_at DATETIME(6),
    INDEX idx_user_read (user_id, is_read),
    INDEX idx_created_at (created_at)
);

-- =====================================================
-- PAYMENT TRANSACTIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS api_payment_transaction (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    rental_id BIGINT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'credit_card',
    transaction_id VARCHAR(100) UNIQUE,
    status VARCHAR(20) DEFAULT 'pending',
    payment_date DATETIME(6),
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    INDEX idx_rental_id (rental_id),
    INDEX idx_transaction_id (transaction_id),
    INDEX idx_status (status)
);

-- =====================================================
-- TOOL MAINTENANCE LOG TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS api_maintenance_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tool_id BIGINT NOT NULL,
    maintenance_type VARCHAR(50) NOT NULL,
    description TEXT,
    cost DECIMAL(10,2) DEFAULT 0.00,
    performed_by BIGINT,
    maintenance_date DATE NOT NULL,
    next_maintenance_date DATE,
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    INDEX idx_tool_id (tool_id),
    INDEX idx_maintenance_date (maintenance_date)
);

-- =====================================================
-- USER PREFERENCES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS api_user_preferences (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    email_notifications BOOLEAN DEFAULT TRUE,
    push_notifications BOOLEAN DEFAULT TRUE,
    rental_reminders BOOLEAN DEFAULT TRUE,
    max_rental_distance DECIMAL(10,2) DEFAULT 50.00,
    preferred_payment_method VARCHAR(50) DEFAULT 'credit_card',
    language VARCHAR(10) DEFAULT 'en',
    timezone VARCHAR(50) DEFAULT 'UTC',
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
);

-- =====================================================
-- SAMPLE DATA INSERTS
-- =====================================================

-- Insert sample tool categories
INSERT INTO api_tool_category (name, description, icon) VALUES
('Hand Tools', 'Basic hand tools for DIY projects', 'wrench'),
('Power Tools', 'Electric and battery-powered tools', 'drill'),
('Garden Tools', 'Tools for gardening and landscaping', 'leaf'),
('Cleaning Tools', 'Tools for cleaning and maintenance', 'spray'),
('Automotive Tools', 'Tools for car maintenance and repair', 'car'),
('Construction Tools', 'Heavy-duty construction equipment', 'hammer');

-- Insert sample user preferences
INSERT INTO api_user_preferences (user_id, email_notifications, push_notifications, rental_reminders) VALUES
(1, TRUE, TRUE, TRUE),
(2, TRUE, FALSE, TRUE),
(3, FALSE, TRUE, FALSE),
(4, TRUE, TRUE, TRUE),
(5, TRUE, FALSE, TRUE);

-- Insert sample notifications
INSERT INTO api_notification (user_id, title, message, notification_type) VALUES
(1, 'Rental Confirmed', 'Your rental for "Drill Set" has been confirmed', 'success'),
(2, 'Payment Received', 'Payment of $50.00 has been received for your tool rental', 'info'),
(3, 'Rental Due Soon', 'Your rental for "Garden Shovel" is due tomorrow', 'warning'),
(4, 'New Tool Available', 'A new tool matching your preferences is now available', 'info'),
(5, 'Welcome!', 'Welcome to ToolShare! Start by browsing available tools', 'info');

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Create indexes for the new tables
CREATE INDEX idx_audit_action_date ON api_audit_log(action_date);
CREATE INDEX idx_audit_user_id ON api_audit_log(user_id);
CREATE INDEX idx_notification_user_type ON api_notification(user_id, notification_type);
CREATE INDEX idx_payment_rental_status ON api_payment_transaction(rental_id, status);
CREATE INDEX idx_maintenance_tool_date ON api_maintenance_log(tool_id, maintenance_date);
CREATE INDEX idx_preferences_user ON api_user_preferences(user_id); 