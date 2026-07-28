import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoryApi } from '../../lib/api';
import { Plus, Edit2, Trash2, GripVertical, Save, X, AlertCircle } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { queryKeys } from '../../lib/queryClient';
import { EmptyState } from '../../components/ui/EmptyState';
import { TableSkeleton } from '../../components/ui/SkeletonLoader';

export const Categories = () => {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [isReordering, setIsReordering] = useState(false);
  
  // Modals state for deletion
  const [deleteCatId, setDeleteCatId] = useState<string | null>(null);
  const [deleteAction, setDeleteAction] = useState<'delete' | 'move' | 'uncategorize'>('delete');
  const [targetCatId, setTargetCatId] = useState<string>('');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.merchant.categories,
    queryFn: categoryApi.getCategories,
  });

  const categories = data?.data || [];

  const createMutation = useMutation({
    mutationFn: categoryApi.createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.merchant.categories });
      setIsCreating(false);
      setNewCatName('');
    },
    onError: (err: any) => alert(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => categoryApi.updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.merchant.categories });
      setEditingId(null);
    },
    onError: (err: any) => alert(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: ({ id, actionData }: { id: string; actionData?: any }) => categoryApi.deleteCategory(id, actionData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.merchant.categories });
      setDeleteCatId(null);
    },
    onError: (err: any) => alert(err.message),
  });

  const reorderMutation = useMutation({
    mutationFn: categoryApi.reorderCategories,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.merchant.categories }),
    onError: (err: any) => alert(err.message),
  });

  const handleCreate = () => {
    if (newCatName.trim()) {
      createMutation.mutate({ name: newCatName });
    }
  };

  const handleUpdate = (id: string) => {
    if (editName.trim()) {
      updateMutation.mutate({ id, data: { name: editName } });
    }
  };

  const handleDeleteInitiate = (cat: any) => {
    if (cat.serviceCount > 0) {
      setDeleteCatId(cat._id);
      setDeleteAction('uncategorize');
    } else {
      if (confirm('Are you sure you want to delete this category?')) {
        deleteMutation.mutate({ id: cat._id, actionData: { action: 'delete' } });
      }
    }
  };

  const confirmDeleteWithServices = () => {
    if (deleteAction === 'move' && !targetCatId) {
      alert('Please select a target category');
      return;
    }
    deleteMutation.mutate({
      id: deleteCatId!,
      actionData: { action: deleteAction, targetCategoryId: targetCatId }
    });
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newCats = [...categories];
    [newCats[index - 1], newCats[index]] = [newCats[index], newCats[index - 1]];
    const payload = newCats.map((c, i) => ({ id: c._id, sortOrder: i }));
    reorderMutation.mutate(payload);
  };

  const moveDown = (index: number) => {
    if (index === categories.length - 1) return;
    const newCats = [...categories];
    [newCats[index + 1], newCats[index]] = [newCats[index], newCats[index + 1]];
    const payload = newCats.map((c, i) => ({ id: c._id, sortOrder: i }));
    reorderMutation.mutate(payload);
  };



  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Service Categories</h2>
          <p className="text-sm text-gray-500">Organise your services to help customers find what they need.</p>
        </div>
        <Button onClick={() => setIsCreating(true)} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="w-4 h-4 mr-2" />
          Create Category
        </Button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50/50 text-xs uppercase text-gray-500 font-bold border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 w-12"></th>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Services</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-4">
                    <TableSkeleton rows={4} columns={5} />
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={5} className="p-0">
                    <EmptyState 
                      type="error"
                      title="Failed to load categories"
                      description="We couldn't retrieve your service categories."
                      primaryAction={{ label: 'Retry', onClick: () => refetch() }}
                    />
                  </td>
                </tr>
              ) : categories.length === 0 && !isCreating ? (
                <tr>
                  <td colSpan={5} className="p-0">
                    <EmptyState 
                      type="empty"
                      title="Organise your services"
                      description="Create categories such as Bridal Makeup, Lash Refills or Consultations so customers can find the right service faster."
                      primaryAction={{ label: 'Create Category', onClick: () => setIsCreating(true), icon: <Plus className="w-4 h-4 mr-2" /> }}
                    />
                  </td>
                </tr>
              ) : (
                <>
                  {isCreating && (
                    <tr className="bg-emerald-50/30">
                      <td className="px-6 py-4"></td>
                      <td className="px-6 py-4">
                        <Input
                          autoFocus
                          value={newCatName}
                          onChange={(e) => setNewCatName(e.target.value)}
                          placeholder="e.g. Volume Lashes"
                          className="h-8 text-sm"
                        />
                      </td>
                      <td colSpan={3} className="px-6 py-4 text-right">
                        <Button size="sm" onClick={handleCreate} disabled={createMutation.isPending} className="mr-2 h-8">Save</Button>
                        <Button size="sm" variant="ghost" onClick={() => setIsCreating(false)} className="h-8">Cancel</Button>
                      </td>
                    </tr>
                  )}
                  {categories.map((cat: any, index: number) => (
                    <tr key={cat._id} className="hover:bg-gray-50 group">
                      <td className="px-6 py-4 text-gray-300 group-hover:text-gray-500">
                        <div className="flex flex-col gap-1 items-center">
                          <button onClick={() => moveUp(index)} disabled={index === 0} className="hover:text-gray-900 disabled:opacity-30">▲</button>
                          <button onClick={() => moveDown(index)} disabled={index === categories.length - 1} className="hover:text-gray-900 disabled:opacity-30">▼</button>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {editingId === cat._id ? (
                          <div className="flex items-center gap-2">
                            <Input
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="h-8 text-sm w-48"
                            />
                            <Button size="sm" onClick={() => handleUpdate(cat._id)} disabled={updateMutation.isPending} className="h-8">Save</Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} className="h-8">Cancel</Button>
                          </div>
                        ) : (
                          cat.name
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {cat.serviceCount} services
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => updateMutation.mutate({ id: cat._id, data: { isActive: !cat.isActive } })}
                          className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold ${
                            cat.isActive ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {cat.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => { setEditingId(cat._id); setEditName(cat.name); }} 
                          className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors mr-2"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteInitiate(cat)} 
                          className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {deleteCatId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900">Category contains services</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Choose what should happen to these services before deleting the category.
                </p>

                <div className="mt-4 space-y-3">
                  <label className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="deleteAction"
                      checked={deleteAction === 'uncategorize'}
                      onChange={() => setDeleteAction('uncategorize')}
                      className="text-red-600"
                    />
                    <span className="text-sm font-medium text-gray-700">Leave services uncategorised</span>
                  </label>
                  
                  <label className="flex flex-col gap-2 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="deleteAction"
                        checked={deleteAction === 'move'}
                        onChange={() => setDeleteAction('move')}
                        className="text-red-600"
                      />
                      <span className="text-sm font-medium text-gray-700">Move services to another category</span>
                    </div>
                    {deleteAction === 'move' && (
                      <select
                        value={targetCatId}
                        onChange={(e) => setTargetCatId(e.target.value)}
                        className="w-full mt-2 p-2 border border-gray-300 rounded-md text-sm"
                      >
                        <option value="">Select target category</option>
                        {categories.filter((c: any) => c._id !== deleteCatId).map((c: any) => (
                          <option key={c._id} value={c._id}>{c.name}</option>
                        ))}
                      </select>
                    )}
                  </label>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setDeleteCatId(null)}>Cancel</Button>
                  <Button 
                    variant="destructive" 
                    onClick={confirmDeleteWithServices}
                    disabled={deleteMutation.isPending}
                  >
                    Delete Category
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
