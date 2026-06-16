// Server-only file - không được import ở client-side
if (typeof window !== 'undefined') {
  throw new Error('File này chỉ có thể chạy ở server-side');
}

import nodemailer from 'nodemailer';
import { dbg } from '../debug';

const log = dbg.email;

/**
 * Tạo SMTP transporter
 */
function createTransporter() {
  const smtpHost = process.env.SMTP_HOST || 'mail.cms.vitieltstest.com';
  const smtpPort = parseInt(process.env.SMTP_PORT || '465');
  const smtpUser = process.env.SMTP_USER || 'admin@cms.vitieltstest.com';
  const smtpPassword = process.env.SMTP_PASSWORD || 'vitieltstest';
  const smtpFrom = process.env.SMTP_FROM || smtpUser;
  const smtpFromName = process.env.SMTP_FROM_NAME || 'Vit IELTS';

  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465, // true for 465, false for other ports
    auth: {
      user: smtpUser,
      pass: smtpPassword,
    },
  });
}

/**
 * Gửi email qua SMTP
 * 
 * @param to - Email người nhận
 * @param subject - Tiêu đề email
 * @param html - Nội dung email (HTML)
 * @param text - Nội dung email (plain text, optional)
 * @returns Promise<boolean> - true nếu gửi thành công
 */
export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  text?: string
): Promise<boolean> {
  try {
    const smtpFrom = process.env.SMTP_FROM || process.env.SMTP_USER || 'admin@cms.vitieltstest.com';
    const smtpFromName = process.env.SMTP_FROM_NAME || 'Vit IELTS';

    const transporter = createTransporter();

    const mailOptions = {
      from: `"${smtpFromName}" <${smtpFrom}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML tags for plain text
    };

    const info = await transporter.sendMail(mailOptions);
    
    log(`[Email] Email sent successfully to ${to}`);
    log(`[Email] Message ID: ${info.messageId}`);
    
    return true;
  } catch (error) {
    log.error(`[Email] Error sending email to ${to}:`, error);
    log.error(`[Email] Error details:`, error instanceof Error ? error.message : 'Unknown error');
    return false;
  }
}

/**
 * Verify SMTP connection
 * 
 * @returns Promise<boolean> - true nếu kết nối thành công
 */
export async function verifySMTPConnection(): Promise<boolean> {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    log('[Email] SMTP connection verified successfully');
    return true;
  } catch (error) {
    log.error('[Email] SMTP connection verification failed:', error);
    return false;
  }
}
