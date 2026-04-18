import type { TriggerEventStore } from "./matching.trigger.service";

export class InMemoryTriggerEventStore implements TriggerEventStore {
  private readonly processedEventIds = new Set<string>();

  async hasProcessed(eventId: string): Promise<boolean> {
    return this.processedEventIds.has(eventId);
  }

  async markProcessed(eventId: string): Promise<void> {
    this.processedEventIds.add(eventId);
  }
}
