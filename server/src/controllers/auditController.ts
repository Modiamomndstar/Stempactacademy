import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.js';
import { fetchAuditLogs } from '../services/auditService.js';

export const getAuditLogs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const action = req.query.action as string;
    const resource = req.query.resource as string;
    const search = req.query.search as string;

    const result = await fetchAuditLogs({ limit, offset, action, resource, search });
    res.status(200).json(result);
  } catch (error: any) {
    console.error('getAuditLogs error:', error);
    res.status(500).json({ message: 'Failed to fetch audit logs' });
  }
};
