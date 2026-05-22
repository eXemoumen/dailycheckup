'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Calendar as CalendarIcon, Loader2, ListTodo, AlertTriangle 
} from 'lucide-react';
import { Task, User, getLocalDateString } from '@/lib/db';
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

export default function History() {
  const router = useRouter();
  
  // Yesterday's date as default
  const getYesterdayDateString = (): string => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  };

  const [currentUser, setCurrentUser] = useState<Omit<User, 'pin'> | null>(null);
  const [selectedDate, setSelectedDate] = useState(getYesterdayDateString());
  const [users, setUsers] = useState<Omit<User, 'pin'>[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMobileUserId, setActiveMobileUserId] = useState<string | null>(null);

  // Fetch Board details for selected date
  const fetchHistoryBoard = async (dateStr: string) => {
    setLoading(true);
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
        
        if (!activeMobileUserId) {
          setActiveMobileUserId(authData.user.id);
        }
      }

      // 2. Fetch Board State for dateStr
      const boardRes = await fetch(`/api/board?date=${dateStr}`);
      if (boardRes.ok) {
        const boardData = await boardRes.json();
        setUsers(boardData.users);
        setTasks(boardData.tasks);
      }
    } catch (e) {
      console.error('Error fetching history board:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistoryBoard(selectedDate);
  }, [selectedDate]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      setSelectedDate(e.target.value);
    }
  };

  // Helper placeholder update functions
  const noopUpdate = async () => {};
  const noopDelete = async () => {};

  return (
    <div className="flex flex-col min-h-screen bg-gray-950 text-slate-100 pb-16">
      
      {/* Navigation Header */}
      <header className="border-b border-slate-900 bg-slate-900/40 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-[1600px] mx-auto px-4 py-4 sm:px-6 lg:px-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/board')}
              className="p-2 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer flex items-center gap-1 text-xs font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Board</span>
            </button>
            
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                History Archive
              </h1>
              <p className="text-xs text-slate-500 font-medium">Browse past accountability checkups</p>
            </div>
          </div>

          {/* Date selection & calendar picker */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-1.5 text-xs">
              <CalendarIcon className="w-4 h-4 text-slate-400 mr-2.5" />
              <span className="text-slate-400 mr-2 font-medium">Select Date:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={handleDateChange}
                max={new Date().toISOString().split('T')[0]}
                className="bg-transparent text-slate-200 border-none outline-none focus:ring-0 font-semibold cursor-pointer text-xs"
                style={{ colorScheme: 'dark' }}
              />
            </div>
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
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="flex flex-col flex-1 items-center justify-center py-32">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            <p className="mt-4 text-slate-400 font-medium text-xs">Retrieving historical state...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col flex-1 items-center justify-center py-20 border border-dashed border-slate-800 rounded-2xl bg-slate-900/10 max-w-md mx-auto w-full mt-10">
            <AlertTriangle className="w-12 h-12 text-slate-500 mb-4" />
            <h3 className="text-base font-bold text-slate-300">No board history</h3>
            <p className="text-xs text-slate-500 text-center px-6 mt-1.5">
              There is no record of users or activities for this date.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-start">
            
            {/* Render Columns */}
            {users.map((user) => {
              const theme = COLOR_THEMES[user.color] || COLOR_THEMES.indigo;
              const userTasks = tasks.filter(t => t.userId === user.id);
              
              const doneCount = userTasks.filter(t => t.status === 'done').length;
              const totalCount = userTasks.length;
              
              const mobileHiddenClass = activeMobileUserId === user.id ? 'block' : 'hidden md:block';

              return (
                <div 
                  key={user.id} 
                  className={`flex flex-col rounded-2xl border bg-slate-900/35 overflow-hidden ${theme.border} ${mobileHiddenClass} relative shadow-xl`}
                >
                  {/* Accent glow background */}
                  <div className={`absolute top-0 inset-x-0 h-24 bg-gradient-to-b ${theme.glow} pointer-events-none`} />

                  {/* Column Header */}
                  <div className="px-5 py-4 border-b border-slate-900/60 flex items-center justify-between bg-slate-950/40 relative z-10">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl p-1 bg-slate-900/80 rounded-xl border border-slate-800/80 shadow-md">
                        {user.avatar}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-slate-200">
                          {user.name}
                        </h3>
                        <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                          Historical Column
                        </p>
                      </div>
                    </div>

                    {/* Progress Badge */}
                    <div className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${theme.badge}`}>
                      {doneCount}/{totalCount} Completed
                    </div>
                  </div>

                  {/* Column Content */}
                  <div className="p-4 flex flex-col gap-4 relative z-10 min-h-[250px]">
                    <div className="flex flex-col gap-3 max-h-[550px] overflow-y-auto pr-1">
                      {userTasks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-slate-800/40 rounded-xl bg-slate-950/15">
                          <ListTodo className="w-8 h-8 text-slate-600 mb-2" />
                          <p className="text-[11px] text-slate-500 font-medium">No tasks logged on this day</p>
                        </div>
                      ) : (
                        userTasks.map((task) => (
                          <TaskCard
                            key={task.id}
                            task={task}
                            currentUserId={currentUser?.id || null}
                            isReadOnly={true}
                            onUpdate={noopUpdate}
                            onDelete={noopDelete}
                          />
                        ))
                      )}
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
