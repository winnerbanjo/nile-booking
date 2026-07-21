import React, { useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { ShoppingBag, CreditCard, Banknote, Smartphone, CheckCircle2, Plus, Receipt } from 'lucide-react';

export const Sales: React.FC = () => {
  const [salesHistory, setSalesHistory] = useState([
    { id: 'pos_1', client: 'Chukwu Emeka', items: 'Skin Fade + Beard Grooming', total: 15000, method: 'Paystack', date: 'Today, 10:45 AM' },
    { id: 'pos_2', client: 'Walk-in Client', items: 'Standard Haircut', total: 10000, method: 'Cash', date: 'Today, 11:30 AM' },
  ]);

  const [clientName, setClientName] = useState('');
  const [serviceName, setServiceName] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [successMsg, setSuccessMsg] = useState('');

  const handleRecordSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !serviceName || !amount) return;

    const newSale = {
      id: `pos_${Date.now()}`,
      client: clientName,
      items: serviceName,
      total: Number(amount),
      method: paymentMethod,
      date: 'Just now',
    };

    setSalesHistory([newSale, ...salesHistory]);
    setSuccessMsg('Receipt issued & transaction recorded successfully!');
    setClientName('');
    setServiceName('');
    setAmount('');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200/80 pb-6">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-emerald-600" />
            Point of Sale (POS) & Register
          </h1>
          <p className="text-xs text-zinc-500 font-normal mt-1">
            Record walk-in payments, issue instant receipts, and reconcile cash/digital sales
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Record Sale Form */}
        <div className="bg-white border border-zinc-200/80 rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="text-base font-semibold text-zinc-900 tracking-tight flex items-center gap-2">
            <Receipt className="w-4 h-4 text-emerald-600" />
            New POS Register Sale
          </h2>

          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleRecordSale} className="space-y-4">
            <div>
              <Label className="text-xs font-medium text-zinc-700 mb-1 block">Client Name</Label>
              <Input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Adeola Johnson / Walk-in"
                className="h-9 text-xs border-zinc-300 rounded-lg"
                required
              />
            </div>

            <div>
              <Label className="text-xs font-medium text-zinc-700 mb-1 block">Service / Item Rendered</Label>
              <Input
                type="text"
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
                placeholder="VIP Cut & Styling"
                className="h-9 text-xs border-zinc-300 rounded-lg"
                required
              />
            </div>

            <div>
              <Label className="text-xs font-medium text-zinc-700 mb-1 block">Amount Paid (₦)</Label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="15000"
                className="h-9 text-xs border-zinc-300 rounded-lg"
                required
              />
            </div>

            <div>
              <Label className="text-xs font-medium text-zinc-700 mb-1 block">Payment Method</Label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="h-9 w-full text-xs border border-zinc-300 rounded-lg bg-white px-2.5 text-zinc-900 focus:outline-none"
              >
                <option value="Cash">Cash 💵</option>
                <option value="Bank Transfer">Bank Transfer 🏦</option>
                <option value="POS Card Terminal">POS Card Terminal 💳</option>
                <option value="Paystack">Paystack Online ⚡</option>
              </select>
            </div>

            <Button
              type="submit"
              className="w-full bg-zinc-900 text-white hover:bg-zinc-800 rounded-lg h-9 text-xs font-medium"
            >
              Complete Sale & Issue Receipt
            </Button>
          </form>
        </div>

        {/* Recent Register Transactions */}
        <div className="lg:col-span-2 bg-white border border-zinc-200/80 rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="text-base font-semibold text-zinc-900 tracking-tight">
            Today's Completed Sales Register
          </h2>

          <div className="divide-y divide-zinc-100">
            {salesHistory.map((s) => (
              <div key={s.id} className="py-3.5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-zinc-900">{s.client}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{s.items} • <span className="font-medium text-zinc-700">{s.method}</span></p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-zinc-900">₦{s.total.toLocaleString()}</p>
                  <p className="text-[11px] text-zinc-400">{s.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
