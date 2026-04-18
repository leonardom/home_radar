import type { SearchFilter } from "../filters/filters.types";
import { MatchingService } from "./matching.service";
import type { FilterCreatedEvent, MatchingTriggerEvent } from "./matching.trigger.events";
import type {
  FilterCreatedDispatchPayload,
  MatchingTriggerDispatcher,
  PropertyEventDispatchPayload,
} from "./matching.trigger.dispatcher";
import type { PropertyCandidate, PropertyFilterMatch } from "./matching.types";

export interface TriggerEventStore {
  hasProcessed(eventId: string): Promise<boolean>;
  markProcessed(eventId: string): Promise<void>;
}

export interface TriggerLogger {
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
}

export interface MatchingSink {
  consume(matches: PropertyFilterMatch[], event: MatchingTriggerEvent): Promise<void>;
}

export interface MatchingFiltersReader {
  findCandidateFiltersForProperty(property: PropertyCandidate): Promise<SearchFilter[]>;
  findFilterByIdForUser(filterId: string, userId: string): Promise<SearchFilter | null>;
}

export interface MatchingPropertiesReader {
  findPropertyById(propertyId: string): Promise<PropertyCandidate | null>;
  findCandidatePropertiesForFilter(filter: SearchFilter): Promise<PropertyCandidate[]>;
}

const defaultLogger: TriggerLogger = {
  info(message, meta) {
    console.info(message, meta);
  },
  warn(message, meta) {
    console.warn(message, meta);
  },
  error(message, meta) {
    console.error(message, meta);
  },
};

const generateEventId = (): string => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

export class MatchingTriggerService implements MatchingTriggerDispatcher {
  constructor(
    private readonly matchingService: MatchingService,
    private readonly filtersReader: MatchingFiltersReader,
    private readonly propertiesReader: MatchingPropertiesReader,
    private readonly eventStore: TriggerEventStore,
    private readonly matchingSink: MatchingSink,
    private readonly logger: TriggerLogger = defaultLogger,
    private readonly maxRetries: number = 3,
  ) {}

  async dispatchFilterCreated(payload: FilterCreatedDispatchPayload): Promise<void> {
    const event: FilterCreatedEvent = {
      id: generateEventId(),
      type: "filter.created",
      occurredAt: new Date(),
      payload,
    };

    await this.handleEvent(event);
  }

  async dispatchPropertyCreated(payload: PropertyEventDispatchPayload): Promise<void> {
    await this.handleEvent({
      id: generateEventId(),
      type: "property.created",
      occurredAt: new Date(),
      payload,
    });
  }

  async dispatchPropertyUpdated(payload: PropertyEventDispatchPayload): Promise<void> {
    await this.handleEvent({
      id: generateEventId(),
      type: "property.updated",
      occurredAt: new Date(),
      payload,
    });
  }

  async handleEvent(event: MatchingTriggerEvent): Promise<void> {
    const alreadyProcessed = await this.eventStore.hasProcessed(event.id);
    if (alreadyProcessed) {
      this.logger.info("Skipping already processed matching event", {
        eventId: event.id,
        eventType: event.type,
      });
      return;
    }

    let lastError: unknown;

    for (let attempt = 1; attempt <= this.maxRetries; attempt += 1) {
      try {
        const matches = await this.resolveMatches(event);

        await this.matchingSink.consume(matches, event);
        await this.eventStore.markProcessed(event.id);

        this.logger.info("Matching event processed", {
          eventId: event.id,
          eventType: event.type,
          attempt,
          matches: matches.length,
        });

        return;
      } catch (error: unknown) {
        lastError = error;
        this.logger.error("Matching event processing failed", {
          eventId: event.id,
          eventType: event.type,
          attempt,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    throw lastError;
  }

  private async resolveMatches(event: MatchingTriggerEvent): Promise<PropertyFilterMatch[]> {
    if (event.type === "property.created" || event.type === "property.updated") {
      const property = await this.propertiesReader.findPropertyById(event.payload.propertyId);

      if (!property) {
        this.logger.warn("Property not found for matching event", {
          eventId: event.id,
          propertyId: event.payload.propertyId,
        });
        return [];
      }

      const filters = await this.filtersReader.findCandidateFiltersForProperty(property);

      return this.matchingService.matchPropertyAgainstFilters(property, filters, event.occurredAt);
    }

    const filter = await this.filtersReader.findFilterByIdForUser(
      event.payload.filterId,
      event.payload.userId,
    );

    if (!filter) {
      this.logger.warn("Filter not found for matching event", {
        eventId: event.id,
        filterId: event.payload.filterId,
        userId: event.payload.userId,
      });
      return [];
    }

    const properties = await this.propertiesReader.findCandidatePropertiesForFilter(filter);
    const matches: PropertyFilterMatch[] = [];

    for (const property of properties) {
      const match = this.matchingService.matchPropertyAgainstFilter(
        property,
        filter,
        event.occurredAt,
      );
      if (match) {
        matches.push(match);
      }
    }

    return matches;
  }
}
