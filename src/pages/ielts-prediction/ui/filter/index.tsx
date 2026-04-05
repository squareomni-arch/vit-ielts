import { ReactNode, useEffect, useMemo, useState } from "react";
import { useFormContext } from "react-hook-form";
import { useRouter } from "next/router";
import { QUESTION_FORMS } from "@/shared/constants";
import type { FilterFormValues } from "..";

type FilterProps = {
  filterData: {
    years: Array<string>;
    sources: Array<string>;
    parts: Array<string>;
  };
  mobile?: boolean;
  onClose?: () => void;
};

const FILTER_CONFIGS = {
  listening: [
    { slug: "0", name: "Part 1" },
    { slug: "1", name: "Part 2" },
    { slug: "2", name: "Part 3" },
    { slug: "3", name: "Part 4" },
  ],
  reading: [
    { slug: "0", name: "Passage 1" },
    { slug: "1", name: "Passage 2" },
    { slug: "2", name: "Passage 3" },
  ],
  status: [
    { value: "pending", label: "Pending" },
    { value: "in-progress", label: "In Progress" },
    { value: "completed", label: "Completed" },
  ],
} as const;

const DEFAULT_VALUES: FilterFormValues = {
  progress: "" as FilterFormValues["progress"],
  question_form: [],
  sort: "newest",
  search: "",
  page: 1,
  size: 9,
  quarter: "",
  year: "",
  source: "",
  part: "",
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

export const Filter = ({ filterData, mobile = false, onClose }: FilterProps) => {
  const router = useRouter();
  const { watch, setValue, reset } = useFormContext<FilterFormValues>();
  const values = watch();
  const skill = useMemo(() => {
    const routeSkill = router.pathname.split("/").pop();
    return routeSkill === "listening" ? "listening" : "reading";
  }, [router.pathname]);

  const [searchDraft, setSearchDraft] = useState(values.search ?? "");

  useEffect(() => {
    setSearchDraft(values.search ?? "");
  }, [values.search]);

  const toggleQuestionForm = (value: string) => {
    const current = values.question_form || [];
    const next = current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value];
    setValue("question_form", next, { shouldDirty: true });
    setValue("page", 1, { shouldDirty: true });
  };

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

  const updateSingleValue = (
    key: "source" | "part" | "progress",
    value: string | FilterFormValues["progress"]
  ) => {
    setValue(key, value as never, { shouldDirty: true });
    setValue("page", 1, { shouldDirty: true });
  };

  return (
    <div className={`flex flex-col gap-[24px] ${mobile ? "pb-24 pt-4 px-2" : ""}`}>
      <FilterSection title="Search" gap="23px">
        <div className="relative flex items-center h-[40px] w-full rounded-full border border-[rgba(0,0,0,0.15)] overflow-hidden bg-white focus-within:border-primary-400 focus-within:ring-1 focus-within:ring-primary-100 transition-shadow">
          <input
            value={searchDraft}
            onChange={(event) => setSearchDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
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

      {filterData.sources.length > 0 && (
        <FilterSection title="Nguồn tài liệu">
          <div className="flex flex-col gap-[18px]">
            {filterData.sources.map((source) => (
              <FilterCheckbox
                key={source}
                checked={values.source === source}
                label={source}
                onChange={() =>
                  updateSingleValue("source", values.source === source ? "" : source)
                }
              />
            ))}
          </div>
        </FilterSection>
      )}

      <FilterSection title="Phần">
        <div className="flex flex-col gap-[18px]">
          {FILTER_CONFIGS[skill].map((item) => (
            <FilterCheckbox
              key={item.slug}
              checked={values.part === item.slug}
              label={item.name}
              onChange={() =>
                updateSingleValue("part", values.part === item.slug ? "" : item.slug)
              }
            />
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Loại câu hỏi">
        <div className="flex flex-col gap-[18px]">
          {QUESTION_FORMS.map((item) => (
            <FilterCheckbox
              key={item.value}
              checked={(values.question_form || []).includes(item.value)}
              label={item.label}
              onChange={() => toggleQuestionForm(item.value)}
            />
          ))}
        </div>
      </FilterSection>

      {/* Show reset button when there are active filters */}
      {(values.search ||
        values.source ||
        values.part ||
        (values.question_form && values.question_form.length > 0)) && (
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
