-- =============================================================================
-- DATABASE SCHEMA: SURVEYORS INSTITUTE OF MALAWI (SIM)
-- DATABASE TARGET: MySQL 8.0+
-- DESCRIPTION: Highly comprehensive, normalized relational database schema for
--              SIM member registrations, corporate surveying firm listings,
--              professional licensing types, practicing license issuance,
--              invoice billing ledger, bank transaction payments, CPD credits auditing,
--              event registrations, web content CMS, and secretariat operations.
-- =============================================================================

CREATE DATABASE IF NOT EXISTS `surveyors_institute_malawi` 
  DEFAULT CHARACTER SET utf8mb4 
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE `surveyors_institute_malawi`;

-- Disable foreign key checks temporarily to allow clean table recreation
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `audit_logs`;
DROP TABLE IF EXISTS `payments`;
DROP TABLE IF EXISTS `invoices`;
DROP TABLE IF EXISTS `licences`;
DROP TABLE IF EXISTS `cpd_attendance`;
DROP TABLE IF EXISTS `event_registrations`;
DROP TABLE IF EXISTS `surveying_firms`;
DROP TABLE IF EXISTS `member_profiles`;
DROP TABLE IF EXISTS `licensing_types`;
DROP TABLE IF EXISTS `user_roles`;
DROP TABLE IF EXISTS `role_permissions`;
DROP TABLE IF EXISTS `permissions`;
DROP TABLE IF EXISTS `roles`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `events`;
DROP TABLE IF EXISTS `faq_items`;
DROP TABLE IF EXISTS `news_items`;
DROP TABLE IF EXISTS `publication_items`;

SET FOREIGN_KEY_CHECKS = 1;


-- =============================================================================
-- 1. USERS & SYSTEM AUTHENTICATION
-- =============================================================================

CREATE TABLE `users` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL COMMENT 'BCrypt hash of the user secret credentials',
  `role` ENUM('Admin', 'Member') NOT NULL DEFAULT 'Member',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
COMMENT='Central authentication accounts for SIM member and administration portals';


-- =============================================================================
-- 1B. ROLE-BASED ACCESS CONTROL (RBAC) SCHEMA
-- =============================================================================

CREATE TABLE `roles` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(50) NOT NULL UNIQUE COMMENT 'Human readable role name (e.g. Super Administrator)',
  `slug` VARCHAR(50) NOT NULL UNIQUE COMMENT 'Unique identifier slug for backend authorization checks (e.g. super_admin)',
  `description` VARCHAR(255) NULL COMMENT 'Brief explanation of what responsibilities this role holds',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_roles_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Pre-defined user roles governing system access groups';

CREATE TABLE `permissions` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL UNIQUE COMMENT 'Descriptive permission name (e.g. Approve Member Registrations)',
  `slug` VARCHAR(100) NOT NULL UNIQUE COMMENT 'Unique permission key for granular auth checks (e.g. members:approve)',
  `description` VARCHAR(255) NULL COMMENT 'Explains exactly what capability this permission unlocks',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_permissions_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Granular system operations requiring explicit authorization';

CREATE TABLE `role_permissions` (
  `role_id` INT UNSIGNED NOT NULL,
  `permission_id` INT UNSIGNED NOT NULL,
  PRIMARY KEY (`role_id`, `permission_id`),
  CONSTRAINT `fk_role_permissions_role` FOREIGN KEY (`role_id`) 
    REFERENCES `roles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_role_permissions_permission` FOREIGN KEY (`permission_id`) 
    REFERENCES `permissions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Many-to-many lookup mapping permissions assigned to roles';

CREATE TABLE `user_roles` (
  `user_id` INT UNSIGNED NOT NULL,
  `role_id` INT UNSIGNED NOT NULL,
  PRIMARY KEY (`user_id`, `role_id`),
  CONSTRAINT `fk_user_roles_user` FOREIGN KEY (`user_id`) 
    REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_user_roles_role` FOREIGN KEY (`role_id`) 
    REFERENCES `roles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Many-to-many lookup assigning roles to individual users';


-- =============================================================================
-- 2. PROFESSIONAL LICENSING TYPES & GRADES
-- =============================================================================

CREATE TABLE `licensing_types` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `grade_name` VARCHAR(50) NOT NULL UNIQUE COMMENT 'Professional grade name e.g. Fellow, Professional, Associate, Graduate, Technician, Student',
  `annual_fee_mwk` DECIMAL(15,2) NOT NULL DEFAULT 0.00 COMMENT 'Standard annual membership / practicing license subscription cost in MWK',
  `required_annual_cpd` INT UNSIGNED NOT NULL DEFAULT 40 COMMENT 'Minimum annual CPD points/hours mandated for licensing eligibility',
  `description` VARCHAR(255) NULL COMMENT 'Brief scope summary of the professional grade eligibility',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_licensing_grade` (`grade_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Pre-defined professional grades governing SIM membership dues and mandatory CPD requirements';


-- =============================================================================
-- 3. PROFESSIONAL REGISTRY (MEMBERS)
-- =============================================================================

CREATE TABLE `member_profiles` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNSIGNED NOT NULL UNIQUE COMMENT 'One-to-one mapping to the authentication account',
  `licensing_type_id` INT UNSIGNED NOT NULL COMMENT 'Foreign key to licensing_types mapping the member grade',
  `member_no` VARCHAR(50) NULL UNIQUE COMMENT 'Issued unique registration ID e.g. SIM/LS/2026/045',
  `first_name` VARCHAR(80) NOT NULL,
  `last_name` VARCHAR(80) NOT NULL,
  `phone` VARCHAR(30) NULL,
  `chapter` ENUM('Land Surveying', 'Quantity Surveying', 'Valuation & Estate Management') NOT NULL COMMENT 'Professional practice domain chapter',
  `employer` VARCHAR(150) NULL,
  `designation` VARCHAR(100) NULL,
  `region` ENUM('Southern', 'Central', 'Northern') NOT NULL DEFAULT 'Southern' COMMENT 'Primary geographical zone for directory aggregation',
  `status` ENUM('Pending', 'Active', 'Suspended', 'Lapsed') NOT NULL DEFAULT 'Pending' COMMENT 'State of professional credentials and registration approvals',
  `profile_image` VARCHAR(255) NULL COMMENT 'File system path or bucket storage URL to the user portrait',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_member_user` FOREIGN KEY (`user_id`) 
    REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_member_licensing_type` FOREIGN KEY (`licensing_type_id`) 
    REFERENCES `licensing_types` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  INDEX `idx_members_chapter` (`chapter`),
  INDEX `idx_members_status` (`status`),
  INDEX `idx_members_no` (`member_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Professional register capturing member attributes, chapter subdivisions, and status flags';


-- =============================================================================
-- 4. LICENSED PRACTICE CORPORATE DIRECTORY (FIRMS)
-- =============================================================================

CREATE TABLE `surveying_firms` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `firm_name` VARCHAR(150) NOT NULL UNIQUE,
  `reg_no` VARCHAR(50) NOT NULL UNIQUE COMMENT 'Corporate license serial e.g. SIM-FIRM-QS-002',
  `managing_partner_id` INT UNSIGNED NOT NULL COMMENT 'Foreign key specifying the principal surveyor in charge',
  `address` VARCHAR(255) NULL,
  `city` ENUM('Blantyre', 'Lilongwe', 'Mzuzu', 'Zomba') NOT NULL DEFAULT 'Blantyre',
  `contact_email` VARCHAR(150) NULL,
  `contact_phone` VARCHAR(30) NULL,
  `status` ENUM('Active', 'Suspended', 'Lapsed') NOT NULL DEFAULT 'Active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_firm_managing_partner` FOREIGN KEY (`managing_partner_id`) 
    REFERENCES `member_profiles` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  INDEX `idx_firms_reg_no` (`reg_no`),
  INDEX `idx_firms_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Approved corporate surveying, quantity surveying, and estate valuation consultancies';


-- =============================================================================
-- 5. CPD SEMINARS & ACADEMIC SYMPOSIUMS (EVENTS)
-- =============================================================================

CREATE TABLE `events` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NOT NULL,
  `event_date` DATETIME NOT NULL COMMENT 'Scheduled timestamp of the professional event',
  `venue` VARCHAR(255) NOT NULL,
  `cpd_points` INT UNSIGNED NOT NULL DEFAULT 10 COMMENT 'CPD points accredited to delegates upon attendance',
  `registration_fee` DECIMAL(15,2) NOT NULL DEFAULT 0.00 COMMENT 'Participant entry cost in Malawi Kwacha (MWK)',
  `status` ENUM('Upcoming', 'Completed', 'Cancelled') NOT NULL DEFAULT 'Upcoming',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_events_status_date` (`status`, `event_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Continuous Professional Development workshops, annual general assemblies, and exams';


-- =============================================================================
-- 6. EVENT REGISTRATIONS
-- =============================================================================

CREATE TABLE `event_registrations` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `member_id` INT UNSIGNED NOT NULL,
  `event_id` INT UNSIGNED NOT NULL,
  `registration_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `payment_status` ENUM('Unpaid', 'Paid', 'Waived') NOT NULL DEFAULT 'Unpaid',
  `attendance_status` ENUM('Registered', 'Attended', 'Absent') NOT NULL DEFAULT 'Registered',
  `amount_paid` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_registration_member` FOREIGN KEY (`member_id`) 
    REFERENCES `member_profiles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_registration_event` FOREIGN KEY (`event_id`) 
    REFERENCES `events` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  UNIQUE KEY `idx_unique_member_event` (`member_id`, `event_id`),
  INDEX `idx_registration_payment` (`payment_status`),
  INDEX `idx_registration_attendance` (`attendance_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Relational intersection mapping members registering and attending credited SIM events';


-- =============================================================================
-- 7. CPD ATTENDANCE & LOGBOOK AUDITS (CPD CREDITS)
-- =============================================================================

CREATE TABLE `cpd_attendance` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `member_id` INT UNSIGNED NOT NULL,
  `event_id` INT UNSIGNED NULL COMMENT 'FK to event; NULL designates self-reported external training courses',
  `title` VARCHAR(255) NOT NULL COMMENT 'Workshop title or academic program description',
  `cpd_points` INT UNSIGNED NOT NULL COMMENT 'Claimed or auto-credited CPD points',
  `event_date` DATE NOT NULL COMMENT 'Completion timestamp of the educational workshop',
  `proof_document` VARCHAR(255) NULL COMMENT 'Filepath or bucket URL of certificate proof artifact',
  `status` ENUM('Pending', 'Approved', 'Rejected') NOT NULL DEFAULT 'Pending' COMMENT 'Audit validation state administered by SIM secretariat',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_cpd_member` FOREIGN KEY (`member_id`) 
    REFERENCES `member_profiles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_cpd_event` FOREIGN KEY (`event_id`) 
    REFERENCES `events` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX `idx_cpd_status` (`status`),
  INDEX `idx_cpd_member_audit` (`member_id`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='CPD ledger logging educational credits earned by members for licensing compliance';


-- =============================================================================
-- 8. CERTIFICATES & PRACTISING LICENCES
-- =============================================================================

CREATE TABLE `licences` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `member_id` INT UNSIGNED NOT NULL,
  `licence_no` VARCHAR(100) NOT NULL UNIQUE COMMENT 'Assigned unique cryptographic license seal e.g. SIM-LIC-2026-B8123',
  `financial_year` VARCHAR(15) NOT NULL COMMENT 'Target licensing financial year, e.g., "2026/2027"',
  `date_issued` DATE NOT NULL,
  `expiry_date` DATE NOT NULL,
  `status` ENUM('Active', 'Expired', 'Revoked') NOT NULL DEFAULT 'Active',
  `qr_code_url` VARCHAR(255) NOT NULL COMMENT 'Dynamic public verification address for real-time validation scans',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_licence_member` FOREIGN KEY (`member_id`) 
    REFERENCES `member_profiles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX `idx_licence_verify` (`licence_no`, `status`),
  INDEX `idx_licence_expiry` (`expiry_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Official licensing credentials verifiable via public web portal routing';


-- =============================================================================
-- 9. FINANCIAL LEDGER (INVOICES & PAYMENTS)
-- =============================================================================

CREATE TABLE `invoices` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `member_id` INT UNSIGNED NOT NULL,
  `invoice_no` VARCHAR(50) NOT NULL UNIQUE COMMENT 'Unique invoice code e.g. SIM-INV-2026-1024',
  `description` VARCHAR(255) NOT NULL COMMENT 'E.g., Annual Practicing Licence Fee (Professional) 2026/2027',
  `amount` DECIMAL(15,2) NOT NULL DEFAULT 0.00 COMMENT 'Billed fee in Malawi Kwacha (MWK)',
  `due_date` DATE NOT NULL,
  `status` ENUM('Unpaid', 'Paid', 'Overdue') NOT NULL DEFAULT 'Unpaid',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_invoice_member` FOREIGN KEY (`member_id`) 
    REFERENCES `member_profiles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX `idx_invoices_no` (`invoice_no`),
  INDEX `idx_invoices_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Financial invoice statement billing annual subscriptions or event registrations';

CREATE TABLE `payments` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `invoice_id` INT UNSIGNED NOT NULL,
  `amount_paid` DECIMAL(15,2) NOT NULL DEFAULT 0.00 COMMENT 'Reconciled amount confirmed in MWK',
  `payment_date` DATE NOT NULL,
  `payment_method` VARCHAR(50) NOT NULL DEFAULT 'Bank Deposit' COMMENT 'E.g., Bank Deposit, Airtel Money, TNM Mpamba',
  `reference_no` VARCHAR(100) NOT NULL UNIQUE COMMENT 'Bank transfer reference or mobile money transaction ID',
  `deposit_slip_path` VARCHAR(255) NOT NULL COMMENT 'Path or URL of the uploaded deposit slip image or PDF',
  `verification_status` ENUM('Pending', 'Verified', 'Rejected') NOT NULL DEFAULT 'Pending',
  `verified_by` VARCHAR(150) NULL COMMENT 'Administrative email of secretariat officer approving the transaction',
  `verification_date` DATETIME NULL,
  `receipt_no` VARCHAR(50) NULL UNIQUE COMMENT 'Generated official system receipt code e.g. SIM-REC-00124',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_payment_invoice` FOREIGN KEY (`invoice_id`) 
    REFERENCES `invoices` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  INDEX `idx_payments_ref` (`reference_no`),
  INDEX `idx_payments_verification` (`verification_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Bank deposit or mobile transfer receipt slip submissions awaiting secretariat validation';


-- =============================================================================
-- 10. SYSTEM AUDIT TRAILS
-- =============================================================================

CREATE TABLE `audit_logs` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNSIGNED NOT NULL COMMENT 'Acting account executing the audited transaction',
  `user_email` VARCHAR(150) NOT NULL,
  `action` VARCHAR(255) NOT NULL COMMENT 'Description of the action e.g. VERIFY_PAYMENT, APPROVE_MEMBER, CREATE_EVENT',
  `details` TEXT NULL COMMENT 'JSON string outlining changed values and specific metadata',
  `ip_address` VARCHAR(45) NULL COMMENT 'Client machine IP address capturing IPv4 or IPv6 format',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_audit_user` FOREIGN KEY (`user_id`) 
    REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX `idx_audit_performer` (`user_email`),
  INDEX `idx_audit_date` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Immutable audit history protecting critical registry and financial assets';


-- =============================================================================
-- 11. WEB CONTENT CMS (NEWS, PUBLICATIONS, FAQS)
-- =============================================================================

CREATE TABLE `faq_items` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `question` VARCHAR(255) NOT NULL,
  `answer` TEXT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Frequently Asked Questions compiled publicly on the SIM homepage';

CREATE TABLE `news_items` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `excerpt` VARCHAR(500) NOT NULL,
  `content` TEXT NOT NULL,
  `date` DATE NOT NULL,
  `image` VARCHAR(255) NOT NULL COMMENT 'Thumbnail banner asset or file path',
  `category` ENUM('Institute', 'Industry', 'CPD', 'Government') NOT NULL DEFAULT 'Institute',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Press releases, sector news, and administrative notices published on the home portal';

CREATE TABLE `publication_items` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `category` ENUM('Act', 'Bylaw', 'Form', 'Report') NOT NULL DEFAULT 'Act' COMMENT 'Category governing statutory and administrative legal files',
  `description` TEXT NOT NULL,
  `file_url` VARCHAR(255) NOT NULL COMMENT 'Secure document path for PDF downloads',
  `date` DATE NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Surveyors acts, rules, constitution bylaws, annual reports, and applications forms';


-- =============================================================================
-- 12. DATA SEEDING (ESSENTIAL DEFAULTS & WORKSPACE RECORDS)
-- =============================================================================

-- Seed User Portals (BCrypt Password placeholder for 'admin')
INSERT INTO `users` (`id`, `email`, `password_hash`, `role`) VALUES
(1, 'admin@sim.mw', '$2b$10$7Z2vL89bVb8893NMDmksue1SDA983mnd87H27asda619sU98nsjaO', 'Admin'), 
(2, 'j.banda@lands.gov.mw', '$2b$10$7Z2vL89bVb8893NMDmksue1SDA983mnd87H27asda619sU98nsjaO', 'Member'),
(3, 'p.phiri@surveyors.mw', '$2b$10$7Z2vL89bVb8893NMDmksue1SDA983mnd87H27asda619sU98nsjaO', 'Member'),
(4, 'e.mtembo@gmail.com', '$2b$10$7Z2vL89bVb8893NMDmksue1SDA983mnd87H27asda619sU98nsjaO', 'Member');

-- Seed Roles
INSERT INTO `roles` (`id`, `name`, `slug`, `description`) VALUES
(1, 'Super Administrator', 'super_admin', 'Full database and portal administrative access'),
(2, 'Secretariat Officer', 'secretariat_officer', 'Administers professional registries, CPD points, and event management'),
(3, 'Finance Officer', 'finance_officer', 'Reconciles subscription invoices, bank deposit slips, and accounts ledger'),
(4, 'Professional Member', 'member_professional', 'Registered practicing surveyor with full licensing and logging capabilities'),
(5, 'Student Member', 'member_student', 'Registered surveyor student with directory access and basic event registrations');

-- Seed Permissions
INSERT INTO `permissions` (`id`, `name`, `slug`, `description`) VALUES
(1, 'Manage Authentication & Users', 'users:manage', 'Authorize personnel to create, edit, or disable user profiles'),
(2, 'Manage Portal Roles & RBAC', 'roles:manage', 'Allows reconfiguration of permission mapping matrices'),
(3, 'Read Registry Directory', 'members:read', 'Browse, filter, and search professional registry listings'),
(4, 'Write Personal Registry', 'members:write', 'Update self member details and upload profile photos'),
(5, 'Approve Member Registrations', 'members:approve', 'Approve pending memberships and issue official registration numbers'),
(6, 'Claim CPD Credits', 'cpd:claim', 'Upload proof of external seminars and file point evaluation claims'),
(7, 'Approve CPD Logbooks', 'cpd:approve', 'Audit and verify points logged by practicing professionals'),
(8, 'Create Professional Events', 'events:create', 'Publish new CPD seminars, cost estimators, and general meetings'),
(9, 'Register CPD Events', 'events:register', 'Purchase or enroll in scheduled professional development workshops'),
(10, 'Generate Invoices', 'invoices:create', 'Create billing notices for annual subscriptions or event costs'),
(11, 'Submit Banking Slips', 'payments:submit', 'Upload bank receipts or transaction hashes for outstanding invoices'),
(12, 'Verify Transaction Receipts', 'payments:verify', 'Audit bank transfers, issue system receipts, and reconcile invoices'),
(13, 'Issue Practising Licences', 'licences:issue', 'Generate annual practice licenses with unique cryptographic seal numbers'),
(14, 'View Portal Audit Log', 'audit:view', 'Browse immutable ledger logging portal transactions and actions');

-- Seed Role Permissions (Assign fine-grained abilities to Roles)
-- Super Admin gets everything (IDs 1 to 14)
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES
(1, 1), (1, 2), (1, 3), (1, 4), (1, 5), (1, 6), (1, 7), (1, 8), (1, 9), (1, 10), (1, 11), (1, 12), (1, 13), (1, 14),
-- Secretariat Admin
(2, 3), (2, 4), (2, 5), (2, 7), (2, 8), (2, 13),
-- Finance Admin
(3, 3), (3, 10), (3, 12),
-- Professional Member
(4, 3), (4, 4), (4, 6), (4, 9), (4, 11),
-- Student Member
(5, 3), (5, 4), (5, 9);

-- Seed User Role assignments
INSERT INTO `user_roles` (`user_id`, `role_id`) VALUES
(1, 1), -- admin is Super Admin
(2, 4), -- j.banda is Professional Member
(3, 4), -- p.phiri is Professional Member
(4, 4); -- e.mtembo is Professional Member

-- Seed Licensing Types with standard annual fees and mandatory CPD point requirements
INSERT INTO `licensing_types` (`id`, `grade_name`, `annual_fee_mwk`, `required_annual_cpd`, `description`) VALUES
(1, 'Fellow', 350000.00, 40, 'Honorary status awarded to professional surveyors of outstanding long-term contribution'),
(2, 'Professional', 250000.00, 40, 'Fully certified and licensed practicing land, quantity, or valuation surveyor'),
(3, 'Associate', 200000.00, 30, 'Registered professionals from aligned scientific or engineering fields'),
(4, 'Graduate', 150000.00, 20, 'Post-academic interns actively completing structured logbooks for full registration'),
(5, 'Technician', 100000.00, 20, 'Mid-level surveying associates and field technical operators'),
(6, 'Student', 10000.00, 0, 'Undergraduates pursuing accredited geospatial or building economics degrees');

-- Seed Members mapping to users and their licensing types
INSERT INTO `member_profiles` (`id`, `user_id`, `licensing_type_id`, `member_no`, `first_name`, `last_name`, `phone`, `chapter`, `employer`, `designation`, `region`, `status`) VALUES
(1, 2, 2, 'SIM/LS/2026/045', 'John', 'Banda', '+265 888 123 456', 'Land Surveying', 'Ministry of Lands', 'Senior Geodetic Surveyor', 'Central', 'Active'),
(2, 3, 1, 'SIM/QS/2026/102', 'Patricia', 'Phiri', '+265 999 789 012', 'Quantity Surveying', 'BBD Quantity Surveyors', 'Managing Partner', 'Southern', 'Active'),
(3, 4, 4, NULL, 'Ellena', 'Mtembo', '+265 111 234 567', 'Valuation & Estate Management', 'Self-Employed', 'Graduate Appraiser', 'Southern', 'Pending');

-- Seed Surveying Firms
INSERT INTO `surveying_firms` (`id`, `firm_name`, `reg_no`, `managing_partner_id`, `address`, `city`, `contact_email`, `contact_phone`, `status`) VALUES
(1, 'BBD Quantity Surveyors', 'SIM-FIRM-QS-002', 2, 'Shire House, Victoria Avenue', 'Blantyre', 'info@bbdqs.mw', '+265 1 832 444', 'Active');

-- Seed Events (CPD Seminars)
INSERT INTO `events` (`id`, `title`, `description`, `event_date`, `venue`, `cpd_points`, `registration_fee`, `status`) VALUES
(1, 'Digital Cadastral Surveying & LIS Workshop', 'Practical masterclass on high-precision GNSS surveys, satellite geodesy, and the integration of Malawian land registry GIS databases.', '2026-08-15 09:00:00', 'Sunbird Mount Soche, Blantyre', 15, 65000.00, 'Upcoming'),
(2, 'Malawi Construction Cost Indexing Symposium', 'Standardization seminar for quantity surveyors on analyzing regional commodity fluctuations, standard bidding documents, and project estimators.', '2026-09-22 08:30:00', 'Bingu International Conference Centre, Lilongwe', 10, 50000.00, 'Upcoming');

-- Seed Event Registrations linking members to events with statuses
INSERT INTO `event_registrations` (`id`, `member_id`, `event_id`, `payment_status`, `attendance_status`, `amount_paid`) VALUES
(1, 1, 1, 'Paid', 'Registered', 65000.00),
(2, 2, 2, 'Paid', 'Registered', 50000.00);

-- Seed CPD attendance/reporting queue (approved vs pending review)
INSERT INTO `cpd_attendance` (`id`, `member_id`, `event_id`, `title`, `cpd_points`, `event_date`, `proof_document`, `status`) VALUES
(1, 1, NULL, 'SADC Regional Geodetic Grid Densification Webinar', 10, '2026-05-10', 'cert_sadc_geodetic_banda.pdf', 'Approved'),
(2, 3, NULL, 'RICS Global Valuation Standards Continuing Education', 15, '2026-06-01', 'rics_certificate_ellena.pdf', 'Pending');

-- Seed active practising licences
INSERT INTO `licences` (`id`, `member_id`, `licence_no`, `financial_year`, `date_issued`, `expiry_date`, `status`, `qr_code_url`) VALUES
(1, 1, 'SIM-LIC-2026-B8123', '2026/2027', '2026-07-01', '2027-06-30', 'Active', 'https://sim.mw/verify/SIM-LIC-2026-B8123'),
(2, 2, 'SIM-LIC-2026-P0921', '2026/2027', '2026-07-01', '2027-06-30', 'Active', 'https://sim.mw/verify/SIM-LIC-2026-P0921');

-- Seed bill invoices
INSERT INTO `invoices` (`id`, `member_id`, `invoice_no`, `description`, `amount`, `due_date`, `status`) VALUES
(1, 1, 'SIM-INV-2026-1024', 'Annual Practicing Licence Fee (Professional) 2026/2027', 250000.00, '2026-07-31', 'Paid'),
(2, 2, 'SIM-INV-2026-1025', 'Annual Practicing Licence Fee (Fellow) 2026/2027', 350000.00, '2026-07-31', 'Paid'),
(3, 3, 'SIM-INV-2026-1026', 'Annual Practicing Licence Fee (Graduate) 2026/2027', 150000.00, '2026-07-31', 'Unpaid');

-- Seed payments transaction ledger
INSERT INTO `payments` (`id`, `invoice_id`, `amount_paid`, `payment_date`, `payment_method`, `reference_no`, `deposit_slip_path`, `verification_status`, `verified_by`, `verification_date`, `receipt_no`) VALUES
(1, 1, 250000.00, '2026-07-03', 'Bank Deposit', 'NBM-DEP-9981242', 'deposit_slip_banda_2026.pdf', 'Verified', 'admin@sim.mw', '2026-07-04 10:00:00', 'SIM-REC-00124'),
(2, 2, 350000.00, '2026-07-05', 'Bank Deposit', 'FDH-FT-00124891', 'deposit_slip_phiri_2026.pdf', 'Verified', 'admin@sim.mw', '2026-07-06 14:30:00', 'SIM-REC-00125'),
(3, 3, 150000.00, '2026-07-08', 'Airtel Money', 'AM-TXN-10948523', 'airtel_receipt_ellena.png', 'Pending', NULL, NULL, NULL);

-- Seed System Audit logs
INSERT INTO `audit_logs` (`id`, `user_id`, `user_email`, `action`, `details`, `ip_address`) VALUES
(1, 1, 'admin@sim.mw', 'VERIFY_PAYMENT', 'Verified National Bank deposit slip for member John Banda (Invoice SIM-INV-2026-1024)', '192.168.10.45'),
(2, 1, 'admin@sim.mw', 'VERIFY_PAYMENT', 'Verified FDH bank transfer for member Patricia Phiri (Invoice SIM-INV-2026-1025)', '192.168.10.45');

-- Seed Web CMS content FAQs
INSERT INTO `faq_items` (`id`, `question`, `answer`) VALUES
(1, 'What are the continuing professional development (CPD) requirements for surveyors in Malawi?', 'To maintain an active practicing license, fellows and professionals must log a minimum of 40 CPD points annually. At least 25 points must be from SIM-organized workshops, with the balance obtained from approved academic publications, online lectures, or external geodetic and valuation conferences.'),
(2, 'How do I pay my annual membership subscriptions?', 'Payment can be made via National Bank of Malawi (NBM) or FDH Bank counter deposit/transfer. You must write your invoice number as reference, upload the scanned banking slip through the SIM Member Portal, and our accounts team will verify it and automatically activate your licence.');

-- Seed Web CMS news
INSERT INTO `news_items` (`id`, `title`, `excerpt`, `content`, `date`, `image`, `category`) VALUES
(1, 'Minister of Lands Announces National Geodetic Grid Overhaul', 'A major modernization campaign of regional benchmarks and CORS network has been launched to support surveyors with centimetre-level GPS accuracy.', 'The Ministry of Lands in partnership with the Surveyors Institute of Malawi is launching a nationwide modernization of spatial geodetic networks. Over 15 continuously operating reference stations (CORS) will be established across the Northern, Central, and Southern regions to deliver real-time kinematic GPS signals, greatly lowering cost for cadastral and engineering boundary delineations.', '2026-07-01', '/assets/geodetic_surveying.jpg', 'Government');

-- Seed Web CMS Publications download list
INSERT INTO `publication_items` (`id`, `title`, `category`, `description`, `file_url`, `date`) VALUES
(1, 'Land Surveyors Act of Malawi (Cap 59:03)', 'Act', 'Official statutory laws governing the registration, professional conduct, standards of practice, and disciplinary guidelines for Land Surveyors in Malawi.', '/publications/Land_Surveyors_Act_Malawi.pdf', '1990-10-15'),
(2, 'SIM CPD Self-Reporting Logbook Template', 'Form', 'Downloadable PDF logbook sheet to report external academic courses, guest lectures, or regional geomatics summits for CPD credit evaluations.', '/publications/SIM_CPD_Logbook_Template.pdf', '2026-01-10');
