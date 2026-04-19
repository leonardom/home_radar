export type SendEmailInput = {
  to: string;
  subject: string;
  body: string;
};

export interface EmailSender {
  send(input: SendEmailInput): Promise<void>;
}
