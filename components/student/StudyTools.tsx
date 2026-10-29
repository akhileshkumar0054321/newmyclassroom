import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  Loader2,
  Sparkles,
  ArrowRight,
  ChevronDown,
  RotateCcw,
  GraduationCap
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { supabase } from '../../lib/supabase';
import { Badge, Button, Card, EmptyState, ErrorState, Field, IconTile, LoadingStages, SegmentedControl, Skeleton } from './UI';
import { NotesReader } from './NotesReader';

type Persist = (kind: 'NOTE' | 'TEST' | 'RESULT', title: string, content: unknown) => Promise<void>;
type Question = {
  id: number;
  text: string;
  type: string;
  options?: string[];
  correctAnswer?: string;
  modelAnswer?: string;
  explanation?: string;
  marks?: number;
};
type GeneratedTest = { title: string; subject: string; questions: Question[] };

async function postAI<T>(route: string, input: object): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();
  const base = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
  const token = session?.access_token || localStorage.getItem('mc_demo_token') || 'demo-token';
  const response = await fetch(`${base}${route}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(input)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'AI service unavailable. Check your server key.');
  return data as T;
}

export function SmartNotes({ save }: { save: Persist }) {
  const [topic, setTopic] = useState('');
  const [level, setLevel] = useState('College');
  const [detail, setDetail] = useState('Detailed');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [stage, setStage] = useState(0);
  const [subjectStyle, setSubjectStyle] = useState('Conceptual');

  const topicSuggestions = [
    '8085 Interrupts, Vectored Priorities & ISR Cycle',
    'AVL Trees & Self-Balancing Rotations with Examples',
    'Cellular Respiration: Glycolysis & Krebs Cycle ATP Math',
    'Gradient Descent & Learning Rate Convergence in ML'
  ];

  useEffect(() => {
    if (!busy) return;
    setStage(0);
    const tick = setInterval(() => setStage((v) => Math.min(2, v + 1)), 2500);
    return () => clearInterval(tick);
  }, [busy]);

  async function generate(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!topic.trim()) return;
    setBusy(true);
    setError('');
    setSaved(false);
    try {
      const requestedTopic = `${topic.trim()} (Teaching emphasis: ${subjectStyle})`.slice(0, 500);
      const result = await postAI<{ content: string }>('/api/gemini/generate-notes', {
        topic: requestedTopic,
        gradeLevel: level,
        detailLevel: detail
      });
      if (!result.content || result.content.length < (detail === 'Revision' ? 120 : 300)) {
        throw new Error('Incomplete notes received. Please retry.');
      }
      setNotes(result.content);
      await save('NOTE', topic.trim(), { markdown: result.content, level, detail });
      setStage(3);
      setSaved(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6 feature-notes max-w-[1200px] mx-auto">
      <div className="section-heading">
        <IconTile feature="notes">
          <BookOpen />
        </IconTile>
        <div>
          <Badge feature="notes">LEARNING STUDIO</Badge>
          <h1>Notes that actually teach.</h1>
          <p>Structured lessons with intuitive analogies, formulas, worked examples and revision checklists.</p>
        </div>
      </div>

      <div className="notes-studio-grid">
        {/* Lesson Configuration Form */}
        <form onSubmit={generate} className="notes-studio-form">
          <Card feature="notes" className="space-y-5">
            <div>
              <h2 className="text-lg font-extrabold text-[#0F172A]">Create your lesson</h2>
              <p className="text-xs text-[#64748B] mt-1">Specify what concepts you want to master.</p>
            </div>

            <Field label="Topic or study goal">
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                rows={4}
                required
                maxLength={470}
                placeholder="e.g. Explain 8085 interrupts, their priority, masking, and worked assembly examples"
              />
            </Field>

            {/* Quick Suggestions Chips */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-[#64748B]">Try popular topics</span>
              <div className="flex flex-wrap gap-1.5">
                {topicSuggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className="text-[11px] font-medium text-slate-600 hover:text-[#5B5BF0] bg-[#F8F9FD] hover:bg-[#EEF0FF] border border-[#E8EAF3] hover:border-[#DDE1FC] rounded-full px-2.5 py-1 text-left transition-colors"
                    onClick={() => setTopic(s)}
                  >
                    {s.split(':')[0]}
                  </button>
                ))}
              </div>
            </div>

            <Field label="Academic Level">
              <SegmentedControl
                feature="notes"
                values={['School', 'College', 'Competitive exam']}
                value={level}
                onChange={setLevel}
              />
            </Field>

            <Field label="Notes Depth">
              <SegmentedControl
                feature="notes"
                values={['Revision', 'Detailed', 'Comprehensive']}
                value={detail}
                onChange={setDetail}
              />
            </Field>

            <Field label="Teaching Emphasis">
              <div className="flex flex-wrap gap-1.5">
                {['Conceptual', 'Technical', 'Exam focus', 'Examples'].map((s) => (
                  <button
                    type="button"
                    key={s}
                    className={`ui-choice-chip ${subjectStyle === s ? 'selected' : ''}`}
                    onClick={() => setSubjectStyle(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </Field>

            <Button
              feature="notes"
              type="submit"
              disabled={busy || !topic.trim()}
              className="w-full ui-button-primary rounded-full"
            >
              {busy ? <Loader2 className="animate-spin" size={17} /> : <Sparkles size={17} />}
              {busy ? 'Crafting your lesson…' : 'Generate Premium Notes'}
              {!busy && <ArrowRight size={16} />}
            </Button>

            <p className="text-[11px] text-[#94A3B8] text-center">
              Auto-saved to your personal library upon generation.
            </p>
          </Card>
        </form>

        {/* Output & Reader Area */}
        <div className="min-w-0 space-y-4">
          {busy && (
            <Card feature="notes" className="space-y-5">
              <LoadingStages
                step={stage}
                labels={['Outlining structure', 'Writing concepts', 'Adding examples', 'Finalising formulas']}
              />
              <div className="mt-4 pt-4 border-t border-[#E8EAF3]">
                <Skeleton lines={8} />
              </div>
            </Card>
          )}

          {error && (
            <ErrorState
              feature="notes"
              message={error}
              onRetry={() => void generate()}
            />
          )}

          {saved && !busy && (
            <div role="status" className="success-banner">
              <CheckCircle2 size={18} /> Lesson successfully generated and saved to your library!
            </div>
          )}

          {notes ? (
            <Card feature="notes" className="!p-0 overflow-hidden">
              <NotesReader markdown={notes} title={topic} />
            </Card>
          ) : (
            !busy && (
              <Card feature="notes" className="text-center py-12">
                <EmptyState
                  feature="notes"
                  icon={<BookOpen size={24} />}
                  title="Your lesson will appear here"
                  description="Choose a topic on the left or click one of the suggested topics to generate an exam-ready chapter with LaTeX math, analogies, and revision checklists."
                />
              </Card>
            )
          )}
        </div>
      </div>
    </div>
  );
}

export function MockTests({ save }: { save: Persist }) {
  const [requirement, setRequirement] = useState('');
  const [count, setCount] = useState(10);
  const [kind, setKind] = useState('MCQ');
  const [difficulty, setDifficulty] = useState('Medium');
  const [test, setTest] = useState<GeneratedTest | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [result, setResult] = useState<{
    score: number;
    total: number;
    feedback: { id: number; awarded: number; max: number; reason: string }[];
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  const sampleDrills = [
    'SQL Joins, Subqueries & Aggregate GROUP BY clauses',
    'TCP/IP Protocol Suite, 3-Way Handshake & Subnetting',
    'Genetics: DNA Replication, Transcription & Translation',
    'Kinematics & Newton Laws with Real-world Calculus'
  ];

  async function generate(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!requirement.trim()) return;
    setBusy(true);
    setError('');
    setResult(null);
    try {
      const next = await postAI<GeneratedTest>('/api/gemini/generate-test', {
        topic: requirement,
        count,
        questionType: kind,
        difficulty
      });
      if (!Array.isArray(next.questions) || !next.questions.length) {
        throw new Error('No questions returned.');
      }
      setTest(next);
      setAnswers({});
      await save('TEST', next.title || requirement, next);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function submit() {
    if (!test) return;
    setBusy(true);
    setError('');
    try {
      const graded = await postAI<{
        score: number;
        total: number;
        feedback: { id: number; awarded: number; max: number; reason: string }[];
      }>('/api/gemini/grade-test', {
        questions: test.questions,
        answers
      });
      setResult(graded);
      await save('RESULT', `${test.title} — Attempt`, {
        test,
        answers,
        grading: graded,
        completedAt: new Date().toISOString()
      });
      if (graded.total > 0 && graded.score / graded.total >= 0.8) {
        void confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.5 },
          colors: ['#5B5BF0', '#10B981', '#F59E0B', '#8B5CF6']
        });
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const answeredCount = test
    ? test.questions.filter((q) => Boolean(answers[q.id]?.trim())).length
    : 0;

  return (
    <div className={`space-y-6 max-w-[1200px] mx-auto ${kind === 'MCQ' ? 'feature-generator' : 'feature-mock'}`}>
      <div className="section-heading">
        <IconTile feature="mock">
          <ClipboardCheck />
        </IconTile>
        <div>
          <Badge feature="mock">PRACTICE ARENA</Badge>
          <h1>Practice with purpose.</h1>
          <p>Generate interactive curriculum-aligned questions with instant scoring and detailed explanations.</p>
        </div>
      </div>

      {/* Generator Form Card */}
      <form onSubmit={generate} className="ui-card space-y-5">
        <div className="space-y-1">
          <h2 className="text-lg font-extrabold text-[#0F172A]">Configure new practice test</h2>
          <p className="text-xs text-[#64748B]">Set topic, question count, and difficulty level.</p>
        </div>

        <label className="ui-field">
          <span>Syllabus or test topic</span>
          <textarea
            required
            value={requirement}
            onChange={(e) => setRequirement(e.target.value)}
            rows={3}
            maxLength={1500}
            placeholder="e.g. 10 questions on SQL joins, WHERE, GROUP BY, and subqueries with increasing difficulty"
          />
        </label>

        {/* Quick Suggestion Chips */}
        <div className="space-y-1.5">
          <span className="text-xs font-semibold text-[#64748B]">Quick syllabus starters</span>
          <div className="flex flex-wrap gap-1.5">
            {sampleDrills.map((s) => (
              <button
                key={s}
                type="button"
                className="text-[11px] font-medium text-slate-600 hover:text-[#D97706] bg-[#F8F9FD] hover:bg-[#FFFBEB] border border-[#E8EAF3] hover:border-[#FDE68A] rounded-full px-2.5 py-1 text-left transition-colors"
                onClick={() => setRequirement(s)}
              >
                {s.split(':')[0]}
              </button>
            ))}
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <label className="ui-field">
            <span>Question Format</span>
            <select value={kind} onChange={(e) => setKind(e.target.value)}>
              <option value="MCQ">Multiple Choice (MCQ)</option>
              <option value="SHORT">Short answer</option>
              <option value="MIXED">Mixed (MCQ + Short)</option>
            </select>
          </label>

          <label className="ui-field">
            <span>Number of Questions</span>
            <input
              type="number"
              min={1}
              max={30}
              value={count}
              onChange={(e) => setCount(Math.max(1, Math.min(30, Number(e.target.value) || 10)))}
            />
          </label>

          <label className="ui-field">
            <span>Difficulty Level</span>
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
              <option>Easy</option>
              <option>Medium</option>
              <option>Hard</option>
            </select>
          </label>
        </div>

        <div className="flex justify-end pt-2">
          <Button
            feature="generator"
            type="submit"
            disabled={busy || !requirement.trim()}
            className="ui-button-primary rounded-full px-6"
          >
            {busy ? <Loader2 className="animate-spin" size={17} /> : <Sparkles size={17} />}
            {busy ? 'Building question paper…' : 'Generate & Save Test'}
          </Button>
        </div>
      </form>

      {busy && !test && (
        <Card feature="mock">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Loader2 className="animate-spin text-[#059669]" size={20} />
              <p className="text-sm font-bold text-slate-700">Writing challenging questions with explanations…</p>
            </div>
            <Skeleton lines={5} />
          </div>
        </Card>
      )}

      {error && (
        <ErrorState
          feature="mock"
          message={error}
          onRetry={() => void generate()}
        />
      )}

      {/* Active Test Taking View */}
      {test && (
        <div className="space-y-5">
          <Card feature="mock" className="sticky top-20 z-20 shadow-md">
            <div className="flex flex-wrap justify-between items-center gap-3">
              <div>
                <h2 className="text-xl font-extrabold text-[#0F172A]">{test.title}</h2>
                <p className="text-xs text-[#64748B] mt-0.5">
                  {test.questions.length} questions · {test.subject} · {difficulty}
                </p>
              </div>
              <Badge feature="mock">
                {answeredCount}/{test.questions.length} answered
              </Badge>
            </div>

            <div className="test-progress mt-3.5">
              <span style={{ width: `${(100 * answeredCount) / test.questions.length}%` }} />
            </div>
          </Card>

          {/* Question Cards */}
          <div className="space-y-4">
            {test.questions.map((q, i) => {
              const fb = result?.feedback.find((f) => f.id === q.id);
              const correct = fb ? fb.awarded === fb.max : false;

              return (
                <Card
                  feature="mock"
                  key={`${q.id}-${i}`}
                  className={`question-card ${
                    fb ? (correct ? 'question-correct' : 'question-incorrect') : ''
                  }`}
                >
                  <div className="flex justify-between gap-3 items-start">
                    <div className="flex items-start gap-3">
                      <span className="question-number">{i + 1}</span>
                      <h3 className="font-bold text-base text-[#0F172A] pt-1 leading-snug">
                        {q.text}
                      </h3>
                    </div>
                    <Badge feature="mock">{q.marks || 1} marks</Badge>
                  </div>

                  {q.type === 'MCQ' && q.options?.length ? (
                    <div className="grid sm:grid-cols-2 gap-3 mt-4">
                      {q.options.map((option, j) => (
                        <label
                          key={option}
                          className={`answer-choice ${answers[q.id] === option ? 'selected' : ''}`}
                        >
                          <input
                            type="radio"
                            name={`question-${q.id}`}
                            checked={answers[q.id] === option}
                            disabled={Boolean(result)}
                            onChange={() => setAnswers((p) => ({ ...p, [q.id]: option }))}
                          />
                          <span className="answer-letter">{'ABCD'[j] || j + 1}</span>
                          <span className="text-sm font-medium text-slate-800">{option}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <textarea
                      rows={3}
                      className="w-full mt-4"
                      disabled={Boolean(result)}
                      placeholder="Write your answer here"
                      value={answers[q.id] || ''}
                      onChange={(e) => setAnswers((p) => ({ ...p, [q.id]: e.target.value }))}
                    />
                  )}

                  {fb && (
                    <div className="mt-4 p-4 rounded-[16px] bg-[#F8F9FD] border border-[#E8EAF3] space-y-2">
                      <button
                        className="w-full flex justify-between items-center text-sm font-bold text-slate-800 border-0 bg-transparent"
                        aria-expanded={Boolean(expanded[q.id])}
                        onClick={() => setExpanded((p) => ({ ...p, [q.id]: !p[q.id] }))}
                      >
                        <span className={correct ? 'text-emerald-700' : 'text-rose-700'}>
                          {correct ? '✓ Correct' : '✕ Review answer'} · Awarded {fb.awarded}/{fb.max} marks
                        </span>
                        <ChevronDown
                          size={17}
                          className={`transition-transform ${expanded[q.id] ? 'rotate-180' : ''}`}
                        />
                      </button>
                      {expanded[q.id] && (
                        <p className="text-xs text-slate-600 leading-relaxed pt-2 border-t border-[#E8EAF3]">
                          {fb.reason || q.explanation}
                        </p>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>

          {/* Test Submit / Results */}
          {!result ? (
            <div className="flex justify-end pt-2">
              <Button
                feature="mock"
                disabled={busy}
                onClick={submit}
                className="ui-button-primary rounded-full px-8"
              >
                {busy ? <Loader2 className="animate-spin" size={17} /> : <CheckCircle2 size={17} />}
                {busy ? 'Evaluating answers…' : 'Submit for Evaluation'}
              </Button>
            </div>
          ) : (
            <Card feature="mock" className="result-card p-8">
              <div
                className="score-ring"
                style={{
                  background: `conic-gradient(#10B981 ${
                    result.total ? (result.score / result.total) * 100 : 0
                  }%, #E2E8F0 0)`
                }}
              >
                <div>
                  <strong>
                    {result.score}/{result.total}
                  </strong>
                  <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
                    YOUR SCORE
                  </span>
                </div>
              </div>

              <div className="space-y-2 max-w-md">
                <h2 className="text-2xl font-extrabold text-[#0F172A]">
                  {result.total > 0 && result.score / result.total >= 0.8
                    ? 'Outstanding performance!'
                    : 'Great effort, keep practicing!'}
                </h2>
                <p className="text-sm text-[#475569] leading-relaxed">
                  Your attempt has been saved to your library. Review the feedback cards above for detailed model answers.
                </p>
                <div className="pt-2">
                  <Button
                    feature="mock"
                    variant="secondary"
                    className="rounded-full"
                    onClick={() => {
                      setTest(null);
                      setResult(null);
                    }}
                  >
                    <RotateCcw size={15} /> Practice Another Test
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
