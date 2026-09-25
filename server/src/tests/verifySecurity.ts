import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { authenticate, authorize } from '../middlewares/auth';
import { getJwtSecret, JWT_EXPIRES_IN } from '../config/jwt';
import { validateEnvironment } from '../config/envValidation';
import { paymentService } from '../services/paymentService';
import { emailService } from '../services/emailService';
import fs from 'fs';
import path from 'path';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, failureDetail?: string) {
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${testName}${failureDetail ? ` - ${failureDetail}` : ''}`);
    failed++;
  }
}

function readSource(relativePath: string): string {
  const candidates = [
    path.resolve(__dirname, '../../src', relativePath),
    path.resolve(__dirname, '../', relativePath),
    path.resolve(process.cwd(), 'src', relativePath),
    path.resolve(process.cwd(), 'server/src', relativePath),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return fs.readFileSync(candidate, 'utf8');
    }
  }
  throw new Error(`Unable to locate source file: ${relativePath}. Checked: ${candidates.join(', ')}`);
}

async function runSecurityVerification() {
  console.log('====================================================');
  console.log('STEMPACT ACADEMY: PHASE 1 SECURITY VERIFICATION SUITE');
  console.log('====================================================\n');

  // Test 1: JWT Configuration & Token Generation
  console.log('1. Centralized JWT Configuration:');
  const secret = getJwtSecret();
  assert(typeof secret === 'string' && secret.length >= 10, 'JWT secret is present and retrieved from centralized config');
  assert(JWT_EXPIRES_IN === '7d', 'JWT expiry is set to 7d');

  const testPayload = { userId: 'usr-test-123', email: 'test@stempact.edu', role: 'STUDENT' };
  const token = jwt.sign(testPayload, secret, { expiresIn: '1h' });
  const decoded = jwt.verify(token, secret) as any;
  assert(decoded.userId === testPayload.userId && decoded.role === 'STUDENT', 'JWT can be signed and verified using authoritative secret');

  // Test fail-closed on production with weak secret
  const originalEnv = process.env.NODE_ENV;
  const originalSecret = process.env.JWT_SECRET;
  try {
    process.env.NODE_ENV = 'production';
    delete process.env.JWT_SECRET;
    let threw = false;
    try {
      getJwtSecret();
    } catch {
      threw = true;
    }
    assert(threw, 'getJwtSecret() fails closed (throws error) in production if JWT_SECRET is unset');

    process.env.JWT_SECRET = 'short';
    let threwShort = false;
    try {
      getJwtSecret();
    } catch {
      threwShort = true;
    }
    assert(threwShort, 'getJwtSecret() fails closed (throws error) in production if JWT_SECRET is under 32 characters');
  } finally {
    process.env.NODE_ENV = originalEnv;
    if (originalSecret) process.env.JWT_SECRET = originalSecret;
    else delete process.env.JWT_SECRET;
  }

  // Test 2: Removed Auth Backdoors & Demo Passwords
  console.log('\n2. Authentication Backdoors Verification:');
  const authControllerContent = readSource('controllers/authController.ts');

  assert(!authControllerContent.includes('demoPasswords'), 'authController.ts contains NO demoPasswords array');
  assert(!authControllerContent.includes('Admin@12345'), 'authController.ts contains NO hardcoded "Admin@12345"');
  assert(!authControllerContent.includes('Stempact@2025'), 'authController.ts contains NO hardcoded "Stempact@2025"');
  assert(authControllerContent.includes('bcrypt.compare'), 'authController.ts strictly enforces bcrypt password verification');
  assert(authControllerContent.includes('SUPER_ADMIN_PASSWORD must be explicitly provided'), 'ensureSuperAdminFromEnv validates strong password in production');

  // Test 3: Application Registration Password Hardening
  console.log('\n3. Application Registration Hardening:');
  const appControllerContent = readSource('controllers/applicationController.ts');

  assert(!appControllerContent.includes('Stempact@2025'), 'applicationController.ts contains NO fallback "Stempact@2025" password');
  assert(appControllerContent.includes('password.trim().length < 8'), 'applicationController.ts enforces minimum 8 characters for password');
  assert(appControllerContent.includes('getJwtSecret()'), 'applicationController.ts uses centralized getJwtSecret()');

  // Test 4: Protected PII & Ownership in Routes
  console.log('\n4. Protected PII & Ownership Controls:');
  const routesContent = readSource('routes/api.ts');

  assert(routesContent.includes("router.get('/applications/:id', authenticate, applicationController.getApplicationById)"), 'GET /api/applications/:id is protected by authenticate middleware');
  assert(routesContent.includes("router.get('/admissions/:number', authenticate, admissionController.getAdmissionByNumber)"), 'GET /api/admissions/:number is protected by authenticate middleware');
  assert(routesContent.includes("router.post('/assessments/attempt', authenticate, assessmentController.submitAssessmentAttempt)"), 'POST /api/assessments/attempt is protected by authenticate middleware');
  assert(routesContent.includes("router.post('/payments/pay', authenticate, paymentController.payInvoice)"), 'POST /api/payments/pay is protected by authenticate middleware');

  // Check assessmentController guest bypass removal and ownership check
  const assessmentContent = readSource('controllers/assessmentController.ts');
  assert(!assessmentContent.includes('APP-GUEST'), 'assessmentController.ts has removed APP-GUEST bypass');
  assert(assessmentContent.includes('application.userId === authUser.id') && assessmentContent.includes('Forbidden: You are not authorized'), 'assessmentController.ts checks that application belongs to authenticated user');

  // Check admissionController authorization
  const admissionContent = readSource('controllers/admissionController.ts');
  assert(admissionContent.includes('admission.application?.userId && admission.application.userId === req.user.id'), 'admissionController.ts verifies admission ownership or parent/staff link');

  // Check paymentController authorization
  const paymentContent = readSource('controllers/paymentController.ts');
  assert(paymentContent.includes('invoice.student?.userId && invoice.student.userId === req.user.id'), 'paymentController.ts restricts invoice payment to student owner or finance admin');
  assert(paymentContent.includes('Direct payment recording is reserved for Finance Administration'), 'paymentController.ts blocks unauthorized direct payment bypass in production');

  // Test 5: Webhook Verification Fail-Closed
  console.log('\n5. Payment Webhooks Fail-Closed Verification:');
  const dummyPayload = JSON.stringify({ event: 'charge.success', data: { reference: 'REF-1234' } });

  // Paystack tests
  const originalPaystackSecret = process.env.PAYSTACK_SECRET_KEY;
  try {
    delete process.env.PAYSTACK_SECRET_KEY;
    const missingSecretResult = paymentService.verifyPaystackSignature(dummyPayload, 'some-sig');
    assert(missingSecretResult === false, 'verifyPaystackSignature fails closed (false) when secret is missing');

    process.env.PAYSTACK_SECRET_KEY = 'test_paystack_secret_key_12345';
    const invalidSigResult = paymentService.verifyPaystackSignature(dummyPayload, 'invalid_signature_hash');
    assert(invalidSigResult === false, 'verifyPaystackSignature rejects invalid signature');

    const validPaystackHash = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY).update(dummyPayload).digest('hex');
    const validPaystackResult = paymentService.verifyPaystackSignature(dummyPayload, validPaystackHash);
    assert(validPaystackResult === true, 'verifyPaystackSignature accepts authentic HMAC-SHA512 signature');
  } finally {
    if (originalPaystackSecret) process.env.PAYSTACK_SECRET_KEY = originalPaystackSecret;
    else delete process.env.PAYSTACK_SECRET_KEY;
  }

  // Flutterwave tests
  const originalFlwSecret = process.env.FLUTTERWAVE_SECRET_HASH;
  try {
    delete process.env.FLUTTERWAVE_SECRET_HASH;
    const missingFlwSecret = paymentService.verifyFlutterwaveSignature('any-sig');
    assert(missingFlwSecret === false, 'verifyFlutterwaveSignature fails closed (false) when secret hash is missing');

    process.env.FLUTTERWAVE_SECRET_HASH = 'flw_secret_verification_token_abc';
    const invalidFlwResult = paymentService.verifyFlutterwaveSignature('wrong-token');
    assert(invalidFlwResult === false, 'verifyFlutterwaveSignature rejects invalid verification header');

    const validFlwResult = paymentService.verifyFlutterwaveSignature('flw_secret_verification_token_abc');
    assert(validFlwResult === true, 'verifyFlutterwaveSignature accepts valid secret hash using timingSafeEqual');
  } finally {
    if (originalFlwSecret) process.env.FLUTTERWAVE_SECRET_HASH = originalFlwSecret;
    else delete process.env.FLUTTERWAVE_SECRET_HASH;
  }

  // Test 6: CORS & Error Handling Configuration
  console.log('\n6. CORS & Sensitive Data Protection:');
  const indexContent = readSource('index.ts');

  assert(!indexContent.includes("origin: '*'"), 'index.ts does not use wildcard origin "*" with credentials');
  assert(indexContent.includes('getJwtSecret()') && indexContent.includes('[STARTUP SECURITY ERROR]'), 'index.ts validates JWT configuration on server startup');
  assert(indexContent.includes("isProd && status === 500 ? 'Internal Server Error'"), 'index.ts masks internal error messages and stack traces in production');

  // Test 7: Attendance Privacy
  console.log('\n7. Attendance Privacy:');
  const attendanceContent = readSource('controllers/attendanceController.ts');

  assert(attendanceContent.includes('staffRoles.includes(req.user.role)'), 'attendanceController.ts differentiates staff/instructors from students');
  assert(attendanceContent.includes("req.user.role === 'STUDENT'") && attendanceContent.includes('studentId: student.id'), 'attendanceController.ts scopes attendance queries to own student ID for students');

  // Test 8: Production Bootstrap & Diagnostics Route Protection
  console.log('\n8. Bootstrap Diagnostics & Seed Route Protection:');
  const apiRoutesContent = readSource('routes/api.ts');
  assert(
    apiRoutesContent.includes("router.get('/bootstrap/status', authenticate, authorize(Role.SUPER_ADMIN)"),
    'api.ts strictly guards GET /api/bootstrap/status with authenticate and Role.SUPER_ADMIN'
  );
  assert(
    apiRoutesContent.includes("router.post('/bootstrap/seed', authenticate, authorize(Role.SUPER_ADMIN)"),
    'api.ts strictly guards POST /api/bootstrap/seed with authenticate and Role.SUPER_ADMIN'
  );
  assert(
    apiRoutesContent.includes("process.env.NODE_ENV === 'production'") &&
      apiRoutesContent.includes('Forced database re-seeding is strictly disabled in production mode'),
    'api.ts strictly disables forced re-seeding in production mode'
  );

  // 8.1 Functional Middleware Pipeline Verification for GET /api/bootstrap/status:
  // A. Unauthenticated request: missing Authorization header -> 401
  let unauthStatus = 0;
  let unauthJson: any = null;
  let unauthNextCalled: boolean = false;
  const mockUnauthReq: any = { headers: {} };
  const mockUnauthRes: any = {
    status(code: number) {
      unauthStatus = code;
      return this;
    },
    json(data: any) {
      unauthJson = data;
      return this;
    },
  };
  await authenticate(mockUnauthReq, mockUnauthRes, () => {
    unauthNextCalled = true;
  });
  assert(
    unauthStatus === 401 && !unauthNextCalled,
    'unauthenticated GET /api/bootstrap/status is blocked with 401 Unauthorized'
  );
  assert(
    !unauthJson?.data?.superAdminEmail && !unauthJson?.superAdminEmail && !unauthJson?.data?.schoolCount,
    'unauthenticated request receives NO sensitive internal database diagnostics or superAdminEmail'
  );

  // B. Authenticated non-SUPER_ADMIN user (e.g. STUDENT) -> 403 Forbidden
  let nonAdminStatus = 0;
  let nonAdminNextCalled: boolean = false;
  const mockStudentReq: any = {
    user: { id: 'usr-student-1', role: Role.STUDENT, email: 'student@example.com' },
  };
  const mockNonAdminRes: any = {
    status(code: number) {
      nonAdminStatus = code;
      return this;
    },
    json(data: any) {
      return this;
    },
  };
  authorize(Role.SUPER_ADMIN)(mockStudentReq, mockNonAdminRes, () => {
    nonAdminNextCalled = true;
  });
  assert(
    nonAdminStatus === 403 && !nonAdminNextCalled,
    'authenticated non-SUPER_ADMIN user is blocked from GET /api/bootstrap/status with 403 Forbidden'
  );

  // C. Authorized SUPER_ADMIN user -> Allowed (next() called)
  let superAdminNextCalled: boolean = false;
  const mockSuperAdminReq: any = {
    user: { id: 'usr-admin-1', role: Role.SUPER_ADMIN, email: 'admin@stempact.org' },
  };
  const mockSuperAdminRes: any = {
    status(code: number) {
      return this;
    },
    json(data: any) {
      return this;
    },
  };
  authorize(Role.SUPER_ADMIN)(mockSuperAdminReq, mockSuperAdminRes, () => {
    superAdminNextCalled = true;
  });
  assert(
    superAdminNextCalled,
    'authorized SUPER_ADMIN is granted access to GET /api/bootstrap/status'
  );

  // Test 9: Production CLIENT_URL Fail-Closed Security
  console.log('\n9. Production CLIENT_URL Fail-Closed Security:');
  const savedEnv = process.env.NODE_ENV;
  const savedClientUrl = process.env.CLIENT_URL;
  const savedDb = process.env.DATABASE_URL;
  const savedJwt = process.env.JWT_SECRET;
  try {
    process.env.NODE_ENV = 'production';
    process.env.DATABASE_URL = 'postgresql://user:pass@neon.tech/stempact?sslmode=require';
    process.env.JWT_SECRET = 'stempact_production_super_jwt_secret_key_2026_safe';

    // 9.1 Missing CLIENT_URL in production
    delete process.env.CLIENT_URL;
    let missingClientUrlThrew = false;
    try {
      validateEnvironment();
    } catch {
      missingClientUrlThrew = true;
    }
    assert(missingClientUrlThrew, 'validateEnvironment() fails closed in production when CLIENT_URL is missing');

    // 9.2 Localhost CLIENT_URL in production
    process.env.CLIENT_URL = 'http://localhost:3000';
    let localhostClientUrlThrew = false;
    try {
      validateEnvironment();
    } catch {
      localhostClientUrlThrew = true;
    }
    assert(localhostClientUrlThrew, 'validateEnvironment() fails closed in production when CLIENT_URL points to localhost');

    let emailLocalhostThrew = false;
    try {
      emailService.getClientUrl();
    } catch {
      emailLocalhostThrew = true;
    }
    assert(emailLocalhostThrew, 'emailService.getClientUrl() throws fatal error in production when CLIENT_URL is localhost');

    // 9.3 Valid remote CLIENT_URL in production
    process.env.CLIENT_URL = 'https://stempactacademy.com';
    const validProdEnv = validateEnvironment();
    assert(validProdEnv.isValid === true, 'validateEnvironment() passes in production with valid remote HTTPS CLIENT_URL');
    assert(emailService.getClientUrl() === 'https://stempactacademy.com', 'emailService.getClientUrl() resolves authoritative production URL');
  } finally {
    process.env.NODE_ENV = savedEnv;
    if (savedClientUrl) process.env.CLIENT_URL = savedClientUrl;
    else delete process.env.CLIENT_URL;
    if (savedDb) process.env.DATABASE_URL = savedDb;
    else delete process.env.DATABASE_URL;
    if (savedJwt) process.env.JWT_SECRET = savedJwt;
    else delete process.env.JWT_SECRET;
  }

  console.log('\n====================================================');
  console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runSecurityVerification().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
