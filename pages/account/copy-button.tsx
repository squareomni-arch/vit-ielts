"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

interface CopyButtonProps {
  text: string;
}

export default function CopyButton({ text = "" }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  // Return early or handle empty text if it is prerendered as a page without props.
  if (!text) {
    return null;
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="group relative w-full max-w-[280px] bg-primary-500 hover:bg-primary-300 text-white font-bold py-3 px-6 rounded-full transition-colors flex items-center justify-center gap-3"
    >
      {copied ? (
        <>
          <Check className="w-5 h-5 flex-shrink-0" />
          <span>Đã sao chép!</span>
        </>
      ) : (
        <>
          <Copy className="w-5 h-5 flex-shrink-0" />
          <div className="flex flex-col items-center">
            {/* The string format typically is "IELTS PREDICTION 123456" */}
            <span className="text-[10px] uppercase font-bold leading-tight">
              {text.includes(" ") ? text.substring(0, text.lastIndexOf(" ")) : "IELTS PREDICTION"}
            </span>
            <span className="text-base font-black tracking-wider leading-tight">
              {text.includes(" ") ? text.substring(text.lastIndexOf(" ") + 1) : text}
            </span>
          </div>
        </>
      )}
    </button>
  );
}

