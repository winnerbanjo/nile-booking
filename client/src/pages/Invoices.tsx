import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { FileSpreadsheet, Plus, Printer, Download, CheckCircle2, Building2, X, FileText, Send } from 'lucide-react';
import { format } from 'date-fns';

interface InvoiceItem {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  serviceName: string;
  amount: number;
  dueDate: string;
  status: 'paid' | 'pending' | 'draft';
  createdAt: string;
}

export const Invoices: React.FC = () => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceItem | null>(null);

  const [newInvoice, setNewInvoice] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    serviceName: '',
    amount: '',
    dueDate: format(new Date(Date.now() + 86400000 * 7), 'yyyy-MM-dd'),
  });

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInvoice.customerName || !newInvoice.serviceName || !newInvoice.amount) {
      alert('Please fill in client name, service description, and amount.');
      return;
    }

    const created: InvoiceItem = {
      id: `inv-${Date.now()}`,
      invoiceNumber: `INV-2026-${String(invoices.length + 1).padStart(3, '0')}`,
      customerName: newInvoice.customerName,
      customerEmail: newInvoice.customerEmail || 'client@example.com',
      customerPhone: newInvoice.customerPhone || '+2348123456789',
      serviceName: newInvoice.serviceName,
      amount: Number(newInvoice.amount),
      dueDate: new Date(newInvoice.dueDate).toISOString(),
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    setInvoices([created, ...invoices]);
    setShowCreateModal(false);
    setNewInvoice({
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      serviceName: '',
      amount: '',
      dueDate: format(new Date(Date.now() + 86400000 * 7), 'yyyy-MM-dd'),
    });
    alert('Invoice created successfully!');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200/80 pb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold text-zinc-900 tracking-tight">
              Invoice Generator & Manager
            </h1>
            <p className="text-sm text-zinc-500 mt-1 font-normal">
              Create professional digital invoices, send transfer requests, and record settlements
            </p>
          </div>

          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-zinc-900 text-white hover:bg-zinc-800 rounded-lg h-9 px-4 text-xs font-medium self-start md:self-auto shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Generate New Invoice
          </Button>
        </div>

        {/* Invoice List */}
        <div className="bg-white border border-zinc-200/80 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-200/80 flex items-center justify-between">
            <h2 className="text-base font-semibold text-zinc-900 tracking-tight">Invoice Records</h2>
            <span className="text-xs text-zinc-500">{invoices.length} Invoices</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50/80 border-b border-zinc-200/80 text-zinc-500 font-medium">
                <tr>
                  <th className="px-6 py-3.5">Invoice #</th>
                  <th className="px-6 py-3.5">Client Name</th>
                  <th className="px-6 py-3.5">Service Description</th>
                  <th className="px-6 py-3.5">Amount</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-zinc-700">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="px-6 py-4 font-mono font-medium text-zinc-900">{inv.invoiceNumber}</td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-zinc-900">{inv.customerName}</div>
                      <div className="text-[11px] text-zinc-400 font-normal">{inv.customerEmail}</div>
                    </td>
                    <td className="px-6 py-4 text-zinc-600 font-medium">{inv.serviceName}</td>
                    <td className="px-6 py-4 font-bold text-zinc-900">₦{inv.amount.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${
                        inv.status === 'paid'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {inv.status === 'paid' ? 'Paid' : 'Payment Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedInvoice(inv)}
                        className="h-8 text-xs bg-white border-zinc-300 text-zinc-700 hover:bg-zinc-50 px-3"
                      >
                        <FileText className="w-3.5 h-3.5 mr-1 text-zinc-500" />
                        View & Print
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create Invoice Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-xl w-full max-w-lg space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                <h3 className="text-base font-semibold text-zinc-900">Generate Client Invoice</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1 text-zinc-400 hover:text-zinc-700 rounded-lg hover:bg-zinc-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateInvoice} className="space-y-3">
                <div>
                  <Label className="text-xs font-medium text-zinc-700 mb-1 block">Client Full Name *</Label>
                  <Input
                    value={newInvoice.customerName}
                    onChange={(e) => setNewInvoice({ ...newInvoice, customerName: e.target.value })}
                    placeholder="e.g., Adeola Johnson"
                    className="h-9 text-xs border-zinc-300"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-medium text-zinc-700 mb-1 block">Client Email</Label>
                    <Input
                      type="email"
                      value={newInvoice.customerEmail}
                      onChange={(e) => setNewInvoice({ ...newInvoice, customerEmail: e.target.value })}
                      placeholder="adeola@example.com"
                      className="h-9 text-xs border-zinc-300"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-zinc-700 mb-1 block">WhatsApp Phone</Label>
                    <Input
                      value={newInvoice.customerPhone}
                      onChange={(e) => setNewInvoice({ ...newInvoice, customerPhone: e.target.value })}
                      placeholder="+2348123456789"
                      className="h-9 text-xs border-zinc-300"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-medium text-zinc-700 mb-1 block">Service Description *</Label>
                  <Input
                    value={newInvoice.serviceName}
                    onChange={(e) => setNewInvoice({ ...newInvoice, serviceName: e.target.value })}
                    placeholder="e.g., Skin Fade Cut & Full Grooming Session"
                    className="h-9 text-xs border-zinc-300"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-medium text-zinc-700 mb-1 block">Invoice Amount (₦) *</Label>
                    <Input
                      type="number"
                      value={newInvoice.amount}
                      onChange={(e) => setNewInvoice({ ...newInvoice, amount: e.target.value })}
                      placeholder="25000"
                      className="h-9 text-xs border-zinc-300"
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-zinc-700 mb-1 block">Due Date</Label>
                    <Input
                      type="date"
                      value={newInvoice.dueDate}
                      onChange={(e) => setNewInvoice({ ...newInvoice, dueDate: e.target.value })}
                      className="h-9 text-xs border-zinc-300"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    className="w-full bg-zinc-900 text-white hover:bg-zinc-800 rounded-lg h-9 text-xs font-medium shadow-sm"
                  >
                    Generate Invoice
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* View / Print Printable Invoice Sheet */}
        {selectedInvoice && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white border border-zinc-200 rounded-xl p-8 shadow-2xl w-full max-w-xl space-y-6 max-h-[90vh] overflow-y-auto">
              
              <div className="flex items-start justify-between border-b border-zinc-200 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-zinc-900">{user?.businessName || 'Merchant Storefront'}</h2>
                  <p className="text-xs text-zinc-500 font-mono">Invoice #{selectedInvoice.invoiceNumber}</p>
                </div>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="p-1 text-zinc-400 hover:text-zinc-700 rounded-lg hover:bg-zinc-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-zinc-400 uppercase font-medium text-[10px]">Billed To</p>
                  <p className="font-semibold text-zinc-900 mt-1">{selectedInvoice.customerName}</p>
                  <p className="text-zinc-500">{selectedInvoice.customerEmail}</p>
                  <p className="text-zinc-500">{selectedInvoice.customerPhone}</p>
                </div>
                <div className="text-right">
                  <p className="text-zinc-400 uppercase font-medium text-[10px]">Invoice Date</p>
                  <p className="font-semibold text-zinc-900 mt-1">{format(new Date(selectedInvoice.createdAt), 'MMM d, yyyy')}</p>
                  <p className="text-zinc-400 uppercase font-medium text-[10px] mt-2">Due Date</p>
                  <p className="font-semibold text-zinc-900">{format(new Date(selectedInvoice.dueDate), 'MMM d, yyyy')}</p>
                </div>
              </div>

              <div className="border border-zinc-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-medium">
                    <tr>
                      <th className="p-3">Service Description</th>
                      <th className="p-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-3 font-medium text-zinc-900">{selectedInvoice.serviceName}</td>
                      <td className="p-3 text-right font-bold text-zinc-900">₦{selectedInvoice.amount.toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Settlement Bank Details */}
              <div className="bg-zinc-900 text-white rounded-lg p-4 text-xs space-y-1">
                <p className="text-zinc-400 font-medium uppercase text-[10px]">Bank Settlement Account</p>
                <p className="font-bold text-sm">Access Bank • 8123843076</p>
                <p className="text-zinc-300 text-[11px]">{user?.businessName || 'Merchant Account'}</p>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  onClick={handlePrint}
                  className="flex-1 bg-zinc-900 text-white hover:bg-zinc-800 rounded-lg h-9 text-xs font-medium"
                >
                  <Printer className="w-3.5 h-3.5 mr-1.5" />
                  Print / Save as PDF
                </Button>
                <a
                  href={`https://wa.me/${selectedInvoice.customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi ${selectedInvoice.customerName}, here is your invoice #${selectedInvoice.invoiceNumber} for ₦${selectedInvoice.amount.toLocaleString()} for ${selectedInvoice.serviceName}.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg h-9 text-xs font-medium"
                >
                  <Send className="w-3.5 h-3.5" />
                  Send to Client WhatsApp
                </a>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
};
