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

// Ensure session is started for secure CSRF protection and state management
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Generate secure CSRF token if not already present
if (empty($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}

// Environment settings
define('APP_ENV', $_ENV['APP_ENV'] ?? 'development');

/**
 * Handle form submission securely
 */
$errors = [];
$successMessage = null;
$oldInput = [];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // 1. Verify CSRF Token
    $submittedToken = $_POST['csrf_token'] ?? '';
    if (!hash_equals($_SESSION['csrf_token'], $submittedToken)) {
        $errors['csrf'] = 'Invalid session token. Please try submitting the form again.';
    } else {
        // 2. Extract and Sanitize Inputs
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

        // Persist inputs to re-populate the form on validation failure
        $oldInput = [
            'email' => $email,
            'first_name' => $firstName,
            'last_name' => $lastName,
            'phone' => $phone,
            'chapter' => $chapter,
            'grade_id' => $gradeId,
            'region' => $region,
            'employer' => $employer,
            'designation' => $designation
        ];

        // 3. Robust Input Validation
        if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $errors['email'] = 'Please enter a valid email address.';
        }
        if (strlen($password) < 8) {
            $errors['password'] = 'Password must be at least 8 characters long.';
        }
        if ($password !== $passwordConfirm) {
            $errors['password_confirm'] = 'Passwords do not match.';
        }
        if (empty($firstName) || strlen($firstName) > 80) {
            $errors['first_name'] = 'First name is required and must not exceed 80 characters.';
        }
        if (empty($lastName) || strlen($lastName) > 80) {
            $errors['last_name'] = 'Last name is required and must not exceed 80 characters.';
        }
        if (empty($phone)) {
            $errors['phone'] = 'A contact phone number is required.';
        }
        
        // Match expression for white-listing valid chapters
        $isValidChapter = match($chapter) {
            'Land Surveying', 'Quantity Surveying', 'Valuation & Estate Management' => true,
            default => false
        };
        if (!$isValidChapter) {
            $errors['chapter'] = 'Please select a valid professional chapter.';
        }

        // Match expression for white-listing valid regions
        $isValidRegion = match($region) {
            'Southern', 'Central', 'Northern' => true,
            default => false
        };
        if (!$isValidRegion) {
            $errors['region'] = 'Please select a valid regional zone.';
        }

        if ($gradeId === false || $gradeId < 1 || $gradeId > 6) {
            $errors['grade_id'] = 'Please select a valid professional grade.';
        }

        // 4. Database Transaction
        if (empty($errors)) {
            try {
                // Read database credentials from environment (or standard fallback)
                $dbHost = $_ENV['DB_HOST'] ?? '127.0.0.1';
                $dbPort = (int)($_ENV['DB_PORT'] ?? 3306);
                $dbName = $_ENV['DB_NAME'] ?? 'surveyors_institute_malawi';
                $dbUser = $_ENV['DB_USER'] ?? 'root';
                $dbPass = $_ENV['DB_PASS'] ?? '';

                $dsn = sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4', $dbHost, $dbPort, $dbName);
                $pdo = new PDO($dsn, $dbUser, $dbPass, [
                    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES   => false,
                ]);

                // Begin database transaction for dual tables insertion
                $pdo->beginTransaction();

                // Check duplicate email
                $dupStmt = $pdo->prepare('SELECT id FROM users WHERE email = :email');
                $dupStmt->execute(['email' => $email]);
                if ($dupStmt->fetch()) {
                    $errors['email'] = 'E-mail address is already registered in the SIM database.';
                    $pdo->rollBack();
                } else {
                    // Hash password using secure bcrypt algorithm
                    $passwordHash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);

                    // Insert into users
                    $userStmt = $pdo->prepare('INSERT INTO users (email, password_hash, role) VALUES (:email, :pwd, "Member")');
                    $userStmt->execute([
                        'email' => $email,
                        'pwd'   => $passwordHash
                    ]);
                    $userId = (int)$pdo->lastInsertId();

                    // Insert into member_profiles
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

                    // Generate system audit log entry
                    $auditStmt = $pdo->prepare('
                        INSERT INTO audit_logs (user_id, user_email, action, details, ip_address) 
                        VALUES (:uid, :email, "REGISTER_MEMBER", :details, :ip)
                    ');
                    $auditDetails = sprintf('Web self-registration submitted for %s %s (%s). Pending secretariat evaluation.', $firstName, $lastName, $chapter);
                    $auditStmt->execute([
                        'uid'     => $userId,
                        'email'   => $email,
                        'details' => $auditDetails,
                        'ip'      => $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1'
                    ]);

                    // Commit transaction
                    $pdo->commit();
                    $successMessage = "Your registration was successful! Please log in to your dashboard to pay subscriptions and apply for your annual practicing licence.";
                    $oldInput = []; // Clear old input values
                }

            } catch (PDOException $e) {
                if (isset($pdo) && $pdo->inTransaction()) {
                    $pdo->rollBack();
                }
                
                // Secure Error logging
                error_log('SIM Web Member Registration DB Failure: ' . $e->getMessage());

                if (APP_ENV === 'development') {
                    $errors['db'] = 'Database error: ' . $e->getMessage();
                } else {
                    $errors['db'] = 'A database transaction error occurred. The technical support team has been notified. Please try again later.';
                }
            }
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Member Registration - Surveyors Institute of Malawi</title>
    <!-- Tailwind CSS CDN -->
    <script src="https://cdn.tailwindcss.com"></script>
    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Inter', sans-serif;
        }
    </style>
</head>
<body class="bg-slate-50 min-h-screen text-slate-900 selection:bg-amber-500 selection:text-slate-950">

    <!-- HEADER / NAVIGATION -->
    <header class="bg-slate-950 text-white py-4 px-6 shadow-md border-b border-amber-500/20">
        <div class="max-w-6xl mx-auto flex justify-between items-center">
            <div class="flex items-center space-x-3">
                <div class="bg-amber-500 text-slate-950 p-2 rounded-lg font-extrabold tracking-wider text-sm">
                    SIM
                </div>
                <div>
                    <span class="font-extrabold text-sm tracking-tight block uppercase">Surveyors Institute of Malawi</span>
                    <span class="text-[10px] text-amber-400 font-semibold tracking-wider uppercase block -mt-1">Professional Registry Web Gate</span>
                </div>
            </div>
            <a href="/" class="text-xs text-slate-300 hover:text-white font-medium transition-colors">
                &larr; Back to Portal Home
            </a>
        </div>
    </header>

    <!-- MAIN FRAME -->
    <main class="max-w-xl mx-auto py-12 px-4 sm:px-6">
        <div class="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            
            <!-- Banner Decoration -->
            <div class="h-2 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600"></div>

            <div class="p-8 space-y-6">
                <!-- Portal Titles -->
                <div class="text-center space-y-2">
                    <h1 class="text-2xl font-extrabold text-slate-950 tracking-tight">Professional Self-Registration</h1>
                    <p class="text-xs text-slate-500 max-w-sm mx-auto">
                        Submit credentials to the national database registry. Your membership status will remain <span class="font-bold text-amber-600">Pending</span> until payment slip validation.
                    </p>
                </div>

                <!-- Success Banner -->
                <?php if ($successMessage): ?>
                    <div class="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-4 text-xs font-medium space-y-1">
                        <span class="font-bold block uppercase tracking-wider text-[10px] text-emerald-600">Success Status</span>
                        <p><?php echo htmlspecialchars($successMessage, ENT_QUOTES, 'UTF-8'); ?></p>
                    </div>
                <?php endif; ?>

                <!-- General Database/System Errors -->
                <?php if (isset($errors['db'])): ?>
                    <div class="bg-red-50 border border-red-200 text-red-800 rounded-xl p-4 text-xs font-medium">
                        <span class="font-bold block uppercase tracking-wider text-[10px] text-red-600">Database Connection Failure</span>
                        <p><?php echo htmlspecialchars($errors['db'], ENT_QUOTES, 'UTF-8'); ?></p>
                    </div>
                <?php endif; ?>

                <?php if (isset($errors['csrf'])): ?>
                    <div class="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4 text-xs font-medium">
                        <span class="font-bold block uppercase tracking-wider text-[10px] text-amber-600">Security Exception</span>
                        <p><?php echo htmlspecialchars($errors['csrf'], ENT_QUOTES, 'UTF-8'); ?></p>
                    </div>
                <?php endif; ?>

                <!-- REGISTRATION SECURE FORM -->
                <form action="<?php echo htmlspecialchars($_SERVER['PHP_SELF'], ENT_QUOTES, 'UTF-8'); ?>" method="POST" class="space-y-5 text-xs">
                    
                    <!-- Secure CSRF Token -->
                    <input type="hidden" name="csrf_token" value="<?php echo htmlspecialchars($_SESSION['csrf_token'], ENT_QUOTES, 'UTF-8'); ?>">

                    <!-- Personal Information Subheading -->
                    <div class="border-b border-slate-100 pb-2">
                        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">1. Identity & Credentials</span>
                    </div>

                    <!-- First & Last Name -->
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div class="space-y-1">
                            <label for="first_name" class="font-bold text-slate-700">First Name <span class="text-red-500">*</span></label>
                            <input 
                                type="text" 
                                id="first_name" 
                                name="first_name" 
                                required 
                                value="<?php echo htmlspecialchars($oldInput['first_name'] ?? '', ENT_QUOTES, 'UTF-8'); ?>" 
                                placeholder="e.g. John" 
                                class="w-full px-3 py-2 bg-slate-50 border rounded-lg focus:outline-none focus:border-amber-500 focus:bg-white <?php echo isset($errors['first_name']) ? 'border-red-500 bg-red-50' : 'border-slate-200'; ?>"
                            >
                            <?php if (isset($errors['first_name'])): ?>
                                <p class="text-red-500 text-[10px]"><?php echo $errors['first_name']; ?></p>
                            <?php endif; ?>
                        </div>
                        <div class="space-y-1">
                            <label for="last_name" class="font-bold text-slate-700">Last Name <span class="text-red-500">*</span></label>
                            <input 
                                type="text" 
                                id="last_name" 
                                name="last_name" 
                                required 
                                value="<?php echo htmlspecialchars($oldInput['last_name'] ?? '', ENT_QUOTES, 'UTF-8'); ?>" 
                                placeholder="e.g. Banda" 
                                class="w-full px-3 py-2 bg-slate-50 border rounded-lg focus:outline-none focus:border-amber-500 focus:bg-white <?php echo isset($errors['last_name']) ? 'border-red-500 bg-red-50' : 'border-slate-200'; ?>"
                            >
                            <?php if (isset($errors['last_name'])): ?>
                                <p class="text-red-500 text-[10px]"><?php echo $errors['last_name']; ?></p>
                            <?php endif; ?>
                        </div>
                    </div>

                    <!-- Email & Phone Contact -->
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div class="space-y-1">
                            <label for="email" class="font-bold text-slate-700">Email Address <span class="text-red-500">*</span></label>
                            <input 
                                type="email" 
                                id="email" 
                                name="email" 
                                required 
                                value="<?php echo htmlspecialchars($oldInput['email'] ?? '', ENT_QUOTES, 'UTF-8'); ?>" 
                                placeholder="e.g. john.banda@gmail.com" 
                                class="w-full px-3 py-2 bg-slate-50 border rounded-lg focus:outline-none focus:border-amber-500 focus:bg-white <?php echo isset($errors['email']) ? 'border-red-500 bg-red-50' : 'border-slate-200'; ?>"
                            >
                            <?php if (isset($errors['email'])): ?>
                                <p class="text-red-500 text-[10px]"><?php echo $errors['email']; ?></p>
                            <?php endif; ?>
                        </div>
                        <div class="space-y-1">
                            <label for="phone" class="font-bold text-slate-700">Contact Phone Number <span class="text-red-500">*</span></label>
                            <input 
                                type="text" 
                                id="phone" 
                                name="phone" 
                                required 
                                value="<?php echo htmlspecialchars($oldInput['phone'] ?? '', ENT_QUOTES, 'UTF-8'); ?>" 
                                placeholder="e.g. +265 888 123 456" 
                                class="w-full px-3 py-2 bg-slate-50 border rounded-lg focus:outline-none focus:border-amber-500 focus:bg-white <?php echo isset($errors['phone']) ? 'border-red-500 bg-red-50' : 'border-slate-200'; ?>"
                            >
                            <?php if (isset($errors['phone'])): ?>
                                <p class="text-red-500 text-[10px]"><?php echo $errors['phone']; ?></p>
                            <?php endif; ?>
                        </div>
                    </div>

                    <!-- Secure Passwords fields -->
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                        <div class="space-y-1">
                            <label for="password" class="font-bold text-slate-700">Password <span class="text-red-500">*</span></label>
                            <input 
                                type="password" 
                                id="password" 
                                name="password" 
                                required 
                                placeholder="••••••••" 
                                class="w-full px-3 py-2 bg-white border rounded-lg focus:outline-none focus:border-amber-500 <?php echo isset($errors['password']) ? 'border-red-500' : 'border-slate-200'; ?>"
                            >
                            <?php if (isset($errors['password'])): ?>
                                <p class="text-red-500 text-[10px]"><?php echo $errors['password']; ?></p>
                            <?php endif; ?>
                        </div>
                        <div class="space-y-1">
                            <label for="password_confirm" class="font-bold text-slate-700">Confirm Password <span class="text-red-500">*</span></label>
                            <input 
                                type="password" 
                                id="password_confirm" 
                                name="password_confirm" 
                                required 
                                placeholder="••••••••" 
                                class="w-full px-3 py-2 bg-white border rounded-lg focus:outline-none focus:border-amber-500 <?php echo isset($errors['password_confirm']) ? 'border-red-500' : 'border-slate-200'; ?>"
                            >
                            <?php if (isset($errors['password_confirm'])): ?>
                                <p class="text-red-500 text-[10px]"><?php echo $errors['password_confirm']; ?></p>
                            <?php endif; ?>
                        </div>
                    </div>

                    <!-- Professional Domain Subheading -->
                    <div class="border-b border-slate-100 pb-2 pt-2">
                        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">2. Professional Chapter & Grading</span>
                    </div>

                    <!-- Chapter & Grade -->
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div class="space-y-1">
                            <label for="chapter" class="font-bold text-slate-700">Professional Chapter <span class="text-red-500">*</span></label>
                            <select 
                                id="chapter" 
                                name="chapter" 
                                required 
                                class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500 focus:bg-white focus:ring-0"
                            >
                                <option value="">Select Chapter</option>
                                <option value="Land Surveying" <?php echo (isset($oldInput['chapter']) && $oldInput['chapter'] === 'Land Surveying') ? 'selected' : ''; ?>>Land Surveying</option>
                                <option value="Quantity Surveying" <?php echo (isset($oldInput['chapter']) && $oldInput['chapter'] === 'Quantity Surveying') ? 'selected' : ''; ?>>Quantity Surveying</option>
                                <option value="Valuation & Estate Management" <?php echo (isset($oldInput['chapter']) && $oldInput['chapter'] === 'Valuation & Estate Management') ? 'selected' : ''; ?>>Valuation & Estate Management</option>
                            </select>
                            <?php if (isset($errors['chapter'])): ?>
                                <p class="text-red-500 text-[10px]"><?php echo $errors['chapter']; ?></p>
                            <?php endif; ?>
                        </div>
                        <div class="space-y-1">
                            <label for="grade_id" class="font-bold text-slate-700">Professional Grade / Level <span class="text-red-500">*</span></label>
                            <select 
                                id="grade_id" 
                                name="grade_id" 
                                required 
                                class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500 focus:bg-white focus:ring-0"
                            >
                                <option value="">Select Grade</option>
                                <option value="1" <?php echo (isset($oldInput['grade_id']) && $oldInput['grade_id'] === 1) ? 'selected' : ''; ?>>Fellow (Annual Dues: MWK 350,000)</option>
                                <option value="2" <?php echo (isset($oldInput['grade_id']) && $oldInput['grade_id'] === 2) ? 'selected' : ''; ?>>Professional (Annual Dues: MWK 250,000)</option>
                                <option value="3" <?php echo (isset($oldInput['grade_id']) && $oldInput['grade_id'] === 3) ? 'selected' : ''; ?>>Associate (Annual Dues: MWK 200,000)</option>
                                <option value="4" <?php echo (isset($oldInput['grade_id']) && $oldInput['grade_id'] === 4) ? 'selected' : ''; ?>>Graduate (Annual Dues: MWK 150,000)</option>
                                <option value="5" <?php echo (isset($oldInput['grade_id']) && $oldInput['grade_id'] === 5) ? 'selected' : ''; ?>>Technician (Annual Dues: MWK 100,000)</option>
                                <option value="6" <?php echo (isset($oldInput['grade_id']) && $oldInput['grade_id'] === 6) ? 'selected' : ''; ?>>Student (Annual Dues: MWK 10,000)</option>
                            </select>
                            <?php if (isset($errors['grade_id'])): ?>
                                <p class="text-red-500 text-[10px]"><?php echo $errors['grade_id']; ?></p>
                            <?php endif; ?>
                        </div>
                    </div>

                    <!-- Region of Practice & Employer details -->
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div class="space-y-1">
                            <label for="region" class="font-bold text-slate-700">Region of Primary Practice <span class="text-red-500">*</span></label>
                            <select 
                                id="region" 
                                name="region" 
                                required 
                                class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500 focus:bg-white"
                            >
                                <option value="">Select Region</option>
                                <option value="Southern" <?php echo (isset($oldInput['region']) && $oldInput['region'] === 'Southern') ? 'selected' : ''; ?>>Southern Region</option>
                                <option value="Central" <?php echo (isset($oldInput['region']) && $oldInput['region'] === 'Central') ? 'selected' : ''; ?>>Central Region</option>
                                <option value="Northern" <?php echo (isset($oldInput['region']) && $oldInput['region'] === 'Northern') ? 'selected' : ''; ?>>Northern Region</option>
                            </select>
                            <?php if (isset($errors['region'])): ?>
                                <p class="text-red-500 text-[10px]"><?php echo $errors['region']; ?></p>
                            <?php endif; ?>
                        </div>
                        <div class="space-y-1">
                            <label for="employer" class="font-bold text-slate-700">Employer / Organisation</label>
                            <input 
                                type="text" 
                                id="employer" 
                                name="employer" 
                                value="<?php echo htmlspecialchars($oldInput['employer'] ?? '', ENT_QUOTES, 'UTF-8'); ?>" 
                                placeholder="e.g. Ministry of Lands / Self-Employed" 
                                class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500 focus:bg-white"
                            >
                        </div>
                    </div>

                    <div class="space-y-1">
                        <label for="designation" class="font-bold text-slate-700">Professional Title / Designation</label>
                        <input 
                            type="text" 
                            id="designation" 
                            name="designation" 
                            value="<?php echo htmlspecialchars($oldInput['designation'] ?? '', ENT_QUOTES, 'UTF-8'); ?>" 
                            placeholder="e.g. Senior Quantity Surveyor / Associate Partner" 
                            class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500 focus:bg-white"
                        >
                    </div>

                    <!-- Authorization Term Box -->
                    <div class="bg-amber-50/50 border border-amber-200/50 p-4 rounded-xl space-y-2 mt-4">
                        <span class="text-[10px] font-extrabold text-amber-800 tracking-wider uppercase block">Institute Registry Declarations:</span>
                        <p class="text-[10px] text-amber-700 leading-relaxed font-medium">
                            By clicking below, you submit true credentials as defined in the Malawi Land Surveyors Act (Cap 59:03). Providing false statements triggers disciplinary investigations. An unpaid annual invoice will be posted to your member profile upon register approval.
                        </p>
                    </div>

                    <button 
                        type="submit"
                        class="w-full py-3 bg-slate-950 hover:bg-slate-800 text-white font-extrabold rounded-lg tracking-wider transition-all duration-200 shadow-md uppercase text-2xs hover:shadow-lg"
                    >
                        SUBMIT PROFESSIONAL REGISTRATION
                    </button>

                </form>
            </div>
        </div>
    </main>

    <!-- FOOTER -->
    <footer class="bg-slate-900 text-slate-400 text-center py-6 text-[10px] border-t border-slate-800">
        <div class="max-w-6xl mx-auto px-4 space-y-1 font-medium">
            <p>&copy; <?php echo date('Y'); ?> Surveyors Institute of Malawi (SIM) Secretariat. All Rights Reserved.</p>
            <p class="text-slate-500 font-mono">Malawi Professional Registry Database Gate Version 2.6.4 (PHP 8.1+ Production)</p>
        </div>
    </footer>

</body>
</html>
