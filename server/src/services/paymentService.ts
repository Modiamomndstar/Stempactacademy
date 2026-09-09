import crypto from 'crypto';
import { PaymentStatus, InvoiceStatus } from '@prisma/client';
import prisma from '../config/prisma.js';
import { emailService } from './emailService.js';

export interface PaymentInitParams {
  invoiceId: string;
  amount: number;
  customerEmail: string;
  customerName: string;
  paymentChannel?: 'PAYSTACK' | 'FLUTTERWAVE' | 'BANK_TRANSFER' | 'TEST';
  callbackUrl?: string;
  metadata?: Record<string, any>;
}

export interface PaymentVerificationResult {
  success: boolean;
  reference: string;
  amount: number;
  channel: string;
  status: PaymentStatus;
  message: string;
  metadata?: any;
}

export interface PaymentGatewayAdapter {
  initializePayment(params: PaymentInitParams): Promise<{ authorizationUrl: string; reference: string }>;
  verifyPayment(reference: string): Promise<PaymentVerificationResult>;
}

// 1. Live & Sandbox Paystack Gateway Adapter
export class PaystackAdapter implements PaymentGatewayAdapter {
  private secretKey: string;

  constructor(secretKey: string = process.env.PAYSTACK_SECRET_KEY || '') {
    this.secretKey = secretKey;
  }

  async initializePayment(params: PaymentInitParams): Promise<{ authorizationUrl: string; reference: string }> {
    const reference = `PAY-STP-PSTK-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    if (!this.secretKey || this.secretKey.trim() === '' || this.secretKey.startsWith('placeholder')) {
      // Graceful fallback for local development & staging sandbox
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
      return {
        authorizationUrl: `${clientUrl}/portal/student?payment_success=true&ref=${reference}&invoiceId=${params.invoiceId}&amount=${params.amount}`,
        reference,
      };
    }

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    const callbackUrl = params.callbackUrl || `${clientUrl}/portal/student?payment_ref=${reference}`;

    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: params.customerEmail,
        amount: Math.round(params.amount * 100), // Paystack accepts amount in Kobo
        reference,
        callback_url: callbackUrl,
        metadata: {
          invoiceId: params.invoiceId,
          customerName: params.customerName,
          ...params.metadata,
        },
      }),
    });

    const data = (await response.json()) as any;
    if (!response.ok || !data.status) {
      throw new Error(data.message || 'Failed to initialize Paystack transaction');
    }

    return {
      authorizationUrl: data.data.authorization_url,
      reference: data.data.reference,
    };
  }

  async verifyPayment(reference: string): Promise<PaymentVerificationResult> {
    if (!this.secretKey || this.secretKey.trim() === '' || this.secretKey.startsWith('placeholder')) {
      return {
        success: true,
        reference,
        amount: 50000,
        channel: 'PAYSTACK',
        status: PaymentStatus.PAID,
        message: 'Paystack transaction verified (Development Sandbox)',
      };
    }

    const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.secretKey}`,
      },
    });

    const data = (await response.json()) as any;
    if (!response.ok || !data.status) {
      return {
        success: false,
        reference,
        amount: 0,
        channel: 'PAYSTACK',
        status: PaymentStatus.FAILED,
        message: data.message || 'Verification failed on Paystack',
      };
    }

    const tx = data.data;
    const isSuccess = tx.status === 'success';

    return {
      success: isSuccess,
      reference: tx.reference,
      amount: tx.amount / 100, // convert kobo back to naira
      channel: 'PAYSTACK',
      status: isSuccess ? PaymentStatus.PAID : PaymentStatus.FAILED,
      message: tx.gateway_response || 'Paystack transaction processed',
      metadata: tx.metadata,
    };
  }
}

// 2. Live & Sandbox Flutterwave Gateway Adapter
export class FlutterwaveAdapter implements PaymentGatewayAdapter {
  private secretKey: string;

  constructor(secretKey: string = process.env.FLUTTERWAVE_SECRET_KEY || '') {
    this.secretKey = secretKey;
  }

  async initializePayment(params: PaymentInitParams): Promise<{ authorizationUrl: string; reference: string }> {
    const reference = `PAY-STP-FLW-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    if (!this.secretKey || this.secretKey.trim() === '' || this.secretKey.startsWith('placeholder')) {
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
      return {
        authorizationUrl: `${clientUrl}/portal/student?payment_success=true&ref=${reference}&invoiceId=${params.invoiceId}&amount=${params.amount}`,
        reference,
      };
    }

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    const callbackUrl = params.callbackUrl || `${clientUrl}/portal/student?payment_ref=${reference}`;

    const response = await fetch('https://api.flutterwave.com/v3/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tx_ref: reference,
        amount: params.amount,
        currency: 'NGN',
        redirect_url: callbackUrl,
        customer: {
          email: params.customerEmail,
          name: params.customerName,
        },
        customizations: {
          title: 'STEMPACT Academy Tuition Payment',
          description: `Tuition Fee for Invoice #${params.invoiceId}`,
          logo: 'https://stempactacademy.com/logo.png',
        },
        meta: {
          invoiceId: params.invoiceId,
          ...params.metadata,
        },
      }),
    });

    const data = (await response.json()) as any;
    if (!response.ok || data.status !== 'success') {
      throw new Error(data.message || 'Failed to initialize Flutterwave transaction');
    }

    return {
      authorizationUrl: data.data.link,
      reference,
    };
  }

  async verifyPayment(reference: string): Promise<PaymentVerificationResult> {
    if (!this.secretKey || this.secretKey.trim() === '' || this.secretKey.startsWith('placeholder')) {
      return {
        success: true,
        reference,
        amount: 50000,
        channel: 'FLUTTERWAVE',
        status: PaymentStatus.PAID,
        message: 'Flutterwave transaction verified (Development Sandbox)',
      };
    }

    const response = await fetch(`https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${encodeURIComponent(reference)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.secretKey}`,
      },
    });

    const data = (await response.json()) as any;
    if (!response.ok || data.status !== 'success') {
      return {
        success: false,
        reference,
        amount: 0,
        channel: 'FLUTTERWAVE',
        status: PaymentStatus.FAILED,
        message: data.message || 'Verification failed on Flutterwave',
      };
    }

    const tx = data.data;
    const isSuccess = tx.status === 'successful';

    return {
      success: isSuccess,
      reference: tx.tx_ref,
      amount: tx.amount,
      channel: 'FLUTTERWAVE',
      status: isSuccess ? PaymentStatus.PAID : PaymentStatus.FAILED,
      message: tx.processor_response || 'Flutterwave transaction processed',
      metadata: tx.meta,
    };
  }
}

// 3. Main Payment Service Orchestrator
export class PaymentService {
  private paystackAdapter: PaystackAdapter;
  private flutterwaveAdapter: FlutterwaveAdapter;

  constructor() {
    this.paystackAdapter = new PaystackAdapter();
    this.flutterwaveAdapter = new FlutterwaveAdapter();
  }

  /**
   * Helper to verify Paystack HMAC Webhook Signature
   */
  verifyPaystackSignature(rawBody: string, signature: string): boolean {
    const secret = process.env.PAYSTACK_SECRET_KEY || '';
    if (!secret) return true; // in test mode
    const hash = crypto.createHmac('sha512', secret).update(rawBody).digest('hex');
    return hash === signature;
  }

  /**
   * Helper to verify Flutterwave Secret Hash Webhook
   */
  verifyFlutterwaveSignature(verifHash: string): boolean {
    const secretHash = process.env.FLUTTERWAVE_SECRET_HASH || '';
    if (!secretHash) return true;
    return verifHash === secretHash;
  }

  /**
   * Initialize online payment via Paystack or Flutterwave
   */
  async initializeOnlinePayment(params: PaymentInitParams) {
    const invoice = await prisma.invoice.findUnique({
      where: { id: params.invoiceId },
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    if (params.amount <= 0 || params.amount > invoice.balance) {
      throw new Error(`Invalid payment amount. Maximum payable balance is ₦${invoice.balance.toLocaleString()}`);
    }

    if (params.paymentChannel === 'FLUTTERWAVE') {
      return this.flutterwaveAdapter.initializePayment(params);
    }

    // Default to Paystack for primary Nigerian online card/USSD checkout
    return this.paystackAdapter.initializePayment(params);
  }

  /**
   * Create an invoice for an admitted student or applicant cohort
   */
  async createInvoiceForCohort(params: {
    studentId?: string;
    applicationId?: string;
    cohortId?: string;
    title: string;
    trainingFee: number;
    registrationFee: number;
    certificationFee: number;
    discountPercentage?: number;
    dueDateDays?: number;
  }) {
    const discount = params.discountPercentage || 0;
    const discountAmount = (params.trainingFee * discount) / 100;
    const discountedTrainingFee = params.trainingFee - discountAmount;
    const total = discountedTrainingFee + params.registrationFee + params.certificationFee;

    const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

    const items = [
      { item: 'Academic Training & Lab Access', amount: params.trainingFee },
      { item: 'Registration & Portal Credentials', amount: params.registrationFee },
      { item: 'Official Certification & Assessment', amount: params.certificationFee },
    ];

    if (discount > 0) {
      items.push({ item: `Academic Merit Discount (${discount}%)`, amount: -discountAmount });
    }

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + (params.dueDateDays || 14));

    return prisma.invoice.create({
      data: {
        invoiceNumber,
        studentId: params.studentId,
        applicationId: params.applicationId,
        title: params.title,
        totalAmount: total,
        amountPaid: 0,
        balance: total,
        dueDate,
        status: InvoiceStatus.UNPAID,
        items: JSON.stringify(items),
      },
    });
  }

  /**
   * Record a completed payment and update invoice balance atomically
   */
  async recordSuccessfulPayment(params: {
    invoiceId: string;
    amount: number;
    reference: string;
    channel: 'PAYSTACK' | 'FLUTTERWAVE' | 'BANK_TRANSFER' | 'TEST';
    payerName?: string;
    payerEmail?: string;
    metadata?: any;
  }) {
    const invoice = await prisma.invoice.findUnique({
      where: { id: params.invoiceId },
      include: {
        student: { include: { user: true } },
        application: true,
      },
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    // Check if reference already recorded to ensure idempotency
    const existingPayment = await prisma.payment.findUnique({
      where: { paymentReference: params.reference },
    });

    if (existingPayment && existingPayment.status === PaymentStatus.PAID) {
      return { payment: existingPayment, invoiceBalance: invoice.balance, invoiceStatus: invoice.status };
    }

    const payment = existingPayment
      ? await prisma.payment.update({
          where: { id: existingPayment.id },
          data: {
            status: PaymentStatus.PAID,
            paidAt: new Date(),
            amount: params.amount,
          },
        })
      : await prisma.payment.create({
          data: {
            invoiceId: invoice.id,
            paymentReference: params.reference,
            amount: params.amount,
            currency: 'NGN',
            channel: params.channel,
            status: PaymentStatus.PAID,
            paidAt: new Date(),
            receiptUrl: `/receipts/${params.reference}.pdf`,
            metadata: JSON.stringify({
              payerName: params.payerName,
              payerEmail: params.payerEmail,
              ...params.metadata,
            }),
          },
        });

    // Update invoice balance
    const newAmountPaid = invoice.amountPaid + params.amount;
    const newBalance = Math.max(0, invoice.totalAmount - newAmountPaid);
    const newStatus =
      newBalance === 0
        ? InvoiceStatus.PAID
        : newAmountPaid > 0
        ? InvoiceStatus.PARTIALLY_PAID
        : InvoiceStatus.UNPAID;

    await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        amountPaid: newAmountPaid,
        balance: newBalance,
        status: newStatus,
      },
    });

    // Send payment confirmation email via Resend
    const recipientEmail =
      params.payerEmail ||
      invoice.student?.user?.email ||
      invoice.application?.email;

    const recipientName =
      params.payerName ||
      `${invoice.student?.user?.firstName || ''} ${invoice.student?.user?.lastName || ''}`.trim() ||
      invoice.application?.fullName ||
      'Student';

    if (recipientEmail) {
      emailService.sendPaymentReceiptEmail({
        to: recipientEmail,
        fullName: recipientName,
        paymentReference: params.reference,
        amount: params.amount,
        channel: params.channel,
        invoiceNumber: invoice.invoiceNumber,
        remainingBalance: newBalance,
      }).catch(err => console.error('Failed to send receipt email:', err));
    }

    return { payment, invoiceBalance: newBalance, invoiceStatus: newStatus };
  }

  /**
   * Submit manual bank transfer for admin verification
   */
  async submitBankTransfer(params: {
    invoiceId: string;
    amount: number;
    senderBank: string;
    senderAccount: string;
    proofUrl: string;
    payerName: string;
    payerEmail: string;
  }) {
    const invoice = await prisma.invoice.findUnique({
      where: { id: params.invoiceId },
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    const reference = `PAY-STP-BNK-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const payment = await prisma.payment.create({
      data: {
        invoiceId: invoice.id,
        paymentReference: reference,
        amount: params.amount,
        currency: 'NGN',
        channel: 'BANK_TRANSFER',
        status: PaymentStatus.PENDING,
        proofUrl: params.proofUrl,
        senderBank: params.senderBank,
        senderAccount: params.senderAccount,
        metadata: JSON.stringify({
          payerName: params.payerName,
          payerEmail: params.payerEmail,
          submittedAt: new Date().toISOString(),
        }),
      },
    });

    return payment;
  }

  /**
   * Approve manual bank transfer (Finance Admin or Super Admin)
   */
  async approveBankTransfer(paymentId: string, approvedBy: string) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        invoice: {
          include: {
            student: { include: { user: true } },
            application: true,
          },
        },
      },
    });

    if (!payment) {
      throw new Error('Payment record not found');
    }

    if (payment.status === PaymentStatus.PAID) {
      throw new Error('Payment has already been approved');
    }

    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: PaymentStatus.PAID,
        paidAt: new Date(),
        verifiedAt: new Date(),
        verifiedBy: approvedBy,
      },
    });

    // Update invoice balance
    const invoice = payment.invoice;
    const newAmountPaid = invoice.amountPaid + payment.amount;
    const newBalance = Math.max(0, invoice.totalAmount - newAmountPaid);
    const newStatus =
      newBalance === 0
        ? InvoiceStatus.PAID
        : newAmountPaid > 0
        ? InvoiceStatus.PARTIALLY_PAID
        : InvoiceStatus.UNPAID;

    await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        amountPaid: newAmountPaid,
        balance: newBalance,
        status: newStatus,
      },
    });

    // Send receipt email
    const metadata = payment.metadata ? JSON.parse(payment.metadata) : {};
    const recipientEmail = metadata.payerEmail || invoice.student?.user?.email || invoice.application?.email;
    const recipientName = metadata.payerName || invoice.student?.user?.firstName || invoice.application?.fullName || 'Student';

    if (recipientEmail) {
      emailService.sendPaymentReceiptEmail({
        to: recipientEmail,
        fullName: recipientName,
        paymentReference: payment.paymentReference,
        amount: payment.amount,
        channel: 'BANK_TRANSFER',
        invoiceNumber: invoice.invoiceNumber,
        remainingBalance: newBalance,
      }).catch(err => console.error('Failed to send receipt email:', err));
    }

    return { payment: updatedPayment, invoiceBalance: newBalance, invoiceStatus: newStatus };
  }

  /**
   * Reject manual bank transfer (Finance Admin or Super Admin)
   */
  async rejectBankTransfer(paymentId: string, rejectionReason: string, rejectedBy: string) {
    return prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: PaymentStatus.FAILED,
        rejectionReason,
        verifiedBy: rejectedBy,
        verifiedAt: new Date(),
      },
    });
  }
}

export const paymentService = new PaymentService();
