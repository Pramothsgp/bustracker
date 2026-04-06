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
  provider: "console" | "resend" | "smtp";
  resend?: {
    apiKey: string;
    from: string;
  };
  smtp?: {
    host: string;
    port: number;
    secure?: boolean;
    user: string;
    pass: string;
    from: string;
  };
}
