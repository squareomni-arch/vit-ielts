import Link from "next/link";
import { useState, useEffect, useMemo, useRef } from "react";
import { twMerge } from "tailwind-merge";
import { calculatePrice, formatPrice, SkillType } from "./pricing";
import { ROUTES } from "@/shared/routes";
import type { CoursePackagesConfig } from "@/shared/types/admin-config";

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

// ── Dynamic course-packages plan cards (keep existing business logic) ──────

export const SubscriptionPlans = ({
  // buyProLink is retained in the prop contract; the static Figma pricing
  // header that consumed it has been removed, so it is intentionally unused.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  buyProLink: _buyProLink,
}: { buyProLink: string }) => {
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

  // Combo carousel — shows 3 cards per view (md+); arrows scroll one card at a time.
  const comboTrackRef = useRef<HTMLDivElement>(null);
  const scrollCombo = (dir: -1 | 1) => {
    const track = comboTrackRef.current;
    if (!track) return;
    const card = track.querySelector<HTMLElement>("[data-card]");
    const step = card ? card.offsetWidth + 23 : track.clientWidth / 3;
    track.scrollBy({ left: dir * step, behavior: "smooth" });
  };

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
        data-card
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
      {/* ── Dynamic course packages (from /api/admin/subscription/course-packages) ── */}
      {config && (
        <div className="pt-[56px] pb-[80px] flex flex-col gap-[56px]">
          {/* Combo section — carousel showing 3 cards per view (md+) */}
          <section data-section="combo-plans">
            <div className="relative mb-[32px] flex items-center justify-center">
              <h2 className="font-display font-bold text-[32px] leading-[1.1] tracking-[-1.5px] text-[#191d24] text-center">
                {config.combo.title || "Combo"}
              </h2>
              {/* Carousel controls (desktop) */}
              <div className="hidden md:flex gap-2 absolute right-0">
                <button
                  type="button"
                  onClick={() => scrollCombo(-1)}
                  aria-label="Previous plans"
                  className="w-10 h-10 rounded-full border border-[rgba(25,29,36,0.1)] bg-white flex items-center justify-center text-[#191d24] hover:bg-[#f6f7f4] transition-colors cursor-pointer"
                >
                  <span className="material-symbols-rounded text-[22px] leading-none">chevron_left</span>
                </button>
                <button
                  type="button"
                  onClick={() => scrollCombo(1)}
                  aria-label="Next plans"
                  className="w-10 h-10 rounded-full border border-[rgba(25,29,36,0.1)] bg-white flex items-center justify-center text-[#191d24] hover:bg-[#f6f7f4] transition-colors cursor-pointer"
                >
                  <span className="material-symbols-rounded text-[22px] leading-none">chevron_right</span>
                </button>
              </div>
            </div>
            <div
              ref={comboTrackRef}
              className="flex gap-[23px] overflow-x-auto snap-x snap-mandatory scroll-smooth pt-1 pb-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
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
