import { useState } from 'react';
import { motion } from 'framer-motion';
import Tilt from 'react-parallax-tilt';
import { Mail, Send, Copy, Check, Clock, Phone, Globe, MessageSquare, Sparkles } from 'lucide-react';
import { FaWhatsapp, FaLinkedin, FaGithub } from 'react-icons/fa';
import EarthCanvas from './3D/Earth';
import { usePortfolio } from '../context/PortfolioContext';
import { useSound } from '../context/SoundContext';
import { supabase } from '@/integrations/supabase/client';
import toast from 'react-hot-toast';

const Contact = () => {
  const { profile } = usePortfolio();
  const { playClick, playSuccess } = useSound();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    project_type: 'Full Stack Web',
    estimated_budget: '$1,000 - $3,000',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasCopiedEmail, setHasCopiedEmail] = useState(false);

  const emailAddress = profile?.email || 'Ahmadrajpootr1@gmail.com';
  const whatsappUrl =
    profile?.whatsapp ||
    'https://wa.me/923314815161?text=Hi%20Muhammad%20Ahmad,%20I%20have%20a%20project%20or%20hiring%20opportunity%20to%20discuss!';
  const linkedinUrl = profile?.linkedin || 'https://www.linkedin.com/in/muhammad-ahmad-565206291/';
  const githubUrl = profile?.github || 'https://github.com/code-its-Ahmad';

  const copyEmailToClipboard = () => {
    playClick();
    navigator.clipboard.writeText(emailAddress);
    setHasCopiedEmail(true);
    toast.success('Email copied to clipboard!');
    setTimeout(() => setHasCopiedEmail(false), 2500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      toast.error('Please fill in your name, email, and message.');
      return;
    }

    try {
      setIsSubmitting(true);
      playClick();

      /*
       * Messages go to the cloud backend (edge function -> contact_messages),
       * which validates server-side and stores the message durably. The old
       * local Express endpoint only existed on the dev machine, so anything a
       * visitor sent from the published site was silently lost.
       */
      const { data, error } = await supabase.functions.invoke('send-contact-message', {
        body: {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        subject: formData.subject.trim() || 'General Inquiry',
        message: formData.message.trim(),
        project_type: formData.project_type,
        estimated_budget: formData.estimated_budget,
        source: 'contact_form',
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      playSuccess();
      toast.success(data?.message || 'Message sent! Muhammad Ahmad will get back to you shortly.', {
        duration: 5000,
      });

      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
        project_type: 'Full Stack Web',
        estimated_budget: '$1,000 - $3,000',
      });
    } catch (err: any) {
      toast.error(
        err?.message || 'Failed to send message. Please try again or reach out via WhatsApp.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section
      id="contact"
      className="min-h-screen py-16 sm:py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-gradient-to-b from-gray-100 via-gray-50 to-gray-100 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 transition-colors duration-300"
    >
      <div className="relative z-10 max-w-7xl mx-auto w-full space-y-8 sm:space-y-10">
        {/* Section Header */}
        <div className="text-center space-y-2.5">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-semibold text-blue-600 dark:text-blue-400 backdrop-blur-md"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Let's Build Something Exceptional</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-2xl sm:text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent"
          >
            Contact & Consultation
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-400 max-w-lg mx-auto leading-relaxed"
          >
            Have a project in mind, want to hire for a remote role, or need architectural consultation? Send a message below!
          </motion.p>
        </div>

        {/* 2 Column Layout: Direct Channels & 3D Earth / Interactive Form */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
          {/* Left Column: Direct Communication Channels & 3D Earth */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-5 space-y-4 sm:space-y-6"
          >
            {/* Quick Contact Cards */}
            <div className="p-6 sm:p-7 rounded-3xl bg-white/85 dark:bg-gray-900/85 backdrop-blur-xl border border-gray-200 dark:border-gray-800 shadow-xl space-y-4">
              <h3 className="font-extrabold text-lg sm:text-xl text-gray-900 dark:text-white">
                Direct Channels
              </h3>

              <div className="space-y-3">
                {/* WhatsApp */}
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 transition-all group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-md">
                      <FaWhatsapp className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white">WhatsApp Instant Chat</div>
                      <div className="text-[11px] text-gray-500 dark:text-gray-400">+92 331 4815161</div>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-emerald-500 group-hover:translate-x-0.5 transition-transform">
                    Chat →
                  </span>
                </a>

                {/* Email with 1-click Copy */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20">
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <div className="w-9 h-9 rounded-xl bg-blue-500 text-white flex items-center justify-center shadow-md shrink-0">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <div className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white">Direct Email</div>
                      <div className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{emailAddress}</div>
                    </div>
                  </div>
                  <button
                    onClick={copyEmailToClipboard}
                    className="p-2 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-600 dark:text-blue-400 transition-colors shrink-0 ml-1.5 active:scale-95"
                    title="Copy Email"
                  >
                    {hasCopiedEmail ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                {/* LinkedIn & GitHub */}
                <div className="grid grid-cols-2 gap-2.5 pt-0.5">
                  <a
                    href={linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-gray-200 dark:border-gray-700 transition-colors text-xs font-semibold text-gray-700 dark:text-gray-200"
                  >
                    <FaLinkedin className="w-4 h-4 text-blue-500 shrink-0" />
                    <span className="truncate">LinkedIn</span>
                  </a>

                  <a
                    href={githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 transition-colors text-xs font-semibold text-gray-700 dark:text-gray-200"
                  >
                    <FaGithub className="w-4 h-4 text-purple-500 shrink-0" />
                    <span className="truncate">GitHub</span>
                  </a>
                </div>
              </div>

              {/* Working Hours & Timezone */}
              <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-blue-500" />
                  <span>Mon - Sat (24/7 Response)</span>
                </span>
                <span>PKT (UTC+5)</span>
              </div>
            </div>

            {/* 3D Planet Section */}
            <div className="relative w-full rounded-3xl overflow-hidden shadow-2xl border border-blue-500/20" style={{ height: 260 }}>
              <div className="absolute inset-0 bg-gradient-to-br from-[#020817] via-[#0a1628] to-[#020817]" />
              <div className="absolute inset-0">
                <EarthCanvas />
              </div>
              <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur border border-white/10 text-[10px] sm:text-xs font-semibold text-blue-300 whitespace-nowrap shadow-lg z-10">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                Global Remote · Available Worldwide
              </div>
            </div>
          </motion.div>

          {/* Right Column: Interactive Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-7"
          >
            <Tilt
              tiltMaxAngleX={4}
              tiltMaxAngleY={4}
              perspective={1000}
              scale={1.01}
              transitionSpeed={500}
              tiltEnable={typeof window !== 'undefined' ? window.innerWidth > 768 : true}
            >
              <form
                onSubmit={handleSubmit}
                className="p-6 sm:p-8 rounded-3xl bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl border border-gray-200 dark:border-gray-800 shadow-2xl space-y-4"
              >
                <div className="space-y-0.5">
                  <h3 className="font-extrabold text-xl sm:text-2xl text-gray-900 dark:text-white">
                    Send a Message
                  </h3>
                  <p className="text-xs text-gray-500">
                    Fill in your project details for an immediate follow-up.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Your Name *
                    </label>
                    <input aria-label="Your Name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Elena Rostova"
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-gray-50 dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700 text-xs sm:text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Your Email *
                    </label>
                    <input aria-label="Your Email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="e.g. elena@company.com"
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-gray-50 dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700 text-xs sm:text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Project Type
                    </label>
                    <select aria-label="Project Type"
                      value={formData.project_type}
                      onChange={(e) => setFormData({ ...formData, project_type: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-gray-50 dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700 text-xs sm:text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="Full Stack Web">Full Stack Web Application</option>
                      <option value="AI / ML Solutions">AI & Machine Learning Solution</option>
                      <option value="Mobile App">Cross-Platform Mobile App (Flutter)</option>
                      <option value="Cloud Architecture">Cloud Architecture & DevOps</option>
                      <option value="Full-Time Hiring">Full-Time / Contract Role</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Estimated Budget
                    </label>
                    <select aria-label="Estimated Budget"
                      value={formData.estimated_budget}
                      onChange={(e) => setFormData({ ...formData, estimated_budget: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-gray-50 dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700 text-xs sm:text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="<$1,000">Under $1,000</option>
                      <option value="$1,000 - $3,000">$1,000 - $3,000</option>
                      <option value="$3,000 - $7,000">$3,000 - $7,000</option>
                      <option value="$7,000+">$7,000+</option>
                      <option value="Monthly Retainer">Monthly Retainer / Full-Time</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Subject
                  </label>
                  <input aria-label="Subject"
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="e.g. AI SaaS Dashboard Development"
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-gray-50 dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700 text-xs sm:text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Message & Requirements *
                  </label>
                  <textarea aria-label="Message & Requirements"
                    rows={3}
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Tell me about your project goals, timelines, or role details..."
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-gray-50 dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700 text-xs sm:text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-2xl font-bold text-xs sm:text-sm shadow-xl shadow-blue-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
                >
                  <span>{isSubmitting ? 'Delivering Message...' : 'Send Message to Muhammad Ahmad'}</span>
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </Tilt>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
