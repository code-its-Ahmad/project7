import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  Heart,
  ExternalLink,
  Github,
  Image as ImageIcon,
  Check,
  X,
  Upload,
  Sparkles,
} from 'lucide-react';
import { projectsAPI, uploadAPI, Project } from '../../api/services';
import { usePortfolio } from '../../context/PortfolioContext';
import { useSound } from '../../context/SoundContext';
import toast from 'react-hot-toast';

const ProjectManager: React.FC = () => {
  const { projects, refetch } = usePortfolio();
  const { playClick, playHover, playSuccess } = useSound();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Form State
  const [formData, setFormData] = useState<Partial<Project>>({
    title: '',
    category: 'Full Stack Web',
    short_description: '',
    full_description: '',
    image: '/assets/project1.png',
    gallery_images: [],
    technologies: [],
    challenges: '',
    solutions: '',
    outcomes: '',
    live_url: '',
    github_url: '',
    featured: true,
    order_index: 0,
  });

  const [techInput, setTechInput] = useState('');

  const categories = ['All', 'Full Stack Web', 'AI & Mobile', 'AI/ML', 'Mobile', 'Cloud & DevOps'];

  const handleOpenCreate = () => {
    playClick();
    setEditingProject(null);
    setFormData({
      title: '',
      category: 'Full Stack Web',
      short_description: '',
      full_description: '',
      image: '/assets/project1.png',
      gallery_images: [],
      technologies: ['React', 'Node.js', 'TypeScript', 'TailwindCSS'],
      challenges: '',
      solutions: '',
      outcomes: '',
      live_url: '',
      github_url: '',
      featured: true,
      order_index: projects.length + 1,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (project: Project) => {
    playClick();
    setEditingProject(project);
    setFormData({ ...project });
    setIsModalOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const res = await uploadAPI.uploadFile(file);
      setFormData((prev) => ({ ...prev, image: res.url }));
      toast.success('Cover image uploaded successfully!');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to upload image.');
    } finally {
      setIsUploading(false);
    }
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
    if (!formData.title || !formData.category || !formData.short_description) {
      toast.error('Please fill in all required fields.');
      return;
    }

    const payload = {
      ...formData,
      full_description: formData.full_description || formData.short_description,
    };

    try {
      if (editingProject) {
        await projectsAPI.update(editingProject.id, payload);
        toast.success('Project updated successfully!');
      } else {
        await projectsAPI.create(payload);
        toast.success('Project created successfully!');
      }
      playSuccess();
      setIsModalOpen(false);
      refetch();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to save project.');
    }
  };

  const handleDelete = async (id: number, title: string) => {
    playClick();
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;

    try {
      await projectsAPI.delete(id);
      toast.success('Project deleted.');
      refetch();
    } catch (err: any) {
      toast.error('Failed to delete project.');
    }
  };

  const filteredProjects = projects.filter((p) => {
    const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.short_description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.technologies.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Projects Management</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Create, edit, and organize all projects shown in your portfolio showcase.
          </p>
        </div>

        <button
          aria-label="Add new project"
          onClick={handleOpenCreate}
          onMouseEnter={playHover}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm shadow-md shadow-blue-500/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Project</span>
        </button>
      </div>

      {/* Search & Category Filter Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects or technologies..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 custom-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                playClick();
                setCategoryFilter(cat);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                categoryFilter === cat
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Projects Grid / Table */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((project) => (
          <div
            key={project.id}
            className="flex flex-col justify-between rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm hover:shadow-xl transition-all"
          >
            {/* Card Header & Image */}
            <div>
              <div className="relative h-44 w-full bg-gray-100 dark:bg-gray-800 overflow-hidden group">
                <img
                  src={project.image}
                  alt={project.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e: any) => {
                    e.target.src = '/assets/project1.png';
                  }}
                />
                <div className="absolute top-3 left-3 flex gap-2">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-black/60 backdrop-blur-md text-white">
                    {project.category}
                  </span>
                  {project.featured && (
                    <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-amber-500 text-white flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Featured
                    </span>
                  )}
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 space-y-3">
                <h3 className="font-bold text-base text-gray-900 dark:text-white line-clamp-1">
                  {project.title}
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
                  {project.short_description}
                </p>

                {/* Tech Chips */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {project.technologies?.slice(0, 4).map((tech) => (
                    <span
                      key={tech}
                      className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50"
                    >
                      {tech}
                    </span>
                  ))}
                  {project.technologies?.length > 4 && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-gray-100 dark:bg-gray-800 text-gray-500">
                      +{project.technologies.length - 4}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Card Footer Actions */}
            <div className="p-4 bg-gray-50 dark:bg-gray-800/40 border-t border-gray-100 dark:border-gray-800/80 flex items-center justify-between">
              <div className="flex items-center space-x-3 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" /> {project.views || 0}
                </span>
                <span className="flex items-center gap-1 text-pink-500">
                  <Heart className="w-3.5 h-3.5 fill-pink-500" /> {project.likes || 0}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  aria-label="Edit project"
                  onClick={() => handleOpenEdit(project)}
                  className="p-1.5 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors"
                  title="Edit Project"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  aria-label="Delete project"
                  onClick={() => handleDelete(project.id, project.title)}
                  className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors"
                  title="Delete Project"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create / Edit Project Modal */}
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
              className="relative w-full max-w-3xl bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden z-10 max-h-[90vh] flex flex-col"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                  {editingProject ? 'Edit Project' : 'Create New Project'}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                      Project Title *
                    </label>
                    <input aria-label="Project Title"
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g. GreenGuardian AI"
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                      Category *
                    </label>
                    <select aria-label="Category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Full Stack Web">Full Stack Web</option>
                      <option value="AI & Mobile">AI & Mobile</option>
                      <option value="AI/ML">AI/ML</option>
                      <option value="Mobile">Mobile</option>
                      <option value="Cloud & DevOps">Cloud & DevOps</option>
                    </select>
                  </div>
                </div>

                {/* Short Description */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Short Description (Summary) *
                  </label>
                  <textarea aria-label="Short Description (Summary)"
                    rows={2}
                    required
                    value={formData.short_description}
                    onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                    placeholder="Brief 1-2 sentence overview of the project..."
                    className="w-full px-3.5 py-2 text-sm rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Full Case Study Description */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Full Case Study Description
                  </label>
                  <textarea aria-label="Full Case Study Description"
                    rows={4}
                    value={formData.full_description}
                    onChange={(e) => setFormData({ ...formData, full_description: e.target.value })}
                    placeholder="Comprehensive explanation of architecture, technical specifications, and system design..."
                    className="w-full px-3.5 py-2 text-sm rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Cover Image & Upload */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Cover Image URL / Upload
                  </label>
                  <div className="flex items-center gap-3">
                    <input aria-label="Cover Image URL / Upload"
                      type="text"
                      value={formData.image}
                      onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                      placeholder="/assets/project1.png or https://..."
                      className="flex-1 px-3.5 py-2 text-sm rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
                    />
                    <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl text-xs font-semibold cursor-pointer border border-gray-200 dark:border-gray-700">
                      <Upload className="w-4 h-4" />
                      <span>{isUploading ? 'Uploading...' : 'Upload'}</span>
                      <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                    </label>
                  </div>
                </div>

                {/* Tech Stack Tags */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Tech Stack (Type and press Enter)
                  </label>
                  <div className="flex flex-wrap gap-2 p-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 min-h-[44px]">
                    {formData.technologies?.map((tech) => (
                      <span
                        key={tech}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
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
                      placeholder="Add tech (e.g. Next.js)..."
                      className="flex-1 min-w-[120px] bg-transparent text-xs text-gray-900 dark:text-white focus:outline-none p-1"
                    />
                  </div>
                </div>

                {/* Case Study Details: Challenges, Solutions, Outcomes */}
                <div className="space-y-4 pt-2 border-t border-gray-100 dark:border-gray-800">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Case Study Highlights
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
                        Challenges Faced
                      </label>
                      <textarea aria-label="Challenges Faced"
                        rows={2}
                        value={formData.challenges}
                        onChange={(e) => setFormData({ ...formData, challenges: e.target.value })}
                        placeholder="Technical hurdles..."
                        className="w-full p-2 text-xs rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
                        Solutions Built
                      </label>
                      <textarea aria-label="Solutions Built"
                        rows={2}
                        value={formData.solutions}
                        onChange={(e) => setFormData({ ...formData, solutions: e.target.value })}
                        placeholder="Engineering approach..."
                        className="w-full p-2 text-xs rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
                        Measurable Outcomes
                      </label>
                      <textarea aria-label="Measurable Outcomes"
                        rows={2}
                        value={formData.outcomes}
                        onChange={(e) => setFormData({ ...formData, outcomes: e.target.value })}
                        placeholder="Metrics & results..."
                        className="w-full p-2 text-xs rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Live URL & GitHub URL */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                      Live Demo URL
                    </label>
                    <input aria-label="Live Demo URL"
                      type="text"
                      value={formData.live_url}
                      onChange={(e) => setFormData({ ...formData, live_url: e.target.value })}
                      placeholder="https://..."
                      className="w-full px-3.5 py-2 text-sm rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                      GitHub Repository URL
                    </label>
                    <input aria-label="GitHub Repository URL"
                      type="text"
                      value={formData.github_url}
                      onChange={(e) => setFormData({ ...formData, github_url: e.target.value })}
                      placeholder="https://github.com/..."
                      className="w-full px-3.5 py-2 text-sm rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Featured Checkbox & Order Index */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                  <label className="flex items-center space-x-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(formData.featured)}
                      onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      Featured on Homepage Hero & Top Showcase
                    </span>
                  </label>

                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500">Order:</span>
                    <input
                      type="number"
                      value={formData.order_index}
                      onChange={(e) => setFormData({ ...formData, order_index: Number(e.target.value) })}
                      className="w-16 px-2 py-1 text-xs rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-center"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/20"
                  >
                    {editingProject ? 'Update Project' : 'Create Project'}
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

export default ProjectManager;
