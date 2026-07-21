import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authApi } from '../lib/api';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { FileText, Shield, RotateCcw, CheckCircle2 } from 'lucide-react';

export const Pages: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const [policies, setPolicies] = useState({
    terms: '',
    returnPolicy: '',
    privacyPolicy: '',
  });

  useEffect(() => {
    if (user?.policies) {
      setPolicies({
        terms: user.policies.terms || '',
        returnPolicy: user.policies.returnPolicy || '',
        privacyPolicy: user.policies.privacyPolicy || '',
      });
    } else {
      setPolicies({
        terms: 'All bookings must be confirmed in advance. Cancellations made at least 24 hours prior to appointment time are eligible for reschedule.',
        returnPolicy: 'Services completed are non-refundable. Deposits for cancelled bookings may be transferred to a new slot within 30 days.',
        privacyPolicy: 'We value client privacy and only process personal details for booking confirmations.',
      });
    }
  }, [user]);

  const handleSavePolicies = async () => {
    setLoading(true);
    try {
      await authApi.updateProfile({
        policies,
      } as any);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    } catch (error: any) {
      alert('Failed to save store policy pages: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200/80 pb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold text-zinc-900 tracking-tight">
              Store Policy Pages
            </h1>
            <p className="text-sm text-zinc-500 mt-1 font-normal">
              Manage your custom Terms & Conditions, Return Policy, and Privacy Policy for your storefront footer
            </p>
          </div>
          <Button
            onClick={handleSavePolicies}
            disabled={loading}
            className="bg-zinc-900 text-white hover:bg-zinc-800 rounded-lg h-9 px-4 text-xs font-medium shadow-sm self-start md:self-auto"
          >
            {loading ? 'Saving...' : 'Save All Pages'}
          </Button>
        </div>

        {/* Policy Editors */}
        <div className="space-y-6">
          
          {/* Terms & Conditions */}
          <div className="bg-white border border-zinc-200/80 rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2 border-b border-zinc-100 pb-3">
              <FileText className="w-4 h-4 text-zinc-700" />
              <h2 className="text-base font-semibold text-zinc-900 tracking-tight">
                Terms & Conditions
              </h2>
            </div>
            <div>
              <Label className="text-xs font-medium text-zinc-700 mb-1.5 block">
                Appointment & Storefront Terms
              </Label>
              <textarea
                rows={4}
                value={policies.terms}
                onChange={(e) => setPolicies({ ...policies, terms: e.target.value })}
                placeholder="Specify your booking rules, arrival policies, and appointment guidelines..."
                className="w-full text-xs p-3 rounded-lg border border-zinc-300 focus:border-zinc-900 focus:ring-zinc-900 font-normal leading-relaxed text-zinc-800"
              />
              <p className="text-[11px] text-zinc-400 mt-1">Displayed in your storefront footer modal link.</p>
            </div>
          </div>

          {/* Return & Refund Policy */}
          <div className="bg-white border border-zinc-200/80 rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2 border-b border-zinc-100 pb-3">
              <RotateCcw className="w-4 h-4 text-zinc-700" />
              <h2 className="text-base font-semibold text-zinc-900 tracking-tight">
                Refund & Return Policy
              </h2>
            </div>
            <div>
              <Label className="text-xs font-medium text-zinc-700 mb-1.5 block">
                Cancellation & Refund Guidelines
              </Label>
              <textarea
                rows={4}
                value={policies.returnPolicy}
                onChange={(e) => setPolicies({ ...policies, returnPolicy: e.target.value })}
                placeholder="State your refund policy, deposit transfer rules, and service guarantees..."
                className="w-full text-xs p-3 rounded-lg border border-zinc-300 focus:border-zinc-900 focus:ring-zinc-900 font-normal leading-relaxed text-zinc-800"
              />
              <p className="text-[11px] text-zinc-400 mt-1">Displayed in your storefront footer modal link.</p>
            </div>
          </div>

          {/* Privacy Policy */}
          <div className="bg-white border border-zinc-200/80 rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2 border-b border-zinc-100 pb-3">
              <Shield className="w-4 h-4 text-zinc-700" />
              <h2 className="text-base font-semibold text-zinc-900 tracking-tight">
                Privacy Policy
              </h2>
            </div>
            <div>
              <Label className="text-xs font-medium text-zinc-700 mb-1.5 block">
                Client Data Handling Notice
              </Label>
              <textarea
                rows={4}
                value={policies.privacyPolicy}
                onChange={(e) => setPolicies({ ...policies, privacyPolicy: e.target.value })}
                placeholder="Explain how customer contact info and appointment details are handled..."
                className="w-full text-xs p-3 rounded-lg border border-zinc-300 focus:border-zinc-900 focus:ring-zinc-900 font-normal leading-relaxed text-zinc-800"
              />
              <p className="text-[11px] text-zinc-400 mt-1">Displayed in your storefront footer modal link.</p>
            </div>
          </div>

        </div>

        {/* Auto-Save Toast */}
        {showToast && (
          <div className="fixed bottom-6 right-6 bg-zinc-900 text-white px-3.5 py-2.5 rounded-lg shadow-lg flex items-center gap-2 text-xs font-medium z-50">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Store Policy Pages Saved</span>
          </div>
        )}

      </div>
    </div>
  );
};
