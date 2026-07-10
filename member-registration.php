<?php
declare(strict_types=1);

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

namespace SIM\Web;

// Ensure session is started for secure state management & CSRF protection
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Generate secure anti-CSRF token if not already present
if (empty($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}

// Retrieve flash messages from session redirects (after processing in process-registration.php)
$successMessage = $_SESSION['registration_success'] ?? null;
$errors = $_SESSION['registration_errors'] ?? [];
$oldInput = $_SESSION['registration_old'] ?? [];

// Clear flash messages so they do not persist on subsequent page refreshes
unset($_SESSION['registration_success']);
unset($_SESSION['registration_errors']);
unset($_SESSION['registration_old']);
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Member Registration - Surveyors Institute of Malawi</title>
    <!-- Bootstrap 5 CSS CDN -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet" crossorigin="anonymous">
    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Inter', sans-serif;
            background-color: #f8f9fa;
        }
        .header-banner {
            background-color: #0f172a;
            border-bottom: 3px solid #f59e0b;
        }
        .register-card {
            border: 1px solid #e2e8f0;
            border-radius: 1rem;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }
        .btn-slate-dark {
            background-color: #0f172a;
            color: #ffffff;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
        .btn-slate-dark:hover {
            background-color: #1e293b;
            color: #ffffff;
        }
        .form-label {
            font-weight: 600;
            color: #475569;
            font-size: 0.8rem;
        }
    </style>
</head>
<body>

    <!-- NAV BAR HEADER -->
    <header class="header-banner text-white py-3">
        <div class="container d-flex justify-content-between align-items-center">
            <div class="d-flex align-items-center">
                <div class="bg-warning text-dark px-2.5 py-1 rounded-3 font-weight-bold me-3" style="font-weight: 900; font-size: 0.9rem;">
                    SIM
                </div>
                <div>
                    <h1 class="h6 mb-0 text-uppercase fw-bold text-white tracking-tight">Surveyors Institute of Malawi</h1>
                    <small class="text-warning d-block font-mono" style="font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.1em;">Professional Registry Gate</small>
                </div>
            </div>
            <a href="/" class="btn btn-outline-light btn-sm font-weight-bold" style="font-size: 0.75rem;">
                &larr; Portal Home
            </a>
        </div>
    </header>

    <!-- MAIN CARD WRAPPER -->
    <main class="container py-5" style="max-w: 650px;">
        <div class="row justify-content-center">
            <div class="col-lg-8 col-md-10">
                <div class="card register-card bg-white overflow-hidden">
                    <div class="card-body p-4 p-md-5">

                        <!-- Titles -->
                        <div class="text-center mb-4">
                            <h2 class="h4 fw-bold text-dark tracking-tight mb-2">Professional Self-Registration</h2>
                            <p class="text-muted" style="font-size: 0.75rem;">
                                Enter legal details as defined in the Malawi Land Surveyors Act (Cap 59:03). Account status remains <span class="text-warning fw-bold">Pending</span> until bank deposit audit.
                            </p>
                        </div>

                        <!-- Success Alert Message -->
                        <?php if ($successMessage): ?>
                            <div class="alert alert-success d-flex flex-column" role="alert" style="font-size: 0.75rem;">
                                <strong class="text-uppercase tracking-wider mb-1" style="font-size: 0.65rem;">Registry Success</strong>
                                <div><?php echo htmlspecialchars($successMessage, ENT_QUOTES, 'UTF-8'); ?></div>
                            </div>
                        <?php endif; ?>

                        <!-- Standard Database Exception Handling / General Failures -->
                        <?php if (isset($errors['general'])): ?>
                            <div class="alert alert-danger d-flex flex-column" role="alert" style="font-size: 0.75rem;">
                                <strong class="text-uppercase tracking-wider mb-1" style="font-size: 0.65rem;">Registration Failed</strong>
                                <div><?php echo htmlspecialchars($errors['general'], ENT_QUOTES, 'UTF-8'); ?></div>
                            </div>
                        <?php endif; ?>

                        <?php if (isset($errors['db'])): ?>
                            <div class="alert alert-danger d-flex flex-column" role="alert" style="font-size: 0.75rem;">
                                <strong class="text-uppercase tracking-wider mb-1" style="font-size: 0.65rem;">Database System Exception</strong>
                                <div><?php echo htmlspecialchars($errors['db'], ENT_QUOTES, 'UTF-8'); ?></div>
                            </div>
                        <?php endif; ?>

                        <!-- Session Security Validation Error -->
                        <?php if (isset($errors['csrf'])): ?>
                            <div class="alert alert-warning d-flex flex-column" role="alert" style="font-size: 0.75rem;">
                                <strong class="text-uppercase tracking-wider mb-1" style="font-size: 0.65rem;">CSRF Security Validation Warning</strong>
                                <div><?php echo htmlspecialchars($errors['csrf'], ENT_QUOTES, 'UTF-8'); ?></div>
                            </div>
                        <?php endif; ?>

                        <!-- BOOTSTRAP FORM WITH CLIENT-SIDE VALIDATION -->
                        <form action="process-registration.php" method="POST" class="needs-validation" novalidate style="font-size: 0.8rem;">
                            
                            <!-- Secure CSRF Token -->
                            <input type="hidden" name="csrf_token" value="<?php echo htmlspecialchars($_SESSION['csrf_token'], ENT_QUOTES, 'UTF-8'); ?>">

                            <div class="border-bottom border-light pb-2 mb-3">
                                <span class="text-muted text-uppercase tracking-wider font-weight-bold" style="font-size: 0.6rem; font-weight: 700;">1. Personal Details</span>
                            </div>

                            <!-- First Name & Last Name -->
                            <div class="row g-3 mb-3">
                                <div class="col-sm-6">
                                    <label for="first_name" class="form-label">First Name <span class="text-danger">*</span></label>
                                    <input 
                                        type="text" 
                                        class="form-control form-control-sm <?php echo isset($errors['first_name']) ? 'is-invalid' : ''; ?>" 
                                        id="first_name" 
                                        name="first_name" 
                                        required 
                                        maxlength="80" 
                                        value="<?php echo htmlspecialchars($oldInput['first_name'] ?? '', ENT_QUOTES, 'UTF-8'); ?>" 
                                        placeholder="John"
                                    >
                                    <div class="invalid-feedback">First name is required (max 80 chars).</div>
                                    <?php if (isset($errors['first_name'])): ?>
                                        <div class="text-danger mt-1" style="font-size: 0.7rem;"><?php echo $errors['first_name']; ?></div>
                                    <?php endif; ?>
                                </div>
                                <div class="col-sm-6">
                                    <label for="last_name" class="form-label">Last Name <span class="text-danger">*</span></label>
                                    <input 
                                        type="text" 
                                        class="form-control form-control-sm <?php echo isset($errors['last_name']) ? 'is-invalid' : ''; ?>" 
                                        id="last_name" 
                                        name="last_name" 
                                        required 
                                        maxlength="80" 
                                        value="<?php echo htmlspecialchars($oldInput['last_name'] ?? '', ENT_QUOTES, 'UTF-8'); ?>" 
                                        placeholder="Banda"
                                    >
                                    <div class="invalid-feedback">Last name is required (max 80 chars).</div>
                                    <?php if (isset($errors['last_name'])): ?>
                                        <div class="text-danger mt-1" style="font-size: 0.7rem;"><?php echo $errors['last_name']; ?></div>
                                    <?php endif; ?>
                                </div>
                            </div>

                            <!-- Email Address & Phone Number -->
                            <div class="row g-3 mb-3">
                                <div class="col-sm-6">
                                    <label for="email" class="form-label">Email Address <span class="text-danger">*</span></label>
                                    <input 
                                        type="email" 
                                        class="form-control form-control-sm <?php echo isset($errors['email']) ? 'is-invalid' : ''; ?>" 
                                        id="email" 
                                        name="email" 
                                        required 
                                        value="<?php echo htmlspecialchars($oldInput['email'] ?? '', ENT_QUOTES, 'UTF-8'); ?>" 
                                        placeholder="j.banda@gmail.com"
                                    >
                                    <div class="invalid-feedback">Please enter a valid email address.</div>
                                    <?php if (isset($errors['email'])): ?>
                                        <div class="text-danger mt-1" style="font-size: 0.7rem;"><?php echo $errors['email']; ?></div>
                                    <?php endif; ?>
                                </div>
                                <div class="col-sm-6">
                                    <label for="phone" class="form-label">Contact Phone Number <span class="text-danger">*</span></label>
                                    <input 
                                        type="text" 
                                        class="form-control form-control-sm <?php echo isset($errors['phone']) ? 'is-invalid' : ''; ?>" 
                                        id="phone" 
                                        name="phone" 
                                        required 
                                        value="<?php echo htmlspecialchars($oldInput['phone'] ?? '', ENT_QUOTES, 'UTF-8'); ?>" 
                                        placeholder="+265 888 123 456"
                                    >
                                    <div class="invalid-feedback">Contact phone number is required.</div>
                                    <?php if (isset($errors['phone'])): ?>
                                        <div class="text-danger mt-1" style="font-size: 0.7rem;"><?php echo $errors['phone']; ?></div>
                                    <?php endif; ?>
                                </div>
                            </div>

                            <!-- Passwords Block -->
                            <div class="row g-3 p-3 mb-4 rounded border" style="background-color: #f8fafc;">
                                <div class="col-sm-6">
                                    <label for="password" class="form-label">Secure Access Password <span class="text-danger">*</span></label>
                                    <input 
                                        type="password" 
                                        class="form-control form-control-sm <?php echo isset($errors['password']) ? 'is-invalid' : ''; ?>" 
                                        id="password" 
                                        name="password" 
                                        required 
                                        minlength="8" 
                                        placeholder="••••••••"
                                    >
                                    <div class="invalid-feedback">Secure passwords must contain at least 8 characters.</div>
                                    <?php if (isset($errors['password'])): ?>
                                        <div class="text-danger mt-1" style="font-size: 0.7rem;"><?php echo $errors['password']; ?></div>
                                    <?php endif; ?>
                                </div>
                                <div class="col-sm-6">
                                    <label for="password_confirm" class="form-label">Confirm Password <span class="text-danger">*</span></label>
                                    <input 
                                        type="password" 
                                        class="form-control form-control-sm <?php echo isset($errors['password_confirm']) ? 'is-invalid' : ''; ?>" 
                                        id="password_confirm" 
                                        name="password_confirm" 
                                        required 
                                        placeholder="••••••••"
                                    >
                                    <div class="invalid-feedback">Passwords must match.</div>
                                    <?php if (isset($errors['password_confirm'])): ?>
                                        <div class="text-danger mt-1" style="font-size: 0.7rem;"><?php echo $errors['password_confirm']; ?></div>
                                    <?php endif; ?>
                                </div>
                            </div>

                            <div class="border-bottom border-light pb-2 mb-3">
                                <span class="text-muted text-uppercase tracking-wider font-weight-bold" style="font-size: 0.6rem; font-weight: 700;">2. Chapter & Professional Grade</span>
                            </div>

                            <!-- Professional Chapter & Grade Level -->
                            <div class="row g-3 mb-3">
                                <div class="col-sm-6">
                                    <label for="chapter" class="form-label">Institute Chapter <span class="text-danger">*</span></label>
                                    <select class="form-select form-select-sm" id="chapter" name="chapter" required>
                                        <option value="">Select Chapter...</option>
                                        <option value="Land Surveying" <?php echo (isset($oldInput['chapter']) && $oldInput['chapter'] === 'Land Surveying') ? 'selected' : ''; ?>>Land Surveying</option>
                                        <option value="Quantity Surveying" <?php echo (isset($oldInput['chapter']) && $oldInput['chapter'] === 'Quantity Surveying') ? 'selected' : ''; ?>>Quantity Surveying</option>
                                        <option value="Valuation & Estate Management" <?php echo (isset($oldInput['chapter']) && $oldInput['chapter'] === 'Valuation & Estate Management') ? 'selected' : ''; ?>>Valuation & Estate Management</option>
                                    </select>
                                    <div class="invalid-feedback">Please choose your professional branch.</div>
                                    <?php if (isset($errors['chapter'])): ?>
                                        <div class="text-danger mt-1" style="font-size: 0.7rem;"><?php echo $errors['chapter']; ?></div>
                                    <?php endif; ?>
                                </div>
                                <div class="col-sm-6">
                                    <label for="grade_id" class="form-label">Licensing Grade Level <span class="text-danger">*</span></label>
                                    <select class="form-select form-select-sm" id="grade_id" name="grade_id" required>
                                        <option value="">Choose Grade...</option>
                                        <option value="1" <?php echo (isset($oldInput['grade_id']) && $oldInput['grade_id'] === 1) ? 'selected' : ''; ?>>Fellow (Annual Fee: MWK 350,000)</option>
                                        <option value="2" <?php echo (isset($oldInput['grade_id']) && $oldInput['grade_id'] === 2) ? 'selected' : ''; ?>>Professional (Annual Fee: MWK 250,000)</option>
                                        <option value="3" <?php echo (isset($oldInput['grade_id']) && $oldInput['grade_id'] === 3) ? 'selected' : ''; ?>>Associate (Annual Fee: MWK 200,000)</option>
                                        <option value="4" <?php echo (isset($oldInput['grade_id']) && $oldInput['grade_id'] === 4) ? 'selected' : ''; ?>>Graduate (Annual Fee: MWK 150,000)</option>
                                        <option value="5" <?php echo (isset($oldInput['grade_id']) && $oldInput['grade_id'] === 5) ? 'selected' : ''; ?>>Technician (Annual Fee: MWK 100,000)</option>
                                        <option value="6" <?php echo (isset($oldInput['grade_id']) && $oldInput['grade_id'] === 6) ? 'selected' : ''; ?>>Student (Annual Fee: MWK 10,000)</option>
                                    </select>
                                    <div class="invalid-feedback">Please select your grade level.</div>
                                    <?php if (isset($errors['grade_id'])): ?>
                                        <div class="text-danger mt-1" style="font-size: 0.7rem;"><?php echo $errors['grade_id']; ?></div>
                                    <?php endif; ?>
                                </div>
                            </div>

                            <!-- Region & Organisation details -->
                            <div class="row g-3 mb-3">
                                <div class="col-sm-6">
                                    <label for="region" class="form-label">Primary Practice Region <span class="text-danger">*</span></label>
                                    <select class="form-select form-select-sm" id="region" name="region" required>
                                        <option value="">Choose Region...</option>
                                        <option value="Southern" <?php echo (isset($oldInput['region']) && $oldInput['region'] === 'Southern') ? 'selected' : ''; ?>>Southern Region</option>
                                        <option value="Central" <?php echo (isset($oldInput['region']) && $oldInput['region'] === 'Central') ? 'selected' : ''; ?>>Central Region</option>
                                        <option value="Northern" <?php echo (isset($oldInput['region']) && $oldInput['region'] === 'Northern') ? 'selected' : ''; ?>>Northern Region</option>
                                    </select>
                                    <div class="invalid-feedback">Select your home practice region.</div>
                                    <?php if (isset($errors['region'])): ?>
                                        <div class="text-danger mt-1" style="font-size: 0.7rem;"><?php echo $errors['region']; ?></div>
                                    <?php endif; ?>
                                </div>
                                <div class="col-sm-6">
                                    <label for="employer" class="form-label">Current Employer / Firm Name</label>
                                    <input 
                                        type="text" 
                                        class="form-control form-control-sm" 
                                        id="employer" 
                                        name="employer" 
                                        value="<?php echo htmlspecialchars($oldInput['employer'] ?? '', ENT_QUOTES, 'UTF-8'); ?>" 
                                        placeholder="e.g. Ministry of Lands / Self-Employed"
                                    >
                                </div>
                            </div>

                            <!-- Title Designation -->
                            <div class="mb-4">
                                <label for="designation" class="form-label">Professional Designation / Title</label>
                                <input 
                                    type="text" 
                                    class="form-control form-control-sm" 
                                    id="designation" 
                                    name="designation" 
                                    value="<?php echo htmlspecialchars($oldInput['designation'] ?? '', ENT_QUOTES, 'UTF-8'); ?>" 
                                    placeholder="e.g. Senior Quantity Surveyor"
                                >
                            </div>

                            <!-- Statutory declaration panel -->
                            <div class="card bg-light border-0 mb-4">
                                <div class="card-body p-3">
                                    <h6 class="fw-bold text-dark text-uppercase tracking-wider mb-1" style="font-size: 0.55rem; color: #1e293b;">Legal Statutory Affirmation:</h6>
                                    <p class="text-muted mb-0" style="font-size: 0.65rem; line-height: 1.45;">
                                        By submitting this form, I solemnly declare that all statements made in this application are true and correct. I authorize the SIM Secretariat to verify my credentials under the Malawi Land Surveyors Act.
                                    </p>
                                </div>
                            </div>

                            <!-- Submit Button -->
                            <div class="d-grid">
                                <button type="submit" class="btn btn-slate-dark btn-sm py-2.5">
                                    Submit Application to Register
                                </button>
                            </div>

                        </form>

                    </div>
                </div>
            </div>
        </div>
    </main>

    <!-- FOOTER SECTION -->
    <footer class="bg-dark text-white-50 text-center py-4 mt-5 border-top border-secondary">
        <div class="container" style="font-size: 0.7rem;">
            <p class="mb-1">&copy; <?php echo date('Y'); ?> Surveyors Institute of Malawi (SIM) Secretariat. All Rights Reserved.</p>
            <p class="mb-0 text-muted font-mono" style="font-size: 0.6rem;">Malawi Professional Registry DB Version 2.6.4 (PHP 8.1+ Production Standard)</p>
        </div>
    </footer>

    <!-- Bootstrap 5 Validation Helper Script -->
    <script>
        (() => {
            'use strict'
            const forms = document.querySelectorAll('.needs-validation')
            Array.from(forms).forEach(form => {
                form.addEventListener('submit', event => {
                    if (!form.checkValidity()) {
                        event.preventDefault()
                        event.stopPropagation()
                    }
                    form.classList.add('was-validated')
                }, false)
            })
        })()
    </script>

</body>
</html>
