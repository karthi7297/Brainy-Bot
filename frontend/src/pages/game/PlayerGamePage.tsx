import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useGame } from '../../context/GameContext';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Flame, Trophy, Clock, Sparkles, Loader2 } from 'lucide-react';

const OPTION_THEMES = [
  { bg: 'bg-[#e21b3c] active:bg-[#c4143a]', shadow: 'shadow-[#e21b3c]/40', shape: '▲', label: 'Triangle' },
  { bg: 'bg-[#1368ce] active:bg-[#0f57ad]', shadow: 'shadow-[#1368ce]/40', shape: '◆', label: 'Diamond' },
  { bg: 'bg-[#d89e00] active:bg-[#b88600]', shadow: 'shadow-[#d89e00]/40', shape: '●', label: 'Circle' },
  { bg: 'bg-[#26890c] active:bg-[#1f7009]', shadow: 'shadow-[#26890c]/40', shape: '■', label: 'Square' },
];

export default function PlayerGamePage() {
  const navigate = useNavigate();
  const {
    gameState,
    currentQuestion,
    currentQuestionIndex,
    totalQuestions,
    timeRemaining,
    player,
    playerSession,
    playerPointsAwarded,
    playerIsCorrect,
    submitAnswer,
    connectPlayer,
    connected,
    error,
  } = useGame();

  const [streak, setStreak] = useState(0);

  // Reconnect on refresh, or bounce to join if there is no player session.
  useEffect(() => {
    if (!playerSession) {
      navigate('/join');
      return;
    }
    if (!connected) {
      connectPlayer(playerSession);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Track streak from answer feedback.
  useEffect(() => {
    if (playerIsCorrect === true) setStreak((s) => s + 1);
    else if (playerIsCorrect === false) setStreak(0);
  }, [playerIsCorrect]);

  if (!playerSession) {
    return (
      <div className="min-h-screen bg-surface-dark flex items-center justify-center text-text-muted">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const q = currentQuestion;
  const options = q?.options || [];
  const answered = playerIsCorrect !== null || playerPointsAwarded !== null;
  const isResultsPhase = gameState === 'question_results';
  const isCompleted = gameState === 'completed';
  const score = player?.total_score ?? 0;

  const handleSelectOption = (optionId: number) => {
    if (answered || isResultsPhase || gameState !== 'question_active') return;
    submitAnswer(optionId);
  };

  return (
    <div className="min-h-screen bg-surface-dark flex flex-col justify-between p-4 max-w-lg mx-auto relative select-none">
      {/* Dynamic ambient backdrop */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-brand-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Player Header */}
      <header className="relative z-10 flex items-center justify-between p-3 rounded-2xl bg-surface-card border border-surface-border/80 shadow-card">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-accent-violet flex items-center justify-center text-white font-black text-sm">
            {player?.nickname?.slice(0, 2).toUpperCase() || 'ME'}
          </div>
          <div>
            <h3 className="font-display font-bold text-sm text-text-primary leading-tight">{player?.nickname || 'Player'}</h3>
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <span>
                Q {Math.max(currentQuestionIndex + 1, 0)}/{totalQuestions || '?'}
              </span>
              {streak > 1 && (
                <span className="flex items-center gap-0.5 text-orange-600 font-bold">
                  <Flame className="h-3 w-3 fill-current" /> {streak} streak
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="text-right">
          <span className="font-mono text-xl font-black text-brand-600">{score.toLocaleString()}</span>
          <span className="text-xs text-text-muted block">pts</span>
        </div>
      </header>

      {error && (
        <div className="relative z-10 mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs text-center">
          {error}
        </div>
      )}

      {/* Main Gameplay Screen */}
      <main className="relative z-10 flex-1 flex flex-col justify-center py-6">
        <AnimatePresence mode="wait">
          {/* 1. GAME COMPLETED */}
          {isCompleted ? (
            <motion.div
              key="game-over"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="glass-card p-8 rounded-3xl border border-brand-500/40 text-center shadow-glow-md"
            >
              <Trophy className="h-16 w-16 text-amber-600 mx-auto mb-3 animate-bounce" />
              <h2 className="font-display text-3xl font-extrabold mb-1">Game Over!</h2>
              <p className="text-xs text-text-secondary mb-6">You gave an awesome performance</p>

              <div className="p-4 rounded-2xl bg-surface-elevated border border-surface-border mb-6">
                <span className="text-xs text-text-muted block">Final Score</span>
                <span className="font-mono text-3xl font-black text-brand-600">{score.toLocaleString()}</span>
              </div>

              <div className="space-y-2">
                <Link to="/join" className="btn btn-primary w-full font-bold">
                  Join Another Game
                </Link>
                <Link to="/" className="btn btn-ghost w-full text-xs">
                  Back to Home
                </Link>
              </div>
            </motion.div>
          ) : isResultsPhase ? (
            /* 2. QUESTION RESULT FEEDBACK (Correct / Incorrect) */
            <motion.div
              key="question-results"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`glass-card p-8 rounded-3xl border-2 text-center shadow-elevated ${
                playerIsCorrect ? 'border-emerald-600 bg-emerald-50 shadow-glow-md' : 'border-red-500/60 bg-red-50'
              }`}
            >
              {playerIsCorrect ? (
                <>
                  <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-4 text-emerald-700">
                    <CheckCircle className="h-10 w-10" />
                  </div>
                  <h2 className="font-display text-3xl font-extrabold text-emerald-700 mb-1">Correct! 🎉</h2>
                  <p className="text-xs text-text-secondary mb-4">Fast and accurate!</p>
                  <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-100 text-emerald-700 font-mono text-lg font-black mb-4">
                    +{playerPointsAwarded ?? 0} pts
                  </div>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-4 text-red-600">
                    <XCircle className="h-10 w-10" />
                  </div>
                  <h2 className="font-display text-3xl font-extrabold text-red-600 mb-1">
                    {answered ? 'Incorrect! ❌' : "Time's up! ⏰"}
                  </h2>
                  <p className="text-xs text-text-secondary mb-4">
                    {answered ? "Don't worry, catch up on the next question!" : 'You missed this one — try the next!'}
                  </p>
                  <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface-elevated text-text-muted font-mono text-sm font-semibold mb-4">+0 pts</div>
                </>
              )}

              <p className="text-xs text-text-muted">Waiting for host to advance to next question...</p>
            </motion.div>
          ) : answered ? (
            /* 3. ANSWER SUBMITTED - WAITING FOR REVEAL */
            <motion.div
              key="submitted-state"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="glass-card p-8 rounded-3xl border border-brand-500/40 text-center shadow-glow-sm"
            >
              <div className="w-16 h-16 rounded-2xl bg-brand-500/20 flex items-center justify-center mx-auto mb-4 text-brand-400 animate-pulse">
                <Sparkles className="h-9 w-9" />
              </div>
              <h2 className="font-display text-2xl font-extrabold mb-1">Answer Locked In!</h2>
              <p className="text-xs text-text-secondary mb-6">Fingers crossed! Waiting for timer or host to reveal results...</p>

              <div className="w-full bg-surface-elevated h-2 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-brand-500 to-accent-cyan"
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
                />
              </div>
            </motion.div>
          ) : (
            /* 4. ACTIVE QUESTION - 4 TACTILE ANSWER BUTTONS */
            <motion.div key="answering-state" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              {/* Question prompt snippet */}
              <div className="glass-card p-4 rounded-2xl border border-surface-border/80 text-center">
                <div className="text-xs text-brand-400 font-bold uppercase mb-1">Select Your Answer</div>
                <h3 className="font-display font-extrabold text-base text-text-primary line-clamp-2">{q?.question_text}</h3>
              </div>

              {/* Large Touch Buttons */}
              <div className="grid grid-cols-2 gap-3">
                {options.map((opt, idx) => {
                  const theme = OPTION_THEMES[idx % OPTION_THEMES.length];
                  return (
                    <motion.button
                      key={opt.id}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleSelectOption(opt.id)}
                      className={`h-36 sm:h-40 rounded-2xl ${theme.bg} shadow-[0_6px_0_rgba(0,0,0,0.35)] text-white font-bold p-4 flex flex-col justify-between text-left transition-all relative overflow-hidden`}
                    >
                      <span className="text-3xl opacity-80 font-mono">{theme.shape}</span>
                      <span className="font-display text-base sm:text-lg leading-snug line-clamp-3 drop-shadow">{opt.option_text}</span>
                    </motion.button>
                  );
                })}
              </div>

              {gameState !== 'question_active' && (
                <div className="text-center text-xs text-text-muted">Waiting for the host to start the question...</div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Timer / Status */}
      <footer className="relative z-10 flex items-center justify-between px-3 py-2 text-xs text-text-muted">
        <div className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-accent-cyan" />
          <span>{timeRemaining > 0 ? `${timeRemaining}s remaining` : 'Time expired'}</span>
        </div>
        <span>Brainy Bot Live</span>
      </footer>
    </div>
  );
}
