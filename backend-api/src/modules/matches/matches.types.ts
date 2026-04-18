export type Match = {
  id: string;
  userId: string;
  propertyId: string;
  filterId: string | null;
  matchReasons: string[];
  matchedAt: Date;
  createdAt: Date;
};

export type CreateMatchInput = {
  userId: string;
  propertyId: string;
  filterId: string | null;
  matchReasons: string[];
  matchedAt: Date;
};
