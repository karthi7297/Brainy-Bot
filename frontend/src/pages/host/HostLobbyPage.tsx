import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useGame } from '../../context/GameContext';
import { api } from '../../lib/api';
import type { Quiz } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Play, Copy, Check, QrCode, Volume2, VolumeX, X, ArrowLeft, Sparkles, ShieldCheck, Loader2 } from 'lucide-react';

function formatPin(pin: string): string {
  const digits = pin.replace(/\D/g, '');
  return digits.length === 6 ? `${digits.slice(0, 3)} ${digits.slice(3)}` : pin;
}

export default function HostLobbyPage() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { session, participants, createSession, connectHost, kickPlayer, connected, error, clearError } = useGame();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [creating, setCreating] = useState(true);
  const [copied, setCopied] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showQr, setShowQr] = useState(false);
  const joinedRef = useRef(false);

  // Load the quiz so we can show its title / question count.
  useEffect(() => {
    let cancelled = false;
    api
      .get<{ quiz: Quiz }>(`/quizzes/${quizId}`)
      .then((res) => {
        if (!cancelled) setQuiz(res.quiz);
      })
      .catch(() => {
        if (!cancelled) setQuiz(null);
      });
    return () => {
      cancelled = true;
    };
  }, [quizId]);

  // Create (or reuse) a live session and connect the host socket.
  const setup = useCallback(async () => {
    if (joinedRef.current) return;
    joinedRef.current = true;
    setCreating(true);
    clearError();
    try {
      let active = session;
      if (!active || active.quiz_id !== Number(quizId) || active.status === 'completed' || active.status === 'cancelled') {
        active = await createSession(Number(quizId));
      }
      connectHost(active.id);
    } catch (err) {
      clearError();
      // surface the error below
      console.error(err);
    } finally {
      setCreating(false);
    }
  }, [session, quizId, createSession, connectHost, clearError]);

  useEffect(() => {
    void setup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizId]);

  const copyPin = () => {
    if (!session) return;
    navigator.clipboard.writeText(session.game_pin.replace(/\s+/g, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStartGame = async () => {
    if (!session) return;
    try {
      navigate(`/host/live/${session.quiz_id}`);
    } catch {
      /* handled by live page */
    }
  };

  const joinUrl = `${window.location.origin}/join?pin=${session?.game_pin ?? ''}`;

  return (
    <div className="min-h-screen bg-surface-dark flex flex-col justify-between p-4 lg:p-8 relative overflow-hidden bg-grid-pattern">
      {/* Decorative background glows + Kahoot shapes */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-brand-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-accent-rose/12 rounded-full blur-3xl pointer-events-none" />
      <span className="absolute top-32 left-8 text-[54px] leading-none text-accent-amber/50 select-none pointer-events-none">●</span>
      <span className="absolute bottom-40 left-16 text-[44px] leading-none text-accent-rose/45 select-none pointer-events-none">▲</span>
      <span className="absolute top-1/3 right-12 text-[48px] leading-none text-brand-400/45 select-none pointer-events-none">■</span>

      {/* Top Bar */}
      <header className="relative z-10 flex items-center justify-between border-b border-surface-border/60 pb-4 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <Link to="/quizzes" className="btn btn-ghost btn-sm text-text-secondary hover:text-text-primary">
            <ArrowLeft className="h-4 w-4" />
            Exit Lobby
          </Link>
          <div className="hidden sm:block">
            <h1 className="font-display font-bold text-xl text-text-primary">{quiz?.title ?? 'Loading...'}</h1>
            <p className="text-xs text-text-muted">{quiz?.question_count ?? 0} Questions &bull; Classic Live Mode</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-text-muted">
            <span className={`h-2 w-2 rounded-full ${connected ? 'bg-accent-emerald' : 'bg-accent-amber'} animate-pulse`} />
            {connected ? 'Live' : 'Connecting...'}
          </div>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="btn btn-ghost btn-sm"
            title={soundEnabled ? 'Mute Music' : 'Unmute Music'}
          >
            {soundEnabled ? <Volume2 className="h-4 w-4 text-accent-cyan" /> : <VolumeX className="h-4 w-4" />}
          </button>
          <button onClick={() => setShowQr(!showQr)} className="btn btn-secondary btn-sm">
            <QrCode className="h-4 w-4" />
            <span className="hidden sm:inline">QR Code</span>
          </button>
        </div>
      </header>

      {/* QR Code Modal */}
      <AnimatePresence>
        {showQr && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowQr(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card p-8 max-w-sm w-full text-center relative border border-brand-500/30"
              onClick={(e) => e.stopPropagation()}
            >
              <button onClick={() => setShowQr(false)} className="absolute top-4 right-4 text-text-muted hover:text-text-primary">
                <X className="h-5 w-5" />
              </button>
              <h3 className="font-display font-bold text-xl mb-2">Scan to Join</h3>
              <p className="text-xs text-text-secondary mb-6">Open the join link on a phone to enter the PIN</p>

              <div className="mt-2 text-sm break-all">
                <span className="text-text-muted">Visit: </span>
                <span className="font-mono text-brand-400 font-semibold">{joinUrl}</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Lobby Centerpiece */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center py-8">
        {error && (
          <div className="mb-6 w-full max-w-xl p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        {/* Game PIN Banner */}
        {creating || !session ? (
          <div className="glass-card p-10 rounded-3xl text-center max-w-xl w-full mb-8 flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-brand-400" />
            <p className="text-text-secondary text-sm">Preparing your live lobby...</p>
          </div>
        ) : (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="glass-card border-brand-500/40 p-6 sm:p-8 rounded-3xl text-center max-w-xl w-full shadow-glow-md mb-8"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 text-brand-600 text-xs font-semibold mb-4 border border-brand-500/25">
              <Sparkles className="h-3.5 w-3.5" /> Join at{' '}
              <span className="underline font-mono">{window.location.host}/join</span>
            </div>

            <div className="text-xs uppercase tracking-wider text-text-muted font-bold mb-2">Game PIN</div>

            <div className="flex items-center justify-center gap-4">
              <span className="font-mono text-5xl sm:text-7xl font-extrabold tracking-widest text-brand-700 select-all">
                {formatPin(session.game_pin)}
              </span>
              <button
                onClick={copyPin}
                className="p-3 rounded-2xl bg-surface-elevated hover:bg-surface-hover border border-surface-border text-text-secondary hover:text-brand-700 transition-all shadow-sm"
                title="Copy PIN"
              >
                {copied ? <Check className="h-6 w-6 text-accent-emerald" /> : <Copy className="h-6 w-6" />}
              </button>
            </div>

            {copied && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-accent-emerald mt-2 font-medium"
              >
                Game PIN copied to clipboard!
              </motion.p>
            )}
          </motion.div>
        )}

        {/* Participants Section */}
        <div className="w-full max-w-4xl">
          <div className="flex items-center justify-between mb-4 px-2">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-accent-cyan" />
              <h2 className="font-display font-bold text-xl">Players Joined ({participants.length})</h2>
            </div>
          </div>

          {participants.length === 0 ? (
            <div className="glass-card p-12 text-center border-dashed border-surface-border">
              <div className="h-16 w-16 mx-auto rounded-full bg-brand-500/10 flex items-center justify-center mb-4">
                <Users className="h-8 w-8 text-brand-400 animate-pulse" />
              </div>
              <h3 className="font-display font-bold text-lg mb-1">Waiting for players to join...</h3>
              <p className="text-sm text-text-muted max-w-sm mx-auto">
                Ask players to open <span className="text-brand-600 font-semibold">{window.location.host}/join</span>{' '}
                and enter PIN <span className="font-mono text-text-primary font-bold">{formatPin(session?.game_pin ?? '')}</span>
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              <AnimatePresence>
                {participants.map((player, idx) => (
                  <motion.div
                    key={player.id}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                    className="group relative flex items-center gap-2 p-3 rounded-2xl bg-surface-card border border-surface-border/80 hover:border-brand-500/50 hover:bg-surface-elevated transition-all shadow-sm"
                  >
                    <div
                      className={`h-9 w-9 rounded-xl flex items-center justify-center font-bold text-sm text-white shrink-0 ${
                        ['bg-brand-500', 'bg-accent-cyan', 'bg-accent-emerald', 'bg-accent-amber', 'bg-accent-violet', 'bg-accent-rose'][idx % 6]
                      }`}
                    >
                      {player.nickname.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="font-medium text-sm text-text-primary truncate flex-1">{player.nickname}</span>

                    {/* Kick player button */}
                    <button
                      onClick={() => void kickPlayer(player.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-text-muted hover:text-red-600 hover:bg-red-500/10 rounded-lg transition-all"
                      title="Remove player"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </main>

      {/* Footer Controls */}
      <footer className="relative z-10 border-t border-surface-border/60 pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 backdrop-blur-md">
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <ShieldCheck className="h-4 w-4 text-accent-emerald" />
          <span>Host live session &bull; Real-time WebSocket sync enabled</span>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={handleStartGame}
            disabled={participants.length === 0 || creating || !session}
            className={`btn btn-primary btn-lg w-full sm:w-auto px-8 font-bold shadow-glow-md flex items-center justify-center gap-2 ${
              participants.length === 0 || creating || !session
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:scale-105 active:scale-95'
            }`}
          >
            <Play className="h-5 w-5 fill-current" />
            Start Game ({participants.length})
          </button>
        </div>
      </footer>
    </div>
  );
}
