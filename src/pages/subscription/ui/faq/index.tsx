"use client";

import { useState } from "react";
import { Container } from "@/shared/ui";
import { twMerge } from "tailwind-merge";
import type { FAQConfig } from "./types";

interface FAQProps {
  config: FAQConfig;
}

export const FAQ = ({ config }: FAQProps) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section
      data-section="subscription-faq"
      className="bg-[#f6f7f4] py-[80px]"
    >
      <Container>
        <div className="max-w-[1360px] mx-auto flex flex-col gap-[48px]">
          {/* Header */}
          <div className="flex flex-col gap-[12px] items-center text-center">
            {config.badge?.text && (
              <p className="text-[#9ad534] text-[15px] font-semibold font-inter leading-normal">
                {config.badge.text}
              </p>
            )}
            <h2 className="font-display font-bold text-[40px] leading-[1.08] tracking-[-0.8px] text-[#191d24] text-center">
              {config.title}
            </h2>
            {config.description && (
              <p className="text-[#6a7282] text-[17px] font-normal font-inter leading-normal text-center">
                {config.description}
              </p>
            )}
          </div>

          {/* FAQ items */}
          <div className="flex flex-col gap-[8px]">
            {config.items.map((item, index) => {
              const isOpen = openIndex === index;
              return (
                <div
                  key={index}
                  className={twMerge(
                    "bg-[#fff] border border-[rgba(25,29,36,0.1)] rounded-[16px] overflow-hidden transition-shadow",
                    isOpen && "shadow-[0px_6px_18px_0px_rgba(0,0,0,0.05)]",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => toggleItem(index)}
                    className="w-full px-[28px] py-[20px] flex items-center justify-between text-left gap-[16px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b3e653] focus-visible:ring-inset rounded-[16px]"
                    aria-expanded={isOpen}
                  >
                    <span className="text-[#191d24] text-[15px] font-semibold font-inter leading-[1.4] flex-1">
                      {item.question}
                    </span>
                    <span
                      className={twMerge(
                        "shrink-0 w-[24px] h-[24px] flex items-center justify-center rounded-full border border-[rgba(25,29,36,0.1)] text-[#6a7282] transition-transform duration-200 text-[18px] font-light",
                        isOpen && "rotate-45",
                      )}
                      aria-hidden
                    >
                      +
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-[28px] pb-[20px] border-t border-[rgba(25,29,36,0.06)]">
                      <p className="text-[#6a7282] text-[14px] font-normal font-inter leading-[1.6] pt-[16px]">
                        {item.answer}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </Container>
    </section>
  );
};
