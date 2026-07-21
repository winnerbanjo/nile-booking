import React, { useState } from 'react';
import { Tag, Plus, CheckCircle2, Copy } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

export const Discounts: React.FC = () => {
  const [coupons, setCoupons] = useState([
    { id: 'c1', code: 'WELCOME10', type: 'Percentage', value: '10% OFF', status: 'Active', uses: 24 },
    { id: 'c2', code: 'LAGOSCUTS', type: 'Fixed Amount', value: '₦2,000 OFF', status: 'Active', uses: 12 },
  ]);

  const [code, setCode] = useState('');
  const [discountValue, setDiscountValue] = useState('');

  const handleCreateCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !discountValue) return;

    setCoupons([
      ...coupons,
      {
        id: `c_${Date.now()}`,
        code: code.toUpperCase(),
        type: 'Discount',
        value: discountValue,
        status: 'Active',
        uses: 0,
      },
    ]);
    setCode('');
    setDiscountValue('');
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-8 space-y-6">
      <div className="border-b border-zinc-200/80 pb-6">
        <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight flex items-center gap-2">
          <Tag className="w-6 h-6 text-emerald-600" />
          Discounts & Coupon Codes
        </h1>
        <p className="text-xs text-zinc-500 font-normal mt-1">
          Create promotional codes and discount offers for first-time or returning clients
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white border border-zinc-200/80 rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="text-base font-semibold text-zinc-900 tracking-tight">Create Coupon Code</h2>
          <form onSubmit={handleCreateCoupon} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-zinc-700 mb-1 block">Coupon Code</label>
              <Input
                type="text"
                placeholder="PROMO2026"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="h-9 text-xs border-zinc-300 rounded-lg uppercase"
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-700 mb-1 block">Discount Amount / %</label>
              <Input
                type="text"
                placeholder="15% OFF or ₦3000 OFF"
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                className="h-9 text-xs border-zinc-300 rounded-lg"
                required
              />
            </div>
            <Button type="submit" className="w-full bg-zinc-900 text-white hover:bg-zinc-800 rounded-lg h-9 text-xs font-medium">
              Create Promo Code
            </Button>
          </form>
        </div>

        <div className="lg:col-span-2 bg-white border border-zinc-200/80 rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="text-base font-semibold text-zinc-900 tracking-tight">Active Promo Codes</h2>
          <div className="divide-y divide-zinc-100">
            {coupons.map((c) => (
              <div key={c.id} className="py-3 flex items-center justify-between">
                <div>
                  <span className="font-mono text-xs font-bold text-zinc-900 bg-zinc-100 px-2 py-1 rounded border border-zinc-200">
                    {c.code}
                  </span>
                  <span className="text-xs text-emerald-700 ml-3 font-semibold">{c.value}</span>
                </div>
                <div className="text-xs text-zinc-500">
                  {c.uses} redemptions
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
