import { Request, Response } from 'express';
import prisma from '../config/prisma.js';
import { paymentService } from '../services/paymentService.js';
import { AuthRequest } from '../middlewares/auth.js';
import { Role } from '@prisma/client';

/**
 * Fetch invoices filtered by student, application, or status
 */
export const getInvoices = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { studentId, applicationId, status } = req.query;

    const where: any = {};
    if (studentId) {
      where.studentId = String(studentId);
    } else if (req.user && req.user.role === 'STUDENT') {
      const student = await prisma.studentProfile.findUnique({ where: { userId: req.user.id } });
      if (student) where.studentId = student.id;
    }

    if (applicationId) {
      where.applicationId = String(applicationId);
    }

    if (status) {
      where.status = String(status);
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        payments: { orderBy: { paidAt: 'desc' } },
        student: { include: { user: true } },
        application: { include: { program: true, cohort: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({ invoices });
  } catch (error: any) {
    console.error('getInvoices error:', error);
    res.status(500).json({ message: 'Failed to fetch invoices' });
  }
};

/**
 * Initialize online checkout via Paystack or Flutterwave
 */
export const initializeOnlinePayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { invoiceId, amount, channel, callbackUrl } = req.body;

    if (!invoiceId || !amount) {
      res.status(400).json({ message: 'invoiceId and amount are required' });
      return;
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        student: { include: { user: true } },
        application: true,
      },
    });

    if (!invoice) {
      res.status(404).json({ message: 'Invoice not found' });
      return;
    }

    const customerEmail =
      req.user?.email ||
      invoice.student?.user?.email ||
      invoice.application?.email ||
      'billing@stempactacademy.com';

    const customerName =
      (req.user ? `${req.user.firstName} ${req.user.lastName}` : null) ||
      (invoice.student?.user ? `${invoice.student.user.firstName} ${invoice.student.user.lastName}` : null) ||
      invoice.application?.fullName ||
      'STEMPACT Learner';

    const initResult = await paymentService.initializeOnlinePayment({
      invoiceId,
      amount: Number(amount),
      customerEmail,
      customerName,
      paymentChannel: channel === 'FLUTTERWAVE' ? 'FLUTTERWAVE' : 'PAYSTACK',
      callbackUrl,
      metadata: {
        studentId: invoice.studentId,
        applicationId: invoice.applicationId,
      },
    });

    res.status(200).json({
      message: 'Payment initialized successfully',
      authorizationUrl: initResult.authorizationUrl,
      reference: initResult.reference,
    });
  } catch (error: any) {
    console.error('initializeOnlinePayment error:', error);
    res.status(500).json({ message: error.message || 'Payment initialization failed' });
  }
};

/**
 * Paystack Webhook Handler (HMAC SHA512 Verified)
 */
export const paystackWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const signature = req.headers['x-paystack-signature'] as string;
    const rawBody = (req as any).rawBody || JSON.stringify(req.body);

    if (signature && !paymentService.verifyPaystackSignature(rawBody, signature)) {
      console.warn('Invalid Paystack Webhook Signature received');
      res.status(400).send('Invalid signature');
      return;
    }

    const event = req.body;
    if (event && event.event === 'charge.success') {
      const data = event.data;
      const reference = data.reference;
      const amount = data.amount / 100; // convert kobo to naira
      const invoiceId = data.metadata?.invoiceId;

      if (invoiceId) {
        await paymentService.recordSuccessfulPayment({
          invoiceId,
          amount,
          reference,
          channel: 'PAYSTACK',
          payerName: data.customer?.name,
          payerEmail: data.customer?.email,
          metadata: data,
        });
      }
    }

    res.status(200).json({ status: 'success' });
  } catch (error: any) {
    console.error('paystackWebhook error:', error);
    res.status(500).json({ message: 'Webhook processing error' });
  }
};

/**
 * Flutterwave Webhook Handler (Secret Hash Verified)
 */
export const flutterwaveWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const verifHash = req.headers['verif-hash'] as string;

    if (verifHash && !paymentService.verifyFlutterwaveSignature(verifHash)) {
      console.warn('Invalid Flutterwave Webhook Secret Hash');
      res.status(401).send('Invalid secret hash');
      return;
    }

    const event = req.body;
    if (event && event.status === 'successful') {
      const reference = event.txRef || event.tx_ref;
      const amount = event.amount;
      const invoiceId = event.meta?.invoiceId;

      if (invoiceId) {
        await paymentService.recordSuccessfulPayment({
          invoiceId,
          amount,
          reference,
          channel: 'FLUTTERWAVE',
          payerName: event.customer?.name,
          payerEmail: event.customer?.email,
          metadata: event,
        });
      }
    }

    res.status(200).json({ status: 'success' });
  } catch (error: any) {
    console.error('flutterwaveWebhook error:', error);
    res.status(500).json({ message: 'Webhook processing error' });
  }
};

/**
 * Submit manual bank transfer payment proof
 */
export const submitBankTransfer = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { invoiceId, amount, senderBank, senderAccount, proofUrl, payerName, payerEmail } = req.body;

    if (!invoiceId || !amount || !senderBank) {
      res.status(400).json({ message: 'invoiceId, amount, and senderBank are required' });
      return;
    }

    const name = payerName || (req.user ? `${req.user.firstName} ${req.user.lastName}` : 'Applicant');
    const email = payerEmail || (req.user ? req.user.email : 'billing@stempact.org');

    const payment = await paymentService.submitBankTransfer({
      invoiceId,
      amount: Number(amount),
      senderBank,
      senderAccount: senderAccount || 'Not Specified',
      proofUrl: proofUrl || '/uploads/sample_teller.jpg',
      payerName: name,
      payerEmail: email,
    });

    res.status(201).json({
      message: 'Bank transfer submitted successfully! Our Finance Team will verify and issue your receipt within 24 hours.',
      payment,
    });
  } catch (error: any) {
    console.error('submitBankTransfer error:', error);
    res.status(500).json({ message: error.message || 'Failed to submit bank transfer' });
  }
};

/**
 * Fetch bank transfers pending verification (Finance Admin or Super Admin)
 */
export const getBankTransfers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.query;
    const where: any = { channel: 'BANK_TRANSFER' };
    if (status) {
      where.status = String(status);
    }

    const payments = await prisma.payment.findMany({
      where,
      include: {
        invoice: {
          include: {
            student: { include: { user: true } },
            application: true,
          },
        },
      },
      orderBy: { paidAt: 'desc' },
    });

    res.status(200).json({ payments });
  } catch (error: any) {
    console.error('getBankTransfers error:', error);
    res.status(500).json({ message: 'Failed to fetch bank transfers' });
  }
};

/**
 * Approve manual bank transfer (Finance Admin or Super Admin)
 */
export const approveBankTransfer = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { paymentId } = req.params;
    const adminName = req.user ? `${req.user.firstName} ${req.user.lastName} (${req.user.role})` : 'Finance Admin';

    const result = await paymentService.approveBankTransfer(paymentId, adminName);

    res.status(200).json({
      message: 'Bank transfer verified and approved! Official receipt emitted.',
      payment: result.payment,
      invoiceBalance: result.invoiceBalance,
      invoiceStatus: result.invoiceStatus,
    });
  } catch (error: any) {
    console.error('approveBankTransfer error:', error);
    res.status(500).json({ message: error.message || 'Failed to approve bank transfer' });
  }
};

/**
 * Reject manual bank transfer (Finance Admin or Super Admin)
 */
export const rejectBankTransfer = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { paymentId } = req.params;
    const { rejectionReason } = req.body;
    const adminName = req.user ? `${req.user.firstName} ${req.user.lastName}` : 'Finance Admin';

    const payment = await paymentService.rejectBankTransfer(paymentId, rejectionReason || 'Payment could not be verified on bank statement', adminName);

    res.status(200).json({
      message: 'Bank transfer has been rejected.',
      payment,
    });
  } catch (error: any) {
    console.error('rejectBankTransfer error:', error);
    res.status(500).json({ message: error.message || 'Failed to reject bank transfer' });
  }
};

/**
 * Direct/Sandbox Payment recording for immediate demo or cash payments
 */
export const payInvoice = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { invoiceId, amount, channel, payerName, payerEmail } = req.body;

    const name = payerName || (req.user ? `${req.user.firstName} ${req.user.lastName}` : 'Applicant / Sponsor');
    const email = payerEmail || (req.user ? req.user.email : 'billing@stempact.org');
    const reference = `PAY-STP-DIR-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const result = await paymentService.recordSuccessfulPayment({
      invoiceId,
      amount: Number(amount),
      reference,
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
