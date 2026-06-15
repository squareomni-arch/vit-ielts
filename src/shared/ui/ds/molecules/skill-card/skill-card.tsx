
/**
 * SkillCard — Figma node 3035:253–300
 * 280×252px card with per-skill accent color + decorative ellipse that
 * expands on hover to fill the card background.
 */

import type { CSSProperties, ComponentType } from 'react';
import { twMerge } from 'tailwind-merge';

// Snappy easeOutQuint — confident, quick settle (motion handled purely in CSS so
// transitions stay interruptible when the pointer sweeps across cards).
const EASE = 'cubic-bezier(0.22,1,0.36,1)';

export type SkillCardSkill = 'listening' | 'reading' | 'writing' | 'speaking';

export type SkillCardProps = {
  skill: SkillCardSkill;
  href?: string;
  onClick?: () => void;
  className?: string;
  lessons?: string;
};

// ── per-skill design tokens ────────────────────────────────────────────────
const HeadphonesIcon = ({ className, style }: { className?: string; style?: CSSProperties }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 256 256"
    fill="currentColor"
    className={className}
    style={style}
  >
    <path d="M201.89,62.66A103.43,103.43,0,0,0,128.79,32H128A104,104,0,0,0,24,136v56a24,24,0,0,0,24,24H64a24,24,0,0,0,24-24V152a24,24,0,0,0-24-24H40.36A88,88,0,0,1,128,48h.67a87.71,87.71,0,0,1,87,80H192a24,24,0,0,0-24,24v40a24,24,0,0,0,24,24h16a24,24,0,0,0,24-24V136A103.41,103.41,0,0,0,201.89,62.66ZM64,144a8,8,0,0,1,8,8v40a8,8,0,0,1-8,8H48a8,8,0,0,1-8-8V144Zm152,48a8,8,0,0,1-8,8H192a8,8,0,0,1-8-8V152a8,8,0,0,1,8-8h24Z" />
  </svg>
);

const BookOpenIcon = ({ className, style }: { className?: string; style?: CSSProperties }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 256 256"
    fill="currentColor"
    className={className}
    style={style}
  >
    <path d="M224,48H160a40,40,0,0,0-32,16A40,40,0,0,0,96,48H32A16,16,0,0,0,16,64V192a16,16,0,0,0,16,16H96a24,24,0,0,1,24,24,8,8,0,0,0,16,0,24,24,0,0,1,24-24h64a16,16,0,0,0,16-16V64A16,16,0,0,0,224,48ZM96,192H32V64H96a24,24,0,0,1,24,24V200A39.81,39.81,0,0,0,96,192Zm128,0H160a39.81,39.81,0,0,0-24,8V88a24,24,0,0,1,24-24h64Z" />
  </svg>
);

const PencilLineIcon = ({ className, style }: { className?: string; style?: CSSProperties }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 256 256"
    fill="currentColor"
    className={className}
    style={style}
  >
    <path d="M227.32,73.37,182.63,28.69a16,16,0,0,0-22.63,0L36.69,152A15.86,15.86,0,0,0,32,163.31V208a16,16,0,0,0,16,16H216a8,8,0,0,0,0-16H115.32l112-112A16,16,0,0,0,227.32,73.37ZM136,75.31,152.69,92,68,176.69,51.31,160ZM48,208V179.31L76.69,208Zm48-3.31L79.32,188,164,103.31,180.69,120Zm96-96L147.32,64l24-24L216,84.69Z" />
  </svg>
);

const MicrophoneStageIcon = ({ className, style }: { className?: string; style?: CSSProperties }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 256 256"
    fill="currentColor"
    className={className}
    style={style}
  >
    <path d="M168,16A72.07,72.07,0,0,0,96,88a73.29,73.29,0,0,0,.63,9.42L27.12,192.22A15.93,15.93,0,0,0,28.71,213L43,227.29a15.93,15.93,0,0,0,20.78,1.59l94.81-69.53A73.29,73.29,0,0,0,168,160a72,72,0,1,0,0-144Zm56,72a55.72,55.72,0,0,1-11.16,33.52L134.49,43.16A56,56,0,0,1,224,88ZM54.32,216,40,201.68,102.14,117A72.37,72.37,0,0,0,139,153.86ZM112,88a55.67,55.67,0,0,1,11.16-33.51l78.34,78.34A56,56,0,0,1,112,88Zm-2.35,58.34a8,8,0,0,1,0,11.31l-8,8a8,8,0,1,1-11.31-11.31l8-8A8,8,0,0,1,109.67,146.33Z" />
  </svg>
);

type IconType = ComponentType<{ className?: string; style?: CSSProperties }>;

interface SkillConfig {
  readonly label: string;
  readonly description: string;
  readonly lessons: string;
  readonly tintBg: string;
  readonly solidBg: string;
  readonly icon: IconType;
}

const SKILL: Record<SkillCardSkill, SkillConfig> = {
  listening: {
    label: 'Listening',
    description: '40 questions, 4 sections. Train your ear with accents.',
    lessons: '32 lessons',
    tintBg: '#c3d4ff',
    solidBg: '#5281f9',
    icon: HeadphonesIcon,
  },
  reading: {
    label: 'Reading',
    description: '3 passages in 60 minutes. Skim, scan, conquer.',
    lessons: '28 lessons',
    tintBg: '#ffe2ce',
    solidBg: '#fc945a',
    icon: BookOpenIcon,
  },
  writing: {
    label: 'Writing',
    description: 'Task 1 & 2 frameworks with feedback on every essay.',
    lessons: '24 lessons',
    tintBg: '#f2fadd',
    solidBg: '#9ad534',
    icon: PencilLineIcon,
  },
  speaking: {
    label: 'Speaking',
    description: '3-part interview practice with fluency scoring.',
    lessons: '20 lessons',
    tintBg: '#fad9dc',
    solidBg: '#d94a56',
    icon: MicrophoneStageIcon,
  },
};

export const SkillCard = ({ skill, href, onClick, className = '', lessons }: SkillCardProps) => {
  const s = SKILL[skill];
  const Tag = href ? 'a' : 'div';
  const Icon = s.icon;

  // Accent + tint exposed as CSS vars so group-hover utilities can reach the
  // per-skill color without any JS state.
  const vars = { '--accent': s.solidBg, '--tint': s.tintBg } as CSSProperties;

  return (
    <Tag
      href={href}
      onClick={onClick}
      style={vars}
      className={twMerge(
        'group relative overflow-hidden bg-white rounded-[32px] outline-none',
        'flex flex-col justify-between',
        'w-full aspect-[300/252] p-[26px] xl:p-[32px] 2xl:p-[40px]',
        'shadow-[0px_6px_18px_0px_rgba(25,29,36,0.08)]',
        'border [border-color:rgba(25,29,36,0.1)] group-hover:[border-color:var(--accent)] group-focus-visible:[border-color:var(--accent)]',
        'transition-[border-color] duration-[250ms]',
        href || onClick ? 'cursor-pointer' : 'cursor-default',
        className,
      )}
    >
      {/* ── Decorative fill — a single circle whose CENTER sits on the card's
           top-right corner (top/right-0 + translate ½). Sized relative to the
           card (280% of width, kept square) so it always covers the whole card
           on hover at any width — full coverage lands at scale ≈0.93, matching
           the original near-end fill timing. Animates the `scale` property only
           (compositor-only → 60fps; `translate` stays static). ── */}
      <div
        className={twMerge(
          'absolute top-0 right-0 w-[280%] aspect-square translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none',
          '[background:var(--tint)] group-hover:[background:var(--accent)] group-focus-visible:[background:var(--accent)]',
          'scale-[0.15] group-hover:scale-100 group-focus-visible:scale-100',
          'motion-reduce:transition-none',
        )}
        style={{
          transitionProperty: 'scale, background-color',
          transitionDuration: '380ms',
          transitionTimingFunction: EASE,
          willChange: 'scale',
        }}
      />

      {/* ── Icon container ── */}
      <div className="relative z-10 flex items-center justify-center rounded-[16px] 2xl:rounded-[20px] w-[54px] h-[54px] xl:w-[60px] xl:h-[60px] 2xl:w-[72px] 2xl:h-[72px] shrink-0 [background:var(--tint)] group-hover:[background:var(--accent)] group-focus-visible:[background:var(--accent)] transition-colors duration-[250ms]">
        <Icon
          className="w-[32px] h-[32px] xl:w-[36px] xl:h-[36px] 2xl:w-[42px] 2xl:h-[42px] text-[color:var(--accent)] group-hover:text-white group-focus-visible:text-white transition-[color,transform] duration-[250ms] group-hover:scale-110 group-focus-visible:scale-110"
          style={{ transitionTimingFunction: EASE }}
        />
      </div>

      {/* ── Content ── */}
      <div className="relative z-10 flex flex-col gap-[6px] 2xl:gap-[10px]">
        <p className="font-display font-bold text-[19px] xl:text-[22px] 2xl:text-[26px] leading-[1.3] text-[#191d24] group-hover:text-white group-focus-visible:text-white transition-colors duration-[250ms]">
          {s.label}
        </p>
        <p className="font-inter text-[14px] xl:text-[15px] 2xl:text-[17px] leading-[1.4] text-[#6a7282] group-hover:text-white/85 group-focus-visible:text-white/85 transition-colors duration-[250ms]">
          {s.description}
        </p>

        {/* Lessons + arrow */}
        <div className="flex items-center justify-between mt-1">
          {lessons ? (
            <p className="font-inter font-bold text-[12px] xl:text-[13px] 2xl:text-[14px] text-[#6a7282] group-hover:text-white group-focus-visible:text-white transition-colors duration-[250ms]">
              {lessons}
            </p>
          ) : (
            <div />
          )}
          <div className="flex items-center justify-center rounded-full w-[34px] h-[34px] xl:w-[38px] xl:h-[38px] 2xl:w-[44px] 2xl:h-[44px] shrink-0 bg-[#191d24] group-hover:[background:var(--accent)] group-focus-visible:[background:var(--accent)] transition-colors duration-[250ms]">
            <span className="text-white font-bold text-[14px] 2xl:text-[16px] leading-none">→</span>
          </div>
        </div>
      </div>
    </Tag>
  );
};
