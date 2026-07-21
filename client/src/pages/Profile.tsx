import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authApi } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Upload, CheckCircle, Building2, MapPin, FileText, ImageIcon, Store, ExternalLink, Share2, Instagram, Phone, Twitter, Facebook } from 'lucide-react';
import { Textarea } from '../components/ui/textarea';
import { Link } from 'react-router-dom';

const LAGOS_LOCATIONS = [
  'Victoria Island',
  'Lekki',
  'Ikeja',
  'Yaba',
  'Surulere',
  'Ikoyi',
  'Ajah',
  'Gbagada',
  'Maryland',
  'Alausa',
];

const PRESET_LOGOS = [
  { name: 'Barber Emblem', url: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=200&h=200&fit=crop' },
  { name: 'Salon Crest', url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=200&h=200&fit=crop' },
  { name: 'Spa Icon', url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=200&h=200&fit=crop' },
  { name: 'Fitness Badge', url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=200&h=200&fit=crop' },
];

const PRESET_BANNERS = [
  { name: 'Barbershop', url: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=1600&h=600&fit=crop' },
  { name: 'Beauty Salon', url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1600&h=600&fit=crop' },
  { name: 'Luxury Spa', url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1600&h=600&fit=crop' },
  { name: 'Fitness & Gym', url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1600&h=600&fit=crop' },
];

export const Profile: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const handleHeaderBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageUrl = reader.result as string;
        setFormData((prev) => ({ ...prev, headerImage: imageUrl }));
      };
      reader.readAsDataURL(file);
    }
  };

  const [formData, setFormData] = useState({
    businessName: '',
    bio: '',
    location: '',
    logo: '',
    profileImage: '',
    headerImage: '',
    socialHandles: {
      instagram: '',
      whatsapp: '',
      twitter: '',
      facebook: '',
    },
  });

  useEffect(() => {
    if (user) {
      setFormData({
        businessName: user.businessName || '',
        bio: user.bio || '',
        location: user.location || '',
        logo: user.logo || PRESET_LOGOS[0].url,
        profileImage: user.profileImage || '',
        headerImage: user.headerImage || PRESET_BANNERS[0].url,
        socialHandles: {
          instagram: user.socialHandles?.instagram || '',
          whatsapp: user.socialHandles?.whatsapp || '',
          twitter: user.socialHandles?.twitter || '',
          facebook: user.socialHandles?.facebook || '',
        },
      });
    }
  }, [user]);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSocialChange = (handleKey: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      socialHandles: {
        ...prev.socialHandles,
        [handleKey]: value,
      },
    }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageUrl = reader.result as string;
        setFormData((prev) => ({ ...prev, logo: imageUrl }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await authApi.updateProfile(formData);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2500);
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      alert('Failed to update profile: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200/80 pb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold text-zinc-900 tracking-tight">
              Storefront Branding & Profile
            </h1>
            <p className="text-sm text-zinc-500 mt-1 font-normal">
              Manage your custom business logo, storefront header banner, and social media handles
            </p>
          </div>
          <Link
            to={`/p/${user?.slug || 'the-modern-barber'}`}
            target="_blank"
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-semibold text-zinc-900 bg-white border border-zinc-300 hover:bg-zinc-50 rounded-lg shadow-sm transition-all self-start md:self-auto"
          >
            <Store className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>View Public Storefront</span>
            <ExternalLink className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          </Link>
        </div>

        {/* Storefront Banner & Logo Preview */}
        <div className="bg-white border border-zinc-200/80 rounded-xl overflow-hidden shadow-sm space-y-6">
          
          {/* Live Header Banner & Merchant Logo Overlay Preview Box */}
          <div className="relative h-48 sm:h-56 bg-zinc-900 overflow-hidden">
            {formData.headerImage ? (
              <img
                src={formData.headerImage}
                alt="Storefront Header Banner"
                className="w-full h-full object-cover opacity-90"
              />
            ) : (
              <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-zinc-400 text-sm">
                No Header Banner Selected
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
            
            {/* Merchant Logo & Business Title Overlay */}
            <div className="absolute bottom-4 left-6 flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl border-2 border-white bg-white overflow-hidden shadow-md">
                {formData.logo ? (
                  <img src={formData.logo} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-zinc-900 text-white font-bold flex items-center justify-center text-xl">
                    {formData.businessName ? formData.businessName.charAt(0) : 'M'}
                  </div>
                )}
              </div>
              <div className="text-white">
                <h3 className="text-lg font-semibold tracking-tight">{formData.businessName || 'My Business Name'}</h3>
                <p className="text-xs text-zinc-200">{formData.location || 'Lagos, Nigeria'}</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            
            {/* Business Logo Customization */}
            <div className="border-b border-zinc-200/80 pb-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
                <div>
                  <Label className="text-xs font-semibold text-zinc-900 uppercase tracking-wider block">
                    Merchant Custom Logo
                  </Label>
                  <p className="text-xs text-zinc-500">
                    Your custom business logo will be displayed prominently on your booking site header and footer.
                  </p>
                </div>
                <div>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => logoInputRef.current?.click()}
                    className="bg-white border-zinc-300 text-zinc-700 hover:bg-zinc-50 rounded-lg h-9 text-xs font-medium"
                  >
                    <Upload className="w-3.5 h-3.5 mr-2 text-zinc-500" />
                    Upload Logo
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <Input
                  type="text"
                  placeholder="https://yourdomain.com/logo.png"
                  value={formData.logo}
                  onChange={(e) => handleInputChange('logo', e.target.value)}
                  className="w-full h-9 rounded-lg border-zinc-300 bg-white text-xs text-zinc-900"
                />

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {PRESET_LOGOS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => handleInputChange('logo', preset.url)}
                      className={`flex items-center gap-2 p-2 rounded-lg border text-left transition-all ${
                        formData.logo === preset.url
                          ? 'border-zinc-900 bg-zinc-900 text-white'
                          : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
                      }`}
                    >
                      <img src={preset.url} alt={preset.name} className="w-7 h-7 rounded object-cover" />
                      <span className="text-[11px] font-medium truncate">{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Header Banner Selection & Custom Upload */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
                <div>
                  <Label className="text-xs font-semibold text-zinc-900 uppercase tracking-wider block flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-emerald-600" />
                    Storefront Header Banner Image
                  </Label>
                  <p className="text-xs text-zinc-500">
                    Upload your high-resolution shop banner or choose a curated industry preset.
                  </p>
                </div>
                <div>
                  <input
                    ref={bannerInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleHeaderBannerUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => bannerInputRef.current?.click()}
                    className="bg-white border-zinc-300 text-zinc-800 hover:bg-zinc-50 rounded-lg h-9 text-xs font-medium shadow-sm"
                  >
                    <Upload className="w-3.5 h-3.5 mr-2 text-emerald-600" />
                    Upload Header Banner
                  </Button>
                </div>
              </div>

              <Input
                type="text"
                placeholder="https://images.unsplash.com/your-header-banner.jpg"
                value={formData.headerImage}
                onChange={(e) => handleInputChange('headerImage', e.target.value)}
                className="w-full h-9 rounded-lg border-zinc-300 bg-white text-xs text-zinc-900 mb-3"
              />

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {PRESET_BANNERS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => handleInputChange('headerImage', preset.url)}
                    className={`relative rounded-lg overflow-hidden border-2 text-left h-16 transition-all ${
                      formData.headerImage === preset.url
                        ? 'border-zinc-900 ring-2 ring-zinc-900/20'
                        : 'border-zinc-200 hover:border-zinc-400'
                    }`}
                  >
                    <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 flex items-end p-1.5">
                      <span className="text-[11px] font-medium text-white">{preset.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Business Information Form */}
        <div className="bg-white border border-zinc-200/80 rounded-xl p-6 shadow-sm space-y-5">
          <h2 className="text-base font-semibold text-zinc-900 border-b border-zinc-200/80 pb-3">
            Business Details
          </h2>

          <div>
            <Label htmlFor="businessName" className="text-xs font-medium text-zinc-700 mb-1.5 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-zinc-500" />
              Business Title
            </Label>
            <Input
              id="businessName"
              type="text"
              placeholder="e.g., The Modern Barber"
              value={formData.businessName}
              onChange={(e) => handleInputChange('businessName', e.target.value)}
              className="w-full h-9 rounded-lg border-zinc-300 bg-white text-xs text-zinc-900"
            />
          </div>

          <div>
            <Label htmlFor="bio" className="text-xs font-medium text-zinc-700 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-zinc-500" />
              About Business
            </Label>
            <Textarea
              id="bio"
              placeholder="Describe your services and specialized client offerings..."
              value={formData.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              rows={3}
              className="w-full rounded-lg border-zinc-300 bg-white text-xs text-zinc-900 resize-none"
            />
          </div>

          <div>
            <Label htmlFor="location" className="text-xs font-medium text-zinc-700 mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-zinc-500" />
              District & Location
            </Label>
            <select
              id="location"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              className="w-full h-9 rounded-lg border border-zinc-300 bg-white px-3 text-xs text-zinc-900"
            >
              <option value="">Select location</option>
              {LAGOS_LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}, Lagos
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Social Media Links Form (Appears in Storefront Footer) */}
        <div className="bg-white border border-zinc-200/80 rounded-xl p-6 shadow-sm space-y-5">
          <div className="border-b border-zinc-200/80 pb-3">
            <h2 className="text-base font-semibold text-zinc-900 flex items-center gap-1.5">
              <Share2 className="w-4 h-4 text-zinc-700" />
              Storefront Footer Social Media Links
            </h2>
            <p className="text-xs text-zinc-500 font-normal">
              These social channels will be linked in your public storefront footer
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-medium text-zinc-700 mb-1.5 flex items-center gap-1.5">
                <Instagram className="w-3.5 h-3.5 text-pink-600" />
                Instagram Handle / URL
              </Label>
              <Input
                type="text"
                placeholder="@themodernbarber"
                value={formData.socialHandles.instagram}
                onChange={(e) => handleSocialChange('instagram', e.target.value)}
                className="w-full h-9 rounded-lg border-zinc-300 text-xs"
              />
            </div>

            <div>
              <Label className="text-xs font-medium text-zinc-700 mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                WhatsApp Number
              </Label>
              <Input
                type="text"
                placeholder="+2348123456789"
                value={formData.socialHandles.whatsapp}
                onChange={(e) => handleSocialChange('whatsapp', e.target.value)}
                className="w-full h-9 rounded-lg border-zinc-300 text-xs"
              />
            </div>

            <div>
              <Label className="text-xs font-medium text-zinc-700 mb-1.5 flex items-center gap-1.5">
                <Twitter className="w-3.5 h-3.5 text-blue-500" />
                Twitter / X Handle
              </Label>
              <Input
                type="text"
                placeholder="@themodernbarber"
                value={formData.socialHandles.twitter}
                onChange={(e) => handleSocialChange('twitter', e.target.value)}
                className="w-full h-9 rounded-lg border-zinc-300 text-xs"
              />
            </div>

            <div>
              <Label className="text-xs font-medium text-zinc-700 mb-1.5 flex items-center gap-1.5">
                <Facebook className="w-3.5 h-3.5 text-blue-700" />
                Facebook Page Name
              </Label>
              <Input
                type="text"
                placeholder="TheModernBarber"
                value={formData.socialHandles.facebook}
                onChange={(e) => handleSocialChange('facebook', e.target.value)}
                className="w-full h-9 rounded-lg border-zinc-300 text-xs"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-200/80 flex justify-end">
            <Button
              onClick={handleSave}
              disabled={loading}
              className="bg-zinc-900 text-white hover:bg-zinc-800 rounded-lg px-6 h-9 text-xs font-medium shadow-sm"
            >
              {loading ? 'Saving Profile...' : 'Save All Branding & Socials'}
            </Button>
          </div>
        </div>

        {/* Success Toast */}
        {showToast && (
          <div className="fixed bottom-6 right-6 bg-zinc-900 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2.5 z-50 text-xs font-medium">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>Storefront Profile Saved Successfully</span>
          </div>
        )}

      </div>
    </div>
  );
};
