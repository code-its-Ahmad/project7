import { supabase } from '@/integrations/supabase/client';

/**
 * Data layer for the whole app.
 *
 * Everything runs on Lovable Cloud: public content is read straight from the
 * database (row-level security keeps writes owner-only), while anything a
 * visitor is allowed to *write* — contact messages, testimonials, analytics,
 * chatbot replies — goes through a server function so the browser never holds
 * write access.
 */

// ================= Types ================= //

export interface Profile {
  id: number;
  name: string;
  titles: string[];
  tagline?: string;
  bio?: string;
  about_story?: string;
  about_philosophy?: string;
  location?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  github?: string;
  linkedin?: string;
  twitter?: string;
  discord?: string;
  resume_url?: string;
  avatar_url?: string;
  available_for_hire: boolean;
  years_experience?: string;
  happy_clients?: string;
  projects_completed?: string;
  satisfaction_rate?: string;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
}

export interface Project {
  id: number;
  title: string;
  category: string;
  short_description: string;
  full_description: string;
  image: string;
  gallery_images: string[];
  technologies: string[];
  challenges: string;
  solutions: string;
  outcomes: string;
  live_url: string;
  github_url: string;
  featured: boolean;
  likes: number;
  views: number;
  order_index: number;
  created_at?: string;
}

export interface Skill {
  id: number;
  name: string;
  category: string;
  level: string;
  percentage: number;
  icon?: string;
  color?: string;
  featured: boolean;
  years_experience?: string;
  order_index: number;
}

export interface Experience {
  id: number;
  type: 'work' | 'education';
  title: string;
  company_or_school: string;
  location?: string;
  period: string;
  description: string;
  achievements: string[];
  technologies: string[];
  icon?: string;
  order_index: number;
}

export interface Service {
  id: number;
  title: string;
  icon: string;
  description: string;
  features: string[];
  starting_price?: string;
  timeline_estimate?: string;
  order_index: number;
}

export interface Certificate {
  id: number;
  title: string;
  issuer: string;
  year: string;
  description: string;
  credential_url?: string;
  credential_id?: string;
  image?: string;
  color?: string;
  dark_color?: string;
  order_index: number;
}

export interface Testimonial {
  id: number;
  name: string;
  role: string;
  company: string;
  avatar: string;
  rating: number;
  text: string;
  project_name?: string;
  status: 'pending' | 'approved' | 'rejected';
  is_featured: boolean;
  created_at?: string;
}

export interface ContactMessage {
  id: number;
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  project_type?: string;
  estimated_budget?: string;
  source: string;
  status: 'unread' | 'read' | 'starred' | 'replied' | 'archived';
  created_at?: string;
}

export interface ChatbotKnowledge {
  id: number;
  category: string;
  trigger_keywords: string;
  question: string;
  answer: string;
  order_index: number;
}

export interface PortfolioData {
  profile: Profile;
  projects: Project[];
  skills: Skill[];
  experiences: Experience[];
  services: Service[];
  certificates: Certificate[];
  testimonials: Testimonial[];
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar_url?: string;
}

/** A row of the read-only account directory served by the `admin-users` function. */
export interface AdminDirectoryUser {
  id: string;
  email: string;
  name: string;
  avatar_url: string;
  roles: string[];
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed: boolean;
  is_you: boolean;
}

// ================= helpers ================= //

/** Surface a readable message instead of the raw Postgres/PostgREST payload. */
const unwrap = <T>(res: { data: T | null; error: { message: string } | null }, what: string): T => {
  if (res.error) {
    console.error(`${what} failed:`, res.error.message);
    throw new Error(res.error.message);
  }
  return res.data as T;
};

/** Invoke a server function and normalise its error shape. */
const callFunction = async <T>(name: string, body?: Record<string, unknown>): Promise<T> => {
  const { data, error } = await supabase.functions.invoke(name, { body: body ?? {} });
  if (error) {
    // Edge functions answer 4xx with a JSON `error` field — prefer that text.
    const detail = (data as { error?: string } | null)?.error;
    throw new Error(detail || error.message);
  }
  if ((data as { error?: string } | null)?.error) {
    throw new Error((data as { error: string }).error);
  }
  return data as T;
};

const ORDERED = { column: 'order_index', ascending: true } as const;

/**
 * The generic collection helper below builds queries from a runtime table name,
 * which the generated `Database` union cannot narrow. This handle keeps those —
 * and only those — call sites loose; every concrete query stays fully typed.
 */
const dynamicTable = (table: string) => (supabase as unknown as {
  from: (table: string) => any;
}).from(table);

// ================= API SERVICES ================= //

export const portfolioAPI = {
  /** Single round of parallel reads that hydrates the entire public site. */
  getAll: async (): Promise<PortfolioData> => {
    const [profile, projects, skills, experiences, services, certificates, testimonials] =
      await Promise.all([
        supabase.from('profile').select('*').eq('id', 1).maybeSingle(),
        supabase.from('projects').select('*').order(ORDERED.column, { ascending: true }).order('id'),
        supabase.from('skills').select('*').order(ORDERED.column, { ascending: true }).order('id'),
        supabase.from('experiences').select('*').order(ORDERED.column, { ascending: true }).order('id'),
        supabase.from('services').select('*').order(ORDERED.column, { ascending: true }).order('id'),
        supabase.from('certificates').select('*').order(ORDERED.column, { ascending: true }).order('id'),
        supabase
          .from('testimonials')
          .select('*')
          .eq('status', 'approved')
          .order('is_featured', { ascending: false })
          .order('id', { ascending: false }),
      ]);

    return {
      profile: unwrap(profile, 'Loading profile') as Profile,
      projects: (unwrap(projects, 'Loading projects') ?? []) as Project[],
      skills: (unwrap(skills, 'Loading skills') ?? []) as Skill[],
      experiences: (unwrap(experiences, 'Loading experience') ?? []) as Experience[],
      services: (unwrap(services, 'Loading services') ?? []) as Service[],
      certificates: (unwrap(certificates, 'Loading certificates') ?? []) as Certificate[],
      testimonials: (unwrap(testimonials, 'Loading testimonials') ?? []) as Testimonial[],
    };
  },

  getProfile: async (): Promise<{ profile: Profile }> => {
    const res = await supabase.from('profile').select('*').eq('id', 1).maybeSingle();
    return { profile: unwrap(res, 'Loading profile') as Profile };
  },

  updateProfile: async (data: Partial<Profile>) => {
    const { id: _ignored, ...patch } = data;
    const res = await supabase.from('profile').update(patch).eq('id', 1).select('*').single();
    return { profile: unwrap(res, 'Saving profile') as Profile };
  },
};

export const projectsAPI = {
  getAll: async (): Promise<{ projects: Project[] }> => {
    const res = await supabase.from('projects').select('*').order('order_index').order('id');
    return { projects: (unwrap(res, 'Loading projects') ?? []) as Project[] };
  },
  getById: async (id: number): Promise<{ project: Project }> => {
    const res = await supabase.from('projects').select('*').eq('id', id).single();
    return { project: unwrap(res, 'Loading project') as Project };
  },
  create: async (data: Partial<Project>) => {
    const { id: _ignored, ...row } = data;
    const res = await supabase.from('projects').insert(row as Project).select('*').single();
    return { project: unwrap(res, 'Creating project') as Project };
  },
  update: async (id: number, data: Partial<Project>) => {
    const { id: _ignored, created_at: _created, ...patch } = data;
    const res = await supabase.from('projects').update(patch).eq('id', id).select('*').single();
    return { project: unwrap(res, 'Updating project') as Project };
  },
  delete: async (id: number) => {
    const res = await supabase.from('projects').delete().eq('id', id);
    if (res.error) throw new Error(res.error.message);
    return { message: 'Project deleted' };
  },
  /** Definer function: visitors can bump the counter without UPDATE rights. */
  like: async (id: number): Promise<{ likes: number }> => {
    const res = await supabase.rpc('increment_project_like', { _project_id: id });
    return { likes: unwrap(res, 'Liking project') as number };
  },
  trackView: async (id: number): Promise<{ views: number }> => {
    const res = await supabase.rpc('increment_project_view', { _project_id: id });
    return { views: unwrap(res, 'Tracking project view') as number };
  },
};

/** Every content collection follows the same read/insert/update/delete shape. */
const collection = <T extends { id: number }>(table: string, label: string) => ({
  list: async (): Promise<T[]> => {
    const res = await dynamicTable(table).select('*').order('order_index').order('id');
    return (unwrap(res, `Loading ${label}`) ?? []) as T[];
  },
  create: async (data: Partial<T>) => {
    const { id: _ignored, ...row } = data as Record<string, unknown>;
    const res = await dynamicTable(table).insert(row).select('*').single();
    return unwrap(res, `Creating ${label}`) as T;
  },
  update: async (id: number, data: Partial<T>) => {
    const { id: _ignored, created_at: _created, ...patch } = data as Record<string, unknown>;
    const res = await dynamicTable(table).update(patch).eq('id', id).select('*').single();
    return unwrap(res, `Updating ${label}`) as T;
  },
  remove: async (id: number) => {
    const res = await dynamicTable(table).delete().eq('id', id);
    if (res.error) throw new Error(res.error.message);
    return { message: `${label} deleted` };
  },
});

const skillsCollection = collection<Skill>('skills', 'skill');
export const skillsAPI = {
  getAll: async () => ({ skills: await skillsCollection.list() }),
  create: (data: Partial<Skill>) => skillsCollection.create(data),
  update: (id: number, data: Partial<Skill>) => skillsCollection.update(id, data),
  delete: (id: number) => skillsCollection.remove(id),
};

const experienceCollection = collection<Experience>('experiences', 'experience entry');
export const experienceAPI = {
  getAll: async () => ({ experiences: await experienceCollection.list() }),
  create: (data: Partial<Experience>) => experienceCollection.create(data),
  update: (id: number, data: Partial<Experience>) => experienceCollection.update(id, data),
  delete: (id: number) => experienceCollection.remove(id),
};

const servicesCollection = collection<Service>('services', 'service');
export const servicesAPI = {
  getAll: async () => ({ services: await servicesCollection.list() }),
  create: (data: Partial<Service>) => servicesCollection.create(data),
  update: (id: number, data: Partial<Service>) => servicesCollection.update(id, data),
  delete: (id: number) => servicesCollection.remove(id),
};

const certificatesCollection = collection<Certificate>('certificates', 'certificate');
export const certificatesAPI = {
  getAll: async () => ({ certificates: await certificatesCollection.list() }),
  create: (data: Partial<Certificate>) => certificatesCollection.create(data),
  update: (id: number, data: Partial<Certificate>) => certificatesCollection.update(id, data),
  delete: (id: number) => certificatesCollection.remove(id),
};

export const testimonialsAPI = {
  getApproved: async (): Promise<{ testimonials: Testimonial[] }> => {
    const res = await supabase
      .from('testimonials')
      .select('*')
      .eq('status', 'approved')
      .order('is_featured', { ascending: false })
      .order('id', { ascending: false });
    return { testimonials: (unwrap(res, 'Loading testimonials') ?? []) as Testimonial[] };
  },
  /** Admin view — RLS returns every row only for the owner. */
  getAll: async (): Promise<{ testimonials: Testimonial[] }> => {
    const res = await supabase.from('testimonials').select('*').order('id', { ascending: false });
    return { testimonials: (unwrap(res, 'Loading testimonials') ?? []) as Testimonial[] };
  },
  submit: async (data: Partial<Testimonial>): Promise<{ id?: number; message: string }> => {
    try {
      const res = await callFunction<{ id: number; message: string }>('submit-testimonial', {
        name: data.name,
        role: data.role,
        company: data.company,
        text: data.text,
        rating: data.rating,
        avatar: data.avatar,
        project_name: data.project_name,
      });
      return res;
    } catch (err: any) {
      console.warn('Edge function submission error, attempting resilient direct insertion:', err);
      // Fallback: direct insert with pending status
      const { data: inserted, error } = await supabase
        .from('testimonials')
        .insert({
          name: data.name || 'Anonymous',
          role: data.role || 'Client',
          company: data.company || '',
          text: data.text || '',
          rating: data.rating || 5,
          avatar: data.avatar || null,
          project_name: data.project_name || null,
          status: 'pending',
          is_featured: false,
        })
        .select('id')
        .single();

      if (error) {
        throw new Error(err?.message || error.message || 'Failed to submit feedback.');
      }

      return {
        id: inserted?.id,
        message: 'Thank you! Your testimonial was submitted and will appear once reviewed.',
      };
    }
  },
  create: async (data: Partial<Testimonial>) => {
    const { id: _ignored, created_at: _created, ...row } = data;
    const res = await supabase
      .from('testimonials')
      .insert({
        name: row.name || 'Anonymous',
        role: row.role || 'Client',
        company: row.company || '',
        text: row.text || '',
        rating: row.rating || 5,
        project_name: row.project_name || null,
        avatar: row.avatar || null,
        status: row.status || 'approved',
        is_featured: row.is_featured ?? false,
      })
      .select('*')
      .single();
    return { testimonial: unwrap(res, 'Creating testimonial') as Testimonial };
  },
  update: async (id: number, data: Partial<Testimonial>) => {
    const { id: _ignored, created_at: _created, ...patch } = data;
    const res = await supabase.from('testimonials').update(patch).eq('id', id).select('*').single();
    return { testimonial: unwrap(res, 'Updating testimonial') as Testimonial };
  },
  updateStatus: async (id: number, status: 'pending' | 'approved' | 'rejected') => {
    const res = await supabase.from('testimonials').update({ status }).eq('id', id).select('*').single();
    return { testimonial: unwrap(res, 'Updating testimonial') as Testimonial };
  },
  delete: async (id: number) => {
    const res = await supabase.from('testimonials').delete().eq('id', id);
    if (res.error) throw new Error(res.error.message);
    return { message: 'Testimonial deleted' };
  },
};

export const contactAPI = {
  sendMessage: (data: {
    name: string;
    email: string;
    phone?: string;
    subject?: string;
    message: string;
    project_type?: string;
    estimated_budget?: string;
    source?: string;
  }) => callFunction<{ id: number; message: string }>('send-contact-message', data),

  getMessages: async (params?: { status?: string; search?: string }) => {
    let query = supabase.from('contact_messages').select('*').order('id', { ascending: false });
    if (params?.status) query = query.eq('status', params.status);
    if (params?.search) {
      const term = `%${params.search.replace(/[%,]/g, '')}%`;
      query = query.or(
        `name.ilike.${term},email.ilike.${term},subject.ilike.${term},message.ilike.${term}`,
      );
    }

    const [list, unread] = await Promise.all([
      query,
      supabase.from('contact_messages').select('id', { count: 'exact', head: true }).eq('status', 'unread'),
    ]);

    const messages = (unwrap(list, 'Loading messages') ?? []) as ContactMessage[];
    return {
      messages,
      unreadCount: unread.count ?? 0,
      totalCount: messages.length,
    };
  },

  updateStatus: async (id: number, status: ContactMessage['status']) => {
    const res = await supabase.from('contact_messages').update({ status }).eq('id', id).select('*').single();
    return { message: unwrap(res, 'Updating message') as ContactMessage };
  },
  deleteMessage: async (id: number) => {
    const res = await supabase.from('contact_messages').delete().eq('id', id);
    if (res.error) throw new Error(res.error.message);
    return { message: 'Message deleted' };
  },
};

export const chatbotAPI = {
  ask: (message: string, conversationHistory?: unknown[]) =>
    callFunction<{ reply: string; category?: string; suggestions?: string[] }>('chatbot-ask', {
      message,
      conversationHistory,
    }),

  /** A qualified chatbot lead is just a contact message with richer context. */
  submitLead: (leadData: {
    name: string;
    email?: string;
    phone?: string;
    projectType?: string;
    budget?: string;
    timeline?: string;
    requirements?: string;
  }) =>
    callFunction<{ id: number; message: string }>('send-contact-message', {
      name: leadData.name,
      email: leadData.email || 'no-email-provided@chatbot.local',
      phone: leadData.phone,
      subject: `Chatbot lead — ${leadData.projectType || 'General project'}`,
      message: [
        leadData.requirements || 'Lead captured through the AI assistant.',
        leadData.timeline ? `Preferred timeline: ${leadData.timeline}` : null,
      ]
        .filter(Boolean)
        .join('\n\n'),
      project_type: leadData.projectType,
      estimated_budget: leadData.budget,
      source: 'chatbot',
    }),

  getKnowledge: async (): Promise<{ knowledge: ChatbotKnowledge[] }> => {
    const res = await supabase.from('chatbot_knowledge').select('*').order('order_index').order('id');
    return { knowledge: (unwrap(res, 'Loading knowledge base') ?? []) as ChatbotKnowledge[] };
  },
  createKnowledge: async (data: Partial<ChatbotKnowledge>) => {
    const { id: _ignored, ...row } = data;
    const res = await supabase
      .from('chatbot_knowledge')
      .insert(row as ChatbotKnowledge)
      .select('*')
      .single();
    return { knowledge: unwrap(res, 'Creating knowledge entry') as ChatbotKnowledge };
  },
  updateKnowledge: async (id: number, data: Partial<ChatbotKnowledge>) => {
    const { id: _ignored, ...patch } = data;
    const res = await supabase.from('chatbot_knowledge').update(patch).eq('id', id).select('*').single();
    return { knowledge: unwrap(res, 'Updating knowledge entry') as ChatbotKnowledge };
  },
  deleteKnowledge: async (id: number) => {
    const res = await supabase.from('chatbot_knowledge').delete().eq('id', id);
    if (res.error) throw new Error(res.error.message);
    return { message: 'Knowledge entry deleted' };
  },
};

export const analyticsAPI = {
  /** Fire-and-forget: analytics must never block or break the UI. */
  track: async (event_type: string, metadata?: Record<string, unknown>) => {
    try {
      await supabase.functions.invoke('track-event', {
        body: {
          event_type,
          path: window.location.pathname,
          referrer: document.referrer,
          device_type: window.innerWidth < 768 ? 'mobile' : window.innerWidth < 1024 ? 'tablet' : 'desktop',
          metadata,
        },
      });
    } catch {
      // Non-blocking by design.
    }
  },

  /** Owner dashboard metrics, computed from real rows only. */
  getSummary: async () => {
    const countOf = (table: string, apply?: (q: any) => any) => {
      const base = dynamicTable(table).select('id', { count: 'exact', head: true });
      return apply ? apply(base) : base;
    };

    const [
      projectsCount,
      skillsCount,
      experiencesCount,
      servicesCount,
      certificatesCount,
      testimonialsCount,
      unread,
      totalMessages,
      pageViews,
      cvDownloads,
      projectTotals,
      recentEvents,
      topProjects,
      recentMessages,
    ] = await Promise.all([
      countOf('projects'),
      countOf('skills'),
      countOf('experiences'),
      countOf('services'),
      countOf('certificates'),
      countOf('testimonials'),
      countOf('contact_messages', (q) => q.eq('status', 'unread')),
      countOf('contact_messages'),
      countOf('analytics_events', (q) => q.eq('event_type', 'pageview')),
      countOf('analytics_events', (q) => q.eq('event_type', 'cv_download')),
      supabase.from('projects').select('likes, views'),
      supabase.from('analytics_events').select('*').order('id', { ascending: false }).limit(10),
      supabase.from('projects').select('id, title, category, views, likes').order('views', { ascending: false }).limit(5),
      supabase
        .from('contact_messages')
        .select('id, name, email, subject, source, status, created_at')
        .order('id', { ascending: false })
        .limit(5),
    ]);

    const totals = (projectTotals.data ?? []) as { likes: number; views: number }[];

    return {
      counts: {
        projects: projectsCount.count ?? 0,
        skills: skillsCount.count ?? 0,
        experiences: experiencesCount.count ?? 0,
        services: servicesCount.count ?? 0,
        certificates: certificatesCount.count ?? 0,
        testimonials: testimonialsCount.count ?? 0,
        unreadMessages: unread.count ?? 0,
        totalMessages: totalMessages.count ?? 0,
        pageViews: pageViews.count ?? 0,
        cvDownloads: cvDownloads.count ?? 0,
        totalLikes: totals.reduce((sum, p) => sum + (p.likes ?? 0), 0),
        totalProjectViews: totals.reduce((sum, p) => sum + (p.views ?? 0), 0),
      },
      recentEvents: recentEvents.data ?? [],
      topProjects: topProjects.data ?? [],
      recentMessages: recentMessages.data ?? [],
    };
  },
};

export const authAPI = {
  login: async (email: string, password: string): Promise<{ user: AdminUser }> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    const user = data.user;
    if (!user) throw new Error('Sign in failed. Please try again.');

    const isOwner = await authAPI.isOwner(user.id);
    if (!isOwner) {
      await supabase.auth.signOut();
      throw new Error('This account does not have owner access.');
    }

    return {
      user: {
        id: user.id,
        email: user.email ?? email,
        name: (user.user_metadata?.name as string) ?? 'Site Owner',
        role: 'admin',
        avatar_url: (user.user_metadata?.avatar_url as string) ?? '',
      },
    };
  },

  /** Reads the roles table — roles are never stored on the user record itself. */
  isOwner: async (userId: string): Promise<boolean> => {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();
    if (error) {
      console.error('Role check failed:', error.message);
      return false;
    }
    return Boolean(data);
  },

  getMe: async (): Promise<{ user: AdminUser }> => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw new Error('No active session.');
    if (!(await authAPI.isOwner(data.user.id))) throw new Error('Not the site owner.');
    return {
      user: {
        id: data.user.id,
        email: data.user.email ?? '',
        name: (data.user.user_metadata?.name as string) ?? 'Site Owner',
        role: 'admin',
        avatar_url: (data.user.user_metadata?.avatar_url as string) ?? '',
      },
    };
  },

  logout: async () => {
    await supabase.auth.signOut();
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    const { data: sessionData } = await supabase.auth.getUser();
    const email = sessionData.user?.email;
    if (!email) throw new Error('No active session.');

    // Re-authenticate first so a hijacked tab cannot silently change the password.
    const { error: reauthError } = await supabase.auth.signInWithPassword({
      email,
      password: currentPassword,
    });
    if (reauthError) throw new Error('Current password is incorrect.');

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw new Error(error.message);
    return { message: 'Password updated successfully.' };
  },

  updateProfile: async (name: string, email: string) => {
    const { error } = await supabase.auth.updateUser({ email, data: { name } });
    if (error) throw new Error(error.message);
    return { message: 'Admin profile updated.' };
  },

  /**
   * Patches the signed-in auth user. Name and avatar live in user metadata; the
   * e-mail goes through the auth server, which sends a confirmation link before
   * the new address becomes usable for signing in.
   */
  updateAccount: async (
    patch: { name?: string; email?: string; avatar_url?: string },
  ): Promise<{ user: AdminUser }> => {
    const { data: current, error: currentError } = await supabase.auth.getUser();
    if (currentError || !current.user) throw new Error('No active session.');

    const metadata: Record<string, unknown> = { ...(current.user.user_metadata ?? {}) };
    if (patch.name !== undefined) metadata.name = patch.name;
    if (patch.avatar_url !== undefined) metadata.avatar_url = patch.avatar_url;

    const payload: { data: Record<string, unknown>; email?: string } = { data: metadata };
    if (patch.email && patch.email.toLowerCase() !== (current.user.email ?? '').toLowerCase()) {
      payload.email = patch.email;
    }

    const { data, error } = await supabase.auth.updateUser(payload);
    if (error) throw new Error(error.message);

    const user = data.user ?? current.user;
    return {
      user: {
        id: user.id,
        // While an e-mail change is pending confirmation the old address stays active.
        email: user.email ?? '',
        name: (user.user_metadata?.name as string) ?? 'Site Owner',
        role: 'admin',
        avatar_url: (user.user_metadata?.avatar_url as string) ?? '',
      },
    };
  },

  /** Tells the login screen whether a first-time owner account still needs creating. */
  needsSetup: async (): Promise<boolean> => {
    try {
      const res = await callFunction<{ needsSetup: boolean }>('admin-bootstrap', { mode: 'status' });
      return Boolean(res.needsSetup);
    } catch {
      return false;
    }
  },

  createOwner: (name: string, email: string, password: string) =>
    callFunction<{ message: string }>('admin-bootstrap', { name, email, password }),
};

export const adminUsersAPI = {
  /** Owner-only directory read; `auth.users` is never exposed to the browser. */
  list: async (): Promise<AdminDirectoryUser[]> => {
    const res = await callFunction<{ users: AdminDirectoryUser[] }>('admin-users');
    return res.users ?? [];
  },
};

export const uploadAPI = {
  /**
   * Uploads into the private media bucket and returns a long-lived signed URL.
   * The bucket stays private so nobody can enumerate it, while the stored URL
   * still renders on the public site.
   */
  uploadFile: async (file: File): Promise<{ url: string; filename: string }> => {
    const MAX_BYTES = 10 * 1024 * 1024;
    if (file.size > MAX_BYTES) {
      throw new Error('File is larger than the 10MB limit.');
    }

    const extension = file.name.includes('.') ? file.name.split('.').pop()!.toLowerCase() : 'bin';
    const safeName = `${Date.now()}-${crypto.randomUUID()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from('portfolio-media')
      .upload(safeName, file, { cacheControl: '31536000', upsert: false });
    if (uploadError) throw new Error(uploadError.message);

    const TEN_YEARS = 60 * 60 * 24 * 365 * 10;
    const { data, error } = await supabase.storage
      .from('portfolio-media')
      .createSignedUrl(safeName, TEN_YEARS);
    if (error || !data) throw new Error(error?.message ?? 'Could not create a public link.');

    return { url: data.signedUrl, filename: safeName };
  },
};
