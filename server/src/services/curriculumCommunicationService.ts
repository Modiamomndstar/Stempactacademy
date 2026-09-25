import prisma from '../config/prisma.js';
import { notificationDispatcher } from './notificationDispatcher.js';
import { eventOutboxService, DbClient } from './eventOutboxService.js';
import { NotificationChannel } from '@prisma/client';

export interface CurriculumCommunicationPayload {
  curriculumVersionId: string;
  cohortId?: string;
  courseId?: string;
  moduleId?: string;
  lessonId?: string;
  senderUserId: string;
  title: string;
  message: string;
  type?: 'INFO' | 'SUCCESS' | 'WARNING' | 'ALERT';
  channels?: NotificationChannel[];
}

export class CurriculumCommunicationService {
  /**
   * Broadcast an academic communication strictly scoped to learners actively enrolled
   * in the specified curriculumVersionId.
   */
  async broadcastCurriculumUpdate(
    payload: CurriculumCommunicationPayload,
    dbClient: DbClient = prisma
  ): Promise<{
    targetedEnrollments: number;
    dispatchedCount: number;
    enqueuedEventId?: string;
  }> {
    // 1. Verify the curriculum version exists
    const curriculumVersion = await (dbClient as any).curriculumVersion.findUnique({
      where: { id: payload.curriculumVersionId },
      include: { curriculum: { include: { program: true } } },
    });

    if (!curriculumVersion) {
      throw new Error(`CurriculumVersion not found: ${payload.curriculumVersionId}`);
    }

    // 2. Query active enrollments strictly anchored to this curriculumVersionId
    const enrollmentWhere: any = {
      curriculumVersionId: payload.curriculumVersionId,
      status: 'ACTIVE',
    };

    if (payload.cohortId) {
      enrollmentWhere.cohortId = payload.cohortId;
    }

    const activeEnrollments = await (dbClient as any).studentCohortEnrollment.findMany({
      where: enrollmentWhere,
      include: {
        student: {
          include: {
            user: true,
          },
        },
      },
    });

    // 3. Atomically enqueue outbox event for auditability
    const outboxRecord = await eventOutboxService.recordOutboxEvent(dbClient, {
      eventType: 'ACADEMIC_CURRICULUM_COMMUNICATION',
      aggregateType: 'CurriculumVersion',
      aggregateId: payload.curriculumVersionId,
      payload: {
        curriculumVersionId: payload.curriculumVersionId,
        programName: curriculumVersion.curriculum?.program?.name || 'Academic Program',
        cohortId: payload.cohortId || null,
        title: payload.title,
        message: payload.message,
        recipientCount: activeEnrollments.length,
        senderUserId: payload.senderUserId,
      },
    });

    // 4. Dispatch notification to each strictly verified enrolled learner
    let dispatched = 0;
    for (const enrollment of activeEnrollments) {
      const studentUser = enrollment.student.user;
      await notificationDispatcher.dispatch({
        userId: studentUser.id,
        recipientEmail: studentUser.email,
        title: payload.title,
        message: payload.message,
        type: payload.type || 'INFO',
        relatedEntity: payload.lessonId ? 'LESSON' : 'SYSTEM',
        relatedEntityId: payload.lessonId || payload.curriculumVersionId,
        channels: payload.channels || [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
        category: 'ACADEMIC',
        isMandatory: false,
      });
      dispatched++;
    }

    return {
      targetedEnrollments: activeEnrollments.length,
      dispatchedCount: dispatched,
      enqueuedEventId: outboxRecord.id,
    };
  }
}

export const curriculumCommunicationService = new CurriculumCommunicationService();
