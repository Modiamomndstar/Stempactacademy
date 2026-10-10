import React, { useState, useRef, useEffect } from 'react';
import { api } from '../services/api';
import {
  Sparkles,
  Bot,
  Send,
  X,
  ShieldCheck,
  User,
  Copy,
  Check,
  RotateCcw,
  Maximize2,
  Minimize2,
  Lightbulb,
} from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';

interface StudentCopilotModalProps {
  isOpen: boolean;
  onClose: () => void;
  programName?: string;
  currentTopic?: string;
}

interface Message {
  role: 'user' | 'assistant';
  text: string;
  time: string;
}

export const StudentCopilotModal: React.FC<StudentCopilotModalProps> = ({
  isOpen,
  onClose,
  programName = 'STEMPACT Academy Program',
  currentTopic,
}) => {
  const initialGreeting: Message = {
    role: 'assistant',
    text: `Hello! I am your **STEMPACT Learning Copilot** for **${programName}**.\n\nI can help you:\n- 💡 **Understand challenging concepts** using intuitive, everyday analogies.\n- ⚙️ **Break down complex engineering logic** and architecture step-by-step.\n- 🛠️ **Debug hardware or coding issues** without doing your assignments for you.\n- 🇳🇬 **Explore real-world industry applications** in Nigeria and across the globe.\n\nWhat would you like to explore or clarify today?`,
    time: 'Just now',
  };

  const [messages, setMessages] = useState<Message[]>([initialGreeting]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom whenever messages change or loading state changes
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading, isOpen]);

  if (!isOpen) return null;

  const handleCopy = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.warn('Could not copy to clipboard:', err);
    }
  };

  const handleResetChat = () => {
    setMessages([initialGreeting]);
    setInput('');
  };

  const handleSend = async (questionText?: string) => {
    const query = questionText || input;
    if (!query.trim() || loading) return;

    const userMsg: Message = {
      role: 'user',
      text: query,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.studentCopilot({
        question: query,
        programContext: `${programName}${currentTopic ? ` - Current Topic: ${currentTopic}` : ''}`,
      });

      const assistantMsg: Message = {
        role: 'assistant',
        text: res.answer || 'I am thinking through your question...',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: `⚠️ **Unable to connect to Learning Copilot**: ${err.message || 'Please check your internet connection and try again.'}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    'Explain this concept in simple terms with an everyday analogy',
    'How do I approach debugging a logic problem in my project?',
    'What real-world Nigerian industry problem can I solve with this?',
    'Give me a quick 3-question self-check quiz on this topic',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-md animate-fadeIn">
      <div
        className={`bg-white dark:bg-slate-900 w-full rounded-3xl shadow-2xl border border-slate-200/90 dark:border-slate-800 flex flex-col overflow-hidden transition-all duration-200 ${
          isExpanded
            ? 'max-w-6xl h-[92vh]'
            : 'max-w-4xl h-[84vh] max-h-[820px]'
        }`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 px-5 py-4 text-white flex items-center justify-between border-b border-emerald-700/40">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20 shadow-inner">
              <Bot className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm sm:text-base tracking-tight leading-none text-white">
                  STEMPACT Learning Copilot
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-400/20 text-emerald-200 border border-emerald-400/30 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" />
                  Socratic AI Tutor
                </span>
              </div>
              <p className="text-[11px] text-emerald-100/90 mt-1 truncate max-w-sm sm:max-w-md font-medium">
                {programName} {currentTopic && `• ${currentTopic}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleResetChat}
              title="Reset Conversation"
              className="p-2 rounded-xl text-emerald-200 hover:text-white hover:bg-white/10 transition cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              title={isExpanded ? 'Restore Size' : 'Expand Modal'}
              className="p-2 rounded-xl text-emerald-200 hover:text-white hover:bg-white/10 transition cursor-pointer hidden sm:block"
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              title="Close Copilot"
              className="p-2 rounded-xl text-emerald-200 hover:text-white hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Academic Integrity Honor Banner */}
        <div className="bg-emerald-50 dark:bg-emerald-950/30 px-5 py-2.5 border-b border-emerald-100 dark:border-emerald-900/40 flex items-center justify-between text-xs text-emerald-900 dark:text-emerald-300">
          <div className="flex items-center gap-2 font-medium">
            <ShieldCheck className="w-4 h-4 flex-shrink-0 text-emerald-600" />
            <span>
              <strong>Honor Code Guard:</strong> Copilot teaches concepts socratically step-by-step and will guide reasoning rather than giving assignment answers.
            </span>
          </div>
          <span className="hidden md:inline-block text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">
            Markdown & Math Supported
          </span>
        </div>

        {/* Chat History Canvas */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-slate-50/50 dark:bg-slate-950/30">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex gap-3 sm:gap-3.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.role === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center flex-shrink-0 mt-1 shadow-xs">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`flex flex-col ${
                  m.role === 'user'
                    ? 'items-end max-w-[85%] sm:max-w-[75%]'
                    : 'items-start max-w-[95%] sm:max-w-[90%] w-full'
                }`}
              >
                {/* Assistant Name Label */}
                {m.role === 'assistant' && (
                  <div className="flex items-center gap-2 mb-1.5 px-1">
                    <span className="text-[11px] font-black text-slate-800 dark:text-slate-200">
                      STEMPACT Learning Copilot
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {m.time}
                    </span>
                  </div>
                )}

                {/* Bubble Container */}
                <div
                  className={`rounded-2xl transition-all ${
                    m.role === 'user'
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-tr-xs p-3.5 sm:p-4 shadow-xs text-xs sm:text-[13px] leading-relaxed whitespace-pre-wrap'
                      : 'bg-white dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 rounded-tl-xs p-4 sm:p-5 border border-slate-200 dark:border-slate-700/80 shadow-xs w-full'
                  }`}
                >
                  {m.role === 'user' ? (
                    <div>{m.text}</div>
                  ) : (
                    <MarkdownRenderer content={m.text} />
                  )}
                </div>

                {/* Assistant Action Footer: Copy Button & Feedback */}
                {m.role === 'assistant' && (
                  <div className="flex items-center gap-2 mt-1.5 px-1 text-[11px] text-slate-400">
                    <button
                      type="button"
                      onClick={() => handleCopy(m.text, idx)}
                      className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-emerald-700 dark:hover:text-emerald-400 transition cursor-pointer p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      {copiedIndex === idx ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-600 font-bold">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Response</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* User timestamp */}
                {m.role === 'user' && (
                  <span className="text-[10px] text-slate-400 mt-1 px-1">
                    {m.time}
                  </span>
                )}
              </div>

              {m.role === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-slate-800 text-white flex items-center justify-center flex-shrink-0 mt-1 shadow-xs">
                  <User className="w-4 h-4 text-slate-200" />
                </div>
              )}
            </div>
          ))}

          {/* Thinking Status */}
          {loading && (
            <div className="flex gap-3 justify-start items-start animate-fadeIn">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center flex-shrink-0 mt-1 shadow-xs">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-2xl rounded-tl-xs p-4 border border-slate-200 dark:border-slate-700 shadow-xs flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                  Copilot is formulating structured guidance...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompt Suggestions */}
        <div className="px-4 py-2.5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap pl-1">
            Suggestions:
          </span>
          {quickPrompts.map((prompt, pIdx) => (
            <button
              key={pIdx}
              onClick={() => handleSend(prompt)}
              disabled={loading}
              className="text-[11px] font-medium whitespace-nowrap px-3 py-1.5 rounded-full bg-slate-100 hover:bg-emerald-50 dark:bg-slate-800 dark:hover:bg-emerald-950/40 text-slate-700 hover:text-emerald-800 dark:text-slate-300 dark:hover:text-emerald-300 border border-slate-200 dark:border-slate-700 hover:border-emerald-300 transition cursor-pointer disabled:opacity-50"
            >
              💡 {prompt}
            </button>
          ))}
        </div>

        {/* Chat Input Bar */}
        <div className="p-3.5 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2.5"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Copilot a question about concepts, circuits, logic, or coding..."
              disabled={loading}
              className="flex-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl px-4 sm:px-5 py-3 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-2xs"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="px-5 py-3 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 disabled:opacity-40 text-white rounded-2xl font-bold transition flex items-center gap-2 text-xs sm:text-sm shadow-md cursor-pointer disabled:cursor-not-allowed shrink-0"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Ask</span>
            </button>
          </form>
          <div className="mt-2 text-center text-[10px] text-slate-400">
            STEMPACT Copilot is an AI tutor. Always review official syllabus resources and verify lab pinouts.
          </div>
        </div>
      </div>
    </div>
  );
};
