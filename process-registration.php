<?php
declare(strict_types=1);

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

namespace SIM\Web;

use PDO;
use PDOException;
use RuntimeException;
use InvalidArgumentException;
use SIM\Lib\Database;

// Ensure session is started for secure CSRF validation and state management
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Set secure response headers to protect against clickjacking, XSS, and content sniffing
header('X-Frame-Options: SAMEORIGIN');
header('X-Content-Type-Options: nosniff');
header('X-XSS-Protection: 1; mode=block');

// Define application environment (development / production)
define('APP_ENV', $_ENV['APP_ENV'] ?? getenv('APP_ENV') ?: 'production');

/**
 * Standardized function to respond with JSON for AJAX requests or redirect with session data for standard posts.
 *
 * @param bool $success Whether the operation succeeded
 * @param string $message User-facing feedback message
 * @param array $errors Field-level validation error details
 * @param array $data Supplementary payload data
 */
function sendResponse(bool $success, string $message, array $errors = [], array $data = []): void 
{
    $isAjax = (!empty($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest') 
              || (strpos($_SERVER['HTTP_ACCEPT'] ?? '', 'application/json') !== false);

    if ($isAjax) {
        header('Content-Type: application/json; charset=UTF-8');
        echo json_encode([
            'success' => $success,
            'message' => $message,
            'errors'  => $errors,
            'data'    => $data
        ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        exit();
    }

    // Standard POST-Redirect-Get pattern fallback
    if ($success) {
        $_SESSION['registration_success'] = $message;
        unset($_SESSION['registration_errors']);
        unset($_SESSION['registration_old']);
    } else {
        $_SESSION['registration_errors'] = $errors;
        $_SESSION['registration_errors']['general'] = $message;
        $_SESSION['registration_old'] = $_POST;
    }

    // Redirect back to form page or home registry portal
    $referer = $_SERVER['HTTP_REFERER'] ?? 'member-registration.php';
    header('Location: ' . $referer);
    exit();
}

// 1. Strictly restrict execution to secure POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    sendResponse(false, 'Method Not Allowed. This endpoint only accepts secure POST submissions.');
}

// 2. Validate anti-CSRF token to mitigate cross-site request forgery attacks
$submittedToken = $_POST['csrf_token'] ?? '';
$sessionToken = $_SESSION['csrf_token'] ?? '';

if (empty($sessionToken) || !hash_equals($sessionToken, $submittedToken)) {
    http_response_code(403);
    sendResponse(false, 'Security validation failed. Invalid or expired session token. Please try submitting again.');
}

// 3. Load the secure Database connector class
try {
    require_once __DIR__ . '/src/lib/db.php';
    $db = Database::getInstance();
    $pdo = $db->getConnection();
} catch (Exception $e) {
    error_log('SIM Database connection failed in process-registration.php: ' . $e->getMessage());
    http_response_code(500);
    sendResponse(false, 'We are experiencing temporary database service disruptions. Please try again shortly.');
}

// 4. Sanitize and Extract Input fields
$email = filter_input(INPUT_POST, 'email', FILTER_SANITIZE_EMAIL);
$password = $_POST['password'] ?? '';
$passwordConfirm = $_POST['password_confirm'] ?? '';

$firstName = trim(filter_input(INPUT_POST, 'first_name', FILTER_DEFAULT) ?? '');
$lastName = trim(filter_input(INPUT_POST, 'last_name', FILTER_DEFAULT) ?? '');
$phone = trim(filter_input(INPUT_POST, 'phone', FILTER_DEFAULT) ?? '');

$chapter = trim(filter_input(INPUT_POST, 'chapter', FILTER_DEFAULT) ?? '');
$gradeId = filter_input(INPUT_POST, 'grade_id', FILTER_VALIDATE_INT);
$region = trim(filter_input(INPUT_POST, 'region', FILTER_DEFAULT) ?? '');

$employer = trim(filter_input(INPUT_POST, 'employer', FILTER_DEFAULT) ?? '');
$designation = trim(filter_input(INPUT_POST, 'designation', FILTER_DEFAULT) ?? '');

// 5. Robust Server-Side Validation Rules
$errors = [];

// Name constraints
if (empty($firstName) || strlen($firstName) > 80) {
    $errors['first_name'] = 'First name is required and cannot exceed 80 characters.';
} elseif (!preg_match("/^[a-zA-Z\s'-]+$/", $firstName)) {
    $errors['first_name'] = 'First name contains invalid characters. Only letters, spaces, hyphens and apostrophes allowed.';
}

if (empty($lastName) || strlen($lastName) > 80) {
    $errors['last_name'] = 'Last name is required and cannot exceed 80 characters.';
} elseif (!preg_match("/^[a-zA-Z\s'-]+$/", $lastName)) {
    $errors['last_name'] = 'Last name contains invalid characters. Only letters, spaces, hyphens and apostrophes allowed.';
}

// Email format constraints
if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors['email'] = 'A valid, professional email address is required.';
} elseif (strlen($email) > 150) {
    $errors['email'] = 'Email address must not exceed 150 characters.';
}

// Phone formatting constraints
if (empty($phone)) {
    $errors['phone'] = 'A primary contact phone number is required.';
} elseif (strlen($phone) < 8 || strlen($phone) > 30) {
    $errors['phone'] = 'Please enter a valid telephone contact number.';
}

// Password strength constraints
if (empty($password)) {
    $errors['password'] = 'Security password is required.';
} elseif (strlen($password) < 8) {
    $errors['password'] = 'Access password must be at least 8 characters long for adequate security.';
}

if ($password !== $passwordConfirm) {
    $errors['password_confirm'] = 'The passwords entered do not match.';
}

// Professional domains whitelists (Chapter, region, grade)
$validChapters = ['Land Surveying', 'Quantity Surveying', 'Valuation & Estate Management'];
if (!in_array($chapter, $validChapters, true)) {
    $errors['chapter'] = 'Please select a valid professional chapter within SIM branch registry.';
}

$validRegions = ['Southern', 'Central', 'Northern'];
if (!in_array($region, $validRegions, true)) {
    $errors['region'] = 'Please select a valid geographical region of practice in Malawi.';
}

if ($gradeId === false || $gradeId < 1 || $gradeId > 6) {
    $errors['grade_id'] = 'Please select a valid professional licensing grade level.';
}

// Employer & Designation lengths
if (!empty($employer) && strlen($employer) > 150) {
    $errors['employer'] = 'Employer or Organisation name must not exceed 150 characters.';
}

if (!empty($designation) && strlen($designation) > 100) {
    $errors['designation'] = 'Professional designation title must not exceed 100 characters.';
}

// If any initial validation fails, reject and return immediate feedback
if (!empty($errors)) {
    sendResponse(false, 'Validation failed. Please correct the highlighted errors and try again.', $errors);
}

// 6. DB Security & Integrity Checks (Duplicate Email verification)
try {
    $chkStmt = $pdo->prepare('SELECT id FROM users WHERE email = :email LIMIT 1');
    $chkStmt->execute(['email' => $email]);
    if ($chkStmt->fetch()) {
        $errors['email'] = 'This email address is already registered in the SIM professional database.';
        sendResponse(false, 'The email address is already registered in our registry repository.', $errors);
    }
} catch (PDOException $e) {
    error_log('SIM Duplicate Email Check Error: ' . $e->getMessage());
    sendResponse(false, 'An unexpected server transaction check failed. Please try again.');
}

// 7. Atomic Multi-Table Insertion Transaction
try {
    $pdo->beginTransaction();

    // A. Hash password securely using standard high-grade BCrypt hashing (cost factor 12)
    $passwordHash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);

    // B. Insert into base 'users' auth table
    $userStmt = $pdo->prepare('
        INSERT INTO users (email, password_hash, role) 
        VALUES (:email, :pwd_hash, "Member")
    ');
    $userStmt->execute([
        'email'    => $email,
        'pwd_hash' => $passwordHash
    ]);
    $userId = (int)$pdo->lastInsertId();

    // C. Insert into Role-Based Access Control (RBAC) linking table 'user_roles'
    // Grade ID 6 represents 'Student' which maps to Role ID 5 ('Student Member')
    // Grade IDs 1-5 represent Professional tiers which map to Role ID 4 ('Professional Member')
    $roleId = ($gradeId === 6) ? 5 : 4;
    $roleStmt = $pdo->prepare('
        INSERT INTO user_roles (user_id, role_id) 
        VALUES (:user_id, :role_id)
    ');
    $roleStmt->execute([
        'user_id' => $userId,
        'role_id' => $roleId
    ]);

    // D. Insert into 'member_profiles' registry table (Default status is 'Pending')
    $profileStmt = $pdo->prepare('
        INSERT INTO member_profiles 
        (user_id, licensing_type_id, first_name, last_name, phone, chapter, employer, designation, region, status) 
        VALUES 
        (:user_id, :lic_id, :first, :last, :phone, :chapter, :employer, :designation, :region, "Pending")
    ');
    $profileStmt->execute([
        'user_id'     => $userId,
        'lic_id'      => $gradeId,
        'first'       => $firstName,
        'last'        => $lastName,
        'phone'       => $phone,
        'chapter'     => $chapter,
        'employer'    => $employer ?: null,
        'designation' => $designation ?: null,
        'region'      => $region
    ]);
    $memberId = (int)$pdo->lastInsertId();

    // E. Retreive annual fee and grade names from 'licensing_types' to post correct billing
    $licStmt = $pdo->prepare('SELECT grade_name, annual_fee_mwk FROM licensing_types WHERE id = :id LIMIT 1');
    $licStmt->execute(['id' => $gradeId]);
    $licInfo = $licStmt->fetch();
    
    $gradeName = $licInfo ? $licInfo['grade_name'] : 'Professional Member';
    $annualFee = $licInfo ? (float)$licInfo['annual_fee_mwk'] : 0.00;

    // F. Automatically generate a pending Invoice record for Annual Practising Subscriptions
    $invoiceNo = 'SIM-INV-' . date('Y') . '-' . str_pad((string)rand(10000, 99999), 5, '0', STR_PAD_LEFT);
    $currentYear = date('Y');
    $nextYear = date('Y', strtotime('+1 year'));
    $financialYear = "{$currentYear}/{$nextYear}";
    $invoiceDesc = "Annual Practising Licence Fee ({$gradeName}) {$financialYear}";
    $dueDate = date('Y-m-d', strtotime('+30 days'));

    $invStmt = $pdo->prepare('
        INSERT INTO invoices (member_id, invoice_no, description, amount, due_date, status) 
        VALUES (:member_id, :invoice_no, :description, :amount, :due_date, "Unpaid")
    ');
    $invStmt->execute([
        'member_id'   => $memberId,
        'invoice_no'  => $invoiceNo,
        'description' => $invoiceDesc,
        'amount'      => $annualFee,
        'due_date'    => $dueDate
    ]);

    // G. Generate system audit trail ledger record detailing this administrative action
    $auditStmt = $pdo->prepare('
        INSERT INTO audit_logs (user_id, user_email, action, details, ip_address) 
        VALUES (:uid, :email, "REGISTER_MEMBER", :details, :ip)
    ');
    $auditDetails = sprintf(
        'Self-registration submitted for candidate: %s %s (%s). Assigned base role: %s. Annual billing invoice generated: %s for MWK %s. Status pending validation.',
        $firstName,
        $lastName,
        $chapter,
        ($roleId === 5 ? 'Student Member' : 'Professional Member'),
        $invoiceNo,
        number_format($annualFee, 2)
    );
    $auditStmt->execute([
        'uid'     => $userId,
        'email'   => $email,
        'details' => $auditDetails,
        'ip'      => $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1'
    ]);

    // Commit transaction
    $pdo->commit();

    // Success response!
    $successMessage = "Your registration was successful! Your member profile is set to Pending. " . 
                     "Invoice {$invoiceNo} (MWK " . number_format($annualFee, 2) . ") has been posted to your account. " . 
                     "Please submit your bank deposit slip via the portal to activate your account and practice licence.";
                     
    sendResponse(true, $successMessage, [], ['user_id' => $userId, 'invoice_no' => $invoiceNo]);

} catch (PDOException $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }

    // Log error internally
    error_log('SIM Web Registry Registration SQL Failure: ' . $e->getMessage() . ' Trace: ' . $e->getTraceAsString());

    if (APP_ENV === 'development') {
        $dbError = 'Database execution failed: ' . $e->getMessage();
    } else {
        $dbError = 'A database transaction exception occurred. The database ledger was successfully rolled back to protect registry integrity. Our administrators have been notified.';
    }

    sendResponse(false, $dbError, ['db' => $dbError]);
}
