import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import type { EmailProvider, EmailOptions } from "../types.js";

export class SmtpProvider implements EmailProvider {
  private transporter: Transporter;
  private from: string;

  constructor(config: {
    host: string;
    port: number;
    secure?: boolean;
    user: string;
    pass: string;
    from: string;
  }) {
    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure ?? config.port === 465,
      auth: {
        user: config.user,
        pass: config.pass,
      },
    });
    this.from = config.from;
  }

  async send(options: EmailOptions): Promise<void> {
    await this.transporter.sendMail({
      from: this.from,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });
  }
}
