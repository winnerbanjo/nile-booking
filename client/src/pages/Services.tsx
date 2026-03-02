import React, { useState, useEffect } from 'react';
import { serviceApi } from '../lib/api';
import { Button } from '../components/ui/button';
import { Plus, Edit, Trash2, Sparkles, MessageCircle, Clock, DollarSign, Zap } from 'lucide-react';
import { ServiceForm } from '../components/services/ServiceForm';
import { optimizeServiceDescription } from '../services/aiService';
import type { Service } from '../types';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
};

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.6, -0.05, 0.01, 0.99] },
  },
};

const floatAnimation = {
  y: [-2, 2],
  transition: {
    duration: 3,
    repeat: Infinity,
    repeatType: 'reverse' as const,
    ease: 'easeInOut',
  },
};

const glassCardClass = "bg-white/40 backdrop-blur-xl border border-white/40 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)]";

export const Services: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [optimizingId, setOptimizingId] = useState<string | null>(null);

  // Sample services for "The Modern Barber" and "The Strategy Consultant"
  const sampleServices: Service[] = [
    {
      _id: 'sample-1',
      name: 'Faded Cut',
      description: 'Professional fade cut with precision styling',
      price: 15000,
      duration: 1,
      category: 'haircut',
      provider: 'sample-provider',
    },
    {
      _id: 'sample-2',
      name: '1hr Strategy Session',
      description: 'One-on-one business strategy consultation',
      price: 50000,
      duration: 1,
      category: 'consultation',
      provider: 'sample-provider',
    },
  ];

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      const data = await serviceApi.getServices();
      // Merge with samples if no services exist
      if (data.length === 0) {
        setServices(sampleServices);
      } else {
        setServices(data);
      }
    } catch (error) {
      console.error('Failed to load services:', error);
      // Use samples on error
      setServices(sampleServices);
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

  const handleMagicWrite = async (service: Service) => {
    setOptimizingId(service._id);
    try {
      const optimized = await optimizeServiceDescription(
        service.description || '',
        service.name,
        service.category || 'general'
      );
      
      // Update the service with optimized description
      const updatedService = { ...service, description: optimized };
      await serviceApi.updateService(service._id, updatedService);
      loadServices();
    } catch (error) {
      console.error('Failed to optimize description:', error);
      alert('Failed to optimize description. Please try again.');
    } finally {
      setOptimizingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-[#F5F5F7]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-light">Loading services...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#F5F5F7] bg-fixed p-4 md:p-8">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto space-y-8"
      >
        {/* Header */}
        <motion.div variants={fadeInUp} className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter mb-2" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
              Services
            </h1>
            <p className="text-base text-gray-600 font-light tracking-tight" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
              Manage your service offerings | The Modern Barber
            </p>
          </div>
          <Button
            onClick={handleCreate}
            className="rounded-full bg-gray-900 text-white hover:bg-gray-800 px-6 py-6 h-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Service
          </Button>
        </motion.div>

        {/* Bento Grid of Service Cards */}
        {services.length === 0 ? (
          <motion.div variants={fadeInUp} className={`${glassCardClass} p-12 text-center`}>
            <p className="text-gray-500 mb-4 text-lg font-light">No services yet</p>
            <Button onClick={handleCreate} className="rounded-full bg-gray-900 text-white hover:bg-gray-800">
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Service
            </Button>
          </motion.div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service, index) => (
              <motion.div
                key={service._id}
                variants={fadeInUp}
                animate={floatAnimation}
                transition={{ delay: index * 0.1 }}
                className={`${glassCardClass} p-4 md:p-6 hover:bg-white/50 transition-all duration-300 group`}
                style={{ willChange: 'transform' }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Service Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-black text-gray-900 tracking-tighter mb-2" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
                      {service.name}
                    </h3>
                    <p className="text-sm text-gray-600 font-light leading-relaxed line-clamp-2">
                      {service.description}
                    </p>
                  </div>
                </div>

                {/* Service Details */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <DollarSign className="w-4 h-4" />
                      <span className="font-light">Price</span>
                    </div>
                    <span className="text-xl font-black text-gray-900 tracking-tighter" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
                      ₦{service.price.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span className="font-light">Duration</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-700">
                      {service.duration} {service.duration === 1 ? 'hr' : 'hrs'}
                    </span>
                  </div>
                  {service.category && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 font-light uppercase">Category</span>
                      <span className="text-xs font-semibold text-gray-700 capitalize">{service.category}</span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="space-y-2 pt-4 border-t border-white/30">
                  <motion.div whileTap={{ scale: 0.95 }}>
                    <Button
                      onClick={() => handleMagicWrite(service)}
                      disabled={optimizingId === service._id}
                      className="w-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 h-12 min-h-[48px] py-2 text-xs font-semibold transition-all"
                    >
                    {optimizingId === service._id ? (
                      <>
                        <Zap className="w-3 h-3 mr-1 animate-spin" />
                        Optimizing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3 mr-1" />
                        Magic Write
                      </>
                      )}
                    </Button>
                  </motion.div>
                  <div className="flex items-center gap-2">
                    <motion.div whileTap={{ scale: 0.95 }} className="flex-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full rounded-full border-gray-300 hover:bg-white/60 h-12 min-h-[48px] py-2 text-xs font-semibold"
                        onClick={() => handleEdit(service)}
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                    </motion.div>
                    <motion.div whileTap={{ scale: 0.95 }}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-full border-gray-300 hover:bg-red-50 hover:border-red-300 h-12 min-h-[48px] w-12 px-3 text-xs"
                        onClick={() => handleDelete(service._id)}
                      >
                        <Trash2 className="w-3 h-3 text-red-500" />
                      </Button>
                    </motion.div>
                    <motion.div whileTap={{ scale: 0.95 }}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-full border-gray-300 hover:bg-white/60 h-12 min-h-[48px] w-12 px-3 text-xs"
                        title="WhatsApp Preview"
                      >
                        <MessageCircle className="w-3 h-3" />
                      </Button>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {showForm && (
          <ServiceForm
            service={editingService}
            onClose={handleFormClose}
          />
        )}
      </motion.div>
    </div>
  );
};
