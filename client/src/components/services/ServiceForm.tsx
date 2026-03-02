import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { serviceApi } from '../../lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select } from '../ui/select';
import { AIOptimizer } from './AIOptimizer';
import type { Service } from '../../types';

const serviceSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  category: z.enum(['cruise', 'hotel', 'tour', 'restaurant', 'transportation', 'other']),
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
          category: service.category,
          price: service.price,
          duration: service.duration,
          capacity: service.capacity,
        }
      : {
          category: 'other',
          capacity: 1,
        },
  });

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
            <AIOptimizer
              currentDescription={watch('description') || ''}
              serviceName={watch('name') || ''}
              category={watch('category') || 'other'}
              onOptimized={(optimized) => setValue('description', optimized)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                {...register('category')}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <option value="cruise">Cruise</option>
                <option value="hotel">Hotel</option>
                <option value="tour">Tour</option>
                <option value="restaurant">Restaurant</option>
                <option value="transportation">Transportation</option>
                <option value="other">Other</option>
              </select>
              {errors.category && (
                <p className="text-sm text-red-600">{errors.category.message}</p>
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
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : service ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
