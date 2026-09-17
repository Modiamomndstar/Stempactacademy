import { z } from 'zod';
import { AIActionType, WorkflowStatus, Role } from '@prisma/client';
import prisma from '../../config/prisma.js';
import { getAIProvider } from './aiProvider.js';
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

    // 1. Execute generation through the provider
    const result = await provider.generateStructured<T>(req.prompt, req.schema, req.options);

    // 2. Persist the AI generation record as a DRAFT in Prisma
    const aiGeneration = await prisma.aIGeneration.create({
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

    // 3. Log audit event
    await prisma.aIAuditLog.create({
      data: {
        userId: req.userId,
        userRole: req.userRole,
        action: req.actionType,
        resourceType: req.actionType.replace('_GENERATION', ''),
        resourceId: aiGeneration.id,
        inputSummary: req.prompt.slice(0, 180),
        model: result.model,
        provider: result.provider,
        latencyMs: result.latencyMs,
        approved: false,
      },
    });

    return {
      id: aiGeneration.id,
      structured: result.structured,
      status: aiGeneration.status,
      tokensPrompt: result.tokensPrompt,
      tokensCompletion: result.tokensCompletion,
      latencyMs: result.latencyMs,
      model: result.model,
      createdAt: aiGeneration.createdAt,
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

    const result = await provider.generateText(prompt, { systemInstruction });

    await prisma.aIAuditLog.create({
      data: {
        userId,
        userRole,
        action: actionType,
        resourceType: 'CONVERSATIONAL_ASSISTANT',
        inputSummary: prompt.slice(0, 180),
        model: 'gemini-2.5-flash',
        provider: provider.name,
        latencyMs: result.latencyMs,
        approved: true, // conversational responses do not alter database records
      },
    });

    return result.text;
  }
}
