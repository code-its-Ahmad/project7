import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, X, Code2, Sparkles } from 'lucide-react';
import { skillsAPI, Skill } from '../../api/services';
import { usePortfolio } from '../../context/PortfolioContext';
import { useSound } from '../../context/SoundContext';
import { getSkillLevelFromPercentage, type SkillLevel } from '../../lib/utils';
import toast from 'react-hot-toast';


const SkillManager: React.FC = () => {
  const { skills, refetch } = usePortfolio();
  const { playClick, playHover, playSuccess } = useSound();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);

  const [formData, setFormData] = useState<Partial<Skill>>({
    name: '',
    category: 'Frontend',
    level: getSkillLevelFromPercentage(90),
    percentage: 90,
    icon: '⚡',
    color: 'from-blue-400 to-blue-600',
    featured: true,
    years_experience: '3+ yrs',
    order_index: 0,
  });


  const categories = ['All', 'Frontend', 'Backend', 'AI/ML', 'Mobile', 'Databases', 'DevOps'];
  const gradientOptions = [
    { label: 'Blue Gradient', value: 'from-blue-400 to-blue-600' },
    { label: 'Cyan to Teal', value: 'from-cyan-400 to-teal-500' },
    { label: 'Purple to Pink', value: 'from-purple-400 to-pink-600' },
    { label: 'Emerald to Green', value: 'from-emerald-400 to-green-600' },
    { label: 'Amber to Orange', value: 'from-amber-400 to-orange-600' },
    { label: 'Rose to Red', value: 'from-rose-400 to-red-600' },
    { label: 'Sky to Indigo', value: 'from-sky-400 to-indigo-600' },
  ];

  const handleOpenCreate = () => {
    playClick();
    setEditingSkill(null);
    const percentage = 88;
    setFormData({
      name: '',
      category: selectedCategory === 'All' ? 'Frontend' : selectedCategory,
      level: getSkillLevelFromPercentage(percentage),
      percentage,
      icon: '⚡',
      color: 'from-blue-400 to-blue-600',
      featured: true,
      years_experience: '2+ yrs',
      order_index: skills.length + 1,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (skill: Skill) => {
    playClick();
    setEditingSkill(skill);
    setFormData({
      ...skill,
      level: getSkillLevelFromPercentage(skill.percentage),
    });
    setIsModalOpen(true);
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.category) {
      toast.error('Skill name and category are required.');
      return;
    }

    // Derive level from percentage so the public portfolio and admin matrix
    // can never drift out of sync.
    const payload = {
      ...formData,
      level: getSkillLevelFromPercentage(formData.percentage),
    };

    try {
      if (editingSkill) {
        await skillsAPI.update(editingSkill.id, payload);
        toast.success('Skill updated successfully!');
      } else {
        await skillsAPI.create(payload);
        toast.success('Skill added successfully!');
      }
      playSuccess();
      setIsModalOpen(false);
      refetch();
    } catch (err: any) {
      toast.error('Failed to save skill.');
    }
  };


  const handleDelete = async (id: number, name: string) => {
    playClick();
    if (!window.confirm(`Delete skill "${name}"?`)) return;

    try {
      await skillsAPI.delete(id);
      toast.success('Skill deleted.');
      refetch();
    } catch (err) {
      toast.error('Failed to delete skill.');
    }
  };

  const filteredSkills = skills.filter((s) => {
    if (selectedCategory === 'All') return true;
    return s.category === selectedCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Skills & Technologies Matrix</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Configure technical proficiencies, progress bar metrics, and categorized skill badges.
          </p>
        </div>

        <button
          aria-label="Add new skill"
          onClick={handleOpenCreate}
          onMouseEnter={playHover}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm shadow-md shadow-blue-500/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Skill</span>
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => {
              playClick();
              setSelectedCategory(cat);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Skills Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredSkills.map((skill) => (
          <div
            key={skill.id}
            className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-2xl">{skill.icon || '⚡'}</div>
                <div className="flex items-center space-x-1">
                  <button
                    aria-label="Edit skill"
                    onClick={() => handleOpenEdit(skill)}
                    className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/50"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    aria-label="Delete skill"
                    onClick={() => handleDelete(skill.id, skill.name)}
                    className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-sm text-gray-900 dark:text-white">{skill.name}</h4>
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  <span>{skill.category}</span>
                  <span className="font-semibold text-blue-600 dark:text-blue-400">{getSkillLevelFromPercentage(skill.percentage)}</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-bold">
                  <span className="text-gray-400">Proficiency</span>
                  <span className="text-blue-500">{skill.percentage}%</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${skill.color || 'from-blue-500 to-indigo-600'}`}
                    style={{ width: `${skill.percentage}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-100 dark:border-gray-800/80 flex items-center justify-between text-[11px] text-gray-400">
              <span>{skill.years_experience || '2+ yrs'}</span>
              {skill.featured && (
                <span className="text-amber-500 font-semibold flex items-center gap-0.5">
                  ★ Featured
                </span>
              )}
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
                  {editingSkill ? 'Edit Skill' : 'Add New Skill'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Skill / Technology Name *
                  </label>
                  <input aria-label="Skill / Technology Name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. React / Next.js"
                    className="w-full px-3.5 py-2 text-sm rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Category *
                    </label>
                    <select aria-label="Category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3.5 py-2 text-sm rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="Frontend">Frontend</option>
                      <option value="Backend">Backend</option>
                      <option value="AI/ML">AI/ML</option>
                      <option value="Mobile">Mobile</option>
                      <option value="Databases">Databases</option>
                      <option value="DevOps">DevOps</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Proficiency Level
                    </label>
                    <div className="w-full px-3.5 py-2 text-sm rounded-xl bg-gray-100 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white flex items-center justify-between">
                      <span className="font-semibold text-blue-600 dark:text-blue-400">
                        {getSkillLevelFromPercentage(formData.percentage)}
                      </span>
                      <span className="text-[10px] text-gray-500 dark:text-gray-400">Auto-derived from %</span>
                    </div>
                  </div>

                </div>

                {/* Percentage Slider */}
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-gray-700 dark:text-gray-300">Proficiency Percentage</span>
                    <span className="text-blue-600 font-bold">{formData.percentage}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={formData.percentage}
                    onChange={(e) => {
                      const percentage = Number(e.target.value);
                      setFormData({
                        ...formData,
                        percentage,
                        level: getSkillLevelFromPercentage(percentage),
                      });
                    }}
                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg cursor-pointer accent-blue-600"
                  />

                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Icon / Emoji
                    </label>
                    <input aria-label="Icon / Emoji"
                      type="text"
                      value={formData.icon}
                      onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                      placeholder="⚛️, 🐍, 💙, 🤖"
                      className="w-full px-3.5 py-2 text-sm rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-center"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Color Theme
                    </label>
                    <select aria-label="Color Theme"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-full px-3.5 py-2 text-sm rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
                    >
                      {gradientOptions.map((g) => (
                        <option key={g.value} value={g.value}>
                          {g.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <label className="flex items-center space-x-2 text-xs font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(formData.featured)}
                      onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span>Show in Homepage Featured</span>
                  </label>
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
                    {editingSkill ? 'Update Skill' : 'Save Skill'}
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

export default SkillManager;
