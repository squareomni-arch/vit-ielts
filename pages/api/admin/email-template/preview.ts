import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdmin } from "~lib/admin-auth";
import {
    getEmailConfig,
    replaceVariables,
    buildEmailHtml,
    buildOrderTable,
} from "~services/email";
import { encode } from "html-entities";

/**
 * Email Template Preview API
 *
 * POST /api/admin/email-template/preview
 *
 * Accepts optional config override in body.
 * Returns rendered HTML with sample data for preview.
 */
export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse,
) {
    if (req.method !== "POST") {
        return res.status(405).json({ success: false, error: "Method not allowed" });
    }

    const user = await requireAdmin(req, res);
    if (!user) return;

    try {
        // Use provided config or fetch from DB
        const config = req.body?.config || (await getEmailConfig());
        const templateType = req.body?.type || "orderConfirmation";

        // Sample data for preview
        const sampleVars: Record<string, string> = {
            "{{customerName}}": "Hoàng Long",
            "{{orderId}}": "Vit IELTS 17369649223580012",
            "{{amount}}": "200.000 đ",
            "{{duration}}": "3 tháng",
            "{{purchaseDate}}": new Date().toLocaleDateString("vi-VN", {
                day: "2-digit",
                month: "long",
                year: "numeric",
            }),
            "{{currentYear}}": String(new Date().getFullYear()),
            "{{brandName}}": config.brand?.name || "Vit IELTS",
            "{{brandPhone}}": config.brand?.phone || "0326752732",
            "{{brandEmail}}": config.brand?.email || "vitielts9@gmail.com",
            "{{brandWebsite}}": config.brand?.website || "https://vitieltstest.com",
            "{{customerEmail}}": "alongia7@gmail.com",
            "{{affiliateName}}": "Nguyễn Văn A",
            "{{affiliateEmail}}": "affiliate@example.com",
            "{{commissionAmount}}": "40.000 đ",
            "{{orderTotal}}": "200.000 đ",
            "{{payoutAmount}}": "500.000 đ",
            "{{customLink}}": "https://vitieltstest.com?ref=A123",
            "{{rejectReason}}": "Thông tin thanh toán không chính xác hoặc không đủ số dư tối thiểu.",
        };

        if (templateType === "adminNotification") {
            const { adminNotification } = config;
            const body = replaceVariables(adminNotification?.bodyHtml || "Xác nhận thanh toán thành công!", sampleVars);

            const orderTable = buildOrderTable(
                [
                    ["Mã đơn hàng", "Vit IELTS 17369649223580012"],
                    ["Khách hàng", "Hoàng Long"],
                    ["Email", "alongia7@gmail.com"],
                    ["Gói Pro", "3 tháng"],
                ],
                ["Tổng cộng", "200.000 đ"],
            );

            const html = buildEmailHtml(
                config,
                replaceVariables(adminNotification?.headerTitle || "Thông báo đơn hàng mới", sampleVars),
                body,
                sampleVars,
                { orderTable, orderTableTitle: "Chi tiết đơn hàng" },
            );

            return res.status(200).json({ success: true, html });
        }

        else if (templateType === "affiliateRegistered") {
            const { affiliateRegistered } = config;
            const body = replaceVariables(affiliateRegistered?.bodyHtml || "", sampleVars);
            const html = buildEmailHtml(config, replaceVariables(affiliateRegistered?.headerTitle || "Đơn đăng ký Affiliate mới", sampleVars), body, sampleVars);
            return res.status(200).json({ success: true, html });

        } else if (templateType === "affiliateApproved") {
            const { affiliateApproved } = config;
            const body = replaceVariables(affiliateApproved?.bodyHtml || "", sampleVars);
            const ctaButton = affiliateApproved?.ctaButton ? {
                text: replaceVariables(affiliateApproved.ctaButton.text, sampleVars),
                link: replaceVariables(affiliateApproved.ctaButton.link, sampleVars),
            } : undefined;
            const html = buildEmailHtml(config, replaceVariables(affiliateApproved?.headerTitle || "Chào mừng bạn gia nhập đội ngũ đối tác", sampleVars), body, sampleVars, { ctaButton });
            return res.status(200).json({ success: true, html });

        } else if (templateType === "affiliateRejected") {
            const { affiliateRejected } = config;
            const body = replaceVariables(affiliateRejected?.bodyHtml || "", sampleVars);
            const html = buildEmailHtml(config, replaceVariables(affiliateRejected?.headerTitle || "Cảm ơn bạn đã quan tâm", sampleVars), body, sampleVars);
            return res.status(200).json({ success: true, html });

        } else if (templateType === "newCommission") {
            const { newCommission } = config;
            const body = replaceVariables(newCommission?.bodyHtml || "", sampleVars);
            const ctaButton = newCommission?.ctaButton ? {
                text: replaceVariables(newCommission.ctaButton.text, sampleVars),
                link: replaceVariables(newCommission.ctaButton.link, sampleVars),
            } : undefined;
            const html = buildEmailHtml(config, replaceVariables(newCommission?.headerTitle || "Bạn vừa kiếm được hoa hồng!", sampleVars), body, sampleVars, { ctaButton });
            return res.status(200).json({ success: true, html });

        } else if (templateType === "payoutRequest") {
            const { payoutRequest } = config;
            const body = replaceVariables(payoutRequest?.bodyHtml || "", sampleVars);
            const html = buildEmailHtml(config, replaceVariables(payoutRequest?.headerTitle || "Yêu cầu rút tiền mới", sampleVars), body, sampleVars);
            return res.status(200).json({ success: true, html });

        } else if (templateType === "payoutRejected") {
            const { payoutRejected } = config;
            const body = replaceVariables(payoutRejected?.bodyHtml || "", sampleVars);
            const html = buildEmailHtml(config, replaceVariables(payoutRejected?.headerTitle || "Cập nhật yêu cầu rút tiền", sampleVars), body, sampleVars);
            return res.status(200).json({ success: true, html });

        } else if (templateType === "payoutCompleted") {
            const { payoutCompleted } = config;
            const body = replaceVariables(payoutCompleted?.bodyHtml || "", sampleVars);
            const html = buildEmailHtml(config, replaceVariables(payoutCompleted?.headerTitle || "Thanh toán thành công", sampleVars), body, sampleVars);
            return res.status(200).json({ success: true, html });
        }

        // Default: orderConfirmation
        const { orderConfirmation } = config;
        const greeting = replaceVariables(orderConfirmation?.greeting || "Xin chào {{customerName}},", sampleVars);
        const body = replaceVariables(orderConfirmation?.bodyHtml || "", sampleVars);
        const closing = replaceVariables(orderConfirmation?.closingHtml || "", sampleVars);

        const orderTable = buildOrderTable(
            [
                ["Đơn hàng", "#Vit IELTS 17369649223580012"],
                ["Ngày mua", sampleVars["{{purchaseDate}}"]],
                ["Gói Pro", "3 tháng"],
            ],
            ["Tổng cộng", "200.000 đ"],
        );

        const fullBody = `${greeting}\n\n${body}\n\n${closing}`;

        const ctaButton = orderConfirmation?.ctaButton
            ? {
                text: replaceVariables(orderConfirmation.ctaButton.text, sampleVars),
                link: replaceVariables(orderConfirmation.ctaButton.link, sampleVars),
            }
            : undefined;

        const html = buildEmailHtml(
            config,
            replaceVariables(orderConfirmation?.headerTitle || "Những điều tốt đẹp đang đến với bạn!", sampleVars),
            fullBody,
            sampleVars,
            {
                orderTable,
                orderTableTitle: replaceVariables(orderConfirmation?.orderTableTitle || "Tóm tắt đơn hàng", sampleVars),
                ctaButton,
                billingInfo: {
                    name: "Hoàng Long",
                    phone: "0923756323",
                    email: "alongia7@gmail.com",
                },
            },
        );

        return res.status(200).json({ success: true, html });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: "Failed to generate preview",
            details: error instanceof Error ? error.message : String(error),
        });
    }
}
