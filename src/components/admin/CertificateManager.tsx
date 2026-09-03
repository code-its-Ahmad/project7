import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, Award, ExternalLink, X, ShieldCheck } from 'lucide-react';
import { certificatesAPI, Certificate } from '../../api/services';
import { usePortfolio } from '../../context/PortfolioContext';
import { useSound } from '../../context/SoundContext';
import toast from 'react-hot-toast';

const CertificateManager: React.FC = () => {
  const { certificates, refetch } = usePortfolio();
  const { playClick, playHover, playSuccess } = useSound();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCert, setEditingCert] = useState<Certificate | null>(null);

  const [formData, setFormData] = useState<Partial<Certificate>>({
    title: '',
    issuer: 'Meta (Coursera)',
    year: '2024',
    description: '',
    credential_url: '',
    credential_id: '',
    image: '',
    color: 'from-blue-400 to-purple-600',
    dark_color: 'from-blue-500 to-purple-700',
    order_index: 0,
  });

  const handleOpenCreate = () => {
    playClick();
    setEditingCert(null);
    setFormData({
      title: '',
      issuer: 'Meta (Coursera)',
      year: '2024',
      description: 'Mastery in modern full-stack application development and system architecture.',
      credential_url: 'https://coursera.org/verify/...',
      credential_id: 'META-FS-99482',
      image: '',
      color: 'from-blue-400 to-purple-600',
      dark_color: 'from-blue-500 to-purple-700',
      order_index: certificates.length + 1,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cert: Certificate) => {
    playClick();
    setEditingCert(cert);
    setFormData({ ...cert });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.issuer || !formData.year) {
      toast.error('Title, issuer, and year are required.');
      return;
    }

    try {
      if (editingCert) {
        await certificatesAPI.update(editingCert.id, formData);
        toast.success('Certificate updated successfully!');
      } else {
        await certificatesAPI.create(formData);
        toast.success('Certificate added successfully!');
      }
      playSuccess();
      setIsModalOpen(false);
      refetch();
    } catch (err) {
      toast.error('Failed to save certificate.');
    }
  };

  const handleDelete = async (id: number, title: string) => {
    playClick();
    if (!window.confirm(`Delete certificate "${title}"?`)) return;

    try {
      await certificatesAPI.delete(id);
      toast.success('Certificate deleted.');
      refetch();
    } catch (err) {
      toast.error('Failed to delete certificate.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Certificates & Verified Credentials</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Manage your verified industry certifications, verification URLs, and credential IDs.
          </p>
        </div>

        <button
          aria-label="Add new certificate"
          onClick={handleOpenCreate}
          onMouseEnter={playHover}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm shadow-md shadow-blue-500/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Certificate</span>
        </button>
      </div>

      {/* Certificates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {certificates.map((cert) => (
          <div
            key={cert.id}
            className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 text-white flex items-center justify-center shadow-md">
                  <Award className="w-6 h-6" />
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    aria-label="Edit certificate"
                    onClick={() => handleOpenEdit(cert)}
                    className="p-2 rounded-xl text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    aria-label="Delete certificate"
                    onClick={() => handleDelete(cert.id, cert.title)}
                    className="p-2 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-base text-gray-900 dark:text-white line-clamp-1">{cert.title}</h3>
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span className="font-semibold text-blue-600 dark:text-blue-400">{cert.issuer}</span>
                  <span>{cert.year}</span>
                </div>
              </div>

              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-2">
                {cert.description}
              </p>

              {cert.credential_id && (
                <div className="text-[11px] font-mono text-gray-400 bg-gray-50 dark:bg-gray-800/80 p-2 rounded-lg truncate">
                  ID: {cert.credential_id}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs">
              {cert.credential_url ? (
                <a
                  href={cert.credential_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold"
                >
                  <span>Verify Credential</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              ) : (
                <span className="text-gray-400">Verified Certificate</span>
              )}
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
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
                <h3 className="font-bold text-base text-gray-900 dark:text-white">
                  {editingCert ? 'Edit Certificate' : 'Add New Certificate'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Certificate Title *
                  </label>
                  <input aria-label="Certificate Title"
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Full Stack Web Development Professional"
                    className="w-full px-3.5 py-2 text-sm rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Issuer / Organization *
                    </label>
                    <input aria-label="Issuer / Organization"
                      type="text"
                      required
                      value={formData.issuer}
                      onChange={(e) => setFormData({ ...formData, issuer: e.target.value })}
                      placeholder="e.g. Meta (Coursera), Google"
                      className="w-full px-3.5 py-2 text-sm rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Year Earned *
                    </label>
                    <input aria-label="Year Earned"
                      type="text"
                      required
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                      placeholder="e.g. 2024"
                      className="w-full px-3.5 py-2 text-sm rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Credential ID
                  </label>
                  <input aria-label="Credential ID"
                    type="text"
                    value={formData.credential_id}
                    onChange={(e) => setFormData({ ...formData, credential_id: e.target.value })}
                    placeholder="e.g. META-FS-849201"
                    className="w-full px-3.5 py-2 text-sm rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Verification URL
                  </label>
                  <input aria-label="Verification URL"
                    type="text"
                    value={formData.credential_url}
                    onChange={(e) => setFormData({ ...formData, credential_url: e.target.value })}
                    placeholder="https://coursera.org/verify/..."
                    className="w-full px-3.5 py-2 text-sm rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea aria-label="Description"
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Key concepts covered..."
                    className="w-full px-3.5 py-2 text-sm rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
                  />
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
                    {editingCert ? 'Update Certificate' : 'Save Certificate'}
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

export default CertificateManager;
