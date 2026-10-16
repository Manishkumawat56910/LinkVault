import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { fetchWithAuth } from '../lib/api';
import { motion } from 'framer-motion';
import { Palette, Layout, MousePointer2, Check, Save } from 'lucide-react';
import { cn } from '../lib/utils';

const AppearanceSettings = () => {
  const { user, profile, refreshProfile } = useAuth();
  const { showToast } = useToast();
  const [theme, setTheme] = useState<'light' | 'dark' | 'gradient'>('dark');
  const [buttonStyle, setButtonStyle] = useState<'rounded' | 'square' | 'outline' | 'shadow'>('rounded');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setTheme(profile.theme || 'dark');
      setButtonStyle(profile.buttonStyle || 'rounded');
    }
  }, [profile]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const response = await fetchWithAuth(user, '/api/profile', {
        method: 'PUT',
        body: JSON.stringify({ theme, buttonStyle })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        showToast(errorData.error || 'Failed to save appearance', 'error');
        return;
      }
      
      await refreshProfile();
      showToast('Appearance updated successfully!', 'success');
    } catch (error) {
      showToast('Network error: Could not save appearance', 'error');
    } finally {
      setSaving(false);
    }
  };

  const themes = [
    { id: 'light', label: 'Light', colors: 'bg-slate-50 border-slate-200' },
    { id: 'dark', label: 'Dark', colors: 'bg-slate-900 border-white/10' },
    { id: 'gradient', label: 'Gradient', colors: 'bg-gradient-to-br from-violet-600 to-fuchsia-600 border-transparent' }
  ];

  const styles = [
    { id: 'rounded', label: 'Rounded', class: 'rounded-full' },
    { id: 'square', label: 'Square', class: 'rounded-lg' },
    { id: 'outline', label: 'Outline', class: 'rounded-xl border-2 border-white bg-transparent' },
    { id: 'shadow', label: 'Shadow', class: 'rounded-2xl shadow-xl shadow-black/40' }
  ];

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Appearance</h1>
        <p className="text-slate-400 mt-1 text-lg">Customize how your public page looks to visitors.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-10">
          {/* Theme Selection */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-slate-400 mb-2">
              <Palette className="w-5 h-5" />
              <h3 className="font-semibold uppercase tracking-wider text-sm">Theme</h3>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {themes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id as any)}
                  className={cn(
                    "relative aspect-square rounded-2xl border-2 transition-all overflow-hidden group",
                    theme === t.id ? "border-violet-600 scale-105" : "border-white/5 hover:border-white/20"
                  )}
                >
                  <div className={cn("absolute inset-0", t.colors)} />
                  {theme === t.id && (
                    <div className="absolute top-2 right-2 bg-violet-600 rounded-full p-1">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                  <span className={cn(
                    "absolute bottom-2 left-2 text-xs font-bold",
                    t.id === 'light' ? "text-slate-900" : "text-white"
                  )}>{t.label}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Button Style Selection */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-slate-400 mb-2">
              <MousePointer2 className="w-5 h-5" />
              <h3 className="font-semibold uppercase tracking-wider text-sm">Button Style</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {styles.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setButtonStyle(s.id as any)}
                  className={cn(
                    "p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-3",
                    buttonStyle === s.id ? "border-violet-600 bg-violet-600/5" : "border-white/5 hover:border-white/20 bg-slate-900"
                  )}
                >
                  <div className={cn("w-full h-10 bg-white/10 border border-white/10", s.class)} />
                  <span className="text-sm font-medium">{s.label}</span>
                </button>
              ))}
            </div>
          </section>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-violet-600 hover:bg-violet-700 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-violet-600/20 disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Saving...' : 'Save Appearance'}
          </button>
        </div>

        {/* Preview Section */}
        <div className="hidden lg:block">
          <div className="sticky top-8">
            <div className="flex items-center gap-2 text-slate-400 mb-4">
              <Layout className="w-5 h-5" />
              <h3 className="font-semibold uppercase tracking-wider text-sm">Live Preview</h3>
            </div>
            <div className={cn(
              "w-[320px] aspect-[9/16] rounded-[3rem] border-8 border-slate-800 shadow-2xl overflow-hidden mx-auto transition-all duration-500",
              theme === 'light' ? "bg-slate-50" : theme === 'dark' ? "bg-slate-950" : "bg-gradient-to-br from-violet-900 via-slate-950 to-fuchsia-900"
            )}>
              <div className="p-8 flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-violet-600/20 border-2 border-violet-600/30 mb-3 flex items-center justify-center overflow-hidden">
                  <img
                    src={profile?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.username || 'user'}`}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className={cn("text-sm font-bold mb-1", theme === 'light' ? "text-slate-900" : "text-white")}>
                  @{profile?.username || 'username'}
                </div>
                <div className={cn("text-[11px] mb-6 line-clamp-1 max-w-[200px] text-center", theme === 'light' ? "text-slate-500" : "text-slate-400")}>
                  {profile?.bio || 'Your bio will show here'}
                </div>
                
                <div className="w-full space-y-3">
                  {[1, 2, 3].map(i => (
                    <div 
                      key={i} 
                      className={cn(
                        "w-full h-10 flex items-center justify-center text-[10px] font-bold",
                        theme === 'light' ? "bg-white border border-slate-200 text-slate-900" : "bg-white/10 border border-white/10 text-white",
                        buttonStyle === 'rounded' && "rounded-full",
                        buttonStyle === 'square' && "rounded-md",
                        buttonStyle === 'outline' && "rounded-lg border-2 border-current bg-transparent",
                        buttonStyle === 'shadow' && "rounded-xl shadow-lg shadow-black/20"
                      )}
                    >
                      LINK {i}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppearanceSettings;
