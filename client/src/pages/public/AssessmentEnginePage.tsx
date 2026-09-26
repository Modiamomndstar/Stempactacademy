import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Assessment, AssessmentQuestion } from '../../types';
import { Badge, Card, LoadingSpinner } from '../../components/UIElements';
import {
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Send,
  ArrowRight,
  ShieldCheck,
  Award,
  Play,
  X,
  FileCheck,
} from 'lucide-react';

export const AssessmentEnginePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const applicationId = searchParams.get('appId') || searchParams.get('applicationId');
  const programId = searchParams.get('programId');
  const { user, portalRoute } = useAuth();
  const navigate = useNavigate();

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(1800); // 30 mins default
  const [hasStarted, setHasStarted] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [resultData, setResultData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    const fetchAssessment = async () => {
      try {
        const data = await api.getAssessment({
          applicationId: applicationId || undefined,
          programId: programId || undefined,
        });
        setAssessment(data.assessment);
        if (data.assessment?.durationMinutes) {
          setTimeLeft(data.assessment.durationMinutes * 60);
        }
      } catch (err) {
        console.error('Failed to load assessment:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAssessment();
  }, [applicationId, programId]);

  // Countdown Timer (Only runs after user starts)
  useEffect(() => {
    if (!hasStarted || isSubmitted || loading || !assessment) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmitFinal();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [hasStarted, isSubmitted, loading, assessment]);

  const handleSelectOption = (questionId: string, optionText: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionText,
    }));
  };

  const handleSubmitFinal = async () => {
    if (!assessment) return;
    setShowConfirmModal(false);
    setSubmitting(true);
    setErrorMsg('');

    try {
      const response = await api.submitAssessmentAttempt({
        applicationId: applicationId || undefined,
        programId: programId || undefined,
        assessmentId: assessment.id,
        answers,
      });
      setResultData(response);
      setIsSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error('Submit assessment error:', err);
      setErrorMsg(err.message || 'Failed to submit assessment answers. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  if (loading) {
    return <LoadingSpinner message="Loading STEMPACT Diagnostic Placement Engine..." />;
  }

  if (!assessment || !assessment.questions || assessment.questions.length === 0) {
    return (
      <div className="max-w-xl mx-auto py-20 px-4 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
          <HelpCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">No Assessment Found</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          Diagnostic assessments are linked to an active student application. Please start by submitting an online application first.
        </p>
        <Link to="/apply" className="inline-block px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-md">
          Start Application
        </Link>
      </div>
    );
  }

  // Pre-test Instructions Screen
  if (!hasStarted) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 space-y-8">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-10 shadow-xl space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <Badge variant="blue">Diagnostic Placement Test</Badge>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
                {assessment.title}
              </h1>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            This diagnostic placement assessment evaluates baseline competencies across digital literacy, analytical logic, mathematics, and problem-solving. Your results help the Academic Board recommend your optimal cohort level.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-slate-400 font-bold uppercase text-[10px]">Questions</div>
              <div className="text-base font-black text-slate-900 mt-0.5">
                {assessment.questions.length} Items
              </div>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-slate-400 font-bold uppercase text-[10px]">Time Limit</div>
              <div className="text-base font-black text-blue-600 mt-0.5">
                {assessment.durationMinutes || 30} Minutes
              </div>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-slate-400 font-bold uppercase text-[10px]">Format</div>
              <div className="text-base font-black text-slate-900 mt-0.5">
                Multiple Choice
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1.5">
            <div className="font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-700" />
              <span>Assessment Rules & Security:</span>
            </div>
            <ul className="list-disc pl-5 space-y-1 text-[11px] text-amber-800">
              <li>Ensure you have a stable internet connection in a quiet environment.</li>
              <li>Once you click Start, the timer will begin countdown automatically.</li>
              <li>You may navigate back and forth between questions before submitting.</li>
              <li>Calculators and scratch pads are allowed. No external collaboration.</li>
            </ul>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => setHasStarted(true)}
              className="flex-1 py-3.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4" />
              <span>Start Assessment Now</span>
            </button>
            <Link
              to="/portal/applicant"
              className="py-3.5 px-6 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs text-center transition-colors"
            >
              Return to Portal
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Completed / Submitted Screen
  if (isSubmitted && resultData) {
    return (
      <div className="max-w-3xl mx-auto py-16 px-4 space-y-8">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto">
            <Award className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <Badge variant="blue">Assessment Completed</Badge>
            <h1 className="text-3xl font-black text-slate-900">
              Diagnostic Placement Profile Generated
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto">
              Your test score and categorical competencies have been computed and routed to the Academic Board.
            </p>
          </div>

          {/* Score & Automated Recommendation Card */}
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 border-b border-slate-200 pb-4">
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Total Score</div>
                <div className="text-2xl font-black text-slate-900 font-mono">
                  {resultData.attempt?.score} / {resultData.attempt?.maxScore}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Percentage</div>
                <div className="text-2xl font-black text-blue-600 font-mono">
                  {resultData.attempt?.percentage}%
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Readiness Status</div>
                <div className="text-sm font-bold text-emerald-600 mt-1">
                  Qualified for Admission
                </div>
              </div>
            </div>

            {/* Recommended Placement */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Automated Placement Recommendation
              </div>
              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-1.5">
                <div className="text-sm font-extrabold text-slate-900">
                  Recommended Track: {resultData.attempt?.recommendedProgram}
                </div>
                <div className="text-xs font-bold text-blue-600">
                  Recommended Level: {resultData.attempt?.recommendedLevel}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed pt-1">
                  <strong>Evaluator Rationale:</strong> {resultData.attempt?.recommendationReason}
                </p>
              </div>
            </div>

            {/* Mandatory Academic Board Notice */}
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-xs text-amber-900">
              <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold">Academic Review Safeguard:</strong> In accordance with STEMPACT admissions policy, this automated placement recommendation is currently undergoing formal review and ratification by the Academic Board. Once ratified, your official Offer of Admission will be accessible in your portal.
              </div>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <Link
              to="/portal/applicant"
              className="py-3 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-colors"
            >
              Go to Applicant Portal
            </Link>
            <Link
              to="/"
              className="py-3 px-6 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
            >
              Return Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const currentQ = assessment.questions[currentQuestionIndex];
  let optionsList: string[] = [];
  try {
    optionsList = JSON.parse(currentQ.options);
  } catch (e) {
    optionsList = [];
  }

  const answeredCount = Object.keys(answers).length;

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Assessment Header with Countdown Timer */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-1">
          <Badge variant="blue">STEMPACT Placement Engine</Badge>
          <h1 className="text-xl sm:text-2xl font-black text-white">{assessment.title}</h1>
          <p className="text-xs text-slate-400">
            Measures baseline readiness across Logic, Digital Problem Solving, and Applied Mathematics.
          </p>
        </div>

        {/* Live Timer */}
        <div className="flex items-center gap-3 bg-slate-800/90 border border-slate-700 rounded-2xl px-5 py-3 shrink-0">
          <Clock className={`w-5 h-5 ${timeLeft < 300 ? 'text-rose-400 animate-pulse' : 'text-amber-400'}`} />
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-bold">Time Remaining</div>
            <div className={`text-xl font-black tracking-widest font-mono ${timeLeft < 300 ? 'text-rose-400' : 'text-white'}`}>
              {formatTimer(timeLeft)}
            </div>
          </div>
        </div>
      </div>

      {/* Question Navigation Chips */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center justify-between gap-4 overflow-x-auto">
        <div className="flex items-center gap-1.5">
          {assessment.questions.map((q, idx) => {
            const hasAnswered = answers[q.id] !== undefined;
            const isCurrent = idx === currentQuestionIndex;
            return (
              <button
                key={q.id}
                type="button"
                onClick={() => setCurrentQuestionIndex(idx)}
                className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                  isCurrent
                    ? 'bg-blue-600 text-white ring-2 ring-blue-300'
                    : hasAnswered
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
        <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">
          {answeredCount} of {assessment.questions.length} answered
        </span>
      </div>

      {/* Active Question Card */}
      <Card className="p-8 sm:p-10 space-y-6 shadow-md border-t-4 border-t-blue-600 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-800 font-extrabold text-[11px] uppercase">
              Question {currentQuestionIndex + 1} of {assessment.questions.length}
            </span>
            <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-600 font-bold text-[11px]">
              {currentQ.category.replace(/_/g, ' ')}
            </span>
          </div>
          <span className="text-xs font-bold text-amber-600 font-mono">+{currentQ.points} Points</span>
        </div>

        {/* Question Prompt */}
        <div className="space-y-4">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-relaxed whitespace-pre-line">
            {currentQ.prompt}
          </h2>

          {/* Options */}
          <div className="space-y-3 pt-2">
            {optionsList.map((opt, oIdx) => {
              const selected = answers[currentQ.id] === opt;
              return (
                <button
                  key={oIdx}
                  type="button"
                  onClick={() => handleSelectOption(currentQ.id, opt)}
                  className={`w-full text-left p-4 rounded-xl text-xs font-medium border transition-all flex items-center justify-between cursor-pointer ${
                    selected
                      ? 'bg-blue-50 border-blue-600 text-blue-900 font-bold shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                        selected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {String.fromCharCode(65 + oIdx)}
                    </span>
                    <span>{opt}</span>
                  </div>
                  {selected && <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Navigation & Submit Buttons */}
        <div className="flex items-center justify-between pt-6 border-t border-slate-100">
          <button
            type="button"
            disabled={currentQuestionIndex === 0 || submitting}
            onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
            className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-30 cursor-pointer"
          >
            Previous
          </button>

          <div className="flex items-center gap-3">
            {currentQuestionIndex < assessment.questions.length - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentQuestionIndex((prev) => Math.min(assessment.questions.length - 1, prev + 1))}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <span>Next Question</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={submitting}
                onClick={() => setShowConfirmModal(true)}
                className="px-7 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center gap-2 shadow-md disabled:opacity-50 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Submit Assessment</span>
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* Confirmation Modal before Submit */}
      {showConfirmModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-blue-600" />
                <span>Confirm Assessment Submission</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              You have answered <strong>{answeredCount}</strong> of <strong>{assessment.questions.length}</strong> questions.
              {answeredCount < assessment.questions.length && (
                <span className="block text-amber-700 font-semibold mt-1">
                  Warning: You have {assessment.questions.length - answeredCount} unanswered question(s). Unanswered questions score 0 points.
                </span>
              )}
            </p>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Review Answers
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleSubmitFinal}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm"
              >
                {submitting ? 'Submitting...' : 'Confirm & Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
