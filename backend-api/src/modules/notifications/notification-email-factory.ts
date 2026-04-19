import { env } from "../../config/env";
import type { EmailSender } from "./email.sender";
import { LogEmailSender } from "./log-email.sender";
import { SmtpEmailSender } from "./smtp-email.sender";

export const createEmailSender = (): EmailSender => {
  if (env.SMTP_HOST) {
    return new SmtpEmailSender();
  }

  return new LogEmailSender();
};
