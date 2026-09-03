import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  portfolioAPI,
  projectsAPI,
  Profile,
  Project,
  Skill,
  Experience,
  Service,
  Certificate,
  Testimonial,
} from '../api/services';

interface PortfolioContextType {
  profile: Profile | null;
  projects: Project[];
  skills: Skill[];
  experiences: Experience[];
  services: Service[];
  certificates: Certificate[];
  testimonials: Testimonial[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  likeProject: (id: number) => Promise<void>;
  trackProjectView: (id: number) => Promise<void>;
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

export const PortfolioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPortfolioData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await portfolioAPI.getAll();
      setProfile(data.profile);
      setProjects(data.projects || []);
      setSkills(data.skills || []);
      setExperiences(data.experiences || []);
      setServices(data.services || []);
      setCertificates(data.certificates || []);
      setTestimonials(data.testimonials || []);
    } catch (err: any) {
      console.error('Error loading portfolio data:', err);
      setError(err?.message || 'Failed to load live portfolio data.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPortfolioData();
  }, [fetchPortfolioData]);

  const likeProject = async (id: number) => {
    try {
      // Optimistic update
      setProjects((prev) =>
        prev.map((p) => (p.id === id ? { ...p, likes: (p.likes || 0) + 1 } : p))
      );
      const res = await projectsAPI.like(id);
      setProjects((prev) =>
        prev.map((p) => (p.id === id ? { ...p, likes: res.likes } : p))
      );
    } catch (err) {
      console.error('Failed to like project:', err);
    }
  };

  const trackProjectView = async (id: number) => {
    try {
      await projectsAPI.trackView(id);
    } catch {
      // Non-blocking
    }
  };

  return (
    <PortfolioContext.Provider
      value={{
        profile,
        projects,
        skills,
        experiences,
        services,
        certificates,
        testimonials,
        isLoading,
        error,
        refetch: fetchPortfolioData,
        likeProject,
        trackProjectView,
      }}
    >
      {children}
    </PortfolioContext.Provider>
  );
};

export const usePortfolio = () => {
  const context = useContext(PortfolioContext);
  if (!context) {
    throw new Error('usePortfolio must be used within a PortfolioProvider');
  }
  return context;
};
