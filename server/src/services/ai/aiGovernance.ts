import { Role, WorkflowStatus, Prisma } from '@prisma/client';
import prisma from '../../config/prisma.js';

export interface ReviewAIDraftParams {
  generationId: string;
  reviewerId: string;
  reviewerRole: Role;
  action: 'APPROVE' | 'REJECT' | 'REQUEST_REVISION';
  notes?: string;
  overrideOutput?: Record<string, any>;
}

export class AIGovernanceService {
  /**
   * Human-in-the-loop review and approval workflow for AI generations.
   * AI outputs are suggestions or drafts; only an authorized human can approve or reject them.
   */
  async reviewAIDraft(params: ReviewAIDraftParams) {
    const { generationId, reviewerId, reviewerRole, action, notes, overrideOutput } = params;

    // Check authorization: only authorized roles can review academic/administrative AI artifacts
    const allowedRoles: Role[] = [
      Role.SUPER_ADMIN,
      Role.ACADEMIC_ADMIN,
      Role.PROGRAM_COORDINATOR,
      Role.COORDINATOR_ADMIN,
      Role.INSTRUCTOR,
    ];

    if (!allowedRoles.includes(reviewerRole)) {
      throw new Error(`Role '${reviewerRole}' is not authorized to review AI-generated artifacts.`);
    }

    const generation = await prisma.aIGeneration.findUnique({
      where: { id: generationId },
    });

    if (!generation) {
      throw new Error(`AI generation record not found: ${generationId}`);
    }

    let nextStatus: WorkflowStatus;
    let isApproved = false;

    switch (action) {
      case 'APPROVE':
        nextStatus = WorkflowStatus.APPROVED;
        isApproved = true;
        break;
      case 'REJECT':
        nextStatus = WorkflowStatus.REJECTED;
        isApproved = false;
        break;
      case 'REQUEST_REVISION':
        nextStatus = WorkflowStatus.CHANGES_REQUESTED;
        isApproved = false;
        break;
      default:
        throw new Error(`Invalid review action: ${action}`);
    }

    const updateData: any = {
      status: nextStatus,
      approvedById: isApproved ? reviewerId : null,
      reviewedAt: new Date(),
      reviewNotes: notes || null,
    };

    if (overrideOutput) {
      updateData.structuredOutput = overrideOutput;
    }

    const updated = await prisma.aIGeneration.update({
      where: { id: generationId },
      data: updateData,
    });

    // Update matching AIAuditLog record
    try {
      await prisma.aIAuditLog.updateMany({
        where: { resourceId: generationId },
        data: { approved: isApproved },
      });
    } catch (auditErr: any) {
      console.warn('[AIGovernance] Failed to update AIAuditLog:', auditErr.message);
    }

    return updated;
  }

  /**
   * Verify that an AI generation has been legitimately reviewed and approved by a human
   * before any downstream system can ingest it into canonical catalog models.
   */
  async assertDraftIsApproved(generationId: string): Promise<boolean> {
    const generation = await prisma.aIGeneration.findUnique({
      where: { id: generationId },
      select: { status: true, approvedById: true },
    });

    if (!generation) {
      throw new Error(`AI generation record not found: ${generationId}`);
    }

    if (generation.status !== WorkflowStatus.APPROVED || !generation.approvedById) {
      throw new Error(
        `AI generation ${generationId} is status '${generation.status}' and has not been approved by an authorized human reviewer.`
      );
    }

    return true;
  }
}

export const aiGovernanceService = new AIGovernanceService();
