import React from 'react';
import { Star, MessageSquare } from 'lucide-react';

export const Reviews: React.FC = () => {
  const reviews: any[] = [];

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-8 space-y-6">
      <div className="border-b border-zinc-200/80 pb-6">
        <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight flex items-center gap-2">
          <Star className="w-6 h-6 text-amber-500 fill-amber-500" />
          Customer Reviews & Ratings
        </h1>
        <p className="text-xs text-zinc-500 font-normal mt-1">
          Automated review requests sent after completed appointments to build trust on your storefront
        </p>
      </div>

      {reviews.length === 0 ? (
        <div className="bg-white border border-zinc-200/80 rounded-xl p-12 text-center space-y-3 shadow-sm">
          <MessageSquare className="w-10 h-10 text-zinc-300 mx-auto" />
          <h3 className="text-sm font-semibold text-zinc-900">No reviews yet</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto font-normal">
            Customer reviews will appear here after completed bookings.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-zinc-200/80 rounded-xl p-6 shadow-sm space-y-4">
          <div className="divide-y divide-zinc-100">
            {reviews.map((rev) => (
              <div key={rev.id} className="py-4 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-900">{rev.customer}</span>
                  <span className="text-[11px] text-zinc-400">{rev.date}</span>
                </div>
                <p className="text-xs text-zinc-700 font-normal">"{rev.comment}"</p>
                <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                  <span className="font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {rev.service}
                  </span>
                  <span>• Verified Appointment</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
