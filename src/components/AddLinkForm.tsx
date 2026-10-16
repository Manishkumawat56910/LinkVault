import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface AddLinkFormProps {
  onAdd: (link: { title: string; url: string }) => Promise<boolean>;
  onCancel: () => void;
}

export function AddLinkForm({ onAdd, onCancel }: AddLinkFormProps) {
  const [newLink, setNewLink] = useState({ title: '', url: '' });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const success = await onAdd(newLink);
    if (success) {
      setNewLink({ title: '', url: '' });
      onCancel();
    }
    setSaving(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-slate-900 border border-white/10 p-6 rounded-2xl shadow-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-400">Link Title</label>
            <input
              type="text"
              required
              placeholder="e.g. My Portfolio"
              className="w-full bg-slate-800 border border-white/5 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet-600 transition-all"
              value={newLink.title}
              onChange={e => setNewLink({ ...newLink, title: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-400">URL</label>
            <input
              type="url"
              required
              placeholder="https://example.com"
              className="w-full bg-slate-800 border border-white/5 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet-600 transition-all"
              value={newLink.url}
              onChange={e => setNewLink({ ...newLink, url: e.target.value })}
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 text-slate-400 hover:text-white transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="bg-violet-600 hover:bg-violet-700 text-white px-8 py-3 rounded-xl font-semibold transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? 'Saving...' : 'Save Link'}
          </button>
        </div>
      </form>
    </motion.div>
  );
}
