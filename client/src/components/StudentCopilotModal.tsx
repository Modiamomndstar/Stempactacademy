import React, { useState } from 'react';
import { api } from '../services/api';
import {
  Sparkles,
  Bot,
  Send,
  X,
  BookOpen,
  HelpCircle,
  Code,
  Lightbulb,
  ShieldCheck,
  User
} from 'lucide-react';

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
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      text: `Hello! I am your STEMPACT Learning Copilot for ${programName}. I can help you understand challenging concepts, break down complex logic, or recommend study strategies. How can I guide you today?`,
      time: 'Just now',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

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
        text: res.answer || 'I am thinking about your question...',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: `⚠️ Error: ${err.message || 'Unable to connect to Learning Copilot. Please try again.'}`,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col h-[650px] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-800 p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <Bot className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base leading-none">STEMPACT Learning Copilot</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-400/20 text-emerald-200 border border-emerald-400/30">
                  Socratic Mode
                </span>
              </div>
              <p className="text-xs text-slate-200 mt-1 truncate max-w-sm font-medium">
                {programName} {currentTopic && `• ${currentTopic}`}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Academic Integrity Banner */}
        <div className="bg-emerald-50 dark:bg-emerald-950/40 px-4 py-2 border-b border-emerald-100 dark:border-emerald-900/50 flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300">
          <ShieldCheck className="w-4 h-4 flex-shrink-0 text-emerald-600" />
          <span>
            <strong>Honor Code:</strong> Copilot guides your understanding step-by-step and will not complete assignments for you.
          </span>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.role === 'assistant' && (
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 mt-1">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[80%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-emerald-600 text-white rounded-tr-none'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-200 dark:border-slate-700'
                }`}
              >
                <div className="whitespace-pre-wrap">{m.text}</div>
                <div
                  className={`text-[9px] mt-1.5 text-right ${
                    m.role === 'user' ? 'text-emerald-200' : 'text-slate-400'
                  }`}
                >
                  {m.time}
                </div>
              </div>

              {m.role === 'user' && (
                <div className="w-8 h-8 rounded-lg bg-slate-700 text-white flex items-center justify-center flex-shrink-0 mt-1">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 justify-start items-center">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-tl-none p-3 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse delay-75"></span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse delay-150"></span>
                <span className="text-xs text-slate-500 dark:text-slate-400 ml-1 font-medium">
                  Copilot is formulating guidance...
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Quick prompt suggestions */}
        <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex gap-2 overflow-x-auto">
          {quickPrompts.map((prompt, pIdx) => (
            <button
              key={pIdx}
              onClick={() => handleSend(prompt)}
              disabled={loading}
              className="text-[11px] whitespace-nowrap px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-emerald-400 transition"
            >
              💡 {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Copilot a question about concepts or coding..."
              disabled={loading}
              className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold transition flex items-center gap-1.5 text-xs shadow"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Ask</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
