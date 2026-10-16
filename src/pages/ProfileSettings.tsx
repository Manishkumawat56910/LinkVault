import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { fetchWithAuth } from '../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, User, Globe, Check, AlertCircle, Plus, X, Instagram, Twitter, Github, Linkedin, Youtube, Globe as GlobeIcon } from 'lucide-react';
import { cn } from '../lib/utils';

const ProfileSettings = () => {
  const { user, profile, refreshProfile } = useAuth();
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    bio: '',
    isPublic: true,
    socialLinks: [] as { id?: string, platform: string, url: string }[]
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        username: profile.username || '',
        bio: profile.bio || '',
        isPublic: profile.isPublic ?? true,
        socialLinks: (profile.socialLinks || []).map(link => ({ ...link, id: (link as any).id || crypto.randomUUID() }))
      });
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setSaving(true);

    try {
      const response = await fetchWithAuth(user, '/api/profile', {
        method: 'PUT',
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await refreshProfile();
        showToast('Profile updated successfully!', 'success');
      } else {
        const error = await response.json();
        showToast(error.error || 'Failed to update profile', 'error');
      }
    } catch (error) {
      showToast('An unexpected error occurred', 'error');
    } finally {
      setSaving(false);
    }
  };

  const addSocialLink = () => {
    setFormData({
      ...formData,
      socialLinks: [...formData.socialLinks, { id: crypto.randomUUID(), platform: 'instagram', url: '' }]
    });
  };

  const updateSocialLink = (index: number, field: 'platform' | 'url', value: string) => {
    const newLinks = [...formData.socialLinks];
    newLinks[index] = { ...newLinks[index], [field]: value };
    setFormData({ ...formData, socialLinks: newLinks });
  };

  const removeSocialLink = (index: number) => {
    setFormData({
      ...formData,
      socialLinks: formData.socialLinks.filter((_, i) => i !== index)
    });
  };

  const platforms = [
    { id: 'instagram', icon: Instagram },
    { id: 'twitter', icon: Twitter },
    { id: 'github', icon: Github },
    { id: 'linkedin', icon: Linkedin },
    { id: 'youtube', icon: Youtube },
    { id: 'website', icon: GlobeIcon },
  ];

  return (
    <div className="max-w-2xl pb-20">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
        <p className="text-slate-400 mt-1 text-lg">Update your personal information and public handle.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">

        {/* Basic Info */}
        <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 space-y-6 shadow-xl">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <User className="w-5 h-5 text-violet-400" /> Basic Information
          </h3>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-400">Full Name</label>
            <input
              type="text"
              className="w-full bg-slate-800 border border-white/5 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet-600 transition-all"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="Your Name"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-400">Username</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm pointer-events-none whitespace-nowrap select-none">linkvault.com/p/</span>
              <input
                type="text"
                required
                className="w-full bg-slate-800 border border-white/5 rounded-xl pl-[152px] pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet-600 transition-all"
                value={formData.username}
                onChange={e => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-400">Bio</label>
            <textarea
              rows={3}
              className="w-full bg-slate-800 border border-white/5 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet-600 transition-all resize-none"
              value={formData.bio}
              onChange={e => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Tell the world about yourself..."
              maxLength={160}
            />
          </div>
        </div>

        {/* Social Links */}
        <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 space-y-6 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Globe className="w-5 h-5 text-violet-400" /> Social Links
            </h3>
            <button
              type="button"
              onClick={addSocialLink}
              className="text-violet-400 hover:text-violet-300 text-sm font-bold flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> Add Social
            </button>
          </div>

          <div className="space-y-4">
            <AnimatePresence>
              {formData.socialLinks.map((social, index) => (
                <motion.div
                  key={social.id || index}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-start gap-3 group"
                >
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <select
                      className="bg-slate-800 border border-white/5 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet-600 transition-all capitalize"
                      value={social.platform}
                      onChange={e => updateSocialLink(index, 'platform', e.target.value)}
                    >
                      {platforms.map(p => (
                        <option key={p.id} value={p.id}>{p.id}</option>
                      ))}
                    </select>
                    <input
                      type="url"
                      placeholder="URL"
                      className="sm:col-span-2 bg-slate-800 border border-white/5 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet-600 transition-all"
                      value={social.url}
                      onChange={e => updateSocialLink(index, 'url', e.target.value)}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeSocialLink(index)}
                    className="p-3 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all mt-0.5"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
            {formData.socialLinks.length === 0 && (
              <p className="text-center py-4 text-slate-500 text-sm border border-dashed border-white/10 rounded-xl">
                No social links added yet.
              </p>
            )}
          </div>
        </div>

        {/* Visibility */}
        <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-violet-600/10 rounded-xl flex items-center justify-center">
                <GlobeIcon className="text-violet-400 w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold">Public Profile</h4>
                <p className="text-sm text-slate-500">Allow anyone to view your page.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, isPublic: !formData.isPublic })}
              className={cn(
                "w-12 h-6 rounded-full transition-all relative",
                formData.isPublic ? "bg-violet-600" : "bg-slate-700"
              )}
            >
              <div className={cn(
                "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                formData.isPublic ? "left-7" : "left-1"
              )} />
            </button>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="bg-violet-600 hover:bg-violet-700 text-white px-10 py-4 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-violet-600/20 disabled:opacity-50"
          >
            {saving ? 'Saving...' : (
              <>
                <Save className="w-5 h-5" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfileSettings;
