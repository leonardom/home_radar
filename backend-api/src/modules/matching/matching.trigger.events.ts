export type PropertyCreatedEvent = {
  id: string;
  type: "property.created";
  occurredAt: Date;
  payload: {
    propertyId: string;
  };
};

export type PropertyUpdatedEvent = {
  id: string;
  type: "property.updated";
  occurredAt: Date;
  payload: {
    propertyId: string;
  };
};

export type FilterCreatedEvent = {
  id: string;
  type: "filter.created";
  occurredAt: Date;
  payload: {
    filterId: string;
    userId: string;
  };
};

export type MatchingTriggerEvent = PropertyCreatedEvent | PropertyUpdatedEvent | FilterCreatedEvent;
