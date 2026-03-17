/**
 * Email Service — Contact, order confirmation, admin notification emails
 *
 * Wrapper quanh lib/server/email-helper.ts (giữ nguyên)
 * Extracts email template logic từ sepay.ts
 *
 * ⚠️ Server-only — KHÔNG import ở client-side
 *
 * @origin functions.php L868–937 (SendContactEmail)
 * @origin sepay.ts L150–258 (sendCustomerEmail)
 * @origin sepay.ts L263–370 (sendAdminEmail)
 */

import { sendEmail } from "~server/email-helper";
import { encode } from "html-entities";

// ============================================================
// Shared Email Template
// ============================================================

/**
 * Build a complete HTML email from a title and body content.
 * Provides the shared shell (header gradient, footer, responsive table layout).
 */
function buildEmailHtml(title: string, bodyHtml: string): string {
    return `
<html lang="vi">
<head><meta charset="UTF-8" /><title>${encode(title)}</title></head>
<body style="margin:0; padding:0; background-color:#f4f6f8; font-family: Arial, Helvetica, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f8; padding:20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:8px; overflow:hidden;">
          <tr>
            <td style="background-color:#c62828; background-image: linear-gradient(90deg, #c62828, #e53935, #ff5252); padding:20px; text-align:center;">
              <h1 style="margin:0; color:#ffffff; font-size:22px;">${encode(title)}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:30px; color:#333333; font-size:15px; line-height:1.6;">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="background-color:#f0f2f5; padding:15px; text-align:center; font-size:12px; color:#777777;">
              © ${new Date().getFullYear()} IELTS Prediction. All rights reserved.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Build an order details table (shared between customer + admin emails).
 */
function buildOrderTable(rows: Array<[string, string]>): string {
    const trs = rows
        .map(
            ([label, value]) =>
                `<tr><td style="padding:8px 0;">${label}:</td><td style="padding:8px 0; text-align:right;"><strong>${value}</strong></td></tr>`,
        )
        .join("");
    return `<table width="100%" cellpadding="0" cellspacing="0" style="margin:15px 0; font-size:14px;">${trs}</table>`;
}

// ============================================================
// Contact Email
// ============================================================

/**
 * Gửi email liên hệ từ form contact
 *
 * @origin functions.php L868–937
 */
export async function sendContactEmail(
    name: string,
    email: string,
    subject: string,
    message: string,
): Promise<boolean> {
    const adminEmail =
        process.env.ADMIN_EMAIL || "admin@ieltspredictiontest.com";

    const bodyHtml = `
<p><strong>Họ tên:</strong> ${encode(name)}</p>
<p><strong>Email:</strong> ${encode(email)}</p>
<p><strong>Tiêu đề:</strong> ${encode(subject)}</p>
<p><strong>Nội dung:</strong></p>
<p>${encode(message).replace(/\n/g, "<br/>")}</p>`;

    return sendEmail(adminEmail, `[Contact] ${subject}`, buildEmailHtml("Liên hệ mới", bodyHtml));
}

// ============================================================
// Order Confirmation Email (for customer)
// ============================================================

/**
 * Gửi email xác nhận thanh toán cho khách hàng
 *
 * @origin sepay.ts L150–258 (sendCustomerEmail)
 */
export async function sendOrderConfirmEmail(
    customerEmail: string,
    customerName: string,
    orderId: string,
    amount: number,
    duration: number,
): Promise<boolean> {
    const subject = `Thanh toán thành công - Đơn hàng ${orderId}`;

    const bodyHtml = `
<p style="margin-top:0;">Cảm ơn bạn đã thanh toán thành công!</p>
<p><strong>Thông tin đơn hàng:</strong></p>
${buildOrderTable([
    ["Mã đơn hàng", orderId],
    ["Số tiền", `${amount.toLocaleString("vi-VN")} VND`],
    ["Thời hạn Pro", `${duration} tháng`],
])}
<p>Tài khoản <strong>Pro</strong> của bạn đã được kích hoạt thành công. Bạn có thể đăng nhập và bắt đầu làm bài dự đoán ngay.</p>
<p style="margin-bottom:0;">Trân trọng,<br/><strong>Đội ngũ IELTS Prediction</strong></p>`;

    return sendEmail(customerEmail, subject, buildEmailHtml("IELTS Prediction Test", bodyHtml));
}

// ============================================================
// Admin Notification Email
// ============================================================

/**
 * Gửi email thông báo đơn hàng mới cho admin
 *
 * @origin sepay.ts L263–370 (sendAdminEmail)
 */
export async function sendAdminNotificationEmail(
    orderId: string,
    customerName: string,
    customerEmail: string,
    amount: number,
    duration: number,
): Promise<boolean> {
    const adminEmail =
        process.env.ADMIN_EMAIL || "admin@ieltspredictiontest.com";

    const subject = `[Admin] Thanh toán thành công - Đơn hàng ${orderId}`;

    const bodyHtml = `
<p style="margin-top:0;">Xác nhận thanh toán thành công!</p>
<p><strong>Thông tin đơn hàng:</strong></p>
${buildOrderTable([
    ["Mã đơn hàng", orderId],
    ["Khách hàng", encode(customerName)],
    ["Email", encode(customerEmail)],
    ["Số tiền", `${amount.toLocaleString("vi-VN")} VND`],
    ["Thời hạn Pro", `${duration} tháng`],
])}
<p>Tài khoản <strong>Pro</strong> đã được kích hoạt tự động.</p>
<p style="margin-bottom:0;">Trân trọng,<br/><strong>Đội ngũ IELTS Prediction</strong></p>`;

    return sendEmail(adminEmail, subject, buildEmailHtml("IELTS Prediction Test", bodyHtml));
}
