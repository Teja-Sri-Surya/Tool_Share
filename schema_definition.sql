-- ToolShare Database Schema Definition
-- Generated from Django models
-- Database: MySQL

-- User Profile Table (extends Django's AbstractUser)
CREATE TABLE `api_user` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `password` VARCHAR(128) NOT NULL,
    `last_login` DATETIME NULL,
    `is_superuser` BOOLEAN NOT NULL DEFAULT FALSE,
    `username` VARCHAR(150) UNIQUE NOT NULL,
    `first_name` VARCHAR(150) NOT NULL DEFAULT '',
    `last_name` VARCHAR(150) NOT NULL DEFAULT '',
    `email` VARCHAR(254) UNIQUE NOT NULL,
    `is_staff` BOOLEAN NOT NULL DEFAULT FALSE,
    `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
    `date_joined` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `phone_number` VARCHAR(15) NOT NULL DEFAULT '',
    `address` TEXT NOT NULL DEFAULT '',
    `city` VARCHAR(100) NOT NULL DEFAULT '',
    `state` VARCHAR(100) NOT NULL DEFAULT '',
    `zip_code` VARCHAR(10) NOT NULL DEFAULT '',
    `country` VARCHAR(100) NOT NULL DEFAULT 'USA',
    `is_owner` BOOLEAN NOT NULL DEFAULT FALSE,
    `is_borrower` BOOLEAN NOT NULL DEFAULT TRUE,
    `profile_picture` VARCHAR(100) NULL,
    `bio` TEXT NOT NULL DEFAULT '',
    `rating` DECIMAL(3,2) NOT NULL DEFAULT 0.00,
    `total_rentals` INT NOT NULL DEFAULT 0,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `latitude` DECIMAL(10,8) NULL,
    `longitude` DECIMAL(11,8) NULL,
    `location_updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_user_email` (`email`),
    INDEX `idx_user_username` (`username`),
    INDEX `idx_user_location` (`latitude`, `longitude`)
);

-- User Verification Table
CREATE TABLE `api_userverification` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `verification_type` VARCHAR(20) NOT NULL,
    `document_front` VARCHAR(100) NOT NULL,
    `document_back` VARCHAR(100) NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'pending',
    `submitted_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `reviewed_at` DATETIME NULL,
    `reviewed_by_id` INT NULL,
    `notes` TEXT NOT NULL DEFAULT '',
    FOREIGN KEY (`user_id`) REFERENCES `api_user`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`reviewed_by_id`) REFERENCES `api_user`(`id`) ON DELETE SET NULL,
    INDEX `idx_verification_user` (`user_id`),
    INDEX `idx_verification_status` (`status`)
);

-- Tool Table
CREATE TABLE `api_tool` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL,
    `description` TEXT NOT NULL,
    `image` VARCHAR(100) NULL,
    `pricing_type` VARCHAR(20) NOT NULL DEFAULT 'daily',
    `price_per_hour` DECIMAL(6,2) NULL,
    `price_per_day` DECIMAL(6,2) NULL,
    `price_per_week` DECIMAL(6,2) NULL,
    `price_per_month` DECIMAL(6,2) NULL,
    `replacement_value` DECIMAL(10,2) NULL,
    `available` BOOLEAN NOT NULL DEFAULT TRUE,
    `owner_id` INT NOT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `pickup_address` TEXT NOT NULL DEFAULT '',
    `pickup_city` VARCHAR(100) NOT NULL DEFAULT '',
    `pickup_state` VARCHAR(100) NOT NULL DEFAULT '',
    `pickup_zip_code` VARCHAR(10) NOT NULL DEFAULT '',
    `pickup_latitude` DECIMAL(9,6) NULL,
    `pickup_longitude` DECIMAL(9,6) NULL,
    `delivery_available` BOOLEAN NOT NULL DEFAULT FALSE,
    `delivery_radius` INT NOT NULL DEFAULT 0,
    `delivery_fee` DECIMAL(6,2) NOT NULL DEFAULT 0.00,
    `latitude` DECIMAL(10,8) NULL,
    `longitude` DECIMAL(11,8) NULL,
    `location_updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`owner_id`) REFERENCES `api_user`(`id`) ON DELETE CASCADE,
    INDEX `idx_tool_owner` (`owner_id`),
    INDEX `idx_tool_available` (`available`),
    INDEX `idx_tool_location` (`latitude`, `longitude`),
    INDEX `idx_tool_pricing` (`pricing_type`)
);

-- Rental Transaction Table
CREATE TABLE `api_rentaltransaction` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `tool_id` INT NOT NULL,
    `borrower_id` INT NULL,
    `owner_id` INT NULL,
    `start_date` DATE NOT NULL,
    `end_date` DATE NOT NULL,
    `start_time` TIME NULL,
    `end_time` TIME NULL,
    `total_price` DECIMAL(8,2) NOT NULL DEFAULT 0.00,
    `payment_status` VARCHAR(20) NOT NULL DEFAULT 'pending',
    `payment_reference` VARCHAR(100) NOT NULL DEFAULT '',
    `status` VARCHAR(20) NOT NULL DEFAULT 'pending',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`tool_id`) REFERENCES `api_tool`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`borrower_id`) REFERENCES `api_user`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`owner_id`) REFERENCES `api_user`(`id`) ON DELETE SET NULL,
    INDEX `idx_rental_tool` (`tool_id`),
    INDEX `idx_rental_borrower` (`borrower_id`),
    INDEX `idx_rental_owner` (`owner_id`),
    INDEX `idx_rental_status` (`status`),
    INDEX `idx_rental_dates` (`start_date`, `end_date`)
);

-- Deposit Table
CREATE TABLE `api_deposit` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `rental_transaction_id` INT NOT NULL,
    `amount` DECIMAL(8,2) NOT NULL DEFAULT 50.00,
    `status` VARCHAR(20) NOT NULL DEFAULT 'pending',
    `payment_date` DATETIME NULL,
    `payment_reference` VARCHAR(100) NOT NULL DEFAULT '',
    `return_date` DATETIME NULL,
    `return_reference` VARCHAR(100) NOT NULL DEFAULT '',
    `notes` TEXT NOT NULL DEFAULT '',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`rental_transaction_id`) REFERENCES `api_rentaltransaction`(`id`) ON DELETE CASCADE,
    INDEX `idx_deposit_rental` (`rental_transaction_id`),
    INDEX `idx_deposit_status` (`status`)
);

-- Deposit Transaction Table
CREATE TABLE `api_deposittransaction` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `deposit_id` INT NOT NULL,
    `transaction_type` VARCHAR(20) NOT NULL,
    `amount` DECIMAL(8,2) NOT NULL,
    `reference` VARCHAR(100) NOT NULL DEFAULT '',
    `description` TEXT NOT NULL DEFAULT '',
    `processed_by` VARCHAR(100) NOT NULL DEFAULT '',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`deposit_id`) REFERENCES `api_deposit`(`id`) ON DELETE CASCADE,
    INDEX `idx_deposit_transaction_deposit` (`deposit_id`),
    INDEX `idx_deposit_transaction_type` (`transaction_type`)
);

-- Borrow Request Table
CREATE TABLE `api_borrowrequest` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `tool_id` INT NOT NULL,
    `borrower_id` INT NULL,
    `owner_id` INT NULL,
    `start_date` DATE NOT NULL,
    `end_date` DATE NOT NULL,
    `start_time` TIME NULL,
    `end_time` TIME NULL,
    `message` TEXT NOT NULL DEFAULT '',
    `status` VARCHAR(20) NOT NULL DEFAULT 'pending',
    `owner_response` TEXT NOT NULL DEFAULT '',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `expires_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`tool_id`) REFERENCES `api_tool`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`borrower_id`) REFERENCES `api_user`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`owner_id`) REFERENCES `api_user`(`id`) ON DELETE SET NULL,
    INDEX `idx_borrow_request_tool` (`tool_id`),
    INDEX `idx_borrow_request_borrower` (`borrower_id`),
    INDEX `idx_borrow_request_owner` (`owner_id`),
    INDEX `idx_borrow_request_status` (`status`),
    INDEX `idx_borrow_request_dates` (`start_date`, `end_date`),
    INDEX `idx_borrow_request_expires` (`expires_at`)
);

-- Availability Table
CREATE TABLE `api_availability` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `tool_id` INT NOT NULL,
    `start_date` DATE NOT NULL,
    `end_date` DATE NOT NULL,
    `is_booked` BOOLEAN NOT NULL DEFAULT FALSE,
    `notes` TEXT NOT NULL DEFAULT '',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`tool_id`) REFERENCES `api_tool`(`id`) ON DELETE CASCADE,
    INDEX `idx_availability_tool` (`tool_id`),
    INDEX `idx_availability_dates` (`start_date`, `end_date`),
    INDEX `idx_availability_booked` (`is_booked`)
);

-- Flexible Availability Table
CREATE TABLE `api_flexibleavailability` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `tool_id` INT NOT NULL,
    `start_date` DATE NULL,
    `end_date` DATE NULL,
    `is_available` BOOLEAN NOT NULL DEFAULT TRUE,
    `notes` TEXT NOT NULL DEFAULT '',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`tool_id`) REFERENCES `api_tool`(`id`) ON DELETE CASCADE,
    INDEX `idx_flexible_availability_tool` (`tool_id`),
    INDEX `idx_flexible_availability_dates` (`start_date`, `end_date`)
);

-- Recurring Availability Table
CREATE TABLE `api_recurringavailability` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `tool_id` INT NOT NULL,
    `pattern_type` VARCHAR(20) NOT NULL DEFAULT 'weekly',
    `start_date` DATE NOT NULL,
    `end_date` DATE NULL,
    `days_of_week` JSON NOT NULL DEFAULT '[]',
    `start_time` TIME NOT NULL,
    `end_time` TIME NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`tool_id`) REFERENCES `api_tool`(`id`) ON DELETE CASCADE,
    INDEX `idx_recurring_availability_tool` (`tool_id`),
    INDEX `idx_recurring_availability_active` (`is_active`)
);

-- Hourly Availability Table
CREATE TABLE `api_hourlyavailability` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `tool_id` INT NOT NULL,
    `date` DATE NOT NULL,
    `hour` INT NOT NULL,
    `is_available` BOOLEAN NOT NULL DEFAULT TRUE,
    `is_booked` BOOLEAN NOT NULL DEFAULT FALSE,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`tool_id`) REFERENCES `api_tool`(`id`) ON DELETE CASCADE,
    UNIQUE KEY `unique_tool_date_hour` (`tool_id`, `date`, `hour`),
    INDEX `idx_hourly_availability_tool` (`tool_id`),
    INDEX `idx_hourly_availability_date` (`date`),
    INDEX `idx_hourly_availability_booked` (`is_booked`)
);

-- Dispute Table
CREATE TABLE `api_dispute` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `rental_transaction_id` INT NOT NULL,
    `initiator_id` INT NOT NULL,
    `dispute_type` VARCHAR(20) NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `description` TEXT NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'open',
    `evidence_files` JSON NOT NULL DEFAULT '[]',
    `resolution` TEXT NOT NULL DEFAULT '',
    `resolved_by_id` INT NULL,
    `resolved_at` DATETIME NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`rental_transaction_id`) REFERENCES `api_rentaltransaction`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`initiator_id`) REFERENCES `api_user`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`resolved_by_id`) REFERENCES `api_user`(`id`) ON DELETE SET NULL,
    INDEX `idx_dispute_rental` (`rental_transaction_id`),
    INDEX `idx_dispute_initiator` (`initiator_id`),
    INDEX `idx_dispute_status` (`status`),
    INDEX `idx_dispute_type` (`dispute_type`)
);

-- Dispute Message Table
CREATE TABLE `api_disputemessage` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `dispute_id` INT NOT NULL,
    `sender_id` INT NOT NULL,
    `message` TEXT NOT NULL,
    `attachments` JSON NOT NULL DEFAULT '[]',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`dispute_id`) REFERENCES `api_dispute`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`sender_id`) REFERENCES `api_user`(`id`) ON DELETE CASCADE,
    INDEX `idx_dispute_message_dispute` (`dispute_id`),
    INDEX `idx_dispute_message_sender` (`sender_id`)
);

-- Feedback Table
CREATE TABLE `api_feedback` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `rental_transaction_id` INT NULL,
    `reviewer_id` INT NULL,
    `reviewed_user_id` INT NULL,
    `rating` INT NOT NULL DEFAULT 3,
    `comment` TEXT NOT NULL DEFAULT '',
    `is_public` BOOLEAN NOT NULL DEFAULT TRUE,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`rental_transaction_id`) REFERENCES `api_rentaltransaction`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`reviewer_id`) REFERENCES `api_user`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`reviewed_user_id`) REFERENCES `api_user`(`id`) ON DELETE SET NULL,
    INDEX `idx_feedback_rental` (`rental_transaction_id`),
    INDEX `idx_feedback_reviewer` (`reviewer_id`),
    INDEX `idx_feedback_reviewed` (`reviewed_user_id`),
    INDEX `idx_feedback_rating` (`rating`)
);

-- User Review Table
CREATE TABLE `api_userreview` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `reviewer_id` INT NULL,
    `reviewed_user_id` INT NULL,
    `rating` INT NOT NULL DEFAULT 3,
    `comment` TEXT NOT NULL DEFAULT '',
    `is_public` BOOLEAN NOT NULL DEFAULT TRUE,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`reviewer_id`) REFERENCES `api_user`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`reviewed_user_id`) REFERENCES `api_user`(`id`) ON DELETE SET NULL,
    UNIQUE KEY `unique_user_review` (`reviewer_id`, `reviewed_user_id`),
    INDEX `idx_user_review_reviewer` (`reviewer_id`),
    INDEX `idx_user_review_reviewed` (`reviewed_user_id`),
    INDEX `idx_user_review_rating` (`rating`)
);

-- Message Table
CREATE TABLE `api_message` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `rental_transaction_id` INT NOT NULL,
    `sender_id` INT NULL,
    `message` TEXT NOT NULL,
    `is_read` BOOLEAN NOT NULL DEFAULT FALSE,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`rental_transaction_id`) REFERENCES `api_rentaltransaction`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`sender_id`) REFERENCES `api_user`(`id`) ON DELETE SET NULL,
    INDEX `idx_message_rental` (`rental_transaction_id`),
    INDEX `idx_message_sender` (`sender_id`),
    INDEX `idx_message_read` (`is_read`)
);

-- Application Review Table
CREATE TABLE `api_applicationreview` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `reviewer_id` INT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'pending',
    `notes` TEXT NOT NULL DEFAULT '',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `api_user`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`reviewer_id`) REFERENCES `api_user`(`id`) ON DELETE SET NULL,
    INDEX `idx_application_review_user` (`user_id`),
    INDEX `idx_application_review_reviewer` (`reviewer_id`),
    INDEX `idx_application_review_status` (`status`)
);

-- Django Admin Tables (if using Django admin)
CREATE TABLE `django_admin_log` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `action_time` DATETIME NOT NULL,
    `object_id` TEXT NULL,
    `object_repr` VARCHAR(200) NOT NULL,
    `action_flag` SMALLINT UNSIGNED NOT NULL,
    `change_message` TEXT NOT NULL,
    `content_type_id` INT NULL,
    `user_id` INT NOT NULL,
    INDEX `django_admin_log_content_type_id_c4bce8eb_fk_django_co` (`content_type_id`),
    INDEX `django_admin_log_user_id_c564eba6_fk_auth_user_id` (`user_id`),
    INDEX `django_admin_log_action_time_53645c4c` (`action_time`)
);

CREATE TABLE `django_content_type` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `app_label` VARCHAR(100) NOT NULL,
    `model` VARCHAR(100) NOT NULL,
    UNIQUE KEY `django_content_type_app_label_model_76bd3d3b_uniq` (`app_label`, `model`)
);

CREATE TABLE `django_migrations` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `app` VARCHAR(255) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `applied` DATETIME NOT NULL
);

CREATE TABLE `django_session` (
    `session_key` VARCHAR(40) NOT NULL PRIMARY KEY,
    `session_data` LONGTEXT NOT NULL,
    `expire_date` DATETIME NOT NULL,
    INDEX `django_session_expire_date_a5c62663` (`expire_date`)
);

-- Insert default content types
INSERT INTO `django_content_type` (`app_label`, `model`) VALUES
('admin', 'logentry'),
('api', 'userprofile'),
('api', 'tool'),
('api', 'rentaltransaction'),
('api', 'deposit'),
('api', 'borrowrequest'),
('api', 'availability'),
('api', 'feedback'),
('api', 'message'),
('api', 'dispute'),
('api', 'userverification'),
('api', 'userreview'),
('api', 'applicationreview'),
('auth', 'permission'),
('auth', 'group'),
('contenttypes', 'contenttype'),
('sessions', 'session');

-- Create indexes for better performance
CREATE INDEX `idx_tool_search` ON `api_tool` (`available`, `latitude`, `longitude`);
CREATE INDEX `idx_rental_conflict_check` ON `api_rentaltransaction` (`tool_id`, `status`, `start_date`, `end_date`);
CREATE INDEX `idx_borrow_request_conflict_check` ON `api_borrowrequest` (`tool_id`, `status`, `start_date`, `end_date`);
CREATE INDEX `idx_user_rating` ON `api_user` (`rating` DESC);
CREATE INDEX `idx_tool_created` ON `api_tool` (`created_at` DESC);
CREATE INDEX `idx_rental_created` ON `api_rentaltransaction` (`created_at` DESC); 