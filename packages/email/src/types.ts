export interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export interface EmailProvider {
  send(options: EmailOptions): Promise<void>;
}

export interface EmailClientConfig {
  provider: "console" | "resend";
  resend?: {
    apiKey: string;
    from: string;
  };
}
