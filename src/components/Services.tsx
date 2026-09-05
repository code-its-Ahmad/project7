// ============================================================================
// Services.tsx — Professional, High-Conversion Service & Estimator Module
// Built for Frictionless Client Hiring, Transparent Low Pricing & Advanced Logic
// ============================================================================
import { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Tilt from 'react-parallax-tilt';
import {
  Code, Brain, Smartphone, Database, Globe, Zap, Check, Calculator,
  ArrowRight, Sparkles, Send, Clock, Shield, Layers, TrendingUp,
  AlertTriangle, Cpu, Lock, BarChart3, GitBranch, FileText,
  ChevronRight, ChevronLeft, Download, Share2, X, Info,
  CheckCircle2, Circle, Timer, Users, Wallet, Rocket, Star,
  Tag, Gift, Award, CheckCheck, MessageCircle, HelpCircle,
  ExternalLink, SlidersHorizontal, ArrowUpRight
} from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import { usePortfolio } from '../context/PortfolioContext';
import { useSound } from '../context/SoundContext';
import { contactAPI, Service } from '../api/services';
import toast from 'react-hot-toast';

// ============================================================================
// DOMAIN TYPES & INTERFACES
// ============================================================================

type ProjectType = 'web' | 'mobile' | 'ai' | 'fullstack' | 'ecommerce' | 'saas';
type UrgencyLevel = 'standard' | 'accelerated' | 'rush' | 'emergency';
type ComplexityTier = 'low' | 'medium' | 'high' | 'enterprise';
type ClientTier = 'startup' | 'sme' | 'agency' | 'enterprise';
type ServiceCategory = 'all' | 'web' | 'ai' | 'mobile' | 'backend' | 'cloud';

interface FeatureOption {
  id: string;
  label: string;
  cost: number;
  days: number;
  complexity: ComplexityTier;
  category: 'security' | 'core' | 'integration' | 'ui' | 'infrastructure' | 'ai';
  dependencies?: string[];
  incompatibleWith?: string[];
  description: string;
}

interface BaseProject {
  type: ProjectType;
  label: string;
  price: number;
  timeWeeks: number;
  minTeamSize: number;
  techStack: string[];
  deliverables: string[];
  complexityBase: number;
}

interface EstimateResult {
  cost: number;
  weeks: number;
  teamSize: number;
  milestones: Milestone[];
  riskScore: number;
  complexityScore: number;
  techStack: string[];
  maintenanceYearly: number;
  roiProjection: ROIProjection;
  resourceBreakdown: ResourceBreakdown[];
}

interface Milestone {
  id: string;
  name: string;
  durationDays: number;
  deliverables: string[];
  paymentPercentage: number;
  dependencies: string[];
}

interface ROIProjection {
  breakEvenMonths: number;
  threeYearValue: number;
  efficiencyGain: number;
}

interface ResourceBreakdown {
  role: string;
  hours: number;
  rate: number;
  cost: number;
}

interface QuoteData {
  id: string;
  createdAt: string;
  clientName: string;
  clientEmail: string;
  projectType: ProjectType;
  features: string[];
  urgency: UrgencyLevel;
  estimate: EstimateResult;
  status: 'draft' | 'sent' | 'accepted' | 'rejected';
  validUntil: string;
}

interface ServicePackageOption {
  tier: 'starter' | 'pro' | 'enterprise';
  title: string;
  price: number;
  deliveryDays: string;
  description: string;
  features: string[];
  popular?: boolean;
}

interface ServiceAddon {
  id: string;
  name: string;
  price: number;
  description: string;
}

// ============================================================================
// CONFIGURATION — Transparent, Accessible & Competitive Business Rules
// ============================================================================

const BASE_PROJECTS: Record<ProjectType, BaseProject> = {
  web: {
    type: 'web',
    label: 'Full Stack Web App / MVP',
    price: 350,
    timeWeeks: 2,
    minTeamSize: 1,
    techStack: ['React / Next.js 14', 'Node.js / Express', 'PostgreSQL / Supabase', 'Tailwind CSS', 'Vercel'],
    deliverables: ['Responsive Web App', 'Clean Clean Architecture', 'API Integration', 'Deployment & 14-Day Free Support'],
    complexityBase: 1.0,
  },
  mobile: {
    type: 'mobile',
    label: 'Cross-Platform Mobile App',
    price: 450,
    timeWeeks: 3,
    minTeamSize: 1,
    techStack: ['Flutter / React Native', 'Firebase / Supabase', 'REST / GraphQL', 'App Store Setup'],
    deliverables: ['iOS & Android Compatible Builds', 'Authentication & Push Alerts', 'App Store Assets', 'Complete Source Code'],
    complexityBase: 1.2,
  },
  ai: {
    type: 'ai',
    label: 'AI Agent & RAG Solution',
    price: 499,
    timeWeeks: 3,
    minTeamSize: 1,
    techStack: ['Python / FastAPI', 'OpenAI / Claude API', 'LangChain / LlamaIndex', 'Vector DB (Pinecone/pgvector)'],
    deliverables: ['Custom AI Assistant / RAG Pipeline', 'REST API Endpoints', 'Interactive Chat UI', 'Prompt Engineering Docs'],
    complexityBase: 1.4,
  },
  fullstack: {
    type: 'fullstack',
    label: 'Complete Web + Mobile + AI Suite',
    price: 899,
    timeWeeks: 4,
    minTeamSize: 2,
    techStack: ['Next.js 14', 'Flutter / Mobile', 'Python AI Microservice', 'PostgreSQL', 'Docker'],
    deliverables: ['Full-Featured Web Platform', 'Companion Mobile App', 'AI Integration', 'Admin Control Panel'],
    complexityBase: 1.7,
  },
  ecommerce: {
    type: 'ecommerce',
    label: 'High-Converting E-Commerce Store',
    price: 399,
    timeWeeks: 2,
    minTeamSize: 1,
    techStack: ['Next.js / React', 'Stripe / PayPal / LemonSqueezy', 'Inventory / Order System', 'SEO Suite'],
    deliverables: ['Modern Fast Storefront', 'Secure Checkout Flow', 'Order & Product Dashboard', 'Analytics Integration'],
    complexityBase: 1.2,
  },
  saas: {
    type: 'saas',
    label: 'Multi-Tenant SaaS Application',
    price: 699,
    timeWeeks: 3,
    minTeamSize: 2,
    techStack: ['Next.js 14 App Router', 'Multi-Tenant PostgreSQL', 'Stripe Subscriptions', 'RBAC & Auth'],
    deliverables: ['Multi-Tenant Tenant Isolation', 'Recurring Billing Engine', 'User Management Portal', 'API Gateway'],
    complexityBase: 1.5,
  },
};

const FEATURE_CATALOG: FeatureOption[] = [
  {
    id: 'auth',
    label: 'Auth & User Roles (RBAC)',
    cost: 75,
    days: 2,
    complexity: 'low',
    category: 'security',
    description: 'OAuth2 (Google, GitHub), JWT sessions, user permissions and protected routes',
  },
  {
    id: 'admin_panel',
    label: 'Admin Control Dashboard',
    cost: 120,
    days: 3,
    complexity: 'medium',
    category: 'core',
    dependencies: ['auth'],
    description: 'CRUD data tables, user management, metrics overview and audit logs',
  },
  {
    id: 'payments',
    label: 'Payment & Checkout (Stripe)',
    cost: 95,
    days: 2,
    complexity: 'medium',
    category: 'integration',
    dependencies: ['auth'],
    description: 'One-time checkout, recurring subscriptions, customer portal and webhook handling',
  },
  {
    id: 'ai_agent',
    label: 'Custom AI Assistant / Chatbot',
    cost: 150,
    days: 4,
    complexity: 'high',
    category: 'ai',
    description: 'Smart AI agent with custom knowledge base, context memory, and streaming responses',
  },
  {
    id: 'realtime',
    label: 'Real-Time Sync & Live Chat',
    cost: 110,
    days: 3,
    complexity: 'medium',
    category: 'infrastructure',
    description: 'WebSockets / Supabase Realtime, live activity feeds, presence and instant alerts',
  },
  {
    id: '3d_canvas',
    label: '3D WebGL / Interactive Canvas',
    cost: 130,
    days: 3,
    complexity: 'medium',
    category: 'ui',
    description: 'Three.js / React Three Fiber interactive 3D hero model or product visualizer',
  },
  {
    id: 'seo_analytics',
    label: 'SEO Suite & Performance Booster',
    cost: 65,
    days: 1,
    complexity: 'low',
    category: 'integration',
    description: 'OpenGraph metadata, Sitemap/Robots, JSON-LD schema, 95+ Lighthouse score setup',
  },
  {
    id: 'multi_tenant',
    label: 'Multi-Tenant Architecture',
    cost: 180,
    days: 4,
    complexity: 'enterprise',
    category: 'infrastructure',
    description: 'Organization workspaces, custom subdomains, tenant database separation',
  },
  {
    id: 'cdn_media',
    label: 'Cloud Storage & Media Optimizer',
    cost: 80,
    days: 2,
    complexity: 'low',
    category: 'infrastructure',
    description: 'S3 / Cloudinary upload pipeline, image compression, CDN caching',
  },
  {
    id: 'api_gateway',
    label: 'REST API & Rate Limiting',
    cost: 90,
    days: 2,
    complexity: 'medium',
    category: 'infrastructure',
    description: 'Documented API endpoints, JWT token verification, rate limit protection',
  },
  {
    id: 'pwa',
    label: 'PWA (Installable Web App)',
    cost: 50,
    days: 1,
    complexity: 'low',
    category: 'ui',
    description: 'Offline support, mobile install banner, fast service worker caching',
  },
];

const URGENCY_MULTIPLIERS: Record<UrgencyLevel, { cost: number; time: number; label: string; badge: string }> = {
  standard: { cost: 1.0, time: 1.0, label: 'Standard Pace', badge: 'Best Value' },
  accelerated: { cost: 1.15, time: 0.75, label: 'Fast Track (Save 25% Time)', badge: '⚡ Popular' },
  rush: { cost: 1.35, time: 0.55, label: 'Rush Sprint (Save 45% Time)', badge: '🚀 Express' },
  emergency: { cost: 1.6, time: 0.4, label: '24/7 Dedicated Priority', badge: '🔥 Urgent' },
};

const CLIENT_TIER_DISCOUNTS: Record<ClientTier, { discount: number; label: string; description: string }> = {
  startup: { discount: 0.20, label: 'Early Startup / MVP', description: '🔥 Special 20% Founder Discount' },
  sme: { discount: 0.15, label: 'Indie / Small Business', description: '💡 15% Growth Discount' },
  agency: { discount: 0.25, label: 'Agency Partner', description: '🤝 25% White-Label / Volume Rate' },
  enterprise: { discount: 0.0, label: 'Corporate / Custom', description: '🛡️ Dedicated SLA & Extended Support' },
};

// ============================================================================
// DEFAULT RICH SERVICES DATA (Always Available, Zero Dependency Failure)
// ============================================================================

interface EnhancedServiceItem {
  id: number | string;
  title: string;
  category: ServiceCategory;
  icon: string;
  badge?: string;
  starting_price: string;
  timeline_estimate: string;
  description: string;
  features: string[];
  packages: ServicePackageOption[];
  addons: ServiceAddon[];
}

const DEFAULT_SERVICES: EnhancedServiceItem[] = [
  {
    id: 'srv-web',
    title: 'Full Stack Web & MVP Development',
    category: 'web',
    icon: 'Globe',
    badge: '🔥 Most Popular',
    starting_price: '249',
    timeline_estimate: '3-7 Days',
    description: 'Modern, blazing fast web apps and MVPs built with Next.js 14, React, TypeScript, Node.js, and Supabase. Clean code, 100% responsive, ready to scale.',
    features: [
      'Next.js 14 App Router + Tailwind CSS',
      'Database integration (PostgreSQL / Supabase)',
      'Authentication & Protected User Dashboards',
      'Lighthouse 95+ score & SEO best practices',
      'Free 14-day post-launch maintenance & bug fixes',
    ],
    packages: [
      {
        tier: 'starter',
        title: 'Landing Page / MVP Starter',
        price: 199,
        deliveryDays: '3-4 Days',
        description: 'Single-page responsive app or high-converting product landing page with contact form & analytics.',
        features: ['Up to 3 Sections/Pages', 'Mobile-First Responsive', 'SEO Optimization', 'Contact Form Integration', '7 Days Support'],
      },
      {
        tier: 'pro',
        title: 'Full Stack App (Pro)',
        price: 399,
        deliveryDays: '6-8 Days',
        popular: true,
        description: 'Complete multi-page web application with secure user auth, database, CRUD operations, and admin view.',
        features: ['Full Auth (Google + Email)', 'PostgreSQL / Supabase DB', 'User & Admin Dashboard', 'API Integrations', 'Stripe Checkout', '14 Days Support'],
      },
      {
        tier: 'enterprise',
        title: 'Complete SaaS Platform',
        price: 799,
        deliveryDays: '12-16 Days',
        description: 'End-to-end SaaS architecture with multi-tenancy, subscription billing, custom analytics, and CI/CD.',
        features: ['Multi-Tenant Workspaces', 'Stripe Subscriptions & Webhooks', 'Advanced RBAC Permissions', 'Automated CI/CD Pipeline', '30 Days Priority Support'],
      },
    ],
    addons: [
      { id: 'exp-del', name: '⚡ 48-Hour Rush Delivery', price: 75, description: 'Dedicated sprint to deliver initial build in 48 hours.' },
      { id: 'add-ai', name: '🤖 AI Assistant / Chatbot Integration', price: 95, description: 'Embed smart GPT/Claude assistant trained on your data.' },
      { id: 'add-seo', name: '📈 Advanced SEO & Schema Setup', price: 45, description: 'Complete meta tags, JSON-LD, sitemaps, and indexing.' },
    ],
  },
  {
    id: 'srv-ai',
    title: 'AI Agents & LLM Integration',
    category: 'ai',
    icon: 'Brain',
    badge: '⭐ High ROI',
    starting_price: '299',
    timeline_estimate: '4-8 Days',
    description: 'Custom AI solutions, RAG pipelines, intelligent chatbots, and workflow automation utilizing OpenAI, Claude, LangChain, and Python FastAPI.',
    features: [
      'Custom LLM Agents & RAG (Retrieval Augmented Generation)',
      'Vector Database Setup (Pinecone, pgvector, Chroma)',
      'Document Q&A, PDF Analysis & Smart Summarization',
      'Python FastAPI backend with streaming responses',
      'Interactive, glassmorphic AI chat widget',
    ],
    packages: [
      {
        tier: 'starter',
        title: 'AI Chat Widget / Assistant',
        price: 249,
        deliveryDays: '3-5 Days',
        description: 'Plug-and-play AI chat assistant customized with your business FAQs and system prompt.',
        features: ['OpenAI / Claude API Connection', 'Custom Knowledge Injection', 'Modern Chat UI Component', 'Streaming Token Response', '7 Days Support'],
      },
      {
        tier: 'pro',
        title: 'RAG Pipeline & Document Search',
        price: 499,
        deliveryDays: '7-10 Days',
        popular: true,
        description: 'Advanced vector search system capable of ingesting your custom PDFs, docs, and knowledge bases with zero hallucination.',
        features: ['Vector DB Setup & Indexing', 'Chunking & Embedding Pipeline', 'Semantic Hybrid Search', 'FastAPI Backend Endpoints', '14 Days Support'],
      },
      {
        tier: 'enterprise',
        title: 'Autonomous Multi-Agent System',
        price: 950,
        deliveryDays: '14-18 Days',
        description: 'Complex agent workflows executing tasks, web scraping, API tools, and multi-step reasoning.',
        features: ['LangChain / CrewAI Orchestration', 'Tool Calling & API Actions', 'User Memory & Conversation History', 'Dockerized Microservices', '30 Days Support'],
      },
    ],
    addons: [
      { id: 'exp-del', name: '⚡ Fast-Track 3-Day Delivery', price: 90, description: 'Rapid delivery of core AI pipeline.' },
      { id: 'add-voice', name: '🎙️ Voice Input & Text-to-Speech', price: 60, description: 'Whisper voice transcription and natural speech output.' },
      { id: 'add-train', name: '📊 Custom Model Fine-Tuning Prep', price: 120, description: 'Dataset cleaning and fine-tuning prompt template.' },
    ],
  },
  {
    id: 'srv-mobile',
    title: 'Cross-Platform Mobile Apps',
    category: 'mobile',
    icon: 'Smartphone',
    badge: '📱 iOS & Android',
    starting_price: '349',
    timeline_estimate: '7-14 Days',
    description: 'High-performance mobile applications built with Flutter or React Native. One single codebase delivering native 60fps performance on both iOS and Android.',
    features: [
      'Single codebase for iOS, Android, and Web',
      'Firebase / Supabase backend & cloud sync',
      'Push notifications, offline caching & geolocation',
      'Pixel-perfect Figma to mobile implementation',
      'Guidance for Google Play Store & Apple App Store launch',
    ],
    packages: [
      {
        tier: 'starter',
        title: 'Mobile MVP / Prototype',
        price: 299,
        deliveryDays: '5-7 Days',
        description: 'Clean functional mobile app with up to 4 core screens, auth, and cloud database.',
        features: ['4 App Screens', 'Firebase Auth & DB', 'Smooth Transitions', 'Android APK & iOS Build', '7 Days Support'],
      },
      {
        tier: 'pro',
        title: 'Production Mobile App',
        price: 599,
        deliveryDays: '10-14 Days',
        popular: true,
        description: 'Complete cross-platform app with in-app payments, push notifications, offline mode, and API integration.',
        features: ['Up to 10 Screens', 'Push Notifications (FCM)', 'Offline SQLite/Hive Storage', 'Stripe / In-App Purchase Flow', 'Store Submission Readiness', '14 Days Support'],
      },
      {
        tier: 'enterprise',
        title: 'Enterprise Mobile Suite',
        price: 1100,
        deliveryDays: '18-24 Days',
        description: 'Complex mobile system with real-time location tracking, live chat, background workers, and admin panel.',
        features: ['Unlimited Screens', 'Real-Time WebSockets', 'Live Map / GPS Tracking', 'Dedicated Admin Panel', '30 Days Priority Support'],
      },
    ],
    addons: [
      { id: 'exp-del', name: '⚡ Express App Build', price: 110, description: 'Expedite APK delivery in 4-5 days.' },
      { id: 'add-store', name: '🚀 Store Upload Assistance', price: 70, description: 'Screenshots, privacy policy, and store metadata setup.' },
      { id: 'add-dark', name: '🌓 Dynamic Dark/Light Theme System', price: 40, description: 'Automatic OS theme switching and custom palette.' },
    ],
  },
  {
    id: 'srv-backend',
    title: 'Backend Architecture & APIs',
    category: 'backend',
    icon: 'Database',
    badge: '⚡ High Scale',
    starting_price: '199',
    timeline_estimate: '3-6 Days',
    description: 'Robust, secure, and scalable backend services, microservices, and REST/GraphQL APIs built with Node.js, Express, Python FastAPI, PostgreSQL, and Redis.',
    features: [
      'High-throughput RESTful or GraphQL APIs',
      'Database design, normalization & indexing (PostgreSQL, MongoDB)',
      'JWT/OAuth2 security, rate-limiting & CSRF protection',
      'Redis caching for sub-millisecond response times',
      'Comprehensive Swagger/Postman API documentation',
    ],
    packages: [
      {
        tier: 'starter',
        title: 'API Microservice / Quick Fix',
        price: 149,
        deliveryDays: '2-3 Days',
        description: 'Up to 5 REST endpoints, database schema connection, and secure token validation.',
        features: ['5 Clean Endpoints', 'PostgreSQL / MongoDB Setup', 'JWT Authentication', 'Postman Collection', '7 Days Support'],
      },
      {
        tier: 'pro',
        title: 'Core Backend System',
        price: 349,
        deliveryDays: '5-8 Days',
        popular: true,
        description: 'Comprehensive backend architecture with webhook handlers, caching, database relations, and file uploads.',
        features: ['Full CRUD API Suite', 'Redis Caching Layer', 'Stripe / Cloud Webhooks', 'Automated Data Migrations', 'Interactive Swagger Docs', '14 Days Support'],
      },
      {
        tier: 'enterprise',
        title: 'Scalable Microservices Backend',
        price: 699,
        deliveryDays: '10-15 Days',
        description: 'Distributed microservices architecture with message queues (RabbitMQ/Kafka), Docker containers, and load balancing.',
        features: ['Docker Containerization', 'Queue & Job Scheduling', 'Multi-Database Strategy', 'Security & Penetration Hardening', '30 Days Support'],
      },
    ],
    addons: [
      { id: 'exp-del', name: '⚡ 24-Hour Urgent Endpoint Build', price: 65, description: 'Rapid delivery of critical API routes.' },
      { id: 'add-doc', name: '📘 Interactive Swagger UI Docs', price: 35, description: 'Live executable API documentation.' },
      { id: 'add-test', name: '🧪 Automated Jest/PyTest Unit Tests', price: 80, description: 'High test coverage suite for backend.' },
    ],
  },
  {
    id: 'srv-ui',
    title: 'UI/UX & Frontend Optimization',
    category: 'web',
    icon: 'Zap',
    badge: '✨ Pixel Perfect',
    starting_price: '149',
    timeline_estimate: '2-5 Days',
    description: 'Transform Figma/Adobe designs into hyper-polished, interactive React/Tailwind interfaces with silky 60fps animations, 3D elements, and 99+ Lighthouse scores.',
    features: [
      'Pixel-perfect conversion from Figma / Sketch',
      'Smooth Framer Motion micro-interactions & animations',
      'WebGL / 3D Canvas effects & dark mode toggles',
      'Performance audit: Core Web Vitals optimization',
      'Fully accessible (WCAG compliant) semantic HTML',
    ],
    packages: [
      {
        tier: 'starter',
        title: 'Figma to React Component',
        price: 120,
        deliveryDays: '2-3 Days',
        description: 'Convert a single page or landing section into clean, reusable React + Tailwind code.',
        features: ['1-2 Responsive Pages', 'Framer Motion Effects', 'Dark Mode Included', 'Mobile Responsive', '7 Days Support'],
      },
      {
        tier: 'pro',
        title: 'Complete Design System & UI',
        price: 280,
        deliveryDays: '4-6 Days',
        popular: true,
        description: 'Complete multi-page UI implementation with interactive modals, tables, charts, and navigation.',
        features: ['Up to 6 UI Pages', 'Reusable Component Library', 'Interactive Charts (Recharts)', 'Speed Optimization (95+ score)', '14 Days Support'],
      },
      {
        tier: 'enterprise',
        title: 'Immersive 3D & Micro-Experience',
        price: 550,
        deliveryDays: '8-12 Days',
        description: 'Awe-inspiring interactive web experience with Three.js 3D models, custom particle shaders, and bespoke sound effects.',
        features: ['Three.js 3D Scene', 'Interactive Scroll Animations', 'Custom Audio/Sound Triggers', 'Ultra-Performance Optimization', '30 Days Support'],
      },
    ],
    addons: [
      { id: 'exp-del', name: '⚡ 24-Hour Express UI Slicing', price: 50, description: 'Next-day delivery of React component.' },
      { id: 'add-audio', name: '🔊 Interactive UI Sound Effects', price: 30, description: 'Synthesized micro-audio on clicks & hovers.' },
    ],
  },
  {
    id: 'srv-cloud',
    title: 'Cloud DevOps & Deployment',
    category: 'cloud',
    icon: 'Cpu',
    badge: '🔒 99.9% Uptime',
    starting_price: '120',
    timeline_estimate: '1-3 Days',
    description: 'Zero-downtime deployment pipelines, Docker containerization, AWS / Vercel cloud setup, SSL certificates, automated backups, and domain configuration.',
    features: [
      'Automated CI/CD with GitHub Actions',
      'Docker & Docker Compose containerization',
      'AWS (EC2, S3, RDS) / Vercel / Railway / Supabase configuration',
      'Custom domain, DNS setup & free automated SSL',
      'Monitoring, error logging (Sentry) & performance alerts',
    ],
    packages: [
      {
        tier: 'starter',
        title: 'Quick Cloud Launch',
        price: 99,
        deliveryDays: '1-2 Days',
        description: 'Deploy your web or backend app to Vercel/Railway with custom domain and SSL.',
        features: ['Domain & DNS Setup', 'SSL Certificate', 'Vercel / Supabase Deploy', 'Environment Config', '7 Days Support'],
      },
      {
        tier: 'pro',
        title: 'CI/CD & Docker Setup',
        price: 220,
        deliveryDays: '2-4 Days',
        popular: true,
        description: 'Production-ready Docker environment with automated GitHub Actions testing and deployment on push.',
        features: ['Dockerfile & Docker-Compose', 'GitHub Actions Pipeline', 'Staging + Production Config', 'Automated DB Backups', '14 Days Support'],
      },
      {
        tier: 'enterprise',
        title: 'Full AWS Cloud Infrastructure',
        price: 450,
        deliveryDays: '5-8 Days',
        description: 'Scalable AWS cloud architecture with VPC, EC2/ECS, S3 CDN, RDS PostgreSQL, and CloudWatch alarms.',
        features: ['AWS Architecture Setup', 'RDS PostgreSQL Caching', 'Sentry Error Logging', 'Load Balancing & Auto-Scale', '30 Days Support'],
      },
    ],
    addons: [
      { id: 'exp-del', name: '⚡ Same-Day Emergency Deployment', price: 60, description: 'Launch to production within 12 hours.' },
      { id: 'add-mon', name: '📊 Sentry & Uptime Monitor Setup', price: 40, description: 'Live alerts if your app goes down.' },
    ],
  },
];

// ============================================================================
// BUSINESS LOGIC ENGINE — Pure Functions
// ============================================================================

const calculateComplexityScore = (
  baseType: ProjectType,
  featureIds: string[],
  urgency: UrgencyLevel
): number => {
  const base = BASE_PROJECTS[baseType].complexityBase;

  const featureComplexity = featureIds.reduce((score, fid) => {
    const feat = FEATURE_CATALOG.find(f => f.id === fid);
    if (!feat) return score;
    const tierMultiplier = { low: 0.08, medium: 0.16, high: 0.28, enterprise: 0.42 };
    return score + tierMultiplier[feat.complexity];
  }, 0);

  const urgencyMultiplier = { standard: 1, accelerated: 1.1, rush: 1.25, emergency: 1.45 };
  return Number(((base + featureComplexity) * urgencyMultiplier[urgency]).toFixed(2));
};

const generateMilestones = (
  projectType: ProjectType,
  features: string[],
  totalWeeks: number,
  totalCost: number
): Milestone[] => {
  const milestones: Milestone[] = [];
  const discoveryDays = Math.max(2, Math.round(totalWeeks * 0.15 * 7));

  milestones.push({
    id: 'm1',
    name: '1. Architecture & UI Wireframes',
    durationDays: discoveryDays,
    deliverables: ['System Blueprint', 'Figma/Component Specs', 'Database Schema', 'Kickoff Alignment'],
    paymentPercentage: 25,
    dependencies: [],
  });

  const remainingDays = totalWeeks * 7 - discoveryDays;
  const sprintCount = Math.min(3, Math.max(1, Math.ceil(remainingDays / 10)));
  const sprintDays = Math.floor(remainingDays / sprintCount);

  for (let i = 0; i < sprintCount; i++) {
    milestones.push({
      id: `m${i + 2}`,
      name: `${i + 2}. Core Build & Integration Sprint ${i + 1}`,
      durationDays: sprintDays,
      deliverables: [
        'Feature Implementation',
        'API & Backend Connection',
        'Unit & Integration Testing',
        'Interactive Demo Review',
      ],
      paymentPercentage: Math.floor(50 / sprintCount),
      dependencies: i === 0 ? ['m1'] : [`m${i + 1}`],
    });
  }

  milestones.push({
    id: `m${sprintCount + 2}`,
    name: `${sprintCount + 2}. Final QA, Launch & Handover`,
    durationDays: Math.max(2, Math.round(totalWeeks * 0.1 * 7)),
    deliverables: ['Production Cloud Deployment', 'Complete Source Code Access', 'Video Walkthrough & Docs', '14-Day Free Support Starts'],
    paymentPercentage: 25,
    dependencies: [`m${sprintCount + 1}`],
  });

  const totalPct = milestones.reduce((sum, m) => sum + m.paymentPercentage, 0);
  if (totalPct !== 100) {
    milestones[milestones.length - 1].paymentPercentage += (100 - totalPct);
  }

  return milestones;
};

const calculateResourceBreakdown = (
  complexityScore: number,
  weeks: number,
  teamSize: number
): ResourceBreakdown[] => {
  const totalHours = Math.round(weeks * 5 * 6 * teamSize);
  const seniorRatio = 0.6;
  const midRatio = 0.4;

  const seniorHours = Math.round(totalHours * seniorRatio);
  const midHours = totalHours - seniorHours;

  return [
    { role: 'Muhammad Ahmad (Lead Full Stack & AI Architect)', hours: seniorHours, rate: 45, cost: seniorHours * 45 },
    { role: 'QA & UI Polish / Integration', hours: midHours, rate: 25, cost: midHours * 25 },
  ];
};

const calculateROI = (projectType: ProjectType, features: string[], cost: number): ROIProjection => {
  const baseEfficiency = { web: 1.4, mobile: 1.6, ai: 2.2, fullstack: 2.4, ecommerce: 1.8, saas: 2.0 };
  const featureMultiplier = 1 + (features.length * 0.06);

  const monthlyValue = cost * 0.25 * baseEfficiency[projectType] * featureMultiplier;
  const breakEven = Math.max(1, Math.ceil(cost / monthlyValue));
  const threeYearValue = monthlyValue * 36;
  const efficiencyGain = Math.round((baseEfficiency[projectType] * featureMultiplier - 1) * 100);

  return {
    breakEvenMonths: breakEven,
    threeYearValue: Math.round(threeYearValue),
    efficiencyGain,
  };
};

const calculateEstimate = (
  projectType: ProjectType,
  selectedFeatures: string[],
  urgency: UrgencyLevel,
  clientTier: ClientTier = 'startup'
): EstimateResult => {
  const base = BASE_PROJECTS[projectType];
  const urgencyMult = URGENCY_MULTIPLIERS[urgency];

  let totalCost = base.price;
  let totalDays = base.timeWeeks * 7;

  selectedFeatures.forEach((fid) => {
    const feat = FEATURE_CATALOG.find(f => f.id === fid);
    if (feat) {
      totalCost += feat.cost;
      totalDays += feat.days;
    }
  });

  totalCost *= urgencyMult.cost;
  totalDays = Math.round(totalDays * urgencyMult.time);

  const tierDiscount = CLIENT_TIER_DISCOUNTS[clientTier].discount;
  totalCost *= (1 - tierDiscount);

  const complexityScore = calculateComplexityScore(projectType, selectedFeatures, urgency);
  const teamSize = Math.max(1, Math.min(3, Math.ceil(complexityScore / 1.6)));
  const weeks = Math.max(1, Math.ceil(totalDays / 7));
  const riskScore = Math.min(100, Math.round((complexityScore / 4.5) * 100));

  const milestones = generateMilestones(projectType, selectedFeatures, weeks, totalCost);
  const resourceBreakdown = calculateResourceBreakdown(complexityScore, weeks, teamSize);
  const roiProjection = calculateROI(projectType, selectedFeatures, totalCost);
  const maintenanceYearly = Math.round(totalCost * 0.12);

  const techStack = [...new Set([...base.techStack, ...selectedFeatures.flatMap(fid => {
    const feat = FEATURE_CATALOG.find(f => f.id === fid);
    return feat ? (
      feat.category === 'ai' ? ['Python', 'OpenAI/Claude'] :
        feat.category === 'security' ? ['JWT / Supabase Auth'] :
          feat.id === 'payments' ? ['Stripe Checkout'] :
            feat.id === 'realtime' ? ['WebSockets'] :
              feat.id === '3d_canvas' ? ['Three.js'] :
                feat.id === 'multi_tenant' ? ['Multi-Tenancy'] :
                  []
    ) : [];
  })])];

  return {
    cost: Math.round(totalCost),
    weeks,
    teamSize,
    milestones,
    riskScore,
    complexityScore,
    techStack,
    maintenanceYearly,
    roiProjection,
    resourceBreakdown,
  };
};

// ============================================================================
// SUB-COMPONENTS & UI ELEMENTS
// ============================================================================

const ComplexityBadge = ({ score }: { score: number }) => {
  let color = 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
  let label = 'Streamlined Build';

  if (score > 2.2) {
    color = 'text-blue-500 bg-blue-500/10 border-blue-500/20';
    label = 'Standard Full Stack';
  }
  if (score > 3.5) {
    color = 'text-purple-500 bg-purple-500/10 border-purple-500/20';
    label = 'Advanced Architecture';
  }
  if (score > 4.8) {
    color = 'text-amber-500 bg-amber-500/10 border-amber-500/20';
    label = 'High Complexity';
  }

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold ${color}`}>
      <BarChart3 className="w-3 h-3" />
      <span>{label} ({score.toFixed(1)})</span>
    </div>
  );
};

const RiskIndicator = ({ score }: { score: number }) => (
  <div className="space-y-1.5">
    <div className="flex items-center justify-between text-xs">
      <span className="font-semibold text-gray-600 dark:text-gray-400">Risk Assessment</span>
      <span className={`font-bold ${score > 60 ? 'text-amber-500' : 'text-emerald-500'}`}>
        {score}% (Low Risk)
      </span>
    </div>
    <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${score}%` }}
        className={`h-full rounded-full ${score > 60 ? 'bg-amber-500' : 'bg-emerald-500'}`}
      />
    </div>
    <p className="text-[10px] text-gray-500 dark:text-gray-400">
      {score > 60
        ? 'Modular architecture recommended for seamless deployment.'
        : 'Very clean execution path with fast turnaround & 100% test coverage.'}
    </p>
  </div>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const Services = () => {
  const { services: portfolioServices, profile } = usePortfolio();
  const { playClick, playHover, playSuccess } = useSound();

  // Contact links
  const whatsappNumber = profile?.whatsapp?.replace(/[^0-9]/g, '') || '923314815161';
  const whatsappDirect = `https://wa.me/${whatsappNumber}`;
  const clientEmail = profile?.email || 'Ahmadrajpootr1@gmail.com';

  // State
  const [activeCategory, setActiveCategory] = useState<ServiceCategory>('all');
  const [selectedServiceForModal, setSelectedServiceForModal] = useState<EnhancedServiceItem | null>(null);
  const [selectedTier, setSelectedTier] = useState<'starter' | 'pro' | 'enterprise'>('pro');
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [modalClientName, setModalClientName] = useState('');
  const [modalClientEmail, setModalClientEmail] = useState('');
  const [modalClientNote, setModalClientNote] = useState('');
  const [isModalSubmitting, setIsModalSubmitting] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoApplied, setPromoApplied] = useState(false);

  // Estimator state
  const [projectType, setProjectType] = useState<ProjectType>('web');
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(['auth', 'admin_panel', 'seo_analytics']);
  const [urgency, setUrgency] = useState<UrgencyLevel>('standard');
  const [clientTier, setClientTier] = useState<ClientTier>('startup');
  const [estimatorName, setEstimatorName] = useState('');
  const [estimatorEmail, setEstimatorEmail] = useState('');
  const [estimatorNotes, setEstimatorNotes] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [isEstimatorSubmitting, setIsEstimatorSubmitting] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [savedQuotes, setSavedQuotes] = useState<QuoteData[]>([]);

  // Merge portfolioServices with our rich defaults
  const displayServices: EnhancedServiceItem[] = useMemo(() => {
    if (!portfolioServices || portfolioServices.length === 0) {
      return DEFAULT_SERVICES;
    }

    return DEFAULT_SERVICES.map((defService, index) => {
      const match = portfolioServices.find(
        (ps) => ps.id === defService.id || ps.title.toLowerCase().includes(defService.category)
      ) || portfolioServices[index];

      if (match) {
        return {
          ...defService,
          title: match.title || defService.title,
          description: match.description || defService.description,
          starting_price: match.starting_price?.replace(/[^0-9]/g, '') || defService.starting_price,
          timeline_estimate: match.timeline_estimate || defService.timeline_estimate,
          features: match.features && match.features.length > 0 ? match.features : defService.features,
        };
      }
      return defService;
    });
  }, [portfolioServices]);

  // Filtered services
  const filteredServices = useMemo(() => {
    if (activeCategory === 'all') return displayServices;
    return displayServices.filter((s) => s.category === activeCategory);
  }, [displayServices, activeCategory]);

  // Estimator calculation
  const estimate = useMemo(
    () => calculateEstimate(projectType, selectedFeatures, urgency, clientTier),
    [projectType, selectedFeatures, urgency, clientTier]
  );

  // Recommended features
  const recommendedFeatures = useMemo(() => {
    const recommendations: Record<ProjectType, string[]> = {
      web: ['auth', 'admin_panel', 'seo_analytics', 'pwa'],
      mobile: ['auth', 'realtime', 'cdn_media', 'payments'],
      ai: ['auth', 'ai_agent', 'api_gateway', 'admin_panel'],
      fullstack: ['auth', 'admin_panel', 'payments', 'realtime', 'ai_agent'],
      ecommerce: ['auth', 'payments', 'admin_panel', 'seo_analytics', 'cdn_media'],
      saas: ['auth', 'multi_tenant', 'payments', 'admin_panel', 'api_gateway'],
    };
    return recommendations[projectType] || [];
  }, [projectType]);

  // Feature toggle in estimator
  const toggleFeature = useCallback((id: string) => {
    setSelectedFeatures((prev) => {
      const isSelected = prev.includes(id);
      if (isSelected) return prev.filter((f) => f !== id);
      const feat = FEATURE_CATALOG.find(f => f.id === id);
      const deps = feat?.dependencies || [];
      const newFeatures = [...prev, id];
      deps.forEach(dep => {
        if (!newFeatures.includes(dep)) newFeatures.push(dep);
      });
      return newFeatures;
    });
  }, []);

  // Open booking modal for a specific service
  const handleOpenBookingModal = (service: EnhancedServiceItem) => {
    playClick();
    setSelectedServiceForModal(service);
    setSelectedTier('pro');
    setSelectedAddons([]);
    setPromoCode('');
    setPromoDiscount(0);
    setPromoApplied(false);
  };

  // Close booking modal
  const handleCloseBookingModal = () => {
    setSelectedServiceForModal(null);
  };

  // Calculate modal price
  const modalSelectedPackage = useMemo(() => {
    if (!selectedServiceForModal) return null;
    return selectedServiceForModal.packages.find((p) => p.tier === selectedTier) || selectedServiceForModal.packages[0];
  }, [selectedServiceForModal, selectedTier]);

  const modalTotalPrice = useMemo(() => {
    if (!modalSelectedPackage || !selectedServiceForModal) return 0;
    const base = modalSelectedPackage.price;
    const addonsCost = selectedAddons.reduce((sum, addId) => {
      const addon = selectedServiceForModal.addons.find((a) => a.id === addId);
      return sum + (addon?.price || 0);
    }, 0);
    const subtotal = base + addonsCost;
    const discounted = promoDiscount > 0 ? subtotal * (1 - promoDiscount) : subtotal;
    return Math.round(discounted);
  }, [modalSelectedPackage, selectedServiceForModal, selectedAddons, promoDiscount]);

  // Apply promo code
  const handleApplyPromo = () => {
    playClick();
    const cleanCode = promoCode.trim().toUpperCase();
    if (cleanCode === 'STARTUP20' || cleanCode === 'WELCOME20' || cleanCode === 'AHMAD20') {
      setPromoDiscount(0.20);
      setPromoApplied(true);
      toast.success('🎉 20% Startup Voucher Applied!');
    } else if (cleanCode === 'VIP15') {
      setPromoDiscount(0.15);
      setPromoApplied(true);
      toast.success('🎉 15% VIP Discount Applied!');
    } else {
      toast.error('Invalid promo code. Try "STARTUP20" for 20% off!');
    }
  };

  // WhatsApp 1-Click hire button link
  const getModalWhatsAppUrl = () => {
    if (!selectedServiceForModal || !modalSelectedPackage) return whatsappDirect;
    const addonNames = selectedAddons
      .map((id) => selectedServiceForModal.addons.find((a) => a.id === id)?.name)
      .filter(Boolean)
      .join(', ');

    const text = `Hi Muhammad Ahmad! 👋\n\nI would like to hire you for:\n📌 Service: *${selectedServiceForModal.title}*\n📦 Package: *${modalSelectedPackage.title}* (~$${modalTotalPrice})\n⏱️ Expected Delivery: ${modalSelectedPackage.deliveryDays}\n${addonNames ? `➕ Add-ons: ${addonNames}\n` : ''}${modalClientName ? `👤 Client Name: ${modalClientName}\n` : ''}\nLet's get started!`;

    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`;
  };

  // Submit booking from modal
  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    playClick();

    if (!modalClientName.trim() || !modalClientEmail.trim()) {
      toast.error('Please enter your name and email address.');
      return;
    }

    try {
      setIsModalSubmitting(true);
      const addonNames = selectedAddons
        .map((id) => selectedServiceForModal?.addons.find((a) => a.id === id)?.name)
        .filter(Boolean)
        .join(', ');

      const briefMsg = `[Instant Service Booking Request]\nService: ${selectedServiceForModal?.title}\nPackage Tier: ${modalSelectedPackage?.title} ($${modalTotalPrice})\nEstimated Turnaround: ${modalSelectedPackage?.deliveryDays}\nAdd-ons: ${addonNames || 'None'}\nClient Name: ${modalClientName}\nClient Email: ${modalClientEmail}\nClient Notes: ${modalClientNote || 'None'}`;

      await contactAPI.sendMessage({
        name: modalClientName.trim(),
        email: modalClientEmail.trim(),
        subject: `Service Booking: ${selectedServiceForModal?.title} (${modalSelectedPackage?.title})`,
        message: briefMsg,
        project_type: selectedServiceForModal?.title,
        estimated_budget: `$${modalTotalPrice}`,
        source: 'services_instant_booking',
      });

      playSuccess();
      toast.success(
        <div className="space-y-1">
          <div className="font-bold">🎉 Booking Received Successfully!</div>
          <div className="text-xs">Muhammad Ahmad will review your request and reply within 24 hours.</div>
        </div>,
        { duration: 6000 }
      );

      handleCloseBookingModal();
      setModalClientName('');
      setModalClientEmail('');
      setModalClientNote('');
    } catch {
      toast.error('Submission failed. Please connect directly via WhatsApp.');
    } finally {
      setIsModalSubmitting(false);
    }
  };

  // Submit Estimator Brief
  const handleSubmitEstimatorBrief = async (e: React.FormEvent) => {
    e.preventDefault();
    playClick();

    if (!estimatorName.trim() || !estimatorEmail.trim()) {
      toast.error('Please enter your name and email address.');
      return;
    }

    try {
      setIsEstimatorSubmitting(true);

      const featureNames = selectedFeatures
        .map((fId) => FEATURE_CATALOG.find((o) => o.id === fId)?.label)
        .filter(Boolean)
        .join(', ');

      const briefMessage = `[Custom Project Estimator Brief]\nClient: ${estimatorName}\nEmail: ${estimatorEmail}\nProject Type: ${BASE_PROJECTS[projectType].label}\nSelected Modules: ${featureNames}\nTimeline Urgency: ${urgency.toUpperCase()}\nClient Tier: ${CLIENT_TIER_DISCOUNTS[clientTier].label}\nEstimated Cost: ~$${estimate.cost.toLocaleString()} (~${estimate.weeks} weeks)\nClient Notes: ${estimatorNotes || 'None'}`;

      await contactAPI.sendMessage({
        name: estimatorName.trim(),
        email: estimatorEmail.trim(),
        subject: `Scope Specification: ${BASE_PROJECTS[projectType].label}`,
        message: briefMessage,
        project_type: BASE_PROJECTS[projectType].label,
        estimated_budget: `~$${estimate.cost.toLocaleString()}`,
        source: 'scope_estimator',
      });

      playSuccess();
      toast.success(
        <div className="space-y-1">
          <div className="font-bold">Quote Submitted Successfully!</div>
          <div className="text-xs">Muhammad Ahmad will contact you with a finalized proposal.</div>
        </div>,
        { duration: 6000 }
      );

      setEstimatorName('');
      setEstimatorEmail('');
      setEstimatorNotes('');
      setCurrentStep(0);
    } catch {
      toast.error('Submission failed. Please reach out directly on WhatsApp.');
    } finally {
      setIsEstimatorSubmitting(false);
    }
  };

  const getIcon = (name: string) => {
    const icons: Record<string, React.ReactNode> = {
      Brain: <Brain className="w-5 h-5" />,
      Smartphone: <Smartphone className="w-5 h-5" />,
      Database: <Database className="w-5 h-5" />,
      Globe: <Globe className="w-5 h-5" />,
      Zap: <Zap className="w-5 h-5" />,
      Lock: <Lock className="w-5 h-5" />,
      Cpu: <Cpu className="w-5 h-5" />,
      TrendingUp: <TrendingUp className="w-5 h-5" />,
    };
    return icons[name] || <Code className="w-5 h-5" />;
  };

  const steps = ['Platform', 'Modules', 'Speed & Urgency', 'Finalize & Send'];

  return (
    <section
      id="services"
      className="min-h-screen py-16 sm:py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 transition-colors duration-300"
    >
      {/* Background Decorative Gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-blue-500/10 dark:bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-10 w-[500px] h-[300px] bg-purple-500/10 dark:bg-purple-500/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto w-full space-y-12 sm:space-y-16">

        {/* Section Header */}
        <div className="text-center space-y-3.5 max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 border border-blue-500/20 text-xs font-bold text-blue-600 dark:text-blue-400 backdrop-blur-md shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-500 animate-spin-slow" />
            <span>High Value • Low Risk • Fast Turnaround</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent tracking-tight"
          >
            Services & Transparent Pricing
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-300 leading-relaxed"
          >
            Select a package for rapid 1-click booking, or customize every module with our intelligent scope estimator.
            Affordable rates designed for founders, businesses, and agency teams.
          </motion.p>

          {/* Quick Value Props Banner */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex flex-wrap items-center justify-center gap-3 pt-2 text-[11px] sm:text-xs font-semibold text-gray-700 dark:text-gray-300"
          >
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <CheckCheck className="w-3.5 h-3.5" /> 100% Satisfaction Guarantee
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              <Timer className="w-3.5 h-3.5" /> 24-48h Kickoff
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
              <Shield className="w-3.5 h-3.5" /> Milestone-Based Payments
            </span>
          </motion.div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center justify-center gap-1.5 sm:gap-2 overflow-x-auto pb-2 custom-scrollbar">
          {[
            { id: 'all', label: 'All Services' },
            { id: 'web', label: 'Web & Full Stack' },
            { id: 'ai', label: 'AI & Automations' },
            { id: 'mobile', label: 'Mobile Apps' },
            { id: 'backend', label: 'Backend & APIs' },
            { id: 'cloud', label: 'Cloud & DevOps' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => { playClick(); setActiveCategory(cat.id as ServiceCategory); }}
              className={`px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs font-bold transition-all shrink-0 whitespace-nowrap ${activeCategory === cat.id
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md shadow-blue-500/20 scale-105'
                : 'bg-white/80 dark:bg-gray-800/80 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-blue-400'
                }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Services Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filteredServices.map((service: EnhancedServiceItem, index: number) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: Math.min(index * 0.05, 0.25) }}
              className="h-full"
            >
              <Tilt
                tiltMaxAngleX={4}
                tiltMaxAngleY={4}
                perspective={1000}
                scale={1.01}
                transitionSpeed={500}
                tiltEnable={typeof window !== 'undefined' ? window.innerWidth > 768 : true}
                className="h-full"
              >
                <div
                  onMouseEnter={playHover}
                  className="h-full p-6 sm:p-7 rounded-3xl bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-gray-200/80 dark:border-gray-800/80 hover:border-blue-500/60 shadow-xl hover:shadow-2xl hover:shadow-blue-500/10 flex flex-col justify-between space-y-5 transition-all group relative overflow-hidden"
                >
                  {/* Top Badge */}
                  {service.badge && (
                    <div className="absolute top-4 right-4 px-2.5 py-0.5 rounded-full bg-blue-500/10 dark:bg-blue-400/10 border border-blue-500/20 text-[10px] font-extrabold text-blue-600 dark:text-blue-400">
                      {service.badge}
                    </div>
                  )}

                  <div className="space-y-4">
                    {/* Icon & Title */}
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform shrink-0">
                        {getIcon(service.icon)}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-base sm:text-lg text-gray-900 dark:text-white group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                          {service.title}
                        </h3>
                        <div className="flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                          <Clock className="w-3 h-3 text-blue-500" />
                          <span>{service.timeline_estimate} turnaround</span>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-3">
                      {service.description}
                    </p>

                    {/* Features Checklist */}
                    {service.features?.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-800/60">
                        {service.features.slice(0, 4).map((feat: string, i: number) => (
                          <div key={i} className="flex items-start space-x-2 text-xs text-gray-700 dark:text-gray-300">
                            <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                            <span className="line-clamp-1">{feat}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Pricing & 1-Click Action Buttons */}
                  <div className="space-y-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                    <div className="flex items-baseline justify-between">
                      <div>
                        <div className="text-[10px] uppercase font-bold text-gray-400">Starting From</div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400">
                            ${service.starting_price}
                          </span>
                          <span className="text-[11px] text-gray-500 font-semibold">USD</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          <Award className="w-3 h-3" /> Free Support
                        </span>
                      </div>
                    </div>

                    {/* 1-Click Action Buttons */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenBookingModal(service)}
                        className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-1.5 active:scale-95"
                      >
                        <Zap className="w-3.5 h-3.5 text-yellow-300" />
                        <span>Book Service</span>
                      </button>

                      <a
                        href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Hi Muhammad Ahmad! I'm interested in hiring you for ${service.title} (Starting from $${service.starting_price}). Let's discuss details!`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-2.5 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold text-xs transition-all flex items-center justify-center gap-1.5 active:scale-95 text-center"
                      >
                        <FaWhatsapp className="w-3.5 h-3.5 text-emerald-500" />
                        <span>WhatsApp</span>
                      </a>
                    </div>
                  </div>
                </div>
              </Tilt>
            </motion.div>
          ))}
        </div>

        {/* Promo Voucher Banner */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="p-4 sm:p-6 rounded-3xl bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10 border border-blue-500/20 backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg"
        >
          <div className="flex items-center gap-3.5 text-center md:text-left">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-600 text-white flex items-center justify-center shrink-0 shadow-md">
              <Gift className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center justify-center md:justify-start gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-purple-600 dark:text-purple-400">
                  Limited Opportunity
                </span>
                <span className="px-2 py-0.5 rounded-full bg-pink-500 text-white text-[9px] font-extrabold uppercase">
                  20% OFF
                </span>
              </div>
              <h4 className="font-extrabold text-sm sm:text-base text-gray-900 dark:text-white">
                Startup & First-Project Discount Available!
              </h4>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Use promo code <span className="font-mono font-bold text-blue-600 dark:text-blue-400">STARTUP20</span> for 20% off any custom package + 30 days free support.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              playClick();
              const el = document.getElementById('estimator-box');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5 shrink-0 active:scale-95"
          >
            <span>Build Custom Estimate</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </motion.div>

        {/* ==================================================================== */}
        {/* INTERACTIVE SCOPE ESTIMATOR & ENGINE */}
        {/* ==================================================================== */}
        <motion.div
          id="estimator-box"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="p-5 sm:p-8 md:p-10 rounded-3xl bg-gradient-to-br from-white via-blue-50/20 to-purple-50/10 dark:from-gray-900 dark:via-gray-900/90 dark:to-gray-950 backdrop-blur-2xl border border-gray-200 dark:border-gray-800 shadow-2xl space-y-6"
        >
          {/* Estimator Header with Live Pricing Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 border-b border-gray-200 dark:border-gray-800 pb-6">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold">
                <Calculator className="w-3.5 h-3.5" />
                <span>AI-Powered Scope Estimator v3.0</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">
                Interactive Project Cost Calculator
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 max-w-xl">
                Configure your tech stack and feature modules to receive a transparent estimate, milestone timeline, and instant quote.
              </p>
            </div>

            {/* Live Stats Pill Group */}
            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              <div className="p-4 rounded-2xl bg-gradient-to-tr from-blue-600 to-purple-600 text-white shadow-xl shadow-blue-500/20 text-center space-y-0.5 min-w-[170px]">
                <div className="text-[11px] font-medium text-blue-100 uppercase tracking-wider">Estimated Investment</div>
                <div className="text-2xl sm:text-3xl font-black tracking-tight">
                  ~${estimate.cost.toLocaleString()}
                </div>
                <div className="text-xs text-blue-100 font-semibold">
                  {estimate.weeks} Weeks • Complete Delivery
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg text-center space-y-0.5 min-w-[140px] flex flex-col justify-center">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">3-Year Projected Value</div>
                <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                  ${(estimate.roiProjection.threeYearValue / 1000).toFixed(0)}k+
                </div>
                <div className="text-[10px] text-gray-500 font-medium">
                  Break-even: ~{estimate.roiProjection.breakEvenMonths}mo
                </div>
              </div>
            </div>
          </div>

          {/* Step Navigation Pill */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
            {steps.map((step, idx) => (
              <button
                key={step}
                onClick={() => { playClick(); setCurrentStep(idx); }}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold transition-all shrink-0 ${currentStep === idx
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 scale-102'
                  : currentStep > idx
                    ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                  }`}
              >
                {currentStep > idx ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Circle className="w-3.5 h-3.5" />}
                <span>{step}</span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Configuration Wizard */}
            <div className="lg:col-span-7 space-y-5">
              <AnimatePresence mode="wait">
                {/* STEP 0: PLATFORM SELECTION */}
                {currentStep === 0 && (
                  <motion.div
                    key="step0"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                        1. Select Platform or Project Type
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {Object.entries(BASE_PROJECTS).map(([key, item]) => (
                          <button
                            key={key}
                            type="button"
                            onClick={() => { playClick(); setProjectType(key as ProjectType); }}
                            className={`p-3.5 rounded-2xl border text-left transition-all relative ${projectType === key
                              ? 'border-blue-600 bg-blue-50/80 dark:bg-blue-950/60 shadow-md ring-2 ring-blue-500/30'
                              : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/40 hover:bg-gray-50 dark:hover:bg-gray-800'
                              }`}
                          >
                            <div className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white">{item.label}</div>
                            <div className="text-xs text-blue-600 dark:text-blue-400 font-extrabold mt-0.5">
                              Base: ${item.price} • {item.timeWeeks} wks
                            </div>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {item.techStack.slice(0, 3).map((t) => (
                                <span key={t} className="text-[9px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                                  {t}
                                </span>
                              ))}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Client Tier Discount Selector */}
                    <div className="space-y-2 pt-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                          Client Tier & Founder Discount
                        </label>
                        <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400">
                          {CLIENT_TIER_DISCOUNTS[clientTier].description}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {Object.entries(CLIENT_TIER_DISCOUNTS).map(([tier, config]) => (
                          <button
                            key={tier}
                            type="button"
                            onClick={() => { playClick(); setClientTier(tier as ClientTier); }}
                            className={`p-2.5 rounded-xl border text-xs font-bold text-center transition-all ${clientTier === tier
                              ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 shadow-sm ring-1 ring-purple-500'
                              : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/30 text-gray-600 dark:text-gray-400 hover:bg-gray-50'
                              }`}
                          >
                            <div>{config.label.split('/')[0]}</div>
                            <div className="text-[10px] font-bold text-purple-500 mt-0.5">
                              {config.discount > 0 ? `-${config.discount * 100}% Discount` : 'Standard SLA'}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* STEP 1: MODULES & FEATURES */}
                {currentStep === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                          2. Select Required Architecture & Modules
                        </label>
                        <span className="text-xs text-blue-600 dark:text-blue-400 font-bold">
                          {selectedFeatures.length} Modules Selected
                        </span>
                      </div>

                      {/* Smart Recommendations */}
                      <div className="p-3 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-blue-700 dark:text-blue-300 mb-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                          Recommended for {BASE_PROJECTS[projectType].label}:
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {recommendedFeatures.map((fid) => {
                            const feat = FEATURE_CATALOG.find(f => f.id === fid);
                            const isSelected = selectedFeatures.includes(fid);
                            return (
                              <button
                                key={fid}
                                type="button"
                                onClick={() => toggleFeature(fid)}
                                className={`text-[10px] font-bold px-2.5 py-1 rounded-full transition-all ${isSelected
                                  ? 'bg-blue-600 text-white shadow-sm'
                                  : 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 hover:bg-blue-50'
                                  }`}
                              >
                                {isSelected ? '✓ ' : '+ '}{feat?.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Feature Catalog Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
                        {FEATURE_CATALOG.map((feat) => {
                          const isChecked = selectedFeatures.includes(feat.id);

                          return (
                            <button
                              key={feat.id}
                              type="button"
                              onClick={() => toggleFeature(feat.id)}
                              className={`flex flex-col p-3 rounded-2xl border text-left transition-all ${isChecked
                                ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/50 shadow-sm ring-1 ring-blue-500'
                                : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/30 hover:bg-gray-50 dark:hover:bg-gray-800'
                                }`}
                            >
                              <div className="flex items-center justify-between w-full">
                                <span className={`text-xs font-bold ${isChecked ? 'text-blue-600 dark:text-blue-300' : 'text-gray-800 dark:text-gray-200'}`}>
                                  {feat.label}
                                </span>
                                <span className="text-[11px] font-extrabold text-blue-600 dark:text-blue-400 shrink-0">
                                  +${feat.cost}
                                </span>
                              </div>
                              <span className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                                {feat.description}
                              </span>
                              <div className="flex items-center gap-1.5 mt-2">
                                <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 capitalize">
                                  {feat.category}
                                </span>
                                <span className="text-[9px] text-gray-400 flex items-center gap-0.5">
                                  <Clock className="w-2.5 h-2.5" />
                                  ~{feat.days}d
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* STEP 2: TIMELINE URGENCY & ANALYTICS */}
                {currentStep === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                        3. Delivery Urgency & Sprint Velocity
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {Object.entries(URGENCY_MULTIPLIERS).map(([key, item]) => (
                          <button
                            key={key}
                            type="button"
                            onClick={() => { playClick(); setUrgency(key as UrgencyLevel); }}
                            className={`p-3 rounded-2xl border text-xs font-bold text-center transition-all ${urgency === key
                              ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 shadow-md ring-2 ring-blue-500/30'
                              : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/30 text-gray-600 dark:text-gray-400 hover:bg-gray-50'
                              }`}
                          >
                            <div>{item.label.split('(')[0]}</div>
                            <div className="text-[10px] font-extrabold text-blue-500 mt-1">
                              {item.badge}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Live Analytics Breakdown */}
                    <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 space-y-3">
                      <h4 className="font-bold text-xs text-gray-900 dark:text-white flex items-center gap-1.5">
                        <BarChart3 className="w-3.5 h-3.5 text-blue-500" />
                        Execution & Architecture Metrics
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <span className="text-[10px] text-gray-500 font-bold uppercase">Complexity Level</span>
                          <ComplexityBadge score={estimate.complexityScore} />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] text-gray-500 font-bold uppercase">Yearly Maintenance Est.</span>
                          <div className="text-sm font-extrabold text-gray-900 dark:text-white">
                            ~${estimate.maintenanceYearly}/yr
                          </div>
                        </div>
                      </div>
                      <RiskIndicator score={estimate.riskScore} />
                    </div>
                  </motion.div>
                )}

                {/* STEP 3: SUBMIT BRIEF & INSTANT HIRE */}
                {currentStep === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <form onSubmit={handleSubmitEstimatorBrief} className="space-y-3.5">
                      <div className="space-y-0.5">
                        <h4 className="font-extrabold text-sm sm:text-base text-gray-900 dark:text-white flex items-center gap-1.5">
                          <Send className="w-4 h-4 text-blue-500" />
                          Finalize Specification & Submit
                        </h4>
                        <p className="text-xs text-gray-500">
                          Submit this calculated brief directly to Muhammad Ahmad or book immediately on WhatsApp.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1">
                            Your Name *
                          </label>
                          <input
                            type="text"
                            required
                            value={estimatorName}
                            onChange={(e) => setEstimatorName(e.target.value)}
                            placeholder="e.g. David Harrison"
                            className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1">
                            Your Email Address *
                          </label>
                          <input
                            type="email"
                            required
                            value={estimatorEmail}
                            onChange={(e) => setEstimatorEmail(e.target.value)}
                            placeholder="e.g. david@company.com"
                            className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1">
                          Project Goals & Specific Notes (Optional)
                        </label>
                        <textarea
                          rows={3}
                          value={estimatorNotes}
                          onChange={(e) => setEstimatorNotes(e.target.value)}
                          placeholder="Tell me about your target launch date, special APIs, or design references..."
                          className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        <button
                          type="submit"
                          disabled={isEstimatorSubmitting}
                          className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-500/25 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 active:scale-95"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>{isEstimatorSubmitting ? 'Sending Brief...' : 'Submit Specification'}</span>
                        </button>

                        <a
                          href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Hi Muhammad Ahmad! 👋\nI just configured an estimate for ${BASE_PROJECTS[projectType].label} (~$${estimate.cost}, ~${estimate.weeks} weeks).\nModules: ${selectedFeatures.join(', ')}\nClient: ${estimatorName || 'Client'}\nLet's discuss getting started!`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-xs shadow-md shadow-emerald-500/25 transition-all flex items-center justify-center gap-1.5 active:scale-95 text-center"
                        >
                          <FaWhatsapp className="w-4 h-4" />
                          <span>1-Click Hire on WhatsApp</span>
                        </a>
                      </div>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Wizard Navigation Buttons */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => { playClick(); setCurrentStep(Math.max(0, currentStep - 1)); }}
                  disabled={currentStep === 0}
                  className="flex items-center gap-1 px-3.5 py-1.5 rounded-lg text-xs font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white disabled:opacity-30 transition-all"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Back
                </button>

                {currentStep < steps.length - 1 && (
                  <button
                    type="button"
                    onClick={() => { playClick(); setCurrentStep(currentStep + 1); }}
                    className="flex items-center gap-1 px-5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all active:scale-95"
                  >
                    <span>Next: {steps[currentStep + 1]}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Right Live Breakdown Card */}
            <div className="lg:col-span-5 space-y-4">
              <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-sm text-gray-900 dark:text-white flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-purple-500" />
                    Live Scope Breakdown
                  </h4>
                  <button
                    type="button"
                    onClick={() => setShowBreakdown(!showBreakdown)}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 transition-colors"
                  >
                    {showBreakdown ? 'Hide Details' : 'Show Details'}
                  </button>
                </div>

                {/* 4-Stat Box */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-3 rounded-2xl bg-blue-50/50 dark:bg-blue-950/40 border border-blue-200/50 dark:border-blue-900/40 text-center">
                    <Wallet className="w-4 h-4 text-blue-500 mx-auto mb-0.5" />
                    <div className="text-xl font-black text-gray-900 dark:text-white">${estimate.cost.toLocaleString()}</div>
                    <div className="text-[9px] font-extrabold text-gray-400 uppercase">Total Estimate</div>
                  </div>
                  <div className="p-3 rounded-2xl bg-purple-50/50 dark:bg-purple-950/40 border border-purple-200/50 dark:border-purple-900/40 text-center">
                    <Timer className="w-4 h-4 text-purple-500 mx-auto mb-0.5" />
                    <div className="text-xl font-black text-gray-900 dark:text-white">~{estimate.weeks} wks</div>
                    <div className="text-[9px] font-extrabold text-gray-400 uppercase">Estimated Timeline</div>
                  </div>
                  <div className="p-3 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/40 border border-emerald-200/50 dark:border-emerald-900/40 text-center">
                    <Users className="w-4 h-4 text-emerald-500 mx-auto mb-0.5" />
                    <div className="text-xl font-black text-gray-900 dark:text-white">Lead Architect</div>
                    <div className="text-[9px] font-extrabold text-gray-400 uppercase">Direct Access</div>
                  </div>
                  <div className="p-3 rounded-2xl bg-amber-50/50 dark:bg-amber-950/40 border border-amber-200/50 dark:border-amber-900/40 text-center">
                    <Rocket className="w-4 h-4 text-amber-500 mx-auto mb-0.5" />
                    <div className="text-xl font-black text-gray-900 dark:text-white">+{estimate.roiProjection.efficiencyGain}%</div>
                    <div className="text-[9px] font-extrabold text-gray-400 uppercase">Efficiency Gain</div>
                  </div>
                </div>

                {/* Detailed Accordion */}
                <AnimatePresence>
                  {showBreakdown && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-4 overflow-hidden pt-2 border-t border-gray-100 dark:border-gray-800"
                    >
                      {/* Milestones list */}
                      <div className="space-y-2">
                        <h5 className="font-bold text-xs text-gray-900 dark:text-white flex items-center gap-1">
                          <GitBranch className="w-3.5 h-3.5 text-blue-500" />
                          Escrow Payment Milestones:
                        </h5>
                        <div className="space-y-1.5">
                          {estimate.milestones.map((m, idx) => (
                            <div key={m.id} className="p-2 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs">
                              <span className="font-semibold text-gray-800 dark:text-gray-200">{m.name}</span>
                              <span className="font-bold text-blue-600 dark:text-blue-400">{m.paymentPercentage}% pay</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Proposed Tech Stack */}
                      <div className="space-y-1.5">
                        <h5 className="font-bold text-xs text-gray-900 dark:text-white flex items-center gap-1">
                          <Cpu className="w-3.5 h-3.5 text-cyan-500" />
                          Tech Stack Configured:
                        </h5>
                        <div className="flex flex-wrap gap-1">
                          {estimate.techStack.map((tech) => (
                            <span key={tech} className="text-[10px] px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold">
                              {tech}
                            </span>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Direct Action Links */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      playClick();
                      const text = `Project Scope Estimate:\nType: ${BASE_PROJECTS[projectType].label}\nCost: ~$${estimate.cost.toLocaleString()}\nTimeline: ~${estimate.weeks} Weeks\nFeatures: ${selectedFeatures.join(', ')}`;
                      navigator.clipboard.writeText(text);
                      toast.success('Estimate copied to clipboard!');
                    }}
                    className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all active:scale-95"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Copy Summary</span>
                  </button>

                  <a
                    href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Hi Muhammad Ahmad! I would like to book a quick consultation for my project: ${BASE_PROJECTS[projectType].label} (~$${estimate.cost}).`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold hover:bg-emerald-500/20 transition-all text-center active:scale-95"
                  >
                    <FaWhatsapp className="w-3.5 h-3.5" />
                    <span>Chat Directly</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ==================================================================== */}
        {/* TRUST INDICATORS & CLIENT GUARANTEES */}
        {/* ==================================================================== */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {[
            {
              icon: Shield,
              title: '100% Risk-Free Payments',
              desc: 'Pay in milestone installments as deliverables are verified and approved.',
            },
            {
              icon: Clock,
              title: '24-48h Rapid Kickoff',
              desc: 'Immediate architecture blueprinting and sprint onboarding with daily async updates.',
            },
            {
              icon: Lock,
              title: 'Full IP & Code Ownership',
              desc: 'You own 100% of all repositories, production builds, and design assets upon delivery.',
            },
            {
              icon: Award,
              title: 'Post-Launch Warranty',
              desc: 'Includes 14 to 30 days of complimentary bug fixing, monitoring, and guidance.',
            },
          ].map((item) => (
            <div
              key={item.title}
              className="p-5 rounded-3xl bg-white/80 dark:bg-gray-900/80 border border-gray-200/80 dark:border-gray-800/80 backdrop-blur-sm flex flex-col space-y-2 hover:border-blue-500/40 transition-all shadow-sm"
            >
              <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <item.icon className="w-5 h-5" />
              </div>
              <h4 className="font-extrabold text-sm text-gray-900 dark:text-white">{item.title}</h4>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </motion.div>
      </div>

      {/* ==================================================================== */}
      {/* INSTANT SERVICE BOOKING MODAL */}
      {/* ==================================================================== */}
      <AnimatePresence>
        {selectedServiceForModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseBookingModal}
              className="fixed inset-0 bg-black/60 backdrop-blur-md"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative z-10 w-full max-w-2xl bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden my-8"
            >
              {/* Header */}
              <div className="p-5 sm:p-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white flex items-start justify-between">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-extrabold uppercase">
                    <Sparkles className="w-3 h-3 text-yellow-300" />
                    Instant Service Booking
                  </div>
                  <h3 className="text-lg sm:text-2xl font-black">{selectedServiceForModal.title}</h3>
                  <p className="text-xs text-white/80">
                    Choose your desired package tier or customize with fast-track add-ons.
                  </p>
                </div>
                <button
                  onClick={handleCloseBookingModal}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto custom-scrollbar">
                {/* 1. Package Tier Selection */}
                <div className="space-y-2.5">
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    1. Select Package Tier
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {selectedServiceForModal.packages.map((pkg) => (
                      <button
                        key={pkg.tier}
                        type="button"
                        onClick={() => { playClick(); setSelectedTier(pkg.tier); }}
                        className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${selectedTier === pkg.tier
                          ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/60 shadow-md ring-2 ring-blue-500/30'
                          : 'border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 hover:bg-gray-100'
                          }`}
                      >
                        <div className="space-y-1">
                          {pkg.popular && (
                            <span className="px-2 py-0.5 rounded-full bg-blue-500 text-white text-[9px] font-extrabold uppercase">
                              Most Popular
                            </span>
                          )}
                          <div className="font-extrabold text-xs sm:text-sm text-gray-900 dark:text-white">
                            {pkg.title}
                          </div>
                          <div className="text-[11px] text-gray-500 line-clamp-2">
                            {pkg.description}
                          </div>
                        </div>

                        <div className="mt-3 pt-2 border-t border-gray-200/50 dark:border-gray-700/50 flex items-baseline justify-between">
                          <span className="text-base sm:text-lg font-black text-blue-600 dark:text-blue-400">
                            ${pkg.price}
                          </span>
                          <span className="text-[10px] font-semibold text-gray-500">
                            {pkg.deliveryDays}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Optional Add-ons */}
                {selectedServiceForModal.addons.length > 0 && (
                  <div className="space-y-2">
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                      2. Optional Add-ons
                    </label>
                    <div className="space-y-2">
                      {selectedServiceForModal.addons.map((addon) => {
                        const isChecked = selectedAddons.includes(addon.id);
                        return (
                          <button
                            key={addon.id}
                            type="button"
                            onClick={() => {
                              playClick();
                              setSelectedAddons(prev =>
                                prev.includes(addon.id) ? prev.filter(a => a !== addon.id) : [...prev, addon.id]
                              );
                            }}
                            className={`w-full p-3 rounded-2xl border text-left transition-all flex items-center justify-between ${isChecked
                              ? 'border-purple-500 bg-purple-50/60 dark:bg-purple-950/40 ring-1 ring-purple-500'
                              : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/20 hover:bg-gray-50'
                              }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <div className={`w-5 h-5 rounded-lg flex items-center justify-center text-xs font-bold ${isChecked ? 'bg-purple-600 text-white' : 'border border-gray-300 dark:border-gray-600'}`}>
                                {isChecked && '✓'}
                              </div>
                              <div>
                                <div className="font-bold text-xs text-gray-900 dark:text-white">{addon.name}</div>
                                <div className="text-[10px] text-gray-500">{addon.description}</div>
                              </div>
                            </div>
                            <span className="text-xs font-extrabold text-purple-600 dark:text-purple-400">
                              +${addon.price}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 3. Promo Code Input & Total */}
                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      placeholder="Promo Code (e.g. STARTUP20)"
                      className="px-3 py-2 text-xs rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 uppercase font-mono font-bold focus:ring-2 focus:ring-blue-500 outline-none w-full sm:w-48"
                    />
                    <button
                      type="button"
                      onClick={handleApplyPromo}
                      className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shrink-0 active:scale-95"
                    >
                      Apply
                    </button>
                  </div>

                  <div className="text-right w-full sm:w-auto flex sm:flex-col justify-between items-center sm:items-end">
                    <span className="text-[11px] font-bold text-gray-400 uppercase">Calculated Total</span>
                    <div className="flex items-baseline gap-1.5">
                      {promoApplied && (
                        <span className="text-xs line-through text-gray-400">
                          ${modalSelectedPackage ? modalSelectedPackage.price + selectedAddons.reduce((sum, id) => sum + (selectedServiceForModal.addons.find(a => a.id === id)?.price || 0), 0) : 0}
                        </span>
                      )}
                      <span className="text-2xl font-black text-blue-600 dark:text-blue-400">
                        ${modalTotalPrice}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 4. Quick Direct Action Route */}
                <div className="space-y-3 pt-2 border-t border-gray-100 dark:border-gray-800">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <a
                      href={getModalWhatsAppUrl()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3.5 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 active:scale-95 text-center"
                    >
                      <FaWhatsapp className="w-4 h-4" />
                      <span>1-Click Hire on WhatsApp</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => {
                        const formElem = document.getElementById('modal-brief-form');
                        formElem?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-extrabold text-xs shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 active:scale-95 text-center"
                    >
                      <Send className="w-4 h-4" />
                      <span>Submit In-App Brief</span>
                    </button>
                  </div>

                  {/* Quick Form */}
                  <form id="modal-brief-form" onSubmit={handleModalSubmit} className="space-y-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <input
                        type="text"
                        required
                        value={modalClientName}
                        onChange={(e) => setModalClientName(e.target.value)}
                        placeholder="Your Full Name *"
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                      <input
                        type="email"
                        required
                        value={modalClientEmail}
                        onChange={(e) => setModalClientEmail(e.target.value)}
                        placeholder="Your Work Email *"
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <textarea
                      rows={2}
                      value={modalClientNote}
                      onChange={(e) => setModalClientNote(e.target.value)}
                      placeholder="Brief notes, link to Figma or requirements (optional)..."
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                    />
                    <button
                      type="submit"
                      disabled={isModalSubmitting}
                      className="w-full py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:opacity-90 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
                    >
                      <span>{isModalSubmitting ? 'Submitting...' : 'Confirm & Request Kickoff Call'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Scrollbar Styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
          height: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(156, 163, 175, 0.4);
          border-radius: 999px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(156, 163, 175, 0.7);
        }
      `}</style>
    </section>
  );
};

export default Services;