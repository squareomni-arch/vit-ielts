import { SKILL_ORDER, SKILL_META } from "./skills";

export type SkillFilter = "all" | (typeof SKILL_ORDER)[number];

interface BlogSidebarProps {
  search: string;
  onSearchChange: (value: string) => void;
  skill: SkillFilter;
  onSkillChange: (skill: SkillFilter) => void;
  keywords: string[];
  selectedKeywords: string[];
  onToggleKeyword: (keyword: string) => void;
  onClear: () => void;
}

const Card = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="rounded-2xl bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
    <h3 className="mb-4 text-[18px] font-bold text-[#1F2430]">{title}</h3>
    {children}
  </div>
);

export const BlogSidebar = ({
  search,
  onSearchChange,
  skill,
  onSkillChange,
  keywords,
  selectedKeywords,
  onToggleKeyword,
  onClear,
}: BlogSidebarProps) => {
  const skillOptions: { value: SkillFilter; label: string }[] = [
    { value: "all", label: "All" },
    ...SKILL_ORDER.map((s) => ({ value: s as SkillFilter, label: SKILL_META[s].label })),
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Search */}
      <Card title="Search">
        <div className="flex items-stretch overflow-hidden rounded-xl border border-[#E5E7EB]">
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search articles..."
            className="min-w-0 flex-1 px-4 py-2.5 text-[14px] text-[#374151] outline-none placeholder:text-[#9CA3AF]"
          />
          <span className="flex items-center justify-center bg-primary-500 px-4 text-white">
            <span className="material-symbols-rounded text-[20px]">search</span>
          </span>
        </div>
      </Card>

      {/* Skills */}
      <Card title="Skills">
        <div className="flex flex-col gap-3">
          {skillOptions.map((opt) => {
            const checked = skill === opt.value;
            return (
              <label key={opt.value} className="flex cursor-pointer items-center gap-3">
                <span
                  className={`flex h-[18px] w-[18px] items-center justify-center rounded-full border-2 transition-colors ${
                    checked ? "border-primary-500" : "border-[#E5A9AE]"
                  }`}
                >
                  {checked && <span className="h-2.5 w-2.5 rounded-full bg-primary-500" />}
                </span>
                <input
                  type="radio"
                  name="skill-filter"
                  className="sr-only"
                  checked={checked}
                  onChange={() => onSkillChange(opt.value)}
                />
                <span className={`text-[15px] ${checked ? "font-semibold text-primary-500" : "text-[#374151]"}`}>
                  {opt.label}
                </span>
              </label>
            );
          })}
        </div>
      </Card>

      {/* Popular Keywords */}
      {keywords.length > 0 && (
        <Card title="Popular Keywords">
          <div className="flex flex-col gap-3">
            {keywords.map((kw) => {
              const checked = selectedKeywords.includes(kw);
              return (
                <label key={kw} className="flex cursor-pointer items-center gap-3">
                  <span
                    className={`flex h-[18px] w-[18px] items-center justify-center rounded-[5px] border-2 transition-colors ${
                      checked ? "border-primary-500 bg-primary-500" : "border-[#E5A9AE]"
                    }`}
                  >
                    {checked && (
                      <span className="material-symbols-rounded text-[14px] text-white">check</span>
                    )}
                  </span>
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={checked}
                    onChange={() => onToggleKeyword(kw)}
                  />
                  <span className={`text-[15px] ${checked ? "font-semibold text-primary-500" : "text-[#374151]"}`}>
                    {kw}
                  </span>
                </label>
              );
            })}
          </div>
        </Card>
      )}

      {/* Clear */}
      <button
        type="button"
        onClick={onClear}
        className="rounded-2xl bg-white py-4 text-[14px] font-bold uppercase tracking-wide text-[#374151] shadow-[0_4px_20px_rgba(0,0,0,0.05)] transition hover:bg-gray-50"
      >
        Clear All Filters
      </button>
    </div>
  );
};
