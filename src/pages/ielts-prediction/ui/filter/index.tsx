import { ReactNode, useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import type { FilterFormValues } from "..";

type FilterProps = {
  mobile?: boolean;
  onClose?: () => void;
};

const DEFAULT_VALUES: FilterFormValues = {
  sort: "newest",
  search: "",
  page: 1,
  size: 9,
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
      className="bg-white rounded-[32px] px-[16px] py-[25px]"
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

export const Filter = ({ mobile = false, onClose }: FilterProps) => {
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

      {/* Show reset button when there are active filters */}
      {values.search && (
        <div className="pt-2">
          <button
            type="button"
            onClick={resetFilters}
            className="w-full rounded-[32px] bg-white py-3 text-[14px] font-bold text-[#2D3142] cursor-pointer transition hover:bg-gray-50 border border-[rgba(0,0,0,0.06)]"
            style={{
              boxShadow:
                "0 4px 8px -2px rgba(16, 24, 40, 0.10), 0 2px 4px -2px rgba(16, 24, 40, 0.06)",
            }}
          >
            Clear search
          </button>
        </div>
      )}
    </div>
  );
};

