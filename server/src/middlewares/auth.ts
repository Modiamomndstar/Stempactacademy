import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import prisma from '../config/prisma.js';

const JWT_SECRET = process.env.JWT_SECRET || 'stempact_academy_super_secret_jwt_key_2025';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: Role;
    firstName: string;
    lastName: string;
  };
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ message: 'Authentication required. Missing token.' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: Role };

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, role: true, firstName: true, lastName: true, isActive: true },
    });

    if (!user || !user.isActive) {
      res.status(401).json({ message: 'User account not found or deactivated.' });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired authentication token.' });
  }
};

export const authorize = (...allowedRoles: Role[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized. Please login.' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        message: `Forbidden: Access restricted to [${allowedRoles.join(', ')}]. Your role is ${req.user.role}.`,
      });
      return;
    }

    next();
  };
};
