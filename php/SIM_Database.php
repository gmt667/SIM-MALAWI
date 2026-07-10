<?php
declare(strict_types=1);

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

namespace SIM;

use PDO;
use PDOException;
use DateTimeImmutable;
use RuntimeException;
use InvalidArgumentException;

/**
 * =============================================================================
 * SURVEYORS INSTITUTE OF MALAWI (SIM) - PHP 8+ DATABASE & REPOSITORY LAYER
 * =============================================================================
 * This file contains modern PHP 8.1+ object-oriented models, repositories, and
 * a transactional service layer for the SIM database schema.
 * 
 * Features utilized:
 *   - Strict Types declaration
 *   - Constructor Property Promotion
 *   - Readonly Properties
 *   - Union Types
 *   - Match Expressions
 *   - Typed Class Constants & Properties
 *   - Prepared PDO Statements with strict injection-guards
 * =============================================================================
 */

// =============================================================================
// 1. DATA VALUE OBJECTS / ENTITIES (PHP 8.1+ Readonly / Promoted Properties)
// =============================================================================

class User 
{
    public function __construct(
        public readonly ?int $id,
        public readonly string $email,
        public readonly string $passwordHash,
        public readonly string $role, // 'Admin' | 'Member'
        public readonly ?DateTimeImmutable $createdAt = null
    ) {}
}

class MemberProfile 
{
    public function __construct(
        public readonly ?int $id,
        public readonly int $userId,
        public readonly int $licensingTypeId,
        public readonly ?string $memberNo,
        public readonly string $firstName,
        public readonly string $lastName,
        public readonly ?string $phone,
        public readonly string $chapter, // 'Land Surveying' | 'Quantity Surveying' | 'Valuation & Estate Management'
        public readonly ?string $employer,
        public readonly ?string $designation,
        public readonly string $region, // 'Southern' | 'Central' | 'Northern'
        public readonly string $status, // 'Pending' | 'Active' | 'Suspended' | 'Lapsed'
        public readonly ?string $profileImage = null
    ) {}

    public function getFullName(): string 
    {
        return sprintf('%s %s', $this->firstName, $this->lastName);
    }
}

class SurveyingFirm 
{
    public function __construct(
        public readonly ?int $id,
        public readonly string $firmName,
        public readonly string $regNo,
        public readonly int $managingPartnerId,
        public readonly ?string $address,
        public readonly string $city, // 'Blantyre' | 'Lilongwe' | 'Mzuzu' | 'Zomba'
        public readonly ?string $contactEmail,
        public readonly ?string $contactPhone,
        public readonly string $status // 'Active' | 'Suspended' | 'Lapsed'
    ) {}
}

class Event 
{
    public function __construct(
        public readonly ?int $id,
        public readonly string $title,
        public readonly string $description,
        public readonly DateTimeImmutable $eventDate,
        public readonly string $venue,
        public readonly int $cpdPoints,
        public readonly float $registrationFee,
        public readonly string $status // 'Upcoming' | 'Completed' | 'Cancelled'
    ) {}
}

class Licence 
{
    public function __construct(
        public readonly ?int $id,
        public readonly int $memberId,
        public readonly string $licenceNo,
        public readonly string $financialYear,
        public readonly DateTimeImmutable $dateIssued,
        public readonly DateTimeImmutable $expiryDate,
        public readonly string $status, // 'Active' | 'Expired' | 'Revoked'
        public readonly string $qrCodeUrl
    ) {}

    public function isExpired(): bool 
    {
        return $this->expiryDate < new DateTimeImmutable();
    }
}

class Invoice 
{
    public function __construct(
        public readonly ?int $id,
        public readonly int $memberId,
        public readonly string $invoiceNo,
        public readonly string $description,
        public readonly float $amount,
        public readonly DateTimeImmutable $dueDate,
        public readonly string $status // 'Unpaid' | 'Paid' | 'Overdue'
    ) {}
}

class Payment 
{
    public function __construct(
        public readonly ?int $id,
        public readonly int $invoiceId,
        public readonly float $amountPaid,
        public readonly DateTimeImmutable $paymentDate,
        public readonly string $paymentMethod,
        public readonly string $referenceNo,
        public readonly string $depositSlipPath,
        public readonly string $verificationStatus, // 'Pending' | 'Verified' | 'Rejected'
        public readonly ?string $verifiedBy = null,
        public readonly ?DateTimeImmutable $verificationDate = null,
        public readonly ?string $receiptNo = null
    ) {}
}

// =============================================================================
// 2. DATABASE CONFIGURATION & CONNECTOR
// =============================================================================

class DatabaseConnector 
{
    private ?PDO $pdo = null;

    public function __construct(
        private readonly string $host,
        private readonly string $dbName,
        private readonly string $username,
        private readonly string $password,
        private readonly int $port = 3306,
        private readonly string $charset = 'utf8mb4'
    ) {}

    /**
     * Establish PDO MySQL Database Connection safely.
     * Generates standard safe configuration arrays including emulated prepares disabling.
     */
    public function getConnection(): PDO 
    {
        if ($this->pdo === null) {
            $dsn = sprintf('mysql:host=%s;port=%d;dbname=%s;charset=%s', $this->host, $this->port, $this->dbName, $this->charset);
            
            $options = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"
            ];

            try {
                $this->pdo = new PDO($dsn, $this->username, $this->password, $options);
            } catch (PDOException $e) {
                throw new RuntimeException('SIM Database Connection Failed: ' . $e->getMessage(), (int)$e->getCode(), $e);
            }
        }

        return $this->pdo;
    }
}

// =============================================================================
// 3. SERVICE WORKSPACE ENGINE (TRANSACTIONS & DATA REPOSITORIES)
// =============================================================================

class SIMService 
{
    public function __construct(private readonly PDO $pdo) {}

    /**
     * 1. Dynamic member registration mapping transaction.
     * Generates a corresponding user account and places profile in 'Pending' evaluation state.
     */
    public function registerMember(
        string $email, 
        string $plainPassword, 
        string $firstName, 
        string $lastName, 
        string $phone, 
        string $chapter, 
        int $licensingTypeId,
        string $region,
        ?string $employer = null,
        ?string $designation = null
    ): int {
        $this->pdo->beginTransaction();

        try {
            // Check if email already registered
            $stmt = $this->pdo->prepare('SELECT id FROM users WHERE email = :email');
            $stmt->execute(['email' => $email]);
            if ($stmt->fetch()) {
                throw new InvalidArgumentException('E-mail address is already registered in the SIM repository.');
            }

            // Secure BCrypt Hash
            $hash = password_hash($plainPassword, PASSWORD_BCRYPT, ['cost' => 10]);

            // Create Authentication account
            $userStmt = $this->pdo->prepare('INSERT INTO users (email, password_hash, role) VALUES (:email, :hash, "Member")');
            $userStmt->execute([
                'email' => $email,
                'hash'  => $hash
            ]);
            $userId = (int)$this->pdo->lastInsertId();

            // Insert member profile associated
            $profileStmt = $this->pdo->prepare('
                INSERT INTO member_profiles 
                (user_id, licensing_type_id, first_name, last_name, phone, chapter, employer, designation, region, status) 
                VALUES 
                (:user_id, :lic_id, :first, :last, :phone, :chapter, :employer, :designation, :region, "Pending")
            ');
            $profileStmt->execute([
                'user_id'     => $userId,
                'lic_id'      => $licensingTypeId,
                'first'       => $firstName,
                'last'        => $lastName,
                'phone'       => $phone,
                'chapter'     => $chapter,
                'employer'    => $employer,
                'designation' => $designation,
                'region'      => $region
            ]);
            $profileId = (int)$this->pdo->lastInsertId();

            // Log dynamic audit trail event
            $this->logActivity($userId, $email, 'REGISTER_MEMBER', sprintf('Self-registration initiated for member: %s %s', $firstName, $lastName));

            $this->pdo->commit();
            return $profileId;
        } catch (PDOException|InvalidArgumentException $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }

    /**
     * 2. Submit payment slip for outstanding subscriptions.
     * Automatically tags the payment slip to the pending invoice.
     */
    public function submitPayment(
        int $invoiceId, 
        float $amountPaid, 
        string $paymentDate, 
        string $paymentMethod, 
        string $referenceNo, 
        string $depositSlipPath
    ): int {
        // Validate Invoice state first
        $stmt = $this->pdo->prepare('SELECT id, status, member_id FROM invoices WHERE id = :invoice_id');
        $stmt->execute(['invoice_id' => $invoiceId]);
        $invoice = $stmt->fetch();

        if (!$invoice) {
            throw new InvalidArgumentException('Target SIM invoice record was not found.');
        }

        if ($invoice['status'] === 'Paid') {
            throw new InvalidArgumentException('Target SIM invoice has already been cleared.');
        }

        $paymentStmt = $this->pdo->prepare('
            INSERT INTO payments 
            (invoice_id, amount_paid, payment_date, payment_method, reference_no, deposit_slip_path, verification_status)
            VALUES
            (:invoice_id, :amount, :date, :method, :ref, :path, "Pending")
        ');

        try {
            $paymentStmt->execute([
                'invoice_id' => $invoiceId,
                'amount'     => $amountPaid,
                'date'       => $paymentDate,
                'method'     => $paymentMethod,
                'ref'        => $referenceNo,
                'path'       => $depositSlipPath
            ]);
            
            return (int)$this->pdo->lastInsertId();
        } catch (PDOException $e) {
            if ($e->errorInfo[1] === 1062) { // Duplicate transaction ref
                throw new InvalidArgumentException('A bank deposit with this payment reference number is already pending review.', 1062);
            }
            throw $e;
        }
    }

    /**
     * 3. Verify Payment Slip & Auto-Issue Practising Licence (PHP 8 Match implementation)
     * Reconciles invoice payments. If approved, automatically marks the invoice as Paid,
     * updates member status to Active, issues a unique Practising Licence, and emits an Audit Log.
     */
    public function verifyPayment(int $paymentId, int $adminUserId, string $adminEmail, string $decision): bool 
    {
        if (!in_array($decision, ['Verified', 'Rejected'], true)) {
            throw new InvalidArgumentException('Invalid verification decision state parameters.');
        }

        $this->pdo->beginTransaction();

        try {
            // Retrieve Payment Slip details
            $payStmt = $this->pdo->prepare('SELECT * FROM payments WHERE id = :id FOR UPDATE');
            $payStmt->execute(['id' => $paymentId]);
            $payment = $payStmt->fetch();

            if (!$payment) {
                throw new InvalidArgumentException('Payment reference record not found.');
            }

            if ($payment['verification_status'] !== 'Pending') {
                throw new InvalidArgumentException('This payment transaction has already been processed.');
            }

            $currentTimestamp = date('Y-m-d H:i:s');

            if ($decision === 'Rejected') {
                $upd = $this->pdo->prepare('
                    UPDATE payments 
                    SET verification_status = "Rejected", verified_by = :admin, verification_date = :v_date 
                    WHERE id = :id
                ');
                $upd->execute(['admin' => $adminEmail, 'v_date' => $currentTimestamp, 'id' => $paymentId]);
                
                $this->logActivity($adminUserId, $adminEmail, 'REJECT_PAYMENT', sprintf('Rejected deposit transaction reference: %s', $payment['reference_no']));
                $this->pdo->commit();
                return true;
            }

            // Decision: Verified
            $receiptNo = 'SIM-REC-' . rand(100000, 999999);

            // Update Payment Slip Record
            $upd = $this->pdo->prepare('
                UPDATE payments 
                SET verification_status = "Verified", verified_by = :admin, verification_date = :v_date, receipt_no = :receipt
                WHERE id = :id
            ');
            $upd->execute([
                'admin'   => $adminEmail,
                'v_date'  => $currentTimestamp,
                'receipt' => $receiptNo,
                'id'      => $paymentId
            ]);

            // Reconcile Invoice Status
            $invUpd = $this->pdo->prepare('UPDATE invoices SET status = "Paid" WHERE id = :invoice_id');
            $invUpd->execute(['invoice_id' => $payment['invoice_id']]);

            // Get Member and Profile details to activate accounts and issue licence seal
            $detailsStmt = $this->pdo->prepare('
                SELECT m.id, m.first_name, m.last_name, m.user_id, m.status, lt.grade_name
                FROM member_profiles m
                JOIN invoices i ON i.member_id = m.id
                JOIN licensing_types lt ON lt.id = m.licensing_type_id
                WHERE i.id = :invoice_id
            ');
            $detailsStmt->execute(['invoice_id' => $payment['invoice_id']]);
            $memberDetails = $detailsStmt->fetch();

            if ($memberDetails) {
                $memberId = (int)$memberDetails['id'];
                
                // Activate member profile
                $memberNo = $memberDetails['member_no'] ?: 'SIM/REG/' . date('Y') . '/' . rand(100, 999);
                $profileUpd = $this->pdo->prepare('
                    UPDATE member_profiles 
                    SET status = "Active", member_no = COALESCE(member_no, :m_no)
                    WHERE id = :id
                ');
                $profileUpd->execute(['m_no' => $memberNo, 'id' => $memberId]);

                // Auto-Issue Annual Practising Licence
                $licNo = 'SIM-LIC-' . date('Y') . '-X' . rand(1000, 9999);
                $financialYear = sprintf('%s/%s', date('Y'), date('Y', strtotime('+1 year')));
                
                $licStmt = $this->pdo->prepare('
                    INSERT INTO licences (member_id, licence_no, financial_year, date_issued, expiry_date, status, qr_code_url)
                    VALUES (:member, :lic_no, :fy, :issued, :expiry, "Active", :qr)
                ');

                $dateIssued = date('Y-07-01'); // SIM standard licensing financial cycle July 1
                $dateExpiry = date('Y-06-30', strtotime('+1 year'));

                $licStmt->execute([
                    'member'  => $memberId,
                    'lic_no'  => $licNo,
                    'fy'      => $financialYear,
                    'issued'  => $dateIssued,
                    'expiry'  => $dateExpiry,
                    'qr'      => 'https://sim.mw/verify/' . urlencode($licNo)
                ]);

                // System Log
                $this->logActivity(
                    $adminUserId, 
                    $adminEmail, 
                    'APPROVE_MEMBER_LICENSE', 
                    sprintf('Approved payment. Profile Activated (%s) and Practice Licence %s issued for John/Patricia/Ellena.', $memberNo, $licNo)
                );
            }

            $this->pdo->commit();
            return true;
        } catch (PDOException|InvalidArgumentException $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }

    /**
     * 4. Log system activities seamlessly.
     */
    public function logActivity(int $userId, string $email, string $action, string $details): void 
    {
        $stmt = $this->pdo->prepare('
            INSERT INTO audit_logs (user_id, user_email, action, details, ip_address) 
            VALUES (:uid, :email, :action, :details, :ip)
        ');
        $stmt->execute([
            'uid'     => $userId,
            'email'   => $email,
            'action'  => $action,
            'details' => $details,
            'ip'      => $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1'
        ]);
    }

    /**
     * 5. Public digital seal certificate verification.
     * PHP 8 matching evaluation checks if active or revoked.
     */
    public function verifyPublicLicence(string $licenceNo): ?array 
    {
        $stmt = $this->pdo->prepare('
            SELECT l.*, m.first_name, m.last_name, m.chapter, m.member_no, lt.grade_name
            FROM licences l
            JOIN member_profiles m ON m.id = l.member_id
            JOIN licensing_types lt ON lt.id = m.licensing_type_id
            WHERE l.licence_no = :lic_no
        ');
        $stmt->execute(['lic_no' => $licenceNo]);
        $licence = $stmt->fetch();

        if (!$licence) {
            return null;
        }

        // Modern Match Expression mapping state definitions
        $statusLabel = match($licence['status']) {
            'Active'  => 'APPROVED PRACTICE LICENSE',
            'Expired' => 'EXPIRED LICENSE',
            'Revoked' => 'REVOKED OR SUSPENDED',
            default   => 'INVALID STATUS'
        };

        return [
            'licenceNo'     => $licence['licence_no'],
            'licensedTo'    => sprintf('%s %s', $licence['first_name'], $licence['last_name']),
            'memberNo'      => $licence['member_no'],
            'chapter'       => $licence['chapter'],
            'grade'         => $licence['grade_name'],
            'financialYear' => $licence['financial_year'],
            'dateIssued'    => $licence['date_issued'],
            'expiryDate'    => $licence['expiry_date'],
            'status'        => $licence['status'],
            'verification'  => $statusLabel
        ];
    }
}
