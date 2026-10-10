import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { mockQuizzes, mockSessions } from '../../data/mockData';
import { motion } from 'framer-motion';
import {
  Plus,
  BookOpen,
  Users,
  Trophy,
  TrendingUp,
  Clock,
  Play,
  Edit,
  MoreHorizontal,
  Search,
  Filter,
} from 'lucide-react';
import { useState } from 'react';

export default function DashboardPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredQuizzes = mockQuizzes.filter((q) => {
    const matchesSearch = q.title.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || q.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = [
    { label: 'Total Quizzes', value: mockQuizzes.length, icon: BookOpen, color: 'text-brand-400', bg: 'bg-brand-400/10' },
    { label: 'Games Hosted', value: mockSessions.length, icon: Play, color: 'text-accent-cyan', bg: 'bg-accent-cyan/10' },
    { label: 'Total Players', value: 14, icon: Users, color: 'text-accent-emerald', bg: 'bg-accent-emerald/10' },
    { label: 'Avg. Accuracy', value: '72%', icon: TrendingUp, color: 'text-accent-amber', bg: 'bg-accent-amber/10' },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-3xl font-extrabold"
          >
            Welcome back, {user?.name?.split(' ')[0] || 'Creator'} 👋
          </motion.h1>
          <p className="text-text-secondary mt-1">Here's what's happening with your quizzes.</p>
        </div>
        <Link to="/quizzes/new" className="btn btn-primary">
          <Plus className="h-4 w-4" />
          Create Quiz
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-5"
          >
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${stat.bg}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div>
                <div className="font-display text-2xl font-extrabold">{stat.value}</div>
                <div className="text-text-muted text-xs">{stat.label}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <Link
          to="/quizzes/new"
          className="glass-card glass-card-hover p-5 flex items-center gap-4 group"
        >
          <div className="p-3 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 group-hover:shadow-glow-sm transition-all">
            <Plus className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="font-semibold">Create New Quiz</div>
            <div className="text-text-muted text-sm">Start from scratch</div>
          </div>
        </Link>
        <Link
          to="/join"
          className="glass-card glass-card-hover p-5 flex items-center gap-4 group"
        >
          <div className="p-3 rounded-xl bg-gradient-to-br from-accent-cyan to-brand-400 group-hover:shadow-glow-sm transition-all">
            <Play className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="font-semibold">Join a Game</div>
            <div className="text-text-muted text-sm">Enter a game PIN</div>
          </div>
        </Link>
        <Link
          to="/reports"
          className="glass-card glass-card-hover p-5 flex items-center gap-4 group"
        >
          <div className="p-3 rounded-xl bg-gradient-to-br from-accent-amber to-accent-rose group-hover:shadow-glow-sm transition-all">
            <Trophy className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="font-semibold">View Reports</div>
            <div className="text-text-muted text-sm">Game history & analytics</div>
          </div>
        </Link>
      </div>

      {/* My Quizzes */}
      <div className="glass-card">
        <div className="p-5 border-b border-surface-border">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="font-display text-xl font-bold">My Quizzes</h2>
            <div className="flex items-center gap-3">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search quizzes..."
                  className="input pl-10 py-2 text-sm"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="input pl-10 py-2 pr-8 text-sm appearance-none cursor-pointer"
                >
                  <option value="all">All</option>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {filteredQuizzes.length === 0 ? (
          <div className="p-12 text-center">
            <BookOpen className="h-12 w-12 text-text-muted mx-auto mb-4" />
            <h3 className="font-display text-lg font-bold mb-2">No quizzes found</h3>
            <p className="text-text-secondary text-sm mb-4">
              {search ? 'Try a different search term.' : "You haven't created any quizzes yet."}
            </p>
            <Link to="/quizzes/new" className="btn btn-primary btn-sm">
              <Plus className="h-4 w-4" />
              Create Your First Quiz
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-surface-border">
            {filteredQuizzes.map((quiz, i) => (
              <motion.div
                key={quiz.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className="p-5 hover:bg-surface-elevated/30 transition-colors group"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    {quiz.cover_image_url ? (
                      <img
                        src={quiz.cover_image_url}
                        alt={quiz.title}
                        className="h-12 w-16 rounded-lg object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="h-12 w-16 rounded-lg bg-surface-elevated flex items-center justify-center flex-shrink-0">
                        <BookOpen className="h-5 w-5 text-text-muted" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <Link
                        to={`/quizzes/${quiz.id}`}
                        className="font-semibold text-text-primary hover:text-brand-400 transition-colors truncate block"
                      >
                        {quiz.title}
                      </Link>
                      <div className="flex items-center gap-3 mt-1 text-xs text-text-muted">
                        <span>{quiz.question_count} questions</span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(quiz.updated_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`badge ${
                        quiz.status === 'published'
                          ? 'badge-published'
                          : quiz.status === 'draft'
                          ? 'badge-draft'
                          : 'badge-archived'
                      }`}
                    >
                      {quiz.status}
                    </span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link
                        to={`/quizzes/${quiz.id}/edit`}
                        className="btn btn-ghost btn-icon btn-sm"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </Link>
                      {quiz.status === 'published' && (
                        <Link
                          to={`/host/${quiz.id}`}
                          className="btn btn-primary btn-sm"
                          title="Host Game"
                        >
                          <Play className="h-3.5 w-3.5" />
                          Host
                        </Link>
                      )}
                      <button className="btn btn-ghost btn-icon btn-sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Sessions */}
      <div className="mt-8 glass-card">
        <div className="p-5 border-b border-surface-border">
          <h2 className="font-display text-xl font-bold">Recent Games</h2>
        </div>
        <div className="divide-y divide-surface-border">
          {mockSessions.map((session) => (
            <div key={session.id} className="p-5 flex items-center justify-between hover:bg-surface-elevated/30 transition-colors">
              <div className="flex items-center gap-4">
                <div className="p-2.5 rounded-xl bg-accent-emerald/10">
                  <Trophy className="h-5 w-5 text-accent-emerald" />
                </div>
                <div>
                  <div className="font-semibold">{session.quiz_title}</div>
                  <div className="text-xs text-text-muted mt-0.5">
                    PIN: {session.game_pin} · {new Date(session.started_at!).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <Link to={`/reports/${session.id}`} className="btn btn-ghost btn-sm">
                View Report
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
