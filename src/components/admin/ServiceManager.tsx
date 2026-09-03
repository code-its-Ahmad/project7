import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import {
  Plus, Search, Edit2, Trash2, Code, Brain, Smartphone, Database, Globe, Zap,
  X, Check, GripVertical, Eye, EyeOff, ArrowUpDown, AlertTriangle,
  Lock, Cpu, TrendingUp, Layers, Hash, Type, AlignLeft, Tag,
} from 'lucide-react';
import { servicesAPI, Service } from '../../api/services';
import { usePortfolio } from '../../context/PortfolioContext';
import { useSound } from '../../context/SoundContext';
import toast from 'react-hot-toast';

const ICON_MAP: Record<string, React.ReactNode> = {
  Code: <Code className="w-5 h-5" />,
  Brain: <Brain className="w-5 h-5" />,
  Smartphone: <Smartphone className="w-5 h-5" />,
  Database: <Database className="w-5 h-5" />,
  Globe: <Globe className="w-5 h-5" />,
  Zap: <Zap className="w-5 h-5" />,
  Lock: <Lock className="w-5 h-5" />,
  Cpu: <Cpu className="w-5 h-5" />,
  TrendingUp: <TrendingUp className="w-5 h-5" />,
  Layers: <Layers className="w-5 h-5" />,
};

const ICON_OPTIONS = [
  'Code', 'Brain', 'Smartphone', 'Database', 'Globe',
  'Zap', 'Lock', 'Cpu', 'TrendingUp', 'Layers',
];

const DEFAULT_FEATURES = [
  'Modern Responsive UI',
  'Scalable Architecture',
  'Secure API Integration',
];

const ServiceManager: React.FC = () => {
  const { services, refetch } = usePortfolio();
  const { playClick, playHover, playSuccess } = useSound();

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'order' | 'title' | 'price'>('order');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [previewId, setPreviewId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [orderedServices, setOrderedServices] = useState<Service[]>([]);

  const [formData, setFormData] = useState<Partial<Service>>({
    title: '',
    icon: 'Code',
    description: '',
    features: [],
    starting_price: '$999',
    timeline_estimate: '2-4 weeks',
    order_index: 0,
  });
  const [featureInput, setFeatureInput] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const filteredServices = useMemo(() => {
    let result = [...services];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.features?.some((f) => f.toLowerCase().includes(q))
      );
    }

    result.sort((a, b) => {
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      if (sortBy === 'price') {
        const pa = parseFloat((a.starting_price || '0').replace(/[^0-9.]/g, '')) || 0;
        const pb = parseFloat((b.starting_price || '0').replace(/[^0-9.]/g, '')) || 0;
        return pb - pa;
      }
      return (a.order_index || 0) - (b.order_index || 0);
    });

    return result;
  }, [services, searchQuery, sortBy]);

  const stats = useMemo(() => ({
    total: services.length,
    features: services.reduce((sum, s) => sum + (s.features?.length || 0), 0),
    avgPrice: services.length
      ? `$${Math.round(services.reduce((sum, s) => sum + (parseFloat((s.starting_price || '0').replace(/[^0-9.]/g, '')) || 0), 0) / services.length).toLocaleString()}`
      : '$0',
  }), [services]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.title?.trim()) errors.title = 'Title is required';
    if (!formData.description?.trim()) errors.description = 'Description is required';
    if (formData.description && formData.description.length < 20) errors.description = 'Description must be at least 20 characters';
    if (!formData.starting_price?.trim()) errors.starting_price = 'Price is required';
    if (!formData.timeline_estimate?.trim()) errors.timeline_estimate = 'Timeline is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOpenCreate = () => {
    playClick();
    setEditingService(null);
    setFormData({
      title: '',
      icon: 'Code',
      description: '',
      features: [...DEFAULT_FEATURES],
      starting_price: '$999',
      timeline_estimate: '2-4 weeks',
      order_index: services.length + 1,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEdit = (service: Service) => {
    playClick();
    setEditingService(service);
    setFormData({
      title: service.title,
      icon: service.icon || 'Code',
      description: service.description,
      features: [...(service.features || [])],
      starting_price: service.starting_price || '',
      timeline_estimate: service.timeline_estimate || '',
      order_index: service.order_index || 0,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleAddFeature = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && featureInput.trim()) {
      e.preventDefault();
      const val = featureInput.trim();
      if (!formData.features?.includes(val)) {
        setFormData((prev) => ({
          ...prev,
          features: [...(prev.features || []), val],
        }));
      }
      setFeatureInput('');
    }
  };

  const handleRemoveFeature = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features?.filter((_, i) => i !== index) || [],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      if (editingService) {
        await servicesAPI.update(editingService.id, formData);
        toast.success(`"${formData.title}" updated successfully!`);
      } else {
        await servicesAPI.create(formData);
        toast.success(`"${formData.title}" created successfully!`);
      }
      playSuccess();
      setIsModalOpen(false);
      refetch();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save service.';
      toast.error(message);
    }
  };

  const handleDelete = async (id: number, title: string) => {
    playClick();
    if (!window.confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) return;

    setIsDeleting(id);
    try {
      await servicesAPI.delete(id);
      toast.success(`"${title}" deleted.`);
      setSelectedIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
      refetch();
    } catch {
      toast.error('Failed to delete service.');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Delete ${selectedIds.size} selected service(s)?`)) return;

    try {
      await Promise.all(Array.from(selectedIds).map((id) => servicesAPI.delete(id)));
      toast.success(`${selectedIds.size} service(s) deleted.`);
      setSelectedIds(new Set());
      refetch();
    } catch {
      toast.error('Some deletions failed.');
    }
  };

  const handleDuplicate = async (service: Service) => {
    playClick();
    try {
      await servicesAPI.create({
        title: `${service.title} (Copy)`,
        icon: service.icon,
        description: service.description,
        features: [...(service.features || [])],
        starting_price: service.starting_price,
        timeline_estimate: service.timeline_estimate,
        order_index: services.length + 1,
      });
      toast.success(`"${service.title}" duplicated!`);
      playSuccess();
      refetch();
    } catch {
      toast.error('Failed to duplicate service.');
    }
  };

  const handleSaveOrder = async () => {
    try {
      await Promise.all(
        orderedServices.map((s, i) => servicesAPI.update(s.id, { ...s, order_index: i }))
      );
      toast.success('Display order updated!');
      setIsReorderMode(false);
      refetch();
    } catch {
      toast.error('Failed to save order.');
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredServices.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredServices.map((s) => s.id)));
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Service Manager</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Full control over your service offerings, pricing, features, and display order.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {isReorderMode ? (
            <>
              <button
                onClick={() => { setIsReorderMode(false); playClick(); }}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
              >
                <X className="w-3.5 h-3.5" /> Cancel
              </button>
              <button
                onClick={handleSaveOrder}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition-all"
              >
                <Check className="w-3.5 h-3.5" /> Save Order
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => { setIsReorderMode(true); setOrderedServices([...services]); playClick(); }}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
              >
                <ArrowUpDown className="w-3.5 h-3.5" /> Reorder
              </button>
              <button
                aria-label="Add new service"
                onClick={handleOpenCreate}
                onMouseEnter={playHover}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm shadow-md shadow-blue-500/20 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Add Service</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Services', value: stats.total, color: 'blue' },
          { label: 'Total Features', value: stats.features, color: 'purple' },
          { label: 'Avg Starting Price', value: stats.avgPrice, color: 'emerald' },
        ].map((stat) => (
          <div key={stat.label} className={`p-3 rounded-xl bg-${stat.color}-50 dark:bg-${stat.color}-950/20 border border-${stat.color}-200 dark:border-${stat.color}-900/30 text-center`}>
            <div className="text-lg font-extrabold text-gray-900 dark:text-white">{stat.value}</div>
            <div className="text-[10px] font-bold text-gray-400 uppercase">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Search & Bulk Actions */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search services, features..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={sortBy}
            onChange={(e) => { setSortBy(e.target.value as typeof sortBy); playClick(); }}
            className="px-3 py-2 text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-xl border border-gray-200 dark:border-gray-700"
          >
            <option value="order">Sort: Display Order</option>
            <option value="title">Sort: Title A-Z</option>
            <option value="price">Sort: Price High-Low</option>
          </select>

          {selectedIds.size > 0 && (
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete ({selectedIds.size})
            </button>
          )}
        </div>
      </div>

      {/* Reorder Mode */}
      {isReorderMode ? (
        <div className="space-y-2">
          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
            <GripVertical className="w-3.5 h-3.5" />
            Drag services to reorder. This controls display order on the public site.
          </p>
          <Reorder.Group axis="y" values={orderedServices} onReorder={setOrderedServices} className="space-y-2">
            {orderedServices.map((service, idx) => (
              <Reorder.Item key={service.id} value={service} className="list-none">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing">
                  <div className="text-gray-400">
                    <GripVertical className="w-4 h-4" />
                  </div>
                  <span className="w-6 h-6 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-bold shrink-0">
                    {idx + 1}
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-500 to-indigo-600 text-white flex items-center justify-center shrink-0">
                    {ICON_MAP[service.icon] || <Code className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm text-gray-900 dark:text-white truncate">{service.title}</div>
                    <div className="text-[10px] text-gray-400">{service.starting_price || 'N/A'}</div>
                  </div>
                </div>
              </Reorder.Item>
            ))}
          </Reorder.Group>
        </div>
      ) : (
        /* Services Grid */
        <>
          {filteredServices.length === 0 ? (
            <div className="text-center py-16 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
              <Code className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                {searchQuery ? 'No services match your search.' : 'No services yet. Create your first one!'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredServices.map((service, index) => {
                const isSelected = selectedIds.has(service.id);
                const isPreviewing = previewId === service.id;
                return (
                  <motion.div
                    key={service.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.15) }}
                    className={`relative p-5 rounded-2xl bg-white dark:bg-gray-900 border shadow-sm hover:shadow-xl transition-all flex flex-col justify-between space-y-4 ${isSelected ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-gray-200 dark:border-gray-800'}`}
                  >
                    {/* Selection checkbox */}
                    <div className="absolute top-3 left-3">
                      <button
                        onClick={() => toggleSelect(service.id)}
                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'}`}
                      >
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </button>
                    </div>

                    {/* Order badge */}
                    <div className="absolute top-3 right-3">
                      <span className="text-[10px] font-bold text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded-md">
                        #{service.order_index || index + 1}
                      </span>
                    </div>

                    <div className="space-y-3 pt-2">
                      {/* Icon & Title */}
                      <div className="flex items-start gap-3">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-md shrink-0">
                          {ICON_MAP[service.icon] || <Code className="w-5 h-5" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-bold text-sm text-gray-900 dark:text-white line-clamp-1">{service.title}</h3>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2 leading-relaxed">
                            {service.description}
                          </p>
                        </div>
                      </div>

                      {/* Features */}
                      {service.features && service.features.length > 0 && (
                        <div className={`space-y-1 pt-2 border-t border-gray-100 dark:border-gray-800 ${isPreviewing ? '' : 'max-h-24 overflow-hidden'}`}>
                          {service.features.map((feat, i) => (
                            <div key={i} className="flex items-start gap-1.5 text-[11px] text-gray-600 dark:text-gray-300">
                              <Check className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" />
                              <span className="line-clamp-1">{feat}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {service.features && service.features.length > 3 && !isPreviewing && (
                        <button
                          onClick={() => setPreviewId(service.id)}
                          className="text-[10px] font-semibold text-blue-500 hover:text-blue-600"
                        >
                          Show all {service.features.length} features
                        </button>
                      )}
                      {isPreviewing && service.features && service.features.length > 3 && (
                        <button
                          onClick={() => setPreviewId(null)}
                          className="text-[10px] font-semibold text-blue-500 hover:text-blue-600"
                        >
                          Show less
                        </button>
                      )}
                    </div>

                    {/* Pricing & Timeline */}
                    <div className="pt-3 border-t border-gray-100 dark:border-gray-800">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-extrabold text-blue-600 dark:text-blue-400">
                          {service.starting_price || 'N/A'}
                        </span>
                        <span className="text-gray-400 font-medium text-[11px]">
                          {service.timeline_estimate || 'N/A'}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-1">
                      <button
                        onClick={() => handleDuplicate(service)}
                        onMouseEnter={playHover}
                        className="text-[10px] font-semibold text-gray-400 hover:text-blue-500 transition-colors"
                      >
                        Duplicate
                      </button>
                      <div className="flex items-center gap-1">
                        <button
                          aria-label="Edit service"
                          onClick={() => handleOpenEdit(service)}
                          onMouseEnter={playHover}
                          className="p-1.5 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          aria-label="Delete service"
                          onClick={() => handleDelete(service.id, service.title)}
                          onMouseEnter={playHover}
                          disabled={isDeleting === service.id}
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors disabled:opacity-50"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Create / Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              className="fixed inset-0 bg-black/60 backdrop-blur-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
            />

            <motion.div
              className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800 z-10 max-h-[90vh] flex flex-col"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between shrink-0">
                <div>
                  <h3 className="font-bold text-base text-gray-900 dark:text-white">
                    {editingService ? 'Edit Service' : 'Create New Service'}
                  </h3>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    {editingService ? 'Update the service details below.' : 'Fill in the details to add a new service.'}
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
                {/* Icon Selector */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                    Service Icon
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {ICON_OPTIONS.map((iconName) => (
                      <button
                        key={iconName}
                        type="button"
                        onClick={() => { setFormData({ ...formData, icon: iconName }); playClick(); }}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${formData.icon === iconName
                            ? 'bg-blue-500 text-white shadow-md shadow-blue-500/25 scale-110'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                          }`}
                        title={iconName}
                      >
                        {ICON_MAP[iconName]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                    <Type className="w-3 h-3" /> Service Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => { setFormData({ ...formData, title: e.target.value }); setFormErrors((p) => ({ ...p, title: '' })); }}
                    placeholder="e.g. Full Stack Web Development"
                    className={`w-full px-3.5 py-2.5 text-sm rounded-xl bg-gray-50 dark:bg-gray-800 border ${formErrors.title ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 dark:border-gray-700 focus:ring-blue-500'} text-gray-900 dark:text-white focus:ring-2 outline-none transition-all`}
                  />
                  {formErrors.title && <p className="text-[10px] text-red-500 mt-1">{formErrors.title}</p>}
                </div>

                {/* Price & Timeline */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                      <Tag className="w-3 h-3" /> Starting Price *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.starting_price}
                      onChange={(e) => { setFormData({ ...formData, starting_price: e.target.value }); setFormErrors((p) => ({ ...p, starting_price: '' })); }}
                      placeholder="e.g. $999"
                      className={`w-full px-3.5 py-2.5 text-sm rounded-xl bg-gray-50 dark:bg-gray-800 border ${formErrors.starting_price ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'} text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all`}
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                      <Hash className="w-3 h-3" /> Timeline Estimate *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.timeline_estimate}
                      onChange={(e) => { setFormData({ ...formData, timeline_estimate: e.target.value }); setFormErrors((p) => ({ ...p, timeline_estimate: '' })); }}
                      placeholder="e.g. 2-4 weeks"
                      className={`w-full px-3.5 py-2.5 text-sm rounded-xl bg-gray-50 dark:bg-gray-800 border ${formErrors.timeline_estimate ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'} text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all`}
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                    <AlignLeft className="w-3 h-3" /> Description * (min 20 chars)
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={formData.description}
                    onChange={(e) => { setFormData({ ...formData, description: e.target.value }); setFormErrors((p) => ({ ...p, description: '' })); }}
                    placeholder="Comprehensive description of the service and deliverables..."
                    className={`w-full px-3.5 py-2.5 text-sm rounded-xl bg-gray-50 dark:bg-gray-800 border ${formErrors.description ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'} text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none`}
                  />
                  {formErrors.description && <p className="text-[10px] text-red-500 mt-1">{formErrors.description}</p>}
                  {formData.description && (
                    <p className="text-[10px] text-gray-400 mt-1">{formData.description.length} characters</p>
                  )}
                </div>

                {/* Features */}
                <div>
                  <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                    <Check className="w-3 h-3" /> Included Features / Deliverables
                  </label>
                  <div className="space-y-1.5">
                    {formData.features?.map((feat, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800 text-xs group">
                        <div className="flex items-center gap-2 min-w-0">
                          <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                          <span className="text-gray-700 dark:text-gray-300 truncate">{feat}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveFeature(idx)}
                          className="p-0.5 rounded text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={featureInput}
                        onChange={(e) => setFeatureInput(e.target.value)}
                        onKeyDown={handleAddFeature}
                        placeholder="Type a feature and press Enter..."
                        className="flex-1 px-3 py-2 text-xs rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {featureInput.trim() && (
                        <button
                          type="button"
                          onClick={() => {
                            const val = featureInput.trim();
                            if (val && !formData.features?.includes(val)) {
                              setFormData((p) => ({ ...p, features: [...(p.features || []), val] }));
                            }
                            setFeatureInput('');
                          }}
                          className="p-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Order Index */}
                <div>
                  <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                    <ArrowUpDown className="w-3 h-3" /> Display Order
                  </label>
                  <input
                    type="number"
                    value={formData.order_index}
                    onChange={(e) => setFormData({ ...formData, order_index: Number(e.target.value) })}
                    className="w-24 px-3 py-2 text-sm rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-center focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">Lower numbers appear first.</p>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/20 transition-all active:scale-95"
                  >
                    {editingService ? 'Update Service' : 'Create Service'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ServiceManager;
