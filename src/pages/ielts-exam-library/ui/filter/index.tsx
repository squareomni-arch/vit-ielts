/**
 * Filter — Figma node 3410:224 (Toolbar) + mobile drawer variant.
 *
 * Desktop: horizontal row of chip-dropdowns + search box (full-width).
 * Mobile (prop `mobile`): vertical panel used inside the drawer, same
 *   functional controls but stacked.
 *
 * FUNCTIONAL chips (wired to react-hook-form):
 *   - Type          → form field `type`         (all | academic | general)
 *   - Skill         → form field `skill`         (all | reading | listening)
 *   - Question type → form field `questionForm`  (multi-select, comma-separated)
 *   - Subscription  → form field `subscription`  (pro | free | "")
 *   - Parts         → form field `parts`         (multi-select, comma-separated, 1–4)
 *   - Sort          → form field `sort`          (newest | popular | high-ranking)
 *   - Collection    → form field `collection`
 *   - Search        → form field `search`
 *
 * DECORATIVE chips (styled, no handlers — not yet backed by backend data):
 *   - Band
 */

import { useEffect, useRef, useState } from "react";
import { useFormContext } from "react-hook-form";
import type { FilterFormValues } from "..";
import {
  READING_QUESTION_FORMS,
  LISTENING_QUESTION_FORMS,
} from "@/shared/constants";

/* ─── Types ─────────────────────────────────────────────────────────── */

type FilterProps = {
  mobile?: boolean;
  collections?: string[];
  onClose?: () => void;
};

/* ─── Chip primitive ─────────────────────────────────────────────────── */

interface ChipProps {
  label: string;
  active?: boolean;
  badge?: number;
  /** When true the chip is purely visual — no pointer-events. */
  decorative?: boolean;
  onClick?: () => void;
  children?: React.ReactNode;
}

const Chip = ({
  label,
  active = false,
  badge,
  decorative = false,
  onClick,
  children,
}: ChipProps) => (
  <button
    type="button"
    disabled={decorative}
    onClick={!decorative ? onClick : undefined}
    aria-disabled={decorative}
    className={[
      "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-body-s font-semibold transition",
      active
        ? "border-brand bg-brand text-ink-900"
        : "border-border-hairline bg-surface-card text-ink-700 hover:bg-primary-100",
      decorative ? "pointer-events-none cursor-default opacity-80" : "cursor-pointer",
    ]
      .filter(Boolean)
      .join(" ")}
  >
    {label}
    {typeof badge === "number" && badge > 0 && (
      <span className="inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-ink-900 leading-none">
        {badge}
      </span>
    )}
    {children ?? (
      <span className="material-symbols-rounded text-[14px] text-ink-muted">
        chevron_right
      </span>
    )}
  </button>
);

/* ─── Dropdown wrapper ───────────────────────────────────────────────── */

interface ChipDropdownProps {
  label: string;
  active?: boolean;
  badge?: number;
  children: React.ReactNode;
}

const ChipDropdown = ({ label, active, badge, children }: ChipDropdownProps) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={[
          "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-body-s font-semibold transition cursor-pointer",
          active || open
            ? "border-brand bg-brand text-ink-900"
            : "border-border-hairline bg-surface-card text-ink-700 hover:bg-primary-100",
        ].join(" ")}
      >
        {label}
        {typeof badge === "number" && badge > 0 && (
          <span className="inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-ink-900 leading-none">
            {badge}
          </span>
        )}
        <span className="material-symbols-rounded text-[14px] text-ink-muted">
          {open ? "expand_less" : "expand_more"}
        </span>
      </button>

      {open && (
        <div className="absolute left-0 top-[calc(100%+6px)] z-30 min-w-[160px] rounded-2xl border border-border-hairline bg-surface-card p-2 shadow-primary">
          {children}
        </div>
      )}
    </div>
  );
};

/* ─── Dropdown option row ────────────────────────────────────────────── */

const DropdownOption = ({
  label,
  checked,
  onToggle,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
}) => (
  <label className="flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 hover:bg-primary-100 transition">
    <div
      className={[
        "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
        checked
          ? "border-brand bg-brand text-ink-900"
          : "border-border-hairline bg-surface-card text-transparent",
      ].join(" ")}
    >
      <span className="material-symbols-rounded text-[12px]">check</span>
    </div>
    <span className="text-body-s text-ink-700">{label}</span>
    <input type="checkbox" checked={checked} onChange={onToggle} className="sr-only" />
  </label>
);

/* ─── Constants ──────────────────────────────────────────────────────── */

const TYPE_OPTIONS = [
  { value: "academic" as const, label: "Academic" },
  { value: "general" as const, label: "General" },
];

const SKILL_OPTIONS = [
  { value: "reading" as const, label: "Reading" },
  { value: "listening" as const, label: "Listening" },
];

const SORT_OPTIONS = [
  { value: "newest" as const, label: "Newest" },
  { value: "popular" as const, label: "Popular" },
  { value: "high-ranking" as const, label: "High Ranking" },
];

/** Deduplicated union of reading + listening question form options */
const QUESTION_FORM_OPTIONS: { value: string; label: string }[] = (() => {
  const seen = new Set<string>();
  const result: { value: string; label: string }[] = [];
  for (const opt of [...READING_QUESTION_FORMS, ...LISTENING_QUESTION_FORMS]) {
    if (!seen.has(opt.value)) {
      seen.add(opt.value);
      result.push({ value: opt.value, label: opt.label });
    }
  }
  return result;
})();

const SUBSCRIPTION_OPTIONS = [
  { value: "pro" as const, label: "PRO only" },
  { value: "free" as const, label: "Free" },
];

const PARTS_OPTIONS = [
  { value: 1, label: "1 part" },
  { value: 2, label: "2 parts" },
  { value: 3, label: "3 parts" },
  { value: 4, label: "4 parts" },
];

/* ─── Main component ─────────────────────────────────────────────────── */

export const Filter = ({
  mobile = false,
  collections = [],
  onClose,
}: FilterProps) => {
  const { watch, setValue } = useFormContext<FilterFormValues>();
  const values = watch();

  /* Local search draft so we don't fire a route-change on every keystroke */
  const [searchDraft, setSearchDraft] = useState(values.search ?? "");

  useEffect(() => {
    setSearchDraft(values.search ?? "");
  }, [values.search]);

  const applySearch = () => {
    setValue("search", searchDraft.trim(), { shouldDirty: true });
    setValue("page", 1, { shouldDirty: true });
    if (mobile) onClose?.();
  };

  /** Parse comma-separated questionForm string → Set of active slugs */
  const activeQuestionForms = new Set<string>(
    values.questionForm
      ? values.questionForm.split(",").filter((s) => s.length > 0)
      : []
  );

  /** Toggle a single question-form slug in/out of the comma-separated field */
  const toggleQuestionForm = (slug: string) => {
    const next = new Set(activeQuestionForms);
    if (next.has(slug)) {
      next.delete(slug);
    } else {
      next.add(slug);
    }
    setValue("questionForm", Array.from(next).join(","), { shouldDirty: true });
    setValue("page", 1, { shouldDirty: true });
  };

  /** Parse comma-separated parts string → Set of active counts (as strings for Set lookup) */
  const activePartsSet = new Set<string>(
    values.parts
      ? values.parts.split(",").filter((s) => s.length > 0)
      : []
  );

  /** Toggle a single part count in/out of the comma-separated parts field */
  const togglePart = (count: number) => {
    const key = String(count);
    const next = new Set(activePartsSet);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    setValue("parts", Array.from(next).join(","), { shouldDirty: true });
    setValue("page", 1, { shouldDirty: true });
  };

  const resetFilters = () => {
    setValue("type", "academic", { shouldDirty: true });
    setValue("skill", "reading", { shouldDirty: true });
    setValue("collection", "", { shouldDirty: true });
    setValue("sort", "newest", { shouldDirty: true });
    setValue("search", "", { shouldDirty: true });
    setValue("questionForm", "", { shouldDirty: true });
    setValue("subscription", "", { shouldDirty: true });
    setValue("parts", "", { shouldDirty: true });
    setValue("page", 1, { shouldDirty: true });
    if (mobile) onClose?.();
  };

  const hasActiveFilters =
    !!values.search ||
    (values.type && values.type !== "academic") ||
    (values.skill && values.skill !== "all") ||
    !!values.collection ||
    (values.sort && values.sort !== "newest") ||
    !!values.questionForm ||
    !!values.subscription ||
    !!values.parts;

  /* ── Mobile drawer variant ─────────────────────────────────────── */
  if (mobile) {
    return (
      <div className="flex flex-col gap-5 pb-24 pt-2 px-1">
        {/* Search */}
        <div className="relative flex items-center h-10 rounded-full border border-border-hairline overflow-hidden bg-surface-card focus-within:border-brand transition">
          <input
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                applySearch();
              }
            }}
            placeholder="Search tests…"
            className="flex-1 h-full bg-transparent px-4 text-body-s text-ink-700 outline-none placeholder:text-ink-muted"
          />
          <button
            type="button"
            onClick={applySearch}
            className="flex h-full w-11 items-center justify-center bg-ink-900 text-surface-card transition hover:bg-ink-700"
          >
            <span className="material-symbols-rounded text-[18px]">search</span>
          </button>
        </div>

        {/* Type */}
        <div>
          <p className="mb-2 text-caption-bold font-bold text-ink-muted uppercase tracking-[0.08em]">Type</p>
          <div className="flex flex-col gap-2">
            {TYPE_OPTIONS.map((opt) => (
              <DropdownOption
                key={opt.value}
                label={opt.label}
                checked={values.type === opt.value}
                onToggle={() =>
                  setValue("type", values.type === opt.value ? "all" : opt.value, {
                    shouldDirty: true,
                  })
                }
              />
            ))}
          </div>
        </div>

        {/* Skill */}
        <div>
          <p className="mb-2 text-caption-bold font-bold text-ink-muted uppercase tracking-[0.08em]">Skill</p>
          <div className="flex flex-col gap-2">
            {SKILL_OPTIONS.map((opt) => (
              <DropdownOption
                key={opt.value}
                label={opt.label}
                checked={values.skill === opt.value}
                onToggle={() =>
                  setValue("skill", values.skill === opt.value ? "all" : opt.value, {
                    shouldDirty: true,
                  })
                }
              />
            ))}
          </div>
        </div>

        {/* Sort */}
        <div>
          <p className="mb-2 text-caption-bold font-bold text-ink-muted uppercase tracking-[0.08em]">Sort by</p>
          <div className="flex flex-col gap-2">
            {SORT_OPTIONS.map((opt) => (
              <DropdownOption
                key={opt.value}
                label={opt.label}
                checked={values.sort === opt.value}
                onToggle={() =>
                  setValue("sort", opt.value, { shouldDirty: true })
                }
              />
            ))}
          </div>
        </div>

        {/* Question type */}
        <div>
          <p className="mb-2 text-caption-bold font-bold text-ink-muted uppercase tracking-[0.08em]">Question type</p>
          <div className="flex flex-col gap-2">
            {QUESTION_FORM_OPTIONS.map((opt) => (
              <DropdownOption
                key={opt.value}
                label={opt.label}
                checked={activeQuestionForms.has(opt.value)}
                onToggle={() => toggleQuestionForm(opt.value)}
              />
            ))}
          </div>
        </div>

        {/* Subscription */}
        <div>
          <p className="mb-2 text-caption-bold font-bold text-ink-muted uppercase tracking-[0.08em]">Subscription</p>
          <div className="flex flex-col gap-2">
            {SUBSCRIPTION_OPTIONS.map((opt) => (
              <DropdownOption
                key={opt.value}
                label={opt.label}
                checked={values.subscription === opt.value}
                onToggle={() => {
                  setValue(
                    "subscription",
                    values.subscription === opt.value ? "" : opt.value,
                    { shouldDirty: true }
                  );
                  setValue("page", 1, { shouldDirty: true });
                }}
              />
            ))}
          </div>
        </div>

        {/* Parts */}
        <div>
          <p className="mb-2 text-caption-bold font-bold text-ink-muted uppercase tracking-[0.08em]">Parts</p>
          <div className="flex flex-col gap-2">
            {PARTS_OPTIONS.map((opt) => (
              <DropdownOption
                key={opt.value}
                label={opt.label}
                checked={activePartsSet.has(String(opt.value))}
                onToggle={() => togglePart(opt.value)}
              />
            ))}
          </div>
        </div>

        {/* Collection */}
        {collections.length > 0 && (
          <div>
            <p className="mb-2 text-caption-bold font-bold text-ink-muted uppercase tracking-[0.08em]">Collection</p>
            <div className="flex flex-col gap-2">
              {collections.map((col) => (
                <DropdownOption
                  key={col}
                  label={col}
                  checked={values.collection === col}
                  onToggle={() =>
                    setValue("collection", values.collection === col ? "" : col, {
                      shouldDirty: true,
                    })
                  }
                />
              ))}
            </div>
          </div>
        )}

        {/* Clear */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="mt-1 w-full rounded-full border border-border-hairline bg-surface-card py-2.5 text-body-s font-bold text-ink-700 transition hover:bg-primary-100"
          >
            Clear all filters
          </button>
        )}
      </div>
    );
  }

  /* ── Desktop toolbar variant (Figma 3410:224) ──────────────────── */
  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* ── FUNCTIONAL: Type chip-dropdown (Academic / General) ── */}
      <ChipDropdown
        label={`Type: ${TYPE_OPTIONS.find((o) => o.value === values.type)?.label ?? "Academic"}`}
        active={!!(values.type && values.type !== "academic")}
      >
        {TYPE_OPTIONS.map((opt) => (
          <DropdownOption
            key={opt.value}
            label={opt.label}
            checked={values.type === opt.value}
            onToggle={() =>
              setValue("type", values.type === opt.value ? "all" : opt.value, {
                shouldDirty: true,
              })
            }
          />
        ))}
      </ChipDropdown>

      {/* ── FUNCTIONAL: Skill chip-dropdown ── */}
      <ChipDropdown
        label="Skill"
        active={!!(values.skill && values.skill !== "all")}
      >
        {SKILL_OPTIONS.map((opt) => (
          <DropdownOption
            key={opt.value}
            label={opt.label}
            checked={values.skill === opt.value}
            onToggle={() =>
              setValue("skill", values.skill === opt.value ? "all" : opt.value, {
                shouldDirty: true,
              })
            }
          />
        ))}
      </ChipDropdown>

      {/* ── FUNCTIONAL: Question type multi-select dropdown ── */}
      <ChipDropdown
        label="Question type"
        active={activeQuestionForms.size > 0}
        badge={activeQuestionForms.size > 0 ? activeQuestionForms.size : undefined}
      >
        {QUESTION_FORM_OPTIONS.map((opt) => (
          <DropdownOption
            key={opt.value}
            label={opt.label}
            checked={activeQuestionForms.has(opt.value)}
            onToggle={() => toggleQuestionForm(opt.value)}
          />
        ))}
      </ChipDropdown>

      {/* ── FUNCTIONAL: Parts multi-select dropdown ── */}
      <ChipDropdown
        label="Parts"
        active={activePartsSet.size > 0}
        badge={activePartsSet.size > 0 ? activePartsSet.size : undefined}
      >
        {PARTS_OPTIONS.map((opt) => (
          <DropdownOption
            key={opt.value}
            label={opt.label}
            checked={activePartsSet.has(String(opt.value))}
            onToggle={() => togglePart(opt.value)}
          />
        ))}
      </ChipDropdown>

      {/* ── FUNCTIONAL: Subscription dropdown ── */}
      <ChipDropdown
        label={
          values.subscription === "pro"
            ? "PRO only"
            : values.subscription === "free"
            ? "Free"
            : "Subscription"
        }
        active={!!values.subscription}
      >
        {SUBSCRIPTION_OPTIONS.map((opt) => (
          <DropdownOption
            key={opt.value}
            label={opt.label}
            checked={values.subscription === opt.value}
            onToggle={() => {
              setValue(
                "subscription",
                values.subscription === opt.value ? "" : opt.value,
                { shouldDirty: true }
              );
              setValue("page", 1, { shouldDirty: true });
            }}
          />
        ))}
      </ChipDropdown>

      {/* ── DECORATIVE: Band ── */}
      <Chip label="Band" decorative />

      {/* ── FUNCTIONAL: Sort chip-dropdown ── */}
      <ChipDropdown
        label={`Sort: ${SORT_OPTIONS.find((o) => o.value === values.sort)?.label ?? "Newest"}`}
        active={values.sort !== "newest"}
      >
        {SORT_OPTIONS.map((opt) => (
          <DropdownOption
            key={opt.value}
            label={opt.label}
            checked={values.sort === opt.value}
            onToggle={() => {
              setValue("sort", opt.value, { shouldDirty: true });
              setValue("page", 1, { shouldDirty: true });
            }}
          />
        ))}
      </ChipDropdown>

      {/* ── FUNCTIONAL: Collection chip-dropdown (only when collections exist) ── */}
      {collections.length > 0 && (
        <ChipDropdown
          label={values.collection || "Collection"}
          active={!!values.collection}
        >
          {values.collection && (
            <DropdownOption
              label="All collections"
              checked={!values.collection}
              onToggle={() =>
                setValue("collection", "", { shouldDirty: true })
              }
            />
          )}
          {collections.map((col) => (
            <DropdownOption
              key={col}
              label={col}
              checked={values.collection === col}
              onToggle={() =>
                setValue("collection", values.collection === col ? "" : col, {
                  shouldDirty: true,
                })
              }
            />
          ))}
        </ChipDropdown>
      )}

      {/* ── Clear active filters ── */}
      {hasActiveFilters && (
        <button
          type="button"
          onClick={resetFilters}
          className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-body-s font-semibold text-ink-muted transition hover:text-ink-700 hover:bg-primary-100 cursor-pointer"
        >
          <span className="material-symbols-rounded text-[14px]">close</span>
          Clear
        </button>
      )}
    </div>
  );
};
