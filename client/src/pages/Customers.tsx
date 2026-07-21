import React, { useState, useEffect } from 'react';
import { bookingApi } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Users, Phone, Mail, Calendar, DollarSign, Search, MessageCircle, X, Shield, Sparkles, Clock, CheckCircle2, UserPlus } from 'lucide-react';
import type { Booking } from '../types';
import { format, parseISO } from 'date-fns';

interface CustomerSummary {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalBookings: number;
  totalSpent: number;
  lastVisit: string;
  favoriteService: string;
  bookingsHistory: Booking[];
}

export const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerSummary | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const [newCustomer, setNewCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    notes: '',
  });

  useEffect(() => {
    const cached = localStorage.getItem('nile_crm_cache');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setCustomers(parsed);
        setLoading(false);
      } catch (e) {}
    }
    loadCustomerData();
  }, []);

  const loadCustomerData = async () => {
    try {
      const response = await bookingApi.getBookings({ limit: 100 });
      const bookingsList = response.bookings || [];

      // Group bookings by customer email/phone to create CRM aggregation
      const customerMap = new Map<string, CustomerSummary>();

      bookingsList.forEach((booking) => {
        const key = booking.customer.email.toLowerCase() || booking.customer.phone;
        const serviceName = typeof booking.service === 'object' ? booking.service.name : 'General Service';
        const amount = booking.pricing?.totalAmount || 0;

        if (!customerMap.has(key)) {
          customerMap.set(key, {
            id: key,
            name: booking.customer.name,
            email: booking.customer.email,
            phone: booking.customer.phone,
            totalBookings: 1,
            totalSpent: amount,
            lastVisit: booking.date,
            favoriteService: serviceName,
            bookingsHistory: [booking],
          });
        } else {
          const existing = customerMap.get(key)!;
          existing.totalBookings += 1;
          existing.totalSpent += amount;
          existing.bookingsHistory.push(booking);
          if (new Date(booking.date) > new Date(existing.lastVisit)) {
            existing.lastVisit = booking.date;
            existing.favoriteService = serviceName;
          }
        }
      });

      const aggregated = Array.from(customerMap.values());
      setCustomers(aggregated);
      localStorage.setItem('nile_crm_cache', JSON.stringify(aggregated));
    } catch (error) {
      console.error('Failed to load CRM customer data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.name || !newCustomer.phone) {
      alert('Please provide customer name and phone number.');
      return;
    }

    const created: CustomerSummary = {
      id: `cust_${Date.now()}`,
      name: newCustomer.name,
      email: newCustomer.email || 'client@example.com',
      phone: newCustomer.phone,
      totalBookings: 1,
      totalSpent: 0,
      lastVisit: new Date().toISOString(),
      favoriteService: 'Walk-in / Direct Add',
      bookingsHistory: [],
    };

    setCustomers([created, ...customers]);
    setShowAddModal(false);
    setNewCustomer({ name: '', email: '', phone: '', notes: '' });
    alert('New customer added to CRM directory!');
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm)
  );

  const totalClients = customers.length;
  const repeatClients = customers.filter((c) => c.totalBookings > 1).length;
  const totalLifetimeRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-3 text-xs text-zinc-500 font-normal">Loading Customer CRM...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200/80 pb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold text-zinc-900 tracking-tight">
              Customer Relationship Management (CRM)
            </h1>
            <p className="text-sm text-zinc-500 mt-1 font-normal">
              Track client booking frequency, lifetime value, and appointment history
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative w-full md:w-60">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
              <Input
                type="text"
                placeholder="Search clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 text-xs border-zinc-300 rounded-lg bg-white"
              />
            </div>

            <Button
              onClick={() => setShowAddModal(true)}
              className="bg-zinc-900 text-white hover:bg-zinc-800 rounded-lg h-9 px-4 text-xs font-medium shrink-0 shadow-sm"
            >
              <UserPlus className="w-3.5 h-3.5 mr-1.5" />
              Add New Customer
            </Button>
          </div>
        </div>

        {/* 3 Stripe Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-zinc-200/80 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Total Unique Clients</span>
              <div className="w-7 h-7 rounded bg-zinc-100 flex items-center justify-center text-zinc-600">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-semibold text-zinc-900 tracking-tight">
                {totalClients} Clients
              </div>
              <div className="text-xs text-zinc-500 mt-1 font-normal">Active customer directory</div>
            </div>
          </div>

          <div className="bg-white border border-zinc-200/80 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Repeat Client Rate</span>
              <div className="w-7 h-7 rounded bg-emerald-50 flex items-center justify-center text-emerald-700">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-semibold text-zinc-900 tracking-tight">
                {totalClients > 0 ? Math.round((repeatClients / totalClients) * 100) : 0}% Repeat
              </div>
              <div className="text-xs text-zinc-500 mt-1 font-normal">{repeatClients} clients with 2+ bookings</div>
            </div>
          </div>

          <div className="bg-white border border-zinc-200/80 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Cumulative Client LTV</span>
              <div className="w-7 h-7 rounded bg-zinc-100 flex items-center justify-center text-zinc-600">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-semibold text-zinc-900 tracking-tight">
                ₦{totalLifetimeRevenue.toLocaleString()}
              </div>
              <div className="text-xs text-zinc-500 mt-1 font-normal">Lifetime revenue from CRM portfolio</div>
            </div>
          </div>
        </div>

        {/* Customer Directory Table */}
        <div className="bg-white border border-zinc-200/80 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-200/80 flex items-center justify-between">
            <h2 className="text-base font-semibold text-zinc-900 tracking-tight">Customer Directory</h2>
            <span className="text-xs text-zinc-500">{filteredCustomers.length} Records</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50/80 border-b border-zinc-200/80 text-zinc-500 font-medium">
                <tr>
                  <th className="px-6 py-3.5">Customer Name</th>
                  <th className="px-6 py-3.5">Contact Details</th>
                  <th className="px-6 py-3.5">Times Booked</th>
                  <th className="px-6 py-3.5">Total Spent (LTV)</th>
                  <th className="px-6 py-3.5">Last Visit</th>
                  <th className="px-6 py-3.5 text-right">Quick Contact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-zinc-700">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-zinc-400">
                      No customer records match your search.
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-zinc-900">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-700 font-bold flex items-center justify-center text-xs">
                            {customer.name.charAt(0)}
                          </div>
                          <span>{customer.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-zinc-900 font-medium">{customer.phone}</div>
                        <div className="text-[11px] text-zinc-400 font-normal">{customer.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-800 border border-zinc-200">
                          {customer.totalBookings} {customer.totalBookings === 1 ? 'booking' : 'bookings'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-zinc-900">
                        ₦{customer.totalSpent.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-zinc-500 font-normal">
                        {format(parseISO(customer.lastVisit), 'MMM d, yyyy')}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedCustomer(customer)}
                            className="h-8 text-xs bg-white text-zinc-700 border-zinc-300 hover:bg-zinc-50 px-3"
                          >
                            View History
                          </Button>
                          <a
                            href={`https://wa.me/${customer.phone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 h-8 px-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100 text-xs font-medium transition-colors"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            WhatsApp
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add New Customer Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-xl w-full max-w-md space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                <h3 className="text-base font-semibold text-zinc-900">Add Customer to CRM Directory</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1 text-zinc-400 hover:text-zinc-700 rounded-lg hover:bg-zinc-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddCustomerSubmit} className="space-y-3">
                <div>
                  <Label className="text-xs font-medium text-zinc-700 mb-1 block">Full Name *</Label>
                  <Input
                    value={newCustomer.name}
                    onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                    placeholder="e.g., Adeola Johnson"
                    className="h-9 text-xs border-zinc-300"
                    required
                  />
                </div>

                <div>
                  <Label className="text-xs font-medium text-zinc-700 mb-1 block">WhatsApp Phone Number *</Label>
                  <Input
                    value={newCustomer.phone}
                    onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                    placeholder="+234 812 345 6789"
                    className="h-9 text-xs border-zinc-300"
                    required
                  />
                </div>

                <div>
                  <Label className="text-xs font-medium text-zinc-700 mb-1 block">Client Email</Label>
                  <Input
                    type="email"
                    value={newCustomer.email}
                    onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                    placeholder="client@example.com"
                    className="h-9 text-xs border-zinc-300"
                  />
                </div>

                <div>
                  <Label className="text-xs font-medium text-zinc-700 mb-1 block">Customer Notes / Tags</Label>
                  <Input
                    value={newCustomer.notes}
                    onChange={(e) => setNewCustomer({ ...newCustomer, notes: e.target.value })}
                    placeholder="e.g., Prefers Saturday mornings, skin fade"
                    className="h-9 text-xs border-zinc-300"
                  />
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    className="w-full bg-zinc-900 text-white hover:bg-zinc-800 rounded-lg h-9 text-xs font-medium shadow-sm"
                  >
                    Save Customer Record
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Detailed Customer CRM Profile Modal */}
        {selectedCustomer && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-xl w-full max-w-lg space-y-4">
              
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-zinc-900 text-white font-bold flex items-center justify-center text-sm">
                    {selectedCustomer.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-zinc-900">{selectedCustomer.name}</h3>
                    <p className="text-xs text-zinc-500">{selectedCustomer.email} • {selectedCustomer.phone}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="p-1 text-zinc-400 hover:text-zinc-700 rounded-lg hover:bg-zinc-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* LTV & Frequency Banner */}
              <div className="grid grid-cols-2 gap-3 bg-zinc-50 border border-zinc-200 rounded-lg p-3 text-xs">
                <div>
                  <span className="text-zinc-500 block">Total Appointments</span>
                  <span className="text-base font-semibold text-zinc-900">{selectedCustomer.totalBookings} Bookings</span>
                </div>
                <div>
                  <span className="text-zinc-500 block">Lifetime Revenue (LTV)</span>
                  <span className="text-base font-bold text-zinc-900">₦{selectedCustomer.totalSpent.toLocaleString()}</span>
                </div>
              </div>

              {/* Booking History Log */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-zinc-900 uppercase tracking-wider">Booking History</h4>
                <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                  {selectedCustomer.bookingsHistory.length === 0 ? (
                    <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg text-xs text-zinc-500">
                      Walk-in / Direct customer record.
                    </div>
                  ) : (
                    selectedCustomer.bookingsHistory.map((b) => (
                      <div key={b._id} className="p-2.5 bg-zinc-50 border border-zinc-200/80 rounded-lg text-xs flex justify-between items-center">
                        <div>
                          <div className="font-semibold text-zinc-900">{b.bookingNumber}</div>
                          <div className="text-zinc-500">{format(parseISO(b.date), 'MMM d, yyyy')} • {b.timeSlot?.startTime}</div>
                        </div>
                        <div className="font-bold text-zinc-900">
                          ₦{(b.pricing?.totalAmount || 0).toLocaleString()}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="pt-2">
                <a
                  href={`https://wa.me/${selectedCustomer.phone.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg h-9 text-xs font-medium shadow-sm transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  Send WhatsApp Message to Client
                </a>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
};
