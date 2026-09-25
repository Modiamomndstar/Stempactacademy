/**
 * STEMPACT Academy Production Hardening: Fail-Closed Environment Validation
 */

export interface EnvValidationResult {
  isValid: boolean;
  isProduction: boolean;
  errors: string[];
  warnings: string[];
}

export function validateEnvironment(): EnvValidationResult {
  const isProduction = process.env.NODE_ENV === 'production';
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Database Configuration
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    errors.push('CRITICAL: DATABASE_URL is not set.');
  } else if (isProduction && dbUrl.includes('localhost')) {
    warnings.push('PRODUCTION WARNING: DATABASE_URL points to localhost in production mode.');
  }

  // 2. Authentication & Cryptographic Keys
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    if (isProduction) {
      errors.push('CRITICAL: JWT_SECRET must be set in production mode.');
    } else {
      warnings.push('DEVELOPMENT WARNING: JWT_SECRET is unset; falling back to temporary test secret.');
    }
  } else if (isProduction && jwtSecret.length < 32) {
    errors.push('CRITICAL: JWT_SECRET must be at least 32 characters in production mode.');
  } else if (jwtSecret === 'stempact-secret-key-change-in-production') {
    if (isProduction) {
      errors.push('CRITICAL: Default insecure JWT_SECRET must be replaced in production.');
    }
  }

  // 3. Port Configuration
  const port = process.env.PORT;
  if (port && isNaN(Number(port))) {
    errors.push(`PORT must be a valid number, received: "${port}"`);
  }

  // 4. AI Provider Health Check (Fail-soft: warns if keys missing, mock provider active)
  const geminiKey = process.env.GEMINI_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;
  if (!geminiKey && !groqKey) {
    warnings.push('AI WARNING: Neither GEMINI_API_KEY nor GROQ_API_KEY is configured. System is operating with high-reliability deterministic MockProvider.');
  }

  const isValid = errors.length === 0;

  if (!isValid && isProduction) {
    console.error('====================================================');
    console.error('🚨 FAIL-CLOSED PRODUCTION CONFIGURATION ERROR 🚨');
    errors.forEach(err => console.error(`  - ${err}`));
    console.error('====================================================');
    throw new Error(`Production environment validation failed with ${errors.length} error(s).`);
  }

  return {
    isValid,
    isProduction,
    errors,
    warnings,
  };
}
