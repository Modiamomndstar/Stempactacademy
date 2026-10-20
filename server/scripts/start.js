#!/usr/bin/env node
const { execSync } = require('child_process');

console.log('🚀 [STARTUP] STEMPACT Academy Production Container initializing...');

// 1. Attempt resilient database migration using direct connection if Neon pooler is detected
try {
  const dbUrl = process.env.DATABASE_URL || '';
  if (dbUrl) {
    const directUrl = dbUrl.includes('-pooler') ? dbUrl.replace('-pooler', '') : dbUrl;
    console.log('📦 [STARTUP] Running Prisma migrations on database...');
    execSync('npx prisma migrate deploy', {
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: directUrl },
      timeout: 30000,
    });
    console.log('✔ [STARTUP] Prisma migrations completed.');
  }
} catch (migErr) {
  console.warn('⚠️ [STARTUP NOTICE] Prisma migrate deploy bypassed or timed out on pooler:', migErr.message);
  console.log('ℹ️ [STARTUP] BootstrapService will perform automatic zero-downtime schema sync.');
}

// 2. Start the HTTP API server
console.log('🌟 [STARTUP] Starting Node.js backend server (dist/index.js)...');
require('../dist/index.js');
