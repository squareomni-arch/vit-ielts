
/**
 * ScoreRing — circular band-score badge
 *
 * @figma Vit IELTS — node 3035:244 (Default) / 3035:246 (Muted)
 * @variants default | muted
 */

import { twMerge } from 'tailwind-merge';

export type ScoreRingState = 'default' | 'muted';

export type ScoreRingProps = {
  band?: string | number;
  state?: ScoreRingState;
  className?: string;
};

export const ScoreRing = ({
  band = '8.5',
  state = 'default',
  className = '',
}: ScoreRingProps) => {
  const isMuted = state === 'muted';

  return (
    <div
      className={twMerge(
        'inline-flex items-center justify-center rounded-full bg-white',
        'w-[58px] h-[58px] border-[2.5px]',
        isMuted ? 'border-[#9ca3af]' : 'border-[#b3e653]',
        className,
      )}
    >
      <span
        className={twMerge(
          'font-display font-bold text-[19px] leading-[1.3]',
          isMuted ? 'text-[#9ca3af]' : 'text-[#191d24]',
        )}
      >
        {band}
      </span>
    </div>
  );
};
