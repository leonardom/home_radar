import sendgridMail from "@sendgrid/mail";

import { env } from "../../config/env";
import type { EmailSender, SendEmailInput } from "./email.sender";

export class SendgridEmailSender implements EmailSender {
  constructor() {
    if (!env.SENDGRID_API_KEY) {
      throw new Error("SENDGRID_API_KEY is required for SendGrid email sender");
    }

    sendgridMail.setApiKey(env.SENDGRID_API_KEY);
  }

  async send(input: SendEmailInput): Promise<void> {
    await sendgridMail.send({
      from: env.EMAIL_FROM,
      to: input.to,
      subject: input.subject,
      text: input.body,
    });
  }
}
