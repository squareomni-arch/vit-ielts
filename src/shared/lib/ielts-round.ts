/**
 * IELTS Score Rounding Logic
 * 
 * Rules:
 * - If decimal < 0.25: round down to .0
 * - If 0.25 <= decimal < 0.75: round to .5
 * - If decimal >= 0.75: round up to next integer
 * 
 * This effectively implements the requirement:
 * "Nếu điểm chênh 0.25 trở lên sẽ được làm tròn +0.5"
 * "0.125 sẽ không làm tròn lên mà làm tròn xuống"
 * 
 * Examples:
 * 5.125 -> 5.0
 * 5.25  -> 5.5
 * 5.5   -> 5.5
 * 5.675 -> 5.5
 * 5.75  -> 6.0
 */
export const roundIELTSScore = (score: number): number => {
  const base = Math.floor(score);
  const decimal = score - base;

  if (decimal < 0.25) {
    return base;
  }
  if (decimal < 0.75) {
    return base + 0.5;
  }
  return base + 1.0;
};
