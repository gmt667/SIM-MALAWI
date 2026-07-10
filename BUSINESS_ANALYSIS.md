# SURVEYORS INSTITUTE OF MALAWI (SIM) PORTAL - ENTERPRISE BUSINESS ANALYSIS

This document details the enterprise system analysis, requirements, and database schema for the **Surveyors Institute of Malawi (SIM) Portal & Website**, providing a complete blueprint for the digitized, integrated web application replacing previous Excel-based manual flows.

---

## 1. Business Process Analysis
The Surveyors Institute of Malawi (SIM) is the professional regulatory body that registers, licenses, and monitors professional surveyors across three key branches (chapters):
1. **Land Surveying (LS)**
2. **Quantity Surveying (QS)**
3. **Valuation and Estate Management (VEM)**

### Existing Manual System (Excel-based) & Weaknesses:
* **Fragmented Registries**: Membership lists, CPD registers, licensing statuses, and invoice records are stored in separate Excel workbooks. This leads to duplicate records and stale data.
* **Lack of Real-time Verification**: The public cannot easily verify if a surveyor has a valid practising licence, which is critical for construction projects, valuations, and boundary surveys.
* **Manual Payments Verification**: Members deposit fees via bank deposits (e.g., National Bank, FDH) and physical deposit slips must be presented or emailed, leading to human bottlenecks in checking bank balances.
* **CPD Tracking Bottleneck**: Members earn points by attending events, but these are recorded manually in sheets. This makes checking license eligibility (which requires a minimum number of CPD hours annually) tedious and prone to human errors.
* **Manual Certificate Generation**: Certificates are manually created in MS Word/Publisher and printed/scanned individually.

---

## 2. Functional Requirements

### A. Public Corporate Website
* **Home**: Institutional news, hero banner, announcements, quick links.
* **About SIM**: Mandate, history, constitution, council list, secretariat team.
* **Public Registrar**: Searchable registry of certified members and licensed surveying firms. Filterable by chapter, licence status, and location.
* **Events & CPD News**: List of upcoming courses, points assigned, venue, and fee structure.
* **Publications & Downloads**: Acts of Parliament, SIM bylaws, registration forms, and research papers.
* **FAQs & Contact Support**: Contact form routed to administrative portal inbox with email notifications.

### B. Member Portal (Self-Service)
* **Registration & Secure Login**: MFA-ready password security, account confirmation.
* **Profile Management**: Profile image, employment details, contacts, sub-specialty chapter.
* **Membership Application & Renewal**: Online upload of academic transcripts, APC reports, application fee payment proof.
* **Practising Licence Application/Renewal**: Standardized application requiring a minimum of 20 CPD points accumulated during the previous financial year.
* **Subscription & Billing**: Self-service downloads of current annual invoices, bank receipt uploads (Airtel Money, bank transfers, bank cash deposits), and auto-generation of official receipts once verified.
* **CPD Ledger**: Ledger showing self-reported events, official SIM-hosted events, and real-time status of accumulated CPD points.
* **Instant Verification Downloads**: Secure download of PDF Certificates (Membership, Licencing, and CPD Attendance) embedded with secure, unique QR verification codes.

### C. Administrative Portal (Control Center)
* **Executive Recharts Dashboard**: Visual breakdown of total active members, active licences, chapter distributions, pending payment slips, and monthly revenue.
* **Member Management**: Approve/reject applications, change status, issue suspensions.
* **Licensing Module**: Audit log of CPD point requirements, review of licensing applications, digital issuance of practising licenses.
* **Firm Management**: Directory of registered surveying firms, active partners, and locations.
* **Financial Module (Invoicing & Receipting)**: Verify submitted payment slips against outstanding invoices, auto-approve, issue system receipts, trigger email notifications.
* **CPD & Event Manager**: Publish events, set credit hours, track registrations, scan-to-check-in attendance, generate CPD certificates automatically.
* **System Settings & CMS**: Manage FAQs, Downloads, Council Members, Secretariat, News, and Publications.
* **Security & Audit Logs**: High-fidelity records tracking administrative actions (e.g., "Admin verified invoice #INV-1092 and activated Member #M-0021").

---

## 3. Non-Functional Requirements
* **Security**: OWASP Top 10 compliance. Absolute protection against SQL Injections, Cross-Site Scripting (XSS), and Cross-Site Request Forgery (CSRF). Password hashing via bcrypt. Role-Based Access Control (RBAC).
* **Availability & Performance**: SPA architecture via Vite and React, lazy-loaded modules, optimized REST API via Express.
* **Responsiveness**: Mobile-first design utilizing Tailwind CSS.
* **Durable Cloud Persistence**: Secure persistent data layer simulating relational database integrity with referential constraints, auto-incrementing identifiers, and atomic read-write operations.

---

## 4. User Roles & Permissions
1. **Public Visitor**: View website, browse public registrar, read news, download forms, contact secretariat.
2. **Student / Graduate Member**: Full access to Member Portal, apply for membership upgrade, track CPD, pay subscription invoices.
3. **Professional Member**: Full access to Member Portal, apply for/renew practising licence, track CPD, pay subscription invoices, download certificates.
4. **System Administrator (Secretariat)**: Access to Administrative Portal. Control over membership, licensing, finance, CPD, event records, audit logs, and website CMS.

---

## 5. Entity Relationship Diagram (ERD) & Database Design

The normalized schema comprises 8 core entities:

```
[USERS] (1) ------ (0..1) [MEMBER_PROFILES] (1) ------ (0..*) [LICENCES]
   |                             |
   |                             +-------------------- (0..*) [INVOICES] -- (1) -- [PAYMENTS]
   |
  (1) ------- (0..*) [CPD_ATTENDANCE] <------ (0..*) [EVENTS]
   |
  (1) ------- (0..*) [AUDIT_LOGS]
```

### MySQL SQL Schema (DDL)

```sql
-- Create Users Table (Auth and Roles)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('Admin', 'Member') NOT NULL DEFAULT 'Member',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create Member Profiles Table
CREATE TABLE IF NOT EXISTS member_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNIQUE NOT NULL,
    member_no VARCHAR(50) UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(50),
    chapter ENUM('Land Surveying', 'Quantity Surveying', 'Valuation & Estate Management') NOT NULL,
    grade ENUM('Fellow', 'Professional', 'Associate', 'Graduate', 'Technician', 'Student') NOT NULL,
    employer VARCHAR(255),
    designation VARCHAR(150),
    region ENUM('Southern', 'Central', 'Northern') NOT NULL DEFAULT 'Southern',
    status ENUM('Pending', 'Active', 'Suspended', 'Lapsed') NOT NULL DEFAULT 'Pending',
    profile_image VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create Surveying Firms Table
CREATE TABLE IF NOT EXISTS surveying_firms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    firm_name VARCHAR(255) NOT NULL,
    reg_no VARCHAR(100) UNIQUE NOT NULL,
    managing_partner_id INT NOT NULL,
    address TEXT,
    city VARCHAR(100),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    status ENUM('Active', 'Suspended', 'Lapsed') DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (managing_partner_id) REFERENCES member_profiles(id)
);

-- Create Events / CPDs Table
CREATE TABLE IF NOT EXISTS events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_date DATETIME NOT NULL,
    venue VARCHAR(255) NOT NULL,
    cpd_points INT NOT NULL DEFAULT 5,
    registration_fee DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    status ENUM('Upcoming', 'Completed', 'Cancelled') DEFAULT 'Upcoming',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create CPD Attendance / Self-Reports Table
CREATE TABLE IF NOT EXISTS cpd_attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    member_id INT NOT NULL,
    event_id INT, -- NULL for external self-reports
    title VARCHAR(255) NOT NULL, -- Used directly for self-reports, or auto-copied from event
    cpd_points INT NOT NULL,
    event_date DATE NOT NULL,
    proof_document VARCHAR(255), -- Uploaded proof for self-reports
    status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Approved',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (member_id) REFERENCES member_profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE SET NULL
);

-- Create Practising Licences Table
CREATE TABLE IF NOT EXISTS licences (
    id INT AUTO_INCREMENT PRIMARY KEY,
    member_id INT NOT NULL,
    licence_no VARCHAR(100) UNIQUE NOT NULL,
    financial_year VARCHAR(20) NOT NULL,
    date_issued DATE NOT NULL,
    expiry_date DATE NOT NULL,
    status ENUM('Active', 'Expired', 'Revoked') DEFAULT 'Active',
    qr_code_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (member_id) REFERENCES member_profiles(id) ON DELETE CASCADE
);

-- Create Invoices Table
CREATE TABLE IF NOT EXISTS invoices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    member_id INT NOT NULL,
    invoice_no VARCHAR(100) UNIQUE NOT NULL,
    description VARCHAR(255) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    due_date DATE NOT NULL,
    status ENUM('Unpaid', 'Paid', 'Overdue') DEFAULT 'Unpaid',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (member_id) REFERENCES member_profiles(id) ON DELETE CASCADE
);

-- Create Payments (Receipts/Deposit Slips) Table
CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_id INT UNIQUE NOT NULL,
    amount_paid DECIMAL(10, 2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_method VARCHAR(100) NOT NULL, -- "Bank Deposit", "Airtel Money", "TNM Mpamba"
    reference_no VARCHAR(100) NOT NULL,
    deposit_slip_path VARCHAR(255) NOT NULL,
    verification_status ENUM('Pending', 'Verified', 'Rejected') DEFAULT 'Pending',
    verified_by VARCHAR(100),
    verification_date DATETIME,
    receipt_no VARCHAR(100) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
);

-- Create Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    action VARCHAR(255) NOT NULL,
    details TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 6. Suggested Improvements Included in this Digitized Design:
1. **Self-Service Verification (QR Engine)**: By attaching verified QR codes to certificates, third-party clients (banks, municipal registries, ministries) can scan the QR code to confirm active membership status in real-time, eliminating physical verification loops.
2. **Automated CPD Eligibility**: During licence renewal, the system automatically aggregates verified CPD points for the current financial year and triggers validation, blockages, or auto-approvals, replacing the manual verification of paper logbooks.
3. **Proactive Account Actions**: Outstanding invoices automatically trigger warnings on member dashboards, and upcoming events are instantly matched to members' specific chapters for targeted announcements.
