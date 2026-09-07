import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRouter from './routes/api.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: '*',
    credentials: true,
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
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

app.listen(PORT, () => {
  console.log(`🚀 STEMPACT ACADEMY Server running on http://localhost:${PORT}`);
  console.log(`📍 Academy Hub: Ile-Ife, Osun State, Nigeria`);
});

export default app;
