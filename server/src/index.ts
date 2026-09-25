import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRouter from './routes/api.js';
import { BootstrapService } from './services/bootstrap/bootstrapService.js';

import { getJwtSecret } from './config/jwt.js';

import { validateEnvironment } from './config/envValidation.js';

dotenv.config();

// Validate security & environment configuration on startup
try {
  validateEnvironment();
  getJwtSecret();
} catch (configErr: any) {
  console.error('[STARTUP SECURITY ERROR]', configErr.message);
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
}

const app = express();
const PORT = process.env.PORT || 5000;

// Allowed Origins for CORS
const defaultOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
  'https://stempactacademy.com',
  'https://www.stempactacademy.com',
  'https://stempactacademy.onrender.com',
];

const envOrigins = [process.env.CLIENT_URL, process.env.CORS_ORIGIN]
  .filter(Boolean)
  .flatMap((val) => (val as string).split(',').map((o) => o.trim()))
  .filter(Boolean);

const allowedOrigins = Array.from(new Set([...defaultOrigins, ...envOrigins]));

// Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser requests (e.g. mobile apps, curl, server-to-server)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS policy: origin ${origin} is not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-paystack-signature', 'verif-hash'],
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logger
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'OK',
    academy: 'STEMPACT ACADEMY',
    location: 'Ile-Ife, Osun State, Nigeria',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Mount master API router
app.use('/api', apiRouter);

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled server error:', err);
  const status = err.status || (err.message && err.message.includes('CORS policy') ? 403 : 500);
  const isProd = process.env.NODE_ENV === 'production';
  res.status(status).json({
    message: isProd && status === 500 ? 'Internal Server Error' : (err.message || 'Internal Server Error'),
    error: isProd ? undefined : err.stack,
  });
});

app.listen(PORT, async () => {
  console.log(`🚀 STEMPACT ACADEMY Server running on http://localhost:${PORT}`);
  console.log(`📍 Academy Hub: Ile-Ife, Osun State, Nigeria`);
  await BootstrapService.autoBootstrapIfEmpty();
});

export default app;
