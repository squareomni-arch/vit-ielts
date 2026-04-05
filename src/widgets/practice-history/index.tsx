import {
  IELTSListeningExamIcon,
  IELTSReadingExamIcon,
} from "@/shared/ui/icons";
import { useState } from "react";
import { QuizListing } from "./ui";
import { twMerge } from "tailwind-merge";

// === Figma: Practice History section ===
// Geometric: full-width white card, radius 12px
// Tabs: "Reading Practices" (active: red underline + red text), "Listening Practices"
// Table: columns Quiz, Taken on, Time Taken, Questions, Correct, Incorrect, Missed, Result, (View btn)

const TABS = [
  {
    key: "reading" as const,
    label: "Reading Practices",
    icon: IELTSReadingExamIcon,
  },
  {
    key: "listening" as const,
    label: "Listening Practices",
    icon: IELTSListeningExamIcon,
  },
];

export const PracticeHistory = () => {
  const [activeKey, setActiveKey] = useState<"reading" | "listening">(
    "reading"
  );

  return (
    <div
      className="bg-white rounded-xl overflow-hidden"
      style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
      data-section="practice-history"
    >
      {/* === Tab Header === */}
      <div className="border-b border-gray-100 px-5">
        <nav className="flex gap-0" role="tablist" aria-label="Practice history tabs">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeKey === tab.key;
            return (
              <button
                key={tab.key}
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveKey(tab.key)}
                className={twMerge(
                  "flex items-center gap-2 px-1 py-4 mr-6 text-sm font-medium transition-colors duration-150 border-b-2 -mb-px",
                  isActive
                    ? "text-primary-500 border-primary-500"
                    : "text-gray-500 border-transparent hover:text-gray-700"
                )}
              >
                <Icon
                  width={16}
                  height={16}
                  className="inline-flex flex-shrink-0"
                />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* === Table Content === */}
      <div className="p-4 overflow-x-auto">
        <QuizListing skill={activeKey} />
      </div>
    </div>
  );
};
