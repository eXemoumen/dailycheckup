'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

  // Status visual configurations
  const statusConfig = {
    todo: {
      borderColor: 'border-slate-800/80',
      bgColor: 'bg-slate-900/40',
      glowClass: 'glow-todo',
      indicatorColor: 'text-slate-400',
    },
    working: {
      borderColor: 'border-amber-500/50',
      bgColor: 'bg-amber-950/20',
      glowClass: 'glow-working',
      indicatorColor: 'text-amber-400',
    },
    done: {
      borderColor: 'border-emerald-500/40',
      bgColor: 'bg-emerald-950/10',
      glowClass: 'glow-done',
      indicatorColor: 'text-emerald-400',
    },
  };

  const currentConfig = statusConfig[task.status];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={`relative w-full rounded-xl p-4 border glass-card ${currentConfig.borderColor} ${currentConfig.bgColor} ${currentConfig.glowClass}`}
    >
      <div className="flex flex-col gap-3">
        {/* Task Text & Input */}
        <div className="flex-1 min-w-0 pr-1">
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onBlur={handleSaveText}
              onKeyDown={handleKeyDown}
              disabled={isSubmitting}
              className="w-full bg-slate-950/80 border border-slate-700 rounded-lg px-2.5 py-1.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          ) : (
            <p
              className={`text-[15px] font-medium leading-relaxed break-words select-text ${
                task.status === 'done' ? 'text-slate-500 line-through' : 'text-slate-200'
              }`}
              onDoubleClick={() => isOwner && setIsEditing(true)}
            >
              {task.text}
            </p>
          )}
        </div>

        {/* Card Footer: Metadata and Action Controls */}
        <div className="flex items-center justify-between border-t border-slate-800/60 pt-2.5 mt-1 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500">
            {task.status === 'working' ? (
              <span className="flex items-center gap-1 text-amber-400/90 font-medium">
                <Clock className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '4s' }} />
                <span>Working</span>
              </span>
            ) : task.status === 'done' ? (
              <span className="flex items-center gap-1 text-emerald-400/90 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Completed</span>
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <Circle className="w-3.5 h-3.5" />
                <span>Todo</span>
              </span>
            )}
          </div>

          {/* Action Buttons for Task Owner */}
          {isOwner && (
            <div className="flex items-center gap-1.5">
              {/* Status transition triggers */}
              {task.status === 'todo' && (
                <>
                  <button
                    onClick={() => handleStatusChange('working')}
                    title="Start Working"
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-amber-500/20 text-slate-400 hover:text-amber-400 border border-slate-700/60 hover:border-amber-500/30 transition-all cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                  </button>
                  <button
                    onClick={() => handleStatusChange('done')}
                    title="Mark Done"
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-400 border border-slate-700/60 hover:border-emerald-500/30 transition-all cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </>
              )}

              {task.status === 'working' && (
                <>
                  <button
                    onClick={() => handleStatusChange('todo')}
                    title="Move back to Todo"
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700/60 transition-all cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleStatusChange('done')}
                    title="Mark Done"
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-400 border border-slate-700/60 hover:border-emerald-500/30 transition-all cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </>
              )}

              {task.status === 'done' && (
                <button
                  onClick={() => handleStatusChange('todo')}
                  title="Re-open Task"
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700/60 transition-all cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}

              <div className="h-4 w-px bg-slate-800/80 mx-0.5" />

              {/* Edit text */}
              <button
                onClick={() => setIsEditing(!isEditing)}
                title="Edit Text"
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-indigo-400 transition-colors cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>

              {/* Delete Task */}
              <button
                onClick={() => onDelete(task.id)}
                title="Delete Task"
                className="p-1.5 rounded-lg hover:bg-rose-950/30 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
