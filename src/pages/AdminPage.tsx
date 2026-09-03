import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AdminLayout from '../components/admin/AdminLayout';
import AdminDashboard from '../components/admin/AdminDashboard';
import ProjectManager from '../components/admin/ProjectManager';
import SkillManager from '../components/admin/SkillManager';
import ExperienceManager from '../components/admin/ExperienceManager';
import ServiceManager from '../components/admin/ServiceManager';
import CertificateManager from '../components/admin/CertificateManager';
import TestimonialManager from '../components/admin/TestimonialManager';
import MessageInbox from '../components/admin/MessageInbox';
import ChatbotManager from '../components/admin/ChatbotManager';
import SettingsManager from '../components/admin/SettingsManager';
import UserManager from '../components/admin/UserManager';
import AdminProfile from '../components/admin/AdminProfile';
import { contactAPI } from '../api/services';

const AdminPage: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/admin/login');
    }
  }, [isAuthenticated, isLoading, navigate]);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await contactAPI.getMessages({ status: 'unread' });
        setUnreadCount(res.unreadCount || 0);
      } catch {
        // Non-blocking
      }
    };
    if (isAuthenticated) {
      fetchUnread();
    }
  }, [isAuthenticated, currentTab]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-semibold text-gray-400">Loading Admin Suite...</span>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout
      currentTab={currentTab}
      onTabChange={setCurrentTab}
      unreadCount={unreadCount}
    >
      {currentTab === 'dashboard' && <AdminDashboard onNavigate={setCurrentTab} />}
      {currentTab === 'projects' && <ProjectManager />}
      {currentTab === 'skills' && <SkillManager />}
      {currentTab === 'experience' && <ExperienceManager />}
      {currentTab === 'services' && <ServiceManager />}
      {currentTab === 'certificates' && <CertificateManager />}
      {currentTab === 'testimonials' && <TestimonialManager />}
      {currentTab === 'messages' && <MessageInbox />}
      {currentTab === 'chatbot' && <ChatbotManager />}
      {currentTab === 'settings' && <SettingsManager />}
      {currentTab === 'users' && <UserManager />}
      {currentTab === 'account' && <AdminProfile />}
    </AdminLayout>
  );
};

export default AdminPage;
