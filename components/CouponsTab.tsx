import React, { useState, useEffect } from 'react';
import { couponsAPI } from '../utils/api';
import { Coupon } from '../types';
import { toast } from 'sonner';

interface CouponsTabProps {
    onDeleteCoupon?: (id: string) => Promise<void>;
}

export const CouponsTab: React.FC<CouponsTabProps> = ({ onDeleteCoupon }) => {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    
    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
    const [formData, setFormData] = useState<Partial<Coupon>>(() => ({
        code: '',
        type: 'percentage',
        value: 10,
        isActive: true,
        minimumAmount: 0,
        usageLimit: 100,
        startsAt: new Date().toISOString().split('T')[0],
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    }));

    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchCoupons();
    }, []);

    const fetchCoupons = async () => {
        try {
            setIsLoading(true);
            const data = await couponsAPI.getAll();
            setCoupons(data.coupons || []);
            setError(null);
        } catch (err: any) {
            console.error('Failed to fetch coupons', err);
            setError('Failed to load coupons. Please check your connection.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerateCode = () => {
        const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 8; i++) {
            result += charset.charAt(Math.floor(Math.random() * charset.length));
        }
        setFormData({ ...formData, code: result });
    };

    const handleSaveCoupon = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setIsGenerating(true);
            setError(null);
            
            // Format dates properly for backend
            const payload = {
                ...formData,
                value: Number(formData.value),
                minimumAmount: Number(formData.minimumAmount),
                usageLimit: Number(formData.usageLimit),
                startsAt: new Date(formData.startsAt as string).toISOString(),
                expiresAt: new Date(formData.expiresAt as string).toISOString()
            };

            if (editingCoupon) {
                await couponsAPI.update(editingCoupon.id, payload);
            } else {
                await couponsAPI.create(payload);
            }
            
            setIsModalOpen(false);
            fetchCoupons(); // Refresh list
        } catch (err: any) {
            console.error('Failed to save coupon', err);
            setError(err.response?.data?.message || 'Failed to save coupon');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (onDeleteCoupon) {
            await onDeleteCoupon(id);
            fetchCoupons();
            return;
        }

        // Fallback if prop not provided (though we should always provide it in Admin)
        try {
            await couponsAPI.delete(id);
            toast.success('Coupon deleted successfully');
            fetchCoupons();
        } catch (err) {
            console.error('Failed to delete coupon', err);
            toast.error('Failed to delete coupon');
        }
    };

    const toggleStatus = async (coupon: Coupon) => {
        try {
            await couponsAPI.update(coupon.id, { isActive: !coupon.isActive });
            fetchCoupons();
        } catch (err) {
            console.error('Failed to update status', err);
        }
    };

    const openModal = (coupon?: Coupon) => {
        if (coupon) {
            setEditingCoupon(coupon);
            setFormData({
                ...coupon,
                startsAt: coupon.startsAt.split('T')[0],
                expiresAt: coupon.expiresAt.split('T')[0]
            });
        } else {
            setEditingCoupon(null);
            setFormData({
                code: '',
                type: 'percentage',
                value: 10,
                isActive: true,
                minimumAmount: 0,
                usageLimit: 100,
                startsAt: new Date().toISOString().split('T')[0],
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            });
        }
        setIsModalOpen(true);
    };

    const filteredCoupons = coupons.filter(c => 
        c.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="animate-fade-in space-y-6 p-4">
            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3">
                    <i className="fas fa-exclamation-circle text-xl"></i>
                    <p className="font-medium">{error}</p>
                    <button onClick={() => setError(null)} className="ml-auto"><i className="fas fa-times"></i></button>
                </div>
            )}

            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white dark:bg-surface-dark p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <i className="fas fa-ticket-alt text-primary"></i> Coupons & Discounts
                </h2>
                <div className="flex gap-4 w-full sm:w-auto">
                    <div className="relative w-full max-w-md group max-w-xs">
                        <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                        <input
                            type="text"
                            placeholder="Search by code..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 focus:ring-2 focus:ring-primary/20"
                        />
                    </div>
                    <button 
                        onClick={() => openModal()} 
                        className="bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg hover:bg-pink-700 transition"
                    >
                        <i className="fas fa-plus mr-2"></i> Add Coupon
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-gray-800 text-xs text-gray-500 uppercase font-bold tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Code</th>
                                <th className="px-6 py-4">Discount</th>
                                <th className="px-6 py-4">Usage</th>
                                <th className="px-6 py-4">Expiry</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        <i className="fas fa-spinner fa-spin text-3xl mb-4 text-primary"></i>
                                        <p>Loading coupons...</p>
                                    </td>
                                </tr>
                            ) : filteredCoupons.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        <i className="fas fa-ticket-alt text-4xl mb-4 opacity-50"></i>
                                        <p className="font-medium">No coupons found</p>
                                        <button onClick={() => openModal()} className="mt-4 text-primary hover:underline">Create your first coupon</button>
                                    </td>
                                </tr>
                            ) : filteredCoupons.map(coupon => (
                                <tr key={coupon.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                    <td className="px-6 py-4">
                                        <button 
                                            onClick={() => toggleStatus(coupon)}
                                            className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${coupon.isActive ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                                        >
                                            <span className={`inline-block w-4 h-4 transform transition-transform bg-white rounded-full ${coupon.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 font-mono font-bold text-gray-900 dark:text-white tracking-wider">
                                        {coupon.code}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${coupon.type === 'percentage' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                                            {coupon.type === 'percentage' ? `${coupon.value}% OFF` : `₹${coupon.value} OFF`}
                                        </span>
                                        {coupon.minimumAmount > 0 && <div className="text-xs text-gray-500 mt-1">Min: ₹{coupon.minimumAmount}</div>}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-primary" 
                                                    style={{ width: `${Math.min((coupon.usageCount / (coupon.usageLimit || 1)) * 100, 100)}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                                {coupon.usageCount} / {coupon.usageLimit || '∞'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-gray-900 dark:text-white">
                                            {new Date(coupon.expiresAt).toLocaleDateString()}
                                        </div>
                                        {new Date(coupon.expiresAt) < new Date() && (
                                            <span className="text-xs text-red-500 font-medium">Expired</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-2 justify-end">
                                            <button onClick={() => openModal(coupon)} className="w-8 h-8 rounded border border-gray-200 text-gray-500 hover:text-primary hover:border-primary flex items-center justify-center transition" title="Edit">
                                                <i className="fas fa-pen text-xs"></i>
                                            </button>
                                            <button onClick={() => handleDelete(coupon.id)} className="w-8 h-8 rounded border border-gray-200 text-gray-500 hover:text-red-500 hover:border-red-500 flex items-center justify-center transition" title="Delete">
                                                <i className="fas fa-trash text-xs"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-scale-in">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                {editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition">
                                <i className="fas fa-times text-xl"></i>
                            </button>
                        </div>
                        
                        <form onSubmit={handleSaveCoupon} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                            <div className="space-y-1">
                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Coupon Code</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        required 
                                        value={formData.code}
                                        onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                                        className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 font-mono tracking-wider uppercase text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        placeholder="E.g. SUMMER20"
                                    />
                                    <button 
                                        type="button" 
                                        onClick={handleGenerateCode}
                                        className="px-4 py-2 bg-gray-100 text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-200 font-medium transition dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-600"
                                    >
                                        Generate
                                    </button>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Discount Type</label>
                                    <select 
                                        value={formData.type}
                                        onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    >
                                        <option value="percentage">Percentage (%)</option>
                                        <option value="fixed">Fixed Amount (₹)</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Discount Value</label>
                                    <input 
                                        type="number" 
                                        required 
                                        min="1"
                                        max={formData.type === 'percentage' ? 100 : 999999}
                                        value={formData.value}
                                        onChange={(e) => setFormData({...formData, value: Number(e.target.value)})}
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Minimum Cart Amount (₹)</label>
                                    <input 
                                        type="number" 
                                        min="0"
                                        value={formData.minimumAmount}
                                        onChange={(e) => setFormData({...formData, minimumAmount: Number(e.target.value)})}
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Total Usage Limit</label>
                                    <input 
                                        type="number" 
                                        min="1"
                                        value={formData.usageLimit}
                                        onChange={(e) => setFormData({...formData, usageLimit: Number(e.target.value)})}
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 border-t border-gray-100 dark:border-gray-700 pt-4 mt-2">
                                <div className="space-y-1">
                                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Start Date</label>
                                    <input 
                                        type="date" 
                                        required
                                        value={formData.startsAt as string}
                                        onChange={(e) => setFormData({...formData, startsAt: e.target.value})}
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Expiry Date</label>
                                    <input 
                                        type="date" 
                                        required
                                        min={formData.startsAt as string}
                                        value={formData.expiresAt as string}
                                        onChange={(e) => setFormData({...formData, expiresAt: e.target.value})}
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-3 pt-2">
                                <input 
                                    type="checkbox" 
                                    id="isActive" 
                                    checked={formData.isActive}
                                    onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                                    className="w-5 h-5 text-primary rounded border-gray-300 focus:ring-primary"
                                />
                                <label htmlFor="isActive" className="font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                                    Activate Coupon Immediately
                                </label>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-6 py-3 border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isGenerating}
                                    className="flex-1 px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-pink-700 shadow-lg shadow-primary/30 transition disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isGenerating ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-save"></i>}
                                    {editingCoupon ? 'Update Coupon' : 'Create Coupon'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
