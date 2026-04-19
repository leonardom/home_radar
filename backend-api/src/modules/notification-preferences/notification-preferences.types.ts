export type NotificationMode = "instant" | "digest";

export type NotificationPreference = {
  userId: string;
  mode: NotificationMode;
  createdAt: Date;
  updatedAt: Date;
};
