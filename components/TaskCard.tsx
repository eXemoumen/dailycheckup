'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Check, RotateCcw, Trash2, Edit2, CheckCircle2, Circle, Clock } from 'lucide-react';
import { Task } from '@/lib/db';

interface TaskCardProps {
  task: Task;
  currentUserId: string | null;
  isReadOnly?: boolean;
  onUpdate: (id: string, updates: Partial<Pick<Task, 'status' | 'text'>>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function TaskCard({ task, currentUserId, isReadOnly = false, onUpdate, onDelete }: TaskCardProps) {
  const isOwner = currentUserId === task.userId && !isReadOnly;
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(task.text);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleStatusChange = async (newStatus: 'todo' | 'working' | 'done') => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onUpdate(task.id, { status: newStatus });
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveText = async () => {
    if (isSubmitting) return;
    if (editText.trim() === '') {
      setEditText(task.text);
      setIsEditing(false);
      return;
    }
    setIsSubmitting(true);
    try {
      await onUpdate(task.id, { text: editText.trim() });
      setIsEditing(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveText();
    } else if (e.key === 'Escape') {
      setEditText(task.text);
      setIsEditing(false);
    }
  };

  // Status visual configurations with desaturated, premium colors and highlights
  const statusConfig = {
    todo: {
      outerBorder: 'border-white/5',
      outerBg: 'bg-white/[0.01]',
      innerBg: 'bg-zinc-950/40',
      innerBorder: 'border-white/5',
      textColor: 'text-zinc-200',
      indicatorColor: 'text-zinc-500',
      accentGlow: 'rgba(255, 255, 255, 0.01)',
    },
    working: {
      outerBorder: 'border-amber-500/20',
      outerBg: 'bg-amber-500/[0.02]',
      innerBg: 'bg-amber-950/20',
      innerBorder: 'border-amber-500/10',
      textColor: 'text-amber-100',
      indicatorColor: 'text-amber-400/90',
      accentGlow: 'rgba(245, 158, 11, 0.08)',
    },
    done: {
      outerBorder: 'border-emerald-500/20',
      outerBg: 'bg-emerald-500/[0.01]',
      innerBg: 'bg-emerald-950/15',
      innerBorder: 'border-emerald-500/10',
      textColor: 'text-zinc-400 line-through decoration-emerald-800/60',
      indicatorColor: 'text-emerald-400/90',
      accentGlow: 'rgba(16, 185, 129, 0.06)',
    },
  };

  const currentConfig = statusConfig[task.status];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15, filter: 'blur(4px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ 
        type: 'spring',
        stiffness: 120,
        damping: 20
      }}
      className={`relative w-full rounded-2xl p-1 border ${currentConfig.outerBorder} ${currentConfig.outerBg} transition-all duration-500`}
      style={{
        boxShadow: `0 8px 32px 0 rgba(0, 0, 0, 0.25), inset 0 1px 0 0 rgba(255, 255, 255, 0.02), 0 0 20px ${currentConfig.accentGlow}`
      }}
    >
      <div className={`rounded-[calc(1rem-0.125rem)] p-3 sm:p-4 border ${currentConfig.innerBorder} ${currentConfig.innerBg} space-y-3.5`}>
        {/* Task Text & Input */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onBlur={handleSaveText}
              onKeyDown={handleKeyDown}
              disabled={isSubmitting}
              className="w-full bg-[#050505]/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-white/20 transition-all"
            />
          ) : (
            <p
              className={`text-xs sm:text-[13px] font-medium leading-relaxed break-words select-text ${currentConfig.textColor}`}
              onDoubleClick={() => isOwner && setIsEditing(true)}
            >
              {task.text}
            </p>
          )}
        </div>

        {/* Card Footer: Metadata and Action Controls */}
        <div className="flex items-center justify-between border-t border-white/5 pt-3 text-[10px]">
          <div className="flex items-center gap-1.5 font-mono">
            {task.status === 'working' ? (
              <span className={`flex items-center gap-1.5 ${currentConfig.indicatorColor} font-semibold uppercase tracking-wider`}>
                <Clock className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '6s' }} strokeWidth={1.5} />
                <span>Working</span>
              </span>
            ) : task.status === 'done' ? (
              <span className={`flex items-center gap-1.5 ${currentConfig.indicatorColor} font-semibold uppercase tracking-wider`}>
                <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span>Done</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-zinc-500 font-semibold uppercase tracking-wider">
                <Circle className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span>Todo</span>
              </span>
            )}
          </div>

          {/* Action Buttons for Task Owner */}
          {isOwner && (
            <div className="flex items-center gap-1">
              {/* Status transition triggers */}
              {task.status === 'todo' && (
                <>
                  <button
                    onClick={() => handleStatusChange('working')}
                    title="Start Working"
                    className="p-1 rounded-md bg-white/5 hover:bg-amber-500/10 text-zinc-400 hover:text-amber-400 border border-white/5 hover:border-amber-500/20 transition-all cursor-pointer active:scale-90"
                  >
                    <Play className="w-3 h-3 fill-current" strokeWidth={1.5} />
                  </button>
                  <button
                    onClick={() => handleStatusChange('done')}
                    title="Mark Done"
                    className="p-1 rounded-md bg-white/5 hover:bg-emerald-500/10 text-zinc-400 hover:text-emerald-400 border border-white/5 hover:border-emerald-500/20 transition-all cursor-pointer active:scale-90"
                  >
                    <Check className="w-3 h-3" strokeWidth={1.5} />
                  </button>
                </>
              )}

              {task.status === 'working' && (
                <>
                  <button
                    onClick={() => handleStatusChange('todo')}
                    title="Move back to Todo"
                    className="p-1 rounded-md bg-white/5 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-white/5 transition-all cursor-pointer active:scale-90"
                  >
                    <RotateCcw className="w-3 h-3" strokeWidth={1.5} />
                  </button>
                  <button
                    onClick={() => handleStatusChange('done')}
                    title="Mark Done"
                    className="p-1 rounded-md bg-white/5 hover:bg-emerald-500/10 text-zinc-400 hover:text-emerald-400 border border-white/5 hover:border-emerald-500/20 transition-all cursor-pointer active:scale-90"
                  >
                    <Check className="w-3 h-3" strokeWidth={1.5} />
                  </button>
                </>
              )}

              {task.status === 'done' && (
                <button
                  onClick={() => handleStatusChange('todo')}
                  title="Re-open Task"
                  className="p-1 rounded-md bg-white/5 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-white/5 transition-all cursor-pointer active:scale-90"
                >
                  <RotateCcw className="w-3 h-3" strokeWidth={1.5} />
                </button>
              )}

              <div className="h-3.5 w-px bg-white/5 mx-1" />

              {/* Edit text */}
              <button
                onClick={() => setIsEditing(!isEditing)}
                title="Edit Text"
                className="p-1 rounded-md text-zinc-500 hover:text-white transition-colors cursor-pointer active:scale-90"
              >
                <Edit2 className="w-3 h-3" strokeWidth={1.5} />
              </button>

              {/* Delete Task */}
              <button
                onClick={() => onDelete(task.id)}
                title="Delete Task"
                className="p-1 rounded-md text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer active:scale-90"
              >
                <Trash2 className="w-3 h-3" strokeWidth={1.5} />
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
