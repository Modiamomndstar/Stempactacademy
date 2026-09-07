import { Request, Response } from 'express';
import prisma from '../config/prisma.js';
import { paymentService } from '../services/paymentService.js';
import { AuthRequest } from '../middlewares/auth.js';

export const getInvoices = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { studentId, status } = req.query;

    const where: any = {};
    if (studentId) {
      where.studentId = String(studentId);
    } else if (req.user && req.user.role === 'STUDENT') {
      const student = await prisma.studentProfile.findUnique({ where: { userId: req.user.id } });
      if (student) where.studentId = student.id;
    }

    if (status) {
      where.status = String(status);
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        payments: true,
        student: { include: { user: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({ invoices });
  } catch (error: any) {
    console.error('getInvoices error:', error);
    res.status(500).json({ message: 'Failed to fetch invoices' });
  }
};

export const payInvoice = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { invoiceId, amount, channel, payerName, payerEmail } = req.body;

    const name = payerName || (req.user ? `${req.user.firstName} ${req.user.lastName}` : 'Applicant / Sponsor');
    const email = payerEmail || (req.user ? req.user.email : 'billing@stempact.org');

    const result = await paymentService.processPayment({
      invoiceId,
      amount: Number(amount),
      channel: channel || 'TEST',
      payerName: name,
      payerEmail: email,
    });

    res.status(200).json({
      message: 'Payment recorded successfully! Official receipt generated.',
      payment: result.payment,
      invoiceBalance: result.invoiceBalance,
      invoiceStatus: result.invoiceStatus,
    });
  } catch (error: any) {
    console.error('payInvoice error:', error);
    res.status(500).json({ message: error.message || 'Payment processing failed' });
  }
};
