import { useState, useEffect } from 'react';
import { useAuth, UserButton } from '@clerk/clerk-react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Sparkles, Briefcase, Cpu, BarChart3, Layout, Server,
  ChevronRight, Loader2, CheckCircle2, ArrowLeft, Award
} from 'lucide-react';
import toast from 'react-hot-toast';
import api, { setAuthToken } from '../lib/api';

const ROLES = [
  { id: 'SDE', label: 'Software Engineer', icon: Cpu },
  { id: 'Data', label: 'Data Analyst', icon: BarChart3 },
  { id: 'Frontend', label: 'Frontend Developer', icon: Layout },
  { id: 'Backend', label: 'Backend Developer', icon: Server },
  { id: 'PM', label: 'Product Manager', icon: Briefcase },
];

const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

export default function Interview() {
  const { resumeId } = useParams();
  const { getToken } = useAuth();
  const navigate = useNavigate();

  const [stage, setStage] = useState('setup'); // setup → questions → results
  const [role, setRole] = useState('SDE');
  const [difficulty, setDifficulty] = useState('Medium');
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [answer, setAnswer] = useState('');
  const [evaluating, setEvaluating] = useState(false);
  const [evaluations, setEvaluations] = useState({}); // { 1: {...}, 2: {...}, ... }

  // ---------- Start the session ----------
  const handleStart = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      setAuthToken(token);
      const { data } = await api.post('/sessions/start', {
        resumeId,
        role,
        difficulty,
      });
      setSession(data.session);
      setStage('questions');
      toast.success('Interview started!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to start interview');
    } finally {
      setLoading(false);
    }
  };

  // ---------- Submit an answer ----------
  const handleSubmitAnswer = async () => {
    if (answer.trim().length < 20) {
      toast.error('Please write a more detailed answer (at least 20 chars)');
      return;
    }
    setEvaluating(true);
    try {
      const token = await getToken();
      setAuthToken(token);
      const { data } = await api.post(`/sessions/${session.id}/answer`, {
        questionNumber: session.questions[currentQ].questionNumber,
        answer,
      });

      // Save the evaluation locally
      setEvaluations((prev) => ({
        ...prev,
        [session.questions[currentQ].questionNumber]: data.evaluation,
      }));

      toast.success('Answer evaluated!');

      // Move to next question OR finish
      if (currentQ < session.questions.length - 1) {
        setCurrentQ(currentQ + 1);
        setAnswer('');
      } else {
        setStage('results');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Evaluation failed');
    } finally {
      setEvaluating(false);
    }
  };

  // ---------- RENDER ----------
  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="flex justify-between items-center px-8 py-4 border-b bg-white">
        <Link to="/dashboard" className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-indigo-600" />
          <span className="font-bold text-xl">InterviewAce</span>
        </Link>
        <UserButton afterSignOutUrl="/" />
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-12">
        {/* ====== STAGE 1: SETUP ====== */}
        {stage === 'setup' && (
          <>
            <Link to="/dashboard" className="inline-flex items-center gap-2 text-slate-600 mb-6 hover:text-slate-900">
              <ArrowLeft className="w-4 h-4" />
              Back to dashboard
            </Link>

            <h1 className="text-3xl font-bold mb-2">Start a mock interview</h1>
            <p className="text-slate-600 mb-8">
              Choose a target role and difficulty. AI will personalize 5 questions based on your resume.
            </p>

            <section className="mb-8">
              <h2 className="text-sm font-semibold uppercase text-slate-500 mb-3">Role</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {ROLES.map((r) => {
                  const Icon = r.icon;
                  return (
                    <button
                      key={r.id}
                      onClick={() => setRole(r.id)}
                      className={`p-4 rounded-xl border-2 text-left transition ${
                        role === r.id
                          ? 'border-indigo-600 bg-indigo-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <Icon className={`w-6 h-6 mb-2 ${role === r.id ? 'text-indigo-600' : 'text-slate-500'}`} />
                      <div className="font-medium text-sm">{r.label}</div>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-sm font-semibold uppercase text-slate-500 mb-3">Difficulty</h2>
              <div className="flex gap-3">
                {DIFFICULTIES.map((d) => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className={`px-6 py-2 rounded-lg border-2 font-medium transition ${
                      difficulty === d
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </section>

            <button
              onClick={handleStart}
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating questions...
                </>
              ) : (
                <>
                  Start Interview
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>
          </>
        )}

        {/* ====== STAGE 2: QUESTIONS ====== */}
        {stage === 'questions' && session && (
          <>
            <div className="flex justify-between items-center mb-6">
              <span className="text-sm font-medium text-slate-500">
                Question {currentQ + 1} of {session.questions.length}
              </span>
              <span className="text-sm font-medium text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                {session.questions[currentQ].type}
              </span>
            </div>

            <div className="bg-white border rounded-xl p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">
                {session.questions[currentQ].question}
              </h2>
              <div className="text-sm text-slate-500">
                <span className="font-medium">Hint — cover these topics:</span>{' '}
                {session.questions[currentQ].expectedTopics.join(', ')}
              </div>
            </div>

            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Type your answer here... (aim for 100-300 words)"
              className="w-full h-48 p-4 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none resize-none"
              disabled={evaluating}
            />
            <div className="text-xs text-slate-500 text-right mt-1">
              {answer.length} characters
            </div>

            <button
              onClick={handleSubmitAnswer}
              disabled={evaluating || answer.trim().length < 20}
              className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {evaluating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Evaluating...
                </>
              ) : currentQ < session.questions.length - 1 ? (
                <>
                  Submit & next question
                  <ChevronRight className="w-5 h-5" />
                </>
              ) : (
                <>
                  Submit & finish interview
                  <CheckCircle2 className="w-5 h-5" />
                </>
              )}
            </button>
          </>
        )}

        {/* ====== STAGE 3: RESULTS ====== */}
        {stage === 'results' && session && (
          <>
            <div className="text-center mb-8">
              <Award className="w-16 h-16 text-indigo-600 mx-auto mb-3" />
              <h1 className="text-3xl font-bold mb-2">Interview complete!</h1>
              <p className="text-slate-600">Here&apos;s your feedback on each question.</p>
            </div>

            {/* Overall summary */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl p-6 mb-8">
              <div className="text-sm uppercase opacity-80 mb-1">Overall score</div>
              <div className="text-5xl font-bold">
                {(() => {
                  const all = Object.values(evaluations).flatMap(e =>
                    [e.scores.content, e.scores.structure, e.scores.technicalDepth]
                  );
                  const avg = all.reduce((s, n) => s + n, 0) / all.length;
                  return avg.toFixed(1);
                })()}
                <span className="text-2xl opacity-70"> / 10</span>
              </div>
            </div>

            {/* Per-question results */}
            <div className="space-y-6">
              {session.questions.map((q) => {
                const evalData = evaluations[q.questionNumber];
                if (!evalData) return null;
                return (
                  <div key={q.questionNumber} className="bg-white border rounded-xl p-6">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <span className="text-xs font-semibold uppercase text-indigo-600">
                          Q{q.questionNumber} · {q.type}
                        </span>
                        <h3 className="font-semibold text-slate-900 mt-1">{q.question}</h3>
                      </div>
                    </div>

                    <div className="flex gap-4 mb-4">
                      <ScoreCard label="Content" score={evalData.scores.content} />
                      <ScoreCard label="Structure" score={evalData.scores.structure} />
                      <ScoreCard label="Depth" score={evalData.scores.technicalDepth} />
                    </div>

                    <div className="bg-slate-50 rounded-lg p-4 mb-3">
                      <div className="text-xs font-semibold uppercase text-slate-500 mb-1">Feedback</div>
                      <p className="text-sm text-slate-700">{evalData.feedback}</p>
                    </div>

                    <details className="bg-emerald-50 rounded-lg p-4">
                      <summary className="cursor-pointer text-xs font-semibold uppercase text-emerald-700">
                        View ideal answer
                      </summary>
                      <p className="text-sm text-slate-700 mt-2">{evalData.idealAnswer}</p>
                    </details>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => navigate('/dashboard')}
              className="mt-8 w-full bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-xl font-semibold"
            >
              Back to dashboard
            </button>
          </>
        )}
      </main>
    </div>
  );
}

// Small reusable component for showing a score
function ScoreCard({ label, score }) {
  const color =
    score >= 8 ? 'text-emerald-600 bg-emerald-50' :
    score >= 6 ? 'text-amber-600 bg-amber-50' :
                 'text-rose-600 bg-rose-50';
  return (
    <div className="flex-1 text-center">
      <div className="text-xs text-slate-500 uppercase mb-1">{label}</div>
      <div className={`text-2xl font-bold rounded-lg py-1 ${color}`}>
        {score}<span className="text-sm opacity-60">/10</span>
      </div>
    </div>
  );
}