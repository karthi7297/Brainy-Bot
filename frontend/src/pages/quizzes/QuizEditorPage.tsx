import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../lib/api';
import type { Question, Quiz, QuestionType } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Plus,
  Trash2,
  GripVertical,
  Check,
  Clock,
  Star,
  Eye,
  Save,
  Send,
  ChevronDown,
  ChevronUp,
  Copy,
  Image,
  Type,
  ToggleLeft,
  AlertCircle,
  BookOpen,
  Loader2,
} from 'lucide-react';

const OPTION_COLORS = ['bg-option-red', 'bg-option-blue', 'bg-option-yellow', 'bg-option-green'];
const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

function toPayload(q: Question) {
  let imageUrl: string | null = null;
  if (q.image_url) {
    try {
      new URL(q.image_url);
      imageUrl = q.image_url;
    } catch {
      imageUrl = null;
    }
  }
  return {
    question_text: q.question_text.trim(),
    question_type: q.question_type,
    time_limit_seconds: q.time_limit_seconds,
    base_points: q.base_points,
    image_url: imageUrl,
    explanation: q.explanation?.trim() || null,
    options: q.options.map((o, i) => ({
      option_text: o.option_text.trim(),
      position: i + 1,
      is_correct: o.is_correct,
    })),
  };
}

function blankQuestion(type: QuestionType): Question {
  const base = {
    id: -Date.now(),
    quiz_id: 0,
    question_text: '',
    question_type: type,
    position: 1,
    time_limit_seconds: 20,
    base_points: 1000,
    options: [],
  };
  if (type === 'true_false') {
    return {
      ...base,
      options: [
        { id: -Date.now() - 1, question_id: base.id, option_text: 'True', position: 1, is_correct: true },
        { id: -Date.now() - 2, question_id: base.id, option_text: 'False', position: 2, is_correct: false },
      ],
    };
  }
  return {
    ...base,
    options: [1, 2, 3, 4].map((n) => ({
      id: -Date.now() - n,
      question_id: base.id,
      option_text: '',
      position: n,
      is_correct: n === 1,
    })),
  };
}

export default function QuizEditorPage() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const isNew = quizId === 'new';

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track which questions have unsaved field edits.
  const dirtyRef = useRef<Set<number>>(new Set());
  const activeIdxRef = useRef<number | null>(null);

  // Load existing quiz + questions
  useEffect(() => {
    if (isNew) return;
    let cancelled = false;
    api
      .get<{ quiz: Quiz & { questions: Question[] } }>(`/quizzes/${quizId}`)
      .then((res) => {
        if (cancelled) return;
        const q = res.quiz;
        setQuiz(q);
        setTitle(q.title);
        setDescription(q.description ?? '');
        const qs = (q.questions ?? []).map((question, i) => ({ ...question, position: i + 1 }));
        setQuestions(qs);
        setActiveIdx(qs.length > 0 ? 0 : null);
        setError(null);
      })
      .catch((err) => {
        if (!cancelled) setError((err as Error).message || 'Failed to load quiz');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [quizId, isNew]);

  const activeQuestion = activeIdx !== null ? questions[activeIdx] : null;

  const markDirty = (id: number) => dirtyRef.current.add(id);

  // Persist quiz metadata (title/description), creating the quiz if needed.
  const ensureQuiz = useCallback(async (): Promise<number> => {
    if (quiz) {
      await api.put(`/quizzes/${quiz.id}`, { title, description });
      return quiz.id;
    }
    const res = await api.post<{ quiz: Quiz }>('/quizzes', {
      title: title.trim() || 'Untitled Quiz',
      description,
    });
    setQuiz(res.quiz);
    return res.quiz.id;
  }, [quiz, title, description]);

  // Save a single question (create or update) to the server.
  const persistQuestion = useCallback(
    async (question: Question): Promise<Question> => {
      const quizIdNum = question.quiz_id || quiz?.id;
      if (!quizIdNum) throw new Error('Quiz not saved yet');
      const payload = toPayload(question);
      if (question.id > 0) {
        const res = await api.put<{ question: Question }>(
          `/quizzes/questions/${question.id}`,
          payload,
        );
        return res.question;
      }
      const res = await api.post<{ question: Question }>(`/quizzes/${quizIdNum}/questions`, payload);
      return res.question;
    },
    [quiz],
  );

  // Flush any unsaved edits for the currently active question.
  const flushActive = useCallback(async () => {
    if (activeIdx === null) return;
    const q = questions[activeIdx];
    if (!q || !dirtyRef.current.has(q.id)) return;
    const savedQ = await persistQuestion({ ...q, quiz_id: q.quiz_id || quiz?.id || 0 });
    dirtyRef.current.delete(q.id);
    setQuestions((prev) => prev.map((item) => (item.id === q.id ? { ...savedQ } : item)));
  }, [activeIdx, questions, persistQuestion, quiz]);

  const handleAddQuestion = async (type: QuestionType) => {
    setError(null);
    try {
      await flushActive();
      const idNum = await ensureQuiz();
      const res = await api.post<{ question: Question }>(`/quizzes/${idNum}/questions`, {
        ...toPayload(blankQuestion(type)),
        question_text: type === 'true_false' ? 'True or False?' : 'New question',
      });
      const created = { ...res.question, quiz_id: idNum };
      setQuestions((prev) => [...prev, created]);
      setActiveIdx(questions.length);
    } catch (err) {
      setError((err as Error).message || 'Failed to add question');
    }
  };

  const handleDeleteQuestion = async (idx: number) => {
    const q = questions[idx];
    setError(null);
    try {
      if (q.id > 0) {
        await api.delete(`/quizzes/questions/${q.id}`);
      }
      dirtyRef.current.delete(q.id);
      const updated = questions
        .filter((_, i) => i !== idx)
        .map((item, i) => ({ ...item, position: i + 1 }));
      setQuestions(updated);
      dirtyRef.current.clear();
      if (activeIdx === null) return;
      if (activeIdx === idx) {
        setActiveIdx(updated.length > 0 ? Math.min(idx, updated.length - 1) : null);
      } else if (activeIdx > idx) {
        setActiveIdx(activeIdx - 1);
      }
    } catch (err) {
      setError((err as Error).message || 'Failed to delete question');
    }
  };

  const handleDuplicateQuestion = async (idx: number) => {
    const orig = questions[idx];
    setError(null);
    try {
      await flushActive();
      const idNum = orig.quiz_id || quiz?.id || 0;
      const res = await api.post<{ question: Question }>(`/quizzes/${idNum}/questions`, {
        ...toPayload(orig),
        question_text: `${orig.question_text} (copy)`,
      });
      const dup = { ...res.question, quiz_id: idNum };
      setQuestions((prev) => [...prev, dup]);
      setActiveIdx(questions.length);
    } catch (err) {
      setError((err as Error).message || 'Failed to duplicate question');
    }
  };

  const updateActive = (patch: Partial<Question>) => {
    if (activeIdx === null) return;
    const q = questions[activeIdx];
    markDirty(q.id);
    setQuestions((prev) => prev.map((item, i) => (i === activeIdx ? { ...item, ...patch } : item)));
  };

  const updateOption = (optionIdx: number, field: 'option_text' | 'is_correct', value: unknown) => {
    if (activeIdx === null) return;
    const q = questions[activeIdx];
    markDirty(q.id);
    setQuestions((prev) =>
      prev.map((item, i) => {
        if (i !== activeIdx) return item;
        const newOptions = item.options.map((o, oi) => {
          if (oi !== optionIdx) {
            if (field === 'is_correct' && value === true) return { ...o, is_correct: false };
            return o;
          }
          return { ...o, [field]: value };
        });
        return { ...item, options: newOptions };
      }),
    );
  };

  const addOption = () => {
    if (activeIdx === null) return;
    const q = questions[activeIdx];
    markDirty(q.id);
    const newOpt = {
      id: -Date.now(),
      question_id: q.id,
      option_text: '',
      position: q.options.length + 1,
      is_correct: false,
    };
    setQuestions((prev) =>
      prev.map((item, i) => (i === activeIdx ? { ...item, options: [...item.options, newOpt] } : item)),
    );
  };

  const moveQuestion = async (idx: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? idx - 1 : idx + 1;
    if (target < 0 || target >= questions.length) return;
    const updated = [...questions];
    [updated[idx], updated[target]] = [updated[target], updated[idx]];
    const reordered = updated.map((q, i) => ({ ...q, position: i + 1 }));
    setQuestions(reordered);
    if (activeIdx === idx) setActiveIdx(target);
    else if (activeIdx === target) setActiveIdx(idx);

    // Persist ordering for saved questions.
    if (quiz) {
      try {
        await api.put(`/quizzes/${quiz.id}/questions/order`, {
          order: reordered.map((q) => q.id),
        });
      } catch (err) {
        setError((err as Error).message || 'Failed to reorder questions');
      }
    }
  };

  const handleSave = async () => {
    setError(null);
    setSaving(true);
    try {
      await flushActive();
      const idNum = await ensureQuiz();
      // Persist any remaining dirty questions.
      for (const q of questions) {
        if (dirtyRef.current.has(q.id)) {
          const savedQ = await persistQuestion({ ...q, quiz_id: q.quiz_id || idNum });
          dirtyRef.current.delete(q.id);
          setQuestions((prev) => prev.map((item) => (item.id === q.id ? { ...savedQ } : item)));
        }
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      if (isNew && !quizId) {
        navigate(`/quizzes/${idNum}/edit`, { replace: true });
      }
    } catch (err) {
      setError((err as Error).message || 'Failed to save quiz');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    setError(null);
    setSaving(true);
    try {
      await flushActive();
      const idNum = await ensureQuiz();
      for (const q of questions) {
        if (dirtyRef.current.has(q.id)) {
          const savedQ = await persistQuestion({ ...q, quiz_id: q.quiz_id || idNum });
          dirtyRef.current.delete(q.id);
          setQuestions((prev) => prev.map((item) => (item.id === q.id ? { ...savedQ } : item)));
        }
      }
      await api.post(`/quizzes/${idNum}/publish`);
      navigate('/quizzes');
    } catch (err) {
      setError((err as Error).message || 'Failed to publish quiz');
    } finally {
      setSaving(false);
    }
  };

  // Flush the outgoing question whenever the active question changes.
  useEffect(() => {
    const prev = activeIdxRef.current;
    if (prev !== null && prev !== activeIdx) {
      void (async () => {
        const q = questions[prev];
        if (q && dirtyRef.current.has(q.id)) {
          try {
            const savedQ = await persistQuestion({ ...q, quiz_id: q.quiz_id || quiz?.id || 0 });
            dirtyRef.current.delete(q.id);
            setQuestions((list) => list.map((item) => (item.id === q.id ? { ...savedQ } : item)));
          } catch {
            /* keep local edits; user can hit Save */
          }
        }
      })();
    }
    activeIdxRef.current = activeIdx;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIdx]);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center text-text-muted">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {/* Top Bar */}
      <div className="sticky top-16 z-40 border-b border-surface-border bg-surface-dark/95 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 lg:px-8 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => navigate(-1)} className="btn btn-ghost btn-icon btn-sm">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Untitled Quiz"
              className="bg-transparent border-none text-xl font-display font-bold text-text-primary placeholder:text-text-muted focus:outline-none min-w-0 flex-1"
            />
          </div>
          <div className="flex items-center gap-2">
            {quiz && (
              <Link to={`/quizzes/${quiz.id}/preview`} className="btn btn-ghost btn-sm">
                <Eye className="h-4 w-4" />
                <span className="hidden sm:inline">Preview</span>
              </Link>
            )}
            <button onClick={handleSave} disabled={saving} className="btn btn-secondary btn-sm">
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : saved ? (
                <Check className="h-4 w-4 text-accent-emerald" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">{saved ? 'Saved!' : 'Save Draft'}</span>
            </button>
            <button onClick={handlePublish} disabled={saving} className="btn btn-primary btn-sm">
              <Send className="h-4 w-4" />
              <span className="hidden sm:inline">Publish</span>
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 lg:px-8 py-6">
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2">
            <AlertCircle className="h-4 w-4" /> {error}
          </div>
        )}

        {/* Description */}
        <div className="mb-6">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a description for your quiz..."
            rows={2}
            className="input resize-none text-sm"
          />
        </div>

        <div className="grid lg:grid-cols-[280px_1fr] gap-6">
          {/* Left Sidebar: Question List */}
          <div className="glass-card p-4 h-fit lg:sticky lg:top-36">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-text-secondary">Questions ({questions.length})</h3>
            </div>

            <div className="space-y-1 max-h-[60vh] overflow-y-auto pr-1">
              {questions.map((q, i) => (
                <button
                  key={q.id}
                  onClick={() => setActiveIdx(i)}
                  className={`w-full text-left p-3 rounded-lg text-sm transition-all flex items-center gap-2 group ${
                    activeIdx === i
                      ? 'bg-brand-500/15 border border-brand-500/30 text-brand-400'
                      : 'hover:bg-surface-elevated text-text-secondary'
                  }`}
                >
                  <GripVertical className="h-3.5 w-3.5 text-text-muted opacity-0 group-hover:opacity-100 flex-shrink-0" />
                  <span className="font-mono text-xs text-text-muted w-5">{i + 1}</span>
                  <span className="truncate flex-1">{q.question_text || 'Untitled question'}</span>
                  <span className="text-xs text-text-muted flex-shrink-0">
                    {q.question_type === 'true_false' ? 'T/F' : 'MC'}
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-3 space-y-1.5">
              <button
                onClick={() => handleAddQuestion('multiple_choice')}
                className="btn btn-secondary btn-sm w-full justify-center"
              >
                <Type className="h-4 w-4 text-brand-400" />
                Multiple Choice
              </button>
              <button
                onClick={() => handleAddQuestion('true_false')}
                className="btn btn-secondary btn-sm w-full justify-center"
              >
                <ToggleLeft className="h-4 w-4 text-accent-cyan" />
                True / False
              </button>
            </div>
          </div>

          {/* Right: Question Editor */}
          <div className="flex-1">
            <AnimatePresence mode="wait">
              {activeQuestion ? (
                <motion.div
                  key={activeQuestion.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="glass-card p-6 space-y-6"
                >
                  {/* Question header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="badge badge-published text-xs">Q{activeIdx! + 1}</span>
                      <span className="text-sm text-text-muted capitalize">
                        {activeQuestion.question_type.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => moveQuestion(activeIdx!, 'up')}
                        disabled={activeIdx === 0}
                        className="btn btn-ghost btn-icon btn-sm disabled:opacity-30"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => moveQuestion(activeIdx!, 'down')}
                        disabled={activeIdx === questions.length - 1}
                        className="btn btn-ghost btn-icon btn-sm disabled:opacity-30"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDuplicateQuestion(activeIdx!)}
                        className="btn btn-ghost btn-icon btn-sm"
                        title="Duplicate"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteQuestion(activeIdx!)}
                        className="btn btn-ghost btn-icon btn-sm text-red-600 hover:text-red-700"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Question text */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">Question Text</label>
                    <textarea
                      value={activeQuestion.question_text}
                      onChange={(e) => updateActive({ question_text: e.target.value })}
                      placeholder="Type your question here..."
                      rows={3}
                      className="input resize-none text-lg"
                    />
                  </div>

                  {/* Image URL */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      <Image className="inline h-4 w-4 mr-1" />
                      Image URL (optional)
                    </label>
                    <input
                      type="url"
                      value={activeQuestion.image_url || ''}
                      onChange={(e) => updateActive({ image_url: e.target.value })}
                      placeholder="https://example.com/image.jpg"
                      className="input text-sm"
                    />
                  </div>

                  {/* Answer Options */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-3">Answer Options</label>
                    <div className="space-y-3">
                      {activeQuestion.options.map((opt, oi) => (
                        <div key={opt.id} className="flex items-center gap-3">
                          <div
                            className={`h-10 w-10 rounded-xl ${OPTION_COLORS[oi]} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}
                          >
                            {OPTION_LABELS[oi]}
                          </div>
                          <input
                            type="text"
                            value={opt.option_text}
                            onChange={(e) => updateOption(oi, 'option_text', e.target.value)}
                            placeholder={`Option ${OPTION_LABELS[oi]}`}
                            className="input flex-1"
                            disabled={activeQuestion.question_type === 'true_false'}
                          />
                          <button
                            onClick={() => updateOption(oi, 'is_correct', true)}
                            className={`p-2.5 rounded-xl transition-all ${
                              opt.is_correct
                                ? 'bg-accent-emerald/20 border border-accent-emerald/50 text-accent-emerald'
                                : 'bg-surface-elevated border border-surface-border text-text-muted hover:border-accent-emerald/30'
                            }`}
                            title={opt.is_correct ? 'Correct answer' : 'Mark as correct'}
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                    {activeQuestion.question_type === 'multiple_choice' && activeQuestion.options.length < 8 && (
                      <button onClick={addOption} className="btn btn-ghost btn-sm mt-3">
                        <Plus className="h-4 w-4" />
                        Add Option
                      </button>
                    )}
                  </div>

                  {/* Settings */}
                  <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t border-surface-border">
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-text-secondary mb-2">
                        <Clock className="h-4 w-4" />
                        Time Limit (seconds)
                      </label>
                      <div className="flex items-center gap-2">
                        {[10, 15, 20, 30, 60].map((s) => (
                          <button
                            key={s}
                            onClick={() => updateActive({ time_limit_seconds: s })}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                              activeQuestion.time_limit_seconds === s
                                ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30'
                                : 'bg-surface-elevated text-text-muted hover:text-text-secondary'
                            }`}
                          >
                            {s}s
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-text-secondary mb-2">
                        <Star className="h-4 w-4" />
                        Base Points
                      </label>
                      <div className="flex items-center gap-2">
                        {[250, 500, 750, 1000].map((p) => (
                          <button
                            key={p}
                            onClick={() => updateActive({ base_points: p })}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                              activeQuestion.base_points === p
                                ? 'bg-accent-amber/20 text-accent-amber border border-accent-amber/30'
                                : 'bg-surface-elevated text-text-muted hover:text-text-secondary'
                            }`}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Explanation */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      <AlertCircle className="inline h-4 w-4 mr-1" />
                      Explanation (shown after answer)
                    </label>
                    <textarea
                      value={activeQuestion.explanation || ''}
                      onChange={(e) => updateActive({ explanation: e.target.value })}
                      placeholder="Optional: Explain the correct answer..."
                      rows={2}
                      className="input resize-none text-sm"
                    />
                  </div>
                </motion.div>
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-12 text-center">
                  <BookOpen className="h-16 w-16 text-text-muted mx-auto mb-4" />
                  <h3 className="font-display text-xl font-bold mb-2">Start Adding Questions</h3>
                  <p className="text-text-secondary text-sm mb-6 max-w-md mx-auto">
                    Click the buttons below to add your first question. You can create multiple-choice or true/false
                    questions.
                  </p>
                  <div className="flex justify-center gap-3">
                    <button onClick={() => handleAddQuestion('multiple_choice')} className="btn btn-primary">
                      <Type className="h-4 w-4" />
                      Multiple Choice
                    </button>
                    <button onClick={() => handleAddQuestion('true_false')} className="btn btn-secondary">
                      <ToggleLeft className="h-4 w-4" />
                      True / False
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
