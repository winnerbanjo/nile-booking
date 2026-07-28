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

export const formatDateSafe = (value: unknown, options?: Intl.DateTimeFormatOptions): string => {
  const date = safeDate(value);
  if (!date) return 'Unknown';
  return date.toLocaleDateString('en-US', options || { month: 'short', day: 'numeric', year: 'numeric' });
};

export const normaliseApiResponse = (response: unknown, listKey?: string) => {
  const payload = response as any;

  let dataList: any[] = [];
  if (Array.isArray(payload)) {
    dataList = payload;
  } else if (payload && Array.isArray(payload.data)) {
    dataList = payload.data;
  } else if (payload && listKey && Array.isArray(payload[listKey])) {
    dataList = payload[listKey];
  } else if (payload && typeof payload === 'object') {
    // If there's only one array key, use it
    const arrayKeys = Object.values(payload).filter(Array.isArray);
    if (arrayKeys.length === 1) {
      dataList = arrayKeys[0] as any[];
    }
  }

  const total = Number.isFinite(Number(payload?.pagination?.total))
    ? Number(payload.pagination.total)
    : Number.isFinite(Number(payload?.total))
      ? Number(payload.total)
      : dataList.length;

  return {
    data: dataList,
    pagination: {
      page: Number(payload?.pagination?.page) || Number(payload?.page) || 1,
      limit: Number(payload?.pagination?.limit) || Number(payload?.limit) || 20,
      total,
      totalPages: Number(payload?.pagination?.totalPages) || Number(payload?.totalPages) || 1
    }
  };
};
