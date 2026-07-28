import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const safeArray = <T>(value: unknown): T[] =>
  Array.isArray(value) ? value : [];

export const safeNumber = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const safeDate = (value: unknown): Date | null => {
  if (!value) return null;
  const date = new Date(value as string | number);
  return Number.isNaN(date.getTime()) ? null : date;
};
