export type { EmailOptions, EmailProvider, EmailClientConfig } from "./types.js";
export { ConsoleProvider } from "./providers/console.js";
export { ResendProvider } from "./providers/resend.js";
export { SmtpProvider } from "./providers/smtp.js";

import type { EmailProvider, EmailClientConfig } from "./types.js";
import { ConsoleProvider } from "./providers/console.js";
import { ResendProvider } from "./providers/resend.js";
import { SmtpProvider } from "./providers/smtp.js";

export function createEmailClient(config: EmailClientConfig): EmailProvider {
  switch (config.provider) {
    case "smtp": {
      if (!config.smtp) {
        throw new Error(
          "SMTP config (host, port, user, pass, from) is required when provider is 'smtp'",
        );
      }
      return new SmtpProvider(config.smtp);
    }
    case "resend": {
      if (!config.resend) {
        throw new Error("Resend config (apiKey, from) is required when provider is 'resend'");
      }
      return new ResendProvider(config.resend.apiKey, config.resend.from);
    }
    case "console":
    default:
      return new ConsoleProvider();
  }
}
