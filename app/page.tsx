'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Lock, User, Sparkles, ArrowRight, Loader2, Check,
  Terminal, Zap, Coffee, Gamepad2, Palette, Book, 
  Target, Flame, Brain, Rocket, Trophy, Compass, 
  Shield, Heart, Code
} from 'lucide-react';

export const AVATAR_MAP: Record<string, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  '💻': Terminal,
  '⚡': Zap,
  '☕': Coffee,
  '🎮': Gamepad2,
  '🎨': Palette,
  '📚': Book,
  '🎯': Target,
  '🔥': Flame,
  '🧠': Brain,
  '🚀': Rocket,
  '🍕': Trophy,
  '🦁': Compass,
  '🐱': Shield,
  '🐼': Heart,
  '🦊': Sparkles,
  '🦖': Code,
  'terminal': Terminal,
  'zap': Zap,
  'coffee': Coffee,
  'gamepad': Gamepad2,
  'palette': Palette,
  'book': Book,
  'target': Target,
  'flame': Flame,
  'brain': Brain,
  'rocket': Rocket,
  'trophy': Trophy,
  'compass': Compass,
  'shield': Shield,
  'heart': Heart,
  'sparkles': Sparkles,
  'code': Code,
};

const COLORS = [
  { id: 'indigo', name: 'Indigo Dream', value: 'from-indigo-600 to-violet-700', shadow: 'rgba(99, 102, 241, 0.3)' },
  { id: 'rose', name: 'Rose Sunset', value: 'from-rose-500 to-orange-600', shadow: 'rgba(244, 63, 94, 0.3)' },
  { id: 'emerald', name: 'Emerald Aurora', value: 'from-emerald-500 to-teal-600', shadow: 'rgba(16, 185, 129, 0.3)' },
  { id: 'amber', name: 'Amber Fire', value: 'from-amber-500 to-yellow-600', shadow: 'rgba(245, 158, 11, 0.3)' },
  { id: 'purple', name: 'Purple Nebula', value: 'from-purple-600 to-pink-700', shadow: 'rgba(168, 85, 247, 0.3)' },
  { id: 'cyan', name: 'Cyan Wave', value: 'from-cyan-500 to-blue-600', shadow: 'rgba(6, 182, 212, 0.3)' },
];

const AVATARS = [
  { id: 'rocket', icon: Rocket },
  { id: 'terminal', icon: Terminal },
  { id: 'brain', icon: Brain },
  { id: 'zap', icon: Zap },
  { id: 'coffee', icon: Coffee },
  { id: 'gamepad', icon: Gamepad2 },
  { id: 'palette', icon: Palette },
  { id: 'book', icon: Book },
  { id: 'target', icon: Target },
  { id: 'flame', icon: Flame },
  { id: 'trophy', icon: Trophy },
  { id: 'compass', icon: Compass },
  { id: 'shield', icon: Shield },
  { id: 'heart', icon: Heart },
  { id: 'sparkles', icon: Sparkles },
  { id: 'code', icon: Code },
];

// Motion configurations
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, filter: 'blur(6px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 22
    }
  }
};

export default function Home() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS[0].id);
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0].id);
  const [error, setError] = useState<string | null>(null);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if already logged in
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          router.push('/board');
        } else {
          setIsPageLoading(false);
        }
      } catch {
        setIsPageLoading(false);
      }
    }
    checkAuth();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (name.trim().length < 2) {
      setError('Name must be at least 2 characters.');
      return;
    }
    if (!/^\d{4}$/.test(pin)) {
      setError('PIN must be a 4-digit number.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          pin,
          color: selectedColor,
          avatar: selectedAvatar,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to log in.');
      }

      router.push('/board');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong.';
      setError(message);
      setIsSubmitting(false);
    }
  };

  if (isPageLoading) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center bg-[#050505] min-h-[100dvh]">
        <div className="noise-overlay" />
        <Loader2 className="w-8 h-8 text-zinc-500 animate-spin" strokeWidth={1.5} />
        <p className="mt-4 text-zinc-400 font-medium text-xs tracking-wider">INITIALIZING BOARD...</p>
      </div>
    );
  }

  const activeColorObj = COLORS.find(c => c.id === selectedColor) || COLORS[0];

  return (
    <div className="flex flex-col flex-1 items-center justify-center px-4 py-24 sm:px-6 lg:px-8 relative min-h-[100dvh] overflow-hidden bg-[#050505]">
      {/* Noise Overlay */}
      <div className="noise-overlay" />

      {/* Dynamic ambient glowing mesh orbs (GPU accelerated animations) */}
      <div className="absolute top-[10%] left-[10%] w-[40vw] h-[40vw] max-w-[600px] max-h-[600px] bg-indigo-900/10 rounded-full blur-[140px] pointer-events-none animate-float-slow" />
      <div className="absolute bottom-[10%] right-[10%] w-[35vw] h-[35vw] max-w-[500px] max-h-[500px] bg-emerald-950/10 rounded-full blur-[120px] pointer-events-none animate-float-slow" style={{ animationDelay: '-3s' }} />

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-[460px] z-10"
      >
        {/* Eyebrow and Headline */}
        <div className="text-center mb-10">
          <motion.div
            variants={itemVariants}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/5 bg-white/5 text-zinc-300 text-[10px] uppercase tracking-[0.2em] font-medium mb-4"
          >
            <Sparkles className="w-3 h-3 text-indigo-400" strokeWidth={1.5} />
            Accountability Core
          </motion.div>
          
          <motion.h1
            variants={itemVariants}
            className="text-4xl font-semibold tracking-tight text-white font-sans"
          >
            Daily Checkup
          </motion.h1>
          <motion.p
            variants={itemVariants}
            className="mt-3 text-zinc-400 text-sm max-w-xs mx-auto leading-relaxed"
          >
            A high-fidelity space to broadcast your progress, align with peers, and design habits.
          </motion.p>
        </div>

        {/* Double-Bezel Card Container */}
        <motion.div
          variants={itemVariants}
          className="double-bezel-outer rounded-[2rem] p-1.5"
        >
          <div className="double-bezel-inner rounded-[calc(2rem-0.375rem)] p-6 sm:p-8 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Error Alert */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, y: -10 }}
                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-3.5 rounded-2xl border border-rose-500/10 bg-rose-500/5 text-rose-300 text-xs font-medium"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Input Fields */}
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                    Name / Identity
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-zinc-500 pointer-events-none">
                      <User className="w-4 h-4" strokeWidth={1.5} />
                    </span>
                    <input
                      id="name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Abdelmoumen"
                      className="w-full bg-[#050505]/40 border border-white/5 hover:border-white/10 focus:border-white/20 rounded-xl pl-10 pr-4 py-3 text-zinc-100 placeholder-zinc-600 focus:outline-none transition-all text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="pin" className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                    4-Digit Session PIN
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-zinc-500 pointer-events-none">
                      <Lock className="w-4 h-4" strokeWidth={1.5} />
                    </span>
                    <input
                      id="pin"
                      type="password"
                      pattern="\d*"
                      maxLength={4}
                      required
                      value={pin}
                      onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="••••"
                      className="w-full bg-[#050505]/40 border border-white/5 hover:border-white/10 focus:border-white/20 rounded-xl pl-10 pr-4 py-3 text-zinc-100 placeholder-zinc-600 focus:outline-none transition-all text-xs tracking-widest"
                    />
                  </div>
                  <p className="mt-2 text-[10px] text-zinc-500 leading-normal">
                    First-time logging in? This pin reserves your name on this client device.
                  </p>
                </div>
              </div>

              {/* Style customizers for new members */}
              <div className="border-t border-white/5 pt-5 space-y-4">
                <div>
                  <span className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-3">
                    Style configuration <span className="text-zinc-600 font-normal lowercase">(new members)</span>
                  </span>
                  
                  {/* Custom Glass Avatar Picker */}
                  <div className="mb-4">
                    <span className="block text-[10px] font-medium text-zinc-400 mb-2">Choose Avatar Symbol</span>
                    <div className="grid grid-cols-8 gap-2 bg-[#050505]/40 p-2 border border-white/5 rounded-xl max-h-[105px] overflow-y-auto">
                      {AVATARS.map((av) => {
                        const IconComp = av.icon;
                        const isSelected = selectedAvatar === av.id;
                        return (
                          <button
                            key={av.id}
                            type="button"
                            onClick={() => setSelectedAvatar(av.id)}
                            className={`flex items-center justify-center p-2 rounded-lg transition-all duration-300 cursor-pointer ${
                              isSelected 
                                ? 'bg-white/10 border border-white/10 scale-105 shadow-sm text-white' 
                                : 'border border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                            }`}
                          >
                            <IconComp className="w-4 h-4" strokeWidth={1.5} />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Gradient Glow themes */}
                  <div>
                    <span className="block text-[10px] font-medium text-zinc-400 mb-2">Column Highlight Color</span>
                    <div className="grid grid-cols-6 gap-2">
                      {COLORS.map((col) => (
                        <button
                          key={col.id}
                          type="button"
                          onClick={() => setSelectedColor(col.id)}
                          title={col.name}
                          className={`h-7 w-full rounded-lg bg-gradient-to-r ${col.value} relative overflow-hidden transition-all duration-300 hover:scale-105 cursor-pointer border border-white/5`}
                        >
                          {selectedColor === col.id && (
                            <span className="absolute inset-0 flex items-center justify-center bg-black/25">
                              <Check className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit CTA Button with Button-in-Button Trailing Icon */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="group relative w-full rounded-full py-2.5 px-2.5 pl-6 font-semibold text-xs text-white flex items-center justify-between transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] cursor-pointer overflow-hidden border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
              >
                <div className={`absolute inset-0 bg-gradient-to-r ${activeColorObj.value} opacity-90 group-hover:opacity-100 transition-opacity duration-500`} />
                <span className="relative z-10 tracking-wider">
                  {isSubmitting ? 'VERIFYING CREDENTIALS...' : 'ENTER ACCOUNTABILITY CORE'}
                </span>
                <span className="relative z-10 w-8 h-8 rounded-full bg-black/15 flex items-center justify-center transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-1 group-hover:-translate-y-[1px] group-hover:scale-105">
                  {isSubmitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-white" strokeWidth={1.5} />
                  ) : (
                    <ArrowRight className="w-3.5 h-3.5 text-white" strokeWidth={1.5} />
                  )}
                </span>
              </button>
            </form>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
