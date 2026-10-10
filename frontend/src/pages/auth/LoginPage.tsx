import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Brain, Mail, Lock, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch {
      setError('Invalid email or password.');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-16 bg-hero-gradient">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 mb-4 shadow-glow-md">
            <Brain className="h-7 w-7 text-white" />
          </div>
          <h1 className="font-display text-3xl font-extrabold">Welcome Back</h1>
          <p className="text-text-secondary mt-2">Sign in to your Brainy Bot account</p>
        </div>

        {/* Form */}
        <div className="glass-card p-8">
          {/* Quick Demo Login Banner */}
          <div className="mb-5 p-3.5 rounded-xl bg-brand-500/10 border border-brand-500/25 flex items-center justify-between">
            <div className="text-xs">
              <span className="font-semibold text-brand-600 block">Demo Account:</span>
              <span className="text-text-secondary font-mono text-[11px]">alex@brainybot.com / password123</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setEmail('alex@brainybot.com');
                setPassword('password123');
              }}
              className="btn btn-secondary btn-sm text-xs py-1 px-2.5"
            >
              Autofill
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-600 text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input pl-10"
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pl-10"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded border-surface-border bg-surface-elevated" />
                <span className="text-text-secondary">Remember me</span>
              </label>
              <a href="#" className="text-brand-400 hover:text-brand-600">Forgot password?</a>
            </div>

            <button type="submit" disabled={isLoading} className="btn btn-primary w-full btn-lg">
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-text-secondary">
            Don't have an account?{' '}
            <Link to="/register" className="text-brand-400 hover:text-brand-600 font-medium">
              Sign up for free
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
