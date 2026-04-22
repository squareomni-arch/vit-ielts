import React, { useState } from 'react';
import { Button } from '@/shared/ui/ds';
import { twMerge } from 'tailwind-merge';
import parse from 'html-react-parser';
import { TextSelectionWrapper } from '@/shared/ui/text-selection';

interface QuestionExplanationProps {
  content: string;
  label?: string;
  className?: string;
}

export const QuestionExplanation = ({
  content,
  label = 'Explanation',
  className
}: QuestionExplanationProps) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!content) return null;

  return (
    <div data-question-explanation="true" className={twMerge("mt-4", className)}>
      <Button
        variant="primary"
        size="sm"
        leftIcon={<span className="material-symbols-rounded !text-[18px]">lightbulb</span>}
        rightIcon={
          <span className={twMerge(
            "material-symbols-rounded transition-transform duration-300 !text-[20px]",
            isOpen ? "rotate-180" : ""
          )}>
            expand_more
          </span>
        }
        onClick={() => setIsOpen(!isOpen)}
        className="rounded-lg px-4 min-h-[36px] shadow-sm hover:shadow-md transition-all sm:w-fit"
      >
        {label}
      </Button>
      
      {isOpen && (
        <div className="mt-2 p-4 bg-[#FAF7EB] rounded-lg border border-[#F2C94C]/20 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="prose prose-sm max-w-none text-[#2D3142]">
            <TextSelectionWrapper>
              {parse(content)}
            </TextSelectionWrapper>
          </div>
        </div>
      )}
    </div>
  );
};
