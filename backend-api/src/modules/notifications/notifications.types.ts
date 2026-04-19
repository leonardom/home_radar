export type NotificationChannel = "email";

export type NotificationStatus = "pending" | "sent" | "failed";

export type Notification = {
  id: string;
  userId: string;
  matchId: string;
  channel: NotificationChannel;
  subject: string;
  body: string;
  status: NotificationStatus;
  sentAt: Date | null;
  failedAt: Date | null;
  failureReason: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateNotificationInput = {
  userId: string;
  matchId: string;
  channel: NotificationChannel;
  subject: string;
  body: string;
};
