import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, Loader2, ArrowRight } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { loginWithGoogle, registerWithEmail, loginWithEmail } from '../lib/auth';
import { useNavigate } from 'react-router-dom';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'login' | 'register';
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, defaultTab = 'register' }) => {
  const [tab, setTab] = useState<'login' | 'register'>(defaultTab);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();
  const { refreshProfile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setTab(defaultTab);
    }
  }, [isOpen, defaultTab]);

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    try {
      await loginWithGoogle();
      await refreshProfile();
      showToast('Logged in with Google!', 'success');
      onClose();
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Google auth error:', error);
      if (error.code === 'auth/popup-closed-by-user') {
        showToast('Sign-in popup was closed.', 'info');
      } else if (error.code === 'auth/cancelled-popup-request') {
        showToast('Sign-in request was cancelled.', 'info');
      } else if (error.code === 'auth/popup-blocked') {
        showToast('Popup was blocked by your browser. Please allow popups.', 'error');
      } else if (error.code === 'auth/unauthorized-domain') {
        showToast('Current domain is not authorized in Firebase Console (Authentication > Settings > Authorized domains).', 'error');
      } else if (error.code === 'auth/operation-not-allowed') {
        showToast('Google Sign-In is not enabled in Firebase Console.', 'error');
      } else {
        showToast(`Google sign-in failed: ${error.message || 'Unknown error'}`, 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      showToast('Please fill in all fields', 'error');
      return;
    }
    
    setIsLoading(true);
    try {
      if (tab === 'register') {
        await registerWithEmail(cleanEmail, password);
        await refreshProfile();
        showToast('Account created successfully!', 'success');
      } else {
        await loginWithEmail(cleanEmail, password);
        await refreshProfile();
        showToast('Welcome back!', 'success');
      }
      onClose();
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Email auth error:', error);
      if (error.code === 'auth/email-already-in-use') {
        showToast('Email already in use. Try logging in.', 'error');
      } else if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
        showToast('Invalid email or password', 'error');
      } else if (error.code === 'auth/weak-password') {
        showToast('Password should be at least 6 characters', 'error');
      } else if (error.code === 'auth/invalid-email') {
        showToast('Please enter a valid email address', 'error');
      } else if (error.code === 'auth/too-many-requests') {
        showToast('Too many attempts. Please try again later.', 'error');
      } else if (error.code === 'auth/operation-not-allowed') {
        showToast('Email/Password auth is not enabled in Firebase Console', 'error');
      } else {
        showToast(`Authentication failed: ${error.message}`, 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 rounded-full transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-8">
              <h2 className="text-2xl font-bold mb-2">
                {tab === 'register' ? 'Create an account' : 'Welcome back'}
              </h2>
              <p className="text-slate-400 mb-8">
                {tab === 'register' 
                  ? 'Start building your LinkVault today.' 
                  : 'Enter your details to access your vault.'}
              </p>

              <form onSubmit={handleEmailAuth} className="space-y-4 mb-6">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-400 pl-1">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                      type="email"
                      required
                      placeholder="you@example.com"
                      className="w-full bg-slate-800 border border-white/5 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet-600 transition-all text-white"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-400 pl-1">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      className="w-full bg-slate-800 border border-white/5 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet-600 transition-all text-white"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      minLength={6}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-violet-600 hover:bg-violet-700 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-2"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      {tab === 'register' ? 'Sign up' : 'Log in'}
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>

              <div className="relative flex items-center mb-6">
                <div className="flex-grow border-t border-white/10" />
                <span className="flex-shrink-0 mx-4 text-slate-500 text-sm">Or continue with</span>
                <div className="flex-grow border-t border-white/10" />
              </div>

              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={isLoading}
                className="w-full bg-white text-black py-3.5 rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-slate-200 transition-all disabled:opacity-50"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                </svg>
                Google
              </button>

              <div className="mt-8 text-center">
                <p className="text-slate-400 text-sm">
                  {tab === 'register' ? 'Already have an account? ' : "Don't have an account? "}
                  <button
                    type="button"
                    onClick={() => setTab(tab === 'register' ? 'login' : 'register')}
                    className="text-violet-400 font-semibold hover:text-violet-300 transition-colors"
                  >
                    {tab === 'register' ? 'Log in here' : 'Sign up here'}
                  </button>
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AuthModal;
