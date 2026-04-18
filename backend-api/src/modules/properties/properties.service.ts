import type { MatchingTriggerDispatcher } from "../matching/matching.trigger.dispatcher";
import { NoopMatchingTriggerDispatcher } from "../matching/matching.trigger.dispatcher";
import { PropertiesRepository } from "./properties.repository";
import type { Property, UpsertPropertyInput } from "./properties.types";

export class PropertiesService {
  constructor(
    private readonly propertiesRepository: PropertiesRepository,
    private readonly matchingTriggerDispatcher: MatchingTriggerDispatcher = new NoopMatchingTriggerDispatcher(),
  ) {}

  async createProperty(input: UpsertPropertyInput): Promise<Property> {
    const existing = await this.propertiesRepository.findBySourceIdentity(
      input.source,
      input.externalListingId,
    );

    const property = await this.propertiesRepository.upsertProperty(input);

    if (existing) {
      await this.matchingTriggerDispatcher.dispatchPropertyUpdated({
        propertyId: property.id,
      });
    } else {
      await this.matchingTriggerDispatcher.dispatchPropertyCreated({
        propertyId: property.id,
      });
    }

    return property;
  }

  async updateProperty(input: UpsertPropertyInput): Promise<Property> {
    const existing = await this.propertiesRepository.findBySourceIdentity(
      input.source,
      input.externalListingId,
    );

    const property = await this.propertiesRepository.upsertProperty(input);

    if (existing) {
      await this.matchingTriggerDispatcher.dispatchPropertyUpdated({
        propertyId: property.id,
      });
    } else {
      await this.matchingTriggerDispatcher.dispatchPropertyCreated({
        propertyId: property.id,
      });
    }

    return property;
  }
}
