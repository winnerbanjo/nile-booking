import React, { useState, useEffect, useRef } from 'react';
import { GalleryHorizontal, Plus, Trash2, X, Upload, Link as LinkIcon } from 'lucide-react';
import { portfolioApi, serviceApi } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

export const Portfolio: React.FC = () => {
  const { user, setUser } = useAuth();
  const [gallery, setGallery] = useState<any[]>((user as any)?.gallery || []);
  const [services, setServices] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [form, setForm] = useState({ caption: '', serviceId: '', imageData: '' });
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { serviceApi.getServices().then(setServices).catch(() => {}); }, []);
  useEffect(() => { if ((user as any)?.gallery) setGallery((user as any).gallery); }, [user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('Image must be under 5MB'); return; }
    const reader = new FileReader();
    reader.onloadend = () => { const r = reader.result as string; setPreviewUrl(r); setForm(f => ({ ...f, imageData: r })); };
    reader.readAsDataURL(file);
  };

  const closeModal = () => { setShowAddModal(false); setPreviewUrl(null); setForm({ caption: '', serviceId: '', imageData: '' }); };

  const handleAdd = async () => {
    if (!form.imageData) { alert('Please select an image'); return; }
    setUploading(true);
    try {
      const res = await portfolioApi.addItem({ url: form.imageData, caption: form.caption, serviceId: form.serviceId || null, alt: form.caption || 'Portfolio image' });
      setGallery(res.gallery);
      if (user) { const updated = { ...user, gallery: res.gallery }; setUser(updated as any); localStorage.setItem('nile_user', JSON.stringify(updated)); }
      closeModal();
    } catch (e: any) { alert(e.message || 'Failed to upload image'); } finally { setUploading(false); }
  };

  const handleDelete = async (index: number) => {
    if (!window.confirm('Remove this portfolio item?')) return;
    setDeletingIndex(index);
    try {
      const res = await portfolioApi.deleteItem(index);
      setGallery(res.gallery);
      if (user) { const updated = { ...user, gallery: res.gallery }; setUser(updated as any); localStorage.setItem('nile_user', JSON.stringify(updated)); }
    } catch (e: any) { alert(e.message || 'Failed to delete item'); } finally { setDeletingIndex(null); }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between border-b border-zinc-200/80 pb-6">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight flex items-center gap-2">
            <GalleryHorizontal className="w-6 h-6 text-zinc-700" /> Portfolio Gallery
          </h1>
          <p className="text-xs text-zinc-500 font-normal mt-1">Showcase your best work. Customers see these with a Book button on your public page.</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 transition-colors">
          <Plus className="w-4 h-4" /> Add Photo
        </button>
      </div>

      {gallery.length === 0 ? (
        <div className="bg-white border border-zinc-200/80 rounded-xl p-14 text-center shadow-sm">
          <div className="w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center mx-auto mb-4"><GalleryHorizontal className="w-8 h-8 text-zinc-400" /></div>
          <h3 className="text-base font-semibold text-zinc-900 mb-2">No portfolio photos yet</h3>
          <p className="text-xs text-zinc-500 max-w-xs mx-auto mb-5">Upload photos of your work to build trust with customers and showcase your style.</p>
          <button onClick={() => setShowAddModal(true)} className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-zinc-900 rounded-lg hover:bg-zinc-800">
            <Plus className="w-4 h-4" /> Upload First Photo
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {gallery.map((item: any, i: number) => {
            const linked = services.find((s: any) => s._id === item.serviceId?.toString());
            return (
              <div key={i} className="group relative bg-white border border-zinc-200/80 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="aspect-square bg-zinc-100 overflow-hidden">
                  <img src={item.url} alt={item.alt || item.caption || `Portfolio ${i+1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onError={(e) => { (e.target as HTMLImageElement).src='https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&h=400&fit=crop'; }} />
                </div>
                <button onClick={() => handleDelete(i)} disabled={deletingIndex === i} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 disabled:opacity-40">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <div className="p-3">
                  {item.caption && <p className="text-xs text-zinc-700 font-medium truncate mb-1">{item.caption}</p>}
                  {linked ? (
                    <div className="flex items-center gap-1 text-[11px] text-emerald-700"><LinkIcon className="w-3 h-3" /><span className="truncate">{linked.name}</span></div>
                  ) : !item.caption ? <p className="text-[11px] text-zinc-400">No caption</p> : null}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-zinc-900">Add Portfolio Photo</h2>
              <button onClick={closeModal} className="p-1.5 rounded-lg hover:bg-zinc-100"><X className="w-4 h-4 text-zinc-500" /></button>
            </div>
            <div onClick={() => fileRef.current?.click()} className="border-2 border-dashed border-zinc-200 rounded-xl aspect-video cursor-pointer overflow-hidden bg-zinc-50 hover:border-zinc-400 transition-colors flex items-center justify-center">
              {previewUrl ? <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" /> : (
                <div className="text-center space-y-2"><Upload className="w-8 h-8 text-zinc-400 mx-auto" /><p className="text-xs text-zinc-500">Click to upload image (max 5MB)</p></div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-700">Caption</label>
              <input type="text" value={form.caption} onChange={e => setForm(f => ({ ...f, caption: e.target.value }))} placeholder="E.g. Fresh skin fade with lineup" className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-700">Link to Service (optional)</label>
              <select value={form.serviceId} onChange={e => setForm(f => ({ ...f, serviceId: e.target.value }))} className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white">
                <option value="">No service link</option>
                {services.map((s: any) => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
              <p className="text-[11px] text-zinc-400">When linked, a Book button appears on this image in your public gallery</p>
            </div>
            <div className="flex items-center gap-3 pt-1">
              <button onClick={closeModal} className="flex-1 px-4 py-2 text-sm font-medium text-zinc-700 bg-zinc-100 rounded-lg hover:bg-zinc-200">Cancel</button>
              <button onClick={handleAdd} disabled={uploading || !form.imageData} className="flex-1 px-4 py-2 text-sm font-medium text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 disabled:opacity-50">{uploading ? 'Uploading...' : 'Save Photo'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
