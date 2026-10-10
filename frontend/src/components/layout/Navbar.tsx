import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Brain,
  LayoutDashboard,
  BookOpen,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Zap,
} from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navLinks = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/quizzes', label: 'My Quizzes', icon: BookOpen },
    { path: '/reports', label: 'Reports', icon: BarChart3 },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <nav className="sticky top-0 z-50 border-b border-surface-border bg-surface-dark/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-8">
        {/* Logo */}
        <Link to={isAuthenticated ? '/dashboard' : '/'} className="flex items-center gap-2.5 group">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-glow-sm transition-all group-hover:shadow-glow-md">
            <Brain className="h-5 w-5 text-white" />
            <div className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-accent-cyan animate-pulse" />
          </div>
          <span className="font-display text-xl font-bold tracking-tight">
            <span className="text-brand-600">Brainy</span>
            <span className="text-text-primary">Bot</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        {isAuthenticated && (
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive(path)
                    ? 'bg-brand-500/15 text-brand-700'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-elevated'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </div>
        )}

        {/* Right side */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <Link to="/join" className="btn btn-secondary btn-sm hidden sm:inline-flex">
                <Zap className="h-4 w-4 text-accent-amber" />
                Join Game
              </Link>
              <div className="hidden md:flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-brand-400 to-accent-violet flex items-center justify-center text-sm font-bold text-white">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <button onClick={handleLogout} className="btn btn-ghost btn-sm" title="Logout">
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
              {/* Mobile menu toggle */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden btn btn-ghost btn-icon"
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/join" className="btn btn-ghost btn-sm">
                Join Game
              </Link>
              <Link to="/login" className="btn btn-secondary btn-sm">
                Log In
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && isAuthenticated && (
        <div className="md:hidden border-t border-surface-border bg-surface-card animate-slide-up">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive(path)
                    ? 'bg-brand-500/15 text-brand-700'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-elevated'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
            <Link
              to="/join"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-accent-amber hover:bg-surface-elevated"
            >
              <Zap className="h-4 w-4" />
              Join Game
            </Link>
            <hr className="border-surface-border my-2" />
            <button
              onClick={() => { handleLogout(); setMobileOpen(false); }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-surface-elevated w-full text-left"
            >
              <LogOut className="h-4 w-4" />
              Log Out
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
