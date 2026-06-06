import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatName(rawName: string | null | undefined) {
  if (!rawName) return "";
  const parts = rawName.split(",").map(s => s.trim());
  if (parts.length === 1) return parts[0];
  
  const last = parts[0] || "";
  const first = parts[1] || "";
  const middle = parts[2] || "";
  const suffix = parts.slice(3).join(" ") || "";
  
  const rest = [first, middle, suffix].filter(Boolean).join(" ");
  return rest ? `${last}, ${rest}` : last;
}
