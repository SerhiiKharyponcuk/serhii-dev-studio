import nodemailer from "nodemailer";
import { env } from "../../config/env.js";

export async function sendAccountEmail(to: string, subject: string, text: string) {
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASSWORD) return false;
  const transport = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD }
  });
  await transport.sendMail({ from: env.SMTP_FROM, to, subject, text });
  return true;
}
