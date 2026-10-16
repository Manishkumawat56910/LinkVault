import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from '../components/AuthModal';
import { motion } from 'framer-motion';
import { PlusCircle, Link as LinkIcon, BarChart3, Shield, ArrowRight } from 'lucide-react';

const Landing = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'register'>('register');

  const openAuthModal = (tab: 'login' | 'register') => {
    setAuthTab(tab);
    setIsAuthModalOpen(true);
  };

  if (loading) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-violet-500/30">
      {/* Navbar */}
      <nav className="max-w-7xl mx-auto px-6 py-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-600/20">
            <PlusCircle className="text-white w-6 h-6" />
          </div>
          <span className="text-2xl font-bold tracking-tight">LinkVault</span>
        </div>
        <div>
          {user ? (
            <Link to="/dashboard" className="bg-white text-black px-6 py-2.5 rounded-full font-semibold hover:bg-slate-200 transition-all">
              Dashboard
            </Link>
          ) : (
            <div className="flex items-center gap-4">
              <button 
                onClick={() => openAuthModal('login')}
                className="text-white hover:text-slate-300 font-medium transition-colors"
              >
                Log in
              </button>
              <button 
                onClick={() => openAuthModal('register')}
                className="bg-violet-600 text-white px-8 py-2.5 rounded-full font-semibold hover:bg-violet-700 transition-all shadow-lg shadow-violet-600/20"
              >
                Get Started
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 pt-20 pb-32 text-center relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-violet-600/10 blur-[120px] -z-10 rounded-full" />
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] mb-8">
            ONE LINK TO <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">
              RULE THEM ALL
            </span>
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed">
            The professional link-in-bio platform for creators, builders, and visionaries. 
            Beautiful, fast, and fully customizable.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={() => openAuthModal('register')}
              className="w-full sm:w-auto bg-white text-black px-10 py-4 rounded-2xl font-bold text-lg hover:scale-105 transition-all flex items-center justify-center gap-2"
            >
              Start Your Vault <ArrowRight className="w-5 h-5" />
            </button>
            <button 
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              className="w-full sm:w-auto bg-white/5 border border-white/10 text-white px-10 py-4 rounded-2xl font-bold text-lg hover:bg-white/10 transition-all"
            >
              View Examples
            </button>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-32 grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { icon: LinkIcon, title: 'Unlimited Links', desc: 'Add as many links as you need. Organize them with drag-and-drop simplicity.' },
          { icon: BarChart3, title: 'Advanced Analytics', desc: 'Track clicks, locations, and devices. Understand your audience like never before.' },
          { icon: Shield, title: 'Privacy First', desc: 'Your data is encrypted and secure. You control what the world sees.' }
        ].map((f, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.2 }}
            className="p-8 bg-white/5 border border-white/10 rounded-3xl hover:border-violet-600/50 transition-all group"
          >
            <div className="w-12 h-12 bg-violet-600/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-all">
              <f.icon className="text-violet-400 w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold mb-4">{f.title}</h3>
            <p className="text-slate-400 leading-relaxed">{f.desc}</p>
          </motion.div>
        ))}
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 text-center text-slate-500">
        <p>© 2026 LinkVault. Built for the modern web.</p>
      </footer>
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        defaultTab={authTab}
      />
    </div>
  );
};

export default Landing;
