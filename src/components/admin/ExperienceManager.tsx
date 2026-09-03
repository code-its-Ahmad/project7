import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, Briefcase, GraduationCap, X } from 'lucide-react';
import { experienceAPI, Experience } from '../../api/services';
import { usePortfolio } from '../../context/PortfolioContext';
import { useSound } from '../../context/SoundContext';
import toast from 'react-hot-toast';

const ExperienceManager: React.FC = () => {
  const { experiences, refetch } = usePortfolio();
  const { playClick, playHover, playSuccess } = useSound();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExp, setEditingExp] = useState<Experience | null>(null);

  const [formData, setFormData] = useState<Partial<Experience>>({
    type: 'work',
    title: '',
    company_or_school: '',
    location: 'Lahore, Pakistan',
    period: '2025 - Present',
    description: '',
    achievements: [],
    technologies: [],
    icon: '💻',
    order_index: 0,
  });

  const [achievementInput, setAchievementInput] = useState('');
  const [techInput, setTechInput] = useState('');

  const handleOpenCreate = () => {
    playClick();
    setEditingExp(null);
    setFormData({
      type: 'work',
      title: '',
      company_or_school: '',
      location: 'Lahore, Pakistan',
      period: '2025 - Present',
      description: '',
      achievements: ['Increased performance by 40%', 'Delivered 3 major client projects'],
      technologies: ['React', 'Node.js', 'Python'],
      icon: '💻',
      order_index: experiences.length + 1,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (exp: Experience) => {
    playClick();
    setEditingExp(exp);
    setFormData({ ...exp });
    setIsModalOpen(true);
  };

  const handleAddAchievement = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && achievementInput.trim()) {
      e.preventDefault();
      setFormData((prev) => ({
        ...prev,
        achievements: [...(prev.achievements || []), achievementInput.trim()],
      }));
      setAchievementInput('');
    }
  };

  const handleRemoveAchievement = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      achievements: prev.achievements?.filter((_, i) => i !== index) || [],
    }));
  };

  const handleAddTech = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && techInput.trim()) {
      e.preventDefault();
      if (!formData.technologies?.includes(techInput.trim())) {
        setFormData((prev) => ({
          ...prev,
          technologies: [...(prev.technologies || []), techInput.trim()],
        }));
      }
      setTechInput('');
    }
  };

  const handleRemoveTech = (tech: string) => {
    setFormData((prev) => ({
      ...prev,
      technologies: prev.technologies?.filter((t) => t !== tech) || [],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.company_or_school || !formData.period) {
      toast.error('Title, company/school, and period are required.');
      return;
    }

    try {
      if (editingExp) {
        await experienceAPI.update(editingExp.id, formData);
        toast.success('Experience item updated successfully!');
      } else {
        await experienceAPI.create(formData);
        toast.success('Experience item added successfully!');
      }
      playSuccess();
      setIsModalOpen(false);
      refetch();
    } catch (err) {
      toast.error('Failed to save experience.');
    }
  };

  const handleDelete = async (id: number, title: string) => {
    playClick();
    if (!window.confirm(`Delete "${title}"?`)) return;

    try {
      await experienceAPI.delete(id);
      toast.success('Experience item deleted.');
      refetch();
    } catch (err) {
      toast.error('Failed to delete item.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Experience & Career Milestones</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Manage your employment history, client engineering roles, and academic achievements.
          </p>
        </div>

        <button
          aria-label="Add new experience"
          onClick={handleOpenCreate}
          onMouseEnter={playHover}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm shadow-md shadow-blue-500/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Milestone</span>
        </button>
      </div>

      {/* Experience List */}
      <div className="space-y-4">
        {experiences.map((exp) => (
          <div
            key={exp.id}
            className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-lg transition-all flex flex-col md:flex-row md:items-start justify-between gap-6"
          >
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xl shrink-0">
                {exp.icon || (exp.type === 'education' ? '🎓' : '💻')}
              </div>

              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-bold text-base text-gray-900 dark:text-white">{exp.title}</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400">
                    {exp.type.toUpperCase()}
                  </span>
                </div>

                <div className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                  {exp.company_or_school} • <span className="text-gray-400">{exp.location}</span>
                </div>

                <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                  📅 {exp.period}
                </div>

                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed max-w-2xl">
                  {exp.description}
                </p>

                {/* Achievements */}
                {exp.achievements?.length > 0 && (
                  <ul className="list-disc list-inside space-y-1 text-xs text-gray-600 dark:text-gray-400 pt-1">
                    {exp.achievements.map((ach, i) => (
                      <li key={i}>{ach}</li>
                    ))}
                  </ul>
                )}

                {/* Technologies */}
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {exp.technologies?.map((tech) => (
                    <span
                      key={tech}
                      className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2 shrink-0 self-end md:self-start">
              <button
                aria-label="Edit experience"
                onClick={() => handleOpenEdit(exp)}
                className="p-2 rounded-xl text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                aria-label="Delete experience"
                onClick={() => handleDelete(exp.id, exp.title)}
                className="p-2 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors"
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
              className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800 p-6 z-10 max-h-[90vh] flex flex-col space-y-5"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
                <h3 className="font-bold text-base text-gray-900 dark:text-white">
                  {editingExp ? 'Edit Milestone' : 'Add New Milestone'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-1">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Milestone Type *
                    </label>
                    <select aria-label="Milestone Type"
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                      className="w-full px-3.5 py-2 text-sm rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="work">Work Experience</option>
                      <option value="education">Education</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Emoji Icon
                    </label>
                    <input aria-label="Emoji Icon"
                      type="text"
                      value={formData.icon}
                      onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                      placeholder="💻, 🤖, 📱, 🎓"
                      className="w-full px-3.5 py-2 text-sm rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-center"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Role / Degree Title *
                  </label>
                  <input aria-label="Role / Degree Title"
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Full Stack & AI Engineer"
                    className="w-full px-3.5 py-2 text-sm rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Company / University *
                    </label>
                    <input aria-label="Company / University"
                      type="text"
                      required
                      value={formData.company_or_school}
                      onChange={(e) => setFormData({ ...formData, company_or_school: e.target.value })}
                      placeholder="e.g. Allzone Technologies"
                      className="w-full px-3.5 py-2 text-sm rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Period (Duration) *
                    </label>
                    <input aria-label="Period (Duration)"
                      type="text"
                      required
                      value={formData.period}
                      onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                      placeholder="e.g. 2025 - Present"
                      className="w-full px-3.5 py-2 text-sm rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Description *
                  </label>
                  <textarea aria-label="Description"
                    rows={3}
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe your responsibilities and engineering contributions..."
                    className="w-full px-3.5 py-2 text-sm rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                {/* Achievements List */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Key Achievements / Metrics (Type and press Enter)
                  </label>
                  <div className="space-y-2">
                    {formData.achievements?.map((ach, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800 text-xs">
                        <span>• {ach}</span>
                        <button type="button" onClick={() => handleRemoveAchievement(idx)} className="text-red-500 hover:text-red-700">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    <input
                      type="text"
                      value={achievementInput}
                      onChange={(e) => setAchievementInput(e.target.value)}
                      onKeyDown={handleAddAchievement}
                      placeholder="Add an achievement (e.g. Boosted API throughput by 40%)..."
                      className="w-full px-3 py-1.5 text-xs rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Technologies */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Technologies Used (Type and press Enter)
                  </label>
                  <div className="flex flex-wrap gap-2 p-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                    {formData.technologies?.map((tech) => (
                      <span
                        key={tech}
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400"
                      >
                        {tech}
                        <button type="button" onClick={() => handleRemoveTech(tech)}>
                          <X className="w-3 h-3 hover:text-red-500" />
                        </button>
                      </span>
                    ))}
                    <input
                      type="text"
                      value={techInput}
                      onChange={(e) => setTechInput(e.target.value)}
                      onKeyDown={handleAddTech}
                      placeholder="Add tech..."
                      className="flex-1 min-w-[100px] bg-transparent text-xs text-gray-900 dark:text-white focus:outline-none p-1"
                    />
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
                    {editingExp ? 'Update Milestone' : 'Save Milestone'}
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

export default ExperienceManager;
