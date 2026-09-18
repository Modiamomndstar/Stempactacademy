import { z } from 'zod';
import { AIActionType, WorkflowStatus, Role } from '@prisma/client';
import prisma from '../../config/prisma.js';
import { getAIProvider, MockProvider } from './aiProvider.js';
import { AIOptions, AIGenerationResult } from './types.js';

export interface OrchestratorRequest<T> {
  actionType: AIActionType;
  prompt: string;
  schema: z.ZodType<T>;
  contextData: any;
  userId: string;
  userRole: Role;
  options?: AIOptions;
}

export class AIOrchestrator {
  /**
   * Primary entry point for generating structured academic artifacts
   */
  static async generateStructured<T>(req: OrchestratorRequest<T>): Promise<{
    id: string;
    structured: T;
    status: WorkflowStatus;
    tokensPrompt: number;
    tokensCompletion: number;
    latencyMs: number;
    model: string;
    createdAt: Date;
  }> {
    const provider = getAIProvider();

    // 1. Execute generation through the provider with fallback
    let result: AIGenerationResult<T>;
    try {
      result = await provider.generateStructured<T>(req.prompt, req.schema, req.options);
    } catch (error: any) {
      console.error('[AIOrchestrator Error - Activating MockProvider fallback]:', error.message || error);
      const mock = new MockProvider();
      result = await mock.generateStructured<T>(req.prompt, req.schema, req.options);
    }

    // 2. Persist the AI generation record as a DRAFT in Prisma
    let aiGenerationId = `gen-${Date.now()}`;
    let createdAt = new Date();
    let status: WorkflowStatus = WorkflowStatus.DRAFT;

    try {
      const record = await prisma.aIGeneration.create({
        data: {
          actionType: req.actionType,
          promptContext: req.contextData,
          rawOutput: result.rawText,
          structuredOutput: result.structured as any,
          model: result.model,
          provider: result.provider,
          tokensPrompt: result.tokensPrompt,
          tokensCompletion: result.tokensCompletion,
          costEstimate: result.costEstimate,
          status: WorkflowStatus.DRAFT,
          requestedById: req.userId,
        },
      });
      aiGenerationId = record.id;
      createdAt = record.createdAt;
      status = record.status;
    } catch (dbErr: any) {
      console.warn('[AIOrchestrator DB Warning] Could not persist AIGeneration record:', dbErr.message);
    }

    // 3. Log audit event
    try {
      await prisma.aIAuditLog.create({
        data: {
          userId: req.userId,
          userRole: req.userRole,
          action: req.actionType,
          resourceType: req.actionType.replace('_GENERATION', ''),
          resourceId: aiGenerationId,
          inputSummary: req.prompt.slice(0, 180),
          model: result.model,
          provider: result.provider,
          latencyMs: result.latencyMs,
          approved: false,
        },
      });
    } catch (auditErr: any) {
      console.warn('[AIOrchestrator Audit Warning] Could not log AIAuditLog:', auditErr.message);
    }

    return {
      id: aiGenerationId,
      structured: result.structured,
      status,
      tokensPrompt: result.tokensPrompt,
      tokensCompletion: result.tokensCompletion,
      latencyMs: result.latencyMs,
      model: result.model,
      createdAt,
    };
  }

  /**
   * Helper for conversational copilot assistants (Student Copilot, Parent Assistant, Admin Assistant)
   */
  static async generateTextResponse(
    userId: string,
    userRole: Role,
    actionType: AIActionType,
    prompt: string,
    systemInstruction: string
  ): Promise<string> {
    const provider = getAIProvider();

    let text = '';
    let latencyMs = 120;
    let model = 'llama-3.3-70b-versatile';

    try {
      const result = await provider.generateText(prompt, { systemInstruction });
      text = result.text;
      latencyMs = result.latencyMs;
    } catch (error: any) {
      console.error('[AIOrchestrator Text Error - Falling back]:', error.message || error);
      text = `[STEMPACT Academic Assistant]: Based on approved academic standards, here is guidance for: "${prompt.slice(0, 100)}...". Please consult your course instructor or academic office for specifics.`;
    }

    try {
      await prisma.aIAuditLog.create({
        data: {
          userId,
          userRole,
          action: actionType,
          resourceType: 'CONVERSATIONAL_ASSISTANT',
          inputSummary: prompt.slice(0, 180),
          model,
          provider: provider.name,
          latencyMs,
          approved: true,
        },
      });
    } catch (auditErr: any) {
      console.warn('[AIOrchestrator Audit Warning] Could not log conversational audit log:', auditErr.message);
    }

    return text;
  }
}

