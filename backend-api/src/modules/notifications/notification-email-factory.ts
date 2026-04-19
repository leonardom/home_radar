import { env } from "../../config/env";
import type { EmailSender } from "./email.sender";
import { LogEmailSender } from "./log-email.sender";
import { SendgridEmailSender } from "./sendgrid-email.sender";

export const createEmailSender = (): EmailSender => {
  if (env.SENDGRID_API_KEY) {
    return new SendgridEmailSender();
  }

  return new LogEmailSender();
};
