import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, Eye, EyeOff, Trash2, RefreshCw } from 'lucide-react';
import { reviewApi } from '../lib/api';

const StarDisplay: React.FC<{ rating: number }> = ({ rating }) => (
  <div className="flex items-center gap-0.5">
    {[1,2,3,4,5].map(s => (
      <Star key={s} className={`w-3.5 h-3.5 ${s <= rating ? 'text-amber-400 fill-amber-400' : 'text-zinc-300 fill-zinc-300'}`} />
    ))}
  </div>
);

export const Reviews: React.FC = () => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [breakdown, setBreakdown] = useState<Record<string, number>>({});
  const [total, setTotal] = useState(0);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await reviewApi.getMyReviews();
      setReviews(data.reviews || []);
      setAvgRating(data.avgRating);
      setBreakdown(data.breakdown || {});
      setTotal(data.total || 0);
    } catch (e) { setReviews([]); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleToggle = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await reviewApi.togglePublish(id);
      setReviews(prev => prev.map(r => r._id === id ? { ...r, isPublished: res.review.isPublished } : r));
    } catch (e) {}
    setActionLoading(null);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this review permanently?')) return;
    setActionLoading(id);
    try {
      await reviewApi.deleteReview(id);
      setReviews(prev => prev.filter(r => r._id !== id));
      setTotal(prev => prev - 1);
    } catch (e) {}
    setActionLoading(null);
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between border-b border-zinc-200/80 pb-6">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight flex items-center gap-2">
            <Star className="w-6 h-6 text-amber-500 fill-amber-500" />
            Customer Reviews
          </h1>
          <p className="text-xs text-zinc-500 font-normal mt-1">Reviews customers have left on your public booking page</p>
        </div>
        <button onClick={load} className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-zinc-700 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {!loading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-zinc-200/80 rounded-xl p-4 shadow-sm">
            <p className="text-xs text-zinc-500 font-medium mb-1">Total Reviews</p>
            <p className="text-2xl font-bold text-zinc-900">{total}</p>
          </div>
          <div className="bg-white border border-zinc-200/80 rounded-xl p-4 shadow-sm">
            <p className="text-xs text-zinc-500 font-medium mb-1">Average Rating</p>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold text-zinc-900">{avgRating ? avgRating.toFixed(1) : '\u2014'}</p>
              {avgRating && <Star className="w-5 h-5 text-amber-400 fill-amber-400" />}
            </div>
          </div>
          <div className="bg-white border border-zinc-200/80 rounded-xl p-4 shadow-sm col-span-2 md:col-span-1">
            <p className="text-xs text-zinc-500 font-medium mb-2">Breakdown</p>
            <div className="space-y-1">
              {[5,4,3,2,1].map(n => (
                <div key={n} className="flex items-center gap-1.5">
                  <span className="text-[10px] text-zinc-500 w-2">{n}</span>
                  <div className="flex-1 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full" style={{ width: total > 0 ? `${((breakdown[n] || 0) / total) * 100}%` : '0%' }} />
                  </div>
                  <span className="text-[10px] text-zinc-400 w-3">{breakdown[n] || 0}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white border border-zinc-200/80 rounded-xl p-4 shadow-sm">
            <p className="text-xs text-zinc-500 font-medium mb-1">Published</p>
            <p className="text-2xl font-bold text-emerald-600">{reviews.filter(r => r.isPublished).length}</p>
            <p className="text-[11px] text-zinc-400 mt-1">{reviews.filter(r => !r.isPublished).length} hidden</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-white border border-zinc-200/80 rounded-xl p-12 text-center shadow-sm">
          <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-7 h-7 text-amber-400" />
          </div>
          <h3 className="text-base font-semibold text-zinc-900 mb-1">No reviews yet</h3>
          <p className="text-xs text-zinc-500 max-w-xs mx-auto">Once customers leave reviews on your booking page they'll appear here.</p>
        </div>
      ) : (
        <div className="bg-white border border-zinc-200/80 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-zinc-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-900">All Reviews</h2>
            <span className="text-xs text-zinc-400">{reviews.length} total</span>
          </div>
          <div className="divide-y divide-zinc-100">
            {reviews.map(rev => (
              <div key={rev._id} className={`p-5 transition-colors ${!rev.isPublished ? 'bg-zinc-50/60 opacity-60' : ''}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">{rev.customerName?.charAt(0).toUpperCase()}</div>
                      <div>
                        <p className="text-sm font-semibold text-zinc-900">{rev.customerName}</p>
                        <p className="text-[11px] text-zinc-400">{rev.customerEmail}</p>
                      </div>
                    </div>
                    <StarDisplay rating={rev.rating} />
                    {rev.comment && <p className="text-xs text-zinc-600 mt-2 leading-relaxed">&ldquo;{rev.comment}&rdquo;</p>}
                    <div className="flex items-center gap-3 mt-2.5">
                      {rev.serviceName && <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-medium">{rev.serviceName}</span>}
                      <span className="text-[11px] text-zinc-400">{new Date(rev.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      {!rev.isPublished && <span className="text-[11px] text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded">Hidden</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => handleToggle(rev._id)} disabled={actionLoading === rev._id} title={rev.isPublished ? 'Hide' : 'Show'} className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors disabled:opacity-40">
                      {rev.isPublished ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button onClick={() => handleDelete(rev._id)} disabled={actionLoading === rev._id} title="Delete" className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
