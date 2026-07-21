import React, { useState } from 'react';
import { Search, Filter, Download, CalendarDays, MoreHorizontal } from 'lucide-react';
import { ActionModal } from '../../components/admin/ActionModal';

const mockBookings = [
  {
    id: 'BKG-98321',
    provider: 'Zenith Photography',
    customer: 'Sarah Jenkins',
    service: 'Wedding Package',
    date: '2026-07-25',
    amount: 150000,
    deposit: 50000,
    status: 'Confirmed',
    paymentStatus: 'Partial',
  },
  {
    id: 'BKG-98320',
    provider: 'The Modern Chef',
    customer: 'David Ojo',
    service: 'Private Dinner (6 Pax)',
    date: '2026-07-22',
    amount: 85000,
    deposit: 85000,
    status: 'Completed',
    paymentStatus: 'Paid',
  },
  {
    id: 'BKG-98319',
    provider: 'Elite Hair Studio',
    customer: 'Amina Bello',
    service: 'Bridal Styling',
    date: '2026-07-28',
    amount: 45000,
    deposit: 15000,
    status: 'Confirmed',
    paymentStatus: 'Partial',
  },
  {
    id: 'BKG-98318',
    provider: 'Glamour MUA',
    customer: 'Chioma Adeyemi',
    service: 'Gele & Full Face',
    date: '2026-07-21',
    amount: 25000,
    deposit: 25000,
    status: 'Cancelled',
    paymentStatus: 'Refunded',
  },
  {
    id: 'BKG-98317',
    provider: 'Zenith Photography',
    customer: 'Michael Eze',
    service: 'Studio Portrait',
    date: '2026-07-23',
    amount: 35000,
    deposit: 35000,
    status: 'Confirmed',
    paymentStatus: 'Paid',
  }
];

export const Bookings: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<any>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Confirmed': return 'bg-blue-100 text-blue-700';
      case 'Completed': return 'bg-emerald-100 text-emerald-700';
      case 'Cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getPaymentColor = (status: string) => {
    switch (status) {
      case 'Paid': return 'bg-emerald-100 text-emerald-700';
      case 'Partial': return 'bg-amber-100 text-amber-700';
      case 'Refunded': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="w-full space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-gray-900">Global Bookings Ledger</h2>
          <p className="text-sm text-gray-500 mt-1">Monitor and manage all appointments across the ecosystem.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => alert('Action triggered!')} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg shadow-sm transition-colors">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search by reference, provider, or customer..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => alert('Action triggered!')} className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-100">
            <Filter className="w-4 h-4" />
            More Filters
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50/50 text-xs uppercase text-gray-500 font-bold border-b border-gray-200">
              <tr>
                <th className="px-6 py-4">Reference</th>
                <th className="px-6 py-4">Provider / Service</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {mockBookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs font-bold text-gray-900">
                    {booking.id}
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-gray-900">{booking.provider}</p>
                    <p className="text-xs text-gray-500">{booking.service}</p>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {booking.customer}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-gray-900">
                      <CalendarDays className="w-4 h-4 text-gray-400" />
                      {new Date(booking.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-gray-900">₦{booking.amount.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">Dep: ₦{booking.deposit.toLocaleString()}</p>
                  </td>
                  <td className="px-6 py-4 space-y-1.5">
                    <span className={`flex w-fit items-center px-2 py-0.5 rounded text-[10px] font-bold ${getStatusColor(booking.status)}`}>
                      {booking.status}
                    </span>
                    <span className={`flex w-fit items-center px-2 py-0.5 rounded text-[10px] font-bold ${getPaymentColor(booking.paymentStatus)}`}>
                      {booking.paymentStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => setSelectedBooking(booking)} 
                      className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                    >
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between text-sm text-gray-500">
          <span>Showing 1 to 5 of 840 bookings</span>
          <div className="flex items-center gap-2">
            <button onClick={() => alert('Action triggered!')} className="px-3 py-1 border border-gray-200 rounded bg-white hover:bg-gray-50 disabled:opacity-50">Prev</button>
            <button onClick={() => alert('Action triggered!')} className="px-3 py-1 border border-gray-200 rounded bg-white hover:bg-gray-50">Next</button>
          </div>
        </div>
      </div>

      <ActionModal
        isOpen={!!selectedBooking}
        onClose={() => setSelectedBooking(null)}
        title="Booking Options"
        data={selectedBooking ? {
          'Booking Ref': selectedBooking.id,
          'Customer': selectedBooking.customer,
          'Provider': selectedBooking.provider,
          'Service': selectedBooking.service,
          'Amount': `₦${selectedBooking.amount.toLocaleString()}`,
          'Date': new Date(selectedBooking.date).toLocaleString(),
          'Status': selectedBooking.status,
        } : {}}
        actions={[
          { label: 'View Full Invoice', variant: 'primary', onClick: () => alert('Viewing invoice...') },
          { label: 'Cancel Booking', variant: 'danger', onClick: () => alert('Booking cancelled.') },
          { label: 'Close', variant: 'secondary', onClick: () => {} },
        ]}
      />
    </div>
  );
};
