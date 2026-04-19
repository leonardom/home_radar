import type { EmailSender, SendEmailInput } from "./email.sender";

export class LogEmailSender implements EmailSender {
  async send(input: SendEmailInput): Promise<void> {
    console.info("Email delivery (log sender)", {
      to: input.to,
      subject: input.subject,
      body: input.body,
    });
  }
}
