'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LogOut, Calendar, Plus, Loader2, RefreshCw, 
  ListTodo, AlertTriangle, Activity, CheckSquare, Users,
  Terminal, Zap, Coffee, Gamepad2, Palette, Book, 
  Target, Flame, Brain, Rocket, Trophy, Compass, 
  Shield, Heart, Sparkles, Code
} from 'lucide-react';
import { Task, User } from '@/lib/db';
import { TaskCard } from '@/components/TaskCard';

// Local avatar mapper for emoji-free design
const AVATAR_MAP: Record<string, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
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

// Premium desaturated color palettes
const COLOR_THEMES: Record<string, { headerBg: string; border: string; text: string; shadow: string; glow: string; badge: string }> = {
  indigo: {
    headerBg: 'bg-indigo-950/10 border-indigo-500/20 text-indigo-400',
    border: 'border-indigo-500/20',
    text: 'text-indigo-400',
    shadow: 'rgba(99, 102, 241, 0.08)',
    glow: 'from-indigo-500/10 via-indigo-500/2 to-transparent',
    badge: 'bg-indigo-500/5 text-indigo-300 border-indigo-500/15',
  },
  rose: {
    headerBg: 'bg-rose-950/10 border-rose-500/20 text-rose-400',
    border: 'border-rose-500/20',
    text: 'text-rose-400',
    shadow: 'rgba(244, 63, 94, 0.08)',
    glow: 'from-rose-500/10 via-rose-500/2 to-transparent',
    badge: 'bg-rose-500/5 text-rose-300 border-rose-500/15',
  },
  emerald: {
    headerBg: 'bg-emerald-950/10 border-emerald-500/20 text-emerald-400',
    border: 'border-emerald-500/20',
    text: 'text-emerald-400',
    shadow: 'rgba(16, 185, 129, 0.08)',
    glow: 'from-emerald-500/10 via-emerald-500/2 to-transparent',
    badge: 'bg-emerald-500/5 text-emerald-300 border-emerald-500/15',
  },
  amber: {
    headerBg: 'bg-amber-950/10 border-amber-500/20 text-amber-400',
    border: 'border-amber-500/20',
    text: 'text-amber-400',
    shadow: 'rgba(245, 158, 11, 0.08)',
    glow: 'from-amber-500/10 via-amber-500/2 to-transparent',
    badge: 'bg-amber-500/5 text-amber-300 border-amber-500/15',
  },
  purple: {
    headerBg: 'bg-purple-950/10 border-purple-500/20 text-purple-400',
    border: 'border-purple-500/20',
    text: 'text-purple-400',
    shadow: 'rgba(168, 85, 247, 0.08)',
    glow: 'from-purple-500/10 via-purple-500/2 to-transparent',
    badge: 'bg-purple-500/5 text-purple-300 border-purple-500/15',
  },
  cyan: {
    headerBg: 'bg-cyan-950/10 border-cyan-500/20 text-cyan-400',
    border: 'border-cyan-500/20',
    text: 'text-cyan-400',
    shadow: 'rgba(6, 182, 212, 0.08)',
    glow: 'from-cyan-500/10 via-cyan-500/2 to-transparent',
    badge: 'bg-cyan-500/5 text-cyan-300 border-cyan-500/15',
  },
};

export default function Board() {
  const router = useRouter();
  
  // States
  const [currentUser, setCurrentUser] = useState<Omit<User, 'pin'> | null>(null);
  const [users, setUsers] = useState<Omit<User, 'pin'>[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [newTaskText, setNewTaskText] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  
  // Timezone countdown clock
  const [timeLeft, setTimeLeft] = useState({ hours: '00', minutes: '00', seconds: '00' });
  
  // Mobile responsive column filter
  const [activeMobileUserId, setActiveMobileUserId] = useState<string | null>(null);

  // Polling ref
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const isFetchingRef = useRef(false);

  // Timezone Countdown Logic
  useEffect(() => {
    function getTimeUntilMidnight() {
      const now = new Date();
      const tzString = 'Africa/Algiers';
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: tzString,
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: false,
      });

      try {
        const parts = formatter.formatToParts(now);
        const tzParts: Record<string, number> = {};
        parts.forEach(p => {
          if (p.type !== 'literal') {
            tzParts[p.type] = parseInt(p.value, 10);
          }
        });

        const tzNow = new Date(
          tzParts.year,
          tzParts.month - 1,
          tzParts.day,
          tzParts.hour,
          tzParts.minute,
          tzParts.second
        );

        const tzMidnight = new Date(
          tzParts.year,
          tzParts.month - 1,
          tzParts.day + 1,
          0, 0, 0
        );

        const diffMs = tzMidnight.getTime() - tzNow.getTime();
        const diffSecs = Math.max(0, Math.floor(diffMs / 1000));

        const hours = Math.floor(diffSecs / 3600);
        const minutes = Math.floor((diffSecs % 3600) / 60);
        const seconds = diffSecs % 60;

        setTimeLeft({
          hours: String(hours).padStart(2, '0'),
          minutes: String(minutes).padStart(2, '0'),
          seconds: String(seconds).padStart(2, '0'),
        });
      } catch {
        // Local fallback
        const midnight = new Date();
        midnight.setHours(24, 0, 0, 0);
        const diffSecs = Math.max(0, Math.floor((midnight.getTime() - now.getTime()) / 1000));
        const hours = Math.floor(diffSecs / 3600);
        const minutes = Math.floor((diffSecs % 3600) / 60);
        const seconds = diffSecs % 60;
        setTimeLeft({
          hours: String(hours).padStart(2, '0'),
          minutes: String(minutes).padStart(2, '0'),
          seconds: String(seconds).padStart(2, '0'),
        });
      }
    }

    getTimeUntilMidnight();
    const interval = setInterval(getTimeUntilMidnight, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch initial board state and check auth
  const fetchBoardData = useCallback(async (isSilent = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    if (!isSilent) setLoading(true);
    else setSyncing(true);

    try {
      // 1. Verify User Profile
      if (!currentUser) {
        const authRes = await fetch('/api/auth/me');
        if (!authRes.ok) {
          router.push('/');
          return;
        }
        const authData = await authRes.json();
        setCurrentUser(authData.user);
        
        // Default mobile view to logged-in user
        if (!activeMobileUserId) {
          setActiveMobileUserId(authData.user.id);
        }
      }

      // 2. Fetch Board State
      const boardRes = await fetch('/api/board');
      if (boardRes.ok) {
        const boardData = await boardRes.json();
        setUsers(boardData.users);
        setTasks(boardData.tasks);
      }
    } catch (e) {
      console.error('Error syncing board:', e);
    } finally {
      setLoading(false);
      setSyncing(false);
      isFetchingRef.current = false;
    }
  }, [currentUser, activeMobileUserId, router]);

  // Setup periodic short-polling
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBoardData();
    }, 0);

    pollingRef.current = setInterval(() => {
      fetchBoardData(true);
    }, 4000);

    return () => {
      clearTimeout(timer);
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [fetchBoardData]);

  // Logout Handler
  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/me', { method: 'DELETE' });
      if (res.ok) {
        router.push('/');
      }
    } catch (e) {
      console.error('Failed logout', e);
    }
  };

  // Add Task
  const handleAddTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim() || isAdding) return;
    setIsAdding(true);

    try {
      const res = await fetch('/api/board', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newTaskText }),
      });
      if (res.ok) {
        const data = await res.json();
        setTasks(prev => [...prev, data.task]);
        setNewTaskText('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAdding(false);
    }
  };

  // Update Task status or text
  const handleUpdateTask = async (taskId: string, updates: Partial<Pick<Task, 'status' | 'text'>>) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const data = await res.json();
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...data.task } : t));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Task
  const handleDeleteTask = async (taskId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
      if (res.ok) {
        setTasks(prev => prev.filter(t => t.id !== taskId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center bg-[#050505] min-h-[100dvh]">
        <div className="noise-overlay" />
        <Loader2 className="w-8 h-8 text-zinc-500 animate-spin" strokeWidth={1.5} />
        <p className="mt-4 text-zinc-400 font-medium text-xs tracking-wider">SYNCING ACCOUNTABILITY CORE...</p>
      </div>
    );
  }

  // Get active color theme for current logged in user
  const userTheme = currentUser ? COLOR_THEMES[currentUser.color] || COLOR_THEMES.indigo : COLOR_THEMES.indigo;
  const CurrentUserAvatar = currentUser ? AVATAR_MAP[currentUser.avatar] || Terminal : Terminal;

  // Stats calculation
  const totalTasksCount = tasks.length;
  const completedTasksCount = tasks.filter(t => t.status === 'done').length;
  const workingTasksCount = tasks.filter(t => t.status === 'working').length;
  const groupCompletionRate = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;
  const activeMembersToday = users.filter(u => tasks.some(t => t.userId === u.id)).length;

  return (
    <div className="flex flex-col min-h-[100dvh] bg-[#050505] text-zinc-100 pb-20 relative overflow-hidden">
      {/* Background Noise & Glowing Mesh Orbs */}
      <div className="noise-overlay" />
      <div className="absolute top-[10%] left-[20%] w-[35vw] h-[35vw] max-w-[500px] max-h-[500px] bg-indigo-950/5 rounded-full blur-[130px] pointer-events-none animate-float-slow" />
      <div className="absolute bottom-[20%] right-[10%] w-[40vw] h-[40vw] max-w-[550px] max-h-[550px] bg-violet-950/5 rounded-full blur-[140px] pointer-events-none animate-float-slow" style={{ animationDelay: '-4s' }} />

      {/* Floating Glass Pill Navbar */}
      <header className="px-4 pt-6 pb-2 w-full max-w-[1400px] mx-auto z-40">
        <div className="glass-panel rounded-full px-4 sm:px-6 py-3 flex items-center justify-between border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
          {/* Brand & Sync State */}
          <div className="flex items-center gap-3">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${syncing ? 'bg-amber-400' : 'bg-emerald-400'}`} />
              <span className={`relative inline-flex rounded-full h-2 w-2 ${syncing ? 'bg-amber-500' : 'bg-emerald-500'}`} />
            </span>
            <div className="hidden sm:block">
              <h1 className="text-sm font-semibold tracking-tight text-white flex items-center gap-1.5 font-sans">
                Daily Checkup
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/5 border border-white/5 text-zinc-400 font-normal">
                  Live
                </span>
              </h1>
            </div>
          </div>

          {/* Navigation Controls & Status */}
          <div className="flex items-center gap-4">
            {/* Clock Widget */}
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.02] border border-white/5 text-[10px] font-medium font-mono text-zinc-400">
              <span className="text-zinc-500 uppercase tracking-wider hidden xs:inline">Reset:</span>
              <span className="text-amber-400 tracking-widest bg-amber-500/5 px-1.5 py-0.5 rounded border border-amber-500/10">
                {timeLeft.hours}:{timeLeft.minutes}:{timeLeft.seconds}
              </span>
            </div>

            {/* View selectors */}
            <nav className="flex items-center gap-1 bg-[#050505]/60 p-0.5 border border-white/5 rounded-full">
              <button 
                onClick={() => fetchBoardData()}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-white/10 text-white cursor-pointer active:scale-95 transition-all"
              >
                <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} strokeWidth={1.5} />
                <span>Board</span>
              </button>
              <button 
                onClick={() => router.push('/history')}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-semibold tracking-wider uppercase text-zinc-400 hover:text-zinc-200 cursor-pointer active:scale-95 transition-all"
              >
                <Calendar className="w-3 h-3" strokeWidth={1.5} />
                <span>History</span>
              </button>
            </nav>

            {/* Profile badge & logout */}
            {currentUser && (
              <div className="flex items-center gap-2.5 pl-2 border-l border-white/5">
                <div className={`flex items-center gap-2 px-2.5 py-1 rounded-full border ${userTheme.border} ${userTheme.headerBg}`}>
                  <CurrentUserAvatar className="w-3.5 h-3.5 text-zinc-200" strokeWidth={1.5} />
                  <span className="text-[10px] font-semibold tracking-wide text-zinc-200 hidden md:inline">{currentUser.name}</span>
                </div>
                <button
                  onClick={handleLogout}
                  title="Log Out"
                  className="p-1.5 rounded-full border border-white/5 bg-white/5 hover:bg-rose-500/10 text-zinc-400 hover:text-rose-400 hover:border-rose-500/20 transition-all cursor-pointer active:scale-90"
                >
                  <LogOut className="w-3.5 h-3.5" strokeWidth={1.5} />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Board Layout */}
      <main className="max-w-[1400px] w-full mx-auto px-4 mt-6 flex-1 flex flex-col z-10">
        
        {/* Bento Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
          {/* Card 1: Completion rate progress */}
          <div className="double-bezel-outer rounded-[1.75rem] p-1">
            <div className="double-bezel-inner rounded-[calc(1.75rem-0.25rem)] p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <CheckSquare className="w-5 h-5" strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <span className="block text-[9px] font-semibold text-zinc-500 uppercase tracking-widest font-mono">Group Progress</span>
                <span className="block text-xl font-bold tracking-tight text-white font-mono mt-0.5">{groupCompletionRate}%</span>
                <div className="w-full bg-white/5 h-1.5 rounded-full mt-2 overflow-hidden border border-white/5">
                  <div 
                    className="bg-indigo-500 h-full rounded-full transition-all duration-700 ease-out" 
                    style={{ width: `${groupCompletionRate}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Momentum Meter */}
          <div className="double-bezel-outer rounded-[1.75rem] p-1">
            <div className="double-bezel-inner rounded-[calc(1.75rem-0.25rem)] p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Activity className="w-5 h-5" strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <span className="block text-[9px] font-semibold text-zinc-500 uppercase tracking-widest font-mono">Active Momentum</span>
                <span className="block text-xl font-bold tracking-tight text-white font-mono mt-0.5">
                  {workingTasksCount} Active
                </span>
                <p className="text-[10px] text-zinc-500 mt-1 font-mono">
                  {totalTasksCount - completedTasksCount - workingTasksCount} remaining to resolve
                </p>
              </div>
            </div>
          </div>

          {/* Card 3: Board Stats */}
          <div className="double-bezel-outer rounded-[1.75rem] p-1 sm:col-span-2 lg:col-span-1">
            <div className="double-bezel-inner rounded-[calc(1.75rem-0.25rem)] p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Users className="w-5 h-5" strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <span className="block text-[9px] font-semibold text-zinc-500 uppercase tracking-widest font-mono">Team Sync</span>
                <span className="block text-xl font-bold tracking-tight text-white font-mono mt-0.5">
                  {activeMembersToday} / {users.length} Active
                </span>
                <p className="text-[10px] text-zinc-500 mt-1 font-mono">
                  Tracking lists across {users.length} custom user columns
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Tab Selectors (only visible on mobile screens < md) */}
        <div className="md:hidden flex overflow-x-auto gap-2 pb-3 mb-5 scrollbar-none">
          {users.map((user) => {
            const isActive = activeMobileUserId === user.id;
            const theme = COLOR_THEMES[user.color] || COLOR_THEMES.indigo;
            const UserAvIcon = AVATAR_MAP[user.avatar] || Terminal;
            return (
              <button
                key={user.id}
                onClick={() => setActiveMobileUserId(user.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-all cursor-pointer ${
                  isActive 
                    ? `bg-zinc-900 border-white/20 text-white` 
                    : 'bg-zinc-950/40 border-white/5 text-zinc-500'
                }`}
              >
                <UserAvIcon className={`w-3.5 h-3.5 ${isActive ? theme.text : 'text-zinc-500'}`} strokeWidth={1.5} />
                <span>{user.name}</span>
                {user.id === currentUser?.id && <span className="text-[9px] font-normal opacity-50 font-mono">(You)</span>}
              </button>
            );
          })}
        </div>

        {/* Lanes Grid Layout */}
        {users.length === 0 ? (
          <div className="flex flex-col flex-1 items-center justify-center py-20 border border-dashed border-white/5 rounded-[2.5rem] bg-white/[0.01] max-w-md mx-auto w-full mt-10 p-6">
            <AlertTriangle className="w-10 h-10 text-zinc-600 mb-4" strokeWidth={1.5} />
            <h3 className="text-sm font-semibold text-zinc-300">No board columns found</h3>
            <p className="text-xs text-zinc-500 text-center px-4 mt-2 leading-relaxed">
              Register or login to create the first accountability column.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-start">
            
            {/* Render Bento Lanes (Filtered for mobile view) */}
            {users.map((user) => {
              const theme = COLOR_THEMES[user.color] || COLOR_THEMES.indigo;
              const isCurrentUser = user.id === currentUser?.id;
              const userTasks = tasks.filter(t => t.userId === user.id);
              
              // Status counts
              const doneCount = userTasks.filter(t => t.status === 'done').length;
              const totalCount = userTasks.length;
              
              // Mobile visibility toggle
              const mobileHiddenClass = activeMobileUserId === user.id ? 'block' : 'hidden md:block';
              const UserLaneAvatar = AVATAR_MAP[user.avatar] || Terminal;

              return (
                <div 
                  key={user.id} 
                  className={`double-bezel-outer rounded-[2.5rem] p-1.5 ${mobileHiddenClass} relative transition-all duration-500`}
                >
                  <div className="double-bezel-inner rounded-[calc(2.5rem-0.375rem)] overflow-hidden relative">
                    {/* Glowing background accent */}
                    <div className={`absolute top-0 inset-x-0 h-24 bg-gradient-to-b ${theme.glow} pointer-events-none`} />

                    {/* Column Header */}
                    <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between bg-zinc-950/30 relative z-10">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-zinc-950/80 border border-white/5 flex items-center justify-center text-zinc-200">
                          <UserLaneAvatar className="w-4 h-4 text-zinc-200" strokeWidth={1.5} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-xs text-zinc-200 flex items-center gap-1.5 font-sans">
                            {user.name}
                            {isCurrentUser && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/5 text-zinc-400 border border-white/5 font-mono">
                                YOU
                              </span>
                            )}
                          </h3>
                          <p className="text-[9px] text-zinc-500 font-semibold uppercase tracking-wider font-mono mt-0.5">
                            Productivity Lane
                          </p>
                        </div>
                      </div>

                      {/* Progress Badge */}
                      <div className={`text-[10px] font-bold font-mono px-2.5 py-1 rounded-full border ${theme.badge}`}>
                        {doneCount}/{totalCount}
                      </div>
                    </div>

                    {/* Column Content */}
                    <div className="p-4 flex flex-col gap-4 relative z-10 min-h-[350px]">
                      
                      {/* Add Task input (Only for current user column) */}
                      {isCurrentUser && (
                        <form onSubmit={handleAddTaskSubmit} className="flex gap-2">
                          <input
                            type="text"
                            required
                            value={newTaskText}
                            onChange={(e) => setNewTaskText(e.target.value)}
                            placeholder="Add task for today..."
                            disabled={isAdding}
                            className="flex-1 bg-[#050505]/40 border border-white/5 hover:border-white/10 focus:border-white/20 rounded-xl px-3 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none transition-all"
                          />
                          <button
                            type="submit"
                            disabled={isAdding}
                            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/15 text-white flex items-center justify-center transition-all cursor-pointer active:scale-90 border border-white/5"
                          >
                            {isAdding ? <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={1.5} /> : <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />}
                          </button>
                        </form>
                      )}

                      {/* Task list inside this column */}
                      <div className="flex flex-col gap-3 max-h-[500px] overflow-y-auto pr-1">
                        <AnimatePresence mode="popLayout">
                          {userTasks.length === 0 ? (
                            <motion.div 
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-white/5 rounded-2xl bg-white/[0.01]"
                            >
                              <ListTodo className="w-7 h-7 text-zinc-600 mb-2.5" strokeWidth={1.5} />
                              <p className="text-[10px] text-zinc-500 font-semibold tracking-wide uppercase font-mono">Empty list</p>
                              {isCurrentUser && <p className="text-[9px] text-zinc-600 mt-1">Press input above to start</p>}
                            </motion.div>
                          ) : (
                            userTasks.map((task) => (
                              <TaskCard
                                key={task.id}
                                task={task}
                                currentUserId={currentUser?.id || null}
                                onUpdate={handleUpdateTask}
                                onDelete={handleDeleteTask}
                              />
                            ))
                          )}
                        </AnimatePresence>
                      </div>

                    </div>
                  </div>
                </div>
              );
            })}

          </div>
        )}

      </main>
    </div>
  );
}
