import React, { useState } from 'react';
import { ProductBadge, HomepageSettings, Category, BrandProfile, HeroSlide, PromotionalTile } from '../types';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { SortableItem } from './SortableItem';

interface HomepageTabProps {
    homepageSettings: HomepageSettings;
    setHomepageSettings: React.Dispatch<React.SetStateAction<HomepageSettings>>;
    categories: Category[];
    brands: BrandProfile[];
    // Hero Slides Props
    heroSlides: HeroSlide[];
    onAddHeroSlide: (slide: HeroSlide) => void;
    onUpdateHeroSlide: (slide: HeroSlide) => void;
    onDeleteHeroSlide: (id: number) => void;
    onReorderHeroSlides: (slides: HeroSlide[]) => void;
    // Promotional Tiles Props
    promotionalTiles: PromotionalTile[];
    onUpdatePromotionalTile: (tile: PromotionalTile) => void;
    // Featured Brands Props
    onToggleBrandFeatured: (brandId: number, isFeatured: boolean) => void;
    onReorderFeaturedBrands: (brands: BrandProfile[]) => void;
    // Save Settings
    onSaveSettings?: (settings: HomepageSettings) => Promise<void>;
}


export const HomepageTab: React.FC<HomepageTabProps> = ({
    homepageSettings,
    setHomepageSettings,
    categories,
    brands,
    heroSlides,
    onAddHeroSlide,
    onUpdateHeroSlide,
    onDeleteHeroSlide,
    onReorderHeroSlides,
    promotionalTiles,
    onUpdatePromotionalTile,
    onToggleBrandFeatured,
    onReorderFeaturedBrands,
    onSaveSettings
}) => {
    const [isSaving, setIsSaving] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const [activeSection, setActiveSection] = useState<'hero' | 'promotions' | 'brands' | 'badges' | 'categories'>('hero');

    // --- Hero Slide State ---
    const [isHeroModalOpen, setIsHeroModalOpen] = useState(false);
    const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null);
    const [slideFormData, setSlideFormData] = useState<Partial<HeroSlide>>({
        badge: 'NEW ARRIVAL',
        title: '',
        subtitle: '',
        image: '',
        bgClass: 'bg-blue-50 dark:bg-gray-800',
        gradientClass: 'from-blue-50 via-blue-50/80',
        isActive: true
    });

    // --- Hero Slide Handlers ---
    const handleEditSlide = (slide: HeroSlide) => {
        setEditingSlide(slide);
        setSlideFormData(slide);
        setIsHeroModalOpen(true);
    };

    const handleAddSlide = () => {
        setEditingSlide(null);
        setSlideFormData({
            badge: 'NEW ARRIVAL',
            title: '',
            subtitle: '',
            image: '',
            bgClass: 'bg-blue-50 dark:bg-gray-800',
            gradientClass: 'from-blue-50 via-blue-50/80',
            isActive: true,
            order: heroSlides.length
        });
        setIsHeroModalOpen(true);
    };

    const saveSlide = () => {
        if (editingSlide) {
            onUpdateHeroSlide({ ...editingSlide, ...slideFormData } as HeroSlide);
        } else {
            onAddHeroSlide({ ...slideFormData, id: Date.now() } as HeroSlide);
        }
        setIsHeroModalOpen(false);
    };

    const handleSlideImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setSlideFormData({ ...slideFormData, image: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDragEndHero = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = heroSlides.findIndex((s) => s.id === active.id);
            const newIndex = heroSlides.findIndex((s) => s.id === over.id);
            onReorderHeroSlides(arrayMove(heroSlides, oldIndex, newIndex));
        }
    };

    const handleDragEndBrands = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = featuredBrands.findIndex((b) => b.id === active.id);
            const newIndex = featuredBrands.findIndex((b) => b.id === over.id);
            onReorderFeaturedBrands(arrayMove(featuredBrands, oldIndex, newIndex));
        }
    };

    // --- Promotional Tile Handlers ---
    const handleTileImageUpload = (id: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const tile = promotionalTiles.find(t => t.id === id);
                if (tile) {
                    onUpdatePromotionalTile({ ...tile, image: reader.result as string });
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const updateTileField = (id: number, field: keyof PromotionalTile, value: any) => {
        const tile = promotionalTiles.find(t => t.id === id);
        if (tile) {
            onUpdatePromotionalTile({ ...tile, [field]: value });
        }
    };

    // --- Badge Management ---
    const updateBadge = (badgeId: ProductBadge['id'], updates: Partial<ProductBadge>) => {
        setHomepageSettings(prev => ({
            ...prev,
            badges: (prev?.badges || []).map(badge =>
                badge.id === badgeId ? { ...badge, ...updates } : badge
            )
        }));
    };

    // --- Category Management ---
    const toggleCategory = (categoryName: string) => {
        setHomepageSettings(prev => ({
            ...prev,
            showcaseCategories: (prev?.showcaseCategories || []).includes(categoryName)
                ? (prev?.showcaseCategories || []).filter(c => c !== categoryName)
                : [...(prev?.showcaseCategories || []), categoryName]
        }));
    };

    const handleDragEndCategories = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = (homepageSettings?.showcaseCategories || []).indexOf(active.id as string);
            const newIndex = (homepageSettings?.showcaseCategories || []).indexOf(over.id as string);
            setHomepageSettings(prev => ({
                ...prev,
                showcaseCategories: arrayMove(prev?.showcaseCategories || [], oldIndex, newIndex)
            }));
        }
    };

    const handleSave = async () => {
        if (!onSaveSettings) return;
        setIsSaving(true);
        try {
            await onSaveSettings(homepageSettings);
        } finally {
            setIsSaving(false);
        }
    };


    // --- Featured Brand Management ---
    // Filter brands to show only featured ones for the "Selected" list
    const featuredBrands = brands.filter(b => b.isFeatured).sort((a, b) => (a.featuredOrder || 0) - (b.featuredOrder || 0));

    return (
        <div className="animate-fade-in space-y-6 px-6 pb-20">
            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-6 text-white shadow-lg shadow-indigo-500/30">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-indigo-100 text-sm font-medium mb-1">Hero Slides</p>
                            <h3 className="text-3xl font-bold">{heroSlides.length}</h3>
                        </div>
                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                            <i className="fas fa-images text-2xl"></i>
                        </div>
                    </div>
                </div>
                <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl p-6 text-white shadow-lg shadow-pink-500/30">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-pink-100 text-sm font-medium mb-1">Collection of brands</p>
                            <h3 className="text-3xl font-bold">{featuredBrands.length}</h3>
                        </div>
                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                            <i className="fas fa-certificate text-2xl"></i>
                        </div>
                    </div>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg shadow-purple-500/30">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-purple-100 text-sm font-medium mb-1">Promotions</p>
                            <h3 className="text-3xl font-bold">{promotionalTiles.filter(t => t.isActive).length}/3</h3>
                        </div>
                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                            <i className="fas fa-ad text-2xl"></i>
                        </div>
                    </div>
                </div>
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg shadow-blue-500/30">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-100 text-sm font-medium mb-1">Active Badges</p>
                            <h3 className="text-3xl font-bold">{(homepageSettings?.badges || []).filter(b => b.enabled).length}/3</h3>
                        </div>
                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                            <i className="fas fa-tag text-2xl"></i>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-2 overflow-x-auto">
                <div className="flex gap-2 min-w-max">
                    <button onClick={() => setActiveSection('hero')} className={`px-6 py-3 font-semibold rounded-lg transition-all ${activeSection === 'hero' ? 'bg-primary text-white shadow-md' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50'}`}><i className="fas fa-images mr-2"></i>Hero Slider</button>
                    <button onClick={() => setActiveSection('promotions')} className={`px-6 py-3 font-semibold rounded-lg transition-all ${activeSection === 'promotions' ? 'bg-primary text-white shadow-md' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50'}`}><i className="fas fa-ad mr-2"></i>Promotional Banners</button>
                    <button onClick={() => setActiveSection('brands')} className={`px-6 py-3 font-semibold rounded-lg transition-all ${activeSection === 'brands' ? 'bg-primary text-white shadow-md' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50'}`}><i className="fas fa-certificate mr-2"></i>Collection of brands</button>
                    <button onClick={() => setActiveSection('badges')} className={`px-6 py-3 font-semibold rounded-lg transition-all ${activeSection === 'badges' ? 'bg-primary text-white shadow-md' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50'}`}><i className="fas fa-tag mr-2"></i>Product Badges</button>
                    <button onClick={() => setActiveSection('categories')} className={`px-6 py-3 font-semibold rounded-lg transition-all ${activeSection === 'categories' ? 'bg-primary text-white shadow-md' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50'}`}><i className="fas fa-th-large mr-2"></i>Categories</button>
                </div>
            </div>

            {/* --- HERO SLIDER SECTION --- */}
            {activeSection === 'hero' && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white">Hero Slides</h3>
                        <button onClick={handleAddSlide} className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2">
                            <i className="fas fa-plus"></i> Add Slide
                        </button>
                    </div>
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEndHero}
                        modifiers={[restrictToVerticalAxis]}
                    >
                        <SortableContext
                            items={heroSlides.map(s => s.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            <div className="grid gap-6">
                                {heroSlides.map((slide, index) => (
                                    <SortableItem key={slide.id} id={slide.id} className="bg-white dark:bg-surface-dark rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700 group">
                                        <div className="p-4 flex flex-col md:flex-row gap-6 items-center">
                                            <div className="flex items-center gap-4 flex-1">
                                                <div className="cursor-grab active:cursor-grabbing text-gray-400 p-2">
                                                    <i className="fas fa-grip-vertical"></i>
                                                </div>
                                                <div className="w-full md:w-48 h-32 rounded-lg bg-gray-100 overflow-hidden relative">
                                                    <img src={slide.image} alt={slide.title} className="w-full h-full object-cover" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded uppercase">{slide.badge}</span>
                                                        {slide.isActive ? <span className="text-green-500 text-xs font-bold"><i className="fas fa-check-circle"></i> Active</span> : <span className="text-gray-400 text-xs font-bold">Inactive</span>}
                                                    </div>
                                                    <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-1">{slide.title}</h4>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">{slide.subtitle}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => handleEditSlide(slide)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><i className="fas fa-edit"></i></button>
                                                <button onClick={() => onDeleteHeroSlide(slide.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><i className="fas fa-trash"></i></button>
                                            </div>
                                        </div>
                                    </SortableItem>
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>

                    {/* Editor Modal */}
                    {isHeroModalOpen && (
                        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                            <div className="bg-white dark:bg-surface-dark rounded-2xl w-full max-w-2xl p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
                                <h3 className="text-xl font-bold mb-4">{editingSlide ? 'Edit Slide' : 'New Slide'}</h3>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Badge Text</label>
                                            <input type="text" value={slideFormData.badge} onChange={e => setSlideFormData({ ...slideFormData, badge: e.target.value })} className="w-full p-2 border rounded-lg" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Status</label>
                                            <select value={slideFormData.isActive ? 'true' : 'false'} onChange={e => setSlideFormData({ ...slideFormData, isActive: e.target.value === 'true' })} className="w-full p-2 border rounded-lg">
                                                <option value="true">Active</option>
                                                <option value="false">Inactive</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Title</label>
                                        <input type="text" value={slideFormData.title} onChange={e => setSlideFormData({ ...slideFormData, title: e.target.value })} className="w-full p-2 border rounded-lg" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Subtitle</label>
                                        <input type="text" value={slideFormData.subtitle} onChange={e => setSlideFormData({ ...slideFormData, subtitle: e.target.value })} className="w-full p-2 border rounded-lg" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Slide Image</label>
                                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center cursor-pointer hover:bg-gray-50" onClick={() => document.getElementById('slide-upload')?.click()}>
                                            {slideFormData.image ? <img src={slideFormData.image} className="h-32 mx-auto object-contain" /> : <div className="text-gray-400"><i className="fas fa-cloud-upload-alt text-2xl mb-2"></i><p>Click to upload image</p></div>}
                                            <input id="slide-upload" type="file" className="hidden" accept="image/*" onChange={handleSlideImageUpload} />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3 mt-6">
                                    <button onClick={() => setIsHeroModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                                    <button onClick={saveSlide} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark">Save Slide</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* --- PROMOTIONAL BANNERS SECTION --- */}
            {activeSection === 'promotions' && (
                <div className="space-y-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
                        <i className="fas fa-info-circle text-blue-600 mt-0.5"></i>
                        <div>
                            <h4 className="font-bold text-blue-900">3-Tile Promotional Layout</h4>
                            <p className="text-sm text-blue-800">Customize the three promotional banners displayed on the homepage. Edit the content and upload images directly below.</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {promotionalTiles.map((tile) => (
                            <div key={tile.id} className="bg-white dark:bg-surface-dark rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                                <div className="h-40 bg-gray-100 relative group cursor-pointer" onClick={() => document.getElementById(`tile-upload-${tile.id}`)?.click()}>
                                    <img src={tile.image} alt={tile.title} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <p className="text-white font-bold"><i className="fas fa-camera mr-2"></i>Change Image</p>
                                    </div>
                                    <input id={`tile-upload-${tile.id}`} type="file" className="hidden" accept="image/*" onChange={(e) => handleTileImageUpload(tile.id, e)} />
                                </div>
                                <div className="p-4 space-y-3">
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase">Title</label>
                                        <input type="text" value={tile.title} onChange={(e) => updateTileField(tile.id, 'title', e.target.value)} className="w-full p-2 border rounded text-sm font-bold" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase">Subtitle / Category</label>
                                        <input type="text" value={tile.category} onChange={(e) => updateTileField(tile.id, 'category', e.target.value)} className="w-full p-2 border rounded text-sm" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase">Price Text</label>
                                        <input type="text" value={tile.price} onChange={(e) => updateTileField(tile.id, 'price', e.target.value)} className="w-full p-2 border rounded text-sm text-red-500 font-bold" />
                                    </div>
                                    <div className="flex items-center justify-between pt-2">
                                        <span className="text-xs font-bold text-gray-500">Active</span>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" checked={tile.isActive} onChange={(e) => updateTileField(tile.id, 'isActive', e.target.checked)} className="sr-only peer" />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* --- FEATURED BRANDS SECTION --- */}
            {activeSection === 'brands' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Available Brands */}
                    <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-lg border border-gray-200 overflow-hidden flex flex-col h-[600px]">
                        <div className="p-4 border-b bg-gray-50 font-bold">Available Brands ({brands.length})</div>
                        <div className="overflow-y-auto p-4 space-y-2 flex-1">
                            {brands.map(brand => (
                                <div key={brand.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg border border-transparent hover:border-gray-200 transition-all">
                                    <input type="checkbox" checked={!!brand.isFeatured} onChange={(e) => onToggleBrandFeatured(brand.id, e.target.checked)} className="w-5 h-5 rounded text-primary focus:ring-primary cursor-pointer" />
                                    <img src={brand.logo} className="w-10 h-10 object-contain p-1 border rounded bg-white" />
                                    <div className="flex-1">
                                        <p className="font-bold text-sm">{brand.name}</p>
                                        <p className="text-xs text-gray-500">{brand.productCount} products</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Selected Brands */}
                    <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-lg border border-gray-200 overflow-hidden flex flex-col h-[600px]">
                        <div className="p-4 border-b bg-primary/5 font-bold text-primary">Selected Collection of brands ({featuredBrands.length})</div>
                        <div className="overflow-y-auto p-4 space-y-2 flex-1">
                            {featuredBrands.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                    <i className="fas fa-certificate text-4xl mb-2 opacity-50"></i>
                                    <p>No brands selected</p>
                                </div>
                            ) : (
                                <DndContext
                                    sensors={sensors}
                                    collisionDetection={closestCenter}
                                    onDragEnd={handleDragEndBrands}
                                    modifiers={[restrictToVerticalAxis]}
                                >
                                    <SortableContext
                                        items={featuredBrands.map(b => b.id)}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        <div className="space-y-2">
                                            {featuredBrands.map((brand, index) => (
                                                <SortableItem key={brand.id} id={brand.id} className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg shadow-sm group">
                                                    <div className="cursor-grab active:cursor-grabbing text-gray-300 group-hover:text-gray-500">
                                                        <i className="fas fa-grip-vertical"></i>
                                                    </div>
                                                    <span className="w-6 h-6 flex items-center justify-center bg-gray-100 rounded text-xs font-bold text-gray-500">#{index + 1}</span>
                                                    <img src={brand.logo} className="w-10 h-10 object-contain p-1 border rounded" />
                                                    <p className="font-bold text-sm flex-1">{brand.name}</p>
                                                    <button onClick={() => onToggleBrandFeatured(brand.id, false)} className="text-red-500 hover:bg-red-50 p-2 rounded"><i className="fas fa-times"></i></button>
                                                </SortableItem>
                                            ))}
                                        </div>
                                    </SortableContext>
                                </DndContext>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* --- OLD SECTIONS (BADGES & CATEGORIES) --- */}
            {activeSection === 'badges' && (
                <div className="grid gap-6">
                    {(homepageSettings?.badges || []).map((badge) => (
                        <div key={badge.id} className="bg-white dark:bg-surface-dark p-6 rounded-xl shadow border border-gray-200 dark:border-gray-700">
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="font-bold">Badge: {badge.name}</h4>
                                <label className="inline-flex items-center cursor-pointer"><input type="checkbox" checked={badge.enabled} onChange={e => updateBadge(badge.id, { enabled: e.target.checked })} className="sr-only peer" /><div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div></label>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <input type="text" value={badge.name} onChange={e => updateBadge(badge.id, { name: e.target.value })} className="border p-2 rounded" placeholder="Badge Name" />
                                <input type="color" value={badge.color} onChange={e => updateBadge(badge.id, { color: e.target.value })} className="h-10 w-full cursor-pointer" />
                                <input type="color" value={badge.bgColor} onChange={e => updateBadge(badge.id, { bgColor: e.target.value })} className="h-10 w-full cursor-pointer" />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {activeSection === 'categories' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Available Categories */}
                    <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-lg border border-gray-200 overflow-hidden flex flex-col h-[600px]">
                        <div className="p-4 border-b bg-gray-50 font-bold">Available Categories ({categories.length})</div>
                        <div className="overflow-y-auto p-4 space-y-2 flex-1">
                            {categories.map(cat => (
                                <div key={cat.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg border border-transparent hover:border-gray-200 transition-all">
                                    <input
                                        type="checkbox"
                                        checked={(homepageSettings?.showcaseCategories || []).includes(cat.name)}
                                        onChange={() => toggleCategory(cat.name)}
                                        className="w-5 h-5 rounded text-primary focus:ring-primary cursor-pointer"
                                    />
                                    {cat.image ? (
                                        <img src={cat.image} className="w-10 h-10 object-cover rounded bg-gray-100" />
                                    ) : (
                                        <div className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded text-gray-400">
                                            <i className="fas fa-th-large text-sm"></i>
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <p className="font-bold text-sm">{cat.name}</p>
                                        <p className="text-xs text-gray-500">{cat.slug}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Selected Showcase Categories */}
                    <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-lg border border-gray-200 overflow-hidden flex flex-col h-[600px]">
                        <div className="p-4 border-b bg-primary/5 font-bold text-primary">Showcase Order ({(homepageSettings?.showcaseCategories || []).length})</div>
                        <div className="overflow-y-auto p-4 space-y-2 flex-1">
                            {(homepageSettings?.showcaseCategories || []).length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                    <i className="fas fa-th-large text-4xl mb-2 opacity-50"></i>
                                    <p>No categories selected</p>
                                </div>
                            ) : (
                                <DndContext
                                    sensors={sensors}
                                    collisionDetection={closestCenter}
                                    onDragEnd={handleDragEndCategories}
                                    modifiers={[restrictToVerticalAxis]}
                                >
                                    <SortableContext
                                        items={homepageSettings?.showcaseCategories || []}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        <div className="space-y-2">
                                            {(homepageSettings?.showcaseCategories || []).map((catName, index) => {
                                                const cat = (categories || []).find(c => c.name === catName);
                                                return (
                                                    <SortableItem key={catName} id={catName} className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg shadow-sm group">
                                                        <div className="cursor-grab active:cursor-grabbing text-gray-300 group-hover:text-gray-500">
                                                            <i className="fas fa-grip-vertical"></i>
                                                        </div>
                                                        <span className="w-6 h-6 flex items-center justify-center bg-gray-100 rounded text-xs font-bold text-gray-500">#{index + 1}</span>
                                                        <div className="flex-1 font-bold text-sm">{catName}</div>
                                                        <button onClick={() => toggleCategory(catName)} className="text-red-500 hover:bg-red-50 p-2 rounded"><i className="fas fa-times"></i></button>
                                                    </SortableItem>
                                                );
                                            })}
                                        </div>
                                    </SortableContext>
                                </DndContext>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Sticky Save Bar */}
            <div className="fixed bottom-6 right-6 z-50">
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className={`flex items-center gap-2 px-8 py-4 rounded-2xl font-bold shadow-2xl transition-all transform hover:scale-105 active:scale-95 ${isSaving ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary text-white hover:bg-pink-700'
                        }`}
                >
                    {isSaving ? (
                        <>
                            <i className="fas fa-spinner fa-spin"></i>
                            Saving...
                        </>
                    ) : (
                        <>
                            <i className="fas fa-save"></i>
                            Save All Homepage Changes
                        </>
                    )}
                </button>
            </div>

        </div>
    );
};
