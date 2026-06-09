
/**
 * SkillCard — Figma node 3035:253–300
 * 280×252px card with per-skill accent color + decorative ellipse that
 * expands on hover to fill the card background.
 */

import { useState } from 'react';
import { twMerge } from 'tailwind-merge';

export type SkillCardSkill = 'listening' | 'reading' | 'writing' | 'speaking';

export type SkillCardProps = {
  skill: SkillCardSkill;
  href?: string;
  onClick?: () => void;
  className?: string;
};

// ── per-skill design tokens ────────────────────────────────────────────────
const SKILL = {
  listening: {
    label: 'Listening',
    description: '40 questions, 4 sections. Train your ear with accents.',
    lessons: '32 lessons',
    tintBg: '#c3d4ff',
    solidBg: '#5281f9',
    icon: 'headphones',
  },
  reading: {
    label: 'Reading',
    description: '3 passages in 60 minutes. Skim, scan, conquer.',
    lessons: '28 lessons',
    tintBg: '#ffe2ce',
    solidBg: '#fc945a',
    icon: 'menu_book',
  },
  writing: {
    label: 'Writing',
    description: 'Task 1 & 2 frameworks with feedback on every essay.',
    lessons: '24 lessons',
    tintBg: '#f2fadd',
    solidBg: '#9ad534',
    icon: 'edit_note',
  },
  speaking: {
    label: 'Speaking',
    description: '3-part interview practice with fluency scoring.',
    lessons: '20 lessons',
    tintBg: '#fad9dc',
    solidBg: '#d94a56',
    icon: 'mic',
  },
} as const;

export const SkillCard = ({ skill, href, onClick, className = '' }: SkillCardProps) => {
  const [hovered, setHovered] = useState(false);
  const s = SKILL[skill];
  const Tag = href ? 'a' : 'div';

  return (
    <Tag
      href={href}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={twMerge(
        'relative overflow-hidden bg-white rounded-[32px]',
        'flex flex-col justify-between',
        'w-[280px] h-[252px] p-[26px]',
        'shadow-[0px_6px_18px_0px_rgba(25,29,36,0.08)]',
        'border transition-all duration-300',
        href || onClick ? 'cursor-pointer' : 'cursor-default',
        className,
      )}
      style={{ borderColor: hovered ? s.solidBg : 'rgba(25,29,36,0.1)' }}
    >
      {/* ── Decorative ellipse — expands to fill on hover ── */}
      <div
        className="absolute rounded-full pointer-events-none transition-all duration-500 ease-in-out"
        style={{
          width:  hovered ? 388 : 130,
          height: hovered ? 388 : 130,
          top:    hovered ? -71  : -64.5,
          left:   hovered ? -34  : 214,
          background: `radial-gradient(circle, ${s.solidBg} 0%, ${s.solidBg}BB 60%, ${s.solidBg}00 85%)`,
        }}
      />

      {/* ── Icon container ── */}
      <div
        className="relative z-10 flex items-center justify-center rounded-[16px] w-[54px] h-[54px] transition-all duration-300 shrink-0"
        style={{ background: hovered ? s.solidBg : s.tintBg }}
      >
        <span
          className="material-symbols-rounded transition-all duration-300"
          style={{
            fontSize: hovered ? 32 : 28,
            color: hovered ? 'white' : s.solidBg,
          }}
        >
          {s.icon}
        </span>
      </div>

      {/* ── Content ── */}
      <div className="relative z-10 flex flex-col gap-[6px]">
        <p
          className="font-display font-bold text-[19px] leading-[1.3] transition-colors duration-300"
          style={{ color: hovered ? 'white' : '#191d24' }}
        >
          {s.label}
        </p>
        <p
          className="font-inter text-[14px] leading-[1.4] w-[228px] transition-colors duration-300"
          style={{ color: hovered ? 'rgba(255,255,255,0.85)' : '#6a7282' }}
        >
          {s.description}
        </p>

        {/* Lessons + arrow */}
        <div className="flex items-center justify-between mt-1">
          <p
            className="font-inter font-bold text-[12px] transition-colors duration-300"
            style={{ color: hovered ? 'white' : '#6a7282' }}
          >
            {s.lessons}
          </p>
          <div
            className="flex items-center justify-center rounded-full w-[34px] h-[34px] transition-all duration-300 shrink-0"
            style={{ background: hovered ? s.solidBg : '#191d24' }}
          >
            <span className="text-white font-bold text-[14px] leading-none">→</span>
          </div>
        </div>
      </div>
    </Tag>
  );
};
