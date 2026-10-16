import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { logout } from '../lib/auth';
import { 
  LayoutDashboard, 
  User, 
  Settings, 
  LogOut, 
  ExternalLink,
  PlusCircle,
  BarChart3,
  Copy
} from 'lucide-react';
import { cn } from '../lib/utils';

const Sidebar = () => {
  const { user, profile } = useAuth();
  const { showToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { icon: LayoutDashboard, label: 'Links', path: '/dashboard' },
    { icon: BarChart3, label: 'Analytics', path: '/analytics' },
    { icon: User, label: 'Profile', path: '/settings/profile' },
    { icon: Settings, label: 'Appearance', path: '/settings/appearance' },
  ];

  const handleCopyUrl = () => {
    if (!profile) return;
    const url = `${window.location.origin}/p/${profile.username}`;
    navigator.clipboard.writeText(url).then(() => {
      showToast('Profile URL copied!', 'success');
    });
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
      showToast('Logged out successfully', 'info');
    } catch (error) {
      showToast('Failed to logout', 'error');
    }
  };

  return (
    <div className="w-64 bg-slate-900 border-r border-white/10 h-screen flex flex-col fixed left-0 top-0">
      <div className="p-6">
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
            <PlusCircle className="text-white w-5 h-5" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">LinkVault</span>
        </Link>
      </div>

      {/* User avatar section */}
      {user && (
        <div className="px-6 pb-4">
          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
            <img
              src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`}
              alt="Avatar"
              className="w-9 h-9 rounded-full object-cover border-2 border-violet-600/30"
              referrerPolicy="no-referrer"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{profile?.name || user.displayName || 'User'}</p>
              <p className="text-xs text-slate-500 truncate">{profile?.username ? `@${profile.username}` : user.email}</p>
            </div>
          </div>
        </div>
      )}

      <nav className="flex-1 px-4 space-y-1">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
              location.pathname === item.path
                ? "bg-violet-600 text-white shadow-lg shadow-violet-600/20"
                : "text-slate-400 hover:bg-white/5 hover:text-white"
            )}
          >
            <item.icon className={cn(
              "w-5 h-5",
              location.pathname === item.path ? "text-white" : "text-slate-400 group-hover:text-white"
            )} />
            <span className="font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-white/10 space-y-1">
        {profile && (
          <>
            <a
              href={`/p/${profile.username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-white/5 hover:text-white transition-all group"
            >
              <ExternalLink className="w-5 h-5" />
              <span className="font-medium">My Public Page</span>
            </a>
            <button
              onClick={handleCopyUrl}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-white/5 hover:text-white transition-all"
            >
              <Copy className="w-5 h-5" />
              <span className="font-medium">Copy URL</span>
            </button>
          </>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
