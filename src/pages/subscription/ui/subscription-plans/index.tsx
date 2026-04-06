import Link from "next/link";
import { useState, useEffect, useRef, useMemo } from "react";
import {
  Check,
  ChevronRight,
  ChevronLeft,
  X,
  Headphones,
  BookOpen,
  Minus,
  Plus,
} from "lucide-react";
import { twMerge } from "tailwind-merge";
import { calculatePrice, formatPrice, SkillType } from "./pricing";
import { ROUTES } from "@/shared/routes";
import type { CoursePackagesConfig } from "@/shared/types/admin-config";

// --- Component Slider nâng cấp với Arrow Navigation ---
const AutoSlider = ({ children }: { children: React.ReactNode }) => {
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showArrows, setShowArrows] = useState(false);

  const isDown = useRef(false);
  const startX = useRef(0);
  const scrollLeftState = useRef(0);

  // Kiểm tra để hiện mũi tên chỉ khi màn hình đủ lớn
  useEffect(() => {
    const handleResize = () => setShowArrows(window.innerWidth > 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const slider = sliderRef.current;
    if (!slider || isPaused || isDragging) return;

    const interval = setInterval(() => {
      const maxScroll = slider.scrollWidth - slider.offsetWidth;
      if (slider.scrollLeft >= maxScroll - 10) {
        slider.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        const step = (slider.offsetWidth + 24) / 3; // Khoảng cách 1 card + gap
        slider.scrollBy({ left: step, behavior: "smooth" });
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isPaused, isDragging]);

  const scroll = (direction: "left" | "right") => {
    if (!sliderRef.current) return;
    const step = (sliderRef.current.offsetWidth + 24) / 3;
    sliderRef.current.scrollBy({
      left: direction === "left" ? -step : step,
      behavior: "smooth",
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!sliderRef.current) return;
    isDown.current = true;
    setIsDragging(true);
    sliderRef.current.style.scrollBehavior = "auto";
    startX.current = e.pageX - sliderRef.current.offsetLeft;
    scrollLeftState.current = sliderRef.current.scrollLeft;
  };

  const handleMouseUpOrLeave = () => {
    isDown.current = false;
    setIsDragging(false);
    setIsPaused(false);
    if (sliderRef.current) sliderRef.current.style.scrollBehavior = "smooth";
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDown.current || !sliderRef.current) return;
    e.preventDefault();
    const x = e.pageX - sliderRef.current.offsetLeft;
    const walk = (x - startX.current) * 1.5;
    sliderRef.current.scrollLeft = scrollLeftState.current - walk;
  };

  return (
    <div className="relative group/slider w-full">
      {/* Nút điều hướng Arrow */}
      {showArrows && (
        <>
          <button
            onClick={() => scroll("left")}
            className="absolute -left-6 top-1/2 -translate-y-1/2 z-30 bg-primary-500 text-white shadow-lg border border-primary-400 p-3 rounded-full hover:bg-primary-600 transition-all opacity-0 group-hover/slider:opacity-100 -translate-x-2 group-hover/slider:translate-x-0"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={() => scroll("right")}
            className="absolute -right-6 top-1/2 -translate-y-1/2 z-30 bg-primary-500 text-white shadow-lg border border-primary-400 p-3 rounded-full hover:bg-primary-600 transition-all opacity-0 group-hover/slider:opacity-100 translate-x-2 group-hover/slider:translate-x-0"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}

      <div
        ref={sliderRef}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsPaused(true)}
        className={twMerge(
          "flex overflow-x-auto snap-x snap-mandatory gap-6 no-scrollbar cursor-grab active:cursor-grabbing select-none",
          "pt-12 pb-10", // Đảm bảo POPULAR không bị lẹm
          !isDragging && "scroll-smooth"
        )}
      >
        {children}
      </div>
    </div>
  );
};

export const SubscriptionPlans = ({ buyProLink }: { buyProLink: string }) => {
  const [singleSkill, setSingleSkill] = useState<SkillType>("listening");
  const [config, setConfig] = useState<CoursePackagesConfig | null>(null);
  const comboPriceTable = useMemo(() => {
    if (!config) return undefined;
    return Object.fromEntries(
      config.combo.plans.map((plan) => [plan.months, plan.price])
    );
  }, [config]);
  const singlePriceTable = useMemo(() => {
    if (!config) return undefined;
    return Object.fromEntries(
      config.single.plans.map((plan) => [plan.months, plan.price])
    );
  }, [config]);

  // Fetch config on mount
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

  const PricingCard = ({
    initialMonths,
    type,
  }: {
    initialMonths: number;
    type: "combo" | "single";
  }) => {
    const cardKey = `${type}-${initialMonths}`;
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
        if (priceTable && priceTable[months] !== undefined) {
          return priceTable[months];
        }

        if (basePrice && monthlyIncrement) {
          let calculatedPrice: number;
          if (months === 1) {
            calculatedPrice = 200000;
          } else if (months === 2) {
            calculatedPrice = 400000;
          } else {
            calculatedPrice = 400000 + (months - 2) * 200000;

            if (months === 6) {
              calculatedPrice = 1000000;
            } else if (months === 12) {
              calculatedPrice = 1800000;
            }
          }

          return calculatedPrice;
        }
      }

      if (type === "single") {
        const priceTable = singlePriceTable;
        if (priceTable && priceTable[months] !== undefined) {
          return priceTable[months];
        }

        if (basePrice && monthlyIncrement) {
          let calculatedPrice: number;
          if (months === 2) {
            calculatedPrice = 200000;
          } else {
            calculatedPrice = 200000 + (months - 2) * 100000;

            if (months === 6) {
              calculatedPrice = 500000;
            } else if (months === 12) {
              calculatedPrice = 900000;
            }
          }

          return calculatedPrice;
        }
      }

      const priceTable = type === "combo" ? comboPriceTable : singlePriceTable;
      return calculatePrice(type, months, basePrice, monthlyIncrement, priceTable);
    };

    const price = getPriceForMonths(currentMonths);
    const currentPlanInConfig = type === "combo"
      ? config?.combo.plans.find((p) => p.months === currentMonths)
      : config?.single.plans.find((p) => p.months === currentMonths);

    const isFeatured = Boolean(initialPlan?.popular);
    const isDeal = Boolean(currentPlanInConfig?.featuredDeal || currentPlanInConfig?.originalPrice);
    const dealNote = currentPlanInConfig?.dealNote ||
      (currentPlanInConfig?.originalPrice
        ? `Giảm ${formatPrice((currentPlanInConfig.originalPrice - (price || 0)))}`
        : config?.dealNoteTemplate || "SAME PRICE AS THE SHORTER PLAN");

    const checkoutLink =
      type === "single"
        ? `${ROUTES.CHECKOUT}?type=single&months=${currentMonths}&skill=${singleSkill}`
        : `${ROUTES.CHECKOUT}?type=combo&months=${currentMonths}`;

    const handleDecrease = () => {
      if (canAdjustMonths) {
        const minMonths = type === "single" ? 2 : (initialMonths === 1 ? 1 : 2);
        if (currentMonths > minMonths) {
          setCurrentMonths(currentMonths - 1);
        }
      }
    };

    const handleIncrease = () => {
      if (canAdjustMonths && currentMonths < 12) {
        setCurrentMonths(currentMonths + 1);
      }
    };

    return (
      <div
        className={twMerge(
          // Sửa lỗi ló cột 4: w tính chuẩn 3 card + gaps
          "flex-none w-full md:w-[calc((100%-48px)/3)] snap-start bg-white rounded-[24px] p-8 border border-gray-100 shadow-lg flex flex-col items-center text-center relative transition-all",
          isFeatured && "border-primary-500 ring-2 ring-primary-500/5"
        )}
      >
        {isFeatured && (
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
            <span className="bg-primary-500 text-white px-6 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest shadow-lg whitespace-nowrap">
              {config?.popularBadgeText || "POPULAR"}
            </span>
          </div>
        )}

        <h4 className="text-xl font-bold text-[#2D3142] mb-2">{planName}</h4>

        <div className="bg-gray-50 px-3 py-2 rounded-md mb-6 flex items-center justify-center gap-3">
          {canAdjustMonths ? (
            <>
              <button
                onClick={handleDecrease}
                disabled={currentMonths <= (type === "single" ? 2 : (initialMonths === 1 ? 1 : 2))}
                className="flex items-center justify-center w-8 h-8 rounded-full bg-white border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Minus className="h-4 w-4 text-gray-600" />
              </button>
              <span className="text-[10px] font-bold text-gray-400 uppercase min-w-[80px]">
                {currentMonths}{" "}
                {currentMonths === 1
                  ? config?.monthText?.singular || "Month"
                  : config?.monthText?.plural || "Months"}{" "}
                {config?.accessText || "Access"}
              </span>
              <button
                onClick={handleIncrease}
                disabled={currentMonths >= 12}
                className="flex items-center justify-center w-8 h-8 rounded-full bg-white border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Plus className="h-4 w-4 text-gray-600" />
              </button>
            </>
          ) : (
            <span className="text-[10px] font-bold text-gray-400 uppercase min-w-[80px]">
              {currentMonths}{" "}
              {currentMonths === 1
                ? config?.monthText?.singular || "Month"
                : config?.monthText?.plural || "Months"}{" "}
              {config?.accessText || "Access"}
            </span>
          )}
        </div>

        <div className="mb-6 flex flex-col items-center">
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-black text-primary-500">
              {formatPrice(price)}
            </span>
            <span className="text-gray-400 font-bold text-[14px]">
              {config?.priceSuffix || "/Tài Khoản"}
            </span>
          </div>
          {isDeal && (
            <div className="mt-2 bg-[#FAF7EB] text-tertiary-500 px-3 py-1 rounded-full text-[10px] font-black uppercase whitespace-nowrap">
              {dealNote}
            </div>
          )}
        </div>

        <Link href={checkoutLink} className="w-full mb-8">
          <button className="w-full py-3 rounded-xl font-bold bg-[#F0F7FF] text-[#2B6EFF] hover:bg-blue-100 transition-all flex items-center justify-center gap-2 border border-blue-100">
            {type === "combo"
              ? config?.combo.ctaText || "Join Course Plan"
              : config?.single.ctaText || "Join Course Plan"}{" "}
            <ChevronRight className="h-4 w-4" />
          </button>
        </Link>

        {/* List description sample */}
        <ul className="w-full space-y-4 text-left">
          {config?.features?.included?.map((feature, index) => (
            <li key={index} className="flex items-center gap-3">
              <Check
                className="h-4 w-4 text-green-500 shrink-0"
                strokeWidth={3}
              />
              <span className="text-sm font-medium text-gray-600">
                {feature}
              </span>
            </li>
          )) || (
              <>
                <li className="flex items-center gap-3">
                  <Check
                    className="h-4 w-4 text-green-500 shrink-0"
                    strokeWidth={3}
                  />
                  <span className="text-sm font-medium text-gray-600">
                    Unlimited Access Courses
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <Check
                    className="h-4 w-4 text-green-500 shrink-0"
                    strokeWidth={3}
                  />
                  <span className="text-sm font-medium text-gray-600">
                    Certificate After Completion
                  </span>
                </li>
              </>
            )}
          {config?.features?.excluded?.map((feature, index) => (
            <li key={index} className="flex items-center gap-3 opacity-50">
              <X className="h-4 w-4 text-red-400 shrink-0" strokeWidth={3} />
              <span className="text-sm font-medium text-gray-400">
                {feature}
              </span>
            </li>
          )) || (
              <>
                <li className="flex items-center gap-3 opacity-50">
                  <X className="h-4 w-4 text-red-400 shrink-0" strokeWidth={3} />
                  <span className="text-sm font-medium text-gray-400">
                    24/7 Dedicated Support
                  </span>
                </li>
                <li className="flex items-center gap-3 opacity-50">
                  <X className="h-4 w-4 text-red-400 shrink-0" strokeWidth={3} />
                  <span className="text-sm font-medium text-gray-400">
                    Unlimited Emails
                  </span>
                </li>
              </>
            )}
        </ul>
      </div>
    );
  };

  return (
    <div className="max-w-[1240px] mx-auto px-4 pt-10">
      {/* SECTION 1: COMBO */}
      <section className="m-0">
        <div className="text-center">
          <h2 className="text-[#2D3142] text-[32px] sm:text-[40px] font-bold leading-tight block wrap-break-word">
            {config?.combo.title || "Combo"}
          </h2>
        </div>
        <AutoSlider>
          {[1, 2, 6, 12].map((months) => (
            <PricingCard
              key={`combo-${months}`}
              initialMonths={months}
              type="combo"
            />
          ))}
        </AutoSlider>
      </section>

      {/* SECTION 2: SINGLE PACK */}
       <section className="m-0 mt-8">
        <div className="flex flex-col items-center gap-8 text-center">
          <div>
            <h2 className="text-[#2D3142] text-[32px] sm:text-[40px] font-bold leading-tight block wrap-break-word">
              {config?.single.title || "Single Pack"}
            </h2>
          </div>
          <div className="flex p-1.5 bg-gray-50 rounded-full w-fit border border-gray-100">
            <button
              onClick={() => setSingleSkill("listening")}
              className={twMerge(
                "flex items-center gap-3 px-8 py-3 rounded-full font-bold text-sm transition-all",
                singleSkill === "listening"
                  ? "bg-white text-primary-500 shadow-sm border border-primary-100"
                  : "text-gray-400 hover:text-gray-600"
              )}
            >
              <Headphones className="h-4 w-4" />{" "}
              {config?.skillLabels?.listening || "Listening"}
            </button>
            <button
              onClick={() => setSingleSkill("reading")}
              className={twMerge(
                "flex items-center gap-3 px-8 py-3 rounded-full font-bold text-sm transition-all",
                singleSkill === "reading"
                  ? "bg-white text-primary-500 shadow-sm border border-primary-100"
                  : "text-gray-400 hover:text-gray-600"
              )}
            >
              <BookOpen className="h-4 w-4" />{" "}
              {config?.skillLabels?.reading || "Reading"}
            </button>
          </div>
        </div>
        <AutoSlider>
          {[2, 6, 12].map((months) => (
            <PricingCard
              key={`single-${months}`}
              initialMonths={months}
              type="single"
            />
          ))}
        </AutoSlider>
      </section>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};
