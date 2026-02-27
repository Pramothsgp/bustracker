import type { EmailProvider, EmailOptions } from "../types.js";

export class ConsoleProvider implements EmailProvider {
  async send(options: EmailOptions): Promise<void> {
    console.log(`[Email] To: ${options.to}`);
    console.log(`[Email] Subject: ${options.subject}`);
    console.log(`[Email] Body: ${options.text}`);
  }
}
