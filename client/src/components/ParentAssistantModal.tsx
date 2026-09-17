import React, { useState } from 'react';
import { api } from '../services/api';
import {
  HeartHandshake,
  Send,
  X,
  Sparkles,
  ShieldCheck,
  Calendar,
  CheckCircle2,
  TrendingUp,
  Award
} from 'lucide-react';

interface ParentAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  wardName?: string;
}

interface Message {
  role: 'parent' | 'guardian_ai';
  text: string;
  time: string;
}

export const ParentAssistantModal: React.FC<ParentAssistantModalProps> = ({
  isOpen,
  onClose,
  wardName = 'Your Ward',
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'guardian_ai',
      text: `Hello! I am your STEMPACT Parent Guardian Assistant. I track ${wardName}'s learning attendance, practical project milestones, and provide actionable tips for supporting their STEM journey at home. How can I assist you today?`,
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
      role: 'parent',
      text: query,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.parentAssistant({ question: query });
      const aiMsg: Message = {
        role: 'guardian_ai',
        text: res.answer || 'I am processing your inquiry...',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'guardian_ai',
          text: `⚠️ Error: ${err.message || 'Unable to reach Guardian Assistant. Please try again.'}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    `How is ${wardName} performing overall this term?`,
    `What hands-on project did ${wardName} work on recently?`,
    'How can I help my child prepare for upcoming technical challenges at home?',
    `Has ${wardName} met the attendance threshold for graduation certification?`,
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col h-[650px] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-700 via-emerald-800 to-cyan-900 p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <HeartHandshake className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base leading-none">Parent Guardian Assistant</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-400/20 text-teal-200 border border-teal-400/30">
                  STEMPACT Family
                </span>
              </div>
              <p className="text-xs text-slate-200 mt-1 font-medium">
                Supporting {wardName}'s Academic & Practical Progress
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

        {/* Info banner */}
        <div className="bg-teal-50 dark:bg-teal-950/40 px-4 py-2 border-b border-teal-100 dark:border-teal-900/50 flex items-center gap-2 text-xs text-teal-800 dark:text-teal-300">
          <ShieldCheck className="w-4 h-4 flex-shrink-0 text-teal-600" />
          <span>
            Real-time verified data directly connected to your child's attendance and instructor evaluations.
          </span>
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex gap-3 ${m.role === 'parent' ? 'justify-end' : 'justify-start'}`}
            >
              {m.role === 'guardian_ai' && (
                <div className="w-8 h-8 rounded-lg bg-teal-700 text-white flex items-center justify-center flex-shrink-0 mt-1">
                  <Sparkles className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[80%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                  m.role === 'parent'
                    ? 'bg-teal-700 text-white rounded-tr-none'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-200 dark:border-slate-700'
                }`}
              >
                <div className="whitespace-pre-wrap">{m.text}</div>
                <div
                  className={`text-[9px] mt-1.5 text-right ${
                    m.role === 'parent' ? 'text-teal-200' : 'text-slate-400'
                  }`}
                >
                  {m.time}
                </div>
              </div>

              {m.role === 'parent' && (
                <div className="w-8 h-8 rounded-lg bg-slate-700 text-white flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-xs font-bold">You</span>
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 justify-start items-center">
              <div className="w-8 h-8 rounded-lg bg-teal-700 text-white flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-tl-none p-3 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
                <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse delay-75"></span>
                <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse delay-150"></span>
                <span className="text-xs text-slate-500 dark:text-slate-400 ml-1 font-medium">
                  Gathering child progress metrics...
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Quick Prompts */}
        <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex gap-2 overflow-x-auto">
          {quickPrompts.map((prompt, pIdx) => (
            <button
              key={pIdx}
              onClick={() => handleSend(prompt)}
              disabled={loading}
              className="text-[11px] whitespace-nowrap px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950/40 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-teal-400 transition"
            >
              💬 {prompt}
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
              placeholder="Ask anything regarding your child's progress..."
              disabled={loading}
              className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="px-4 py-2.5 bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white rounded-xl font-bold transition flex items-center gap-1.5 text-xs shadow"
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
