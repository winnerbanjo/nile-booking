import React, { useState, useEffect } from 'react';
import { serviceApi } from '../lib/api';
import { Button } from '../components/ui/button';
import { Plus, Edit, Trash2, Clock, DollarSign, Tag } from 'lucide-react';
import { ServiceForm } from '../components/services/ServiceForm';
import type { Service } from '../types';

export const Services: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  const sampleServices: Service[] = [
    {
      _id: 'sample-1',
      name: 'Skin Fade',
      description: 'Precision skin fade haircut with detailed edging and hot towel finish.',
      price: 15000,
      duration: 0.75,
      category: 'haircut',
      provider: 'sample-provider',
    },
    {
      _id: 'sample-2',
      name: 'Beard Trim & Shape',
      description: 'Professional beard trimming, shaping, and nourishing oil treatment.',
      price: 8000,
      duration: 0.5,
      category: 'beard',
      provider: 'sample-provider',
    },
    {
      _id: 'sample-3',
      name: 'Full Grooming Package',
      description: 'Complete haircut, beard grooming, facial massage, and styling.',
      price: 25000,
      duration: 1.25,
      category: 'package',
      provider: 'sample-provider',
    },
  ];

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      const data = await serviceApi.getServices();
      setServices(data || []);
    } catch (error) {
      console.error('Failed to load services:', error);
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingService(null);
    setShowForm(true);
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return;
    try {
      await serviceApi.deleteService(id);
      loadServices();
    } catch (error: any) {
      alert('Failed to delete service: ' + (error.message || 'Unknown error'));
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingService(null);
    loadServices();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-3 text-xs text-zinc-500 font-normal">Loading services...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Clean Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200/80 pb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold text-zinc-900 tracking-tight">
              Services Catalog
            </h1>
            <p className="text-sm text-zinc-500 mt-1 font-normal">
              Manage your active service offerings, pricing, and duration
            </p>
          </div>
          <Button
            onClick={handleCreate}
            className="bg-zinc-900 text-white hover:bg-zinc-800 rounded-lg h-9 px-4 text-xs font-medium self-start md:self-auto shadow-sm"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add New Service
          </Button>
        </div>

        {/* Services Cards Grid */}
        {services.length === 0 ? (
          <div className="bg-white border border-zinc-200/80 rounded-xl p-12 text-center">
            <p className="text-zinc-500 text-sm mb-4">No active services configured.</p>
            <Button onClick={handleCreate} className="bg-zinc-900 text-white hover:bg-zinc-800 rounded-lg text-xs font-medium">
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Create First Service
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <div
                key={service._id}
                className="bg-white border border-zinc-200/80 rounded-xl p-5 shadow-sm hover:border-zinc-300 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-base font-semibold text-zinc-900 tracking-tight">
                      {service.name}
                    </h3>
                    <span className="text-sm font-semibold text-zinc-900 bg-zinc-50 px-2.5 py-1 rounded border border-zinc-200">
                      ₦{service.price.toLocaleString()}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-500 font-normal leading-relaxed line-clamp-3 mb-4">
                    {service.description}
                  </p>
                </div>

                <div className="space-y-3 pt-3 border-t border-zinc-100">
                  <div className="flex items-center justify-between text-xs text-zinc-500 font-normal">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-zinc-400" />
                      Duration: {service.duration} {service.duration === 1 ? 'hr' : 'hrs'}
                    </span>
                    {service.category && (
                      <span className="capitalize font-medium text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded text-[11px]">
                        {service.category}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(service)}
                      className="flex-1 bg-white border-zinc-300 text-zinc-700 hover:bg-zinc-50 h-8 text-xs font-medium rounded-lg"
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Edit Details
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(service._id)}
                      className="bg-white border-zinc-300 text-red-600 hover:bg-red-50 hover:border-red-200 h-8 px-2.5 text-xs font-medium rounded-lg"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {showForm && (
          <ServiceForm
            service={editingService}
            onClose={handleFormClose}
          />
        )}
      </div>
    </div>
  );
};
