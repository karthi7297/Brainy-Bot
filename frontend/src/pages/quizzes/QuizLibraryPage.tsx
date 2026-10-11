import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import type { Quiz } from '../../types';
import { motion } from 'framer-motion';
import { Plus, BookOpen, Search, Play, Edit, Eye, Clock, Globe, Lock, Loader2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

export default function QuizLibraryPage() {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    let cancelled = false;
    api
      .get<{ quizzes: Quiz[] }>('/quizzes')
      .then((res) => {
        if (!cancelled) {
          setQuizzes(res.quizzes ?? []);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) setError((err as Error).message || 'Failed to load quizzes');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(
    () =>
      quizzes.filter((q) => {
        const s = q.title.toLowerCase().includes(search.toLowerCase());
        const f = statusFilter === 'all' || q.status === statusFilter;
        return s && f;
      }),
    [quizzes, search, statusFilter],
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl font-extrabold">My Quizzes</h1>
          <p className="text-text-secondary mt-1">Manage and organize your quiz collection.</p>
        </div>
        <Link to="/quizzes/new" className="btn btn-primary">
          <Plus className="h-4 w-4" />
          Create Quiz
        </Link>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search quizzes..."
            className="input pl-10"
          />
        </div>
        <div className="flex gap-1">
          {['all', 'draft', 'published'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-ghost'} capitalize`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Quiz Grid */}
      {loading ? (
        <div className="glass-card p-16 flex items-center justify-center text-text-muted">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <BookOpen className="h-16 w-16 text-text-muted mx-auto mb-4" />
          <h3 className="font-display text-xl font-bold mb-2">No quizzes found</h3>
          <p className="text-text-secondary mb-6">Create your first quiz to get started!</p>
          <Link to="/quizzes/new" className="btn btn-primary">
            <Plus className="h-4 w-4" />
            Create Quiz
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((quiz, i) => (
            <motion.div
              key={quiz.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <div className="glass-card glass-card-hover overflow-hidden group">
                {/* Cover image */}
                <div className="relative h-40 bg-surface-elevated overflow-hidden">
                  {quiz.cover_image_url ? (
                    <img
                      src={quiz.cover_image_url}
                      alt={quiz.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-500/20 to-accent-violet/20">
                      <BookOpen className="h-12 w-12 text-text-muted" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    <span className={`badge ${quiz.status === 'published' ? 'badge-published' : 'badge-draft'}`}>
                      {quiz.status}
                    </span>
                  </div>
                  <div className="absolute top-3 left-3">
                    {quiz.visibility === 'public' ? (
                      <Globe className="h-4 w-4 text-accent-cyan" />
                    ) : (
                      <Lock className="h-4 w-4 text-accent-amber" />
                    )}
                  </div>
                </div>
                {/* Content */}
                <div className="p-5">
                  <h3 className="font-display font-bold text-lg mb-1 truncate">{quiz.title}</h3>
                  <p className="text-text-secondary text-sm line-clamp-2 mb-4 h-10">{quiz.description}</p>
                  <div className="flex items-center justify-between text-xs text-text-muted">
                    <span>{quiz.question_count} questions</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(quiz.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                  {/* Actions */}
                  <div className="flex gap-2 mt-4 pt-4 border-t border-surface-border">
                    <Link to={`/quizzes/${quiz.id}/edit`} className="btn btn-secondary btn-sm flex-1">
                      <Edit className="h-3.5 w-3.5" />
                      Edit
                    </Link>
                    <Link to={`/quizzes/${quiz.id}/preview`} className="btn btn-ghost btn-sm">
                      <Eye className="h-3.5 w-3.5" />
                    </Link>
                    {quiz.question_count > 0 && (
                      <button
                        onClick={() => navigate(`/host/${quiz.id}`)}
                        className="btn btn-primary btn-sm flex-1"
                      >
                        <Play className="h-3.5 w-3.5" />
                        Host
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
