import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { twMerge } from "tailwind-merge";
import { calculatePrice, formatPrice, SkillType } from "./pricing";
import { ROUTES } from "@/shared/routes";
import type { CoursePackagesConfig } from "@/shared/types/admin-config";

// ── Billing toggle (Monthly / Annual) ──────────────────────────────────────

type BillingCycle = "monthly" | "annual";

interface BillingToggleProps {
  value: BillingCycle;
  onChange: (v: BillingCycle) => void;
}

const BillingToggle = ({ value, onChange }: BillingToggleProps) => (
  <div
    className="relative flex gap-[8px] items-center p-[5px] rounded-[100px] w-[274px] shrink-0"
    style={{
      background: "#fff",
      boxShadow: "1px 1px 2px 0px rgba(255,255,255,0.7), inset 1px 1px 3px 0px rgba(0,0,0,0.1)",
    }}
  >
    {/* Monthly */}
    <button
      type="button"
      onClick={() => onChange("monthly")}
      className={twMerge(
        "flex-1 flex items-center justify-center px-[24px] py-[11px] rounded-[100px] text-[14px] font-inter leading-normal transition-colors",
        value === "monthly"
          ? "font-bold text-[#191d24]"
          : "font-semibold text-[#6a7282]",
      )}
    >
      Monthly
    </button>
    {/* Annual — active pill */}
    <button
      type="button"
      onClick={() => onChange("annual")}
      className={twMerge(
        "flex-1 flex items-center justify-center px-[24px] py-[11px] rounded-[100px] text-[14px] font-inter leading-normal transition-colors",
        value === "annual"
          ? "font-bold text-[#191d24]"
          : "font-semibold text-[#6a7282]",
      )}
      style={
        value === "annual"
          ? {
              backgroundImage:
                "linear-gradient(106.95deg, #B3E653 0%, #B6E739 100%)",
              boxShadow: "0px 1px 5px 0px rgba(0,0,0,0.15)",
            }
          : undefined
      }
    >
      Annual −20%
    </button>
  </div>
);

// ── Check icon (inline SVG matching Figma vector) ──────────────────────────

const CheckIcon = ({ dark = false }: { dark?: boolean }) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 18 18"
    fill="none"
    className="shrink-0"
    aria-hidden
  >
    <path
      d="M3.5 9.5L7 13L14.5 5.5"
      stroke={dark ? "#b3e653" : "#191d24"}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// ── Static Figma plan cards ─────────────────────────────────────────────────

interface FigmaPlanCardsProps {
  buyProLink: string;
  billingCycle: BillingCycle;
}

const FigmaPlanCards = ({ buyProLink, billingCycle }: FigmaPlanCardsProps) => {
  // Annual prices are −20% off monthly for display purposes
  const proMonthlyPrice = billingCycle === "annual" ? "$7" : "$9";
  const proInterval = billingCycle === "annual" ? "/month billed annually" : "/month";
  const teamsMonthlyPrice = billingCycle === "annual" ? "$6" : "$7";
  const teamsInterval = billingCycle === "annual" ? "/seat/mo billed annually" : "/seat/mo";

  return (
    <div className="flex gap-[23px] items-start flex-col md:flex-row w-full max-w-[1126px] mx-auto">
      {/* ── Card: Free ── */}
      <div className="flex-1 bg-[#fff] border border-[rgba(25,29,36,0.1)] rounded-[24px] px-[32px] py-[32px] flex flex-col gap-[14px] shadow-[0px_6px_18px_0px_rgba(0,0,0,0.05)]">
        {/* Plan label */}
        <p className="text-[#9ad534] text-[15px] font-bold font-inter leading-normal">
          Free
        </p>
        {/* Price row */}
        <div className="flex gap-[6px] items-baseline">
          <span className="font-display font-bold text-[44px] leading-[1.08] tracking-[-0.88px] text-[#191d24]">
            $0
          </span>
          <span className="text-[#6a7282] text-[15px] font-medium font-inter leading-normal">
            /forever
          </span>
        </div>
        {/* Description */}
        <p className="text-[#6a7282] text-[14px] font-normal font-inter leading-normal">
          Get a feel for the platform.
        </p>
        {/* Divider */}
        <hr className="border-0 bg-[rgba(25,29,36,0.1)] h-px w-full" />
        {/* Features */}
        <div className="flex flex-col gap-[14px]">
          {[
            "3 free mock tests",
            "Auto-scored Listening & Reading",
            "Basic progress tracking",
          ].map((f) => (
            <div key={f} className="flex gap-[8px] items-center">
              <CheckIcon />
              <span className="text-[#191d24] text-[14px] font-medium font-inter leading-normal">
                {f}
              </span>
            </div>
          ))}
        </div>
        {/* CTA */}
        <button
          type="button"
          className="w-full h-[48px] rounded-[100px] border-[1.5px] border-[rgba(25,29,36,0.1)] bg-[#fff] flex items-center justify-center mt-auto"
        >
          <span className="text-[#191d24] text-[14px] font-bold font-inter leading-normal whitespace-nowrap">
            Start free
          </span>
        </button>
      </div>

      {/* ── Card: Pro (dark / featured) ── */}
      <div className="flex-1 bg-[#191d24] rounded-[24px] px-[32px] py-[28px] flex flex-col gap-[14px] shadow-[0px_18px_42px_0px_rgba(0,0,0,0.18)] relative overflow-hidden">
        {/* Grid overlay pattern */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-10 pointer-events-none rounded-[24px]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(#fff 0 1px, transparent 1px 28px), repeating-linear-gradient(90deg, #fff 0 1px, transparent 1px 28px)",
            backgroundSize: "28px 28px",
          }}
        />
        {/* Most popular badge */}
        <div className="bg-[#b3e653] rounded-[100px] px-[12px] py-[6px] w-fit">
          <span className="text-[#191d24] text-[11px] font-bold font-inter leading-normal whitespace-nowrap uppercase tracking-widest">
            MOST POPULAR
          </span>
        </div>
        {/* Plan label */}
        <p className="text-[#b3e653] text-[15px] font-bold font-inter leading-normal relative">
          Pro
        </p>
        {/* Price row */}
        <div className="flex gap-[6px] items-baseline relative">
          <span className="font-display font-bold text-[44px] leading-[1.08] tracking-[-0.88px] text-white">
            {proMonthlyPrice}
          </span>
          <span className="text-[#b2bdcc] text-[15px] font-medium font-inter leading-normal">
            {proInterval}
          </span>
        </div>
        {/* Description */}
        <p className="text-[#b2bdcc] text-[14px] font-normal font-inter leading-normal relative">
          Everything you need to hit your band.
        </p>
        {/* Divider */}
        <hr className="border-0 bg-[rgba(255,255,255,0.14)] h-px w-full relative" />
        {/* Features */}
        <div className="flex flex-col gap-[8px] relative">
          {[
            "Unlimited mock tests (920+)",
            "Writing & Speaking feedback",
            "Personalised study plan",
            "Advanced analytics",
            "Priority support",
          ].map((f) => (
            <div key={f} className="flex gap-[8px] items-center">
              <CheckIcon dark />
              <span className="text-[#e0e5ed] text-[14px] font-medium font-inter leading-normal">
                {f}
              </span>
            </div>
          ))}
        </div>
        {/* CTA */}
        <Link href={buyProLink} className="w-full mt-2 relative">
          <button
            type="button"
            className="w-full h-[48px] rounded-[100px] bg-[#b3e653] flex items-center justify-center"
          >
            <span className="text-[#191d24] text-[14px] font-bold font-inter leading-normal whitespace-nowrap">
              Go Pro
            </span>
          </button>
        </Link>
      </div>

      {/* ── Card: Teams ── */}
      <div className="flex-1 bg-[#fff] border border-[rgba(25,29,36,0.1)] rounded-[24px] px-[32px] py-[32px] flex flex-col gap-[14px] shadow-[0px_6px_18px_0px_rgba(0,0,0,0.05)]">
        {/* Plan label */}
        <p className="text-[#9ad534] text-[15px] font-bold font-inter leading-normal">
          Teams
        </p>
        {/* Price row */}
        <div className="flex gap-[6px] items-baseline">
          <span className="font-display font-bold text-[44px] leading-[1.08] tracking-[-0.88px] text-[#191d24]">
            {teamsMonthlyPrice}
          </span>
          <span className="text-[#6a7282] text-[15px] font-medium font-inter leading-normal">
            {teamsInterval}
          </span>
        </div>
        {/* Description */}
        <p className="text-[#6a7282] text-[14px] font-normal font-inter leading-normal">
          For schools &amp; study groups.
        </p>
        {/* Divider */}
        <hr className="border-0 bg-[rgba(25,29,36,0.1)] h-px w-full" />
        {/* Features */}
        <div className="flex flex-col gap-[14px]">
          {[
            "Everything in Pro",
            "Teacher dashboard",
            "Class progress reports",
            "Bulk seat management",
            "Onboarding support",
          ].map((f) => (
            <div key={f} className="flex gap-[8px] items-center">
              <CheckIcon />
              <span className="text-[#191d24] text-[14px] font-medium font-inter leading-normal">
                {f}
              </span>
            </div>
          ))}
        </div>
        {/* CTA */}
        <button
          type="button"
          className="w-full h-[48px] rounded-[100px] border-[1.5px] border-[rgba(25,29,36,0.1)] bg-[#fff] flex items-center justify-center mt-auto"
        >
          <span className="text-[#191d24] text-[14px] font-bold font-inter leading-normal whitespace-nowrap">
            Contact sales
          </span>
        </button>
      </div>
    </div>
  );
};

// ── Dynamic course-packages plan cards (keep existing business logic) ──────

export const SubscriptionPlans = ({ buyProLink }: { buyProLink: string }) => {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("annual");
  const [singleSkill, setSingleSkill] = useState<SkillType>("listening");
  const [config, setConfig] = useState<CoursePackagesConfig | null>(null);

  const comboPriceTable = useMemo(() => {
    if (!config) return undefined;
    return Object.fromEntries(
      config.combo.plans.map((plan) => [plan.months, plan.price]),
    );
  }, [config]);

  const singlePriceTable = useMemo(() => {
    if (!config) return undefined;
    return Object.fromEntries(
      config.single.plans.map((plan) => [plan.months, plan.price]),
    );
  }, [config]);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch("/api/admin/subscription/course-packages");
        if (res.ok) {
          const data = (await res.json()) as CoursePackagesConfig;
          setConfig(data);
        }
      } catch (error) {
        console.error("Failed to fetch config:", error);
      }
    };
    fetchConfig();
  }, []);

  // Inner component retains all original business logic, restyled on-token
  const CourseCard = ({
    initialMonths,
    type,
  }: {
    initialMonths: number;
    type: "combo" | "single";
  }) => {
    const [currentMonths, setCurrentMonths] = useState(initialMonths);

    const canAdjustMonths =
      (type === "combo" && (initialMonths === 1 || initialMonths === 2)) ||
      (type === "single" && initialMonths === 2);

    const initialPlan =
      type === "combo"
        ? config?.combo.plans.find((p) => p.months === initialMonths)
        : config?.single.plans.find((p) => p.months === initialMonths);
    const currentPlan =
      type === "combo"
        ? config?.combo.plans.find((p) => p.months === currentMonths)
        : config?.single.plans.find((p) => p.months === currentMonths);

    const planName =
      currentPlan?.name ||
      initialPlan?.name ||
      (type === "combo" ? "Standard Plan" : "Single Pack");

    const basePrice =
      type === "combo" ? config?.combo.basePrice : config?.single.basePrice;
    const monthlyIncrement =
      type === "combo"
        ? config?.combo.monthlyIncrementPrice ?? 100000
        : config?.single.monthlyIncrementPrice ?? 100000;

    const getPriceForMonths = (months: number): number | null => {
      if (type === "combo") {
        const priceTable = comboPriceTable;
        if (priceTable && priceTable[months] !== undefined) return priceTable[months];
        if (basePrice && monthlyIncrement) {
          if (months === 1) return 200000;
          if (months === 2) return 400000;
          if (months === 6) return 1000000;
          if (months === 12) return 1800000;
          return 400000 + (months - 2) * 200000;
        }
      }
      if (type === "single") {
        const priceTable = singlePriceTable;
        if (priceTable && priceTable[months] !== undefined) return priceTable[months];
        if (basePrice && monthlyIncrement) {
          if (months === 2) return 200000;
          if (months === 6) return 500000;
          if (months === 12) return 900000;
          return 200000 + (months - 2) * 100000;
        }
      }
      const priceTable = type === "combo" ? comboPriceTable : singlePriceTable;
      return calculatePrice(type, months, basePrice, monthlyIncrement, priceTable);
    };

    const price = getPriceForMonths(currentMonths);
    const currentPlanInConfig =
      type === "combo"
        ? config?.combo.plans.find((p) => p.months === currentMonths)
        : config?.single.plans.find((p) => p.months === currentMonths);

    const isFeatured = Boolean(initialPlan?.popular);
    const isDeal = Boolean(
      currentPlanInConfig?.featuredDeal || currentPlanInConfig?.originalPrice,
    );
    const dealNote =
      currentPlanInConfig?.dealNote ||
      (currentPlanInConfig?.originalPrice
        ? `Save ${formatPrice(currentPlanInConfig.originalPrice - (price || 0))}`
        : config?.dealNoteTemplate || "SAME PRICE AS THE SHORTER PLAN");

    const checkoutLink =
      type === "single"
        ? `${ROUTES.CHECKOUT}?type=single&months=${currentMonths}&skill=${singleSkill}`
        : `${ROUTES.CHECKOUT}?type=combo&months=${currentMonths}`;

    const minMonths = type === "single" ? 2 : initialMonths === 1 ? 1 : 2;

    return (
      <div
        className={twMerge(
          "flex-none w-full md:w-[calc((100%-48px)/3)] snap-start rounded-[24px] px-[32px] py-[32px] border flex flex-col gap-[14px] shadow-[0px_6px_18px_0px_rgba(0,0,0,0.05)] relative transition-all",
          isFeatured
            ? "bg-[#191d24] border-transparent shadow-[0px_18px_42px_0px_rgba(0,0,0,0.18)]"
            : "bg-[#fff] border-[rgba(25,29,36,0.1)]",
        )}
      >
        {isFeatured && (
          <div className="bg-[#b3e653] rounded-[100px] px-[12px] py-[6px] w-fit">
            <span className="text-[#191d24] text-[11px] font-bold font-inter leading-normal whitespace-nowrap uppercase tracking-widest">
              {config?.popularBadgeText || "MOST POPULAR"}
            </span>
          </div>
        )}

        {/* Plan name */}
        <p
          className={twMerge(
            "text-[15px] font-bold font-inter leading-normal",
            isFeatured ? "text-[#b3e653]" : "text-[#9ad534]",
          )}
        >
          {planName}
        </p>

        {/* Month selector */}
        <div
          className={twMerge(
            "flex items-center gap-3 rounded-[8px] px-3 py-2 w-fit",
            isFeatured ? "bg-[rgba(255,255,255,0.08)]" : "bg-[rgba(25,29,36,0.04)]",
          )}
        >
          {canAdjustMonths && (
            <button
              type="button"
              onClick={() => currentMonths > minMonths && setCurrentMonths(currentMonths - 1)}
              disabled={currentMonths <= minMonths}
              className={twMerge(
                "w-7 h-7 rounded-full border flex items-center justify-center text-[16px] font-bold transition-colors disabled:opacity-40",
                isFeatured
                  ? "border-[rgba(255,255,255,0.2)] text-white hover:bg-[rgba(255,255,255,0.1)]"
                  : "border-[rgba(25,29,36,0.15)] text-[#6a7282] hover:bg-[rgba(25,29,36,0.05)]",
              )}
              aria-label="Decrease months"
            >
              −
            </button>
          )}
          <span
            className={twMerge(
              "text-[11px] font-bold font-inter uppercase min-w-[80px] text-center",
              isFeatured ? "text-[#b2bdcc]" : "text-[#6a7282]",
            )}
          >
            {currentMonths}{" "}
            {currentMonths === 1
              ? config?.monthText?.singular || "Month"
              : config?.monthText?.plural || "Months"}{" "}
            {config?.accessText || "Access"}
          </span>
          {canAdjustMonths && (
            <button
              type="button"
              onClick={() => currentMonths < 12 && setCurrentMonths(currentMonths + 1)}
              disabled={currentMonths >= 12}
              className={twMerge(
                "w-7 h-7 rounded-full border flex items-center justify-center text-[16px] font-bold transition-colors disabled:opacity-40",
                isFeatured
                  ? "border-[rgba(255,255,255,0.2)] text-white hover:bg-[rgba(255,255,255,0.1)]"
                  : "border-[rgba(25,29,36,0.15)] text-[#6a7282] hover:bg-[rgba(25,29,36,0.05)]",
              )}
              aria-label="Increase months"
            >
              +
            </button>
          )}
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-[6px]">
          <span
            className={twMerge(
              "font-display font-bold text-[40px] leading-[1.08] tracking-[-0.8px]",
              isFeatured ? "text-white" : "text-[#191d24]",
            )}
          >
            {formatPrice(price)}
          </span>
          {config?.priceSuffix && (
            <span
              className={twMerge(
                "text-[15px] font-medium font-inter leading-normal",
                isFeatured ? "text-[#b2bdcc]" : "text-[#6a7282]",
              )}
            >
              {config.priceSuffix}
            </span>
          )}
        </div>

        {isDeal && (
          <div
            className="bg-[#b3e653] text-[#191d24] px-3 py-1 rounded-[100px] text-[11px] font-bold font-inter uppercase w-fit"
          >
            {dealNote}
          </div>
        )}

        {/* Divider */}
        <hr
          className={twMerge(
            "border-0 h-px w-full",
            isFeatured ? "bg-[rgba(255,255,255,0.14)]" : "bg-[rgba(25,29,36,0.1)]",
          )}
        />

        {/* Features */}
        <div className="flex flex-col gap-[10px]">
          {config?.features?.included?.map((feature, index) => (
            <div key={index} className="flex gap-[8px] items-center">
              <CheckIcon dark={isFeatured} />
              <span
                className={twMerge(
                  "text-[14px] font-medium font-inter leading-normal",
                  isFeatured ? "text-[#e0e5ed]" : "text-[#191d24]",
                )}
              >
                {feature}
              </span>
            </div>
          )) || (
            <>
              <div className="flex gap-[8px] items-center">
                <CheckIcon dark={isFeatured} />
                <span
                  className={twMerge(
                    "text-[14px] font-medium font-inter leading-normal",
                    isFeatured ? "text-[#e0e5ed]" : "text-[#191d24]",
                  )}
                >
                  Unlimited Access Courses
                </span>
              </div>
              <div className="flex gap-[8px] items-center">
                <CheckIcon dark={isFeatured} />
                <span
                  className={twMerge(
                    "text-[14px] font-medium font-inter leading-normal",
                    isFeatured ? "text-[#e0e5ed]" : "text-[#191d24]",
                  )}
                >
                  Certificate After Completion
                </span>
              </div>
            </>
          )}
        </div>

        {/* CTA */}
        <Link href={checkoutLink} className="w-full mt-auto">
          <button
            type="button"
            className={twMerge(
              "w-full h-[48px] rounded-[100px] flex items-center justify-center transition-opacity hover:opacity-90",
              isFeatured
                ? "bg-[#b3e653]"
                : "bg-[#fff] border-[1.5px] border-[rgba(25,29,36,0.1)]",
            )}
          >
            <span
              className={twMerge(
                "text-[14px] font-bold font-inter leading-normal whitespace-nowrap",
                "text-[#191d24]",
              )}
            >
              {type === "combo"
                ? config?.combo.ctaText || "Join Plan"
                : config?.single.ctaText || "Join Plan"}
            </span>
          </button>
        </Link>
      </div>
    );
  };

  return (
    <div data-section="subscription-plans-inner" className="w-full">
      {/* ── Figma Section: Header + billing toggle + plan cards ── */}
      <div className="flex flex-col gap-[36px] items-center pb-[80px] pt-[56px] w-full">
        {/* Header */}
        <div className="flex flex-col gap-[12px] items-center text-center w-full">
          <p className="text-[#9ad534] text-[15px] font-semibold font-inter leading-normal">
            Pricing
          </p>
          <h1 className="font-display font-bold text-[40px] leading-[1.08] tracking-[-0.8px] text-[#191d24] text-center">
            Simple plans that grow with you
          </h1>
          <p className="text-[#6a7282] text-[17px] font-normal font-inter leading-normal text-center max-w-[600px]">
            Start free. Upgrade when you&apos;re ready for full mock tests and expert feedback.
          </p>
        </div>

        {/* Billing toggle */}
        <BillingToggle value={billingCycle} onChange={setBillingCycle} />

        {/* Figma plan cards (static, always shown) */}
        <FigmaPlanCards buyProLink={buyProLink} billingCycle={billingCycle} />

        {/* Money-back guarantee note */}
        <p className="text-[#6a7282] text-[13px] font-medium font-inter leading-normal text-center">
          All plans include a 30-day money-back guarantee · Cancel anytime
        </p>
      </div>

      {/* ── Dynamic course packages (from /api/admin/subscription/course-packages) ── */}
      {config && (
        <div className="pb-[80px] flex flex-col gap-[56px]">
          {/* Combo section */}
          <section data-section="combo-plans">
            <h2 className="font-display font-bold text-[32px] leading-[1.1] tracking-[-1.5px] text-[#191d24] text-center mb-[32px]">
              {config.combo.title || "Combo"}
            </h2>
            <div className="flex flex-col md:flex-row gap-[23px]">
              {[1, 2, 6, 12].map((months) => (
                <CourseCard key={`combo-${months}`} initialMonths={months} type="combo" />
              ))}
            </div>
          </section>

          {/* Single pack section */}
          <section data-section="single-plans">
            <div className="flex flex-col items-center gap-[24px] text-center mb-[32px]">
              <h2 className="font-display font-bold text-[32px] leading-[1.1] tracking-[-1.5px] text-[#191d24]">
                {config.single.title || "Single Pack"}
              </h2>
              {/* Skill toggle */}
              <div
                className="flex p-[5px] rounded-[100px] gap-[4px]"
                style={{
                  background: "#fff",
                  boxShadow: "1px 1px 2px 0px rgba(255,255,255,0.7), inset 1px 1px 3px 0px rgba(0,0,0,0.1)",
                }}
              >
                {(["listening", "reading"] as SkillType[]).map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => setSingleSkill(skill)}
                    className={twMerge(
                      "flex items-center gap-[8px] px-[24px] py-[11px] rounded-[100px] text-[14px] font-inter leading-normal transition-colors capitalize",
                      singleSkill === skill
                        ? "font-bold text-[#191d24]"
                        : "font-semibold text-[#6a7282]",
                    )}
                    style={
                      singleSkill === skill
                        ? {
                            backgroundImage:
                              "linear-gradient(106.95deg, #B3E653 0%, #B6E739 100%)",
                            boxShadow: "0px 1px 5px 0px rgba(0,0,0,0.15)",
                          }
                        : undefined
                    }
                  >
                    {config?.skillLabels?.[skill] || skill.charAt(0).toUpperCase() + skill.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-[23px]">
              {[2, 6, 12].map((months) => (
                <CourseCard key={`single-${months}`} initialMonths={months} type="single" />
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};
