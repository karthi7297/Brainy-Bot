import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import {
  User,
  Volume2,
  Save,
  Check,
  Sparkles,
  Sliders,
} from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();

  const [name, setName] = useState(user?.name || 'Alex Thompson');
  const [email, setEmail] = useState(user?.email || 'alex@brainybot.com');
  const [defaultTime, setDefaultTime] = useState('20');
  const [defaultPoints, setDefaultPoints] = useState('1000');
  const [lobbyMusic, setLobbyMusic] = useState(true);
  const [speedBonus, setSpeedBonus] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 lg:px-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-extrabold">Settings</h1>
        <p className="text-text-secondary mt-1">
          Manage your account profile and live game defaults.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Profile Card */}
        <div className="glass-card p-6 sm:p-8 rounded-3xl border border-surface-border">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg">Creator Profile</h2>
              <p className="text-xs text-text-muted">Your public host identity</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="label">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
              />
            </div>
          </div>
        </div>

        {/* Game Host Defaults */}
        <div className="glass-card p-6 sm:p-8 rounded-3xl border border-surface-border">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-accent-cyan/10 border border-accent-cyan/20 flex items-center justify-center text-accent-cyan">
              <Sliders className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg">Live Session Defaults</h2>
              <p className="text-xs text-text-muted">Default parameters applied to newly created questions</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="label">Default Question Timer</label>
              <select
                value={defaultTime}
                onChange={(e) => setDefaultTime(e.target.value)}
                className="input"
              >
                <option value="10">10 Seconds (Fast paced)</option>
                <option value="20">20 Seconds (Standard)</option>
                <option value="30">30 Seconds (Thoughtful)</option>
                <option value="60">60 Seconds (Complex math/science)</option>
              </select>
            </div>

            <div>
              <label className="label">Default Base Points</label>
              <select
                value={defaultPoints}
                onChange={(e) => setDefaultPoints(e.target.value)}
                className="input"
              >
                <option value="500">500 Points</option>
                <option value="1000">1,000 Points (Standard)</option>
                <option value="2000">2,000 Points (High stakes)</option>
              </select>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-surface-border">
            <label className="flex items-center justify-between p-3 rounded-xl bg-surface-elevated/60 cursor-pointer">
              <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-accent-amber" />
                <div>
                  <span className="font-semibold text-sm text-text-primary block">Speed Bonus Scoring</span>
                  <span className="text-xs text-text-muted">Faster answers earn up to 50% additional bonus points</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={speedBonus}
                onChange={(e) => setSpeedBonus(e.target.checked)}
                className="w-5 h-5 rounded accent-brand-500 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-surface-elevated/60 cursor-pointer">
              <div className="flex items-center gap-3">
                <Volume2 className="h-5 w-5 text-accent-cyan" />
                <div>
                  <span className="font-semibold text-sm text-text-primary block">Lobby Music & SFX</span>
                  <span className="text-xs text-text-muted">Play background audio while participants join in lobby</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={lobbyMusic}
                onChange={(e) => setLobbyMusic(e.target.checked)}
                className="w-5 h-5 rounded accent-brand-500 cursor-pointer"
              />
            </label>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-between pt-2">
          {saved && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-sm text-accent-emerald flex items-center gap-1.5 font-semibold"
            >
              <Check className="h-4 w-4" /> Preferences saved successfully!
            </motion.span>
          )}
          {!saved && <span />}

          <button
            type="submit"
            className="btn btn-primary font-bold shadow-glow-md flex items-center gap-2"
          >
            <Save className="h-4 w-4" /> Save Settings
          </button>
        </div>
      </form>
    </div>
  );
}
