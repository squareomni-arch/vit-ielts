import type { NextApiRequest, NextApiResponse } from "next";
import { readConfig, writeConfig } from "~services/cms-config";
import { supabaseAdmin } from "~supabase/admin";
import type {
  CoursePackageItem,
  CoursePackagesConfig,
} from "@/shared/types/admin-config";

const fixedComboTiers = [
  { months: 1, price: 200000 },
  { months: 2, price: 400000 },
  { months: 3, price: 600000 },
  { months: 4, price: 800000 },
  { months: 5, price: 1000000 },
  { months: 6, price: 1000000, originalPrice: 1200000, featuredDeal: true, dealNote: "Giảm 200.000đ" },
  { months: 7, price: 1400000 },
  { months: 8, price: 1600000 },
  { months: 9, price: 1800000 },
  { months: 10, price: 2000000 },
  { months: 11, price: 2200000 },
  { months: 12, price: 1800000, originalPrice: 2400000, featuredDeal: true, dealNote: "Giảm 600.000đ" },
];

const fixedSingleTiers = [
  { months: 2, price: 200000 },
  { months: 3, price: 300000 },
  { months: 4, price: 400000 },
  { months: 5, price: 500000 },
  { months: 6, price: 500000, originalPrice: 600000, featuredDeal: true, dealNote: "Giảm 100.000đ" },
  { months: 7, price: 700000 },
  { months: 8, price: 800000 },
  { months: 9, price: 900000 },
  { months: 10, price: 1000000 },
  { months: 11, price: 1100000 },
  { months: 12, price: 900000, originalPrice: 1200000, featuredDeal: true, dealNote: "Giảm 300.000đ" },
];

function normalizeComboPlans(plans: CoursePackageItem[]): CoursePackageItem[] {
  const planMap = new Map(plans.map((plan) => [plan.months, plan]));
  return fixedComboTiers.map((tier) => {
    const existing = planMap.get(tier.months);
    return {
      name: existing?.name ?? "Standard Plan",
      months: tier.months,
      price: tier.price,
      originalPrice: (tier as any).originalPrice,
      popular: existing?.popular,
      featuredDeal: (tier as any).featuredDeal ?? existing?.featuredDeal,
      dealNote: (tier as any).dealNote ?? existing?.dealNote,
      samePriceAsMonths: existing?.samePriceAsMonths,
    };
  });
}

function normalizeSinglePlans(plans: CoursePackageItem[]): CoursePackageItem[] {
  const planMap = new Map(plans.map((plan) => [plan.months, plan]));
  return fixedSingleTiers.map((tier) => {
    const existing = planMap.get(tier.months);
    return {
      name: existing?.name ?? "Single Pack",
      months: tier.months,
      price: tier.price,
      originalPrice: (tier as any).originalPrice,
      popular: existing?.popular,
      featuredDeal: (tier as any).featuredDeal ?? existing?.featuredDeal,
      dealNote: (tier as any).dealNote ?? existing?.dealNote,
      samePriceAsMonths: existing?.samePriceAsMonths,
    };
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const sectionName = "subscription/course-packages";

  if (req.method === "GET") {
    try {
      const config = await readConfig<CoursePackagesConfig>(supabaseAdmin, sectionName);
      if (!config) {
        return res.status(404).json({ message: "Config not found" });
      }
      const normalizedComboPlans = normalizeComboPlans(config.combo.plans);
      const normalizedSinglePlans = normalizeSinglePlans(config.single.plans);
      const normalizedConfig = {
        ...config,
        combo: {
          ...config.combo,
          plans: normalizedComboPlans,
        },
        single: {
          ...config.single,
          plans: normalizedSinglePlans,
        },
      };
      if (
        JSON.stringify(config.combo.plans) !== JSON.stringify(normalizedComboPlans) ||
        JSON.stringify(config.single.plans) !== JSON.stringify(normalizedSinglePlans)
      ) {
        await writeConfig<CoursePackagesConfig>(supabaseAdmin, sectionName, normalizedConfig as CoursePackagesConfig);
      }
      return res.status(200).json(normalizedConfig);
    } catch (error) {
      return res.status(500).json({
        message: "Không đọc được file config",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  if (req.method === "POST") {
    try {
      const body = req.body as CoursePackagesConfig;
      const normalizedComboPlans = normalizeComboPlans(body.combo.plans);
      const normalizedSinglePlans = normalizeSinglePlans(body.single.plans);
      const normalizedConfig = {
        ...body,
        combo: {
          ...body.combo,
          plans: normalizedComboPlans,
        },
        single: {
          ...body.single,
          plans: normalizedSinglePlans,
        },
      };
      await writeConfig<CoursePackagesConfig>(supabaseAdmin, sectionName, normalizedConfig as CoursePackagesConfig);
      return res.status(200).json({ message: "Lưu config thành công" });
    } catch (error) {
      return res.status(500).json({
        message: "Không ghi được file config",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return res.status(405).json({ message: "Method not allowed" });
}

