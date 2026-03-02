import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authApi } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Upload, CheckCircle, User, Building2, MapPin, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Textarea } from '../components/ui/textarea';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
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

const glassCardClass = "bg-white/40 backdrop-blur-xl border border-white/40 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)]";

const LAGOS_LOCATIONS = [
  'Lekki',
  'Ikeja',
  'Yaba',
  'Victoria Island',
  'Surulere',
  'Ikoyi',
  'Ajah',
  'Gbagada',
  'Maryland',
  'Alausa',
];

export const Profile: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    businessName: '',
    bio: '',
    location: '',
    profileImage: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        businessName: user.businessName || '',
        bio: (user as any).bio || '',
        location: (user as any).location || '',
        profileImage: (user as any).profileImage || '',
      });
      setProfileImage((user as any).profileImage || null);
    }
  }, [user]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // In a real app, upload to cloud storage and get URL
      // For now, create a local preview
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageUrl = reader.result as string;
        setProfileImage(imageUrl);
        setFormData((prev) => ({ ...prev, profileImage: imageUrl }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await authApi.updateProfile(formData);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      alert('Failed to update profile: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#F5F5F7] bg-fixed px-6 md:px-8 py-4 md:py-8">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-4xl mx-auto space-y-6 md:space-y-8"
      >
        {/* Header */}
        <motion.div variants={fadeInUp} className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 tracking-tighter mb-2" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
              Profile & Identity
            </h1>
            <p className="text-base text-gray-600 font-light tracking-tight" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
              Manage your business profile | Public page settings
            </p>
          </div>
        </motion.div>

        {/* Liquid Glass Profile Card */}
        <motion.div variants={fadeInUp} className={glassCardClass}>
          <div className="p-6 md:p-8">
            <h2 className="text-xl font-black text-gray-900 mb-6 tracking-tighter" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
              Business Profile
            </h2>

            <div className="space-y-6">
              {/* Profile Image Upload */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                <div className="relative">
                  {profileImage ? (
                    <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white/40 shadow-lg">
                      <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#22c55e]/20 to-gray-200 border-4 border-white/40 shadow-lg flex items-center justify-center">
                      <User className="w-10 h-10 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <Label className="text-sm font-semibold text-gray-700 mb-2 block">Profile Image</Label>
                  <p className="text-xs text-gray-500 font-light mb-3">
                    Upload your brand logo or profile picture. This will appear on your professional website.
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-full border-gray-300 hover:bg-white/60"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {profileImage ? 'Change Image' : 'Upload Image'}
                  </Button>
                </div>
              </div>

              {/* Business Name */}
              <div>
                <Label htmlFor="businessName" className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Business Name
                </Label>
                <Input
                  id="businessName"
                  type="text"
                  placeholder="e.g., The Modern Barber"
                  value={formData.businessName}
                  onChange={(e) => handleInputChange('businessName', e.target.value)}
                  className="w-full h-12 rounded-xl border-gray-300 bg-white/60 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#22c55e]"
                />
                <p className="text-xs text-gray-500 mt-1 font-light">
                  This is your public business name shown to customers
                </p>
              </div>

              {/* Bio */}
              <div>
                <Label htmlFor="bio" className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Bio
                </Label>
                <Textarea
                  id="bio"
                  placeholder="Tell customers about your expertise, experience, and what makes you unique..."
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  rows={5}
                  className="w-full rounded-xl border-gray-300 bg-white/60 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#22c55e] resize-none"
                />
                <p className="text-xs text-gray-500 mt-1 font-light">
                  Describe your business, expertise, and what clients can expect
                </p>
              </div>

              {/* Lagos Location */}
              <div>
                <Label htmlFor="location" className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Lagos Location
                </Label>
                <select
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className="w-full h-12 rounded-xl border border-gray-300 bg-white/60 px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#22c55e]"
                >
                  <option value="">Select a location</option>
                  {LAGOS_LOCATIONS.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1 font-light">
                  Your business location in Lagos
                </p>
              </div>

              {/* Save Button */}
              <div className="pt-4 border-t border-white/30">
                <Button
                  onClick={handleSave}
                  disabled={loading}
                  className="w-full sm:w-auto rounded-full bg-[#22c55e] text-white hover:bg-green-600 px-8 py-6 h-auto font-semibold"
                >
                  {loading ? 'Saving...' : 'Save Profile'}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Auto-Save Toast */}
        <AnimatePresence>
          {showToast && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed bottom-6 right-6 bg-[#22c55e] text-white px-4 py-3 rounded-full shadow-lg flex items-center gap-2 z-50"
            >
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-semibold">Profile Saved</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
