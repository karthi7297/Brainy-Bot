import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useGame } from '../../context/GameContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Dice5,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  ArrowLeft,
  Loader2,
} from 'lucide-react';

const RANDOM_NICKNAMES = [
  'TurboCheetah',
  'QuantumFox',
  'BrainyFalcon',
  'CyberNova',
  'PixelPanda',
  'SonicBlaze',
  'AstroTiger',
  'EchoOtter',
];

const AVATAR_COLORS = [
  'from-brand-500 to-brand-700',
  'from-accent-cyan to-blue-600',
  'from-accent-emerald to-teal-700',
  'from-accent-amber to-orange-600',
  'from-accent-rose to-red-600',
  'from-accent-violet to-purple-800',
];

const KAHOOT_BG =
  'linear-gradient(165deg, #5b1fbf 0%, #46178f 45%, #3c00a5 100%)';

export default function JoinGamePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { session, addParticipant, setPlayerParticipant, gameState } = useGame();

  const [step, setStep] = useState<'pin' | 'nickname' | 'waiting'>('pin');
  const [pin, setPin] = useState(searchParams.get('pin') || '');
  const [nickname, setNickname] = useState('');
  const [selectedColor, setSelectedColor] = useState(AVATAR_COLORS[0]);
  const [error, setError] = useState('');

  // Automatically advance to nickname if pin is supplied in query string
  useEffect(() => {
    const queryPin = searchParams.get('pin');
    if (queryPin && queryPin.trim().length >= 4) {
      setPin(queryPin);
      setStep('nickname');
    }
  }, [searchParams]);

  // If already joined and game starts running, redirect player to play screen
  useEffect(() => {
    if (step === 'waiting' && (gameState === 'question_active' || gameState === 'question_locked')) {
      navigate('/play');
    }
  }, [step, gameState, navigate]);

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) {
      setError('Please enter a valid Game PIN');
      return;
    }
    setError('');
    setStep('nickname');
  };

  const handleRandomNickname = () => {
    const random = RANDOM_NICKNAMES[Math.floor(Math.random() * RANDOM_NICKNAMES.length)];
    setNickname(random);
  };

  const handleJoinGame = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) {
      setError('Please choose a nickname');
      return;
    }

    const player = {
      id: Date.now(),
      session_id: session?.id || 1,
      nickname: nickname.trim(),
      total_score: 0,
      status: 'connected' as const,
      joined_at: new Date().toISOString(),
    };

    addParticipant(player.nickname);
    setPlayerParticipant(player);
    setStep('waiting');
  };

  return (
    <div
      className="min-h-screen flex flex-col justify-between items-center p-4 relative overflow-hidden"
      style={{ background: KAHOOT_BG }}
    >
      {/* Decorative Kahoot blobs */}
      <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-white/5 blur-2xl pointer-events-none" />
      <div className="absolute bottom-10 -right-24 w-80 h-80 rounded-full bg-[#ff4f81]/20 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/4 w-64 h-64 rounded-full bg-[#ffd400]/10 blur-3xl pointer-events-none" />

      {/* Top Navbar */}
      <header className="w-full max-w-md flex items-center justify-between pt-4 z-10">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 border border-white/20">
            <Brain className="h-5 w-5 text-white" />
          </div>
          <span className="font-display text-lg font-extrabold text-white tracking-tight">
            BrainyBot
          </span>
        </Link>
        <span className="text-xs font-semibold text-white/70">Player Portal</span>
      </header>

      {/* Join Card Center */}
      <main className="w-full max-w-sm my-auto z-10">
        <AnimatePresence mode="wait">
          {/* STEP 1: ENTER PIN */}
          {step === 'pin' && (
            <motion.div
              key="step-pin"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="bg-white rounded-3xl p-7 sm:p-9 shadow-elevated text-center"
            >
              <h1 className="font-display font-extrabold text-3xl text-[#170b2e] mb-2">
                Game PIN
              </h1>
              <p className="text-sm font-semibold text-[#6b6b8f] mb-7">
                Enter the PIN displayed on the host screen
              </p>

              <form onSubmit={handlePinSubmit} className="space-y-5">
                <div>
                  <input
                    type="text"
                    value={pin}
                    onChange={(e) => {
                      setPin(e.target.value);
                      setError('');
                    }}
                    placeholder="482 951"
                    maxLength={10}
                    inputMode="numeric"
                    autoComplete="off"
                    autoFocus
                    className="w-full text-center font-mono text-4xl sm:text-5xl font-extrabold tracking-[0.18em] py-4 text-[#170b2e] bg-[#f7f5ff] border-2 border-[#e4dcff] rounded-2xl outline-none focus:border-brand-500 focus:bg-white transition-colors placeholder:text-[#cdc4e6]"
                  />
                  {error && (
                    <p className="text-sm font-semibold text-[#e21b3c] mt-3">{error}</p>
                  )}
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-full py-4 text-lg rounded-2xl"
                >
                  Enter
                  <ArrowRight className="h-5 w-5" />
                </button>
              </form>
            </motion.div>
          )}

          {/* STEP 2: ENTER NICKNAME */}
          {step === 'nickname' && (
            <motion.div
              key="step-nickname"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="bg-white rounded-3xl p-7 sm:p-9 shadow-elevated text-center"
            >
              <button
                onClick={() => setStep('pin')}
                className="flex items-center gap-1 text-xs font-semibold text-[#6b6b8f] hover:text-[#46178f] mb-4 -mt-1"
              >
                <ArrowLeft className="h-3 w-3" /> Back
              </button>

              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br p-0.5 mx-auto mb-4 shadow-glow-sm">
                <div className={`w-full h-full rounded-2xl bg-gradient-to-br ${selectedColor} flex items-center justify-center text-white font-extrabold text-2xl`}>
                  {nickname ? nickname.charAt(0).toUpperCase() : '?'}
                </div>
              </div>

              <h2 className="font-display font-extrabold text-2xl text-[#170b2e] mb-1">
                Nickname
              </h2>
              <p className="text-sm font-semibold text-[#6b6b8f] mb-6">
                Pick a name for the leaderboard
              </p>

              <form onSubmit={handleJoinGame} className="space-y-4">
                <div className="relative">
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => {
                      setNickname(e.target.value);
                      setError('');
                    }}
                    placeholder="Your nickname"
                    maxLength={16}
                    autoFocus
                    className="w-full text-center font-bold text-lg py-3.5 pr-11 text-[#170b2e] bg-[#f7f5ff] border-2 border-[#e4dcff] rounded-2xl outline-none focus:border-brand-500 focus:bg-white transition-colors placeholder:text-[#cdc4e6]"
                  />
                  <button
                    type="button"
                    onClick={handleRandomNickname}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6b6b8f] hover:text-brand-500 p-1"
                    title="Random Name"
                  >
                    <Dice5 className="h-6 w-6" />
                  </button>
                </div>

                {/* Color Selector */}
                <div className="flex items-center justify-center gap-2.5 py-1">
                  {AVATAR_COLORS.map((col, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedColor(col)}
                      className={`w-7 h-7 rounded-full bg-gradient-to-br ${col} transition-all ${
                        selectedColor === col
                          ? 'ring-2 ring-[#170b2e] ring-offset-2 scale-110'
                          : 'opacity-60 hover:opacity-100'
                      }`}
                    />
                  ))}
                </div>

                {error && (
                  <p className="text-sm font-semibold text-[#e21b3c]">{error}</p>
                )}

                <button
                  type="submit"
                  className="btn btn-primary w-full py-4 text-lg rounded-2xl"
                >
                  Let's go!
                  <Sparkles className="h-5 w-5" />
                </button>
              </form>
            </motion.div>
          )}

          {/* STEP 3: WAITING ROOM */}
          {step === 'waiting' && (
            <motion.div
              key="step-waiting"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-3xl p-8 shadow-elevated text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center mx-auto mb-4 text-white text-3xl font-extrabold">
                {nickname.charAt(0).toUpperCase()}
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#26890c]/10 text-[#1f7009] text-xs font-bold mb-2">
                <CheckCircle2 className="h-3.5 w-3.5" /> You're in!
              </div>

              <h2 className="font-display font-extrabold text-2xl text-[#170b2e] mb-1">
                {nickname}
              </h2>
              <p className="text-sm font-semibold text-[#6b6b8f] mb-6">
                See your name on the host screen?
              </p>

              <div className="p-4 rounded-2xl bg-[#f7f5ff] border border-[#e4dcff] mb-6">
                <div className="flex items-center justify-center gap-2 text-xs font-semibold text-[#6b6b8f] mb-2">
                  <Loader2 className="h-4 w-4 animate-spin text-brand-500" />
                  <span>Waiting for the host to start the game...</span>
                </div>
                <div className="w-full bg-[#e4dcff] h-1.5 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-brand-500"
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                  />
                </div>
              </div>

              {/* Direct button to enter play console */}
              <button
                onClick={() => navigate('/play')}
                className="btn btn-secondary w-full py-3 rounded-2xl"
              >
                Enter Answering Console
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="text-xs font-semibold text-white/60 text-center py-4 z-10">
        Brainy Bot &bull; Real-time Multiplayer Quiz
      </footer>
    </div>
  );
}
