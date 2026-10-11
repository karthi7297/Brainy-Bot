import { Link } from 'react-router-dom';
import { useGame } from '../../context/GameContext';
import { motion } from 'framer-motion';
import {
  Trophy,
  Crown,
  BarChart3,
  RotateCcw,
  Home,
  Sparkles,
} from 'lucide-react';

export default function PodiumPage() {
  const { session, leaderboard } = useGame();
  const scores = leaderboard;

  const first = scores[0];
  const second = scores[1];
  const third = scores[2];
  const rest = scores.slice(3);

  // Confetti particles effect with motion
  const particles = Array.from({ length: 30 }).map((_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: -10,
    size: Math.random() * 8 + 4,
    color: ['#a465ff', '#4cc9f0', '#ffd400', '#2ecc71', '#ff4f81'][i % 5],
    duration: Math.random() * 2 + 2,
    delay: Math.random() * 1.5,
  }));

  return (
    <div className="min-h-screen bg-surface-dark flex flex-col justify-between p-6 relative overflow-hidden bg-grid-pattern">
      {/* Confetti particles */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ top: '-5%', left: `${p.x}%`, opacity: 1, rotate: 0 }}
          animate={{
            top: '105%',
            rotate: 720,
            opacity: [1, 1, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="absolute rounded-sm pointer-events-none z-10"
          style={{
            width: `${p.size}px`,
            height: `${p.size * 1.5}px`,
            backgroundColor: p.color,
          }}
        />
      ))}

      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-96 bg-brand-500/20 rounded-full blur-[140px] pointer-events-none" />

      {/* Header */}
      <header className="relative z-20 text-center pt-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 text-amber-700 border border-amber-500/30 text-sm font-bold mb-3 shadow-glow-sm"
        >
          <Sparkles className="h-4 w-4" /> Game Completed!
        </motion.div>
        <h1 className="font-display text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-white to-brand-300">
          The Champions Podium
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          {session?.quiz_title || 'Live Game'} &bull; Congratulations to all participants!
        </p>
      </header>

      {/* Podium Centerpiece */}
      <main className="relative z-20 my-auto py-8 max-w-4xl mx-auto w-full">
        <div className="grid grid-cols-3 gap-3 sm:gap-6 items-end justify-center mb-12">
          {/* 2nd Place (Left) */}
          {second && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="flex flex-col items-center"
            >
              <div className="relative mb-3 flex flex-col items-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-slate-300 to-slate-500 flex items-center justify-center text-slate-900 font-extrabold text-2xl shadow-elevated border-2 border-white/40">
                  {second.nickname.slice(0, 2).toUpperCase()}
                </div>
                <div className="absolute -bottom-2 bg-slate-300 text-slate-900 text-xs font-black px-2 py-0.5 rounded-full border border-slate-400/40">
                  2ND
                </div>
              </div>
              <h3 className="font-display font-bold text-base sm:text-lg text-text-primary truncate max-w-[110px] sm:max-w-none text-center">
                {second.nickname}
              </h3>
              <span className="font-mono text-sm sm:text-base font-extrabold text-text-secondary">
                {second.total_score.toLocaleString()} pts
              </span>

              {/* Podium Column */}
              <div className="w-full h-36 sm:h-44 mt-3 rounded-t-2xl bg-surface-card border-t-4 border-slate-300 flex items-center justify-center shadow-card bg-gradient-to-b from-surface-elevated to-surface-card">
                <span className="font-display font-black text-4xl sm:text-6xl text-slate-400/40">
                  2
                </span>
              </div>
            </motion.div>
          )}

          {/* 1st Place (Center - Elevated) */}
          {first && (
            <motion.div
              initial={{ opacity: 0, y: 70 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.6 }}
              className="flex flex-col items-center z-10"
            >
              <div className="relative mb-3 flex flex-col items-center">
                <Crown className="h-8 w-8 text-amber-600 mb-1 animate-bounce" />
                <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-br from-amber-300 via-amber-400 to-amber-600 flex items-center justify-center text-slate-900 font-extrabold text-3xl sm:text-4xl shadow-glow-lg border-4 border-amber-300">
                  {first.nickname.slice(0, 2).toUpperCase()}
                </div>
                <div className="absolute -bottom-2 bg-amber-400 text-slate-900 text-xs font-black px-3 py-0.5 rounded-full border border-slate-400/40 shadow-glow-sm">
                  1ST 👑
                </div>
              </div>
              <h3 className="font-display font-extrabold text-lg sm:text-2xl text-amber-700 truncate max-w-[130px] sm:max-w-none text-center">
                {first.nickname}
              </h3>
              <span className="font-mono text-base sm:text-xl font-black text-text-primary">
                {first.total_score.toLocaleString()} pts
              </span>

              {/* Podium Column */}
              <div className="w-full h-48 sm:h-60 mt-3 rounded-t-2xl bg-gradient-to-b from-amber-500/30 to-surface-card border-t-4 border-amber-500 flex flex-col items-center justify-center shadow-glow-md">
                <Trophy className="h-10 w-10 text-amber-600 mb-1" />
                <span className="font-display font-black text-5xl sm:text-7xl text-amber-500/40">
                  1
                </span>
              </div>
            </motion.div>
          )}

          {/* 3rd Place (Right) */}
          {third && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="flex flex-col items-center"
            >
              <div className="relative mb-3 flex flex-col items-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-amber-700 to-amber-900 flex items-center justify-center text-amber-100 font-extrabold text-2xl shadow-elevated border-2 border-amber-600/40">
                  {third.nickname.slice(0, 2).toUpperCase()}
                </div>
                <div className="absolute -bottom-2 bg-amber-700 text-amber-100 text-xs font-black px-2 py-0.5 rounded-full border border-amber-600">
                  3RD
                </div>
              </div>
              <h3 className="font-display font-bold text-base sm:text-lg text-text-primary truncate max-w-[110px] sm:max-w-none text-center">
                {third.nickname}
              </h3>
              <span className="font-mono text-sm sm:text-base font-extrabold text-text-secondary">
                {third.total_score.toLocaleString()} pts
              </span>

              {/* Podium Column */}
              <div className="w-full h-28 sm:h-36 mt-3 rounded-t-2xl bg-surface-card border-t-4 border-amber-700 flex items-center justify-center shadow-card bg-gradient-to-b from-surface-elevated to-surface-card">
                <span className="font-display font-black text-4xl sm:text-6xl text-amber-700/40">
                  3
                </span>
              </div>
            </motion.div>
          )}
        </div>

        {/* Runner ups table */}
        {rest.length > 0 && (
          <div className="glass-card p-4 rounded-2xl border border-surface-border/80">
            <h4 className="text-xs uppercase font-bold text-text-muted mb-3 px-2">
              Runner Ups
            </h4>
            <div className="space-y-2">
              {rest.slice(0, 4).map((r, i) => (
                <div
                  key={r.participant_id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-surface-elevated/60 text-sm"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 text-center font-bold text-text-muted">{i + 4}th</span>
                    <span className="font-medium text-text-primary">{r.nickname}</span>
                  </div>
                  <span className="font-mono font-bold text-brand-600">
                    {r.total_score.toLocaleString()} pts
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Action Navigation Buttons */}
      <footer className="relative z-20 flex flex-wrap items-center justify-center gap-4 py-4 border-t border-surface-border/60">
        <Link
          to={`/reports/${session?.id || 1}`}
          className="btn btn-primary font-bold shadow-glow-md flex items-center gap-2"
        >
          <BarChart3 className="h-4 w-4" />
          View Full Session Report
        </Link>
        <Link
          to={`/host/${session?.quiz_id || 1}`}
          className="btn btn-secondary font-semibold flex items-center gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Play Again
        </Link>
        <Link
          to="/dashboard"
          className="btn btn-ghost font-semibold flex items-center gap-2"
        >
          <Home className="h-4 w-4" />
          Back to Dashboard
        </Link>
      </footer>
    </div>
  );
}
