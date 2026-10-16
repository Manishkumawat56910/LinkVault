import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { UserProfile, Link } from '../types/models';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import { ExternalLink, Instagram, Twitter, Github, Linkedin, Youtube, Globe } from 'lucide-react';
import { UAParser } from 'ua-parser-js';

const platformIcons: Record<string, React.ElementType> = {
  instagram: Instagram,
  twitter: Twitter,
  github: Github,
  linkedin: Linkedin,
  youtube: Youtube,
  website: Globe
};

const PublicProfile = () => {
  const { username } = useParams<{ username: string }>();
  const [data, setData] = useState<{ profile: UserProfile; links: Link[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPublicData = async () => {
      try {
        const response = await fetch(`/api/public/profile/${username}`);
        if (!response.ok) throw new Error('Profile not found');
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError('Profile not found or private');
      } finally {
        setLoading(false);
      }
    };

    fetchPublicData();
  }, [username]);

  // Ensures URLs always have a safe protocol prefix
  const normalizeUrl = (url: string) => {
    if (!url || typeof url !== 'string') return '#';
    const trimmed = url.trim();
    if (/^(javascript|data|vbscript):/i.test(trimmed)) return '#';
    if (!/^https?:\/\//i.test(trimmed)) return `https://${trimmed}`;
    return trimmed;
  };

  const handleLinkClick = (link: Link) => {
    if (!link.id) return;
    
    // Record click analytics (fire-and-forget)
    const parser = new UAParser();
    const result = parser.getResult();
    
    fetch(`/api/public/click/${link.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: link.userId,
        referrer: document.referrer,
        device: result.device.type || 'desktop',
        browser: result.browser.name
      })
    }).catch(err => console.error('Error recording click:', err));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-slate-400 text-xl mb-8">{error}</p>
        <a href="/" className="bg-violet-600 px-8 py-3 rounded-full font-bold">Create Your Own Vault</a>
      </div>
    );
  }

  const { profile, links } = data;

  const themes: Record<string, string> = {
    light: "bg-slate-50 text-slate-900",
    dark: "bg-slate-950 text-white",
    gradient: "bg-gradient-to-br from-violet-900 via-slate-950 to-fuchsia-900 text-white"
  };

  const buttonStyles: Record<string, string> = {
    rounded: "rounded-full",
    square: "rounded-lg",
    outline: "rounded-xl border-2 border-current bg-transparent",
    shadow: "rounded-2xl shadow-xl shadow-black/20"
  };

  // Safe fallbacks in case Firestore data has missing/unexpected values
  const themeClass = themes[profile.theme] ?? themes.dark;
  const buttonStyleClass = buttonStyles[profile.buttonStyle] ?? buttonStyles.rounded;

  return (
    <div className={cn("min-h-screen transition-all duration-500", themeClass)}>
      <div className="max-w-xl mx-auto px-6 py-20 flex flex-col items-center">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center mb-12"
        >
          <div className="relative mb-6">
            <img
              src={profile.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`}
              alt={profile.name || profile.username}
              className="w-24 h-24 rounded-full border-4 border-violet-600/30 p-1 mx-auto object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <h1 className="text-3xl font-bold mb-2">@{profile.username}</h1>
          {profile.bio && <p className="text-lg opacity-80 max-w-sm mx-auto">{profile.bio}</p>}
        </motion.div>

        {/* Links List */}
        <div className="w-full space-y-4">
          {links.map((link, index) => (
            <motion.a
              key={link.id}
              href={normalizeUrl(link.url)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => handleLinkClick(link)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                "block w-full p-4 text-center font-bold text-lg transition-all hover:scale-[1.02] active:scale-[0.98] group relative overflow-hidden",
                profile.theme === 'light' ? "bg-white border border-slate-200" : "bg-white/10 border border-white/10",
                buttonStyleClass
              )}
            >
              <div className="flex items-center justify-center gap-3">
                {link.icon && <span className="text-2xl">{link.icon}</span>}
                <span>{link.title}</span>
              </div>
              <ExternalLink className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-0 group-hover:opacity-50 transition-all" />
            </motion.a>
          ))}
        </div>

        {/* Social Links */}
        {profile.socialLinks && profile.socialLinks.length > 0 && (
          <div className="flex flex-wrap justify-center gap-4 mt-16">
            {profile.socialLinks.map((social, i) => {
              const IconComponent = platformIcons[social.platform.toLowerCase()] || Globe;
              return (
                <a
                  key={i}
                  href={normalizeUrl(social.url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="opacity-70 hover:opacity-100 transition-all hover:scale-110 flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-semibold uppercase tracking-wider"
                  title={social.platform}
                >
                  <IconComponent className="w-4 h-4" />
                  <span>{social.platform}</span>
                </a>
              );
            })}
          </div>
        )}

        {/* Footer Branding */}
        <div className="mt-24 opacity-40 hover:opacity-100 transition-all">
          <a href="/" className="flex items-center gap-2 font-bold tracking-tight">
            <div className="w-6 h-6 bg-violet-600 rounded flex items-center justify-center">
              <span className="text-white text-[10px]">LV</span>
            </div>
            LinkVault
          </a>
        </div>
      </div>
    </div>
  );
};

export default PublicProfile;
