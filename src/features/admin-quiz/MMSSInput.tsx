import { Input } from "antd";
import { useEffect, useState } from "react";

/**
 * Audio timestamp input that accepts both pure-seconds ("90") and MM:SS
 * ("1:30") formats. Stores the value as integer seconds — matching the
 * `passages.audio_start` / `passages.audio_end` integer columns — so the
 * DB unit doesn't change.
 */

const formatMMSS = (totalSec: number | null | undefined): string => {
  if (totalSec === null || totalSec === undefined) return "";
  const n = Number(totalSec);
  if (!Number.isFinite(n)) return "";
  const sec = Math.max(0, Math.floor(n));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

const parseMMSS = (input: string): number | undefined => {
  const trimmed = input.trim();
  if (!trimmed) return undefined;
  if (trimmed.includes(":")) {
    const [mPart, sPart = "0"] = trimmed.split(":");
    const minutes = parseInt(mPart, 10);
    const seconds = parseInt(sPart, 10);
    if (Number.isNaN(minutes) || Number.isNaN(seconds)) return undefined;
    return Math.max(0, minutes) * 60 + Math.max(0, Math.min(59, seconds));
  }
  const n = parseInt(trimmed, 10);
  return Number.isNaN(n) ? undefined : Math.max(0, n);
};

type MMSSInputProps = {
  value?: number | null;
  onChange?: (v: number | undefined) => void;
  placeholder?: string;
  className?: string;
};

export default function MMSSInput({
  value,
  onChange,
  placeholder = "0:00",
  className,
}: MMSSInputProps) {
  const [text, setText] = useState(formatMMSS(value));

  // Re-sync local text when the form's value changes externally (e.g. a
  // different passage is loaded into the modal).
  useEffect(() => {
    setText(formatMMSS(value));
  }, [value]);

  const commit = () => {
    const parsed = parseMMSS(text);
    onChange?.(parsed);
    setText(formatMMSS(parsed));
  };

  return (
    <Input
      value={text}
      placeholder={placeholder}
      className={className}
      onChange={(e) => setText(e.target.value)}
      onBlur={commit}
      onPressEnter={commit}
    />
  );
}
