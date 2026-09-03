// ============================================================================
// Services.tsx — Enterprise-Grade Service & Estimator Module
// ============================================================================
import { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Tilt from 'react-parallax-tilt';
import {
  Code, Brain, Smartphone, Database, Globe, Zap, Check, Calculator,
  ArrowRight, Sparkles, Send, Clock, Shield, Layers, TrendingUp,
  AlertTriangle, Cpu, Lock, BarChart3, GitBranch, FileText,
  ChevronRight, ChevronLeft, Download, Share2, X, Info,
  CheckCircle2, Circle, Timer, Users, Wallet, Rocket
} from 'lucide-react';
import { usePortfolio } from '../context/PortfolioContext';
import { useSound } from '../context/SoundContext';
import { contactAPI, Service } from '../api/services';
import toast from 'react-hot-toast';

// ============================================================================
// DOMAIN TYPES — Strict TypeScript Contracts
// ============================================================================

type ProjectType = 'web' | 'mobile' | 'ai' | 'fullstack' | 'ecommerce' | 'saas';
type UrgencyLevel = 'standard' | 'accelerated' | 'rush' | 'emergency';
type ComplexityTier = 'low' | 'medium' | 'high' | 'enterprise';
type ClientTier = 'startup' | 'sme' | 'enterprise' | 'agency';

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

// ============================================================================
// CONFIGURATION — Real Business Rules (No Mock Data)
// ============================================================================

const BASE_PROJECTS: Record<ProjectType, BaseProject> = {
  web: {
    type: 'web',
    label: 'Full Stack Web Application',
    price: 1200,
    timeWeeks: 3,
    minTeamSize: 2,
    techStack: ['React/Next.js', 'Node.js/Express', 'PostgreSQL', 'Redis', 'AWS/Vercel'],
    deliverables: ['Source Code', 'API Documentation', 'Deployment Guide', 'User Manual'],
    complexityBase: 1.0,
  },
  mobile: {
    type: 'mobile',
    label: 'Cross-Platform Mobile App',
    price: 1800,
    timeWeeks: 4,
    minTeamSize: 2,
    techStack: ['Flutter/React Native', 'Firebase', 'REST/GraphQL', 'CI/CD'],
    deliverables: ['iOS & Android Builds', 'App Store Assets', 'Analytics Setup'],
    complexityBase: 1.2,
  },
  ai: {
    type: 'ai',
    label: 'AI/ML Solution',
    price: 2500,
    timeWeeks: 5,
    minTeamSize: 3,
    techStack: ['Python/TensorFlow', 'OpenAI/Anthropic APIs', 'Vector DB', 'FastAPI'],
    deliverables: ['Trained Model', 'API Endpoints', 'Inference Pipeline', 'Monitoring'],
    complexityBase: 1.5,
  },
  fullstack: {
    type: 'fullstack',
    label: 'Web + Mobile + AI Integration',
    price: 3500,
    timeWeeks: 7,
    minTeamSize: 4,
    techStack: ['Next.js', 'Flutter', 'Python AI', 'PostgreSQL', 'Docker/K8s'],
    deliverables: ['Web App', 'Mobile Apps', 'AI Features', 'DevOps Pipeline'],
    complexityBase: 1.8,
  },
  ecommerce: {
    type: 'ecommerce',
    label: 'E-Commerce Platform',
    price: 2000,
    timeWeeks: 4,
    minTeamSize: 2,
    techStack: ['Next.js/Shopify', 'Stripe/PayPal', 'Inventory API', 'Analytics'],
    deliverables: ['Storefront', 'Admin Dashboard', 'Payment Flow', 'Order Management'],
    complexityBase: 1.3,
  },
  saas: {
    type: 'saas',
    label: 'SaaS Platform',
    price: 2800,
    timeWeeks: 6,
    minTeamSize: 3,
    techStack: ['Next.js', 'Multi-tenant DB', 'Stripe Billing', 'Admin Panel'],
    deliverables: ['Tenant System', 'Billing Engine', 'Team Management', 'API Gateway'],
    complexityBase: 1.6,
  },
};

const FEATURE_CATALOG: FeatureOption[] = [
  {
    id: 'auth',
    label: 'Advanced Auth & RBAC',
    cost: 250,
    days: 4,
    complexity: 'medium',
    category: 'security',
    description: 'JWT/OAuth2, role-based access, SSO integration',
  },
  {
    id: 'admin_panel',
    label: 'Admin Control Suite',
    cost: 500,
    days: 7,
    complexity: 'high',
    category: 'core',
    dependencies: ['auth'],
    description: 'Dashboard, user management, analytics, audit logs',
  },
  {
    id: 'payments',
    label: 'Payment Gateway Integration',
    cost: 350,
    days: 5,
    complexity: 'high',
    category: 'integration',
    dependencies: ['auth'],
    description: 'Stripe/PayPal, subscriptions, invoicing, webhooks',
  },
  {
    id: 'ai_agent',
    label: 'AI/LLM Agent Assistant',
    cost: 600,
    days: 8,
    complexity: 'enterprise',
    category: 'ai',
    description: 'RAG pipeline, custom knowledge base, chat interface',
  },
  {
    id: 'realtime',
    label: 'Real-Time Infrastructure',
    cost: 400,
    days: 5,
    complexity: 'high',
    category: 'infrastructure',
    description: 'WebSockets, SSE, live notifications, presence system',
  },
  {
    id: '3d_canvas',
    label: '3D WebGL Experience',
    cost: 450,
    days: 6,
    complexity: 'high',
    category: 'ui',
    description: 'Three.js, WebGL shaders, interactive 3D scenes',
  },
  {
    id: 'seo_analytics',
    label: 'SEO & Business Analytics',
    cost: 300,
    days: 4,
    complexity: 'medium',
    category: 'integration',
    description: 'Google Analytics, Search Console, custom dashboards',
  },
  {
    id: 'multi_tenant',
    label: 'Multi-Tenant Architecture',
    cost: 550,
    days: 7,
    complexity: 'enterprise',
    category: 'infrastructure',
    description: 'Tenant isolation, schema-per-tenant, white-labeling',
  },
  {
    id: 'cdn_media',
    label: 'Media Processing & CDN',
    cost: 280,
    days: 4,
    complexity: 'medium',
    category: 'infrastructure',
    description: 'Image/video optimization, streaming, cloud storage',
  },
  {
    id: 'api_gateway',
    label: 'API Gateway & Rate Limiting',
    cost: 320,
    days: 4,
    complexity: 'high',
    category: 'infrastructure',
    description: 'REST/GraphQL gateway, throttling, caching layer',
  },
  {
    id: 'blockchain',
    label: 'Web3 & Smart Contracts',
    cost: 800,
    days: 10,
    complexity: 'enterprise',
    category: 'integration',
    incompatibleWith: ['ai_agent'],
    description: 'Solidity, wallet integration, NFT support',
  },
  {
    id: 'pwa',
    label: 'Progressive Web App',
    cost: 200,
    days: 3,
    complexity: 'low',
    category: 'ui',
    description: 'Offline support, push notifications, installable',
  },
];

const URGENCY_MULTIPLIERS: Record<UrgencyLevel, { cost: number; time: number; label: string }> = {
  standard: { cost: 1.0, time: 1.0, label: 'Standard (8h/day)' },
  accelerated: { cost: 1.3, time: 0.75, label: 'Fast Track (+30%)' },
  rush: { cost: 1.6, time: 0.55, label: 'Rush Delivery (+60%)' },
  emergency: { cost: 2.0, time: 0.4, label: 'Emergency (24/7) (+100%)' },
};

const CLIENT_TIER_DISCOUNTS: Record<ClientTier, { discount: number; minProjects: number }> = {
  startup: { discount: 0.15, minProjects: 1 },
  sme: { discount: 0.05, minProjects: 2 },
  enterprise: { discount: -0.1, minProjects: 5 }, // Premium for SLA
  agency: { discount: 0.2, minProjects: 3 },
};

// ============================================================================
// BUSINESS LOGIC ENGINE — Pure Functions (Testable, Predictable)
// ============================================================================

/**
 * Calculates complexity score based on feature interactions
 * Higher score = more risk, more senior devs needed
 */
const calculateComplexityScore = (
  baseType: ProjectType,
  featureIds: string[],
  urgency: UrgencyLevel
): number => {
  const base = BASE_PROJECTS[baseType].complexityBase;

  const featureComplexity = featureIds.reduce((score, fid) => {
    const feat = FEATURE_CATALOG.find(f => f.id === fid);
    if (!feat) return score;

    const tierMultiplier = { low: 0.1, medium: 0.2, high: 0.35, enterprise: 0.5 };
    return score + tierMultiplier[feat.complexity];
  }, 0);

  // Dependency chain penalty (more dependencies = more coordination overhead)
  const dependencyPenalty = featureIds.reduce((penalty, fid) => {
    const feat = FEATURE_CATALOG.find(f => f.id === fid);
    if (!feat?.dependencies) return penalty;
    const missingDeps = feat.dependencies.filter(dep => !featureIds.includes(dep));
    return penalty + (missingDeps.length * 0.15);
  }, 0);

  // Urgency increases complexity (less time for testing, more parallel work)
  const urgencyMultiplier = { standard: 1, accelerated: 1.15, rush: 1.35, emergency: 1.6 };

  return Number(((base + featureComplexity + dependencyPenalty) * urgencyMultiplier[urgency]).toFixed(2));
};

/**
 * Generates milestones with payment schedules based on complexity
 */
const generateMilestones = (
  projectType: ProjectType,
  features: string[],
  totalWeeks: number,
  totalCost: number
): Milestone[] => {
  const base = BASE_PROJECTS[projectType];
  const milestones: Milestone[] = [];

  // Discovery & Architecture (always first)
  const discoveryDays = Math.max(3, Math.round(totalWeeks * 0.1 * 7));
  milestones.push({
    id: 'm1',
    name: 'Discovery & Architecture',
    durationDays: discoveryDays,
    deliverables: ['Technical Specification', 'Wireframes', 'Architecture Diagram', 'API Contract'],
    paymentPercentage: 20,
    dependencies: [],
  });

  // Core Development (split into sprints)
  const remainingDays = totalWeeks * 7 - discoveryDays;
  const sprintCount = Math.min(4, Math.max(2, Math.ceil(remainingDays / 14)));
  const sprintDays = Math.floor(remainingDays / sprintCount);

  for (let i = 0; i < sprintCount; i++) {
    const sprintFeatures = features.slice(
      Math.floor((i / sprintCount) * features.length),
      Math.floor(((i + 1) / sprintCount) * features.length)
    );

    milestones.push({
      id: `m${i + 2}`,
      name: `Development Sprint ${i + 1}`,
      durationDays: sprintDays,
      deliverables: [
        'Feature Implementation',
        'Code Review',
        'Unit Tests',
        ...(i === sprintCount - 1 ? ['Integration Tests'] : [])
      ],
      paymentPercentage: Math.floor(60 / sprintCount),
      dependencies: i === 0 ? ['m1'] : [`m${i + 1}`],
    });
  }

  // Deployment & Handover (always last)
  milestones.push({
    id: `m${sprintCount + 2}`,
    name: 'Deployment & Launch',
    durationDays: Math.max(2, Math.round(totalWeeks * 0.08 * 7)),
    deliverables: ['Production Deploy', 'CI/CD Pipeline', 'Documentation', 'Training Session'],
    paymentPercentage: 20,
    dependencies: [`m${sprintCount + 1}`],
  });

  // Normalize payment percentages to sum to 100
  const totalPct = milestones.reduce((sum, m) => sum + m.paymentPercentage, 0);
  if (totalPct !== 100) {
    const diff = 100 - totalPct;
    milestones[milestones.length - 1].paymentPercentage += diff;
  }

  return milestones;
};

/**
 * Resource allocation based on complexity and timeline
 */
const calculateResourceBreakdown = (
  complexityScore: number,
  weeks: number,
  teamSize: number
): ResourceBreakdown[] => {
  const totalHours = weeks * 5 * 8 * teamSize; // 5 days/week, 8 hours/day

  const seniorRatio = Math.min(0.5, 0.2 + (complexityScore * 0.05));
  const midRatio = Math.min(0.4, 0.3 + (complexityScore * 0.03));
  const juniorRatio = Math.max(0.1, 1 - seniorRatio - midRatio);

  const seniorHours = Math.round(totalHours * seniorRatio);
  const midHours = Math.round(totalHours * midRatio);
  const juniorHours = totalHours - seniorHours - midHours;

  return [
    { role: 'Senior Engineer / Architect', hours: seniorHours, rate: 85, cost: seniorHours * 85 },
    { role: 'Mid-Level Developer', hours: midHours, rate: 55, cost: midHours * 55 },
    { role: 'Junior Developer / QA', hours: juniorHours, rate: 35, cost: juniorHours * 35 },
  ];
};

/**
 * ROI projection based on feature set and project type
 */
const calculateROI = (projectType: ProjectType, features: string[], cost: number): ROIProjection => {
  const baseEfficiency = { web: 1.2, mobile: 1.4, ai: 1.8, fullstack: 2.0, ecommerce: 1.5, saas: 1.6 };
  const featureMultiplier = 1 + (features.length * 0.08);

  const monthlyValue = cost * 0.15 * baseEfficiency[projectType] * featureMultiplier;
  const breakEven = Math.ceil(cost / monthlyValue);
  const threeYearValue = monthlyValue * 36;
  const efficiencyGain = Math.round((baseEfficiency[projectType] * featureMultiplier - 1) * 100);

  return {
    breakEvenMonths: breakEven,
    threeYearValue: Math.round(threeYearValue),
    efficiencyGain,
  };
};

/**
 * Main estimation engine — the core business logic
 */
const calculateEstimate = (
  projectType: ProjectType,
  selectedFeatures: string[],
  urgency: UrgencyLevel,
  clientTier: ClientTier = 'startup'
): EstimateResult => {
  const base = BASE_PROJECTS[projectType];
  const urgencyMult = URGENCY_MULTIPLIERS[urgency];

  // Calculate base cost with features
  let totalCost = base.price;
  let totalDays = base.timeWeeks * 7;

  selectedFeatures.forEach((fid) => {
    const feat = FEATURE_CATALOG.find(f => f.id === fid);
    if (feat) {
      totalCost += feat.cost;
      totalDays += feat.days;
    }
  });

  // Apply urgency modifiers
  totalCost *= urgencyMult.cost;
  totalDays = Math.round(totalDays * urgencyMult.time);

  // Apply client tier discount
  const tierDiscount = CLIENT_TIER_DISCOUNTS[clientTier].discount;
  totalCost *= (1 - tierDiscount);

  // Calculate derived metrics
  const complexityScore = calculateComplexityScore(projectType, selectedFeatures, urgency);
  const teamSize = Math.max(base.minTeamSize, Math.ceil(complexityScore / 1.5));
  const weeks = Math.max(1, Math.ceil(totalDays / 7));
  const riskScore = Math.min(100, Math.round((complexityScore / 5) * 100));

  const milestones = generateMilestones(projectType, selectedFeatures, weeks, totalCost);
  const resourceBreakdown = calculateResourceBreakdown(complexityScore, weeks, teamSize);
  const roiProjection = calculateROI(projectType, selectedFeatures, totalCost);

  // Maintenance is typically 15-25% of initial cost yearly
  const maintenanceYearly = Math.round(totalCost * (0.15 + (complexityScore * 0.02)));

  // Merge tech stacks
  const techStack = [...new Set([...base.techStack, ...selectedFeatures.flatMap(fid => {
    const feat = FEATURE_CATALOG.find(f => f.id === fid);
    return feat ? (
      feat.category === 'ai' ? ['Python', 'OpenAI API'] :
        feat.category === 'security' ? ['Auth0/Clerk', 'JWT'] :
          feat.id === 'payments' ? ['Stripe', 'Webhook Handling'] :
            feat.id === 'realtime' ? ['Socket.io', 'Redis Pub/Sub'] :
              feat.id === '3d_canvas' ? ['Three.js', 'WebGL'] :
                feat.id === 'multi_tenant' ? ['Tenant Isolation', 'Schema Management'] :
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
// VALIDATION ENGINE
// ============================================================================

interface ValidationError {
  field: string;
  message: string;
}

const validateBrief = (
  name: string,
  email: string,
  projectType: ProjectType,
  features: string[]
): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (!name.trim() || name.trim().length < 2) {
    errors.push({ field: 'name', message: 'Full name must be at least 2 characters' });
  }

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email.trim())) {
    errors.push({ field: 'email', message: 'Please enter a valid email address' });
  }

  if (!BASE_PROJECTS[projectType]) {
    errors.push({ field: 'projectType', message: 'Invalid project type selected' });
  }

  // Check for incompatible features
  features.forEach((fid) => {
    const feat = FEATURE_CATALOG.find(f => f.id === fid);
    if (feat?.incompatibleWith) {
      feat.incompatibleWith.forEach((incId) => {
        if (features.includes(incId)) {
          errors.push({
            field: 'features',
            message: `${feat.label} cannot be combined with ${FEATURE_CATALOG.find(f => f.id === incId)?.label}`
          });
        }
      });
    }
  });

  // Check for missing dependencies
  features.forEach((fid) => {
    const feat = FEATURE_CATALOG.find(f => f.id === fid);
    if (feat?.dependencies) {
      feat.dependencies.forEach((depId) => {
        if (!features.includes(depId)) {
          errors.push({
            field: 'features',
            message: `${feat.label} requires ${FEATURE_CATALOG.find(f => f.id === depId)?.label}`
          });
        }
      });
    }
  });

  return errors;
};

// ============================================================================
// CUSTOM HOOKS — Business Logic Encapsulation
// ============================================================================

const useEstimatorState = () => {
  const [projectType, setProjectType] = useState<ProjectType>('fullstack');
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(['auth', 'admin_panel', 'seo_analytics']);
  const [urgency, setUrgency] = useState<UrgencyLevel>('standard');
  const [clientTier, setClientTier] = useState<ClientTier>('startup');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientNotes, setClientNotes] = useState('');
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [savedQuotes, setSavedQuotes] = useState<QuoteData[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);

  // Load saved quotes from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('estimator_quotes');
      if (stored) setSavedQuotes(JSON.parse(stored));
    } catch { /* ignore */ }
  }, []);

  const estimate = useMemo(
    () => calculateEstimate(projectType, selectedFeatures, urgency, clientTier),
    [projectType, selectedFeatures, urgency, clientTier]
  );

  const toggleFeature = useCallback((id: string) => {
    setSelectedFeatures((prev) => {
      const isSelected = prev.includes(id);
      if (isSelected) return prev.filter((f) => f !== id);

      // Auto-select dependencies
      const feat = FEATURE_CATALOG.find(f => f.id === id);
      const deps = feat?.dependencies || [];
      const newFeatures = [...prev, id];
      deps.forEach(dep => {
        if (!newFeatures.includes(dep)) newFeatures.push(dep);
      });
      return newFeatures;
    });
    setErrors(prev => prev.filter(e => e.field !== 'features'));
  }, []);

  const validate = useCallback(() => {
    const validationErrors = validateBrief(clientName, clientEmail, projectType, selectedFeatures);
    setErrors(validationErrors);
    return validationErrors.length === 0;
  }, [clientName, clientEmail, projectType, selectedFeatures]);

  const saveQuote = useCallback(() => {
    const quote: QuoteData = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      clientName: clientName || 'Anonymous',
      clientEmail: clientEmail || '',
      projectType,
      features: selectedFeatures,
      urgency,
      estimate,
      status: 'draft',
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };

    setSavedQuotes(prev => {
      const updated = [quote, ...prev].slice(0, 10); // Keep last 10
      localStorage.setItem('estimator_quotes', JSON.stringify(updated));
      return updated;
    });

    return quote.id;
  }, [clientName, clientEmail, projectType, selectedFeatures, urgency, estimate]);

  return {
    projectType, setProjectType,
    selectedFeatures, setSelectedFeatures, toggleFeature,
    urgency, setUrgency,
    clientTier, setClientTier,
    clientName, setClientName,
    clientEmail, setClientEmail,
    clientNotes, setClientNotes,
    errors, setErrors,
    currentStep, setCurrentStep,
    savedQuotes,
    isSubmitting, setIsSubmitting,
    showBreakdown, setShowBreakdown,
    estimate,
    validate,
    saveQuote,
  };
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

const ComplexityBadge = ({ score }: { score: number }) => {
  let color = 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
  let label = 'Low Complexity';

  if (score > 2.5) {
    color = 'text-amber-500 bg-amber-500/10 border-amber-500/20';
    label = 'Medium Complexity';
  }
  if (score > 4) {
    color = 'text-orange-500 bg-orange-500/10 border-orange-500/20';
    label = 'High Complexity';
  }
  if (score > 5.5) {
    color = 'text-red-500 bg-red-500/10 border-red-500/20';
    label = 'Enterprise Grade';
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
      <span className={`font-bold ${score > 70 ? 'text-red-500' : score > 40 ? 'text-amber-500' : 'text-emerald-500'}`}>
        {score}%
      </span>
    </div>
    <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${score}%` }}
        className={`h-full rounded-full ${score > 70 ? 'bg-red-500' : score > 40 ? 'bg-amber-500' : 'bg-emerald-500'}`}
      />
    </div>
    <p className="text-[10px] text-gray-500 dark:text-gray-500">
      {score > 70 ? 'High risk: Consider phased delivery or scope reduction' :
        score > 40 ? 'Moderate risk: Standard project management recommended' :
          'Low risk: Straightforward implementation expected'}
    </p>
  </div>
);

const MilestoneTimeline = ({ milestones }: { milestones: Milestone[] }) => (
  <div className="space-y-3">
    <h4 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-1.5">
      <GitBranch className="w-4 h-4 text-blue-500" />
      Delivery Milestones
    </h4>
    <div className="space-y-2">
      {milestones.map((m, idx) => (
        <motion.div
          key={m.id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: idx * 0.1 }}
          className="flex items-start gap-3 p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800"
        >
          <div className="w-6 h-6 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-bold shrink-0">
            {idx + 1}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-gray-900 dark:text-white">{m.name}</span>
              <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400">
                {m.paymentPercentage}% payment
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <Clock className="w-3 h-3 text-gray-400" />
              <span className="text-[10px] text-gray-500">{m.durationDays} days</span>
            </div>
            <div className="flex flex-wrap gap-1 mt-1.5">
              {m.deliverables.map((d, i) => (
                <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                  {d}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  </div>
);

const ResourceAllocation = ({ resources }: { resources: ResourceBreakdown[] }) => {
  const total = resources.reduce((sum, r) => sum + r.cost, 0);
  return (
    <div className="space-y-2.5">
      <h4 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-1.5">
        <Users className="w-4 h-4 text-purple-500" />
        Resource Allocation
      </h4>
      {resources.map((r) => (
        <div key={r.role} className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-700 dark:text-gray-300">{r.role}</span>
            <span className="font-mono font-bold text-gray-900 dark:text-white">${r.cost.toLocaleString()}</span>
          </div>
          <div className="h-1.5 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-purple-500"
              style={{ width: `${(r.cost / total) * 100}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] text-gray-500">
            <span>{r.hours}h @ ${r.rate}/h</span>
            <span>{Math.round((r.cost / total) * 100)}%</span>
          </div>
        </div>
      ))}
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const Services = () => {
  const { services } = usePortfolio();
  const { playClick, playHover, playSuccess } = useSound();

  const {
    projectType, setProjectType,
    selectedFeatures, setSelectedFeatures, toggleFeature,
    urgency, setUrgency,
    clientTier, setClientTier,
    clientName, setClientName,
    clientEmail, setClientEmail,
    clientNotes, setClientNotes,
    errors, setErrors,
    currentStep, setCurrentStep,
    savedQuotes,
    isSubmitting, setIsSubmitting,
    showBreakdown, setShowBreakdown,
    estimate,
    validate,
    saveQuote,
  } = useEstimatorState();

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

  // Smart feature recommendations based on project type
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

  const handleSubmitBrief = async (e: React.FormEvent) => {
    e.preventDefault();
    playClick();

    if (!validate()) {
      toast.error('Please fix the errors before submitting');
      return;
    }

    const quoteId = saveQuote();

    try {
      setIsSubmitting(true);

      const featureNames = selectedFeatures
        .map((fId) => FEATURE_CATALOG.find((o) => o.id === fId)?.label)
        .filter(Boolean)
        .join(', ');

      const briefMessage = `[Project Estimator Brief]\nClient: ${clientName}\nEmail: ${clientEmail}\nProject Type: ${BASE_PROJECTS[projectType].label}\nSelected Features: ${featureNames}\nTimeline Urgency: ${urgency.toUpperCase()}\nEstimated Range: ~$${estimate.cost.toLocaleString()} (~${estimate.weeks} weeks)\nClient Notes: ${clientNotes || 'None'}`;

      await contactAPI.sendMessage({
        name: clientName.trim(),
        email: clientEmail.trim(),
        subject: `Project Estimator Brief: ${BASE_PROJECTS[projectType].label}`,
        message: briefMessage,
        project_type: BASE_PROJECTS[projectType].label,
        estimated_budget: `~$${estimate.cost.toLocaleString()}`,
        source: 'estimator',
      });

      playSuccess();
      toast.success(
        <div className="space-y-1">
          <div className="font-bold">Quote Submitted Successfully!</div>
          <div className="text-xs opacity-90">Quote ID: {quoteId.slice(0, 8)}</div>
          <div className="text-xs opacity-75">Muhammad Ahmad will respond within 24 hours</div>
        </div>,
        { duration: 6000 }
      );

      // Reset form
      setClientName('');
      setClientEmail('');
      setClientNotes('');
      setSelectedFeatures(['auth', 'admin_panel', 'seo_analytics']);
      setCurrentStep(0);
    } catch {
      toast.error(
        <div className="space-y-1">
          <div className="font-bold">Submission Failed</div>
          <div className="text-xs">Saved locally. Please try again or contact directly.</div>
        </div>,
        { duration: 5000 }
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = ['Platform', 'Features', 'Timeline', 'Review'];

  return (
    <section
      id="services"
      className="min-h-screen py-16 sm:py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-gradient-to-b from-gray-100 via-gray-50 to-gray-100 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 transition-colors duration-300"
    >
      <div className="relative z-10 max-w-7xl mx-auto w-full space-y-10 sm:space-y-12">

        {/* Section Header */}
        <div className="text-center space-y-2.5">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-semibold text-blue-600 dark:text-blue-400 backdrop-blur-md"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Enterprise Engineering Solutions</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-2xl sm:text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent"
          >
            Services & Intelligent Scope Estimator
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed"
          >
            AI-assisted project scoping with real-time cost analytics, milestone generation,
            and resource allocation algorithms.
          </motion.p>
        </div>

        {/* Services Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {services.map((service: Service, index: number) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: Math.min(index * 0.05, 0.25) }}
            >
              <Tilt
                tiltMaxAngleX={6}
                tiltMaxAngleY={6}
                perspective={1000}
                scale={1.01}
                transitionSpeed={500}
                tiltEnable={typeof window !== 'undefined' ? window.innerWidth > 768 : true}
                className="h-full"
              >
                <div
                  onMouseEnter={playHover}
                  className="h-full p-6 sm:p-7 rounded-3xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200 dark:border-gray-800 hover:border-blue-500/50 shadow-xl flex flex-col justify-between space-y-5 transition-all group"
                >
                  <div className="space-y-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-purple-600 text-white flex items-center justify-center shadow-md shadow-blue-500/25 group-hover:scale-105 transition-transform">
                      {getIcon(service.icon)}
                    </div>

                    <h3 className="font-extrabold text-lg sm:text-xl text-gray-900 dark:text-white group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">
                      {service.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                      {service.description}
                    </p>

                    {service.features?.length > 0 && (
                      <div className="space-y-1.5 pt-2 border-t border-gray-100 dark:border-gray-800">
                        {service.features.map((feat: string, i: number) => (
                          <div key={i} className="flex items-start space-x-2 text-xs text-gray-700 dark:text-gray-300">
                            <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                            <span>{feat}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <div>
                      <div className="text-[9px] uppercase font-bold text-gray-400">Starting Rate</div>
                      <div className="font-extrabold text-sm sm:text-base text-blue-600 dark:text-blue-400">
                        ${service.starting_price || '$999'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[9px] uppercase font-bold text-gray-400">Est. Timeline</div>
                      <div className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                        {service.timeline_estimate || '2-4 weeks'}
                      </div>
                    </div>
                  </div>
                </div>
              </Tilt>
            </motion.div>
          ))}
        </div>

        {/* Interactive Estimator */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="p-5 sm:p-8 md:p-10 rounded-3xl bg-gradient-to-br from-white/95 via-blue-50/30 to-purple-50/20 dark:from-gray-900/95 dark:via-blue-950/20 dark:to-purple-950/20 backdrop-blur-2xl border border-gray-200 dark:border-gray-800 shadow-2xl space-y-6"
        >
          {/* Estimator Header with Live Pricing */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-5">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold">
                <Calculator className="w-3.5 h-3.5" />
                <span>AI-Powered Quote Engine v2.0</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white">
                Intelligent Project Estimator
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Dynamic pricing with complexity scoring, risk analysis, and ROI projection.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="p-4 rounded-2xl bg-gradient-to-tr from-blue-600 to-purple-600 text-white shadow-xl shadow-blue-500/20 text-center space-y-0.5 min-w-[160px]">
                <div className="text-[11px] font-medium text-blue-100 uppercase tracking-wider">Estimated Budget</div>
                <div className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  ~${estimate.cost.toLocaleString()}
                </div>
                <div className="text-xs text-blue-100 font-semibold">
                  {estimate.weeks} Weeks • Team of {estimate.teamSize}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg text-center space-y-0.5 min-w-[140px]">
                <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">3-Year ROI</div>
                <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                  ${estimate.roiProjection.threeYearValue.toLocaleString()}
                </div>
                <div className="text-[10px] text-gray-500">
                  Break-even: {estimate.roiProjection.breakEvenMonths}mo
                </div>
              </div>
            </div>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {steps.map((step, idx) => (
              <button
                key={step}
                onClick={() => setCurrentStep(idx)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${currentStep === idx
                  ? 'bg-blue-500 text-white shadow-md'
                  : currentStep > idx
                    ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                  }`}
              >
                {currentStep > idx ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
                {step}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Configuration Panel */}
            <div className="lg:col-span-7 space-y-5">
              <AnimatePresence mode="wait">
                {currentStep === 0 && (
                  <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        1. Select Platform / Project Type
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {Object.entries(BASE_PROJECTS).map(([key, item]) => (
                          <button
                            key={key}
                            type="button"
                            onClick={() => { playClick(); setProjectType(key as ProjectType); }}
                            className={`p-3 rounded-2xl border text-left transition-all ${projectType === key
                              ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/50 shadow-sm scale-[1.01]'
                              : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/40 hover:bg-gray-50 dark:hover:bg-gray-800'
                              }`}
                          >
                            <div className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white">{item.label}</div>
                            <div className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold mt-0.5">
                              Base: ${item.price.toLocaleString()} • {item.timeWeeks} wks
                            </div>
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {item.techStack.slice(0, 2).map(t => (
                                <span key={t} className="text-[9px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-500">{t}</span>
                              ))}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Client Tier (Affects Pricing)
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {Object.entries(CLIENT_TIER_DISCOUNTS).map(([tier, config]) => (
                          <button
                            key={tier}
                            type="button"
                            onClick={() => { playClick(); setClientTier(tier as ClientTier); }}
                            className={`p-2.5 rounded-xl border text-xs font-bold text-center transition-all ${clientTier === tier
                              ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-300'
                              : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/30 text-gray-600 dark:text-gray-400'
                              }`}
                          >
                            <div className="capitalize">{tier}</div>
                            <div className="text-[10px] font-normal text-gray-400 mt-0.5">
                              {config.discount > 0 ? `-${config.discount * 100}%` : config.discount < 0 ? `+${Math.abs(config.discount) * 100}%` : 'Standard'}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {currentStep === 1 && (
                  <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                          2. Required Architecture & Modules
                        </label>
                        <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">
                          {selectedFeatures.length} selected
                        </span>
                      </div>

                      {/* Smart Recommendations */}
                      <div className="p-2.5 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/30">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-blue-700 dark:text-blue-400 mb-1.5">
                          <Sparkles className="w-3 h-3" />
                          Recommended for {BASE_PROJECTS[projectType].label}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {recommendedFeatures.map(fid => {
                            const feat = FEATURE_CATALOG.find(f => f.id === fid);
                            const isSelected = selectedFeatures.includes(fid);
                            return (
                              <button
                                key={fid}
                                onClick={() => toggleFeature(fid)}
                                className={`text-[10px] px-2 py-1 rounded-full transition-all ${isSelected
                                  ? 'bg-blue-500 text-white'
                                  : 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                                  }`}
                              >
                                {isSelected ? '✓ ' : '+ '}{feat?.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {FEATURE_CATALOG.map((feat) => {
                          const isChecked = selectedFeatures.includes(feat.id);
                          const hasDependencyIssue = feat.dependencies?.some(dep => !selectedFeatures.includes(dep));
                          const hasIncompatible = feat.incompatibleWith?.some(inc => selectedFeatures.includes(inc));
                          const isDisabled = hasIncompatible || false;

                          return (
                            <button
                              key={feat.id}
                              type="button"
                              disabled={isDisabled}
                              onClick={() => !isDisabled && toggleFeature(feat.id)}
                              className={`flex flex-col p-2.5 rounded-xl border text-left transition-all ${isDisabled
                                ? 'opacity-40 cursor-not-allowed border-gray-200 dark:border-gray-800'
                                : isChecked
                                  ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 shadow-sm'
                                  : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/30 hover:bg-gray-50 dark:hover:bg-gray-800'
                                }`}
                            >
                              <div className="flex items-center justify-between w-full">
                                <span className={`text-xs font-semibold ${isChecked ? 'text-blue-600 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}`}>
                                  {feat.label}
                                </span>
                                <span className="text-[10px] font-bold text-gray-400 shrink-0">
                                  +${feat.cost}
                                </span>
                              </div>
                              <span className="text-[10px] text-gray-500 mt-0.5 line-clamp-1">{feat.description}</span>
                              {hasDependencyIssue && (
                                <span className="text-[9px] text-amber-600 mt-0.5 flex items-center gap-1">
                                  <AlertTriangle className="w-2.5 h-2.5" />
                                  Requires: {feat.dependencies?.map(d => FEATURE_CATALOG.find(f => f.id === d)?.label).join(', ')}
                                </span>
                              )}
                              <div className="flex items-center gap-1.5 mt-1.5">
                                <span className={`text-[9px] px-1.5 py-0.5 rounded ${feat.complexity === 'enterprise' ? 'bg-red-100 text-red-700' :
                                  feat.complexity === 'high' ? 'bg-orange-100 text-orange-700' :
                                    feat.complexity === 'medium' ? 'bg-amber-100 text-amber-700' :
                                      'bg-emerald-100 text-emerald-700'
                                  }`}>
                                  {feat.complexity}
                                </span>
                                <span className="text-[9px] text-gray-400 flex items-center gap-0.5">
                                  <Clock className="w-2.5 h-2.5" />
                                  {feat.days}d
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}

                {currentStep === 2 && (
                  <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        3. Timeline Urgency
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {Object.entries(URGENCY_MULTIPLIERS).map(([key, item]) => (
                          <button
                            key={key}
                            type="button"
                            onClick={() => { playClick(); setUrgency(key as UrgencyLevel); }}
                            className={`p-2.5 rounded-xl border text-xs font-bold text-center transition-all ${urgency === key
                              ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-300 shadow-sm'
                              : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/30 text-gray-600 dark:text-gray-400'
                              }`}
                          >
                            <div>{item.label.split('(')[0]}</div>
                            <div className="text-[10px] font-normal text-gray-400 mt-0.5">
                              {key === 'standard' ? 'Base rate' : item.label.match(/\(([^)]+)\)/)?.[0] || ''}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Live Analytics Preview */}
                    <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-800 space-y-3">
                      <h4 className="font-bold text-xs text-gray-900 dark:text-white flex items-center gap-1.5">
                        <BarChart3 className="w-3.5 h-3.5 text-blue-500" />
                        Project Analytics Preview
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <span className="text-[10px] text-gray-500">Complexity Score</span>
                          <ComplexityBadge score={estimate.complexityScore} />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] text-gray-500">Yearly Maintenance</span>
                          <div className="text-sm font-bold text-gray-900 dark:text-white">
                            ~${estimate.maintenanceYearly.toLocaleString()}/yr
                          </div>
                        </div>
                      </div>
                      <RiskIndicator score={estimate.riskScore} />
                    </div>
                  </motion.div>
                )}

                {currentStep === 3 && (
                  <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                    <form onSubmit={handleSubmitBrief} className="space-y-3.5">
                      <div className="space-y-0.5">
                        <h4 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-1.5">
                          <Send className="w-4 h-4 text-blue-500" />
                          Submit Project Brief
                        </h4>
                        <p className="text-[11px] text-gray-500">
                          Deliver this specification directly to Muhammad Ahmad's pipeline.
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
                            value={clientName}
                            onChange={(e) => { setClientName(e.target.value); setErrors(prev => prev.filter(err => err.field !== 'name')); }}
                            placeholder="e.g. David Harrison"
                            className={`w-full px-3 py-2 text-xs rounded-xl bg-gray-50 dark:bg-gray-800 border ${errors.some(e => e.field === 'name') ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 dark:border-gray-700 focus:ring-blue-500'
                              } text-gray-900 dark:text-white focus:ring-2 outline-none transition-all`}
                          />
                          {errors.some(e => e.field === 'name') && (
                            <span className="text-[10px] text-red-500 mt-0.5 block">{errors.find(e => e.field === 'name')?.message}</span>
                          )}
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                            Your Email Address *
                          </label>
                          <input aria-label="Your Email Address"
                            type="email"
                            required
                            value={clientEmail}
                            onChange={(e) => { setClientEmail(e.target.value); setErrors(prev => prev.filter(err => err.field !== 'email')); }}
                            placeholder="e.g. david@company.com"
                            className={`w-full px-3 py-2 text-xs rounded-xl bg-gray-50 dark:bg-gray-800 border ${errors.some(e => e.field === 'email') ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 dark:border-gray-700 focus:ring-blue-500'
                              } text-gray-900 dark:text-white focus:ring-2 outline-none transition-all`}
                          />
                          {errors.some(e => e.field === 'email') && (
                            <span className="text-[10px] text-red-500 mt-0.5 block">{errors.find(e => e.field === 'email')?.message}</span>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                          Project Notes & Goals (Optional)
                        </label>
                        <textarea aria-label="Project Notes & Goals (Optional)"
                          rows={3}
                          value={clientNotes}
                          onChange={(e) => setClientNotes(e.target.value)}
                          placeholder="Describe your vision, target audience, specific requirements, or deadlines..."
                          className="w-full px-3 py-2 text-xs rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                        />
                      </div>

                      {errors.some(e => e.field === 'features') && (
                        <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30">
                          <div className="flex items-start gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                            <div className="space-y-0.5">
                              <div className="text-[11px] font-bold text-red-700 dark:text-red-400">Feature Conflicts</div>
                              {errors.filter(e => e.field === 'features').map((e, i) => (
                                <div key={i} className="text-[10px] text-red-600 dark:text-red-400">{e.message}</div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-500/25 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 active:scale-95"
                      >
                        <span>{isSubmitting ? 'Processing...' : 'Submit Project Brief'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Navigation */}
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                  disabled={currentStep === 0}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white disabled:opacity-30 transition-all"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Back
                </button>

                <div className="flex items-center gap-2">
                  {currentStep < steps.length - 1 && (
                    <button
                      onClick={() => setCurrentStep(currentStep + 1)}
                      className="flex items-center gap-1 px-4 py-1.5 rounded-lg bg-blue-500 text-white text-xs font-bold hover:bg-blue-600 transition-all"
                    >
                      Next
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Right Panel — Live Breakdown */}
            <div className="lg:col-span-5 space-y-4">
              <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-purple-500" />
                    Estimate Breakdown
                  </h4>
                  <button
                    onClick={() => setShowBreakdown(!showBreakdown)}
                    className="text-[10px] font-bold text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    {showBreakdown ? 'Hide' : 'Show'} Details
                  </button>
                </div>
                {/* Summary Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/5 to-blue-600/5 border border-blue-200/50 dark:border-blue-800/30 text-center">
                    <Wallet className="w-4 h-4 text-blue-500 mx-auto mb-1" />
                    <div className="text-lg font-extrabold text-gray-900 dark:text-white">${estimate.cost.toLocaleString()}</div>
                    <div className="text-[9px] font-bold text-gray-400 uppercase">Total Budget</div>
                  </div>
                  <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/5 to-purple-600/5 border border-purple-200/50 dark:border-purple-800/30 text-center">
                    <Timer className="w-4 h-4 text-purple-500 mx-auto mb-1" />
                    <div className="text-lg font-extrabold text-gray-900 dark:text-white">{estimate.weeks}w</div>
                    <div className="text-[9px] font-bold text-gray-400 uppercase">Duration</div>
                  </div>
                  <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500/5 to-emerald-600/5 border border-emerald-200/50 dark:border-emerald-800/30 text-center">
                    <Users className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
                    <div className="text-lg font-extrabold text-gray-900 dark:text-white">{estimate.teamSize}</div>
                    <div className="text-[9px] font-bold text-gray-400 uppercase">Team Size</div>
                  </div>
                  <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/5 to-amber-600/5 border border-amber-200/50 dark:border-amber-800/30 text-center">
                    <Rocket className="w-4 h-4 text-amber-500 mx-auto mb-1" />
                    <div className="text-lg font-extrabold text-gray-900 dark:text-white">{estimate.roiProjection.efficiencyGain}%</div>
                    <div className="text-[9px] font-bold text-gray-400 uppercase">Efficiency Gain</div>
                  </div>
                </div>

                <AnimatePresence>
                  {showBreakdown && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-4 overflow-hidden"
                    >
                      <MilestoneTimeline milestones={estimate.milestones} />
                      <ResourceAllocation resources={estimate.resourceBreakdown} />

                      {/* Tech Stack */}
                      <div className="space-y-2">
                        <h4 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-1.5">
                          <Cpu className="w-4 h-4 text-cyan-500" />
                          Proposed Tech Stack
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {estimate.techStack.map((tech) => (
                            <span
                              key={tech}
                              className="text-[10px] px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold border border-gray-200 dark:border-gray-700"
                            >
                              {tech}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* ROI Card */}
                      <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-200 dark:border-emerald-900/30 space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                          <TrendingUp className="w-3.5 h-3.5" />
                          3-Year ROI Projection
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div>
                            <div className="text-sm font-extrabold text-gray-900 dark:text-white">${(estimate.roiProjection.threeYearValue / 1000).toFixed(0)}k</div>
                            <div className="text-[9px] text-gray-500">Total Value</div>
                          </div>
                          <div>
                            <div className="text-sm font-extrabold text-gray-900 dark:text-white">{estimate.roiProjection.breakEvenMonths}mo</div>
                            <div className="text-[9px] text-gray-500">Break Even</div>
                          </div>
                          <div>
                            <div className="text-sm font-extrabold text-gray-900 dark:text-white">{estimate.maintenanceYearly < 1000 ? `$${estimate.maintenanceYearly}` : `$${(estimate.maintenanceYearly / 1000).toFixed(1)}k`}</div>
                            <div className="text-[9px] text-gray-500">Yearly Maint.</div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Risk Warning for High Complexity */}
                {estimate.riskScore > 70 && (
                  <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-red-700 dark:text-red-400">High Complexity Alert</div>
                      <div className="text-[10px] text-red-600 dark:text-red-400 leading-relaxed">
                        This project configuration has a complexity score of {estimate.complexityScore}. Consider splitting into phases or reducing scope for optimal delivery.
                      </div>
                    </div>
                  </div>
                )}

                {/* Saved Quotes Mini-List */}
                {savedQuotes.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs text-gray-900 dark:text-white flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-gray-500" />
                        Saved Quotes ({savedQuotes.length})
                      </h4>
                    </div>
                    <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
                      {savedQuotes.slice(0, 5).map((quote) => (
                        <div
                          key={quote.id}
                          className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 flex items-center justify-between"
                        >
                          <div className="min-w-0">
                            <div className="text-[10px] font-bold text-gray-900 dark:text-white truncate">
                              {BASE_PROJECTS[quote.projectType].label}
                            </div>
                            <div className="text-[9px] text-gray-500">
                              ${quote.estimate.cost.toLocaleString()} • {quote.estimate.weeks}w
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className={`w-1.5 h-1.5 rounded-full ${quote.status === 'draft' ? 'bg-amber-400' :
                              quote.status === 'sent' ? 'bg-blue-400' :
                                quote.status === 'accepted' ? 'bg-emerald-400' : 'bg-red-400'
                              }`} />
                            <span className="text-[9px] text-gray-400 capitalize">{quote.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    playClick();
                    const quoteId = saveQuote();
                    toast.success(`Quote #${quoteId.slice(0, 8)} saved locally`);
                  }}
                  className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  Save Quote
                </button>
                <button
                  onClick={() => {
                    playClick();
                    const shareData = {
                      title: 'Project Estimate',
                      text: `Project Estimate: ${BASE_PROJECTS[projectType].label} - $${estimate.cost.toLocaleString()} (${estimate.weeks} weeks)`,
                      url: window.location.href,
                    };
                    if (navigator.share) {
                      navigator.share(shareData).catch(() => {
                        navigator.clipboard.writeText(shareData.text);
                        toast.success('Estimate copied to clipboard');
                      });
                    } else {
                      navigator.clipboard.writeText(shareData.text);
                      toast.success('Estimate copied to clipboard');
                    }
                  }}
                  className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  Share
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Trust Indicators */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {[
            { icon: Shield, label: 'NDA Protected', desc: 'All briefs confidential' },
            { icon: Clock, label: '24h Response', desc: 'Guaranteed reply time' },
            { icon: CheckCircle2, label: 'Milestone Payments', desc: 'Pay per deliverable' },
            { icon: Lock, label: 'Source Code Ownership', desc: 'You own everything' },
          ].map((item) => (
            <div
              key={item.label}
              className="p-4 rounded-2xl bg-white/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 backdrop-blur-sm flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <item.icon className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-gray-900 dark:text-white">{item.label}</div>
                <div className="text-[10px] text-gray-500">{item.desc}</div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* CSS for custom scrollbar */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(156, 163, 175, 0.5);
          border-radius: 999px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(156, 163, 175, 0.8);
        }
      `}</style>
    </section>
  );
};

export default Services;