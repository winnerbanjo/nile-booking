import React, { useState } from 'react';
import { Search, Filter, Download, Mail, Phone, MoreHorizontal } from 'lucide-react';
import { ActionModal } from '../../components/admin/ActionModal';

const mockCustomers = [
  {
    id: 'CST-001',
    name: 'Sarah Jenkins',
    email: 'sarah.j@example.com',
    phone: '+234 801 234 5678',
    totalBookings: 12,
    completedBookings: 11,
    totalSpent: 450000,
    lastActive: '2026-07-20',
    status: 'Active',
  },
  {
    id: 'CST-002',
    name: 'David Ojo',
    email: 'david.ojo@example.com',
    phone: '+234 902 345 6789',
    totalBookings: 5,
    completedBookings: 5,
    totalSpent: 125000,
    lastActive: '2026-07-21',
    status: 'Active',
  },
  {
    id: 'CST-003',
    name: 'Amina Bello',
    email: 'amina.b@example.com',
    phone: '+234 703 456 7890',
    totalBookings: 8,
    completedBookings: 6,
    totalSpent: 280000,
    lastActive: '2026-07-15',
    status: 'Active',
  },
  {
    id: 'CST-004',
    name: 'Chioma Adeyemi',
    email: 'chioma.a@example.com',
    phone: '+234 814 567 8901',
    totalBookings: 3,
    completedBookings: 2,
    totalSpent: 45000,
    lastActive: '2026-07-10',
    status: 'Flagged',
  },
  {
    id: 'CST-005',
    name: 'Michael Eze',
    email: 'michael.eze@example.com',
    phone: '+234 915 678 9012',
    totalBookings: 1,
    completedBookings: 1,
    totalSpent: 35000,
    lastActive: '2026-07-18',
    status: 'Active',
  }
];

export const Customers: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  return (
    <div className="w-full space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-gray-900">Global Customer Directory</h2>
          <p className="text-sm text-gray-500 mt-1">Manage and view all customers interacting with Nile merchants.</p>
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
            placeholder="Search by name, email, or phone..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
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
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Activity</th>
                <th className="px-6 py-4">Total Spent</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {mockCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                        {customer.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{customer.name}</p>
                        <p className="text-[10px] text-gray-500 font-mono">{customer.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 space-y-1">
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Mail className="w-3.5 h-3.5 text-gray-400" />
                      {customer.email}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Phone className="w-3.5 h-3.5 text-gray-400" />
                      {customer.phone}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-gray-900">{customer.totalBookings} <span className="font-normal text-xs text-gray-500">Total Bookings</span></p>
                    <p className="text-xs text-gray-500">{customer.completedBookings} Completed</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-emerald-600">₦{customer.totalSpent.toLocaleString()}</p>
                    <p className="text-[10px] text-gray-400">Lifetime Value</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold ${
                      customer.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {customer.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => setSelectedCustomer(customer)} 
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
          <span>Showing 1 to 5 of 1,250 customers</span>
          <div className="flex items-center gap-2">
            <button onClick={() => alert('Action triggered!')} className="px-3 py-1 border border-gray-200 rounded bg-white hover:bg-gray-50 disabled:opacity-50">Prev</button>
            <button onClick={() => alert('Action triggered!')} className="px-3 py-1 border border-gray-200 rounded bg-white hover:bg-gray-50">Next</button>
          </div>
        </div>
      </div>

      <ActionModal
        isOpen={!!selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
        title="Customer Management"
        data={selectedCustomer ? {
          'Name': selectedCustomer.name,
          'Email': selectedCustomer.email,
          'Phone': selectedCustomer.phone,
          'Total Bookings': selectedCustomer.totalBookings,
          'Lifetime Value': `₦${selectedCustomer.totalSpent.toLocaleString()}`,
          'Joined': new Date(selectedCustomer.joinDate).toLocaleDateString(),
          'Status': selectedCustomer.status,
        } : {}}
        actions={[
          { label: 'View Profile', variant: 'primary', onClick: () => alert('Viewing profile...') },
          { label: 'Send Warning Email', variant: 'secondary', onClick: () => alert('Email sent.') },
          { label: selectedCustomer?.status === 'Active' ? 'Suspend Account' : 'Activate Account', variant: 'danger', onClick: () => alert('Account status changed.') },
        ]}
      />
    </div>
  );
};
