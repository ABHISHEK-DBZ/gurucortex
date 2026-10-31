'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Play, Sparkles } from 'lucide-react';
import Link from 'next/link';

// Terminal animation sequence
const TERMINAL_SEQUENCE = [
  { type: 'command', text: 'gurucortex init --mode=autonomous', delay: 0 },
  { type: 'status', text: '▸ Booting neural pathways...', delay: 400 },
  { type: 'check', text: '✓ Loading LLM (Mistral-7B-v0.2)', delay: 600 },
  { type: 'check', text: '✓ Initializing Vector Store (ChromaDB)', delay: 200 },
  { type: 'check', text: '✓ Establishing Local Data Stream', delay: 200 },
  { type: 'ready', text: '▸ System ready. Awaiting input', delay: 800 },
];

// Typewriter component for terminal animation
function TypewriterText({ 
  text, 
  onComplete, 
  speed = 80,
  className = '' 
}: { 
  text: string; 
  onComplete?: () => void; 
  speed?: number;
  className?: string;
}) {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);
      return () => clearTimeout(timeout);
    } else if (onComplete) {
      onComplete();
    }
  }, [currentIndex, text, speed, onComplete]);

  return <span className={className}>{displayText}</span>;
}

// Terminal Line Component
function TerminalLine({ 
  item, 
  onComplete,
  isActive = false 
}: { 
  item: typeof TERMINAL_SEQUENCE[0]; 
  onComplete?: () => void;
  isActive?: boolean;
}) {
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    if (item.type === 'ready') {
      const interval = setInterval(() => setShowCursor(prev => !prev), 500);
      return () => clearInterval(interval);
    }
  }, [item.type]);

  const baseStyles = 'font-mono text-[13px] leading-relaxed';
  
  const typeStyles: Record<string, string> = {
    command: 'text-cyan-400',
    status: 'text-purple-400/70 italic',
    check: 'text-emerald-400',
    ready: 'text-cyan-400',
  };

  if (item.type === 'command') {
    return (
      <div className={`${baseStyles} ${typeStyles[item.type]}`}>
        <span className="text-purple-400">$ </span>
        {isActive ? (
          <TypewriterText text={item.text} onComplete={onComplete} />
        ) : (
          <span>{item.text}</span>
        )}
        {isActive && <span className="animate-cursor-blink ml-0.5">▌</span>}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={`${baseStyles} ${typeStyles[item.type]}`}
      onAnimationComplete={onComplete}
    >
      {item.text}
      {item.type === 'ready' && (
        <span className={`ml-0.5 ${showCursor ? 'opacity-100' : 'opacity-0'}`}>_</span>
      )}
    </motion.div>
  );
}

// Animated Terminal Component
function AnimatedTerminal() {
  const [lines, setLines] = useState<typeof TERMINAL_SEQUENCE>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(true);
  const [key, setKey] = useState(0);

  const addNextLine = useCallback(() => {
    if (currentIndex < TERMINAL_SEQUENCE.length) {
      const currentItem = TERMINAL_SEQUENCE[currentIndex];
      setTimeout(() => {
        setLines(prev => [...prev, currentItem]);
        setCurrentIndex(prev => prev + 1);
        if (currentItem.type === 'command') {
          setIsTyping(true);
        } else {
          setIsTyping(false);
        }
      }, currentItem.delay);
    } else {
      // Restart after 3 seconds
      setTimeout(() => {
        setLines([]);
        setCurrentIndex(0);
        setIsTyping(true);
        setKey(prev => prev + 1);
      }, 3000);
    }
  }, [currentIndex]);

  useEffect(() => {
    if (currentIndex === 0) {
      addNextLine();
    }
  }, [currentIndex, addNextLine, key]);

  const handleLineComplete = () => {
    setIsTyping(false);
    addNextLine();
  };

  return (
    <div className="gc-terminal w-full max-w-[540px] shadow-gc-card">
      {/* Window chrome */}
      <div className="gc-terminal-header">
        <div className="gc-terminal-dot gc-terminal-dot-red" />
        <div className="gc-terminal-dot gc-terminal-dot-yellow" />
        <div className="gc-terminal-dot gc-terminal-dot-green" />
        <span className="ml-auto text-xs text-text-muted font-mono">
          gurucortex@localhost
        </span>
      </div>
      
      {/* Terminal body */}
      <div className="gc-terminal-body min-h-[200px] space-y-2">
        <AnimatePresence mode="wait">
          {lines.map((line, index) => (
            <TerminalLine
              key={`${key}-${index}`}
              item={line}
              isActive={index === lines.length - 1 && isTyping}
              onComplete={index === lines.length - 1 ? handleLineComplete : undefined}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Trust Badge Component
function TrustBadge({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2 text-[13px] text-text-muted">
      <span className="text-cyan-500/60">{icon}</span>
      <span>{text}</span>
    </div>
  );
}

// Main Hero Section
export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center pt-40 pb-28 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Solid minimal background */}
      <div className="absolute inset-0 bg-[#0D0D0D]" />

      <div className="relative z-10 max-w-6xl mx-auto w-full">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-20 items-center">
          {/* Left Side - Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-10"
          >
            {/* Status Badge - Minimal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="w-fit hidden"
            >
              <div className="inline-flex items-center gap-3 px-3 py-1.5 rounded-full bg-white/5 border border-[rgba(255,255,255,0.06)] hover:bg-white/[0.08] transition-colors">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-60" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
                </span>
                <span className="text-xs font-medium text-gray-300 tracking-wider">READY TO USE</span>
              </div>
            </motion.div>

            {/* Main Headline - Clean and technical */}
            <div className="space-y-8">
              <h1 className="text-7xl sm:text-8xl lg:text-8xl font-extrabold tracking-tight leading-tight text-white">
                The Ultimate
                <br />
                Cognitive OS
              </h1>
              
              <p className="text-lg text-[#A1A1AA] max-w-xl leading-relaxed font-light">
                Transform how you learn with AI-powered study sessions, adaptive quizzes, and real-time attention monitoring — all running locally.
              </p>
            </div>

            {/* CTAs - Solid green accent */}
            <div className="flex flex-col sm:flex-row gap-3 pt-8">
              <Link href="/dashboard">
                <motion.button
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  className="group px-8 py-4 bg-[#22C55E] text-black font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-[#16A34A] transition-all duration-200"
                >
                  Start Learning
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="pt-12 border-t border-[rgba(255,255,255,0.06)] flex flex-col sm:flex-row gap-8 sm:gap-12">
              <div className="text-sm">
                <div className="text-[#A1A1AA] mb-3 text-xs uppercase tracking-wide">100% Local</div>
                <div className="text-white font-semibold text-base">No cloud required</div>
              </div>
              <div className="text-sm">
                <div className="text-[#A1A1AA] mb-3 text-xs uppercase tracking-wide">Open Source</div>
                <div className="text-white font-semibold text-base">Forever free</div>
              </div>
              <div className="text-sm">
                <div className="text-[#A1A1AA] mb-3 text-xs uppercase tracking-wide">Private</div>
                <div className="text-white font-semibold text-base">Your data, your control</div>
              </div>
            </div>
          </motion.div>

          {/* Right Side - Terminal Demo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="hidden lg:flex items-center justify-center"
          >
            <AnimatedTerminal />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

