export type FilterCreatedDispatchPayload = {
  filterId: string;
  userId: string;
};

export type PropertyEventDispatchPayload = {
  propertyId: string;
};

export interface MatchingTriggerDispatcher {
  dispatchPropertyCreated(payload: PropertyEventDispatchPayload): Promise<void>;
  dispatchPropertyUpdated(payload: PropertyEventDispatchPayload): Promise<void>;
  dispatchFilterCreated(payload: FilterCreatedDispatchPayload): Promise<void>;
}

export class NoopMatchingTriggerDispatcher implements MatchingTriggerDispatcher {
  async dispatchPropertyCreated(): Promise<void> {
    return;
  }

  async dispatchPropertyUpdated(): Promise<void> {
    return;
  }

  async dispatchFilterCreated(): Promise<void> {
    return;
  }
}
