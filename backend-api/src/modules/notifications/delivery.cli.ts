import { closeDatabasePool } from "../../config/db";
import { UsersRepository } from "../users/users.repository";
import { createEmailSender } from "./notification-email-factory";
import { NotificationsDeliveryService } from "./notifications.delivery.service";
import { NotificationsRepository } from "./notifications.repository";

const parseLimitArg = (): number => {
  const arg = process.argv.find((entry) => entry.startsWith("--limit="));
  const value = arg ? Number(arg.split("=")[1]) : 100;

  if (!Number.isInteger(value) || value <= 0) {
    throw new Error("--limit must be a positive integer");
  }

  return value;
};

const run = async (): Promise<void> => {
  const limit = parseLimitArg();

  const notificationsRepository = new NotificationsRepository();
  const usersRepository = new UsersRepository();
  const emailSender = createEmailSender();
  const deliveryService = new NotificationsDeliveryService(
    notificationsRepository,
    usersRepository,
    emailSender,
  );

  const summary = await deliveryService.deliverPending(limit);

  console.info("Notifications delivery finished", summary);

  await closeDatabasePool();
};

run().catch(async (error: unknown) => {
  console.error("Notifications delivery failed", {
    error: error instanceof Error ? error.message : String(error),
  });

  process.exitCode = 1;
  await closeDatabasePool();
});
