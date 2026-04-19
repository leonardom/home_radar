import nodemailer from "nodemailer";

import { env } from "../../config/env";
import type { EmailSender, SendEmailInput } from "./email.sender";

export class SmtpEmailSender implements EmailSender {
  private readonly transporter;

  constructor() {
    if (!env.SMTP_HOST) {
      throw new Error("SMTP_HOST is required for SMTP email sender");
    }

    this.transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth:
        env.SMTP_USER && env.SMTP_PASSWORD
          ? {
              user: env.SMTP_USER,
              pass: env.SMTP_PASSWORD,
            }
          : undefined,
    });
  }

  async send(input: SendEmailInput): Promise<void> {
    await this.transporter.sendMail({
      from: env.EMAIL_FROM,
      to: input.to,
      subject: input.subject,
      text: input.body,
    });
  }
}
