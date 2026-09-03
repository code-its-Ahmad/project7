import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Terminal as TerminalIcon,
  X,
  Maximize2,
  Minimize2,
  Sparkles,
  Send,
  CornerDownLeft,
  Flame,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useSound } from '../../context/SoundContext';
import { useTheme } from '../../context/ThemeContext';
import { usePortfolio } from '../../context/PortfolioContext';

interface CyberTerminalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CommandOutput {
  id: string;
  type: 'input' | 'output' | 'error' | 'success' | 'system';
  content: React.ReactNode;
}

const CyberTerminal: React.FC<CyberTerminalProps> = ({ isOpen, onClose }) => {
  const { playKeypress, playBeep, playSuccess, playClick, playWhoosh, vibrate } = useSound();
  const { theme, toggleTheme } = useTheme();
  const { profile, skills, projects } = usePortfolio();

  const [inputVal, setInputVal] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [isMaximized, setIsMaximized] = useState(false);
  const [gameState, setGameState] = useState<{
    active: boolean;
    target: number;
    attempts: number;
    score: number;
  }>({ active: false, target: 0, attempts: 0, score: 0 });

  const [outputs, setOutputs] = useState<CommandOutput[]>([
    {
      id: 'welcome-1',
      type: 'system',
      content: (
        <div className="space-y-1 text-cyan-400 font-mono text-xs">
          <p className="font-bold text-sm text-cyan-300">
            AHMAD-OS v4.8.2 (x86_64-quantum-arch)
          </p>
          <p className="text-gray-400 text-[11px]">
            Type <span className="text-yellow-400 font-bold">help</span> to view available system commands or tap the quick pills below.
          </p>
        </div>
      ),
    },
  ]);

  const inputRef = useRef<HTMLInputElement>(null);
  const terminalBodyRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom when outputs change
  useEffect(() => {
    if (terminalBodyRef.current) {
      terminalBodyRef.current.scrollTop = terminalBodyRef.current.scrollHeight;
    }
  }, [outputs]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const addOutput = (
    type: 'input' | 'output' | 'error' | 'success' | 'system',
    content: React.ReactNode
  ) => {
    setOutputs((prev) => [
      ...prev,
      { id: `${Date.now()}-${Math.random()}`, type, content },
    ]);
  };

  const handleCommandSubmit = (cmdStr: string) => {
    const trimmed = cmdStr.trim();
    if (!trimmed) return;

    vibrate(10);
    playKeypress();

    // Add command to history
    setHistory((prev) => [...prev, trimmed]);
    setHistoryIndex(-1);

    // Echo input
    addOutput(
      'input',
      <div className="flex items-center space-x-2 text-cyan-300 font-mono text-xs">
        <span className="text-emerald-400 font-bold">guest@ahmad-realm:~$</span>
        <span>{trimmed}</span>
      </div>
    );

    const parts = trimmed.toLowerCase().split(' ');
    const mainCmd = parts[0];
    const args = parts.slice(1);

    // Mini-game handling
    if (gameState.active && !isNaN(parseInt(trimmed, 10))) {
      handleGameGuess(parseInt(trimmed, 10));
      setInputVal('');
      return;
    }

    switch (mainCmd) {
      case 'help': {
        playBeep(800);
        addOutput(
          'output',
          <div className="space-y-1.5 font-mono text-[11px] sm:text-xs text-gray-300">
            <p className="text-yellow-400 font-bold">Available System Commands:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-gray-400">
              <div><span className="text-cyan-400 font-semibold">help</span> - Show this command list</div>
              <div><span className="text-cyan-400 font-semibold">bio</span> - Read Muhammad Ahmad's bio</div>
              <div><span className="text-cyan-400 font-semibold">skills</span> - Inspect technical skill stack</div>
              <div><span className="text-cyan-400 font-semibold">projects</span> - View featured case studies</div>
              <div><span className="text-cyan-400 font-semibold">status</span> - Check live latency & availability</div>
              <div><span className="text-cyan-400 font-semibold">contact</span> - Open contact channels</div>
              <div><span className="text-cyan-400 font-semibold">game</span> - Play quantum reflex mini-game</div>
              <div><span className="text-cyan-400 font-semibold">theme</span> - Toggle Dark / Light theme</div>
              <div><span className="text-cyan-400 font-semibold">clear</span> - Clear terminal screen</div>
              <div><span className="text-cyan-400 font-semibold">exit</span> - Close terminal console</div>
            </div>
          </div>
        );
        break;
      }

      case 'bio': {
        playBeep(900);
        addOutput(
          'output',
          <div className="space-y-2 font-mono text-[11px] sm:text-xs text-gray-300">
            <p className="text-emerald-400 font-bold text-sm">
              👨‍💻 {profile?.name || 'Muhammad Ahmad'}
            </p>
            <p className="text-cyan-300">
              Role: Full Stack & AI Engineer | Mobile App Architect
            </p>
            <p className="text-gray-300 leading-relaxed">
              {profile?.bio ||
                'Passionate full-stack & AI software engineer with 3+ years delivering production ecosystems, AI neural networks, and scalable web architectures for international startups.'}
            </p>
            <p className="text-purple-400">
              Location: Islamabad / Lahore, Pakistan (Working Globally Remote)
            </p>
          </div>
        );
        break;
      }

      case 'skills': {
        playBeep(1000);
        const topSkills = skills.slice(0, 8);
        addOutput(
          'output',
          <div className="space-y-2 font-mono text-[11px] sm:text-xs">
            <p className="text-cyan-400 font-bold">⚡ Core Technical Arsenal:</p>
            <div className="space-y-1.5">
              {topSkills.map((s) => (
                <div key={s.id} className="flex items-center justify-between text-gray-300">
                  <span className="text-gray-200 font-medium w-28 sm:w-36 truncate">
                    {s.name}
                  </span>
                  <div className="flex-1 max-w-[140px] sm:max-w-[200px] mx-2 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full"
                      style={{ width: `${s.percentage || 85}%` }}
                    />
                  </div>
                  <span className="text-cyan-400 font-mono text-[10px]">
                    {s.percentage || 85}%
                  </span>
                </div>
              ))}
            </div>
            <p className="text-gray-500 text-[10px]">
              Type <span className="text-yellow-400">projects</span> to see these skills in production.
            </p>
          </div>
        );
        break;
      }

      case 'projects': {
        playBeep(950);
        const topProjects = projects.slice(0, 4);
        addOutput(
          'output',
          <div className="space-y-2.5 font-mono text-[11px] sm:text-xs">
            <p className="text-purple-400 font-bold">🚀 Featured Engineering Projects:</p>
            <div className="space-y-2">
              {topProjects.map((p, idx) => (
                <div
                  key={p.id}
                  className="p-2 rounded-xl bg-gray-900/60 border border-gray-800 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-cyan-300 font-bold">
                      {idx + 1}. {p.title}
                    </span>
                    <span className="text-[10px] text-purple-400 px-1.5 py-0.5 rounded bg-purple-500/10 border border-purple-500/20">
                      {p.category || 'Full-Stack'}
                    </span>
                  </div>
                  <p className="text-gray-400 text-[10px] line-clamp-2">
                    {p.short_description}
                  </p>
                  <p className="text-emerald-400 text-[10px]">
                    Tech: {p.technologies?.slice(0, 4).join(', ')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        );
        break;
      }

      case 'status': {
        playBeep(1100);
        const now = new Date();
        const pktTime = now.toLocaleTimeString('en-US', {
          timeZone: 'Asia/Karachi',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        });

        addOutput(
          'output',
          <div className="space-y-1.5 font-mono text-[11px] sm:text-xs text-gray-300">
            <p className="text-cyan-400 font-bold">🌐 Live System Telemetry:</p>
            <div className="space-y-1 text-gray-400">
              <p>
                • Ahmad Local Time: <span className="text-white font-bold">{pktTime} (PKT / UTC+5)</span>
              </p>
              <p>
                • Availability: <span className="text-emerald-400 font-bold animate-pulse">🟢 Available for Worldwide Hire</span>
              </p>
              <p>
                • Latency: <span className="text-cyan-400 font-bold">18ms (Optimal Zero-Lag)</span>
              </p>
              <p>
                • Engine: <span className="text-purple-400 font-bold">React 19 + Three.js + Tailwind</span>
              </p>
            </div>
          </div>
        );
        break;
      }

      case 'contact': {
        playSuccess();
        addOutput(
          'output',
          <div className="space-y-1.5 font-mono text-[11px] sm:text-xs text-gray-300">
            <p className="text-emerald-400 font-bold">📬 Direct Channels:</p>
            <p className="text-cyan-300">
              • Email: <a href="mailto:Ahmadrajpootr1@gmail.com" className="underline hover:text-white">Ahmadrajpootr1@gmail.com</a>
            </p>
            <p className="text-emerald-400">
              • WhatsApp: <a href="https://wa.me/923314815161" target="_blank" rel="noreferrer" className="underline hover:text-white">+92 331 4815161</a>
            </p>
            <p className="text-purple-400">
              • LinkedIn: <a href="https://www.linkedin.com/in/muhammad-ahmad-565206291/" target="_blank" rel="noreferrer" className="underline hover:text-white">linkedin.com/in/muhammad-ahmad</a>
            </p>
          </div>
        );
        break;
      }

      case 'game': {
        playBeep(1200);
        const secret = Math.floor(Math.random() * 50) + 1;
        setGameState({ active: true, target: secret, attempts: 0, score: 0 });
        addOutput(
          'system',
          <div className="space-y-1.5 font-mono text-[11px] sm:text-xs text-yellow-300 bg-yellow-500/10 p-2.5 rounded-xl border border-yellow-500/20">
            <p className="font-bold flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-orange-400" />
              CYBER PUZZLE: Guess the secret number between 1 and 50!
            </p>
            <p className="text-gray-300 text-[10px]">
              Type a number and press Enter.
            </p>
          </div>
        );
        break;
      }

      case 'theme': {
        toggleTheme();
        playClick();
        addOutput('success', <p className="font-mono text-xs text-emerald-400">Theme switched successfully!</p>);
        break;
      }

      case 'clear': {
        playWhoosh();
        setOutputs([]);
        break;
      }

      case 'exit': {
        onClose();
        break;
      }

      case 'sudo': {
        playBeep(400);
        addOutput(
          'error',
          <p className="font-mono text-xs text-red-400">
            Permission denied: guest user is not in the sudoers file. This incident will be reported to Muhammad Ahmad. 😄
          </p>
        );
        break;
      }

      default: {
        playBeep(450);
        addOutput(
          'error',
          <div className="font-mono text-xs text-red-400 space-y-0.5">
            <p>Command not recognized: '{trimmed}'</p>
            <p className="text-gray-500 text-[10px]">
              Type <span className="text-yellow-400">help</span> to list valid commands.
            </p>
          </div>
        );
      }
    }

    setInputVal('');
  };

  const handleGameGuess = (guess: number) => {
    const nextAttempts = gameState.attempts + 1;

    if (guess === gameState.target) {
      playSuccess();
      vibrate([30, 50, 30]);
      addOutput(
        'success',
        <div className="space-y-1 font-mono text-xs text-emerald-400 bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/30">
          <p className="font-bold text-sm">🎉 ACCESS GRANTED // DECRYPTION COMPLETE!</p>
          <p>You cracked the security code in {nextAttempts} attempts!</p>
          <p className="text-[10px] text-gray-400">Type <span className="text-yellow-400">game</span> to play again.</p>
        </div>
      );
      setGameState({ active: false, target: 0, attempts: 0, score: 100 });
    } else if (guess < gameState.target) {
      playBeep(700);
      addOutput(
        'system',
        <p className="font-mono text-xs text-yellow-400">
          🔺 TOO LOW! Try a higher number (Attempt #{nextAttempts})
        </p>
      );
      setGameState((prev) => ({ ...prev, attempts: nextAttempts }));
    } else {
      playBeep(900);
      addOutput(
        'system',
        <p className="font-mono text-xs text-cyan-400">
          🔻 TOO HIGH! Try a lower number (Attempt #{nextAttempts})
        </p>
      );
      setGameState((prev) => ({ ...prev, attempts: nextAttempts }));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCommandSubmit(inputVal);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length > 0) {
        const nextIdx =
          historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(nextIdx);
        setInputVal(history[nextIdx]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex !== -1) {
        const nextIdx = historyIndex + 1;
        if (nextIdx < history.length) {
          setHistoryIndex(nextIdx);
          setInputVal(history[nextIdx]);
        } else {
          setHistoryIndex(-1);
          setInputVal('');
        }
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const commands = [
        'help',
        'skills',
        'projects',
        'bio',
        'status',
        'contact',
        'game',
        'clear',
        'theme',
        'exit',
      ];
      const match = commands.find((c) => c.startsWith(inputVal.toLowerCase().trim()));
      if (match) {
        setInputVal(match);
      }
    }
  };

  const quickPills = ['help', 'skills', 'projects', 'status', 'game', 'bio', 'contact', 'clear'];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 select-none pointer-events-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/75 backdrop-blur-md"
        />

        {/* Main Terminal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className={`relative z-10 w-full rounded-3xl bg-gray-950/95 border border-cyan-500/40 shadow-2xl shadow-cyan-500/20 backdrop-blur-2xl flex flex-col overflow-hidden transition-all duration-300 ${
            isMaximized
              ? 'fixed inset-2 sm:inset-4 max-w-none h-[calc(100vh-1rem)] sm:h-[calc(100vh-2rem)]'
              : 'max-w-3xl h-[520px] sm:h-[580px]'
          }`}
        >
          {/* Terminal Title Bar */}
          <div className="px-4 py-3 bg-gray-900/90 border-b border-cyan-500/20 flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-2">
              <div className="flex space-x-1.5">
                <button
                  onClick={onClose}
                  className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-600 transition-colors"
                  title="Close Terminal"
                />
                <button
                  onClick={() => setIsMaximized(!isMaximized)}
                  className="w-3 h-3 rounded-full bg-yellow-500 hover:bg-yellow-600 transition-colors"
                  title="Toggle Maximize"
                />
                <button
                  onClick={() => setOutputs([])}
                  className="w-3 h-3 rounded-full bg-emerald-500 hover:bg-emerald-600 transition-colors"
                  title="Clear Console"
                />
              </div>
              <div className="flex items-center space-x-1.5 pl-2 text-xs font-mono text-cyan-300 font-semibold">
                <TerminalIcon className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden xs:inline">ahmad@quantum-node:~$</span>
                <span className="xs:hidden">HUD Terminal</span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsMaximized(!isMaximized)}
                className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-all hidden sm:block"
              >
                {isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={onClose}
                className="p-1 rounded-lg text-gray-400 hover:text-red-400 hover:bg-gray-800 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Suggestion Pills (Especially Ergonomic on Mobile / Infinix Hot 10) */}
          <div className="px-3 py-2 bg-gray-900/60 border-b border-gray-800 flex items-center gap-1.5 overflow-x-auto custom-scrollbar shrink-0">
            <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider shrink-0 pl-1">
              Quick:
            </span>
            {quickPills.map((cmd) => (
              <button
                key={cmd}
                onClick={() => handleCommandSubmit(cmd)}
                className="px-2.5 py-1 rounded-lg bg-gray-800/80 hover:bg-cyan-500/20 active:scale-95 border border-gray-700 hover:border-cyan-500/40 text-cyan-300 text-[10px] sm:text-xs font-mono transition-all shrink-0 cursor-pointer"
              >
                {cmd}
              </button>
            ))}
          </div>

          {/* Terminal Logs Body */}
          <div
            ref={terminalBodyRef}
            className="flex-1 p-3.5 sm:p-5 overflow-y-auto space-y-3 font-mono custom-scrollbar"
          >
            {outputs.map((out) => (
              <div key={out.id} className="leading-relaxed">
                {out.content}
              </div>
            ))}
          </div>

          {/* Command Prompt Input Area */}
          <div className="p-3 bg-gray-900/90 border-t border-cyan-500/20 flex items-center space-x-2 shrink-0">
            <span className="text-emerald-400 font-mono font-bold text-xs sm:text-sm pl-1 shrink-0">
              ➜
            </span>
            <input
              ref={inputRef}
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type command ('help', 'skills', 'game')..."
              className="flex-1 bg-transparent text-white font-mono text-xs sm:text-sm focus:outline-none placeholder:text-gray-500"
              autoFocus
              spellCheck={false}
              autoComplete="off"
            />
            <button
              onClick={() => handleCommandSubmit(inputVal)}
              className="p-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-gray-950 transition-all font-bold active:scale-95 shrink-0"
              title="Execute Command"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CyberTerminal;
