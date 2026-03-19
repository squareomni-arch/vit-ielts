import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "~supabase/admin";
import {
  getAffiliateLinks,
  createAffiliateLink,
  getAffiliateByUserId,
} from "~services/affiliate";

function generateRandomCode(length: number = 10): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function getBaseUrl(req?: NextApiRequest): string {
  if (req) {
    const protocol =
      req.headers["x-forwarded-proto"] ||
      (req.headers.referer?.startsWith("https") ? "https" : "http");
    const host = req.headers.host || req.headers["x-forwarded-host"];

    if (host) {
      return `${protocol}://${host}`;
    }
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }

  return "http://localhost:3000";
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    try {
      const { affiliateId, customLink } = req.body;

      if (!affiliateId) {
        return res.status(400).json({ error: "Affiliate ID is required" });
      }

      // Check if affiliate is approved/active
      // We query by ID directly since we have the affiliateId
      const { data: affiliate, error: affErr } = await supabaseAdmin
        .from("affiliates")
        .select("id, status")
        .eq("id", affiliateId)
        .single();

      if (affErr || !affiliate) {
        return res.status(404).json({ error: "Affiliate not found" });
      }

      if (affiliate.status !== "active") {
        return res.status(403).json({
          error: "Affiliate not approved",
          message: "Bạn cần được duyệt trước khi tạo link affiliate",
        });
      }

      // Generate customLink if not provided
      const finalCustomLink =
        customLink && customLink.trim() ? customLink.trim() : generateRandomCode(10);

      const { link, isNew } = await createAffiliateLink(
        supabaseAdmin,
        affiliateId,
        finalCustomLink,
      );

      // Build full URL for response
      const baseUrl = getBaseUrl(req);
      const fullLink = `${baseUrl}/subscription?ref=${link.custom_link}`;

      return res.status(200).json({
        success: true,
        link: { ...link, link: fullLink },
        message: isNew ? "Link created successfully" : "Link đã tồn tại",
      });
    } catch (error) {
      console.error("[API /api/affiliate/links POST]", error);
      return res.status(500).json({
        error: "Failed to create affiliate link",
        message: error instanceof Error ? error.message : (error as any)?.message ?? String(error),
      });
    }
  }

  if (req.method === "GET") {
    try {
      const { affiliateId } = req.query;

      if (!affiliateId || typeof affiliateId !== "string") {
        return res.status(400).json({ error: "Affiliate ID is required" });
      }

      let links = await getAffiliateLinks(supabaseAdmin, affiliateId);

      // If no links exist, create default one for approved affiliates
      if (links.length === 0) {
        const { data: affiliate } = await supabaseAdmin
          .from("affiliates")
          .select("id, status, custom_link")
          .eq("id", affiliateId)
          .single();

        if (affiliate && affiliate.status === "active") {
          const defaultCode = affiliate.custom_link || generateRandomCode(10);
          const { link } = await createAffiliateLink(
            supabaseAdmin,
            affiliateId,
            defaultCode,
          );
          links = [link];
        }
      }

      // Build full URLs for response
      const baseUrl = getBaseUrl(req);
      const normalizedLinks = links.map((link) => ({
        ...link,
        link: `${baseUrl}/subscription?ref=${link.custom_link}`,
      }));

      return res.status(200).json({
        success: true,
        links: normalizedLinks,
      });
    } catch (error) {
      console.error("[API /api/affiliate/links GET]", error);
      return res.status(500).json({
        error: "Failed to fetch affiliate links",
        message: error instanceof Error ? error.message : (error as any)?.message ?? String(error),
      });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
