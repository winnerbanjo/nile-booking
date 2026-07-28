import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { serviceApi, categoryApi } from '../../lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Plus, X } from 'lucide-react';
import type { Service } from '../../types';

const serviceSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  categoryId: z.string().nullable().optional(),
  category: z.string().optional(),
  price: z.number().min(0, 'Price must be positive'),
  duration: z.number().min(0.5, 'Duration must be at least 0.5 hours'),
  capacity: z.number().min(1).optional().default(1),
});

type ServiceFormData = z.infer<typeof serviceSchema>;

interface ServiceFormProps {
  service?: Service | null;
  onClose: () => void;
}

export const ServiceForm: React.FC<ServiceFormProps> = ({ service, onClose }) => {
  const queryClient = useQueryClient();
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  const { data: catData, isLoading: catLoading, isError: catError } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryApi.getCategories,
  });
  const categories = catData?.data || [];

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: service
      ? {
          name: service.name,
          description: service.description,
          categoryId: service.categoryId || null,
          category: service.category || 'other',
          price: service.price,
          duration: service.duration,
          capacity: service.capacity,
        }
      : {
          categoryId: null,
          category: 'other',
          capacity: 1,
        },
  });

  const categoryIdValue = watch('categoryId');

  const createCatMutation = useMutation({
    mutationFn: categoryApi.createCategory,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      if (res?.data?._id) {
        setValue('categoryId', res.data._id);
      }
      setIsCreatingCategory(false);
      setNewCatName('');
    },
    onError: (err: any) => alert(err.message),
  });

  const handleCreateCategory = () => {
    if (newCatName.trim()) {
      createCatMutation.mutate({ name: newCatName });
    }
  };

  const onSubmit = async (data: ServiceFormData) => {
    try {
      if (service) {
        await serviceApi.updateService(service._id, data);
      } else {
        await serviceApi.createService(data);
      }
      onClose();
    } catch (error: any) {
      alert('Failed to save service: ' + (error.message || 'Unknown error'));
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{service ? 'Edit Service' : 'Create New Service'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Service Name</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="e.g., Nile Cruise Tour"
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              {...register('description')}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Describe your service..."
            />
            {errors.description && (
              <p className="text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="categoryId">Category</Label>
              {isCreatingCategory ? (
                <div className="flex gap-2 items-center">
                  <Input
                    autoFocus
                    placeholder="New category name"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="h-10 text-sm flex-1"
                  />
                  <Button type="button" size="sm" onClick={handleCreateCategory} disabled={createCatMutation.isPending} className="h-10">Save</Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => setIsCreatingCategory(false)} className="h-10 px-2"><X className="w-4 h-4" /></Button>
                </div>
              ) : (
                <select
                  id="categoryId"
                  value={categoryIdValue || ''}
                  onChange={(e) => {
                    if (e.target.value === 'CREATE_NEW') {
                      setIsCreatingCategory(true);
                    } else {
                      setValue('categoryId', e.target.value || null);
                    }
                  }}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value="">No category</option>
                  {categories.map((cat: any) => (
                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                  ))}
                  <option value="CREATE_NEW" className="text-blue-600 font-semibold">+ Create New Category</option>
                </select>
              )}
              {catLoading && <p className="text-xs text-gray-500">Loading categories...</p>}
              {categories.length === 0 && !catLoading && !isCreatingCategory && (
                <p className="text-xs text-gray-500">You have not created any categories yet. Create one or save without.</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="capacity">Capacity</Label>
              <Input
                id="capacity"
                type="number"
                min="1"
                {...register('capacity', { valueAsNumber: true })}
              />
              {errors.capacity && (
                <p className="text-sm text-red-600">{errors.capacity.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price ($)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                {...register('price', { valueAsNumber: true })}
              />
              {errors.price && (
                <p className="text-sm text-red-600">{errors.price.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration (hours)</Label>
              <Input
                id="duration"
                type="number"
                step="0.5"
                min="0.5"
                {...register('duration', { valueAsNumber: true })}
              />
              {errors.duration && (
                <p className="text-sm text-red-600">{errors.duration.message}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || createCatMutation.isPending}>
              {isSubmitting ? 'Saving...' : service ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
