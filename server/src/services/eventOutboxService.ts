import { PrismaClient, OutboxStatus, Prisma } from '@prisma/client';
import prisma from '../config/prisma.js';

export type DbClient = PrismaClient | Prisma.TransactionClient;

export interface RecordOutboxEventParams {
  eventType: string;
  aggregateType: string;
  aggregateId: string;
  payload: Record<string, any>;
  idempotencyKey?: string;
  maxAttempts?: number;
}

export interface OutboxEventHandler {
  (event: {
    id: string;
    eventType: string;
    aggregateType: string;
    aggregateId: string;
    payload: Record<string, any>;
    attempts: number;
  }): Promise<void>;
}

class EventOutboxService {
  private handlers = new Map<string, OutboxEventHandler[]>();

  /**
   * Register a handler for a specific eventType.
   */
  registerHandler(eventType: string, handler: OutboxEventHandler): void {
    const list = this.handlers.get(eventType) || [];
    list.push(handler);
    this.handlers.set(eventType, list);
  }

  /**
   * Clear handlers (useful for isolated tests).
   */
  clearHandlers(): void {
    this.handlers.clear();
  }

  /**
   * Atomically record an outbox event within a transaction or standalone dbClient.
   * Ensures that if the transaction rolls back, the outbox record is not committed.
   */
  async recordOutboxEvent(
    dbClient: DbClient,
    params: RecordOutboxEventParams
  ) {
    const idempotencyKey =
      params.idempotencyKey ||
      `evt_${params.eventType}_${params.aggregateType}_${params.aggregateId}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const payloadString = typeof params.payload === 'string'
      ? params.payload
      : JSON.stringify(params.payload);

    return (dbClient as any).eventOutbox.upsert({
      where: { idempotencyKey },
      update: {}, // Idempotent: if already exists, do not duplicate
      create: {
        eventType: params.eventType,
        aggregateType: params.aggregateType,
        aggregateId: params.aggregateId,
        idempotencyKey,
        payload: payloadString,
        status: OutboxStatus.PENDING,
        attempts: 0,
        maxAttempts: params.maxAttempts ?? 5,
        nextAttemptAt: new Date(),
      },
    });
  }

  /**
   * Process a batch of pending outbox events with retry and exponential backoff.
   */
  async processOutboxEvents(batchSize = 25): Promise<{
    processed: number;
    failed: number;
    deadLetter: number;
  }> {
    const now = new Date();

    const pendingEvents = await prisma.eventOutbox.findMany({
      where: {
        status: OutboxStatus.PENDING,
        nextAttemptAt: { lte: now },
      },
      orderBy: { createdAt: 'asc' },
      take: batchSize,
    });

    let processed = 0;
    let failed = 0;
    let deadLetter = 0;

    for (const event of pendingEvents) {
      const outcome = await this.processSingleEvent(event);
      if (outcome.status === 'PROCESSED') processed++;
      else if (outcome.status === 'DEAD_LETTER') deadLetter++;
      else failed++;
    }

    return { processed, failed, deadLetter };
  }

  /**
   * Process a single event immediately (used by workers or synchronous lifecycle tests).
   */
  async processSingleEvent(event: any): Promise<{ status: OutboxStatus; error?: string }> {
    const currentAttempts = event.attempts + 1;
    const maxAttempts = event.maxAttempts || 5;

    // Transition to PROCESSING
    await prisma.eventOutbox.update({
      where: { id: event.id },
      data: {
        status: OutboxStatus.PROCESSING,
        attempts: currentAttempts,
      },
    });

    try {
      let payloadParsed: Record<string, any> = {};
      try {
        payloadParsed = JSON.parse(event.payload);
      } catch {
        payloadParsed = { raw: event.payload };
      }

      // Execute registered handlers
      const handlers = this.handlers.get(event.eventType) || [];
      const wildcardHandlers = this.handlers.get('*') || [];
      const allHandlers = [...handlers, ...wildcardHandlers];

      for (const handler of allHandlers) {
        await handler({
          id: event.id,
          eventType: event.eventType,
          aggregateType: event.aggregateType,
          aggregateId: event.aggregateId,
          payload: payloadParsed,
          attempts: currentAttempts,
        });
      }

      // Mark as PROCESSED
      await prisma.eventOutbox.update({
        where: { id: event.id },
        data: {
          status: OutboxStatus.PROCESSED,
          processedAt: new Date(),
          lastError: null,
        },
      });

      return { status: OutboxStatus.PROCESSED };
    } catch (error: any) {
      const errorMsg = error?.message || String(error);
      const isDeadLetter = currentAttempts >= maxAttempts;
      const nextStatus = isDeadLetter ? OutboxStatus.DEAD_LETTER : OutboxStatus.PENDING;

      // Exponential backoff: 2^attempt * 5 seconds (up to 1 hour)
      const delaySeconds = Math.min(3600, Math.pow(2, currentAttempts) * 5);
      const nextAttemptAt = new Date(Date.now() + delaySeconds * 1000);

      await prisma.eventOutbox.update({
        where: { id: event.id },
        data: {
          status: nextStatus,
          lastError: errorMsg.slice(0, 1000),
          nextAttemptAt: isDeadLetter ? new Date() : nextAttemptAt,
        },
      });

      return { status: nextStatus, error: errorMsg };
    }
  }

  /**
   * Health and monitoring metrics for outbox pipeline.
   */
  async getOutboxMetrics(): Promise<{
    pending: number;
    processing: number;
    processed: number;
    failed: number;
    deadLetter: number;
  }> {
    const counts = await prisma.eventOutbox.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    const metrics = {
      pending: 0,
      processing: 0,
      processed: 0,
      failed: 0,
      deadLetter: 0,
    };

    for (const c of counts) {
      if (c.status === OutboxStatus.PENDING) metrics.pending = c._count.id;
      else if (c.status === OutboxStatus.PROCESSING) metrics.processing = c._count.id;
      else if (c.status === OutboxStatus.PROCESSED) metrics.processed = c._count.id;
      else if (c.status === OutboxStatus.FAILED) metrics.failed = c._count.id;
      else if (c.status === OutboxStatus.DEAD_LETTER) metrics.deadLetter = c._count.id;
    }

    return metrics;
  }
}

export const eventOutboxService = new EventOutboxService();
