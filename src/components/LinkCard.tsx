import React, { useState } from 'react';
import { Reorder } from 'framer-motion';
import { GripVertical, Trash2, Eye, EyeOff, Pencil, Check, X, Loader2, MousePointer2 } from 'lucide-react';
import { Link as LinkModel } from '../types/models';
import { cn } from '../lib/utils';

interface LinkCardProps {
  link: LinkModel;
  onDelete: (id: string) => Promise<boolean>;
  onToggleStatus: (link: LinkModel) => Promise<boolean>;
  onSaveEdit: (id: string, form: { title: string; url: string }) => Promise<boolean>;
}

export function LinkCard({ link, onDelete, onToggleStatus, onSaveEdit }: LinkCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: link.title, url: link.url });
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const handleStartEditing = () => {
    setIsEditing(true);
    setEditForm({ title: link.title, url: link.url });
  };

  const handleSaveEdit = async () => {
    const success = await onSaveEdit(link.id!, editForm);
    if (success) {
      setIsEditing(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    await onDelete(link.id!);
    // if success, component will unmount. If fail, reset.
    setIsDeleting(false);
    setIsConfirmingDelete(false);
  };

  const handleToggle = async () => {
    setIsToggling(true);
    await onToggleStatus(link);
    setIsToggling(false);
  };

  return (
    <Reorder.Item
      value={link}
      className={cn(
        "bg-slate-900 border border-white/10 p-4 rounded-2xl flex items-center gap-4 group transition-all hover:border-violet-600/50",
        !link.isActive && "opacity-60"
      )}
    >
      <div className="cursor-grab active:cursor-grabbing p-2 text-slate-600 hover:text-slate-400 transition-all">
        <GripVertical className="w-5 h-5" />
      </div>
      
      {isEditing ? (
        /* Inline Edit Mode */
        <div className="flex-1 flex items-center gap-3">
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              type="text"
              value={editForm.title}
              onChange={e => setEditForm({ ...editForm, title: e.target.value })}
              className="bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-600"
              autoFocus
              onKeyDown={e => { if (e.key === 'Enter') handleSaveEdit(); if (e.key === 'Escape') setIsEditing(false); }}
            />
            <input
              type="url"
              value={editForm.url}
              onChange={e => setEditForm({ ...editForm, url: e.target.value })}
              className="bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-600"
              onKeyDown={e => { if (e.key === 'Enter') handleSaveEdit(); if (e.key === 'Escape') setIsEditing(false); }}
            />
          </div>
          <button onClick={handleSaveEdit} className="p-2 text-emerald-400 hover:bg-emerald-400/10 rounded-lg">
            <Check className="w-4 h-4" />
          </button>
          <button onClick={() => setIsEditing(false)} className="p-2 text-slate-400 hover:bg-white/5 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        /* Display Mode */
        <>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg truncate">{link.title}</h3>
              {!link.isActive && <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">Hidden</span>}
            </div>
            <div className="flex items-center gap-3">
              <p className="text-slate-500 text-sm truncate">{link.url}</p>
              <span className="flex items-center gap-1 text-xs text-slate-600">
                <MousePointer2 className="w-3 h-3" />
                {link.clickCount || 0}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {isConfirmingDelete ? (
              <div className="flex items-center gap-2 bg-red-500/10 p-1 rounded-xl border border-red-500/20">
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-3 py-1.5 text-xs font-bold bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all disabled:opacity-50 flex items-center gap-1"
                >
                  {isDeleting && <Loader2 className="w-3 h-3 animate-spin" />}
                  Confirm
                </button>
                <button
                  onClick={() => setIsConfirmingDelete(false)}
                  disabled={isDeleting}
                  className="px-3 py-1.5 text-xs font-bold text-slate-400 hover:text-white transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={handleStartEditing}
                  className="p-3 text-slate-500 hover:text-violet-400 hover:bg-violet-400/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                  title="Edit Link"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={handleToggle}
                  disabled={isToggling}
                  className={cn(
                    "p-3 rounded-xl transition-all",
                    link.isActive ? "text-emerald-400 hover:bg-emerald-400/10" : "text-slate-500 hover:bg-slate-500/10"
                  )}
                  title={link.isActive ? "Hide Link" : "Show Link"}
                >
                  {isToggling ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : link.isActive ? (
                    <Eye className="w-5 h-5" />
                  ) : (
                    <EyeOff className="w-5 h-5" />
                  )}
                </button>
                <button
                  onClick={() => setIsConfirmingDelete(true)}
                  className="p-3 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
                  title="Delete Link"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
        </>
      )}
    </Reorder.Item>
  );
}
