'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LogOut, Calendar, Plus, Loader2, RefreshCw, CheckCircle, 
  ListTodo, TrendingUp, AlertTriangle 
} from 'lucide-react';
import { Task, User } from '@/lib/db';
import { TaskCard } from '@/components/TaskCard';

const COLOR_THEMES: Record<string, { headerBg: string; border: string; text: string; shadow: string; glow: string; badge: string }> = {
  indigo: {
    headerBg: 'bg-indigo-950/20 border-indigo-500/30 text-indigo-400',
    border: 'border-indigo-500/30',
    text: 'text-indigo-400',
    shadow: 'rgba(99, 102, 241, 0.15)',
    glow: 'from-indigo-500/15 via-indigo-500/5 to-transparent',
    badge: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20',
  },
  rose: {
    headerBg: 'bg-rose-950/20 border-rose-500/30 text-rose-400',
    border: 'border-rose-500/30',
    text: 'text-rose-400',
    shadow: 'rgba(244, 63, 94, 0.15)',
    glow: 'from-rose-500/15 via-rose-500/5 to-transparent',
    badge: 'bg-rose-500/10 text-rose-300 border-rose-500/20',
  },
  emerald: {
    headerBg: 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400',
    border: 'border-emerald-500/30',
    text: 'text-emerald-400',
    shadow: 'rgba(16, 185, 129, 0.15)',
    glow: 'from-emerald-500/15 via-emerald-500/5 to-transparent',
    badge: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
  },
  amber: {
    headerBg: 'bg-amber-950/20 border-amber-500/30 text-amber-400',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
    shadow: 'rgba(245, 158, 11, 0.15)',
    glow: 'from-amber-500/15 via-amber-500/5 to-transparent',
    badge: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
  },
  purple: {
    headerBg: 'bg-purple-950/20 border-purple-500/30 text-purple-400',
    border: 'border-purple-500/30',
    text: 'text-purple-400',
    shadow: 'rgba(168, 85, 247, 0.15)',
    glow: 'from-purple-500/15 via-purple-500/5 to-transparent',
    badge: 'bg-purple-500/10 text-purple-300 border-purple-500/20',
  },
  cyan: {
    headerBg: 'bg-cyan-950/20 border-cyan-500/30 text-cyan-400',
    border: 'border-cyan-500/30',
    text: 'text-cyan-400',
    shadow: 'rgba(6, 182, 212, 0.15)',
    glow: 'from-cyan-500/15 via-cyan-500/5 to-transparent',
    badge: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20',
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
      } catch (e) {
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
  const fetchBoardData = async (isSilent = false) => {
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
  };

  // Setup periodic short-polling
  useEffect(() => {
    fetchBoardData();

    pollingRef.current = setInterval(() => {
      fetchBoardData(true);
    }, 4000);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [currentUser]);

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
      <div className="flex flex-col flex-1 items-center justify-center bg-gray-950 min-h-screen">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
        <p className="mt-4 text-slate-400 font-medium text-sm">Synchronizing dashboard...</p>
      </div>
    );
  }

  // Get active color theme for current logged in user
  const userTheme = currentUser ? COLOR_THEMES[currentUser.color] || COLOR_THEMES.indigo : COLOR_THEMES.indigo;

  return (
    <div className="flex flex-col min-h-screen bg-gray-950 text-slate-100 pb-16">
      {/* Header Panel */}
      <header className="border-b border-slate-900 bg-slate-900/40 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-[1600px] mx-auto px-4 py-4 sm:px-6 lg:px-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          
          {/* Logo & Status check */}
          <div className="flex items-center gap-3">
            <div className={`h-2.5 w-2.5 rounded-full ${syncing ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Daily Checkup
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-400 font-normal">
                  Live
                </span>
              </h1>
              <p className="text-xs text-slate-500 font-medium">Friend Accountability Dashboard</p>
            </div>
          </div>

          {/* Countdown timer & Page nav */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-5">
            {/* Countdown Box */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-950/60 text-xs font-semibold">
              <span className="text-slate-400">Archiving in:</span>
              <span className="font-mono text-amber-400 text-sm tracking-widest bg-amber-500/5 px-2 py-0.5 rounded border border-amber-500/10">
                {timeLeft.hours}:{timeLeft.minutes}:{timeLeft.seconds}
              </span>
            </div>

            {/* Navigation links */}
            <div className="flex items-center gap-1 bg-slate-950/80 p-1 border border-slate-800 rounded-xl">
              <button 
                onClick={() => fetchBoardData()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800/80 text-white cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                <span>Board</span>
              </button>
              <button 
                onClick={() => router.push('/history')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-900 cursor-pointer transition-all"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>History Archive</span>
              </button>
            </div>

            {/* User badge & logout */}
            {currentUser && (
              <div className="flex items-center gap-3 pl-2 sm:border-l border-slate-800">
                <div className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl border ${userTheme.border} ${userTheme.headerBg}`}>
                  <span className="text-lg">{currentUser.avatar}</span>
                  <span className="text-xs font-bold text-slate-200">{currentUser.name}</span>
                </div>
                <button
                  onClick={handleLogout}
                  title="Log Out"
                  className="p-2 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-rose-950/20 text-slate-400 hover:text-rose-400 hover:border-rose-500/20 transition-all cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

        </div>
      </header>

      {/* Main Board Container */}
      <main className="max-w-[1600px] w-full mx-auto px-4 mt-8 sm:px-6 lg:px-8 flex-1 flex flex-col">
        
        {/* Mobile Tab Selectors (only visible on mobile screens < md) */}
        <div className="md:hidden flex overflow-x-auto gap-2 pb-3 mb-4 scrollbar-none">
          {users.map((user) => {
            const isActive = activeMobileUserId === user.id;
            const theme = COLOR_THEMES[user.color] || COLOR_THEMES.indigo;
            return (
              <button
                key={user.id}
                onClick={() => setActiveMobileUserId(user.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap border transition-all cursor-pointer ${
                  isActive 
                    ? `bg-slate-900 ${theme.border} ${theme.text}` 
                    : 'bg-slate-900/40 border-slate-800/60 text-slate-400'
                }`}
              >
                <span>{user.avatar}</span>
                <span>{user.name}</span>
                {user.id === currentUser?.id && <span className="text-[9px] font-normal opacity-60">(You)</span>}
              </button>
            );
          })}
        </div>

        {/* Lanes Grid */}
        {users.length === 0 ? (
          <div className="flex flex-col flex-1 items-center justify-center py-20 border border-dashed border-slate-800 rounded-2xl bg-slate-900/10 max-w-md mx-auto w-full mt-10">
            <AlertTriangle className="w-12 h-12 text-slate-500 mb-4" />
            <h3 className="text-base font-bold text-slate-300">No members found</h3>
            <p className="text-xs text-slate-500 text-center px-6 mt-1.5">
              It seems there are no registered members yet. Log in to create the first lane.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-start">
            
            {/* Render Lanes (On Mobile, filter by active tab) */}
            {users.map((user) => {
              const theme = COLOR_THEMES[user.color] || COLOR_THEMES.indigo;
              const isCurrentUser = user.id === currentUser?.id;
              const userTasks = tasks.filter(t => t.userId === user.id);
              
              // Status counts
              const doneCount = userTasks.filter(t => t.status === 'done').length;
              const totalCount = userTasks.length;
              
              // Mobile visibility toggle
              const mobileHiddenClass = activeMobileUserId === user.id ? 'block' : 'hidden md:block';

              return (
                <div 
                  key={user.id} 
                  className={`flex flex-col rounded-2xl border bg-slate-900/35 overflow-hidden ${theme.border} ${mobileHiddenClass} relative shadow-xl`}
                >
                  {/* Glowing background accent */}
                  <div className={`absolute top-0 inset-x-0 h-24 bg-gradient-to-b ${theme.glow} pointer-events-none`} />

                  {/* Column Header */}
                  <div className="px-5 py-4 border-b border-slate-900/60 flex items-center justify-between bg-slate-950/40 relative z-10">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl p-1 bg-slate-900/80 rounded-xl border border-slate-800/80 shadow-md">
                        {user.avatar}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-slate-200 flex items-center gap-1.5">
                          {user.name}
                          {isCurrentUser && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium">
                              You
                            </span>
                          )}
                        </h3>
                        <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                          Productivity Column
                        </p>
                      </div>
                    </div>

                    {/* Progress Badge */}
                    <div className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${theme.badge}`}>
                      {doneCount}/{totalCount} Completed
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
                          placeholder="Add new task for today..."
                          disabled={isAdding}
                          className="flex-1 bg-slate-950/80 border border-slate-800 hover:border-slate-700/80 focus:border-indigo-500/80 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none transition-all"
                        />
                        <button
                          type="submit"
                          disabled={isAdding}
                          className={`p-2 rounded-xl flex items-center justify-center text-white cursor-pointer bg-gradient-to-r ${currentUser ? (COLOR_THEMES[currentUser.color] || COLOR_THEMES.indigo).text === 'text-indigo-400' ? 'from-indigo-500 to-blue-600' : 'from-indigo-500 to-blue-600' : 'from-indigo-500 to-blue-600'} hover:scale-105 transition-transform`}
                          style={{
                            backgroundImage: currentUser ? `linear-gradient(to right, var(--color-${currentUser.color}-500), var(--color-${currentUser.color}-600))` : undefined,
                            backgroundColor: 'rgba(99, 102, 241, 0.8)'
                          }}
                        >
                          {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        </button>
                      </form>
                    )}

                    {/* Task list inside this column */}
                    <div className="flex flex-col gap-3 max-h-[550px] overflow-y-auto pr-1">
                      <AnimatePresence mode="popLayout">
                        {userTasks.length === 0 ? (
                          <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-slate-800/40 rounded-xl bg-slate-950/15"
                          >
                            <ListTodo className="w-8 h-8 text-slate-600 mb-2" />
                            <p className="text-[11px] text-slate-500 font-medium">No tasks recorded yet</p>
                            {isCurrentUser && <p className="text-[9px] text-slate-600 mt-0.5">Type above to add a goal</p>}
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
              );
            })}

          </div>
        )}

      </main>
    </div>
  );
}
