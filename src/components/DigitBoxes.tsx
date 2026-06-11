import React, { useRef, KeyboardEvent, ClipboardEvent } from "react";

interface DigitBoxesProps {
  value: string;
  onChange: (val: string) => void;
  format: string; // e.g. "##-#######-#"
  required?: boolean;
}

export function DigitBoxes({ value, onChange, format, required }: DigitBoxesProps) {
  const digits = value.replace(/[^0-9A-Z]/gi, "");
  const numDigits = format.split("#").length - 1;
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, idx: number) => {
    if (e.key === "Backspace" && !digits[idx]) {
      e.preventDefault();
      const prev = inputRefs.current[idx - 1];
      if (prev) {
        prev.focus();
        // Remove the character at idx - 1
        const newDigits = digits.substring(0, idx - 1) + digits.substring(idx);
        onChange(newDigits);
      }
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      const prev = inputRefs.current[idx - 1];
      if (prev) prev.focus();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      const next = inputRefs.current[idx + 1];
      if (next) next.focus();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
    const char = e.target.value.replace(/[^0-9A-Z]/gi, "").slice(-1); // Only take last typed char
    if (char) {
      const newDigits = digits.substring(0, idx) + char + digits.substring(idx + 1);
      onChange(newDigits);
      const next = inputRefs.current[idx + 1];
      if (next) next.focus();
    } else {
      const newDigits = digits.substring(0, idx) + " " + digits.substring(idx + 1);
      onChange(newDigits.trim());
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/[^0-9A-Z]/gi, "").slice(0, numDigits);
    onChange(pasted);
    const focusIdx = Math.min(pasted.length, numDigits - 1);
    const next = inputRefs.current[focusIdx];
    if (next) next.focus();
  };

  const elements = [];
  let digitIndex = 0;

  for (let i = 0; i < format.length; i++) {
    if (format[i] === "#") {
      const currentIdx = digitIndex;
      elements.push(
        <input
          key={`digit-${i}`}
          ref={(el) => { inputRefs.current[currentIdx] = el; }}
          type="text"
          maxLength={2} // Allow 2 to catch rapid typing and slice(-1)
          className="w-6 sm:w-7 lg:w-8 h-8 sm:h-10 text-center border border-gray-300 rounded-md shadow-sm text-base lg:text-lg font-bold uppercase focus:border-sss-navy focus:outline-none focus:ring-1 focus:ring-sss-navy/50 flex-shrink-0"
          value={digits[currentIdx] || ""}
          onChange={(e) => handleChange(e, currentIdx)}
          onKeyDown={(e) => handleKeyDown(e, currentIdx)}
          onPaste={handlePaste}
          required={required && currentIdx === 0} // Simplest way to hook into HTML5 validation
        />
      );
      digitIndex++;
    } else {
      elements.push(
        <span key={`sep-${i}`} className="font-bold text-gray-400">
          {format[i]}
        </span>
      );
    }
  }

  // Generate the formatted visual value for a hidden input so it submits properly if needed
  let formattedValue = "";
  let dIdx = 0;
  for (let i = 0; i < format.length; i++) {
    if (format[i] === "#") {
      formattedValue += digits[dIdx] || "";
      dIdx++;
    } else {
      if (dIdx > 0 && dIdx < digits.length) formattedValue += format[i];
    }
  }

  return (
    <div className="flex flex-wrap sm:flex-nowrap items-center gap-1 overflow-x-auto scrollbar-hide pb-1">
      {elements}
    </div>
  );
}
