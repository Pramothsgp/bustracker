import { Resend } from "resend";
import type { EmailProvider, EmailOptions } from "../types.js";

export class ResendProvider implements EmailProvider {
  private client: Resend;
  private from: string;

  constructor(apiKey: string, from: string) {
    this.client = new Resend(apiKey);
    this.from = from;
  }

  async send(options: EmailOptions): Promise<void> {
    const { error } = await this.client.emails.send({
      from: this.from,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });

    if (error) {
      throw new Error(`Resend error: ${error.message}`);
    }
  }
}
