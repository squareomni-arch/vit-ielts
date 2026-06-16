import { ScrollFadeIn } from "@/shared/lib/use-scroll-fade-in";
import type { WhyChooseUsConfig } from "./types";

type FeatureItem = {
  iconPath: string;
  title: string;
  description: string;
};

const DEFAULT_FEATURES: FeatureItem[] = [
  {
    iconPath: "/assets/icons/PencilLine.svg",
    title: "Real exam format",
    description: "Tests mirror the official IELTS structure, timing and difficulty exactly.",
  },
  {
    iconPath: "/assets/icons/Exam.svg",
    title: "Instant scoring",
    description: "Band scores and analytics the moment you finish a test.",
  },
  {
    iconPath: "/assets/icons/UserSound.svg",
    title: "Expert feedback",
    description: "Teachers grade your writing and speaking with actionable notes.",
  },
  {
    iconPath: "/assets/icons/Chalkboard.svg",
    title: "Study plans",
    description: "A personalised roadmap that adapts to your target band and date.",
  },
  {
    iconPath: "/assets/icons/Video.svg",
    title: "Practice anytime",
    description: "Mobile-ready lessons so you can study in any spare 10 minutes.",
  },
  {
    iconPath: "/assets/icons/UsersThree.svg",
    title: "Community",
    description: "Join speaking clubs and study groups to stay motivated together.",
  },
];

// ─── FeatureCard ──────────────────────────────────────────────────────────────

const FeatureCard = ({ iconPath, title, description }: FeatureItem) => (
  <div className="bg-[#374151] border border-border-subtle/10 rounded-[24px] p-[26px] flex flex-col items-start flex-1 min-w-0">
    <div className="bg-brand flex items-center justify-center rounded-[14px] w-12 h-12 shrink-0 mb-4">
      <img src={iconPath} alt="" width={32} height={32} className="brightness-0" />
    </div>
    <p className="font-display font-bold text-[19px] leading-[1.3] text-white mb-2">
      {title}
    </p>
    <p className="font-inter font-normal text-[14px] leading-[1.4] text-white/60">
      {description}
    </p>
  </div>
);

// ─── Component ────────────────────────────────────────────────────────────────

interface WhyChooseUsProps {
  config?: WhyChooseUsConfig;
}

export const WhyChooseUs = ({ config: _config }: WhyChooseUsProps) => {
  return (
    <ScrollFadeIn
      data-section="why-choose-us"
      className="w-full bg-surface-app "
    >
      <div className="relative bg-ink-900 rounded-[40px] p-14 overflow-hidden">
        {/* Plus pattern overlay */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: "url('/assets/pattern-plus.svg')",
            backgroundSize: "42px 42px",
            backgroundPosition: "top left",
          }}
        />

        <div className="relative flex flex-col gap-[34px]">
          {/* Header */}
          <div className="flex flex-col gap-[10px]">
            <p className="font-inter font-bold text-[12px] leading-[1.2] tracking-[0.96px] uppercase text-brand">
              WHY VIT IELTS
            </p>
            <h2 className="font-display font-bold text-[38px] leading-[1.1] tracking-[-0.95px] text-white">
              Everything you need in one place
            </h2>
            <p className="font-inter font-normal text-[18px] leading-[1.5] text-white/65">
              A complete prep ecosystem built around how students actually improve.
            </p>
          </div>

          {/* Feature cards: 2 rows × 3 cols */}
          <div className="flex flex-col gap-[22px]">
            <div className="flex flex-col sm:flex-row gap-[22px]">
              {DEFAULT_FEATURES.slice(0, 3).map((f) => (
                <FeatureCard key={f.title} {...f} />
              ))}
            </div>
            <div className="flex flex-col sm:flex-row gap-[22px]">
              {DEFAULT_FEATURES.slice(3, 6).map((f) => (
                <FeatureCard key={f.title} {...f} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </ScrollFadeIn>
  );
};
