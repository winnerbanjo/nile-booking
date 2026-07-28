import React from 'react';
import { motion } from 'framer-motion';

export const Skeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse bg-zinc-200 rounded-md ${className || ''}`} />
);

export const TableSkeleton = ({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) => (
  <div className="w-full">
    <div className="flex border-b border-zinc-100 pb-4 mb-4 gap-4">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={`header-${i}`} className="h-4 w-24" />
      ))}
    </div>
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={`row-${rowIndex}`} className="flex py-4 border-b border-zinc-50 gap-4">
        {Array.from({ length: columns }).map((_, colIndex) => (
          <Skeleton key={`cell-${rowIndex}-${colIndex}`} className={`h-4 ${colIndex === 0 ? 'w-32' : 'w-24'}`} />
        ))}
      </div>
    ))}
  </div>
);

export const MetricCardSkeleton = () => (
  <div className="bg-white p-6 rounded-xl border border-zinc-100 shadow-sm flex flex-col gap-3">
    <Skeleton className="h-4 w-24" />
    <Skeleton className="h-8 w-32" />
    <Skeleton className="h-3 w-40" />
  </div>
);

export const CardListSkeleton = ({ count = 3 }: { count?: number }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="bg-white p-5 rounded-xl border border-zinc-100 shadow-sm flex flex-col gap-4">
        <div className="flex justify-between items-start">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="pt-4 mt-auto border-t border-zinc-50 flex justify-between">
          <Skeleton className="h-8 w-20 rounded-md" />
          <Skeleton className="h-8 w-20 rounded-md" />
        </div>
      </div>
    ))}
  </div>
);
