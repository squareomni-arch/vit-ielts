/**
 * Design System Part Tag
 *
 * @figma IELTS Prediction Test — "Part Tag" node 460:738
 *
 * Part tags are used to denote exam parts (Part 1 to Part 5).
 * Each part has a specific branding color and distinctive drop shadows.
 */

import React from 'react';

export type PartTagProps = {
  part: 1 | 2 | 3 | 4 | 5;
  className?: string;
  children?: React.ReactNode; // Optional string override
};

export const PartTag = ({ part, className = '', children }: PartTagProps) => {
  const classNames = [
    'part-tag',
    `part-tag--part${part}`,
    className,
  ].filter(Boolean).join(' ');

  return (
    <span className={classNames}>
      {children || `Part ${part}`}
    </span>
  );
};
