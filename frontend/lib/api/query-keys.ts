import type { ListSavedPropertiesParams } from "@/types/api";

export const queryKeys = {
  auth: {
    all: ["auth"] as const,
    providers: () => ["auth", "providers"] as const,
  },

  user: {
    all: ["user"] as const,
    me: () => ["user", "me"] as const,
    preferences: () => ["user", "preferences"] as const,
  },

  filters: {
    all: ["filters"] as const,
    list: () => ["filters", "list"] as const,
  },

  matches: {
    all: ["matches"] as const,
    me: () => ["matches", "me"] as const,
  },

  savedProperties: {
    all: ["saved-properties"] as const,
    list: (params: ListSavedPropertiesParams = {}) =>
      ["saved-properties", "list", params] as const,
  },
};
