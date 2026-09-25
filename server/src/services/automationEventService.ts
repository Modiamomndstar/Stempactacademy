import EventEmitter from 'events';

export type AutomationEventType =
  | 'ADMISSION_OFFER_ISSUED'
  | 'ADMISSION_OFFER_ACCEPTED'
  | 'ADMISSION_OFFER_DECLINED'
  | 'ADMISSION_OFFER_WITHDRAWN'
  | 'FINANCIAL_CLEARANCE_EVALUATED'
  | 'FINANCIAL_CLEARANCE_WAIVED'
  | 'ENROLLMENT_COMPLETED';

export interface AutomationEventPayload {
  eventType: AutomationEventType;
  timestamp: Date;
  entityId: string;
  data: Record<string, any>;
}

class AutomationEventService extends EventEmitter {
  private recordedEvents: AutomationEventPayload[] = [];

  emitLifecycleEvent(eventType: AutomationEventType, entityId: string, data: Record<string, any>): boolean {
    const payload: AutomationEventPayload = {
      eventType,
      timestamp: new Date(),
      entityId,
      data,
    };
    this.recordedEvents.push(payload);
    return this.emit(eventType, payload);
  }

  getRecordedEvents(filter?: { eventType?: AutomationEventType; entityId?: string }): AutomationEventPayload[] {
    return this.recordedEvents.filter((e) => {
      if (filter?.eventType && e.eventType !== filter.eventType) return false;
      if (filter?.entityId && e.entityId !== filter.entityId) return false;
      return true;
    });
  }

  clearRecordedEvents(): void {
    this.recordedEvents = [];
  }
}

export const automationEventService = new AutomationEventService();
