import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { mockQuizzes, mockQuestions } from '../../data/mockData';
import {
  ArrowLeft,
  Play,
  Edit,
  Eye,
  Clock,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export default function QuizPreviewPage() {
  const { quizId } = useParams();

  const quiz = mockQuizzes.find((q) => q.id === Number(quizId)) || mockQuizzes[0];
  const questions = mockQuestions[quiz.id] || [];

  const [currentIdx, setCurrentIdx] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  const q = questions[currentIdx];

  const handleNext = () => {
    if (currentIdx + 1 < questions.length) {
      setCurrentIdx(currentIdx + 1);
      setShowAnswer(false);
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx(currentIdx - 1);
      setShowAnswer(false);
    }
  };

  if (!q) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h2 className="text-2xl font-bold">No questions found for this quiz.</h2>
        <Link to="/quizzes" className="btn btn-primary mt-4">
          Back to Quizzes
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 lg:px-8">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <Link to="/quizzes" className="btn btn-ghost btn-sm text-text-secondary">
          <ArrowLeft className="h-4 w-4" /> Back to Quizzes
        </Link>
        <div className="flex items-center gap-2">
          <Link to={`/quizzes/${quiz.id}/edit`} className="btn btn-secondary btn-sm">
            <Edit className="h-4 w-4" /> Edit Quiz
          </Link>
          <Link to={`/host/${quiz.id}`} className="btn btn-primary btn-sm font-bold">
            <Play className="h-4 w-4" /> Host Live Game
          </Link>
        </div>
      </div>

      {/* Quiz Title Banner */}
      <div className="glass-card p-6 rounded-3xl border border-surface-border mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/10 text-brand-400 text-xs font-semibold mb-2">
              <Eye className="h-3.5 w-3.5" /> Rehearsal & Preview Mode
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold">{quiz.title}</h1>
            <p className="text-sm text-text-secondary mt-1">{quiz.description}</p>
          </div>
          <div className="text-right hidden sm:block">
            <span className="font-mono text-xl font-bold text-brand-600">
              {currentIdx + 1} / {questions.length}
            </span>
            <span className="text-xs text-text-muted block">Questions</span>
          </div>
        </div>
      </div>

      {/* Question Card */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl border border-surface-border mb-6 relative">
        <div className="flex items-center justify-between text-xs text-text-muted mb-4">
          <span className="uppercase font-bold tracking-wider text-brand-400">
            Question {currentIdx + 1} &bull; {q.question_type === 'true_false' ? 'True / False' : 'Multiple Choice'}
          </span>
          <div className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 text-accent-cyan" />
            <span>{q.time_limit_seconds}s limit &bull; {q.base_points} pts</span>
          </div>
        </div>

        <h2 className="font-display text-xl sm:text-2xl font-bold text-text-primary mb-6">
          {q.question_text}
        </h2>

        {/* Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {q.options.map((opt) => {
            const isCorrect = opt.is_correct;
            return (
              <div
                key={opt.id}
                className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-between ${
                  showAnswer && isCorrect
                    ? 'bg-emerald-50 border-emerald-600 text-emerald-700 shadow-glow-sm'
                    : 'bg-surface-elevated border-surface-border text-text-primary'
                }`}
              >
                <span className="font-medium">{opt.option_text}</span>
                {showAnswer && isCorrect && (
                  <CheckCircle className="h-5 w-5 text-emerald-700 shrink-0" />
                )}
              </div>
            );
          })}
        </div>

        {/* Answer Reveal Toggle */}
        <div className="flex items-center justify-between pt-4 border-t border-surface-border">
          <button
            onClick={() => setShowAnswer(!showAnswer)}
            className="btn btn-secondary btn-sm"
          >
            {showAnswer ? 'Hide Correct Answer' : 'Reveal Correct Answer'}
          </button>

          {showAnswer && q.explanation && (
            <p className="text-xs text-text-secondary max-w-md italic text-right">
              &quot;{q.explanation}&quot;
            </p>
          )}
        </div>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between">
        <button
          onClick={handlePrev}
          disabled={currentIdx === 0}
          className="btn btn-ghost btn-sm"
        >
          <ChevronLeft className="h-4 w-4" /> Previous
        </button>

        <div className="flex items-center gap-1">
          {questions.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                setCurrentIdx(i);
                setShowAnswer(false);
              }}
              className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                i === currentIdx
                  ? 'bg-brand-500 text-white shadow-glow-sm'
                  : 'bg-surface-elevated text-text-muted hover:text-text-primary'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>

        <button
          onClick={handleNext}
          disabled={currentIdx + 1 >= questions.length}
          className="btn btn-ghost btn-sm"
        >
          Next <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
