/**
 * Email Service — Contact, order confirmation, admin notification emails
 *
 * Reads email template config from CMS (cms_configs table, section: "email-template").
 * Falls back to hardcoded defaults when CMS config is not found.
 *
 * ⚠️ Server-only — KHÔNG import ở client-side
 *
 * @origin functions.php L868–937 (SendContactEmail)
 * @origin sepay.ts L150–258 (sendCustomerEmail)
 * @origin sepay.ts L263–370 (sendAdminEmail)
 */

import { sendEmail } from "~server/email-helper";
import { encode } from "html-entities";
import { supabaseAdmin } from "~supabase/admin";
import { readConfig } from "./cms-config";

// ============================================================
// Types
// ============================================================

export type EmailTemplateConfig = {
    brand: {
        name: string;
        logoUrl: string;
        website: string;
        phone: string;
        email: string;
        address?: string;
    };
    orderConfirmation: {
        subject: string;
        headerTitle: string;
        greeting: string;
        bodyHtml: string;
        orderTableTitle: string;
        closingHtml: string;
        ctaButton?: { text: string; link: string };
        footerText: string;
    };
    adminNotification: {
        subject: string;
        headerTitle: string;
        bodyHtml: string;
    };
    affiliateRegistered: {
        subject: string;
        headerTitle: string;
        bodyHtml: string;
    };
    affiliateApproved: {
        subject: string;
        headerTitle: string;
        bodyHtml: string;
        ctaButton?: { text: string; link: string };
    };
    affiliateRejected: {
        subject: string;
        headerTitle: string;
        bodyHtml: string;
    };
    newCommission: {
        subject: string;
        headerTitle: string;
        bodyHtml: string;
        ctaButton?: { text: string; link: string };
    };
    payoutRequest: {
        subject: string;
        headerTitle: string;
        bodyHtml: string;
    };
    payoutRejected: {
        subject: string;
        headerTitle: string;
        bodyHtml: string;
    };
    payoutCompleted: {
        subject: string;
        headerTitle: string;
        bodyHtml: string;
    };
    style: {
        headerBgColor: string;
        headerBgGradient: string;
        bodyBgColor: string;
        contentBgColor: string;
        primaryColor: string;
        textColor: string;
        footerBgColor: string;
        footerTextColor: string;
    };
};

// ============================================================
// Template Variables
// ============================================================

/**
 * List of all supported template variables with descriptions.
 * Used by CMS UI for reference and by replaceVariables() for substitution.
 */
export const TEMPLATE_VARIABLES: Record<string, string> = {
    "{{customerName}}": "Tên học viên",
    "{{orderId}}": "Mã đơn hàng",
    "{{amount}}": "Số tiền (formatted VND)",
    "{{duration}}": "Thời hạn Pro (tháng)",
    "{{purchaseDate}}": "Ngày mua hàng",
    "{{currentYear}}": "Năm hiện tại",
    "{{brandName}}": "Tên thương hiệu",
    "{{brandPhone}}": "Số điện thoại",
    "{{brandEmail}}": "Email liên hệ",
    "{{brandWebsite}}": "Website",
    "{{customerEmail}}": "Email khách hàng",
    "{{affiliateName}}": "Tên Affiliate",
    "{{affiliateEmail}}": "Email Affiliate",
    "{{commissionAmount}}": "Số tiền hoa hồng",
    "{{orderTotal}}": "Tổng giá trị đơn hàng",
    "{{payoutAmount}}": "Số tiền yêu cầu rút",
    "{{rejectReason}}": "Lý do từ chối",
    "{{customLink}}": "Link affiliate riêng",
};

// ============================================================
// Default Config
// ============================================================

const DEFAULT_CONFIG: EmailTemplateConfig = {
    brand: {
        name: "Vit IELTS",
        logoUrl: "",
        website: "https://vitielts.com",
        phone: "0326752732",
        email: "admin@vitielts.com",
        address: "",
    },
    orderConfirmation: {
        subject: "Thanh toán thành công - Đơn hàng {{orderId}}",
        headerTitle: "Những điều tốt đẹp đang đến với bạn!",
        greeting: "Xin chào {{customerName}},",
        bodyHtml:
            "Chúng tôi đã xử lý thành công đơn hàng của bạn và đơn hàng đang được giao cho bạn.\n\nĐây là lời nhắc về những gì bạn đã đặt hàng:",
        orderTableTitle: "Tóm tắt đơn hàng",
        closingHtml:
            'Tài khoản <strong>Pro</strong> của bạn đã được kích hoạt thành công. Bạn có thể đăng nhập và bắt đầu làm bài dự đoán ngay.',
        ctaButton: {
            text: "Bắt đầu học ngay",
            link: "https://vitielts.com",
        },
        footerText:
            "Nếu bạn cần hỗ trợ, vui lòng liên hệ với chúng tôi qua email hoặc số điện thoại bên dưới.",
    },
    adminNotification: {
        subject: "[Admin] Thanh toán thành công - Đơn hàng {{orderId}}",
        headerTitle: "Thông báo đơn hàng mới",
        bodyHtml: "Xác nhận thanh toán thành công!",
    },
    affiliateRegistered: {
        subject: "[Admin] Đơn đăng ký Affiliate mới từ {{affiliateName}}",
        headerTitle: "Thông báo đăng ký đối tác",
        bodyHtml: "Hệ thống vừa nhận được đơn đăng ký tham gia chương trình Affiliate mới.\n\n<strong>Thông tin chi tiết:</strong>\n- 👤 Họ tên: {{affiliateName}}\n- 📧 Email: {{affiliateEmail}}\n- 📅 Ngày đăng ký: {{purchaseDate}}\n\nVui lòng truy cập trang quản trị để xem xét hồ sơ và thực hiện duyệt đơn.",
    },
    affiliateApproved: {
        subject: "Chúc mừng! Bạn đã chính thức trở thành đối tác của {{brandName}}",
        headerTitle: "Chào mừng bạn gia nhập đội ngũ đối tác",
        bodyHtml: "Xin chào <strong>{{affiliateName}}</strong>,\n\nChúng tôi rất vui mừng thông báo rằng đơn đăng ký tham gia chương trình Affiliate của bạn đã được phê duyệt thành công.\n\nBây giờ bạn đã có thể đăng nhập vào bảng điều khiển dành riêng cho Affiliate để lấy mã giới thiệu, theo dõi hoa hồng và bắt đầu hành trình cùng {{brandName}}.\n\nChúng tôi hy vọng sẽ cùng bạn tạo nên những kết quả tuyệt vời!",
        ctaButton: {
            text: "Truy cập Bảng điều khiển",
            link: "https://vitielts.com/account/affiliate",
        },
    },
    affiliateRejected: {
        subject: "Thông báo về đơn đăng ký Affiliate tại {{brandName}}",
        headerTitle: "Cảm ơn bạn đã quan tâm",
        bodyHtml: "Xin chào {{affiliateName}},\n\nCảm ơn bạn đã gửi đơn đăng ký tham gia chương trình Affiliate của {{brandName}}.\n\nSau khi xem xét kỹ lưỡng hồ sơ, rất tiếc chúng tôi chưa thể hợp tác với bạn trong đợt này. Mong bạn thông cảm vì tiêu chuẩn chọn lọc đối tác hiện tại của chúng tôi khá đặc thù.\n\nHồ sơ của bạn sẽ được lưu giữ và chúng tôi có thể liên hệ lại khi có chương trình phù hợp hơn trong tương lai.",
    },
    newCommission: {
        subject: "🎉 Bạn vừa nhận được hoa hồng mới từ {{brandName}}!",
        headerTitle: "Thông báo hoa hồng mới",
        bodyHtml: "Xin chào <strong>{{affiliateName}}</strong>,\n\nChúc mừng bạn vừa có một lượt giới thiệu thành công!\n\n<strong>Chi tiết giao dịch:</strong>\n- 📦 Đơn hàng: {{orderId}}\n- 💰 Giá trị đơn: {{orderTotal}}\n- 💎 Hoa hồng của bạn: <strong>{{commissionAmount}}</strong>\n\nHoa hồng này đã được ghi nhận vào tài khoản của bạn dưới trạng thái <em>Chờ duyệt</em>. Cảm ơn bạn vì sự đồng hành tuyệt vời!",
        ctaButton: {
            text: "Kiểm tra số dư ngay",
            link: "https://vitielts.com/account/affiliate",
        },
    },
    payoutRequest: {
        subject: "[Admin] Yêu cầu thanh toán hoa hồng mới từ {{affiliateName}}",
        headerTitle: "Yêu cầu rút tiền",
        bodyHtml: "Hệ thống vừa nhận được yêu cầu rút tiền từ đối tác Affiliate.\n\n<strong>Thông tin yêu cầu:</strong>\n- 👤 Đối tác: {{affiliateName}}\n- 📧 Email: {{affiliateEmail}}\n- 💵 Số tiền yêu cầu: <strong>{{payoutAmount}}</strong>\n\nVui lòng kiểm tra thông tin ngân hàng và số dư khả dụng của đối tác trước khi thực hiện chuyển khoản.",
    },
    payoutRejected: {
        subject: "Thông tin về yêu cầu rút tiền của bạn tại {{brandName}}",
        headerTitle: "Cập nhật trạng thái yêu cầu",
        bodyHtml: "Xin chào {{affiliateName}},\n\nYêu cầu rút tiền số tiền <strong>{{payoutAmount}}</strong> của bạn đã bị từ chối xử lý.\n\n<strong>Lý do từ chối:</strong>\n{{rejectReason}}\n\nSố dư tương ứng đã được hoàn lại vào tài khoản của bạn. Vui lòng kiểm tra lại thông tin và thực hiện yêu cầu mới nếu cần thiết.",
    },
    payoutCompleted: {
        subject: "✅ {{brandName}} đã thanh toán hoa hồng cho bạn",
        headerTitle: "Thanh toán thành công",
        bodyHtml: "Xin chào {{affiliateName}},\n\nTin vui! Chúng tôi đã thực hiện chuyển khoản số tiền <strong>{{payoutAmount}}</strong> theo yêu cầu rút tiền của bạn.\n\nGiao dịch đã được hoàn tất. Vui lòng kiểm tra tài khoản ngân hàng của bạn trong vòng 24h làm việc.\n\nCảm ơn bạn đã luôn là đối tác tin cậy của {{brandName}}!",
    },
    style: {
        headerBgColor: "#D94A56",
        headerBgGradient: "linear-gradient(135deg, #D94A56 0%, #c62828 100%)",
        bodyBgColor: "#f4f6f8",
        contentBgColor: "#ffffff",
        primaryColor: "#D94A56",
        textColor: "#333333",
        footerBgColor: "#2D3142",
        footerTextColor: "#ffffff",
    },
};

// ============================================================
// Helpers
// ============================================================

/**
 * Replace {{variable}} placeholders with actual values
 */
function replaceVariables(
    template: string,
    vars: Record<string, string>,
): string {
    let result = template;
    for (const [key, value] of Object.entries(vars)) {
        result = result.replace(new RegExp(key.replace(/[{}]/g, "\\$&"), "g"), value);
    }
    return result;
}

/**
 * Fetch email template config from CMS.
 * Falls back to default config if not found.
 */
async function getEmailConfig(): Promise<EmailTemplateConfig> {
    const dbConfig = await readConfig<EmailTemplateConfig>(
        supabaseAdmin,
        "email-template",
    ).catch(() => null);

    if (!dbConfig) return DEFAULT_CONFIG;

    // Merge defaults with DB config to ensure new fields are populated
    return {
        ...DEFAULT_CONFIG,
        ...dbConfig,
        brand: { ...DEFAULT_CONFIG.brand, ...(dbConfig.brand || {}) },
        orderConfirmation: { ...DEFAULT_CONFIG.orderConfirmation, ...(dbConfig.orderConfirmation || {}) },
        adminNotification: { ...DEFAULT_CONFIG.adminNotification, ...(dbConfig.adminNotification || {}) },
        affiliateRegistered: { ...DEFAULT_CONFIG.affiliateRegistered, ...(dbConfig.affiliateRegistered || {}) },
        affiliateApproved: { ...DEFAULT_CONFIG.affiliateApproved, ...(dbConfig.affiliateApproved || {}) },
        affiliateRejected: { ...DEFAULT_CONFIG.affiliateRejected, ...(dbConfig.affiliateRejected || {}) },
        newCommission: { ...DEFAULT_CONFIG.newCommission, ...(dbConfig.newCommission || {}) },
        payoutRequest: { ...DEFAULT_CONFIG.payoutRequest, ...(dbConfig.payoutRequest || {}) },
        payoutRejected: { ...DEFAULT_CONFIG.payoutRejected, ...(dbConfig.payoutRejected || {}) },
        payoutCompleted: { ...DEFAULT_CONFIG.payoutCompleted, ...(dbConfig.payoutCompleted || {}) },
        style: { ...DEFAULT_CONFIG.style, ...(dbConfig.style || {}) },
    };
}

/**
 * Build order details table row
 */
function buildOrderRow(label: string, value: string): string {
    return `<tr>
    <td style="padding:10px 0; border-bottom:1px solid #f0f0f0; color:#666666; font-size:14px;">${label}</td>
    <td style="padding:10px 0; border-bottom:1px solid #f0f0f0; text-align:right; font-size:14px; font-weight:600; color:#333333;">${value}</td>
  </tr>`;
}

/**
 * Build order details table (shared between customer + admin emails).
 */
function buildOrderTable(
    rows: Array<[string, string]>,
    totalRow?: [string, string],
): string {
    const trs = rows.map(([label, value]) => buildOrderRow(label, value)).join("");
    const totalTr = totalRow
        ? `<tr>
    <td style="padding:14px 0; font-size:15px; font-weight:700; color:#333333;">${totalRow[0]}</td>
    <td style="padding:14px 0; text-align:right; font-size:18px; font-weight:700; color:#D94A56;">${totalRow[1]}</td>
  </tr>`
        : "";
    return `<table width="100%" cellpadding="0" cellspacing="0" style="margin:0; font-size:14px; font-family:Arial, Helvetica, sans-serif;">${trs}${totalTr}</table>`;
}

/**
 * Build a complete HTML email with the new design matching demo.
 * Clean, minimal, text-based layout with brand name at top.
 */
function buildEmailHtml(
    config: EmailTemplateConfig,
    headerTitle: string,
    bodyHtml: string,
    vars: Record<string, string>,
    options?: {
        orderTable?: string;
        orderTableTitle?: string;
        ctaButton?: { text: string; link: string };
        billingInfo?: { name: string; phone?: string; email?: string };
    },
): string {
    const { brand, style } = config;

    const logoHtml = brand.logoUrl
        ? `<img src="${encode(brand.logoUrl)}" alt="${encode(brand.name)}" style="max-height:40px; max-width:180px;" />`
        : "";

    const ctaHtml =
        options?.ctaButton
            ? `<table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
    <tr>
      <td align="center">
        <a href="${encode(options.ctaButton.link)}" style="display:inline-block; padding:14px 36px; background-color:${style.primaryColor}; color:#ffffff; text-decoration:none; border-radius:6px; font-size:15px; font-weight:700; font-family:Arial, Helvetica, sans-serif;">
          ${encode(options.ctaButton.text)}
        </a>
      </td>
    </tr>
  </table>`
            : "";

    const orderTableHtml = options?.orderTable
        ? `<table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
    <tr>
      <td style="padding:16px 0; border-bottom:2px solid #333333;">
        <strong style="font-size:15px; color:#333333;">${encode(options.orderTableTitle || "Tóm tắt đơn hàng")}</strong>
      </td>
    </tr>
  </table>
  ${options.orderTable}`
        : "";

    const billingHtml = options?.billingInfo
        ? `<table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0; border-top:2px solid #eeeeee; padding-top:16px;">
    <tr>
      <td>
        <strong style="font-size:15px; color:#333333;">Thông tin thanh toán</strong>
      </td>
    </tr>
    <tr>
      <td style="padding:12px 0 4px; font-size:14px; color:#333333;">${encode(options.billingInfo.name)}</td>
    </tr>
    ${options.billingInfo.phone ? `<tr><td style="padding:2px 0; font-size:14px;"><a href="tel:${encode(options.billingInfo.phone)}" style="color:${style.primaryColor}; text-decoration:none;">${encode(options.billingInfo.phone)}</a></td></tr>` : ""}
    ${options.billingInfo.email ? `<tr><td style="padding:2px 0; font-size:14px;"><a href="mailto:${encode(options.billingInfo.email)}" style="color:${style.primaryColor}; text-decoration:none;">${encode(options.billingInfo.email)}</a></td></tr>` : ""}
  </table>`
        : "";

    const footerContactHtml = `<table width="100%" cellpadding="0" cellspacing="0">
    ${brand.phone ? `<tr><td style="padding:4px 0; font-size:13px; color:${style.footerTextColor};">📞 ${encode(brand.phone)}</td></tr>` : ""}
    ${brand.email ? `<tr><td style="padding:4px 0; font-size:13px;"><a href="mailto:${encode(brand.email)}" style="color:${style.footerTextColor}; text-decoration:underline;">${encode(brand.email)}</a></td></tr>` : ""}
    ${brand.website ? `<tr><td style="padding:4px 0; font-size:13px;"><a href="${encode(brand.website)}" style="color:${style.footerTextColor}; text-decoration:underline;">${encode(brand.website)}</a></td></tr>` : ""}
  </table>`;

    const processedTitle = replaceVariables(headerTitle, vars);
    const processedBody = replaceVariables(bodyHtml, vars);

    return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${encode(processedTitle)}</title>
  <!--[if mso]>
  <style type="text/css">
    table { border-collapse: collapse; }
    td { font-family: Arial, Helvetica, sans-serif; }
  </style>
  <![endif]-->
</head>
<body style="margin:0; padding:0; background-color:${style.bodyBgColor}; font-family:Arial, Helvetica, sans-serif; -webkit-font-smoothing:antialiased;">
  <!-- Wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:${style.bodyBgColor};">
    <tr>
      <td align="center" style="padding:24px 16px;">
        <!-- Email Container -->
        <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px; width:100%; background-color:${style.contentBgColor}; border-radius:8px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.06);">

          <!-- Brand Header -->
          <tr>
            <td style="padding:24px 32px; border-bottom:1px solid #f0f0f0;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    ${logoHtml}
                    <span style="font-size:20px; font-weight:700; color:${style.primaryColor}; font-family:Arial, Helvetica, sans-serif; ${brand.logoUrl ? "display:none;" : ""}">${encode(brand.name)}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding:32px 32px 24px; color:${style.textColor}; font-size:15px; line-height:1.7;">
              <!-- Title -->
              <h1 style="margin:0 0 16px; font-size:22px; font-weight:700; color:#1a1a1a; line-height:1.4;">${encode(processedTitle)}</h1>

              <!-- Body Content -->
              ${processedBody.split("\n").map((line: string) => `<p style="margin:0 0 12px; font-size:15px; line-height:1.7; color:${style.textColor};">${line}</p>`).join("\n              ")}

              <!-- Order Summary -->
              ${orderTableHtml}

              <!-- Billing Info -->
              ${billingHtml}

              <!-- CTA Button -->
              ${ctaHtml}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:${style.footerBgColor}; padding:24px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-bottom:12px;">
                    <span style="font-size:14px; font-weight:700; color:${style.footerTextColor};">${encode(brand.name)}</span>
                  </td>
                </tr>
                <tr>
                  <td>
                    ${footerContactHtml}
                  </td>
                </tr>
                <tr>
                  <td style="padding-top:16px; border-top:1px solid rgba(255,255,255,0.2); margin-top:12px;">
                    <p style="margin:0; font-size:12px; color:rgba(255,255,255,0.6);">
                      © ${new Date().getFullYear()} ${encode(brand.name)}. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
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
    const config = await getEmailConfig();
    const adminEmail =
        process.env.ADMIN_EMAIL || config.brand.email || "admin@vitielts.com";

    const vars: Record<string, string> = {
        "{{brandName}}": config.brand.name,
        "{{brandPhone}}": config.brand.phone,
        "{{brandEmail}}": config.brand.email,
        "{{brandWebsite}}": config.brand.website,
        "{{currentYear}}": String(new Date().getFullYear()),
    };

    const bodyHtml = `${encode(name)} đã gửi liên hệ:\n\n<strong>Email:</strong> ${encode(email)}\n<strong>Tiêu đề:</strong> ${encode(subject)}\n<strong>Nội dung:</strong>\n${encode(message).replace(/\n/g, "<br/>")}`;

    const html = buildEmailHtml(config, "Liên hệ mới", bodyHtml, vars);
    return sendEmail(adminEmail, `[Contact] ${subject}`, html);
}

/**
 * Gửi email thông báo lead mới từ Landing page tới admin.
 */
export async function sendLeadEmail(lead: {
    name: string;
    phone: string;
    target?: string;
    source?: string;
}): Promise<boolean> {
    const config = await getEmailConfig();
    const adminEmail =
        process.env.ADMIN_EMAIL || config.brand.email || "admin@vitielts.com";

    const vars: Record<string, string> = {
        "{{brandName}}": config.brand.name,
        "{{brandPhone}}": config.brand.phone,
        "{{brandEmail}}": config.brand.email,
        "{{brandWebsite}}": config.brand.website,
        "{{currentYear}}": String(new Date().getFullYear()),
    };

    const bodyHtml = `Có khách hàng mới đăng ký nhận tư vấn từ Landing page:\n\n<strong>Họ tên:</strong> ${encode(lead.name)}\n<strong>Số điện thoại:</strong> ${encode(lead.phone)}\n<strong>Mục tiêu band:</strong> ${encode(lead.target || "—")}\n<strong>Nguồn:</strong> ${encode(lead.source || "landing")}`;

    const html = buildEmailHtml(config, "Lead mới từ Landing", bodyHtml, vars);
    return sendEmail(adminEmail, `[Lead] ${lead.name} - ${lead.phone}`, html);
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
    const config = await getEmailConfig();
    const { orderConfirmation } = config;

    const formattedAmount = `${amount.toLocaleString("vi-VN")} đ`;
    const purchaseDate = new Date().toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    });

    const vars: Record<string, string> = {
        "{{customerName}}": encode(customerName),
        "{{orderId}}": encode(orderId),
        "{{amount}}": formattedAmount,
        "{{duration}}": `${duration} tháng`,
        "{{purchaseDate}}": purchaseDate,
        "{{currentYear}}": String(new Date().getFullYear()),
        "{{brandName}}": config.brand.name,
        "{{brandPhone}}": config.brand.phone,
        "{{brandEmail}}": config.brand.email,
        "{{brandWebsite}}": config.brand.website,
        "{{customerEmail}}": encode(customerEmail),
    };

    const subject = replaceVariables(orderConfirmation.subject, vars);
    const greeting = replaceVariables(orderConfirmation.greeting, vars);
    const body = replaceVariables(orderConfirmation.bodyHtml, vars);
    const closing = replaceVariables(orderConfirmation.closingHtml, vars);

    const orderTable = buildOrderTable(
        [
            ["Đơn hàng", `#${encode(orderId)}`],
            ["Ngày mua", purchaseDate],
            ["Gói Pro", `${duration} tháng`],
        ],
        ["Tổng cộng", formattedAmount],
    );

    const fullBody = `${greeting}\n\n${body}\n\n${closing}`;

    const html = buildEmailHtml(
        config,
        replaceVariables(orderConfirmation.headerTitle, vars),
        fullBody,
        vars,
        {
            orderTable,
            orderTableTitle: replaceVariables(orderConfirmation.orderTableTitle, vars),
            ctaButton: orderConfirmation.ctaButton
                ? {
                    text: replaceVariables(orderConfirmation.ctaButton.text, vars),
                    link: replaceVariables(orderConfirmation.ctaButton.link, vars),
                }
                : undefined,
            billingInfo: {
                name: customerName,
                phone: undefined,
                email: customerEmail,
            },
        },
    );

    return sendEmail(customerEmail, subject, html);
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
    const config = await getEmailConfig();
    const { adminNotification } = config;

    const adminEmailAddr =
        process.env.ADMIN_EMAIL || config.brand.email || "admin@vitielts.com";

    const formattedAmount = `${amount.toLocaleString("vi-VN")} đ`;
    const purchaseDate = new Date().toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    });

    const vars: Record<string, string> = {
        "{{customerName}}": encode(customerName),
        "{{orderId}}": encode(orderId),
        "{{amount}}": formattedAmount,
        "{{duration}}": `${duration} tháng`,
        "{{purchaseDate}}": purchaseDate,
        "{{currentYear}}": String(new Date().getFullYear()),
        "{{brandName}}": config.brand.name,
        "{{brandPhone}}": config.brand.phone,
        "{{brandEmail}}": config.brand.email,
        "{{brandWebsite}}": config.brand.website,
        "{{customerEmail}}": encode(customerEmail),
    };

    const subject = replaceVariables(adminNotification.subject, vars);
    const body = replaceVariables(adminNotification.bodyHtml, vars);

    const orderTable = buildOrderTable(
        [
            ["Mã đơn hàng", encode(orderId)],
            ["Khách hàng", encode(customerName)],
            ["Email", encode(customerEmail)],
            ["Gói Pro", `${duration} tháng`],
        ],
        ["Tổng cộng", formattedAmount],
    );

    const html = buildEmailHtml(
        config,
        replaceVariables(adminNotification.headerTitle, vars),
        body,
        vars,
        {
            orderTable,
            orderTableTitle: "Chi tiết đơn hàng",
        },
    );

    return sendEmail(adminEmailAddr, subject, html);
}

// ============================================================
// Expired Order Alert Email (for admin)
// ============================================================

/**
 * Gửi email cảnh báo admin khi có thanh toán cho đơn đã expired.
 * Admin cần vào trang quản lý để kiểm tra và xác nhận thủ công.
 *
 * @param orderId - Order ID
 * @param amount - Transfer amount
 * @param orderAmount - Original order amount
 * @param transactionDate - Transaction date from SePay
 */
export async function sendExpiredOrderPaymentAlert(
    orderId: string,
    amount: number,
    orderAmount: number,
    transactionDate: string,
): Promise<boolean> {
    const config = await getEmailConfig();
    const adminEmailAddr =
        process.env.ADMIN_EMAIL || config.brand.email || "admin@vitielts.com";

    const formattedTransferAmount = `${amount.toLocaleString("vi-VN")} đ`;
    const formattedOrderAmount = `${orderAmount.toLocaleString("vi-VN")} đ`;
    const adminUrl = `${config.brand.website}/admin/settings`;

    const vars: Record<string, string> = {
        "{{orderId}}": encode(orderId),
        "{{currentYear}}": String(new Date().getFullYear()),
        "{{brandName}}": config.brand.name,
        "{{brandPhone}}": config.brand.phone,
        "{{brandEmail}}": config.brand.email,
        "{{brandWebsite}}": config.brand.website,
    };

    const bodyHtml =
        `<strong>⚠️ Cảnh báo:</strong> Hệ thống nhận được chuyển khoản cho một đơn hàng đã <strong>hết hạn</strong>.\n\n` +
        `Đơn hàng đã bị expire do quá thời gian thanh toán (60 phút), nhưng khách hàng vẫn thực hiện chuyển khoản.\n\n` +
        `Vui lòng vào trang quản lý để kiểm tra và xử lý thủ công.`;

    const orderTable = buildOrderTable(
        [
            ["Mã đơn hàng", encode(orderId)],
            ["Số tiền chuyển khoản", formattedTransferAmount],
            ["Số tiền đơn hàng", formattedOrderAmount],
            ["Ngày giao dịch", transactionDate],
            ["Trạng thái đơn", "❌ Đã hết hạn (expired)"],
        ],
    );

    const html = buildEmailHtml(
        config,
        "⚠️ Thanh toán cho đơn hàng đã hết hạn",
        bodyHtml,
        vars,
        {
            orderTable,
            orderTableTitle: "Chi tiết giao dịch",
            ctaButton: {
                text: "Vào trang quản lý",
                link: adminUrl,
            },
        },
    );

    return sendEmail(
        adminEmailAddr,
        `[CẢNH BÁO] Thanh toán cho đơn đã expired — ${orderId}`,
        html,
    );
}

// ============================================================
// Affiliate Emails
// ============================================================

/**
 * Gửi email thông báo cho admin khi có người đăng ký Affiliate mới
 */
export async function sendAffiliateRegisteredEmail(
    affiliateName: string,
    affiliateEmail: string,
): Promise<boolean> {
    const config = await getEmailConfig();
    const { affiliateRegistered } = config;
    const adminEmail = process.env.ADMIN_EMAIL || config.brand.email || "admin@vitielts.com";

    const vars: Record<string, string> = {
        "{{affiliateName}}": encode(affiliateName),
        "{{affiliateEmail}}": encode(affiliateEmail),
        "{{brandName}}": config.brand.name,
        "{{brandPhone}}": config.brand.phone,
        "{{brandEmail}}": config.brand.email,
        "{{brandWebsite}}": config.brand.website,
        "{{currentYear}}": String(new Date().getFullYear()),
    };

    const subject = replaceVariables(affiliateRegistered.subject, vars);
    const body = replaceVariables(affiliateRegistered.bodyHtml, vars);
    const html = buildEmailHtml(config, affiliateRegistered.headerTitle, body, vars);

    return sendEmail(adminEmail, subject, html);
}

/**
 * Gửi email thông báo kết quả duyệt Affiliate cho người dùng
 */
export async function sendAffiliateStatusEmail(
    affiliateEmail: string,
    affiliateName: string,
    status: "approved" | "rejected",
): Promise<boolean> {
    const config = await getEmailConfig();
    const template = status === "approved" ? config.affiliateApproved : config.affiliateRejected;

    const vars: Record<string, string> = {
        "{{affiliateName}}": encode(affiliateName),
        "{{brandName}}": config.brand.name,
        "{{brandPhone}}": config.brand.phone,
        "{{brandEmail}}": config.brand.email,
        "{{brandWebsite}}": config.brand.website,
        "{{currentYear}}": String(new Date().getFullYear()),
    };

    const subject = replaceVariables(template.subject, vars);
    const body = replaceVariables(template.bodyHtml, vars);

    const options: any = {};
    if (status === "approved" && (template as any).ctaButton) {
        options.ctaButton = {
            text: replaceVariables((template as any).ctaButton.text, vars),
            link: replaceVariables((template as any).ctaButton.link, vars),
        };
    }

    const html = buildEmailHtml(config, template.headerTitle, body, vars, options);
    return sendEmail(affiliateEmail, subject, html);
}

/**
 * Gửi email thông báo khi Affiliate có hoa hồng mới
 */
export async function sendNewCommissionEmail(
    affiliateEmail: string,
    affiliateName: string,
    orderId: string,
    orderTotal: number,
    commissionAmount: number,
): Promise<boolean> {
    const config = await getEmailConfig();
    const { newCommission } = config;

    const vars: Record<string, string> = {
        "{{affiliateName}}": encode(affiliateName),
        "{{orderId}}": encode(orderId),
        "{{orderTotal}}": `${orderTotal.toLocaleString("vi-VN")} đ`,
        "{{commissionAmount}}": `${commissionAmount.toLocaleString("vi-VN")} đ`,
        "{{brandName}}": config.brand.name,
        "{{brandPhone}}": config.brand.phone,
        "{{brandEmail}}": config.brand.email,
        "{{brandWebsite}}": config.brand.website,
        "{{currentYear}}": String(new Date().getFullYear()),
    };

    const subject = replaceVariables(newCommission.subject, vars);
    const body = replaceVariables(newCommission.bodyHtml, vars);

    const options: any = {};
    if (newCommission.ctaButton) {
        options.ctaButton = {
            text: replaceVariables(newCommission.ctaButton.text, vars),
            link: replaceVariables(newCommission.ctaButton.link, vars),
        };
    }

    const html = buildEmailHtml(config, newCommission.headerTitle, body, vars, options);
    return sendEmail(affiliateEmail, subject, html);
}

/**
 * Gửi email thông báo cho admin khi có yêu cầu rút tiền mới
 */
export async function sendPayoutRequestEmail(
    affiliateName: string,
    affiliateEmail: string,
    amount: number,
): Promise<boolean> {
    const config = await getEmailConfig();
    const { payoutRequest } = config;
    const adminEmail = process.env.ADMIN_EMAIL || config.brand.email || "admin@vitielts.com";

    const vars: Record<string, string> = {
        "{{affiliateName}}": encode(affiliateName),
        "{{affiliateEmail}}": encode(affiliateEmail),
        "{{payoutAmount}}": `${amount.toLocaleString("vi-VN")} đ`,
        "{{brandName}}": config.brand.name,
        "{{brandPhone}}": config.brand.phone,
        "{{brandEmail}}": config.brand.email,
        "{{brandWebsite}}": config.brand.website,
        "{{currentYear}}": String(new Date().getFullYear()),
    };

    const subject = replaceVariables(payoutRequest.subject, vars);
    const body = replaceVariables(payoutRequest.bodyHtml, vars);
    const html = buildEmailHtml(config, payoutRequest.headerTitle, body, vars);

    return sendEmail(adminEmail, subject, html);
}

/**
 * Gửi email thông báo kết quả xử lý payout cho Affiliate
 */
export async function sendPayoutStatusEmail(
    affiliateEmail: string,
    affiliateName: string,
    amount: number,
    status: "completed" | "rejected",
    rejectReason?: string,
): Promise<boolean> {
    const config = await getEmailConfig();
    const template = status === "completed" ? config.payoutCompleted : config.payoutRejected;

    const vars: Record<string, string> = {
        "{{affiliateName}}": encode(affiliateName),
        "{{payoutAmount}}": `${amount.toLocaleString("vi-VN")} đ`,
        "{{rejectReason}}": encode(rejectReason || "Không có lý do cụ thể"),
        "{{brandName}}": config.brand.name,
        "{{brandPhone}}": config.brand.phone,
        "{{brandEmail}}": config.brand.email,
        "{{brandWebsite}}": config.brand.website,
        "{{currentYear}}": String(new Date().getFullYear()),
    };

    const subject = replaceVariables(template.subject, vars);
    const body = replaceVariables(template.bodyHtml, vars);
    const html = buildEmailHtml(config, template.headerTitle, body, vars);

    return sendEmail(affiliateEmail, subject, html);
}

// ============================================================
// Exports for CMS Preview
// ============================================================

export { DEFAULT_CONFIG as EMAIL_DEFAULT_CONFIG, getEmailConfig, replaceVariables, buildEmailHtml, buildOrderTable };
