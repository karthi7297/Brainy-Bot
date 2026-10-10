import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { mockSessions, mockReport } from '../../data/mockData';
import {
  BarChart3,
  Calendar,
  Users,
  Trophy,
  Download,
  Printer,
  TrendingUp,
} from 'lucide-react';

export default function ReportsPage() {
  const { sessionId } = useParams();
  const [selectedSessionId, setSelectedSessionId] = useState<number>(
    sessionId ? Number(sessionId) : mockSessions[0]?.id || 1
  );

  const report = mockReport; // mock detailed report
  const selectedSession = mockSessions.find((s) => s.id === selectedSessionId) || mockSessions[0];

  const handleExportCSV = () => {
    const headers = 'Rank,Nickname,Score,Correct,Incorrect\n';
    const rows = report.participants
      .map(
        (p) =>
          `${p.rank},${p.nickname},${p.total_score},${p.correct_count},${p.incorrect_count}`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `brainybot_report_session_${selectedSession.id}.csv`;
    a.click();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl font-extrabold">Reports & Analytics</h1>
          <p className="text-text-secondary mt-1">
            Review detailed live session performance, participant accuracy, and question insights.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={handleExportCSV} className="btn btn-secondary btn-sm">
            <Download className="h-4 w-4" />
            Export CSV
          </button>
          <button onClick={handlePrint} className="btn btn-ghost btn-sm">
            <Printer className="h-4 w-4" />
            Print
          </button>
        </div>
      </div>

      {/* Main Grid: Session Selector on Left, Detailed Report on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Past Sessions List */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-display font-bold text-lg">Hosted Sessions</h3>
            <span className="badge badge-published text-xs">{mockSessions.length} Completed</span>
          </div>

          <div className="space-y-3">
            {mockSessions.map((sess) => {
              const isSelected = sess.id === selectedSessionId;
              return (
                <div
                  key={sess.id}
                  onClick={() => setSelectedSessionId(sess.id)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-brand-500/15 border-brand-500 shadow-glow-sm'
                      : 'glass-card glass-card-hover border-surface-border'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-display font-bold text-base text-text-primary truncate">
                      {sess.quiz_title}
                    </h4>
                    <span className="font-mono text-xs text-text-muted bg-surface-elevated px-2 py-0.5 rounded-md">
                      {sess.game_pin}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-text-secondary mt-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(sess.started_at!).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {report.participant_count} Players
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detailed Session Performance */}
        <div className="lg:col-span-8 space-y-6">
          {/* Overview Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="glass-card p-4 rounded-2xl border border-surface-border">
              <span className="text-xs text-text-muted block">Average Accuracy</span>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-display text-2xl font-black text-accent-emerald">
                  {report.average_accuracy}%
                </span>
                <TrendingUp className="h-4 w-4 text-accent-emerald" />
              </div>
            </div>

            <div className="glass-card p-4 rounded-2xl border border-surface-border">
              <span className="text-xs text-text-muted block">Participants</span>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-display text-2xl font-black text-brand-600">
                  {report.participant_count}
                </span>
                <Users className="h-4 w-4 text-brand-400" />
              </div>
            </div>

            <div className="glass-card p-4 rounded-2xl border border-surface-border">
              <span className="text-xs text-text-muted block">Total Questions</span>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-display text-2xl font-black text-accent-cyan">
                  {report.total_questions}
                </span>
                <BarChart3 className="h-4 w-4 text-accent-cyan" />
              </div>
            </div>

            <div className="glass-card p-4 rounded-2xl border border-surface-border">
              <span className="text-xs text-text-muted block">Top Champion</span>
              <div className="flex items-center gap-1.5 mt-1 truncate">
                <span className="font-display text-lg font-bold text-amber-700 truncate">
                  {report.participants[0]?.nickname}
                </span>
                <Trophy className="h-4 w-4 text-amber-600 shrink-0" />
              </div>
            </div>
          </div>

          {/* Question Breakdown Bars */}
          <div className="glass-card p-6 rounded-3xl border border-surface-border">
            <h3 className="font-display font-bold text-lg mb-4">Question Accuracy Analysis</h3>

            <div className="space-y-4">
              {report.question_results.map((qr, idx) => {
                const accuracy = Math.round((qr.correct_count / qr.total_participants) * 100);
                return (
                  <div key={qr.question_id} className="p-3 rounded-xl bg-surface-elevated/50">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="font-semibold text-text-primary truncate max-w-md">
                        {idx + 1}. {qr.question_text}
                      </span>
                      <span className={`font-mono font-bold ${
                        accuracy >= 70 ? 'text-accent-emerald' : 'text-accent-amber'
                      }`}>
                        {accuracy}% Correct
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-surface-dark h-2.5 rounded-full overflow-hidden flex">
                      <div
                        className="bg-accent-emerald h-full transition-all"
                        style={{ width: `${accuracy}%` }}
                        title="Correct"
                      />
                      <div
                        className="bg-red-500/80 h-full transition-all"
                        style={{ width: `${100 - accuracy}%` }}
                        title="Incorrect"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Participant Standings Table */}
          <div className="glass-card p-6 rounded-3xl border border-surface-border">
            <h3 className="font-display font-bold text-lg mb-4">Participant Standings</h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-surface-border text-xs text-text-muted uppercase">
                    <th className="pb-3 pl-2">Rank</th>
                    <th className="pb-3">Player</th>
                    <th className="pb-3">Score</th>
                    <th className="pb-3">Correct</th>
                    <th className="pb-3">Incorrect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border/50">
                  {report.participants.map((player) => (
                    <tr key={player.id} className="hover:bg-surface-elevated/30 transition-colors">
                      <td className="py-3 pl-2 font-mono font-bold">
                        {player.rank === 1 ? '🥇 1' : player.rank === 2 ? '🥈 2' : player.rank === 3 ? '🥉 3' : `${player.rank}`}
                      </td>
                      <td className="py-3 font-semibold text-text-primary">{player.nickname}</td>
                      <td className="py-3 font-mono font-bold text-brand-600">
                        {player.total_score.toLocaleString()}
                      </td>
                      <td className="py-3 text-emerald-700 font-semibold">{player.correct_count}</td>
                      <td className="py-3 text-red-600 font-semibold">{player.incorrect_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
