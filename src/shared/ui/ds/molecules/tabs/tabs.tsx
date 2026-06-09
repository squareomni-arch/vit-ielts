
/**
 * Tabs — Design System tab bar
 *
 * @figma VIT IELTS — "Controls & navigation" node 3651:161
 *
 * Active tab: Inter SemiBold, Ink/900, brand-green 3px underline bar
 * Inactive tab: Inter Medium, Ink/Muted, transparent bar
 */

import { twMerge } from 'tailwind-merge';

export type TabItem = {
  id: string;
  label: string;
};

export type TabsProps = {
  tabs: TabItem[];
  activeId: string;
  onChange?: (id: string) => void;
  className?: string;
};

export const Tabs = ({ tabs, activeId, onChange, className }: TabsProps) => (
  <div
    className={twMerge(
      'inline-flex gap-2 items-start bg-white rounded-[14px] pt-[6px] px-[18px]',
      className,
    )}
  >
    {tabs.map(tab => {
      const active = tab.id === activeId;
      return (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange?.(tab.id)}
          className="flex flex-col gap-3 items-center pt-3 px-[10px] cursor-pointer"
        >
          <span
            className={twMerge(
              'text-[14px] leading-[20px] whitespace-nowrap font-inter',
              active ? 'font-semibold text-[#191d24]' : 'font-medium text-[#6a7282]',
            )}
          >
            {tab.label}
          </span>
          <span
            className={twMerge(
              'h-[3px] w-full rounded-full block',
              active ? 'bg-[#b3e653]' : 'bg-transparent',
            )}
          />
        </button>
      );
    })}
  </div>
);
