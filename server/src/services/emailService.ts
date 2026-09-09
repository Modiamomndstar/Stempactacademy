/**
 * STEMPACT ACADEMY - Transactional Email Service (Resend Integration)
 * High-deliverability institutional email dispatcher with branded responsive HTML templates.
 */

export interface EmailRecipient {
  email: string;
  name?: string;
}

export interface EmailDispatchResult {
  success: boolean;
  messageId?: string;
  simulated?: boolean;
  error?: string;
}

class EmailService {
  private apiKey: string;
  private fromEmail: string;
  private clientUrl: string;

  constructor() {
    this.apiKey = process.env.RESEND_API_KEY || '';
    this.fromEmail = process.env.RESEND_FROM_EMAIL || 'STEMPACT Academy <admissions@stempactacademy.com>';
    this.clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
  }

  /**
   * Universal email dispatcher via Resend REST API or graceful mock logger
   */
  private async send(params: {
    to: string | string[];
    subject: string;
    html: string;
  }): Promise<EmailDispatchResult> {
    const recipients = Array.isArray(params.to) ? params.to : [params.to];

    // If no API key configured (e.g. initial testing or local sandbox), log cleanly without throwing
    if (!this.apiKey || this.apiKey.trim() === '' || this.apiKey === 'placeholder_resend_key') {
      console.log(`\n================== [RESEND EMAIL SIMULATOR] ==================`);
      console.log(`To:      ${recipients.join(', ')}`);
      console.log(`From:    ${this.fromEmail}`);
      console.log(`Subject: ${params.subject}`);
      console.log(`Status:  Simulated Dispatch (Configure RESEND_API_KEY for live delivery)`);
      console.log(`==============================================================\n`);
      return { success: true, simulated: true, messageId: `mock-resend-${Date.now()}` };
    }

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: this.fromEmail,
          to: recipients,
          subject: params.subject,
          html: params.html,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Resend API Error:', errorData);
        return {
          success: false,
          error: (errorData as any)?.message || `HTTP ${response.status} failed`,
        };
      }

      const data = (await response.json()) as { id: string };
      console.log(`[Resend Email Sent] ID: ${data.id} -> ${recipients.join(', ')}`);
      return { success: true, messageId: data.id };
    } catch (err: any) {
      console.error('Failed to dispatch email via Resend:', err);
      return { success: false, error: err?.message || 'Network error dispatching email' };
    }
  }

  /**
   * Base HTML Email Layout wrapper with STEMPACT branding
   */
  private wrapTemplate(title: string, bodyContent: string): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; color: #1e293b; }
    .container { max-width: 600px; margin: 24px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #064e3b 100%); padding: 32px 28px; text-align: center; color: #ffffff; }
    .logo-badge { display: inline-block; background-color: #059669; color: #ffffff; font-weight: 800; font-size: 14px; padding: 4px 12px; border-radius: 20px; letter-spacing: 1px; margin-bottom: 8px; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 700; color: #ffffff; }
    .header p { margin: 6px 0 0 0; color: #94a3b8; font-size: 14px; }
    .content { padding: 32px 28px; line-height: 1.6; color: #334155; }
    .callout { background-color: #f8fafc; border-left: 4px solid #059669; padding: 16px 20px; border-radius: 4px; margin: 24px 0; }
    .btn { display: inline-block; background-color: #059669; color: #ffffff !important; text-decoration: none; padding: 14px 32px; font-size: 15px; font-weight: 600; border-radius: 8px; margin: 16px 0; text-align: center; }
    .footer { background-color: #f1f5f9; padding: 24px 28px; text-align: center; font-size: 12px; color: #64748b; }
    .footer a { color: #059669; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo-badge">STEMPACT ACADEMY</div>
      <h1>${title}</h1>
      <p>Ile-Ife Innovation Hub &bull; Empowering the Next Generation of Tech Leaders</p>
    </div>
    <div class="content">
      ${bodyContent}
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} STEMPACT Academy Innovations Limited. All rights reserved.</p>
      <p>STEMPACT Main Hub, Ile-Ife, Osun State, Nigeria &bull; <a href="${this.clientUrl}">${this.clientUrl}</a></p>
      <p>If you have any questions, reply to this email or reach us on WhatsApp: +234 810 000 0000</p>
    </div>
  </div>
</body>
</html>`;
  }

  /**
   * 1. Application Received & Diagnostic Assessment Link
   */
  async sendApplicationReceivedEmail(params: {
    to: string;
    fullName: string;
    applicationNumber: string;
    programName: string;
    programId: string;
    applicationId: string;
  }) {
    const assessmentUrl = `${this.clientUrl}/assessment?programId=${params.programId}&applicationId=${params.applicationId}`;
    const subject = `Application Received: ${params.programName} [${params.applicationNumber}]`;
    const content = `
      <p>Dear <strong>${params.fullName}</strong>,</p>
      <p>Thank you for applying to <strong>STEMPACT Academy</strong> for the <strong>${params.programName}</strong> program.</p>
      <div class="callout">
        <p style="margin: 0; font-size: 14px; color: #64748b;">Official Application Number:</p>
        <p style="margin: 4px 0 0 0; font-size: 20px; font-weight: 700; color: #0f172a;">${params.applicationNumber}</p>
      </div>
      <h3>Next Step: Dynamic Diagnostic Assessment</h3>
      <p>To ensure you are placed in the cohort and curriculum level that matches your experience, please complete our 15-question dynamic assessment. It takes approximately 20–30 minutes.</p>
      <div style="text-align: center;">
        <a href="${assessmentUrl}" class="btn">Take Diagnostic Assessment Now &rarr;</a>
      </div>
      <p style="font-size: 13px; color: #64748b;">Or copy this link to your browser: <br><a href="${assessmentUrl}">${assessmentUrl}</a></p>
    `;
    return this.send({ to: params.to, subject, html: this.wrapTemplate('Application Received', content) });
  }

  /**
   * 2. Diagnostic Assessment Results & Academic Recommendation
   */
  async sendAssessmentCompletedEmail(params: {
    to: string;
    fullName: string;
    programName: string;
    score: number;
    recommendedLevel: string;
    recommendationReason: string;
  }) {
    const subject = `Diagnostic Assessment Results: ${params.programName}`;
    const content = `
      <p>Dear <strong>${params.fullName}</strong>,</p>
      <p>Congratulations on completing your diagnostic assessment for <strong>${params.programName}</strong>.</p>
      <div class="callout">
        <p style="margin: 0; font-size: 14px; color: #64748b;">Your Overall Score:</p>
        <p style="margin: 4px 0 0 0; font-size: 28px; font-weight: 800; color: #059669;">${Math.round(params.score)}%</p>
        <p style="margin: 8px 0 0 0; font-size: 15px; font-weight: 600; color: #0f172a;">Recommended Placement: ${params.recommendedLevel}</p>
      </div>
      <p><strong>Academic Evaluation Note:</strong></p>
      <p>${params.recommendationReason}</p>
      <p>Our Academic Board is currently ratifying your placement and preparing your official Admission Offer Letter. You will receive your admission pack shortly.</p>
    `;
    return this.send({ to: params.to, subject, html: this.wrapTemplate('Assessment Results', content) });
  }

  /**
   * 3. Official Admission Offer Letter & Invoicing
   */
  async sendAdmissionOfferEmail(params: {
    to: string;
    fullName: string;
    admissionNumber: string;
    studentIdNumber: string;
    programName: string;
    cohortName: string;
    startDate: string;
    schedule: string;
    trainingFee: number;
    registrationFee: number;
    certificationFee: number;
    totalAmount: number;
    invoiceNumber: string;
  }) {
    const portalUrl = `${this.clientUrl}/portal/student/login`;
    const subject = `Official Admission Offer: ${params.programName} [${params.admissionNumber}]`;
    const formatNaira = (val: number) => `₦${val.toLocaleString()}`;
    const content = `
      <p>Dear <strong>${params.fullName}</strong>,</p>
      <p>The Academic Board of STEMPACT Academy is pleased to offer you provisional admission into the upcoming cohort!</p>
      
      <div class="callout">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr><td style="padding: 6px 0; color: #64748b;">Admission Number:</td><td style="font-weight: 700; color: #0f172a;">${params.admissionNumber}</td></tr>
          <tr><td style="padding: 6px 0; color: #64748b;">Student ID:</td><td style="font-weight: 700; color: #0f172a;">${params.studentIdNumber}</td></tr>
          <tr><td style="padding: 6px 0; color: #64748b;">Program:</td><td style="font-weight: 700; color: #0f172a;">${params.programName}</td></tr>
          <tr><td style="padding: 6px 0; color: #64748b;">Cohort:</td><td style="font-weight: 700; color: #0f172a;">${params.cohortName}</td></tr>
          <tr><td style="padding: 6px 0; color: #64748b;">Commencement Date:</td><td style="font-weight: 700; color: #0f172a;">${params.startDate}</td></tr>
          <tr><td style="padding: 6px 0; color: #64748b;">Schedule:</td><td style="font-weight: 700; color: #0f172a;">${params.schedule}</td></tr>
        </table>
      </div>

      <h3>Tuition & Fee Breakdown (Invoice: ${params.invoiceNumber})</h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 20px;">
        <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px 0;">Tuition & Lab Training</td><td style="text-align: right; font-weight: 600;">${formatNaira(params.trainingFee)}</td></tr>
        <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px 0;">Portal Registration & Kit</td><td style="text-align: right; font-weight: 600;">${formatNaira(params.registrationFee)}</td></tr>
        <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px 0;">Certification & Assessment</td><td style="text-align: right; font-weight: 600;">${formatNaira(params.certificationFee)}</td></tr>
        <tr style="border-top: 2px solid #0f172a;"><td style="padding: 10px 0; font-weight: 700; font-size: 16px;">Total Payable</td><td style="text-align: right; font-weight: 800; font-size: 18px; color: #059669;">${formatNaira(params.totalAmount)}</td></tr>
      </table>

      <p>You can pay online via <strong>Paystack</strong> (Card/USSD), <strong>Flutterwave</strong>, or direct <strong>Bank Transfer</strong>. Installment options are available in your portal.</p>

      <div style="text-align: center;">
        <a href="${portalUrl}" class="btn">Log In to Accept Offer & Pay Fees &rarr;</a>
      </div>
    `;
    return this.send({ to: params.to, subject, html: this.wrapTemplate('Provisional Admission Offer', content) });
  }

  /**
   * 4. Official Payment Receipt & Enrollment Confirmation
   */
  async sendPaymentReceiptEmail(params: {
    to: string;
    fullName: string;
    paymentReference: string;
    amount: number;
    channel: string;
    invoiceNumber: string;
    remainingBalance: number;
  }) {
    const subject = `Official Payment Receipt: ${params.paymentReference}`;
    const formatNaira = (val: number) => `₦${val.toLocaleString()}`;
    const content = `
      <p>Dear <strong>${params.fullName}</strong>,</p>
      <p>We confirm receipt of your payment toward STEMPACT Academy tuition and academic services.</p>
      
      <div class="callout">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr><td style="padding: 6px 0; color: #64748b;">Receipt Reference:</td><td style="font-weight: 700; color: #0f172a;">${params.paymentReference}</td></tr>
          <tr><td style="padding: 6px 0; color: #64748b;">Invoice Number:</td><td style="font-weight: 700; color: #0f172a;">${params.invoiceNumber}</td></tr>
          <tr><td style="padding: 6px 0; color: #64748b;">Amount Paid:</td><td style="font-weight: 800; color: #059669; font-size: 18px;">${formatNaira(params.amount)}</td></tr>
          <tr><td style="padding: 6px 0; color: #64748b;">Channel:</td><td style="font-weight: 700; color: #0f172a;">${params.channel}</td></tr>
          <tr><td style="padding: 6px 0; color: #64748b;">Remaining Balance:</td><td style="font-weight: 700; color: ${params.remainingBalance > 0 ? '#d97706' : '#059669'};">${formatNaira(params.remainingBalance)}</td></tr>
        </table>
      </div>

      <p>${params.remainingBalance === 0 ? 'Your invoice is fully cleared. You have complete access to all lab facilities, curriculum modules, and mentoring sessions.' : 'Your payment has been credited to your installment plan. Thank you!'}</p>

      <div style="text-align: center;">
        <a href="${this.clientUrl}/portal/student" class="btn">Go to Student Dashboard &rarr;</a>
      </div>
    `;
    return this.send({ to: params.to, subject, html: this.wrapTemplate('Official Payment Receipt', content) });
  }

  /**
   * 5. Assignment Grade Released
   */
  async sendGradeReleasedEmail(params: {
    to: string;
    fullName: string;
    assignmentTitle: string;
    grade: number;
    maxPoints: number;
    feedback?: string;
  }) {
    const subject = `Grade Released: ${params.assignmentTitle}`;
    const content = `
      <p>Dear <strong>${params.fullName}</strong>,</p>
      <p>Your submission for <strong>${params.assignmentTitle}</strong> has been reviewed and graded by your instructor.</p>
      
      <div class="callout">
        <p style="margin: 0; font-size: 14px; color: #64748b;">Your Score:</p>
        <p style="margin: 4px 0 0 0; font-size: 26px; font-weight: 800; color: #059669;">${params.grade} / ${params.maxPoints}</p>
        ${params.feedback ? `<p style="margin: 12px 0 0 0; font-size: 14px; color: #334155;"><strong>Instructor Feedback:</strong><br>${params.feedback}</p>` : ''}
      </div>

      <div style="text-align: center;">
        <a href="${this.clientUrl}/portal/student" class="btn">View Gradebook &rarr;</a>
      </div>
    `;
    return this.send({ to: params.to, subject, html: this.wrapTemplate('Grade Released', content) });
  }

  /**
   * 6. Official Certificate Clearance & Public Verification
   */
  async sendCertificateIssuedEmail(params: {
    to: string;
    fullName: string;
    programName: string;
    certificateNumber: string;
    verificationCode: string;
  }) {
    const verifyUrl = `${this.clientUrl}/verify/${params.certificateNumber}`;
    const subject = `Official Certificate Issued: ${params.programName} [${params.certificateNumber}]`;
    const content = `
      <p>Dear <strong>${params.fullName}</strong>,</p>
      <p>Hearty congratulations! The Academic Board and Governing Council of STEMPACT Academy have certified your successful completion of <strong>${params.programName}</strong>.</p>
      
      <div class="callout">
        <p style="margin: 0; font-size: 14px; color: #64748b;">Certificate Identification Number:</p>
        <p style="margin: 4px 0 0 0; font-size: 20px; font-weight: 800; color: #0f172a;">${params.certificateNumber}</p>
        <p style="margin: 6px 0 0 0; font-size: 13px; color: #64748b;">Verification Code: <code>${params.verificationCode}</code></p>
      </div>

      <p>Your digital certificate has been permanently recorded on our public cryptographic registry. You can add it to your LinkedIn profile and share it with employers.</p>

      <div style="text-align: center;">
        <a href="${verifyUrl}" class="btn">Verify & Download Certificate &rarr;</a>
      </div>
    `;
    return this.send({ to: params.to, subject, html: this.wrapTemplate('Graduation Certificate Issued', content) });
  }
}

export const emailService = new EmailService();
