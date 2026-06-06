import React from "react";
import { DigitBoxes } from "./DigitBoxes";

export function ClearableInput({ value, onChange, className, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { value: string, onChange: (val: string) => void }) {
  return (
    <div className="relative flex items-center w-full">
      <input
        {...props}
        className={`${className} w-full pr-8`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value.length > 0 && (
        <button
          type="button"
          tabIndex={-1}
          onClick={() => onChange("")}
          className="absolute right-2 text-blue-500 hover:text-blue-700 bg-white rounded-full p-0.5 focus:outline-none"
          title="Clear"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        </button>
      )}
    </div>
  );
}

interface SplitNameProps {
  value: string;
  onChange: (val: string) => void;
  required?: boolean;
}

export function SplitName({ value, onChange, required }: SplitNameProps) {
  const parts = value.split(",").map((s) => s.trim());
  const last = parts[0] || "";
  const first = parts[1] || "";
  const middle = parts[2] || "";
  const suffix = parts.slice(3).join(", ") || "";

  const handleChange = (field: "last" | "first" | "middle" | "suffix", val: string) => {
    const newLast = field === "last" ? val : last;
    const newFirst = field === "first" ? val : first;
    const newMiddle = field === "middle" ? val : middle;
    const newSuffix = field === "suffix" ? val : suffix;

    if (!newLast && !newFirst && !newMiddle && !newSuffix) {
      onChange("");
    } else {
      onChange(`${newLast}, ${newFirst}, ${newMiddle}, ${newSuffix}`);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
      <ClearableInput
        type="text"
        className="sss-input uppercase"
        placeholder="Last Name"
        value={last}
        onChange={(val) => handleChange("last", val.toUpperCase())}
        required={required}
      />
      <ClearableInput
        type="text"
        className="sss-input uppercase"
        placeholder="First Name"
        value={first}
        onChange={(val) => handleChange("first", val.toUpperCase())}
        required={required}
      />
      <ClearableInput
        type="text"
        className="sss-input uppercase"
        placeholder="Middle Name"
        value={middle}
        onChange={(val) => handleChange("middle", val.toUpperCase())}
      />
      <ClearableInput
        type="text"
        className="sss-input uppercase"
        placeholder="Suffix (e.g. JR, II)"
        value={suffix}
        onChange={(val) => handleChange("suffix", val.toUpperCase())}
      />
    </div>
  );
}

interface SplitAddressProps {
  value: string;
  onChange: (val: string) => void;
  required?: boolean;
  isLocalAddress?: boolean;
}

export function SplitAddress({ value, onChange, required, isLocalAddress }: SplitAddressProps) {
  const parts = value.split(",").map((s) => s.trim());
  const room = parts[0] || "";
  const house = parts[1] || "";
  const street = parts[2] || "";
  const subdivision = parts[3] || "";
  const barangay = parts[4] || "";
  const city = parts[5] || "";
  const province = parts[6] || "";
  const postalCode = parts[7] || "";

  const handleChange = (idx: number, val: string) => {
    const newParts = [room, house, street, subdivision, barangay, city, province, postalCode];
    newParts[idx] = val;

    if (newParts.every((p) => !p)) {
      onChange("");
    } else {
      onChange(newParts.join(", "));
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end">
      <ClearableInput
        type="text"
        className="sss-input uppercase"
        placeholder="Rm/Flr/Unit No & Bldg"
        value={room}
        onChange={(val) => handleChange(0, val.toUpperCase())}
      />
      <ClearableInput
        type="text"
        className="sss-input uppercase"
        placeholder="House/Lot & Blk No"
        value={house}
        onChange={(val) => handleChange(1, val.toUpperCase())}
      />
      <ClearableInput
        type="text"
        className="sss-input uppercase"
        placeholder="Street Name"
        value={street}
        onChange={(val) => handleChange(2, val.toUpperCase())}
        required={required}
      />
      <ClearableInput
        type="text"
        className="sss-input uppercase"
        placeholder="Subdivision"
        value={subdivision}
        onChange={(val) => handleChange(3, val.toUpperCase())}
      />
      <ClearableInput
        type="text"
        className="sss-input uppercase"
        placeholder="Barangay/District"
        value={barangay}
        onChange={(val) => handleChange(4, val.toUpperCase())}
        required={required}
      />
      <ClearableInput
        type="text"
        className="sss-input uppercase"
        placeholder="City/Municipality"
        value={city}
        onChange={(val) => handleChange(5, val.toUpperCase())}
        required={required}
      />
      <ClearableInput
        type="text"
        className="sss-input uppercase"
        placeholder="Province"
        value={province}
        onChange={(val) => handleChange(6, val.toUpperCase())}
        required={required}
      />
      {isLocalAddress ? (
        <div className="flex flex-col">
          <label className="text-xs text-sss-label mb-1 uppercase font-bold tracking-wider">Postal Code</label>
          <DigitBoxes
            format="####"
            value={postalCode}
            onChange={(val) => handleChange(7, val)}
            required={required}
          />
        </div>
      ) : (
        <ClearableInput
          type="text"
          className="sss-input uppercase"
          placeholder="Postal Code"
          value={postalCode}
          onChange={(val) => handleChange(7, val.toUpperCase())}
          required={required}
        />
      )}
    </div>
  );
}
