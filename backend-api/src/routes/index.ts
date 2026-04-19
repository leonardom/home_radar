import type { FastifyInstance } from "fastify";

import { registerAuthRoutes } from "../modules/auth/auth.routes";
import { registerFiltersRoutes } from "../modules/filters/filters.routes";
import { registerHealthRoutes } from "../modules/health/health.routes";
import { registerMatchesRoutes } from "../modules/matches/matches.routes";
import { registerNotificationPreferencesRoutes } from "../modules/notification-preferences/notification-preferences.routes";
import { registerNotificationsRoutes } from "../modules/notifications/notifications.routes";
import { registerSavedPropertiesRoutes } from "../modules/saved-properties/saved-properties.routes";
import { registerSyncRoutes } from "../modules/properties/sync.routes";
import { registerUsersRoutes } from "../modules/users/users.routes";

export const registerRoutes = async (app: FastifyInstance): Promise<void> => {
  app.register(registerAuthRoutes, { prefix: "/api" });
  app.register(registerFiltersRoutes, { prefix: "/api" });
  app.register(registerHealthRoutes, { prefix: "/api" });
  app.register(registerMatchesRoutes, { prefix: "/api" });
  app.register(registerNotificationPreferencesRoutes, { prefix: "/api" });
  app.register(registerNotificationsRoutes, { prefix: "/api" });
  app.register(registerSavedPropertiesRoutes, { prefix: "/api" });
  app.register(registerSyncRoutes, { prefix: "/api" });
  app.register(registerUsersRoutes, { prefix: "/api" });
};
