
/**
 * Stepper — Multi-step progress indicator
 *
 * @figma VIT IELTS — "Controls & navigation" node 3651:161
 *
 * done    circle: bg-[#b3e653] + check icon | connector: bg-[#b3e653]
 * active  circle: white border-3 border-[#b3e653], brand number | connector: bg-[#474d57]
 * pending circle: bg-[#383d47], muted number | connector: bg-[#474d57]
 */

import { twMerge } from 'tailwind-merge';

export type StepStatus = 'done' | 'active' | 'pending';

export type StepperStep = {
  id: string;
  label: string;
  status: StepStatus;
};

export type StepperProps = {
  steps: StepperStep[];
  className?: string;
};

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="M7.25 17.55L12.88 23.18L25.75 10.32" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export const Stepper = ({ steps, className }: StepperProps) => (
  <div className={twMerge('flex items-center', className)}>
    {steps.map((step, i) => (
      <div key={step.id} className="flex items-center">
        {/* Step node */}
        <div className="flex flex-col gap-2 items-center">
          {/* Circle */}
          <div
            className={twMerge(
              'flex items-center justify-center rounded-full shrink-0 w-[34px] h-[34px]',
              step.status === 'done'    && 'bg-[#b3e653] text-[#191d24]',
              step.status === 'active'  && 'bg-white border-[3px] border-[#b3e653]',
              step.status === 'pending' && 'bg-[#383d47]',
            )}
          >
            {step.status === 'done' ? (
              <CheckIcon />
            ) : (
              <span
                className={twMerge(
                  'text-[14px] font-bold font-inter leading-[20px]',
                  step.status === 'active'  && 'text-[#b3e653]',
                  step.status === 'pending' && 'text-[#99a1ad]',
                )}
              >
                {i + 1}
              </span>
            )}
          </div>
          {/* Label */}
          <span
            className={twMerge(
              'text-[13px] font-inter leading-[18px] whitespace-nowrap',
              step.status === 'pending'
                ? 'font-medium text-[#6a7282]'
                : 'font-semibold text-white',
            )}
          >
            {step.label}
          </span>
        </div>

        {/* Connector line (not after last step) */}
        {i < steps.length - 1 && (
          <div
            className={twMerge(
              'w-[60px] h-[3px] mb-[26px] shrink-0',
              step.status === 'done' ? 'bg-[#b3e653]' : 'bg-[#474d57]',
            )}
          />
        )}
      </div>
    ))}
  </div>
);
