import dotenv from 'dotenv';
dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';
const rawSecret = process.env.JWT_SECRET;

/**
 * Validates and retrieves the authoritative JWT secret.
 * In production, fails closed if the secret is missing or uses the default placeholder.
 */
export const getJwtSecret = (): string => {
  const isProd = process.env.NODE_ENV === 'production';
  const secret = process.env.JWT_SECRET;
  if (isProd) {
    if (!secret || secret === 'stempact_academy_super_secret_jwt_key_2025' || secret.trim().length < 32) {
      throw new Error(
        'FATAL SECURITY CONFIGURATION: JWT_SECRET must be explicitly set to a strong secret (at least 32 characters) in production.'
      );
    }
    return secret;
  }
  // In development/test environments, allow local development fallback with a logged warning
  if (!secret) {
    console.warn('[SECURITY WARNING] Running with local development fallback JWT secret. Set JWT_SECRET in .env.');
    return 'stempact_academy_super_secret_jwt_key_2025';
  }
  return secret;
};

export const JWT_SECRET = rawSecret || (isProduction ? '' : 'stempact_academy_super_secret_jwt_key_2025');
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
