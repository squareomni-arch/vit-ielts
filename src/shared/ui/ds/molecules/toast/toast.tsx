
/**
 * Toast — Design System Notification Toast
 *
 * @figma VIT IELTS — "Toasts & notifications" node 3596:170
 *
 * Variants (Figma-canonical):
 *   success  — #169B86 teal chip, checkmark icon, action link
 *   error    — #E54552 red chip, X icon, action link
 *   warning  — #FC945A orange chip, warning triangle, no action
 *   info     — #5281F9 blue chip, bell icon, action link
 *   loading  — #7C6EF9 violet chip, timer icon, no action
 */

import { twMerge } from 'tailwind-merge';

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading';

export type ToastProps = {
  type?: ToastType;
  title?: string;
  message?: string;
  /** CTA label — pass empty string to force-hide even when type has a default */
  actionLabel?: string;
  onAction?: () => void;
  onClose?: () => void;
  className?: string;
};

const ICON_SRC: Record<ToastType, string> = {
  success: '/assets/icons/Check.svg',
  error:   '/assets/icons/X.svg',
  warning: '/assets/icons/Warning.svg',
  info:    '/assets/icons/Bell.svg',
  loading: '/assets/icons/Timer.svg',
};

const CHIP_BG: Record<ToastType, string> = {
  success: 'bg-[#169b86]',
  error:   'bg-[#e54552]',
  warning: 'bg-[#fc945a]',
  info:    'bg-[#5281f9]',
  loading: 'bg-[#7c6ef9]',
};

const ACTION_COLOR: Record<ToastType, string | null> = {
  success: 'text-[#169b86]',
  error:   'text-[#e54552]',
  warning: null,
  info:    'text-[#5281f9]',
  loading: null,
};

const DEFAULTS: Record<ToastType, { title: string; message: string; action: string | null }> = {
  success: {
    title:   'Test submitted',
    message: 'Your answers are saved. Results are ready to view.',
    action:  'View results',
  },
  error: {
    title:   'Submission failed',
    message: "We couldn't submit your test. Check your connection.",
    action:  'Retry',
  },
  warning: {
    title:   '5 minutes remaining',
    message: 'Your test will auto-submit when the timer ends.',
    action:  null,
  },
  info: {
    title:   'New mock tests available',
    message: '3 new Academic Reading tests were added this week.',
    action:  'Browse tests',
  },
  loading: {
    title:   'Saving your progress…',
    message: 'Hang tight while we upload your recording.',
    action:  null,
  },
};

function XIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 4L12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export const Toast = ({
  type = 'success',
  title,
  message,
  actionLabel,
  onAction,
  onClose,
  className,
}: ToastProps) => {
  const def = DEFAULTS[type];
  const resolvedTitle   = title   ?? def.title;
  const resolvedMessage = message ?? def.message;
  const resolvedAction  = actionLabel !== undefined ? actionLabel : def.action;

  return (
    <div
      role="alert"
      className={twMerge(
        'flex items-start gap-3 p-4 bg-white rounded-2xl',
        'border border-black/10',
        'shadow-[0px_8px_12px_rgba(15,23,41,0.10)]',
        'w-[384px]',
        className,
      )}
    >
      {/* Colored icon chip */}
      <div
        className={twMerge(
          'flex items-center justify-center shrink-0 w-[38px] h-[38px] rounded-[11px] overflow-hidden',
          CHIP_BG[type],
        )}
      >
        <img src={ICON_SRC[type]} alt="" className="w-[22px] h-[22px]" aria-hidden="true" />
      </div>

      {/* Text + action */}
      <div className="flex flex-col gap-[3px] flex-1 min-w-0">
        <p className="text-[14px] font-semibold font-inter text-[#191d24] leading-[19px]">
          {resolvedTitle}
        </p>
        <p className="text-[13px] font-inter text-[#6a7282] leading-[18px]">
          {resolvedMessage}
        </p>
        {resolvedAction && (
          <div className="pt-[5px]">
            <button
              type="button"
              onClick={onAction}
              className={twMerge(
                'text-[13px] font-semibold font-inter leading-[18px] whitespace-nowrap hover:underline',
                ACTION_COLOR[type] ?? 'text-[#6a7282]',
              )}
            >
              {resolvedAction}
            </button>
          </div>
        )}
      </div>

      {/* Dismiss */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Dismiss"
        className="shrink-0 w-5 h-5 flex items-center justify-center text-[#9aa0ad] hover:text-[#191d24] transition-colors duration-150"
      >
        <XIcon />
      </button>
    </div>
  );
};
