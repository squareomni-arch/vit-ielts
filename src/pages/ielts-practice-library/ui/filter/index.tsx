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

const panelClassName =
  "rounded-[26px] border border-white/10 bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.16)]";

const OptionButton = ({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${
        active
          ? "border-primary bg-primary text-white shadow-[0_10px_24px_rgba(217,74,86,0.24)]"
          : "border-black/10 bg-black/[0.03] text-[var(--color-default)] hover:border-primary/40 hover:bg-primary/5"
      }`}
    >
      {children}
    </button>
  );
};

const FilterSection = ({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) => {
  return (
    <section className={panelClassName}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="font-[var(--font-noto-sans)] text-base font-extrabold text-[var(--color-default)]">
          {title}
        </h3>
      </div>
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
    onClose?.();
  };

  const resetFilters = () => {
    reset(DEFAULT_VALUES);
    onClose?.();
  };

  const updateSingleValue = (
    key: "source" | "part" | "progress",
    value: string | FilterFormValues["progress"]
  ) => {
    setValue(key, value as never, { shouldDirty: true });
    setValue("page", 1, { shouldDirty: true });
  };

  return (
    <div className={`space-y-4 ${mobile ? "pb-24" : ""}`}>
      <FilterSection title="Search">
        <div className="space-y-3">
          <div className="flex items-center gap-3 rounded-2xl border border-black/10 bg-black/[0.03] px-4 py-3">
            <span className="material-symbols-rounded text-black/35">search</span>
            <input
              value={searchDraft}
              onChange={(event) => setSearchDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  applySearch();
                }
              }}
              placeholder="Search test name"
              className="w-full bg-transparent text-sm font-medium text-[var(--color-default)] outline-none placeholder:text-black/30"
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={applySearch}
              className="inline-flex flex-1 items-center justify-center rounded-full bg-primary px-4 py-3 text-sm font-bold text-white transition hover:bg-primary-600"
            >
              Apply Search
            </button>
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center justify-center rounded-full border border-black/10 px-4 py-3 text-sm font-bold text-[var(--color-default)] transition hover:border-primary/30 hover:text-primary"
            >
              Reset
            </button>
          </div>
        </div>
      </FilterSection>

      {filterData.sources.length > 0 && (
        <FilterSection title="Source">
          <div className="space-y-3">
            {filterData.sources.map((source) => (
              <OptionButton
                key={source}
                active={values.source === source}
                onClick={() => updateSingleValue("source", values.source === source ? "" : source)}
              >
                {source}
              </OptionButton>
            ))}
          </div>
        </FilterSection>
      )}

      <FilterSection title={skill === "reading" ? "Reading Passage" : "Listening Part"}>
        <div className="space-y-3">
          {FILTER_CONFIGS[skill].map((item) => (
            <OptionButton
              key={item.slug}
              active={values.part === item.slug}
              onClick={() => updateSingleValue("part", values.part === item.slug ? "" : item.slug)}
            >
              {item.name}
            </OptionButton>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Status">
        <div className="space-y-3">
          {FILTER_CONFIGS.status.map((item) => (
            <OptionButton
              key={item.value}
              active={values.progress === item.value}
              onClick={() =>
                updateSingleValue(
                  "progress",
                  values.progress === item.value ? ("" as FilterFormValues["progress"]) : item.value
                )
              }
            >
              {item.label}
            </OptionButton>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Question Form">
        <div className="flex flex-wrap gap-3">
          {QUESTION_FORMS.map((item) => {
            const isActive = (values.question_form || []).includes(item.value);
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => toggleQuestionForm(item.value)}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  isActive
                    ? "border-primary bg-primary text-white shadow-[0_10px_24px_rgba(217,74,86,0.24)]"
                    : "border-black/10 bg-black/[0.03] text-[var(--color-default)] hover:border-primary/40 hover:bg-primary/5"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </FilterSection>
    </div>
  );
};
