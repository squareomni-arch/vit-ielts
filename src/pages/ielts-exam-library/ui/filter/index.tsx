import { ReactNode, useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import type { FilterFormValues } from "..";

const DEFAULT_VALUES: FilterFormValues = {
  type: "all",
  skill: "all",
  collection: "",
  sort: "newest",
  search: "",
  page: 1,
  size: 9,
};

const FilterCheckbox = ({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: () => void;
}) => {
  return (
    <label className="flex items-center gap-[12px] cursor-pointer group">
      <div
        className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[4px] border transition-colors ${
          checked
            ? "border-primary-500 bg-primary-500 text-white"
            : "border-black/20 bg-white text-transparent group-hover:border-primary-400"
        }`}
      >
        <span className="material-symbols-rounded text-[14px]">check</span>
      </div>
      <span className="text-[14px] text-[#2D3142] selection:bg-transparent">{label}</span>
      <input type="checkbox" checked={checked} onChange={onChange} className="hidden" />
    </label>
  );
};

const FilterSection = ({
  title,
  children,
  gap = "18px",
}: {
  title: string;
  children: ReactNode;
  gap?: string;
}) => {
  return (
    <section
      className="bg-white rounded-[32px] p-[16px]"
      style={{
        boxShadow:
          "0 4px 8px -2px rgba(16, 24, 40, 0.10), 0 2px 4px -2px rgba(16, 24, 40, 0.06)",
      }}
    >
      <h3
        className="font-[var(--font-noto-sans)] font-bold text-[#2D3142] text-[16px] leading-[1.2]"
        style={{ marginBottom: gap }}
      >
        {title}
      </h3>
      {children}
    </section>
  );
};

const TYPE_OPTIONS = [
  { value: "academic", label: "Academic" },
  { value: "general", label: "General" },
] as const;

const SKILL_OPTIONS = [
  { value: "reading", label: "Reading" },
  { value: "listening", label: "Listening" },
] as const;

type FilterProps = {
  mobile?: boolean;
  collections?: string[];
  onClose?: () => void;
};

export const Filter = ({ mobile = false, collections = [], onClose }: FilterProps) => {
  const { watch, setValue } = useFormContext<FilterFormValues>();
  const values = watch();

  const [searchDraft, setSearchDraft] = useState(values.search ?? "");

  useEffect(() => {
    setSearchDraft(values.search ?? "");
  }, [values.search]);

  const applySearch = () => {
    setValue("search", searchDraft.trim(), { shouldDirty: true });
    setValue("page", 1, { shouldDirty: true });
    if (mobile) onClose?.();
  };

  const resetFilters = () => {
    Object.keys(DEFAULT_VALUES).forEach((key) => {
      setValue(
        key as keyof FilterFormValues,
        DEFAULT_VALUES[key as keyof FilterFormValues],
        { shouldDirty: true }
      );
    });
    if (mobile) onClose?.();
  };

  const hasActiveFilters =
    !!values.search ||
    (values.type && values.type !== "all") ||
    (values.skill && values.skill !== "all") ||
    !!values.collection;

  return (
    <div className={`flex flex-col gap-[24px] ${mobile ? "pb-24 pt-4 px-2" : ""}`}>
      {/* Search */}
      <FilterSection title="Search" gap="23px">
        <div className="relative flex items-center h-[40px] w-full rounded-full border border-[rgba(0,0,0,0.15)] overflow-hidden bg-white focus-within:border-primary-400 focus-within:ring-1 focus-within:ring-primary-100 transition-shadow">
          <input
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                applySearch();
              }
            }}
            placeholder="Search"
            className="flex-1 w-full h-full bg-transparent px-[16px] text-[14px] text-[#2D3142] outline-none placeholder:text-black/30"
          />
          <button
            type="button"
            onClick={applySearch}
            className="flex h-full w-[44px] items-center justify-center bg-[#D94A56] text-white transition hover:bg-[#D94A56]/90"
          >
            <span className="material-symbols-rounded text-[20px]">search</span>
          </button>
        </div>
      </FilterSection>

      {/* Loại bài */}
      <FilterSection title="Loại bài">
        <div className="flex flex-col gap-[18px]">
          {TYPE_OPTIONS.map((opt) => (
            <FilterCheckbox
              key={opt.value}
              checked={values.type === opt.value}
              label={opt.label}
              onChange={() =>
                setValue("type", values.type === opt.value ? "all" : opt.value, {
                  shouldDirty: true,
                })
              }
            />
          ))}
        </div>
      </FilterSection>

      {/* Kỹ năng */}
      <FilterSection title="Kỹ năng">
        <div className="flex flex-col gap-[18px]">
          {SKILL_OPTIONS.map((opt) => (
            <FilterCheckbox
              key={opt.value}
              checked={values.skill === opt.value}
              label={opt.label}
              onChange={() =>
                setValue("skill", values.skill === opt.value ? "all" : opt.value, {
                  shouldDirty: true,
                })
              }
            />
          ))}
        </div>
      </FilterSection>

      {/* Bộ đề (Collection) — only shown when collections available */}
      {collections.length > 0 && (
        <FilterSection title="Bộ đề">
          <div className="flex flex-col gap-[18px]">
            {collections.map((col) => (
              <FilterCheckbox
                key={col}
                checked={values.collection === col}
                label={col}
                onChange={() =>
                  setValue("collection", values.collection === col ? "" : col, {
                    shouldDirty: true,
                  })
                }
              />
            ))}
          </div>
        </FilterSection>
      )}

      {/* Clear all filters */}
      {hasActiveFilters && (
        <div className="pt-2">
          <button
            type="button"
            onClick={resetFilters}
            className="w-full rounded-[32px] bg-white py-3 text-[14px] font-bold text-[#2D3142] transition hover:bg-gray-50 border border-[rgba(0,0,0,0.06)]"
            style={{
              boxShadow:
                "0 4px 8px -2px rgba(16, 24, 40, 0.10), 0 2px 4px -2px rgba(16, 24, 40, 0.06)",
            }}
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
};
