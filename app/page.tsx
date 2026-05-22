'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, User, Sparkles, ArrowRight, Loader2, Check } from 'lucide-react';

const COLORS = [
  { id: 'indigo', name: 'Indigo Dream', value: 'from-indigo-500 to-blue-600', shadow: 'rgba(99, 102, 241, 0.4)' },
  { id: 'rose', name: 'Rose Sunset', value: 'from-rose-500 to-pink-600', shadow: 'rgba(244, 63, 94, 0.4)' },
  { id: 'emerald', name: 'Emerald Aurora', value: 'from-emerald-500 to-teal-600', shadow: 'rgba(16, 185, 129, 0.4)' },
  { id: 'amber', name: 'Amber Fire', value: 'from-amber-500 to-orange-600', shadow: 'rgba(245, 158, 11, 0.4)' },
  { id: 'purple', name: 'Purple Nebula', value: 'from-purple-500 to-fuchsia-600', shadow: 'rgba(168, 85, 247, 0.4)' },
  { id: 'cyan', name: 'Cyan Wave', value: 'from-cyan-500 to-blue-500', shadow: 'rgba(6, 182, 212, 0.4)' },
];

const AVATARS = ['🚀', '💻', '🧠', '⚡', '☕', '🎮', '🎨', '📚', '🍕', '🎯', '🔥', '🦁', '🐱', '🐼', '🦊', '🦖'];

export default function Home() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS[0].id);
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
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
      } catch (err) {
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
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
      setIsSubmitting(false);
    }
  };

  if (isPageLoading) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center bg-gray-950 min-h-screen">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
        <p className="mt-4 text-slate-400 font-medium text-sm">Initializing daily checkup...</p>
      </div>
    );
  }

  const activeColorObj = COLORS.find(c => c.id === selectedColor) || COLORS[0];

  return (
    <div className="flex flex-col flex-1 items-center justify-center px-4 py-16 sm:px-6 lg:px-8 relative min-h-screen">
      {/* Decorative ambient glowing orbs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-fuchsia-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg z-10">
        {/* Title */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/20 bg-indigo-500/5 text-indigo-400 text-xs font-semibold tracking-wide mb-3"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Accountability for friends
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent"
          >
            Daily Checkup
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-3 text-slate-400 text-[15px] max-w-sm mx-auto"
          >
            Share your daily to-do list, see what your friends are working on, and build consistent habits together.
          </motion.p>
        </div>

        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="w-full rounded-2xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-xl p-6 sm:p-8 shadow-2xl"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Notification */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="p-3.5 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-300 text-sm font-medium"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Inputs */}
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Name / Username
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 pointer-events-none">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    id="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 rounded-xl pl-10 pr-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none transition-colors text-sm"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="pin" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  4-Digit Access PIN
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 pointer-events-none">
                    <Lock className="w-4 h-4" />
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
                    className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 rounded-xl pl-10 pr-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none transition-colors text-sm tracking-widest"
                  />
                </div>
                <p className="mt-1.5 text-[11px] text-slate-500">
                  New users? Setting a PIN now will lock this username to your device.
                </p>
              </div>
            </div>

            {/* Collapsible Profile setup (For New User customisation) */}
            <div className="border-t border-slate-800/80 pt-5 space-y-5">
              <div>
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  Profile Style <span className="text-slate-500 font-normal lowercase">(only for new signups)</span>
                </span>
                
                {/* Avatar emoji picker */}
                <div className="mb-4">
                  <span className="block text-[11px] font-medium text-slate-400 mb-2">Select Avatar</span>
                  <div className="grid grid-cols-8 gap-2 bg-slate-950/40 p-2 border border-slate-800/50 rounded-xl max-h-[96px] overflow-y-auto">
                    {AVATARS.map((av) => (
                      <button
                        key={av}
                        type="button"
                        onClick={() => setSelectedAvatar(av)}
                        className={`text-xl p-1.5 rounded-lg transition-all hover:bg-slate-800 cursor-pointer ${
                          selectedAvatar === av ? 'bg-slate-800 border border-slate-700/80 scale-110 shadow-md' : 'border border-transparent'
                        }`}
                      >
                        {av}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color themes */}
                <div>
                  <span className="block text-[11px] font-medium text-slate-400 mb-2">Select Column Glow Theme</span>
                  <div className="grid grid-cols-6 gap-2">
                    {COLORS.map((col) => (
                      <button
                        key={col.id}
                        type="button"
                        onClick={() => setSelectedColor(col.id)}
                        title={col.name}
                        className={`h-9 w-full rounded-xl bg-gradient-to-r ${col.value} relative overflow-hidden transition-all hover:scale-105 cursor-pointer`}
                      >
                        {selectedColor === col.id && (
                          <span className="absolute inset-0 flex items-center justify-center bg-black/25">
                            <Check className="w-4 h-4 text-white" />
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3.5 px-4 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 cursor-pointer shadow-lg transition-all bg-gradient-to-r ${activeColorObj.value}`}
              style={{ boxShadow: `0 4px 20px ${activeColorObj.shadow}` }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  Enter Accountability Board
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
