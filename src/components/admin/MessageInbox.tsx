import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  Mail,
  Phone,
  Calendar,
  Trash2,
  Star,
  CheckCircle,
  Archive,
  Search,
  ExternalLink,
  Bot,
  Send,
  Download,
  Clock,
  User,
  DollarSign,
  Briefcase,
} from 'lucide-react';
import { contactAPI, ContactMessage } from '../../api/services';
import { useSound } from '../../context/SoundContext';
import toast from 'react-hot-toast';

const MessageInbox: React.FC = () => {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { playClick, playHover } = useSound();

  const fetchMessages = async () => {
    try {
      setIsLoading(true);
      const res = await contactAPI.getMessages({
        status: statusFilter === 'all' ? undefined : statusFilter,
        search: searchQuery || undefined,
      });
      setMessages(res.messages || []);
      if (res.messages?.length > 0 && !selectedMessage) {
        setSelectedMessage(res.messages[0]);
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMessages();
  };

  const handleUpdateStatus = async (id: number, status: ContactMessage['status']) => {
    playClick();
    try {
      await contactAPI.updateStatus(id, status);
      toast.success(`Message marked as ${status}`);
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, status } : m))
      );
      if (selectedMessage?.id === id) {
        setSelectedMessage((prev) => (prev ? { ...prev, status } : null));
      }
    } catch {
      toast.error('Failed to update status.');
    }
  };

  const handleDelete = async (id: number) => {
    playClick();
    if (!window.confirm('Are you sure you want to permanently delete this message?')) return;

    try {
      await contactAPI.deleteMessage(id);
      toast.success('Message deleted.');
      setMessages((prev) => prev.filter((m) => m.id !== id));
      if (selectedMessage?.id === id) {
        setSelectedMessage(null);
      }
    } catch {
      toast.error('Failed to delete message.');
    }
  };

  const exportMessages = () => {
    playClick();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(messages, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `portfolio_inbox_export_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success('Exported messages to JSON file.');
  };

  const unreadCount = messages.filter((m) => m.status === 'unread').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span>Inquiries & Leads Inbox</span>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full">
                {unreadCount} Unread
              </span>
            )}
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Real-time messages from the Contact Form, AI Chatbot leads, and Project Estimator.
          </p>
        </div>

        <button
          onClick={exportMessages}
          onMouseEnter={playHover}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl text-xs font-semibold shadow-sm transition-all self-start sm:self-auto"
        >
          <Download className="w-4 h-4" />
          <span>Export to JSON</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
        <form onSubmit={handleSearch} className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search sender, email, keywords..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
          />
        </form>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 custom-scrollbar">
          {['all', 'unread', 'starred', 'replied', 'archived'].map((status) => (
            <button
              key={status}
              onClick={() => {
                playClick();
                setStatusFilter(status);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition-all ${
                statusFilter === status
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Split Inbox Layout: Left List, Right Message Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[550px]">
        {/* Left Column: Message List */}
        <div className="lg:col-span-5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm flex flex-col">
          <div className="p-3.5 border-b border-gray-100 dark:border-gray-800 text-xs font-bold text-gray-400 uppercase tracking-wider">
            All Inquiries ({messages.length})
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800 max-h-[600px] custom-scrollbar">
            {messages.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-xs">
                No messages found matching your criteria.
              </div>
            ) : (
              messages.map((msg) => {
                const isSelected = selectedMessage?.id === msg.id;
                const isUnread = msg.status === 'unread';
                const isStarred = msg.status === 'starred';
                const isChatbot = msg.source === 'chatbot';

                return (
                  <div
                    key={msg.id}
                    onClick={() => {
                      playClick();
                      setSelectedMessage(msg);
                      if (isUnread) {
                        handleUpdateStatus(msg.id, 'read');
                      }
                    }}
                    className={`p-4 cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-950/40 border-l-4 border-blue-600'
                        : isUnread
                        ? 'bg-white dark:bg-gray-900 font-semibold'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center space-x-2 overflow-hidden">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                            isChatbot
                              ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400'
                              : 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400'
                          }`}
                        >
                          {isChatbot ? <Bot className="w-3.5 h-3.5" /> : msg.name.charAt(0)}
                        </div>
                        <span className="font-bold text-sm text-gray-900 dark:text-white truncate">
                          {msg.name}
                        </span>
                      </div>

                      <div className="flex items-center space-x-1 shrink-0">
                        {isStarred && <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />}
                        {isUnread && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
                        <span className="text-[10px] text-gray-400">
                          {msg.created_at ? new Date(msg.created_at).toLocaleDateString() : ''}
                        </span>
                      </div>
                    </div>

                    <div className="mt-1 text-xs text-gray-700 dark:text-gray-300 font-medium truncate">
                      {msg.subject || 'Project Inquiry'}
                    </div>

                    <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                      {msg.message}
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[10px] text-gray-400">
                      <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800">
                        {msg.source}
                      </span>
                      {msg.estimated_budget && msg.estimated_budget !== 'Not specified' && (
                        <span className="text-emerald-500 font-semibold">
                          Budget: {msg.estimated_budget}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Message Detail View */}
        <div className="lg:col-span-7 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm flex flex-col justify-between overflow-hidden">
          {selectedMessage ? (
            <div className="flex-1 flex flex-col justify-between">
              {/* Message Header & Action Toolbar */}
              <div>
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                      {selectedMessage.subject || 'Project Inquiry'}
                    </h3>
                    <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{selectedMessage.created_at}</span>
                    </div>
                  </div>

                  {/* Status update actions */}
                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() =>
                        handleUpdateStatus(
                          selectedMessage.id,
                          selectedMessage.status === 'starred' ? 'read' : 'starred'
                        )
                      }
                      className={`p-2 rounded-xl border transition-colors ${
                        selectedMessage.status === 'starred'
                          ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/40 text-amber-500'
                          : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:text-amber-500'
                      }`}
                      title="Star Message"
                    >
                      <Star className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleUpdateStatus(selectedMessage.id, 'replied')}
                      className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-emerald-500 transition-colors"
                      title="Mark as Replied"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleUpdateStatus(selectedMessage.id, 'archived')}
                      className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-blue-500 transition-colors"
                      title="Archive Message"
                    >
                      <Archive className="w-4 h-4" />
                    </button>

                    <button
                      aria-label="Delete message"
                      onClick={() => handleDelete(selectedMessage.id)}
                      className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-red-500 transition-colors"
                      title="Delete Message"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Sender Metadata Box */}
                <div className="p-6 bg-gray-50 dark:bg-gray-800/40 border-b border-gray-100 dark:border-gray-800/80 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-200">
                    <User className="w-4 h-4 text-blue-500" />
                    <span><strong>Sender:</strong> {selectedMessage.name}</span>
                  </div>

                  <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-200">
                    <Mail className="w-4 h-4 text-blue-500" />
                    <a
                      href={`mailto:${selectedMessage.email}`}
                      className="text-blue-600 dark:text-blue-400 hover:underline truncate"
                    >
                      {selectedMessage.email}
                    </a>
                  </div>

                  {selectedMessage.phone && (
                    <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-200">
                      <Phone className="w-4 h-4 text-green-500" />
                      <span>{selectedMessage.phone}</span>
                    </div>
                  )}

                  {selectedMessage.project_type && (
                    <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-200">
                      <Briefcase className="w-4 h-4 text-purple-500" />
                      <span>{selectedMessage.project_type}</span>
                    </div>
                  )}

                  {selectedMessage.estimated_budget && (
                    <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-200">
                      <DollarSign className="w-4 h-4 text-emerald-500" />
                      <span>Budget: {selectedMessage.estimated_budget}</span>
                    </div>
                  )}
                </div>

                {/* Message Content */}
                <div className="p-6 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Message Body
                  </h4>
                  <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/70 border border-gray-200/60 dark:border-gray-700/60 text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
                    {selectedMessage.message}
                  </div>
                </div>
              </div>

              {/* Quick Reply Actions */}
              <div className="p-6 bg-gray-50 dark:bg-gray-800/40 border-t border-gray-100 dark:border-gray-800 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-gray-500">
                  Quick reply channels:
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`mailto:${selectedMessage.email}?subject=Re: ${encodeURIComponent(
                      selectedMessage.subject || 'Portfolio Inquiry'
                    )}`}
                    onClick={() => handleUpdateStatus(selectedMessage.id, 'replied')}
                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/20 transition-all"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Reply via Email</span>
                  </a>

                  {selectedMessage.phone && (
                    <a
                      href={`https://wa.me/${selectedMessage.phone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-green-500/20 transition-all"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>WhatsApp Chat</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-gray-400 space-y-2">
              <MessageSquare className="w-12 h-12 opacity-30" />
              <p className="text-sm font-semibold">Select an inquiry from the list to view full details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageInbox;
