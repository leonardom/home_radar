import { z } from "zod";

export const MatchResponseSchema = z.object({
  id: z.uuid(),
  userId: z.uuid(),
  propertyId: z.uuid(),
  filterId: z.uuid().nullable(),
  matchReasons: z.array(z.string().min(1)),
  matchedAt: z.string().datetime(),
  createdAt: z.string().datetime(),
});

export const MatchListResponseSchema = z.object({
  items: z.array(MatchResponseSchema),
});
