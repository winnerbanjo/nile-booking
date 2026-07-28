import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { serviceApi } from '../lib/api';
import { queryKeys } from '../lib/queryClient';
import { Button } from '../components/ui/button';
import { Plus, Edit, Trash2, Clock, DollarSign, Tag } from 'lucide-react';
import { ServiceForm } from '../components/services/ServiceForm';
import { EmptyState } from '../components/ui/EmptyState';
import { CardListSkeleton } from '../components/ui/SkeletonLoader';
import type { Service } from '../types';

export const Services: React.FC = () => {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);


  const { data: services = [], isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.merchant.services(),
    queryFn: () => serviceApi.getServices(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => serviceApi.deleteService(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.merchant.services() });
      queryClient.invalidateQueries({ queryKey: queryKeys.merchant.dashboard });
    },
    onError: (error: any) => {
      alert('Failed to delete service: ' + (error.message || 'Unknown error'));
    }
  });

  const handleCreate = () => {
    setEditingService(null);
    setShowForm(true);
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return;
    deleteMutation.mutate(id);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingService(null);
  };

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
        {isLoading ? (
          <div className="py-6">
            <CardListSkeleton count={6} />
          </div>
        ) : isError ? (
          <EmptyState 
            type="error"
            title="Failed to load services"
            description="We couldn't retrieve your services. Please check your connection and try again."
            primaryAction={{ label: 'Retry', onClick: () => refetch() }}
          />
        ) : services.length === 0 ? (
          <EmptyState 
            type="empty"
            title="Add your first service"
            description="Create the services customers can book, including the price, duration, category and available staff."
            primaryAction={{ 
              label: 'Add Service', 
              onClick: handleCreate,
              icon: <Plus className="mr-1.5 h-3.5 w-3.5" />
            }}
          />
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
