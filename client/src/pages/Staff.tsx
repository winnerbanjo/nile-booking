import React, { useState, useEffect } from 'react';
import { staffApi, serviceApi } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { UserCheck, UserPlus, Trash2, Key, Shield, CheckCircle2, Phone, Mail, X, Scissors } from 'lucide-react';
import type { Service } from '../types';

interface StaffMember {
  _id: string;
  name: string;
  email: string;
  password?: string;
  roleTitle: string;
  phone: string;
  assignedServices: string[];
  isActive: boolean;
}

export const Staff: React.FC = () => {
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const [newStaff, setNewStaff] = useState({
    name: '',
    email: '',
    password: '',
    roleTitle: '',
    phone: '',
    assignedServices: [] as string[],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [staffData, serviceData] = await Promise.all([
        staffApi.getStaff(),
        serviceApi.getServices(),
      ]);
      setStaffList(staffData || []);
      setServices(serviceData || []);
    } catch (error) {
      console.error('Failed to load staff data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleService = (serviceName: string) => {
    const current = newStaff.assignedServices;
    if (current.includes(serviceName)) {
      setNewStaff({ ...newStaff, assignedServices: current.filter((s) => s !== serviceName) });
    } else {
      setNewStaff({ ...newStaff, assignedServices: [...current, serviceName] });
    }
  };

  const handleAddStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaff.name || !newStaff.email || !newStaff.password) {
      alert('Please provide staff name, login email, and login password.');
      return;
    }

    try {
      const created = await staffApi.createStaff(newStaff);
      setStaffList([created, ...staffList]);
      setShowAddModal(false);
      setNewStaff({
        name: '',
        email: '',
        password: '',
        roleTitle: '',
        phone: '',
        assignedServices: [],
      });
      alert(`Staff account for ${created.name} created! They can log in with: ${created.email}`);
    } catch (error: any) {
      alert('Failed to create staff member: ' + (error.message || 'Unknown error'));
    }
  };

  const handleDeleteStaff = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove ${name}?`)) return;
    try {
      await staffApi.deleteStaff(id);
      setStaffList(staffList.filter((s) => s._id !== id));
    } catch (error: any) {
      alert('Failed to delete staff member: ' + (error.message || 'Unknown error'));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-3 text-xs text-zinc-500 font-normal">Loading Staff Directory...</p>
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
              Staff & Team Management
            </h1>
            <p className="text-sm text-zinc-500 mt-1 font-normal">
              Manage barbers, stylists, and staff members, assign services, and set login credentials
            </p>
          </div>

          <Button
            onClick={() => setShowAddModal(true)}
            className="bg-zinc-900 text-white hover:bg-zinc-800 rounded-lg h-9 px-4 text-xs font-medium self-start md:self-auto shadow-sm"
          >
            <UserPlus className="w-3.5 h-3.5 mr-1.5" />
            Add Staff Member
          </Button>
        </div>

        {/* Staff Grid Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {staffList.map((staff) => (
            <div key={staff._id} className="bg-white border border-zinc-200/80 rounded-xl p-5 shadow-sm space-y-4">
              
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-zinc-900 text-white font-bold flex items-center justify-center text-sm">
                    {staff.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-zinc-900">{staff.name}</h3>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-100 text-zinc-700">
                      {staff.roleTitle || 'Staff Member'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteStaff(staff._id, staff.name)}
                  className="p-1.5 text-zinc-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                  title="Remove Staff"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Login Credentials Box */}
              <div className="bg-zinc-50 border border-zinc-200/80 rounded-lg p-3 text-xs space-y-1">
                <div className="flex items-center gap-1 text-[11px] font-semibold text-zinc-700">
                  <Key className="w-3 h-3 text-emerald-600" />
                  Staff Login Access
                </div>
                <div className="text-zinc-600 font-mono text-[11px]">Email: {staff.email}</div>
                <div className="text-zinc-600 font-mono text-[11px]">Password: {staff.password || '••••••••'}</div>
              </div>

              {/* Assigned Services Badges */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider block">Assigned Services</span>
                <div className="flex flex-wrap gap-1.5">
                  {staff.assignedServices.length === 0 ? (
                    <span className="text-xs text-zinc-400 italic">No assigned services</span>
                  ) : (
                    staff.assignedServices.map((serviceName, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <Scissors className="w-3 h-3" />
                        {serviceName}
                      </span>
                    ))
                  )}
                </div>
              </div>

            </div>
          ))}
        </div>

        {/* Add Staff Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-xl w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto">
              
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                <div>
                  <h3 className="text-base font-semibold text-zinc-900">Add Staff Account & Login Credentials</h3>
                  <p className="text-xs text-zinc-500">Staff members will log in using this email & password</p>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1 text-zinc-400 hover:text-zinc-700 rounded-lg hover:bg-zinc-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddStaffSubmit} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-medium text-zinc-700 mb-1 block">Full Name *</Label>
                    <Input
                      value={newStaff.name}
                      onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                      placeholder="e.g., Victor Stylist"
                      className="h-9 text-xs border-zinc-300"
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-zinc-700 mb-1 block">Job Role / Title</Label>
                    <Input
                      value={newStaff.roleTitle}
                      onChange={(e) => setNewStaff({ ...newStaff, roleTitle: e.target.value })}
                      placeholder="Senior Barber / Nail Tech"
                      className="h-9 text-xs border-zinc-300"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-medium text-zinc-700 mb-1 block">Staff Login Email *</Label>
                    <Input
                      type="email"
                      value={newStaff.email}
                      onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                      placeholder="victor@barber.ng"
                      className="h-9 text-xs border-zinc-300"
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-zinc-700 mb-1 block">Staff Login Password *</Label>
                    <Input
                      type="text"
                      value={newStaff.password}
                      onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                      placeholder="Set password (e.g. staff123)"
                      className="h-9 text-xs border-zinc-300"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-medium text-zinc-700 mb-1 block">WhatsApp Phone Number</Label>
                  <Input
                    value={newStaff.phone}
                    onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                    placeholder="+234 812 000 2222"
                    className="h-9 text-xs border-zinc-300"
                  />
                </div>

                {/* Multi-Select Assigned Services */}
                <div className="space-y-1.5 pt-1">
                  <Label className="text-xs font-medium text-zinc-700 block">Assign Services to this Staff Member</Label>
                  <div className="grid grid-cols-2 gap-2 bg-zinc-50 border border-zinc-200/80 rounded-lg p-3 max-h-36 overflow-y-auto">
                    {services.length === 0 ? (
                      <span className="text-xs text-zinc-400 italic col-span-2">No services created yet</span>
                    ) : (
                      services.map((service) => {
                        const isChecked = newStaff.assignedServices.includes(service.name);
                        return (
                          <label
                            key={service._id}
                            className={`flex items-center gap-2 p-2 rounded border text-xs cursor-pointer transition-colors ${
                              isChecked
                                ? 'bg-zinc-900 text-white border-zinc-900'
                                : 'bg-white text-zinc-700 border-zinc-200 hover:border-zinc-300'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleService(service.name)}
                              className="hidden"
                            />
                            <Scissors className="w-3.5 h-3.5" />
                            <span className="truncate">{service.name}</span>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    className="w-full bg-zinc-900 text-white hover:bg-zinc-800 rounded-lg h-9 text-xs font-medium shadow-sm"
                  >
                    Create Staff Account
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
