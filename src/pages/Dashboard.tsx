import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useLinkManager } from '../hooks/useLinkManager';
import { LinkCard } from '../components/LinkCard';
import { AddLinkForm } from '../components/AddLinkForm';
import { Plus, Copy } from 'lucide-react';
import { Reorder } from 'framer-motion';

const Dashboard = () => {
  const { profile } = useAuth();
  const { showToast } = useToast();
  
  const {
    links,
    loading,
    addLink,
    toggleLinkStatus,
    deleteLink,
    saveEdit,
    handleReorder
  } = useLinkManager();

  const [isAdding, setIsAdding] = useState(false);

  const copyPublicUrl = () => {
    if (!profile) return;
    const url = `${window.location.origin}/p/${profile.username}`;
    navigator.clipboard.writeText(url).then(() => {
      showToast('Public profile URL copied!', 'success');
    }).catch(() => {
      showToast('Failed to copy URL', 'error');
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Links</h1>
          <p className="text-slate-400 mt-1 text-lg">Manage and organize your public links.</p>
        </div>
        <div className="flex items-center gap-3">
          {profile && (
            <button
              onClick={copyPublicUrl}
              className="bg-white/5 border border-white/10 text-slate-300 px-4 py-3 rounded-xl font-medium flex items-center gap-2 hover:bg-white/10 transition-all"
              title="Copy public profile URL"
            >
              <Copy className="w-4 h-4" />
              Copy URL
            </button>
          )}
          <button
            onClick={() => setIsAdding(true)}
            className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all shadow-lg shadow-violet-600/20"
          >
            <Plus className="w-5 h-5" />
            Add New Link
          </button>
        </div>
      </div>

      {isAdding && (
        <AddLinkForm 
          onAdd={addLink} 
          onCancel={() => setIsAdding(false)} 
        />
      )}

      {loading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-slate-900/50 animate-pulse rounded-2xl border border-white/5"></div>
          ))}
        </div>
      ) : (
        <Reorder.Group axis="y" values={links} onReorder={handleReorder} className="space-y-4">
          {links.map((link) => (
            <LinkCard
              key={link.id}
              link={link}
              onDelete={deleteLink}
              onToggleStatus={toggleLinkStatus}
              onSaveEdit={saveEdit}
            />
          ))}
          {links.length === 0 && !isAdding && (
            <div className="text-center py-20 bg-slate-900/30 rounded-3xl border border-dashed border-white/10">
              <Plus className="w-12 h-12 text-slate-700 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-400">No links yet</h3>
              <p className="text-slate-500">Click the button above to add your first link!</p>
            </div>
          )}
        </Reorder.Group>
      )}
    </div>
  );
};

export default Dashboard;
