import nodemailer from 'nodemailer';
import { config } from '../config/index.js';

let transporter: nodemailer.Transporter | null = null;

if (config.smtp.host && config.smtp.user) {
  transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.port === 465,
    auth: {
      user: config.smtp.user,
      pass: config.smtp.pass,
    },
  });
}

export interface EmailNotificationPayload {
  to: string;
  subject: string;
  template: string;
  variables: {
    form_name: string;
    respondent_name: string;
    submission_date: string;
    [key: string]: string;
  };
}

export function replaceTemplateVariables(template: string, vars: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    result = result.replace(regex, value);
  }
  return result;
}

export async function sendEmailNotification(payload: EmailNotificationPayload): Promise<boolean> {
  const renderedBody = replaceTemplateVariables(payload.template, payload.variables);
  const renderedSubject = replaceTemplateVariables(payload.subject, payload.variables);

  if (!transporter) {
    console.log(`✉️ [Email Service Simulation]`);
    console.log(`   To: ${payload.to}`);
    console.log(`   Subject: ${renderedSubject}`);
    console.log(`   Body:\n${renderedBody}`);
    return true;
  }

  try {
    await transporter.sendMail({
      from: config.smtp.from,
      to: payload.to,
      subject: renderedSubject,
      text: renderedBody,
      html: renderedBody.replace(/\n/g, '<br/>'),
    });
    return true;
  } catch (err) {
    console.error('Failed to send email via SMTP:', err);
    return false;
  }
}
