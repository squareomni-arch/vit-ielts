import { SkillCard } from "@/shared/ui/ds/molecules/skill-card/skill-card";
import { ScrollFadeIn } from "@/shared/lib/use-scroll-fade-in";
import { ROUTES } from "@/shared/routes";
import type { TestPlatformIntroConfig } from "./types";

// ─── Component ────────────────────────────────────────────────────────────────

interface IeltsTestPlatformIntroProps {
  config?: TestPlatformIntroConfig;
}

export const IeltsTestPlatformIntro = ({ config: _config }: IeltsTestPlatformIntroProps) => {
  return (
    <ScrollFadeIn
      data-section="platform-intro"
      className="w-full mb-[24px]"
    >
      {/* Figma 3278:620 — flex-col gap-34px */}
      <div className="flex flex-col gap-[34px]">
        {/* Section heading — Figma: Heading/1 38px Be Vietnam Pro Bold lh-1.1 tracking-[-0.95px] */}
        <h2 className="font-display font-bold text-[38px] leading-[1.1] tracking-[-0.95px] text-[#191d24]">
          Master every part of the test
        </h2>

        {/* Skill cards grid — full-width columns; cards fill each cell and scale with the viewport */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[16px] xl:gap-[20px] w-full">
          <SkillCard skill="listening" href={ROUTES.PRACTICE.ARCHIVE_LISTENING} className="w-full" />
          <SkillCard skill="reading"   href={ROUTES.PRACTICE.ARCHIVE_READING}   className="w-full" />
          <SkillCard skill="writing"   href={`${ROUTES.BLOG.ARCHIVE}?skill=writing`}  className="w-full" />
          <SkillCard skill="speaking"  href={`${ROUTES.BLOG.ARCHIVE}?skill=speaking`} className="w-full" />
        </div>
      </div>
    </ScrollFadeIn>
  );
};
