// Shared skill metadata for the Vit IELTS blog page.

export const SKILL_ORDER = ["listening", "reading", "writing", "speaking"] as const;

export type SkillKey = (typeof SKILL_ORDER)[number];

export const SKILL_META: Record<SkillKey, { label: string }> = {
  listening: { label: "Listening" },
  reading: { label: "Reading" },
  writing: { label: "Writing" },
  speaking: { label: "Speaking" },
};

export const skillLabel = (skill?: string | null): string =>
  (skill && SKILL_META[skill as SkillKey]?.label) || "";
