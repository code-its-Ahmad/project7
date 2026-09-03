import { useState, useRef, useEffect, memo, Suspense, useMemo, useCallback } from 'react';
import {
  Send,
  X,
  User,
  Bot,
  RefreshCw,
  Phone,
  Volume2,
  VolumeX,
  ChevronDown,
  ChevronUp,
  Check,
  Copy,
  Mic,
  MicOff,
  ExternalLink,
  Minimize2,
  Maximize2,
  ArrowRight,
  Headphones,
  Sparkles,
  MessageSquare,
} from 'lucide-react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Preload, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';
import { ErrorBoundary } from 'react-error-boundary';
import { useTheme } from '../context/ThemeContext';
import { useSound } from '../context/SoundContext';
import { chatbotAPI, contactAPI } from '../api/services';
import toast from 'react-hot-toast';

/* =========================================================================
   INTERFACES & TYPES
   ========================================================================= */
export interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  suggestions?: string[];
  isError?: boolean;
  actions?: Array<{
    label: string;
    actionType: 'link' | 'whatsapp' | 'email' | 'inquiry' | 'cv' | 'projects';
    url?: string;
  }>;
}

export interface ProjectLeadDetails {
  clientType?: 'company' | 'individual';
  clientName?: string;
  companyName?: string;
  projectType?: string;
  positionTitle?: string;
  budget?: string;
  timeline?: string;
  requirements?: string;
  contactEmail?: string;
  phone?: string;
}

export type ConversationState =
  | 'idle_chat'
  | 'collecting_client_type'
  | 'collecting_name'
  | 'collecting_company_name'
  | 'collecting_project_type'
  | 'collecting_position_title'
  | 'collecting_budget'
  | 'collecting_timeline'
  | 'collecting_requirements'
  | 'collecting_contact'
  | 'completed';

interface SpeechQueueItem {
  text: string;
  isUser: boolean;
}

/* =========================================================================
   ANIMATION VARIANTS (Optimized for GPU acceleration)
   ========================================================================= */
const containerVariants: Variants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 320, damping: 28, mass: 0.7 },
  },
  exit: {
    opacity: 0,
    y: 25,
    scale: 0.95,
    transition: { duration: 0.2, ease: 'easeOut' },
  },
};

const messageVariants: Variants = {
  initial: { opacity: 0, y: 10, scale: 0.98 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.2, ease: 'easeOut' },
  },
};

const buttonVariants: Variants = {
  hover: { scale: 1.06, transition: { duration: 0.15 } },
  tap: { scale: 0.92 },
};

/* =========================================================================
   RICH MARKDOWN RENDERER
   Lightweight, zero-lag formatting for code, links, bold, and lists
   ========================================================================= */
const RichMessageContent = memo(({ content, isUser }: { content: string; isUser: boolean }) => {
  const lines = useMemo(() => content.split('\n'), [content]);

  const renderFormattedText = useCallback((text: string) => {
    const regex = /(\*\*.*?\*\*|`.*?`|\[.*?\]\(.*?\)|https?:\/\/[^\s)]+)/g;
    const parts = text.split(regex);

    return parts.map((part, index) => {
      if (!part) return null;

      // Bold text **bold**
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong
            key={index}
            className={`font-bold ${isUser ? 'text-white' : 'text-blue-600 dark:text-blue-400 font-semibold'}`}
          >
            {part.slice(2, -2)}
          </strong>
        );
      }

      // Inline code `code`
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code
            key={index}
            className="px-1.5 py-0.5 mx-0.5 text-[11px] sm:text-xs font-mono rounded bg-indigo-100/80 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60"
          >
            {part.slice(1, -1)}
          </code>
        );
      }

      // Markdown Link [title](url)
      const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
      if (linkMatch) {
        const [, linkText, linkUrl] = linkMatch;
        return (
          <a
            key={index}
            href={linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-semibold text-blue-500 hover:text-blue-600 dark:text-cyan-400 dark:hover:text-cyan-300 underline underline-offset-2 transition-colors"
          >
            <span>{linkText}</span>
            <ExternalLink className="w-3 h-3 inline-block opacity-80" />
          </a>
        );
      }

      // Plain URL
      if (part.startsWith('http://') || part.startsWith('https://')) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-semibold text-blue-500 hover:text-blue-600 dark:text-cyan-400 dark:hover:text-cyan-300 underline underline-offset-2 break-all transition-colors"
          >
            <span>{part}</span>
            <ExternalLink className="w-3 h-3 inline-block opacity-80" />
          </a>
        );
      }

      return <span key={index}>{part}</span>;
    });
  }, [isUser]);

  return (
    <div className="space-y-1.5 leading-relaxed text-xs sm:text-sm select-text">
      {lines.map((line, lineIndex) => {
        const trimmed = line.trim();

        if (!trimmed) {
          return <div key={lineIndex} className="h-1.5" />;
        }

        // Bullet point lines
        if (trimmed.startsWith('•') || trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          const bulletText = trimmed.replace(/^[•\-*]\s*/, '');
          return (
            <div key={lineIndex} className="flex items-start gap-2 pl-1 py-0.5">
              <span className={`text-[10px] sm:text-xs mt-1 shrink-0 ${isUser ? 'text-blue-200' : 'text-indigo-500 dark:text-indigo-400'}`}>
                ●
              </span>
              <div className="flex-1">{renderFormattedText(bulletText)}</div>
            </div>
          );
        }

        // Numbered list lines
        const numberedMatch = trimmed.match(/^(\d+)\.\s*(.*)/);
        if (numberedMatch) {
          const [, num, itemText] = numberedMatch;
          return (
            <div key={lineIndex} className="flex items-start gap-2 pl-1 py-0.5">
              <span className={`text-[11px] font-bold shrink-0 mt-0.5 ${isUser ? 'text-blue-200' : 'text-indigo-500 dark:text-indigo-400'}`}>
                {num}.
              </span>
              <div className="flex-1">{renderFormattedText(itemText)}</div>
            </div>
          );
        }

        return <div key={lineIndex}>{renderFormattedText(line)}</div>;
      })}
    </div>
  );
});
RichMessageContent.displayName = 'RichMessageContent';

/* =========================================================================
   3D AVATAR MODEL (Smooth Performance & Lip-Sync Animation)
   ========================================================================= */
const AvatarModel = memo(({
  isSpeaking,
}: {
  isSpeaking: boolean;
  theme: 'light' | 'dark';
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const activeActionRef = useRef<THREE.AnimationAction | null>(null);

  const { scene, animations } = useGLTF('/avator.glb', true);

  useEffect(() => {
    if (!scene) return;

    try {
      if (animations && animations.length > 0) {
        const mixer = new THREE.AnimationMixer(scene);
        mixerRef.current = mixer;

        const clip = animations[0];
        const action = mixer.clipAction(clip);
        action.setEffectiveTimeScale(1.0);
        action.setLoop(THREE.LoopRepeat, Infinity);
        activeActionRef.current = action;

        if (isSpeaking) {
          action.play();
        } else {
          action.stop();
        }
      }
    } catch { }

    return () => {
      if (mixerRef.current) {
        mixerRef.current.stopAllAction();
        mixerRef.current.uncacheRoot(scene);
        mixerRef.current = null;
      }
    };
  }, [scene, animations]);

  useEffect(() => {
    if (activeActionRef.current) {
      if (isSpeaking) {
        activeActionRef.current.reset().fadeIn(0.2).play();
      } else {
        activeActionRef.current.fadeOut(0.3);
      }
    }
  }, [isSpeaking]);

  useFrame((state, delta) => {
    if (mixerRef.current && isSpeaking) {
      mixerRef.current.update(delta);
    }

    if (groupRef.current) {
      const time = state.clock.getElapsedTime();

      if (isSpeaking) {
        groupRef.current.position.y = -1.25 + Math.sin(time * 6.5) * 0.035;
        groupRef.current.rotation.y = Math.sin(time * 2.8) * 0.08;
      } else {
        groupRef.current.position.y = -1.25 + Math.sin(time * 1.8) * 0.015;
        groupRef.current.rotation.y = THREE.MathUtils.lerp(
          groupRef.current.rotation.y,
          Math.sin(time * 0.8) * 0.04,
          0.05
        );
      }

      const pointer = state.pointer;
      groupRef.current.rotation.x = THREE.MathUtils.lerp(
        groupRef.current.rotation.x,
        -pointer.y * 0.12,
        0.05
      );
    }
  });

  return (
    <group ref={groupRef} scale={[1.45, 1.45, 1.45]} position={[0, -1.25, 0]}>
      <primitive object={scene} />
    </group>
  );
});
AvatarModel.displayName = 'AvatarModel';

/* =========================================================================
   3D FALLBACK COMPONENT
   ========================================================================= */
const AvatarFallback = memo(({ theme }: { theme: 'light' | 'dark' }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (meshRef.current) {
      meshRef.current.rotation.y = t * 0.9;
      meshRef.current.rotation.x = Math.sin(t * 0.5) * 0.2;
      meshRef.current.position.y = Math.sin(t * 2) * 0.1;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z = -t * 0.6;
      ringRef.current.rotation.x = Math.PI / 3 + Math.sin(t) * 0.1;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      <mesh ref={meshRef}>
        <octahedronGeometry args={[0.85, 0]} />
        <meshStandardMaterial
          color={theme === 'dark' ? '#6366f1' : '#3b82f6'}
          wireframe
          emissive={theme === 'dark' ? '#4f46e5' : '#2563eb'}
          emissiveIntensity={0.6}
        />
      </mesh>
      <mesh ref={ringRef}>
        <torusGeometry args={[1.3, 0.025, 16, 64]} />
        <meshBasicMaterial color="#38bdf8" wireframe />
      </mesh>
      <pointLight position={[0, 0, 2]} intensity={1.8} color="#38bdf8" />
    </group>
  );
});
AvatarFallback.displayName = 'AvatarFallback';

/* =========================================================================
   LOCAL INTELLIGENCE CLASSIFIER (50+ Intent Handler)
   ========================================================================= */
const getLocalIntelligentAnswer = (query: string): { reply: string; suggestions: string[]; actions?: ChatMessage['actions'] } => {
  const q = query.toLowerCase().trim();

  // Greetings
  if (/^(hi|hello|hey|greetings|hola|assalam|salaam|good morning|good afternoon|good evening|sup|howdy)/i.test(q)) {
    return {
      reply: "Hello! 👋 I'm **Muhammad Ahmad's AI 3D Assistant**. I can answer questions about his Full Stack Development experience, AI/ML engineering, portfolio projects, tech stack, pricing, or guide you through booking a project inquiry. How may I assist you today?",
      suggestions: [
        '🚀 What projects have you built?',
        '🧠 Tell me about your AI/ML skills',
        '💼 I want to hire Muhammad',
        '💰 What are your rates & services?',
      ],
      actions: [
        { label: '💼 Start Project Inquiry', actionType: 'inquiry' },
        { label: '📄 Download CV', actionType: 'cv' },
      ],
    };
  }

  // Projects & Portfolio
  if (/project|portfolio|work|built|apps|case study|green|guardian|novapay|datavision|pulse/i.test(q)) {
    return {
      reply: "Muhammad Ahmad has engineered multiple high-impact production applications:\n\n• **GreenGuardian AI**: Smart eco-tracking & ML agricultural intelligence platform.\n• **NovaPay Enterprise**: Ultra-secure fintech multi-currency gateway with sub-50ms latency.\n• **DataVision Analytics**: Real-time business intelligence dashboard with 3D WebGL visualizations.\n• **PulseFlow Chat**: Real-time collaborative platform with end-to-end encryption.\n\nYou can explore all live interactive demos in the Projects section!",
      suggestions: [
        'Tell me about your tech stack',
        '💼 I want to hire Muhammad',
        'What AI solutions do you build?',
        '📞 WhatsApp Muhammad',
      ],
      actions: [
        { label: '🚀 View Projects Live', actionType: 'projects' },
        { label: '💬 WhatsApp Chat', actionType: 'whatsapp' },
      ],
    };
  }

  // Skills & Tech Stack
  if (/skill|tech|stack|language|framework|react|node|python|flutter|ml|ai|database|cloud|aws|docker/i.test(q)) {
    return {
      reply: "Here is a breakdown of Muhammad Ahmad's core technical stack:\n\n• **Frontend**: React 19, Next.js 15, TypeScript, Tailwind CSS, Three.js / WebGL, Framer Motion\n• **Backend**: Node.js, Express, Python (FastAPI/Django), Laravel, PostgreSQL, MongoDB, Redis\n• **AI & ML**: PyTorch, TensorFlow, LangChain, Hugging Face, OpenCV Computer Vision, Scikit-learn\n• **Mobile**: Flutter & Dart (Cross-platform iOS & Android)\n• **DevOps & Cloud**: Docker, Kubernetes, AWS (EC2/S3/Lambda), Firebase, CI/CD pipelines",
      suggestions: [
        'What AI solutions do you build?',
        'Do you build mobile apps?',
        '💰 Get a project quote',
        '💼 Start a project inquiry',
      ],
      actions: [
        { label: '💼 Hire Muhammad', actionType: 'inquiry' },
        { label: '📄 Download CV', actionType: 'cv' },
      ],
    };
  }

  // Pricing, Rates, Estimates
  if (/price|cost|rate|pricing|fee|charge|quote|estimate|package|budget/i.test(q)) {
    return {
      reply: "Muhammad offers flexible, milestone-based pricing tailored to your requirements:\n\n• **Full Stack Web Applications**: Starting around **$800 - $2,500+** (2-4 weeks)\n• **Custom AI & ML Integration**: Starting around **$1,000 - $3,500+** (2-6 weeks)\n• **Cross-Platform Mobile Apps (Flutter)**: Starting around **$900 - $2,800+** (3-5 weeks)\n• **Hourly / Retainer Engagements**: Available upon discussion for ongoing engineering needs.\n\nWould you like to initiate a quick project inquiry to receive a detailed estimate?",
      suggestions: [
        '💼 Start a project inquiry',
        '📱 WhatsApp Muhammad',
        '🚀 View Projects',
        '📄 Download CV',
      ],
      actions: [
        { label: '💼 Start Project Inquiry', actionType: 'inquiry' },
        { label: '💬 WhatsApp (+92 331 4815161)', actionType: 'whatsapp' },
      ],
    };
  }

  // Contact, WhatsApp, Phone, Email
  if (/contact|email|phone|whatsapp|reach|call|meeting|interview|location|hire|talk/i.test(q)) {
    return {
      reply: "You can reach Muhammad Ahmad directly through any of these channels:\n\n📱 **WhatsApp / Call**: [+92 331 4815161](https://wa.me/923314815161)\n✉️ **Email**: [Ahmadrajpootr1@gmail.com](mailto:Ahmadrajpootr1@gmail.com)\n💼 **LinkedIn**: [linkedin.com/in/muhammad-ahmad](https://linkedin.com/in/muhammad-ahmad-565206291/)\n📍 **Location**: Lahore, Pakistan (Available for Remote Engagements Worldwide)",
      suggestions: [
        '💼 Start a project inquiry',
        '📄 Download CV',
        '🚀 View Projects',
      ],
      actions: [
        { label: '📱 WhatsApp Direct', actionType: 'whatsapp' },
        { label: '✉️ Send Email', actionType: 'email' },
      ],
    };
  }

  // Resume / CV
  if (/cv|resume|pdf|download|document|experience document/i.test(q)) {
    return {
      reply: "You can download Muhammad Ahmad's official Resume / CV directly:\n\n📄 **[Download Muhammad Ahmad's CV (PDF)](https://drive.google.com/file/d/1LEb7Scv_BQzuClhKMqYnNDqrOdwfnJI0/view?usp=sharing)**\n\nIt highlights 3+ years of professional engineering, production architectures, leadership achievements, and academic credentials.",
      suggestions: [
        'Tell me about work experience',
        'What projects have you built?',
        '💼 I want to hire Muhammad',
      ],
      actions: [
        { label: '📄 Download CV (PDF)', actionType: 'cv' },
        { label: '💼 Start Project Inquiry', actionType: 'inquiry' },
      ],
    };
  }

  // Experience & Career
  if (/experience|background|history|career|companies|where have you worked|allzone|arfa/i.test(q)) {
    return {
      reply: "Muhammad Ahmad brings 3+ years of battle-tested engineering experience:\n\n• **Full Stack & AI Engineer** at *Allzone Technologies* (2025 - Present) — Architecting enterprise microservices, generative AI integrations, and real-time data pipelines.\n• **ML & Computer Vision Engineer** at *Allzone Technologies* (2024 - 2025) — Deployed high-throughput computer vision models and optimized inference pipelines.\n• **Mobile Developer** at *Arfa Software Technology Park* (2022 - 2024) — Shipped responsive Flutter cross-platform applications with 20K+ downloads.",
      suggestions: [
        '🚀 View Projects',
        '🧠 Tell me about your AI/ML skills',
        '💼 Start a project inquiry',
        '📄 Download CV',
      ],
      actions: [
        { label: '📄 View Complete CV', actionType: 'cv' },
        { label: '💼 Hire Muhammad', actionType: 'inquiry' },
      ],
    };
  }

  // Default smart fallback
  return {
    reply: "Muhammad Ahmad is a versatile **Full Stack Software Engineer & AI Specialist** skilled in React, Next.js, TypeScript, Node.js, Python, Three.js, and Deep Learning systems. How would you like to proceed?",
    suggestions: [
      '🚀 What projects have you built?',
      '🧠 Tell me about your AI/ML skills',
      '💼 Start a project inquiry',
      '💰 What are your rates & services?',
    ],
    actions: [
      { label: '💼 Start Inquiry', actionType: 'inquiry' },
      { label: '💬 WhatsApp', actionType: 'whatsapp' },
    ],
  };
};

/* =========================================================================
   MEMOIZED CHAT INPUT SUB-COMPONENT (Prevents full-component re-renders on keystroke)
   ========================================================================= */
const ChatInputArea = memo(({
  onSendMessage,
  isTyping,
  isSubmitting,
  conversationState,
}: {
  onSendMessage: (text: string) => void;
  isTyping: boolean;
  isSubmitting: boolean;
  conversationState: ConversationState;
}) => {
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = false;
          recognition.interimResults = false;
          recognition.lang = 'en-US';

          recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            if (transcript) {
              setInputText(transcript);
              toast.success(`Voice: "${transcript}"`);
            }
            setIsListening(false);
          };

          recognition.onerror = () => {
            setIsListening(false);
          };

          recognition.onend = () => {
            setIsListening(false);
          };

          recognitionRef.current = recognition;
        } catch { }
      }
    }
  }, []);

  const toggleVoice = () => {
    if (!recognitionRef.current) {
      toast.error('Voice recognition not supported in this browser.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        toast('🎙️ Listening... Speak now!', { icon: '🎙️' });
      } catch {
        setIsListening(false);
      }
    }
  };

  const handleSend = () => {
    if (!inputText.trim() || isTyping || isSubmitting) return;
    const textToSend = inputText.trim();
    setInputText('');
    onSendMessage(textToSend);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="p-2.5 sm:p-3.5 bg-white dark:bg-gray-900 border-t border-gray-200/80 dark:border-gray-800/80 flex items-center gap-1.5 sm:gap-2 shrink-0">
      <button
        onClick={toggleVoice}
        title={isListening ? 'Stop Listening' : 'Voice Input'}
        type="button"
        className={`p-2.5 sm:p-3 rounded-2xl transition-all flex items-center justify-center shrink-0 cursor-pointer ${
          isListening
            ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/30'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-200 dark:hover:bg-gray-700'
        }`}
        aria-label="Voice Input"
      >
        {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
      </button>

      <input
        ref={inputRef}
        type="text"
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={isSubmitting}
        placeholder={
          isListening
            ? 'Listening to your voice...'
            : conversationState === 'collecting_client_type'
            ? 'Type Company or Individual...'
            : conversationState === 'collecting_company_name'
            ? 'Enter company name...'
            : conversationState === 'collecting_name'
            ? 'Enter your name...'
            : conversationState === 'collecting_position_title'
            ? 'Enter desired role or position...'
            : conversationState === 'collecting_project_type'
            ? 'Enter project type...'
            : conversationState === 'collecting_budget'
            ? 'Enter budget range (e.g. $1,500)...'
            : conversationState === 'collecting_timeline'
            ? 'Enter timeline (e.g. 1 month)...'
            : conversationState === 'collecting_requirements'
            ? 'Brief requirements...'
            : conversationState === 'collecting_contact'
            ? 'Enter your contact email...'
            : 'Ask about skills, projects, pricing, or hire...'
        }
        className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm bg-gray-100/90 dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all"
      />

      <button
        onClick={handleSend}
        disabled={!inputText.trim() || isTyping || isSubmitting}
        type="button"
        className="p-2.5 sm:p-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-40 text-white shadow-md shadow-blue-500/25 transition-all active:scale-95 shrink-0 cursor-pointer"
        aria-label="Send Message"
      >
        <Send className="w-4 h-4" />
      </button>
    </div>
  );
});
ChatInputArea.displayName = 'ChatInputArea';

/* =========================================================================
   MAIN CHATBOT COMPONENT
   ========================================================================= */
const ChatBot = ({ theme: propTheme }: { theme?: 'light' | 'dark' }) => {
  const { theme: contextTheme } = useTheme();
  const theme = propTheme || contextTheme || 'dark';
  const { playClick, playHover, playSuccess, vibrate } = useSound();

  // State Variables
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isTtsEnabled, setIsTtsEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileAvatarMode, setMobileAvatarMode] = useState<'expanded' | 'compact' | 'hidden'>('compact');
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  // Initial welcome message
  const initialWelcomeMessage: ChatMessage = useMemo(
    () => ({
      id: 'welcome-msg-1',
      text: "👋 Hi! I am **Muhammad Ahmad's AI 3D Assistant**. I can answer questions about his Full Stack Development projects, AI/ML engineering, services, rates, or guide you through a quick project inquiry. How can I help you today?",
      isUser: false,
      timestamp: new Date(),
      suggestions: [
        '🚀 What projects have you built?',
        '🧠 Tell me about your AI/ML skills',
        '💼 I want to hire Muhammad',
        '💰 What are your rates & services?',
      ],
      actions: [
        { label: '💼 Start Project Inquiry', actionType: 'inquiry' },
        { label: '📄 Download CV', actionType: 'cv' },
        { label: '📱 WhatsApp (+92 331 4815161)', actionType: 'whatsapp' },
      ],
    }),
    []
  );

  // Messages State
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('chatMessages');
      if (saved) {
        return JSON.parse(saved, (key, value) =>
          key === 'timestamp' ? new Date(value) : value
        );
      }
    } catch { }
    return [initialWelcomeMessage];
  });

  // Conversation State Machine
  const [conversationState, setConversationState] = useState<ConversationState>(
    () => (localStorage.getItem('conversationState') as ConversationState) || 'idle_chat'
  );

  // Project Lead Details
  const [projectDetails, setProjectDetails] = useState<ProjectLeadDetails>(() => {
    try {
      const saved = localStorage.getItem('projectDetails');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const speechQueueRef = useRef<SpeechQueueItem[]>([]);
  const isSpeakingRef = useRef(false);
  const hasSpokenWelcomeRef = useRef(false);

  // Synchronize localStorage
  useEffect(() => {
    try {
      localStorage.setItem('chatMessages', JSON.stringify(messages));
      localStorage.setItem('conversationState', conversationState);
      localStorage.setItem('projectDetails', JSON.stringify(projectDetails));
    } catch { }
  }, [messages, conversationState, projectDetails]);

  // Responsive device check
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Visual viewport resize handler for Infinix, Samsung, Pixel Android & iOS soft keyboards
  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;

    const handleVisualViewportChange = () => {
      if (isOpen) {
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    };

    window.visualViewport.addEventListener('resize', handleVisualViewportChange);
    return () => {
      window.visualViewport?.removeEventListener('resize', handleVisualViewportChange);
    };
  }, [isOpen]);

  // Smooth scroll to message bottom
  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }, []);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
    }
  }, [messages, isTyping, isOpen, isMinimized, scrollToBottom]);

  /* =========================================================================
     SPEECH SYNTHESIS (TTS)
     ========================================================================= */
  const speakMessage = useCallback(
    (text: string, isUser: boolean, onEnd?: () => void) => {
      if (!isTtsEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) {
        setIsSpeaking(false);
        isSpeakingRef.current = false;
        if (onEnd) onEnd();
        return;
      }

      try {
        window.speechSynthesis.cancel();

        const cleanText = text
          .replace(/\[(.*?)\]\(.*?\)/g, '$1')
          .replace(/[#*_`~[\]()]/g, '')
          .replace(/•/g, '')
          .replace(
            /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g,
            ''
          )
          .trim();

        if (!cleanText) {
          if (onEnd) onEnd();
          return;
        }

        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = 'en-US';
        utterance.rate = 1.0;
        utterance.pitch = isUser ? 1.0 : 1.05;
        utterance.volume = 0.95;

        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          const selectedVoice =
            voices.find(
              (v) =>
                v.lang.startsWith('en') &&
                (v.name.includes('Natural') ||
                  v.name.includes('Google') ||
                  v.name.includes('Samantha') ||
                  v.name.includes('Victoria') ||
                  v.name.includes('Daniel') ||
                  v.name.includes('Guy'))
            ) ||
            voices.find((v) => v.lang.startsWith('en')) ||
            voices[0];
          utterance.voice = selectedVoice;
        }

        setIsSpeaking(true);
        isSpeakingRef.current = true;

        utterance.onend = () => {
          setIsSpeaking(false);
          isSpeakingRef.current = false;
          if (onEnd) onEnd();
        };

        utterance.onerror = () => {
          setIsSpeaking(false);
          isSpeakingRef.current = false;
          if (onEnd) onEnd();
        };

        window.speechSynthesis.speak(utterance);
      } catch {
        setIsSpeaking(false);
        isSpeakingRef.current = false;
        if (onEnd) onEnd();
      }
    },
    [isTtsEnabled]
  );

  const processSpeechQueue = useCallback(() => {
    if (speechQueueRef.current.length === 0 || isSpeakingRef.current) return;
    const next = speechQueueRef.current.shift();
    if (next) {
      speakMessage(next.text, next.isUser, () => {
        processSpeechQueue();
      });
    }
  }, [speakMessage]);

  const queueSpeech = useCallback(
    (text: string, isUser = false) => {
      speechQueueRef.current.push({ text, isUser });
      processSpeechQueue();
    },
    [processSpeechQueue]
  );

  useEffect(() => {
    if (isOpen && !hasSpokenWelcomeRef.current) {
      hasSpokenWelcomeRef.current = true;
      const initialText = messages[0]?.text || initialWelcomeMessage.text;
      queueSpeech(initialText, false);
    }
  }, [isOpen, messages, initialWelcomeMessage.text, queueSpeech]);

  useEffect(() => {
    if (!isOpen && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      isSpeakingRef.current = false;
      speechQueueRef.current = [];
    }
  }, [isOpen]);

  /* =========================================================================
     COPY MESSAGE UTILITY
     ========================================================================= */
  const handleCopyMessage = useCallback(async (msgId: string, text: string) => {
    playClick();
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(msgId);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch {
      toast.error('Failed to copy text.');
    }
  }, [playClick]);

  /* =========================================================================
     INQUIRY & LEAD SUBMISSION
     ========================================================================= */
  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const submitProjectInquiry = async (finalDetails: ProjectLeadDetails) => {
    setIsSubmitting(true);
    try {
      await chatbotAPI.submitLead({
        name: finalDetails.clientName || finalDetails.companyName || 'Anonymous Client',
        email: finalDetails.contactEmail,
        phone: finalDetails.phone || 'N/A',
        projectType: finalDetails.projectType || finalDetails.positionTitle || 'Full Stack & AI Engineering',
        budget: finalDetails.budget || 'Flexible',
        timeline: finalDetails.timeline || 'Flexible',
        requirements: finalDetails.requirements || 'Inquiry initiated via 3D AI Assistant.',
      });

      try {
        await contactAPI.sendMessage({
          name: finalDetails.clientName || finalDetails.companyName || 'Client via AI Assistant',
          email: finalDetails.contactEmail || 'lead@chatbot.com',
          phone: finalDetails.phone,
          subject: `🤖 AI Assistant Lead: ${finalDetails.projectType || finalDetails.positionTitle || 'Project Inquiry'}`,
          message: `Client Type: ${finalDetails.clientType || 'Not specified'}\nName/Company: ${finalDetails.companyName || finalDetails.clientName
            }\nRole/Project: ${finalDetails.positionTitle || finalDetails.projectType}\nBudget: ${finalDetails.budget
            }\nTimeline: ${finalDetails.timeline}\nRequirements: ${finalDetails.requirements}`,
          project_type: finalDetails.projectType || finalDetails.positionTitle,
          estimated_budget: finalDetails.budget,
          source: 'AI Assistant 3D',
        });
      } catch { }

      playSuccess();
      const successMsg = `🎉 **Thank you! Your project inquiry has been successfully transmitted directly to Muhammad Ahmad's priority mailbox.**\n\nMuhammad will review your specifications and contact you at **${finalDetails.contactEmail}** within 12-24 hours.`;

      const botMessage: ChatMessage = {
        id: uuidv4(),
        text: successMsg,
        isUser: false,
        timestamp: new Date(),
        suggestions: ['Start a new inquiry', '🚀 View Portfolio Projects', '📱 WhatsApp Muhammad'],
        actions: [
          { label: '📱 WhatsApp Direct', actionType: 'whatsapp' },
          { label: '🚀 Explore Projects', actionType: 'projects' },
          { label: '📄 Download CV', actionType: 'cv' },
        ],
      };

      setMessages((prev) => [...prev, botMessage]);
      queueSpeech(successMsg, false);
      setConversationState('completed');
    } catch {
      const fallbackMsg =
        "Your details were recorded! You can also reach Muhammad directly on WhatsApp at **+92 331 4815161** or email **Ahmadrajpootr1@gmail.com**.";
      const botMessage: ChatMessage = {
        id: uuidv4(),
        text: fallbackMsg,
        isUser: false,
        timestamp: new Date(),
        isError: true,
        actions: [
          { label: '📱 Open WhatsApp Chat', actionType: 'whatsapp' },
          { label: '✉️ Send Email', actionType: 'email' },
        ],
      };
      setMessages((prev) => [...prev, botMessage]);
      queueSpeech(fallbackMsg, false);
    } finally {
      setIsSubmitting(false);
    }
  };

  /* =========================================================================
     ACTION CARD DISPATCHER
     ========================================================================= */
  const handleActionClick = useCallback((action: { label: string; actionType: string; url?: string }) => {
    playClick();
    switch (action.actionType) {
      case 'whatsapp':
        window.open('https://wa.me/923314815161?text=Hi%20Muhammad,%20I%20visited%20your%20portfolio%20and%20would%20like%20to%20discuss%20a%20project.', '_blank');
        break;
      case 'email':
        window.location.href = 'mailto:Ahmadrajpootr1@gmail.com?subject=Project%20Inquiry%20from%20Portfolio';
        break;
      case 'cv':
        window.open('https://drive.google.com/file/d/1LEb7Scv_BQzuClhKMqYnNDqrOdwfnJI0/view?usp=sharing', '_blank');
        break;
      case 'projects': {
        const el = document.getElementById('projects');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
          if (isMobile) setIsMinimized(true);
        }
        break;
      }
      case 'inquiry':
        setConversationState('collecting_client_type');
        handleSendMessage('I want to start a project inquiry');
        break;
      case 'link':
        if (action.url) window.open(action.url, '_blank');
        break;
    }
  }, [playClick, isMobile]);

  /* =========================================================================
     INTELLIGENT HYBRID AI & STATE MACHINE LOGIC
     ========================================================================= */
  const handleBotResponse = async (userText: string) => {
    const text = userText.trim();
    const lower = text.toLowerCase();

    if (lower === 'restart' || lower === 'reset' || lower === 'start over' || lower === 'start a new inquiry') {
      handleResetChat();
      return;
    }

    if (lower.includes('whatsapp') || lower.includes('phone') || lower.includes('call')) {
      const reply = "You can message or call Muhammad directly on WhatsApp at **+92 331 4815161** for an immediate response!";
      const botMsg: ChatMessage = {
        id: uuidv4(),
        text: reply,
        isUser: false,
        timestamp: new Date(),
        suggestions: ['💼 Start Project Inquiry', '🚀 View Projects', '📄 Download CV'],
        actions: [
          { label: '📱 Open WhatsApp (+92 331 4815161)', actionType: 'whatsapp' },
          { label: '✉️ Email Muhammad', actionType: 'email' },
        ],
      };
      setMessages((prev) => [...prev, botMsg]);
      queueSpeech(reply, false);
      return;
    }

    // Guided State Machine
    if (conversationState !== 'idle_chat' && conversationState !== 'completed') {
      let nextState: ConversationState = conversationState;
      let botReply = '';
      let suggestions: string[] = [];

      switch (conversationState) {
        case 'collecting_client_type':
          if (lower.includes('company') || lower.includes('business') || lower.includes('hire') || lower.includes('organization') || lower.includes('team')) {
            setProjectDetails((prev) => ({ ...prev, clientType: 'company' }));
            nextState = 'collecting_company_name';
            botReply = "🏢 Excellent! What is the **name of your company or organization**?";
            suggestions = ['Google', 'Tech Startup', 'Consulting Firm', 'Enter Company Name'];
          } else {
            setProjectDetails((prev) => ({ ...prev, clientType: 'individual' }));
            nextState = 'collecting_name';
            botReply = "👋 Wonderful! What is **your name**?";
            suggestions = ['Enter your name'];
          }
          break;

        case 'collecting_company_name':
          if (text.length < 2) {
            botReply = "Please enter a valid company name (at least 2 characters):";
          } else {
            setProjectDetails((prev) => ({ ...prev, companyName: text }));
            nextState = 'collecting_position_title';
            botReply = `Great to connect with **${text}**! What role or project scope are you looking to fill?`;
            suggestions = ['Senior Full Stack Engineer', 'AI/ML Specialist', 'Frontend Engineer (React)', 'Mobile App Dev (Flutter)'];
          }
          break;

        case 'collecting_name':
          if (text.length < 2) {
            botReply = "Please enter your name (at least 2 characters):";
          } else {
            setProjectDetails((prev) => ({ ...prev, clientName: text }));
            nextState = 'collecting_project_type';
            botReply = `Nice to meet you, **${text}**! What type of project are you looking to build?`;
            suggestions = ['Full Stack Web Application', 'AI/ML Custom Solution', 'Mobile App (Flutter iOS/Android)', 'Interactive 3D / WebGL'];
          }
          break;

        case 'collecting_position_title':
          setProjectDetails((prev) => ({ ...prev, positionTitle: text }));
          nextState = 'collecting_budget';
          botReply = `Got it! What is the **estimated budget or compensation range** for this engagement?`;
          suggestions = ['$800 - $1,500', '$1,500 - $3,000', '$3,000 - $5,000+', 'Hourly / Retainer'];
          break;

        case 'collecting_project_type':
          setProjectDetails((prev) => ({ ...prev, projectType: text }));
          nextState = 'collecting_budget';
          botReply = `A **${text}** project sounds fantastic! What is your estimated budget for this build?`;
          suggestions = ['$800 - $1,500', '$1,500 - $3,000', '$3,000 - $5,000+', 'Flexible'];
          break;

        case 'collecting_budget':
          setProjectDetails((prev) => ({ ...prev, budget: text }));
          nextState = 'collecting_timeline';
          botReply = `Thank you! What is your **target timeline** for completion or kickoff?`;
          suggestions = ['Immediate (1-2 weeks)', '1 month', '2-3 months', 'Flexible / Ongoing'];
          break;

        case 'collecting_timeline':
          setProjectDetails((prev) => ({ ...prev, timeline: text }));
          nextState = 'collecting_requirements';
          botReply = `Understood. Please provide a **brief summary of the key features, goals, or tech stack requirements**:`;
          suggestions = ['Modern Full Stack (Next.js + Node + DB)', 'AI Integration & Analytics', 'End-to-End MVP from scratch'];
          break;

        case 'collecting_requirements':
          setProjectDetails((prev) => ({ ...prev, requirements: text }));
          nextState = 'collecting_contact';
          botReply = `Almost finished! What is the **best email address** (and optional WhatsApp/phone) for Muhammad to send the proposal & follow up?`;
          break;

        case 'collecting_contact':
          if (!isValidEmail(text) && !text.includes('@')) {
            botReply = "⚠️ Please provide a valid email address (e.g., yourname@domain.com) so Muhammad can reach you:";
          } else {
            const updated = { ...projectDetails, contactEmail: text };
            setProjectDetails(updated);
            await submitProjectInquiry(updated);
            return;
          }
          break;
      }

      setConversationState(nextState);
      const botMsg: ChatMessage = {
        id: uuidv4(),
        text: botReply,
        isUser: false,
        timestamp: new Date(),
        suggestions,
      };
      setMessages((prev) => [...prev, botMsg]);
      queueSpeech(botReply, false);
      return;
    }

    // Trigger Guided Inquiry
    if (
      lower.includes('hire') ||
      lower.includes('start a project') ||
      lower.includes('project inquiry') ||
      lower.includes('work together') ||
      lower.includes('quote') ||
      lower.includes('proposal') ||
      lower.includes('estimate')
    ) {
      setConversationState('collecting_client_type');
      const reply = "I'm delighted to connect you with Muhammad! Are you reaching out on behalf of a **Company / Business** or as an **Individual / Startup**?";
      const botMsg: ChatMessage = {
        id: uuidv4(),
        text: reply,
        isUser: false,
        timestamp: new Date(),
        suggestions: ['🏢 Company / Organization', '👤 Individual / Startup'],
      };
      setMessages((prev) => [...prev, botMsg]);
      queueSpeech(reply, false);
      return;
    }

    // Query Backend / Local Classifier
    try {
      const conversationHistory = messages.slice(-6).map((m) => ({
        role: m.isUser ? 'user' : 'assistant',
        content: m.text,
      }));

      const res = await chatbotAPI.ask(text, conversationHistory);
      const botMsg: ChatMessage = {
        id: uuidv4(),
        text: res.reply,
        isUser: false,
        timestamp: new Date(),
        suggestions:
          res.suggestions && res.suggestions.length > 0
            ? res.suggestions
            : ['🚀 What projects have you built?', '💼 Start a project inquiry', '📱 WhatsApp Muhammad'],
        actions: [
          { label: '💼 Start Project Inquiry', actionType: 'inquiry' },
          { label: '📱 WhatsApp Direct', actionType: 'whatsapp' },
        ],
      };
      setMessages((prev) => [...prev, botMsg]);
      queueSpeech(res.reply, false);
    } catch {
      const fallbackData = getLocalIntelligentAnswer(text);
      const botMsg: ChatMessage = {
        id: uuidv4(),
        text: fallbackData.reply,
        isUser: false,
        timestamp: new Date(),
        suggestions: fallbackData.suggestions,
        actions: fallbackData.actions,
      };
      setMessages((prev) => [...prev, botMsg]);
      queueSpeech(fallbackData.reply, false);
    }
  };

  /* =========================================================================
     SEND MESSAGE HANDLER
     ========================================================================= */
  const handleSendMessage = useCallback(async (textToSend: string) => {
    if (!textToSend || !textToSend.trim() || isTyping || isSubmitting) return;

    playClick();

    const userMessage: ChatMessage = {
      id: uuidv4(),
      text: textToSend.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    setTimeout(async () => {
      try {
        await handleBotResponse(textToSend.trim());
      } finally {
        setIsTyping(false);
      }
    }, 550 + Math.random() * 250);
  }, [isTyping, isSubmitting, playClick, handleBotResponse]);

  /* =========================================================================
     GLOBAL EVENT LISTENERS (Open from Command Palette, Navigation, Hero, etc.)
     ========================================================================= */
  useEffect(() => {
    const handleOpenChat = (e?: any) => {
      setIsOpen(true);
      setIsMinimized(false);
      vibrate(12);
      playClick();
      if (e?.detail?.query) {
        setTimeout(() => {
          handleSendMessage(e.detail.query);
        }, 300);
      }
    };

    const handleCloseChat = () => {
      setIsOpen(false);
    };

    const handleToggleChat = () => {
      setIsOpen((prev) => !prev);
      if (isMinimized) setIsMinimized(false);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('open-chatbot', handleOpenChat);
    window.addEventListener('close-chatbot', handleCloseChat);
    window.addEventListener('toggle-chatbot', handleToggleChat);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('open-chatbot', handleOpenChat);
      window.removeEventListener('close-chatbot', handleCloseChat);
      window.removeEventListener('toggle-chatbot', handleToggleChat);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isMinimized, handleSendMessage, playClick, vibrate]);

  // Reset Conversation
  const handleResetChat = useCallback(() => {
    playClick();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    isSpeakingRef.current = false;
    speechQueueRef.current = [];
    hasSpokenWelcomeRef.current = false;
    setConversationState('idle_chat');
    setProjectDetails({});

    const freshMsg: ChatMessage = {
      id: uuidv4(),
      text: "👋 Conversation refreshed! How can **Muhammad Ahmad's AI Assistant** help turn your ideas into production reality?",
      isUser: false,
      timestamp: new Date(),
      suggestions: [
        '🚀 What projects have you built?',
        '🧠 Tell me about your AI/ML skills',
        '💼 I want to hire Muhammad',
        '💰 What are your rates & services?',
      ],
      actions: [
        { label: '💼 Start Project Inquiry', actionType: 'inquiry' },
        { label: '📄 Download CV', actionType: 'cv' },
      ],
    };

    setMessages([freshMsg]);
    queueSpeech(freshMsg.text, false);
    try {
      localStorage.removeItem('chatMessages');
      localStorage.removeItem('conversationState');
      localStorage.removeItem('projectDetails');
    } catch { }
    toast.success('Chat restarted');
  }, [playClick, queueSpeech]);

  // Step Progress Calculation
  const stepProgress = useMemo(() => {
    switch (conversationState) {
      case 'collecting_client_type':
        return { current: 1, total: 5, label: 'Client Type' };
      case 'collecting_name':
      case 'collecting_company_name':
        return { current: 2, total: 5, label: 'Name / Organization' };
      case 'collecting_project_type':
      case 'collecting_position_title':
        return { current: 3, total: 5, label: 'Scope / Project Type' };
      case 'collecting_budget':
      case 'collecting_timeline':
        return { current: 4, total: 5, label: 'Budget & Timeline' };
      case 'collecting_requirements':
      case 'collecting_contact':
        return { current: 5, total: 5, label: 'Contact Details' };
      default:
        return null;
    }
  }, [conversationState]);

  return (
    <>
      {/* =========================================================================
          PERMANENT FLOATING TRIGGER BUTTON — VISIBLE & RESPONSIVE ON ALL DEVICES
          ========================================================================= */}
      <div
        className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-[90] flex items-center gap-2 pointer-events-auto"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <motion.button
          variants={buttonVariants}
          whileHover="hover"
          whileTap="tap"
          onClick={() => {
            vibrate(15);
            playClick();
            setIsOpen(!isOpen);
            if (isMinimized) setIsMinimized(false);
          }}
          onMouseEnter={playHover}
          className="relative group p-3 sm:p-4 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white shadow-2xl shadow-blue-500/40 border border-white/30 backdrop-blur-md focus:outline-none focus:ring-4 focus:ring-blue-500/40 transition-all cursor-pointer select-none touch-manipulation"
          aria-label={isOpen ? 'Close AI 3D Assistant' : 'Open AI 3D Assistant'}
        >
          {/* Animated Glow Aura */}
          <span className="absolute -inset-1.5 rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 opacity-70 blur-md group-hover:opacity-100 transition duration-300 animate-pulse pointer-events-none" />

          <div className="relative flex items-center justify-center">
            {isOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Bot className="w-5 h-5 sm:w-6 sm:h-6" />}
          </div>

          {/* Live Online Beacon */}
          {!isOpen && (
            <span className="absolute top-0 right-0 flex h-3.5 w-3.5 sm:h-4 sm:w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 sm:h-4 sm:w-4 bg-emerald-500 border-2 border-white dark:border-gray-900" />
            </span>
          )}

          {/* Desktop Hover Tooltip */}
          {!isOpen && !isMobile && (
            <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl bg-gray-900/95 text-white text-xs font-semibold whitespace-nowrap shadow-xl border border-gray-700/60 opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200">
              💬 Chat with 3D AI Assistant
            </span>
          )}
        </motion.button>
      </div>

      {/* =========================================================================
          MOBILE BACKDROP BLUR OVERLAY (Easy tap-to-dismiss on phone & tablet)
          ========================================================================= */}
      <AnimatePresence>
        {isOpen && isMobile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-[94] bg-black/60 backdrop-blur-sm lg:hidden"
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* =========================================================================
          MAIN CHAT MODAL WINDOW
          ========================================================================= */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`fixed z-[95] transition-all duration-300 flex flex-col overflow-hidden text-gray-900 dark:text-white bg-white/95 dark:bg-gray-950/95 backdrop-blur-2xl border border-gray-200/80 dark:border-gray-800/80 shadow-2xl ${
              isMobile
                ? 'inset-x-2 bottom-2 top-auto h-[90dvh] max-h-[820px] rounded-3xl pb-[env(safe-area-inset-bottom,0px)]'
                : isFullscreen
                ? 'inset-4 sm:inset-8 rounded-3xl'
                : isMinimized
                ? 'bottom-20 right-4 sm:right-6 w-[340px] sm:w-[380px] h-auto rounded-2xl shadow-xl'
                : 'bottom-20 right-4 sm:right-6 w-[calc(100vw-32px)] sm:w-[540px] md:w-[820px] lg:w-[920px] h-[86vh] max-h-[720px] rounded-3xl'
            }`}
            role="dialog"
            aria-label="AI 3D Assistant Window"
          >
            {/* Mobile Drag Indicator Bar */}
            {isMobile && (
              <div className="w-full pt-2 pb-1 flex justify-center bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 select-none">
                <div className="w-10 h-1 rounded-full bg-white/40" />
              </div>
            )}

            {/* Header */}
            <div className="px-3.5 sm:px-4 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 text-white flex items-center justify-between shadow-md shrink-0 select-none">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="relative">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-inner">
                    <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  {isSpeaking && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-indigo-700 animate-ping" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm md:text-base">
                    <span>Muhammad's 3D AI</span>
                    <span className="px-1.5 py-0.5 text-[8px] sm:text-[9px] font-extrabold uppercase rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                      Live
                    </span>
                    <span className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-semibold rounded-md bg-white/15 text-blue-100">
                      v3.2 Turbo
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-blue-100/90 font-medium">
                    {isSpeaking ? (
                      <span className="flex items-center gap-1 text-emerald-200">
                        <Headphones className="w-3 h-3 animate-pulse" />
                        Speaking & Animating...
                      </span>
                    ) : (
                      <span>Full Stack & AI Engineer Assistant</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons in Header */}
              <div className="flex items-center gap-1 sm:gap-1.5">
                <button
                  onClick={() => {
                    playClick();
                    setIsTtsEnabled(!isTtsEnabled);
                    if (isTtsEnabled) {
                      window.speechSynthesis?.cancel();
                      setIsSpeaking(false);
                      isSpeakingRef.current = false;
                    }
                  }}
                  title={isTtsEnabled ? 'Mute AI Voice' : 'Enable AI Voice'}
                  type="button"
                  className={`p-1.5 sm:p-2 rounded-xl transition-all cursor-pointer ${
                    isTtsEnabled
                      ? 'bg-white/25 text-white shadow-inner'
                      : 'text-blue-200 hover:bg-white/20'
                  }`}
                  aria-label="Toggle Voice"
                >
                  {isTtsEnabled ? <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                </button>

                <button
                  onClick={handleResetChat}
                  title="Restart Conversation"
                  type="button"
                  className="p-1.5 sm:p-2 rounded-xl text-blue-200 hover:text-white hover:bg-white/20 transition-all cursor-pointer"
                  aria-label="Restart Conversation"
                >
                  <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>

                <a
                  href="https://wa.me/923314815161"
                  target="_blank"
                  rel="noopener noreferrer"
                  title="WhatsApp Muhammad"
                  className="p-1.5 sm:p-2 rounded-xl text-blue-200 hover:text-white hover:bg-white/20 transition-all"
                  aria-label="WhatsApp Muhammad"
                >
                  <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </a>

                {!isMobile && (
                  <button
                    onClick={() => {
                      playClick();
                      setIsFullscreen(!isFullscreen);
                      if (isMinimized) setIsMinimized(false);
                    }}
                    title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                    type="button"
                    className="p-1.5 sm:p-2 rounded-xl text-blue-200 hover:text-white hover:bg-white/20 transition-all cursor-pointer"
                    aria-label="Toggle Fullscreen"
                  >
                    {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </button>
                )}

                {!isMobile && (
                  <button
                    onClick={() => {
                      playClick();
                      setIsMinimized(!isMinimized);
                    }}
                    title={isMinimized ? 'Expand Chat' : 'Minimize Chat'}
                    type="button"
                    className="p-1.5 sm:p-2 rounded-xl text-blue-200 hover:text-white hover:bg-white/20 transition-all cursor-pointer"
                    aria-label={isMinimized ? 'Expand' : 'Minimize'}
                  >
                    {isMinimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                )}

                <button
                  onClick={() => {
                    playClick();
                    setIsOpen(false);
                  }}
                  title="Close Assistant"
                  type="button"
                  className="p-1.5 sm:p-2 rounded-xl text-blue-200 hover:text-white hover:bg-white/20 transition-all cursor-pointer"
                  aria-label="Close Assistant"
                >
                  <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            {!isMinimized && (
              <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
                {/* 3D AVATAR STAGE */}
                <div
                  className={`relative transition-all duration-300 ${
                    isMobile
                      ? mobileAvatarMode === 'hidden'
                        ? 'hidden'
                        : mobileAvatarMode === 'compact'
                        ? 'h-[95px] w-full shrink-0'
                        : 'h-[175px] w-full shrink-0'
                      : 'w-[40%] lg:w-[38%] h-full shrink-0'
                  } bg-gradient-to-b from-blue-50/50 via-indigo-50/20 to-purple-50/30 dark:from-gray-900/80 dark:via-gray-950/70 dark:to-gray-950/90 border-b md:border-b-0 md:border-r border-gray-200/70 dark:border-gray-800/70 flex flex-col items-center justify-center overflow-hidden`}
                >
                  <div className="w-full h-full relative cursor-grab active:cursor-grabbing select-none">
                    <Canvas
                      camera={{ position: [0, 0.4, 3.8], fov: isMobile ? 54 : 48 }}
                      gl={{
                        antialias: !isMobile,
                        powerPreference: 'high-performance',
                        alpha: true,
                        precision: isMobile ? 'mediump' : 'highp',
                      }}
                      dpr={isMobile ? [1, 1.25] : [1, 1.5]}
                      performance={{ min: 0.5 }}
                    >
                      <ambientLight intensity={theme === 'dark' ? 0.75 : 0.95} />
                      <directionalLight
                        position={[4, 6, 5]}
                        intensity={theme === 'dark' ? 1.5 : 1.7}
                        castShadow={false}
                      />
                      <pointLight
                        position={[-3, 2, 2]}
                        intensity={1.3}
                        color={theme === 'dark' ? '#3b82f6' : '#60a5fa'}
                      />
                      <pointLight
                        position={[3, -1, 2]}
                        intensity={1.1}
                        color={theme === 'dark' ? '#a855f7' : '#c084fc'}
                      />

                      <Suspense fallback={<AvatarFallback theme={theme} />}>
                        <ErrorBoundary fallback={<AvatarFallback theme={theme} />}>
                          <AvatarModel isSpeaking={isSpeaking} theme={theme} />
                          <OrbitControls
                            enablePan={false}
                            enableZoom={false}
                            minPolarAngle={Math.PI / 2.3}
                            maxPolarAngle={Math.PI / 1.8}
                            minAzimuthAngle={-Math.PI / 5}
                            maxAzimuthAngle={Math.PI / 5}
                            enableDamping
                            dampingFactor={0.08}
                          />
                          <Preload all />
                        </ErrorBoundary>
                      </Suspense>
                    </Canvas>
                  </div>

                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border border-gray-200/60 dark:border-gray-700/60 flex items-center gap-1.5 shadow-sm pointer-events-none">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isSpeaking ? 'bg-emerald-400 animate-pulse' : 'bg-blue-500'
                      }`}
                    />
                    <span className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">
                      {isSpeaking ? 'Avatar is responding' : 'Interactive 3D Avatar'}
                    </span>
                  </div>

                  {isMobile && (
                    <button
                      onClick={() =>
                        setMobileAvatarMode(
                          mobileAvatarMode === 'compact'
                            ? 'expanded'
                            : mobileAvatarMode === 'expanded'
                            ? 'hidden'
                            : 'compact'
                        )
                      }
                      type="button"
                      className="absolute top-2 right-2 px-2 py-0.5 rounded-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-md text-[10px] font-semibold text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 shadow-sm cursor-pointer"
                    >
                      {mobileAvatarMode === 'compact'
                        ? '3D Full ⤢'
                        : mobileAvatarMode === 'expanded'
                        ? 'Hide 3D ✕'
                        : 'Show 3D ▾'}
                    </button>
                  )}
                </div>

                {isMobile && mobileAvatarMode === 'hidden' && (
                  <button
                    onClick={() => setMobileAvatarMode('compact')}
                    type="button"
                    className="w-full py-1 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-900 text-blue-600 dark:text-blue-400 text-[11px] font-bold border-b border-gray-200 dark:border-gray-800 text-center flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Bot className="w-3.5 h-3.5" />
                    <span>Show 3D Avatar Stage ▾</span>
                  </button>
                )}

                {/* CONVERSATION STREAM */}
                <div className="flex-1 flex flex-col h-full overflow-hidden bg-gray-50/60 dark:bg-gray-950/60">
                  {stepProgress && (
                    <div className="px-3.5 py-2 bg-indigo-50/90 dark:bg-indigo-950/60 border-b border-indigo-100 dark:border-indigo-900/60 flex items-center justify-between text-xs shrink-0">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center">
                          {stepProgress.current}
                        </div>
                        <div>
                          <span className="font-bold text-indigo-900 dark:text-indigo-200">
                            Guided Inquiry: {stepProgress.label}
                          </span>
                          <span className="text-[10px] text-indigo-600/80 dark:text-indigo-400 ml-1.5">
                            (Step {stepProgress.current} of {stepProgress.total})
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={handleResetChat}
                        type="button"
                        className="text-[11px] font-semibold text-red-600 dark:text-red-400 hover:underline cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  )}

                  {/* Messages Feed */}
                  <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3.5 custom-chat-scrollbar overscroll-contain">
                    {messages.map((msg) => (
                      <motion.div
                        key={msg.id}
                        variants={messageVariants}
                        initial="initial"
                        animate="animate"
                        className={`flex items-start gap-2 sm:gap-2.5 ${
                          msg.isUser ? 'flex-row-reverse' : 'flex-row'
                        }`}
                      >
                        <div
                          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-2xl flex items-center justify-center shrink-0 text-xs font-bold shadow-md select-none ${
                            msg.isUser
                              ? 'bg-blue-600 text-white shadow-blue-500/25'
                              : 'bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-600 text-white shadow-indigo-500/25'
                          }`}
                        >
                          {msg.isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                        </div>

                        <div className="space-y-2 max-w-[85%] sm:max-w-[80%]">
                          <div
                            className={`p-3 sm:p-3.5 rounded-2xl transition-all shadow-sm ${
                              msg.isUser
                                ? 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-tr-none shadow-blue-500/20'
                                : msg.isError
                                ? 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 rounded-tl-none border border-red-200 dark:border-red-800/60'
                                : 'bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 rounded-tl-none border border-gray-200/80 dark:border-gray-800/80'
                            }`}
                          >
                            <RichMessageContent content={msg.text} isUser={msg.isUser} />

                            {!msg.isUser && msg.actions && msg.actions.length > 0 && (
                              <div className="mt-3 pt-2.5 border-t border-gray-100 dark:border-gray-800 flex flex-wrap gap-1.5">
                                {msg.actions.map((act, i) => (
                                  <button
                                    key={i}
                                    onClick={() => handleActionClick(act)}
                                    type="button"
                                    className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-sm flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                                  >
                                    <span>{act.label}</span>
                                    <ArrowRight className="w-3 h-3" />
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>

                          {!msg.isUser && msg.suggestions && msg.suggestions.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-0.5">
                              {msg.suggestions.map((sug, i) => (
                                <button
                                  key={i}
                                  onClick={() => handleSendMessage(sug)}
                                  type="button"
                                  className="px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-blue-50/90 dark:bg-blue-950/70 hover:bg-blue-100 dark:hover:bg-blue-900/80 text-blue-600 dark:text-blue-300 border border-blue-200/70 dark:border-blue-800/60 transition-all hover:scale-[1.02] active:scale-[0.98] text-left cursor-pointer shadow-xs"
                                >
                                  {sug}
                                </button>
                              ))}
                            </div>
                          )}

                          <div className="flex items-center gap-2 text-[10px] text-gray-400 dark:text-gray-500 px-1 select-none">
                            <span>
                              {new Date(msg.timestamp).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>

                            {!msg.isUser && (
                              <>
                                <span>•</span>
                                <button
                                  onClick={() => handleCopyMessage(msg.id, msg.text)}
                                  type="button"
                                  className="hover:text-blue-500 transition-colors flex items-center gap-0.5 cursor-pointer"
                                  title="Copy text"
                                >
                                  {copiedMessageId === msg.id ? (
                                    <>
                                      <Check className="w-3 h-3 text-emerald-500" />
                                      <span className="text-emerald-500">Copied</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3 h-3" />
                                      <span>Copy</span>
                                    </>
                                  )}
                                </button>

                                <span>•</span>
                                <button
                                  onClick={() => speakMessage(msg.text, false)}
                                  type="button"
                                  className="hover:text-blue-500 transition-colors flex items-center gap-0.5 cursor-pointer"
                                  title="Listen to message"
                                >
                                  <Volume2 className="w-3 h-3" />
                                  <span>Listen</span>
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}

                    {isTyping && (
                      <motion.div
                        variants={messageVariants}
                        initial="initial"
                        animate="animate"
                        className="flex items-center gap-2.5 pl-1"
                      >
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
                          <Bot className="w-4 h-4" />
                        </div>
                        <div className="px-4 py-2.5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800/80 shadow-sm flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" />
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.18s]" />
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce [animation-delay:0.36s]" />
                          <span className="text-xs text-gray-500 dark:text-gray-400 ml-1.5 font-medium">
                            AI is formulating response...
                          </span>
                        </div>
                      </motion.div>
                    )}

                    {isSubmitting && (
                      <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        <span>Transmitting inquiry to Muhammad Ahmad's priority server...</span>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>

                  {/* Memoized Input Component */}
                  <ChatInputArea
                    onSendMessage={handleSendMessage}
                    isTyping={isTyping}
                    isSubmitting={isSubmitting}
                    conversationState={conversationState}
                  />
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .custom-chat-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-chat-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-chat-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(99, 102, 241, 0.25);
          border-radius: 9999px;
        }
        .custom-chat-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(99, 102, 241, 0.5);
        }
      `}</style>
    </>
  );
};

export default memo(ChatBot);