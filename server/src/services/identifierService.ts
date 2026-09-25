import crypto from 'crypto';
import prisma from '../config/prisma.js';

export interface IdentifierOptions {
  year?: number;
  tx?: any;
}

export interface CohortIdentifierOptions extends IdentifierOptions {
  programCode?: string;
  cycleOrCode?: string;
}

export class IdentifierService {
  private db(tx?: any) {
    return tx || prisma;
  }

  /**
   * Atomically allocates the next sequential integer for a given sequence key.
   * Guarantees strict collision-free sequential ordering under concurrent operations.
   */
  async getNextSequence(
    sequenceKey: string,
    prefix: string,
    year: number | null,
    getExistingMax?: (client: any) => Promise<number>,
    tx?: any
  ): Promise<number> {
    const client = this.db(tx);

    // Check if sequence already exists
    const existing = await client.identifierSequence.findUnique({
      where: { name: sequenceKey },
    });

    if (!existing) {
      let startingVal = 1;
      if (getExistingMax) {
        try {
          const maxVal = await getExistingMax(client);
          if (maxVal >= startingVal) {
            startingVal = maxVal + 1;
          }
        } catch (err) {
          console.warn(`[IDENTIFIER_SERVICE] Failed to query existing max for ${sequenceKey}, defaulting to 1:`, err);
          startingVal = 1;
        }
      }

      // Atomic insert or increment if a concurrent request beat us to it
      const result: any[] = await client.$queryRaw`
        INSERT INTO "IdentifierSequence" ("name", "prefix", "year", "currentVal", "updatedAt")
        VALUES (${sequenceKey}, ${prefix}, ${year}, ${startingVal}, NOW())
        ON CONFLICT ("name") DO UPDATE
        SET "currentVal" = "IdentifierSequence"."currentVal" + 1, "updatedAt" = NOW()
        RETURNING "currentVal";
      `;
      return Number(result[0].currentVal);
    }

    // Row exists: perform atomic update returning updated sequence number
    const result: any[] = await client.$queryRaw`
      UPDATE "IdentifierSequence"
      SET "currentVal" = "currentVal" + 1, "updatedAt" = NOW()
      WHERE "name" = ${sequenceKey}
      RETURNING "currentVal";
    `;
    return Number(result[0].currentVal);
  }

  /**
   * Generates a collision-safe Application Number: APP-YYYY-XXXX (e.g. APP-2026-0001)
   */
  async generateApplicationNumber(options?: IdentifierOptions): Promise<string> {
    const year = options?.year || new Date().getFullYear();
    const sequenceKey = `APP_${year}`;

    const seq = await this.getNextSequence(
      sequenceKey,
      'APP',
      year,
      async (client) => {
        const records = await client.application.findMany({
          where: { applicationNumber: { startsWith: `APP-${year}-` } },
          select: { applicationNumber: true },
        });
        let max = 0;
        for (const r of records) {
          const parts = r.applicationNumber.split('-');
          const num = parseInt(parts[2], 10);
          if (!isNaN(num) && num > max) max = num;
        }
        return max;
      },
      options?.tx
    );

    return `APP-${year}-${String(seq).padStart(4, '0')}`;
  }

  /**
   * Generates a collision-safe Admission Number: ADM-YYYY-XXX (e.g. ADM-2026-001)
   */
  async generateAdmissionNumber(options?: IdentifierOptions): Promise<string> {
    const year = options?.year || new Date().getFullYear();
    const sequenceKey = `ADM_${year}`;

    const seq = await this.getNextSequence(
      sequenceKey,
      'ADM',
      year,
      async (client) => {
        const records = await client.admission.findMany({
          where: { admissionNumber: { startsWith: `ADM-${year}-` } },
          select: { admissionNumber: true },
        });
        let max = 0;
        for (const r of records) {
          const parts = r.admissionNumber.split('-');
          const num = parseInt(parts[2], 10);
          if (!isNaN(num) && num > max) max = num;
        }
        return max;
      },
      options?.tx
    );

    return `ADM-${year}-${String(seq).padStart(3, '0')}`;
  }

  /**
   * Generates a collision-safe Student ID Number: STP-YYYY-XXXX (e.g. STP-2026-0001)
   */
  async generateStudentIdNumber(options?: IdentifierOptions): Promise<string> {
    const year = options?.year || new Date().getFullYear();
    const sequenceKey = `STP_STUDENT_${year}`;

    const seq = await this.getNextSequence(
      sequenceKey,
      'STP',
      year,
      async (client) => {
        const records = await client.studentProfile.findMany({
          where: { studentIdNumber: { startsWith: `STP-${year}-` } },
          select: { studentIdNumber: true },
        });
        let max = 0;
        for (const r of records) {
          const parts = r.studentIdNumber.split('-');
          const num = parseInt(parts[2], 10);
          if (!isNaN(num) && num > max) max = num;
        }
        return max;
      },
      options?.tx
    );

    return `STP-${year}-${String(seq).padStart(4, '0')}`;
  }

  /**
   * Generates a collision-safe Invoice Number: INV-YYYY-XXXX (e.g. INV-2026-0001)
   */
  async generateInvoiceNumber(options?: IdentifierOptions): Promise<string> {
    const year = options?.year || new Date().getFullYear();
    const sequenceKey = `INV_${year}`;

    const seq = await this.getNextSequence(
      sequenceKey,
      'INV',
      year,
      async (client) => {
        const records = await client.invoice.findMany({
          where: { invoiceNumber: { startsWith: `INV-${year}-` } },
          select: { invoiceNumber: true },
        });
        let max = 0;
        for (const r of records) {
          const parts = r.invoiceNumber.split('-');
          const num = parseInt(parts[2], 10);
          if (!isNaN(num) && num > max) max = num;
        }
        return max;
      },
      options?.tx
    );

    return `INV-${year}-${String(seq).padStart(4, '0')}`;
  }

  /**
   * Generates a collision-safe Certificate Number: STP-YYYY-XXXX (e.g. STP-2028-0001)
   */
  async generateCertificateNumber(options?: IdentifierOptions): Promise<string> {
    const year = options?.year || (new Date().getFullYear() + 2); // Default to graduating year
    const sequenceKey = `CERT_${year}`;

    const seq = await this.getNextSequence(
      sequenceKey,
      'CERT',
      year,
      async (client) => {
        const records = await client.certificate.findMany({
          where: { certificateNumber: { startsWith: `STP-${year}-` } },
          select: { certificateNumber: true },
        });
        let max = 0;
        for (const r of records) {
          const parts = r.certificateNumber.split('-');
          const num = parseInt(parts[2], 10);
          if (!isNaN(num) && num > max) max = num;
        }
        return max;
      },
      options?.tx
    );

    return `STP-${year}-${String(seq).padStart(4, '0')}`;
  }

  /**
   * Generates a cryptographic verification code for certificates: STP-VERIFY-XXXXXX
   */
  generateCertificateVerificationCode(): string {
    const hex = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `STP-VERIFY-${hex}`;
  }

  /**
   * Generates a collision-safe Cohort Code: STP-YYYY-CXX or [PROG]-YYYY-X
   */
  async generateCohortCode(options?: CohortIdentifierOptions): Promise<string> {
    const year = options?.year || new Date().getFullYear();

    if (options?.programCode) {
      const sanitizedProg = options.programCode.toUpperCase().trim();
      const sequenceKey = `COHORT_${sanitizedProg}_${year}`;
      const seq = await this.getNextSequence(
        sequenceKey,
        sanitizedProg,
        year,
        async (client) => {
          const records = await client.cohort.findMany({
            where: { cohortCode: { startsWith: `${sanitizedProg}-${year}-` } },
            select: { cohortCode: true },
          });
          return records.length;
        },
        options?.tx
      );
      return `${sanitizedProg}-${year}-C${seq}`;
    }

    const sequenceKey = `COHORT_STP_${year}`;
    const seq = await this.getNextSequence(
      sequenceKey,
      'STP',
      year,
      async (client) => {
        const records = await client.cohort.findMany({
          where: { cohortCode: { startsWith: `STP-${year}-C` } },
          select: { cohortCode: true },
        });
        let max = 0;
        for (const r of records) {
          const match = r.cohortCode.match(/STP-\d+-C(\d+)/i);
          if (match && match[1]) {
            const num = parseInt(match[1], 10);
            if (!isNaN(num) && num > max) max = num;
          }
        }
        return max;
      },
      options?.tx
    );

    return `STP-${year}-C${seq}`;
  }

  /**
   * Generates a collision-safe Instructor Staff Code: STP-INS-XXX (e.g. STP-INS-001)
   */
  async generateInstructorStaffCode(options?: { tx?: any }): Promise<string> {
    const sequenceKey = 'STAFF_INSTRUCTOR';

    const seq = await this.getNextSequence(
      sequenceKey,
      'STP-INS',
      null,
      async (client) => {
        const records = await client.instructorProfile.findMany({
          where: { staffCode: { startsWith: 'STP-INS-' } },
          select: { staffCode: true },
        });
        let max = 0;
        for (const r of records) {
          const parts = r.staffCode.split('-');
          const num = parseInt(parts[2], 10);
          if (!isNaN(num) && num > max) max = num;
        }
        return max;
      },
      options?.tx
    );

    return `STP-INS-${String(seq).padStart(3, '0')}`;
  }

  /**
   * Generates a collision-safe Payment Reference
   * Format: PAY-STP-[TAG]-YYYYMM-XXXXXX
   */
  generatePaymentReference(channelOrTag: string = 'GEN'): string {
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
    const timeSuffix = Date.now().toString().slice(-4);
    const cleanTag = channelOrTag.replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 4) || 'GEN';
    return `PAY-STP-${cleanTag}-${yearMonth}-${randomHex}${timeSuffix}`;
  }
}

export const identifierService = new IdentifierService();
