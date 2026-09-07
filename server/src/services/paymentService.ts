import { PaymentStatus, InvoiceStatus } from '@prisma/client';
import prisma from '../config/prisma.js';

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

// 1. Nigerian Paystack Gateway Adapter
export class PaystackAdapter implements PaymentGatewayAdapter {
  private secretKey: string;

  constructor(secretKey: string = process.env.PAYSTACK_SECRET_KEY || '') {
    this.secretKey = secretKey;
  }

  async initializePayment(params: PaymentInitParams): Promise<{ authorizationUrl: string; reference: string }> {
    const reference = `PAY-STP-PSTK-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    // Real implementation calls https://api.paystack.co/transaction/initialize
    return {
      authorizationUrl: `https://checkout.paystack.com/mock-checkout?reference=${reference}&amount=${params.amount * 100}`,
      reference,
    };
  }

  async verifyPayment(reference: string): Promise<PaymentVerificationResult> {
    // Real implementation calls https://api.paystack.co/transaction/verify/:reference
    return {
      success: true,
      reference,
      amount: 50000,
      channel: 'PAYSTACK',
      status: PaymentStatus.PAID,
      message: 'Paystack transaction verified successfully',
    };
  }
}

// 2. Nigerian Flutterwave Gateway Adapter
export class FlutterwaveAdapter implements PaymentGatewayAdapter {
  private secretKey: string;

  constructor(secretKey: string = process.env.FLUTTERWAVE_SECRET_KEY || '') {
    this.secretKey = secretKey;
  }

  async initializePayment(params: PaymentInitParams): Promise<{ authorizationUrl: string; reference: string }> {
    const reference = `PAY-STP-FLW-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    return {
      authorizationUrl: `https://ravemodal-dev.herokuapp.com/mock-flw?tx_ref=${reference}`,
      reference,
    };
  }

  async verifyPayment(reference: string): Promise<PaymentVerificationResult> {
    return {
      success: true,
      reference,
      amount: 50000,
      channel: 'FLUTTERWAVE',
      status: PaymentStatus.PAID,
      message: 'Flutterwave transaction verified successfully',
    };
  }
}

// 3. Automated Test / Simulated Nigerian Bank Adapter (for sandbox & immediate demo)
export class TestSandboxAdapter implements PaymentGatewayAdapter {
  async initializePayment(params: PaymentInitParams): Promise<{ authorizationUrl: string; reference: string }> {
    const reference = `PAY-STP-SANDBOX-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    return {
      authorizationUrl: `/payments/checkout?ref=${reference}&invoiceId=${params.invoiceId}&amount=${params.amount}`,
      reference,
    };
  }

  async verifyPayment(reference: string): Promise<PaymentVerificationResult> {
    return {
      success: true,
      reference,
      amount: 50000,
      channel: 'TEST',
      status: PaymentStatus.PAID,
      message: 'Sandbox payment processed successfully',
    };
  }
}

// Main Payment Service Orchestrator
export class PaymentService {
  private adapter: PaymentGatewayAdapter;

  constructor() {
    const provider = process.env.PAYMENT_PROVIDER?.toUpperCase() || 'TEST';
    if (provider === 'PAYSTACK') {
      this.adapter = new PaystackAdapter();
    } else if (provider === 'FLUTTERWAVE') {
      this.adapter = new FlutterwaveAdapter();
    } else {
      this.adapter = new TestSandboxAdapter();
    }
  }

  // Switch adapter dynamically at runtime if needed
  setAdapter(adapter: PaymentGatewayAdapter) {
    this.adapter = adapter;
  }

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

  async processPayment(params: {
    invoiceId: string;
    amount: number;
    channel?: 'PAYSTACK' | 'FLUTTERWAVE' | 'BANK_TRANSFER' | 'TEST';
    payerName: string;
    payerEmail: string;
  }) {
    const invoice = await prisma.invoice.findUnique({
      where: { id: params.invoiceId },
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    if (params.amount <= 0) {
      throw new Error('Payment amount must be greater than zero');
    }

    const reference = `PAY-STP-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(100000 + Math.random() * 900000)}`;

    const payment = await prisma.payment.create({
      data: {
        invoiceId: invoice.id,
        paymentReference: reference,
        amount: params.amount,
        currency: 'NGN',
        channel: params.channel || 'TEST',
        status: PaymentStatus.PAID,
        paidAt: new Date(),
        receiptUrl: `/receipts/${reference}.pdf`,
        metadata: JSON.stringify({
          payerName: params.payerName,
          payerEmail: params.payerEmail,
          processedAt: new Date().toISOString(),
        }),
      },
    });

    // Update invoice status & balance
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

    return { payment, invoiceBalance: newBalance, invoiceStatus: newStatus };
  }
}

export const paymentService = new PaymentService();
