import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, Bot, Sparkles, X, MessageCircle, HelpCircle } from 'lucide-react';
import { chatbotAPI, ChatbotKnowledge } from '../../api/services';
import { useSound } from '../../context/SoundContext';
import toast from 'react-hot-toast';

const ChatbotManager: React.FC = () => {
  const [knowledgeList, setKnowledgeList] = useState<ChatbotKnowledge[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingKB, setEditingKB] = useState<ChatbotKnowledge | null>(null);
  const { playClick, playHover, playSuccess } = useSound();

  const [formData, setFormData] = useState<Partial<ChatbotKnowledge>>({
    category: 'general',
    trigger_keywords: 'project, pricing, hire',
    question: '',
    answer: '',
    order_index: 0,
  });

  const fetchKnowledge = async () => {
    try {
      const res = await chatbotAPI.getKnowledge();
      setKnowledgeList(res.knowledge || []);
    } catch (err) {
      console.error('Failed to fetch chatbot knowledge:', err);
    }
  };

  useEffect(() => {
    fetchKnowledge();
  }, []);

  const handleOpenCreate = () => {
    playClick();
    setEditingKB(null);
    setFormData({
      category: 'general',
      trigger_keywords: '',
      question: '',
      answer: '',
      order_index: knowledgeList.length + 1,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (kb: ChatbotKnowledge) => {
    playClick();
    setEditingKB(kb);
    setFormData({ ...kb });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.question || !formData.answer || !formData.trigger_keywords) {
      toast.error('Question, answer, and trigger keywords are required.');
      return;
    }

    try {
      if (editingKB) {
        await chatbotAPI.updateKnowledge(editingKB.id, formData);
        toast.success('Knowledge item updated!');
      } else {
        await chatbotAPI.createKnowledge(formData);
        toast.success('Knowledge item created!');
      }
      playSuccess();
      setIsModalOpen(false);
      fetchKnowledge();
    } catch (err) {
      toast.error('Failed to save knowledge item.');
    }
  };

  const handleDelete = async (id: number, question: string) => {
    playClick();
    if (!window.confirm(`Delete Q&A "${question}"?`)) return;

    try {
      await chatbotAPI.deleteKnowledge(id);
      toast.success('Q&A item deleted.');
      fetchKnowledge();
    } catch {
      toast.error('Failed to delete item.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Bot className="w-6 h-6 text-purple-500" />
            <span>AI Chatbot Knowledge Base & Context Engine</span>
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Define conversational knowledge pairs and triggers that empower your AI assistant to answer client questions accurately.
          </p>
        </div>

        <button
          aria-label="Add new knowledge entry"
          onClick={handleOpenCreate}
          onMouseEnter={playHover}
          className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold text-sm shadow-md shadow-purple-500/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Knowledge Q&A</span>
        </button>
      </div>

      {/* Info Banner */}
      <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 text-xs text-purple-900 dark:text-purple-200 flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
        <div>
          <strong>How the AI Knowledge Engine Works:</strong> Whenever a visitor types a question in the portfolio chatbot, the server matches triggers against this custom knowledge base combined with real-time profile, project, and service records from your cloud database.
        </div>
      </div>

      {/* Knowledge Base List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {knowledgeList.map((kb) => (
          <div
            key={kb.id}
            className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-3"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400">
                  {kb.category.toUpperCase()}
                </span>
                <div className="flex items-center space-x-1">
                  <button
                    aria-label="Edit knowledge entry"
                    onClick={() => handleOpenEdit(kb)}
                    className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/50"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    aria-label="Delete knowledge entry"
                    onClick={() => handleDelete(kb.id, kb.question)}
                    className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <h4 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-purple-500 shrink-0" />
                <span>{kb.question}</span>
              </h4>

              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap pl-5 border-l-2 border-purple-300 dark:border-purple-700">
                {kb.answer}
              </p>
            </div>

            <div className="text-[11px] text-gray-400 pt-2 border-t border-gray-100 dark:border-gray-800 truncate">
              <strong>Triggers:</strong> {kb.trigger_keywords}
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
                  {editingKB ? 'Edit Knowledge Q&A' : 'Add Knowledge Q&A'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
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
                      <option value="about">About & Background</option>
                      <option value="skills">Skills & Tech Stack</option>
                      <option value="projects">Projects & Case Studies</option>
                      <option value="services">Services & Pricing</option>
                      <option value="contact">Contact & Hiring</option>
                      <option value="availability">Availability</option>
                      <option value="cv">Resume / CV</option>
                      <option value="general">General</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Trigger Keywords * (Comma separated)
                    </label>
                    <input aria-label="Trigger Keywords * (Comma separated)"
                      type="text"
                      required
                      value={formData.trigger_keywords}
                      onChange={(e) => setFormData({ ...formData, trigger_keywords: e.target.value })}
                      placeholder="e.g. price, cost, rate"
                      className="w-full px-3.5 py-2 text-sm rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Question / Inquiry Prompt *
                  </label>
                  <input aria-label="Question / Inquiry Prompt"
                    type="text"
                    required
                    value={formData.question}
                    onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                    placeholder="e.g. What are your freelance rates?"
                    className="w-full px-3.5 py-2 text-sm rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    AI Response Text *
                  </label>
                  <textarea aria-label="AI Response Text"
                    rows={4}
                    required
                    value={formData.answer}
                    onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                    placeholder="Detailed response provided by the chatbot..."
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
                    className="px-5 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-md"
                  >
                    {editingKB ? 'Update Knowledge' : 'Save Knowledge'}
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

export default ChatbotManager;
