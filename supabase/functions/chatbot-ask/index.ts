import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import { clean, corsHeaders, json } from '../_shared/cors.ts';

/**
 * Portfolio assistant. Answers are derived from the real database content
 * (profile, projects, skills, services and the admin-managed knowledge base) —
 * there is no canned dataset in this file.
 */

interface KnowledgeRow {
  category: string;
  trigger_keywords: string;
  answer: string;
}

const followUps = (category: string): string[] => {
  switch (category) {
    case 'about':
      return ['What are your key projects?', 'What technologies do you use?', 'Are you available for hire?'];
    case 'skills':
      return ['Show me AI projects', 'What is your backend experience?', 'Get a project quote'];
    case 'services':
      return ['Estimate my project', 'How do we get started?', 'Schedule a call'];
    case 'contact':
      return ['Open WhatsApp', 'Download CV', 'Send email'];
    default:
      return ['Tell me about your projects', 'What are your rates?', 'How can I hire you?'];
  }
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const payload = await req.json().catch(() => ({}));
    const message = clean(payload.message, 1000);
    if (!message) return json({ error: 'Message cannot be empty.' }, 400);

    const query = message.toLowerCase();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } },
    );

    const [profileRes, projectsRes, skillsRes, servicesRes, experiencesRes, knowledgeRes] =
      await Promise.all([
        supabase.from('profile').select('*').eq('id', 1).maybeSingle(),
        supabase
          .from('projects')
          .select('title, category, short_description, technologies, live_url')
          .order('order_index')
          .limit(6),
        supabase.from('skills').select('name, category, percentage').eq('featured', true).order('order_index'),
        supabase.from('services').select('title, starting_price, timeline_estimate, description').order('order_index'),
        supabase
          .from('experiences')
          .select('title, company_or_school, period, type')
          .eq('type', 'work')
          .order('order_index'),
        supabase.from('chatbot_knowledge').select('category, trigger_keywords, answer').order('order_index'),
      ]);

    const profile = profileRes.data ?? {};
    const projects = projectsRes.data ?? [];
    const skills = skillsRes.data ?? [];
    const services = servicesRes.data ?? [];
    const experiences = experiencesRes.data ?? [];
    const knowledge = (knowledgeRes.data ?? []) as KnowledgeRow[];

    // 1) Admin-curated knowledge base, weighted by keyword specificity.
    let best: KnowledgeRow | null = null;
    let bestScore = 0;
    for (const kb of knowledge) {
      const keywords = (kb.trigger_keywords ?? '').toLowerCase().split(',').map((k) => k.trim());
      let score = 0;
      for (const kw of keywords) if (kw && query.includes(kw)) score += kw.length;
      if (score > bestScore) {
        bestScore = score;
        best = kb;
      }
    }
    if (best && bestScore >= 3) {
      return json({ reply: best.answer, category: best.category, suggestions: followUps(best.category) });
    }

    // 2) Intent routing over live database content.
    if (/^(hi|hello|hey|greetings|hola|assalam|salaam|good morning|good afternoon|good evening)/i.test(query)) {
      return json({
        reply: `Hello there! 👋 I am ${profile.name ?? 'the portfolio'}'s AI Assistant. I can tell you about the projects, technical skills, services and pricing, availability, or help you start a project inquiry. How can I help you today?`,
        category: 'greeting',
        suggestions: [
          'What projects have you built?',
          'Tell me about your skills',
          'What are your rates & services?',
          'How can I get in touch?',
        ],
      });
    }

    if (/project|portfolio|work|built|apps|case study/i.test(query) && projects.length) {
      const list = projects
        .map((p) => `• **${p.title}** (${p.category}): ${p.short_description}`)
        .join('\n\n');
      return json({
        reply: `Here are the production applications in the portfolio:\n\n${list}\n\nYou can explore the full case studies in the Projects section above!`,
        category: 'projects',
        suggestions: ['Tell me about your tech stack', 'What are your rates?', 'How can I contact you?'],
      });
    }

    if (/skill|tech|stack|language|framework|database|cloud|ai|ml/i.test(query) && skills.length) {
      const byCategory = new Map<string, string[]>();
      for (const s of skills) {
        const bucket = byCategory.get(s.category) ?? [];
        bucket.push(`${s.name} (${s.percentage}%)`);
        byCategory.set(s.category, bucket);
      }
      const list = [...byCategory.entries()]
        .map(([cat, items]) => `• **${cat}**: ${items.join(', ')}`)
        .join('\n');
      return json({
        reply: `Core engineering stack:\n\n${list}`,
        category: 'skills',
        suggestions: ['Show me projects', 'Check services & pricing', 'Contact me'],
      });
    }

    if (/price|cost|rate|pricing|fee|charge|quote|estimate|package|service|hire/i.test(query) && services.length) {
      const list = services
        .map((s) => `• **${s.title}**${s.timeline_estimate ? ` (${s.timeline_estimate})` : ''}: starting around ${s.starting_price ?? 'on request'}`)
        .join('\n');
      return json({
        reply: `Available services with transparent milestones:\n\n${list}\n\nYou can also use the Interactive Project Cost Estimator in the Services section for an instant scope breakdown!`,
        category: 'services',
        suggestions: ['Estimate a custom project', 'Are you available for work?', 'Contact directly'],
      });
    }

    if (/contact|email|phone|whatsapp|reach|call|meeting|interview|talk/i.test(query)) {
      const lines = [
        profile.whatsapp ? `📱 **WhatsApp**: ${profile.whatsapp}` : null,
        profile.email ? `✉️ **Email**: ${profile.email}` : null,
        profile.linkedin ? `💼 **LinkedIn**: ${profile.linkedin}` : null,
        profile.location ? `📍 **Location**: ${profile.location}` : null,
      ].filter(Boolean).join('\n');
      return json({
        reply: `You can reach out directly:\n\n${lines}\n\nOr leave your details here and I will log an inquiry straight away.`,
        category: 'contact',
        suggestions: ['Download CV', 'Explore featured projects', 'Estimate project budget'],
      });
    }

    if (/cv|resume|pdf|download/i.test(query)) {
      return json({
        reply: profile.resume_url
          ? `You can view and download the up-to-date Resume / CV here:\n\n📄 [Download CV](${profile.resume_url})`
          : 'The CV is not published yet — please request it through the contact form and it will be sent over.',
        category: 'cv',
        suggestions: ['Tell me about work experience', 'View certificates', 'Contact me'],
      });
    }

    if (/experience|background|history|career|companies/i.test(query) && experiences.length) {
      const list = experiences
        .map((e) => `• **${e.title}** at *${e.company_or_school}* (${e.period})`)
        .join('\n');
      return json({
        reply: `Professional experience${profile.years_experience ? ` (${profile.years_experience} years)` : ''}:\n\n${list}`,
        category: 'experience',
        suggestions: ['View projects', 'View skills', 'Get in touch'],
      });
    }

    return json({
      reply: `I understand you are asking about "${message}". I can share details on the projects, technical skills, services and pricing, or put you directly in touch. What would you like to explore?`,
      category: 'general',
      suggestions: ['Explore projects', 'View technical skills', 'Check services & pricing', 'Contact me'],
    });
  } catch (err) {
    console.error('chatbot-ask failed:', err);
    return json(
      { reply: 'I am having a brief connection hiccup — please try again in a moment or use the contact form below.', category: 'error' },
      500,
    );
  }
});
