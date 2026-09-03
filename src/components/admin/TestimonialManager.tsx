import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Check, X, Trash2, Star, UserCheck, Clock, ShieldAlert } from 'lucide-react';
import { testimonialsAPI, Testimonial } from '../../api/services';
import { usePortfolio } from '../../context/PortfolioContext';
import { useSound } from '../../context/SoundContext';
import toast from 'react-hot-toast';

const TestimonialManager: React.FC = () => {
  const [allTestimonials, setAllTestimonials] = useState<Testimonial[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending' | 'rejected'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { refetch: refetchPublic } = usePortfolio();
  const { playClick, playHover, playSuccess } = useSound();

  const [formData, setFormData] = useState<Partial<Testimonial>>({
    name: '',
    role: 'CEO / CTO',
    company: 'Tech Innovations Inc.',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop',
    rating: 5,
    text: '',
    project_name: 'AI Web Platform',
    status: 'approved',
    is_featured: true,
  });

  const fetchAll = async () => {
    try {
      const res = await testimonialsAPI.getAll();
      setAllTestimonials(res.testimonials || []);
    } catch (err) {
      console.error('Failed to fetch testimonials for admin:', err);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleUpdateStatus = async (id: number, status: 'approved' | 'rejected') => {
    playClick();
    try {
      await testimonialsAPI.updateStatus(id, status);
      toast.success(`Review ${status}!`);
      fetchAll();
      refetchPublic();
    } catch {
      toast.error('Failed to update status.');
    }
  };

  const handleDelete = async (id: number, name: string) => {
    playClick();
    if (!window.confirm(`Delete review from "${name}"?`)) return;

    try {
      await testimonialsAPI.delete(id);
      toast.success('Testimonial deleted.');
      fetchAll();
      refetchPublic();
    } catch {
      toast.error('Failed to delete testimonial.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.text) {
      toast.error('Name and testimonial text are required.');
      return;
    }

    try {
      await testimonialsAPI.submit(formData);
      playSuccess();
      toast.success('Testimonial added successfully!');
      setIsModalOpen(false);
      fetchAll();
      refetchPublic();
    } catch {
      toast.error('Failed to add testimonial.');
    }
  };

  const filtered = allTestimonials.filter((t) => {
    if (statusFilter === 'all') return true;
    return t.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Client Reviews & Testimonials</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Moderate incoming visitor reviews and manage verified client endorsements.
          </p>
        </div>

        <button
          onClick={() => {
            playClick();
            setIsModalOpen(true);
          }}
          onMouseEnter={playHover}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm shadow-md shadow-blue-500/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Testimonial</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        {(['all', 'approved', 'pending', 'rejected'] as const).map((st) => (
          <button
            key={st}
            onClick={() => {
              playClick();
              setStatusFilter(st);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold capitalize transition-all ${
              statusFilter === st
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            {st} ({allTestimonials.filter((t) => st === 'all' || t.status === st).length})
          </button>
        ))}
      </div>

      {/* Reviews Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              {/* Header: Avatar, Info, Status Badge */}
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <img
                    src={item.avatar}
                    alt={item.name}
                    className="w-11 h-11 rounded-full object-cover border border-blue-500/30"
                    onError={(e: any) => {
                      e.target.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop';
                    }}
                  />
                  <div>
                    <h3 className="font-bold text-sm text-gray-900 dark:text-white">{item.name}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {item.role} {item.company ? `at ${item.company}` : ''}
                    </p>
                  </div>
                </div>

                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    item.status === 'approved'
                      ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                      : item.status === 'pending'
                      ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-500/30 animate-pulse'
                      : 'bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 border border-red-500/30'
                  }`}
                >
                  {item.status.toUpperCase()}
                </span>
              </div>

              {/* Stars */}
              <div className="flex text-amber-400 text-xs">
                {Array.from({ length: item.rating || 5 }).map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>

              {/* Review text */}
              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed italic">
                "{item.text}"
              </p>

              {item.project_name && (
                <div className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                  Project: {item.project_name}
                </div>
              )}
            </div>

            {/* Moderation Actions */}
            <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {item.status !== 'approved' && (
                  <button
                    onClick={() => handleUpdateStatus(item.id, 'approved')}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-all"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Approve</span>
                  </button>
                )}
                {item.status !== 'rejected' && (
                  <button
                    onClick={() => handleUpdateStatus(item.id, 'rejected')}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-sm transition-all"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>
                )}
              </div>

              <button
                aria-label="Delete testimonial"
                onClick={() => handleDelete(item.id, item.name)}
                className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors"
                title="Delete Testimonial"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
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
              className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800 p-6 z-10 space-y-5"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
                <h3 className="font-bold text-base text-gray-900 dark:text-white">Add Verified Testimonial</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Client Name *
                  </label>
                  <input aria-label="Client Name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. David Harrison"
                    className="w-full px-3.5 py-2 text-sm rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Role / Position
                    </label>
                    <input aria-label="Role / Position"
                      type="text"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      placeholder="e.g. CTO, Product Manager"
                      className="w-full px-3.5 py-2 text-sm rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Company Name
                    </label>
                    <input aria-label="Company Name"
                      type="text"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      placeholder="e.g. Apex HealthTech Labs"
                      className="w-full px-3.5 py-2 text-sm rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Client Review Text *
                  </label>
                  <textarea aria-label="Client Review Text"
                    rows={3}
                    required
                    value={formData.text}
                    onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                    placeholder="Describe collaboration and praise..."
                    className="w-full px-3.5 py-2 text-sm rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Project Reference
                    </label>
                    <input aria-label="Project Reference"
                      type="text"
                      value={formData.project_name}
                      onChange={(e) => setFormData({ ...formData, project_name: e.target.value })}
                      placeholder="e.g. GreenGuardian AI"
                      className="w-full px-3.5 py-2 text-sm rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Rating (Stars)
                    </label>
                    <select aria-label="Rating (Stars)"
                      value={formData.rating}
                      onChange={(e) => setFormData({ ...formData, rating: Number(e.target.value) })}
                      className="w-full px-3.5 py-2 text-sm rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value={5}>5 Stars (★★★★★)</option>
                      <option value={4}>4 Stars (★★★★☆)</option>
                      <option value={3}>3 Stars (★★★☆☆)</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md"
                  >
                    Save Testimonial
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

export default TestimonialManager;
