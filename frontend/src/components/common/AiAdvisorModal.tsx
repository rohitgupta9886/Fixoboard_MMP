import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  Bot,
  Sparkles,
  Send,
  X,
  CheckCircle2,
  Shield,
  Layers,
  ChevronRight,
  MessageSquare,
  HelpCircle,
} from 'lucide-react';
import { apiClient } from '../../api/client';
import { Button } from './Button';
import { Badge } from './Badge';
import { AIAdvisorResponse, ProductRecommendationItem } from '../../types';

interface AiAdvisorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AiAdvisorModal: React.FC<AiAdvisorModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const [messages, setMessages] = useState<
    Array<{ sender: 'user' | 'assistant'; text: string; recommendations?: ProductRecommendationItem[] }>
  >([
    {
      sender: 'assistant',
      text: 'Hello! I am your FixoBoard AI Manufacturing & Product Advisor. Ask me anything about recommended thicknesses, densities for specific applications (like kitchen carcasses, bathroom doors, CNC routing, or shuttering), PVC vs Plywood comparisons, or custom order inquiries.',
    },
  ]);

  const chatMutation = useMutation({
    mutationFn: async (userText: string) => {
      const activeSessionId =
        conversationId ||
        (typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`);

      return await apiClient.chatAiAdvisor({
        query: userText,
        message: userText,
        session_id: activeSessionId,
        context_conversation_id: activeSessionId,
      });
    },
    onSuccess: (data: AIAdvisorResponse) => {
      if (data.conversation_id || data.session_id) {
        setConversationId(data.conversation_id || data.session_id);
      }
      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: data.assistant_reply || data.response_text || 'No response generated.',
          recommendations: data.recommended_products || data.matched_products || [],
        },
      ]);
    },
    onError: (err: any) => {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: `Error processing query: ${err.message || 'Unable to reach AI Advisor service.'}`,
        },
      ]);
    },
  });

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim() || chatMutation.isPending) return;

    const userText = query.trim();
    setMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setQuery('');
    chatMutation.mutate(userText);
  };

  const handleQuickPrompt = (promptText: string) => {
    setMessages((prev) => [...prev, { sender: 'user', text: promptText }]);
    chatMutation.mutate(promptText);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[85vh] overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold">FixoBoard Smart AI Advisor</h3>
                <span className="px-2 py-0.5 rounded-full text-3xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  ONLINE
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Specification guidance, technical recommendations & lead assistance
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-slate-400 shrink-0 font-medium">Try asking:</span>
          <button
            onClick={() => handleQuickPrompt('Which board thickness is best for modular kitchen carcass?')}
            className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-700 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 shrink-0 transition-colors"
          >
            Kitchen Carcass Thickness?
          </button>
          <button
            onClick={() => handleQuickPrompt('Suggest density and specifications for bathroom waterproof doors')}
            className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-700 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 shrink-0 transition-colors"
          >
            Bathroom Doors Specs?
          </button>
          <button
            onClick={() => handleQuickPrompt('What are key advantages of FixoBoard PVC over commercial plywood?')}
            className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-700 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 shrink-0 transition-colors"
          >
            FixoBoard vs Plywood?
          </button>
        </div>

        {/* Messages Container */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 text-sm bg-slate-50/50 dark:bg-slate-900/50">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex gap-3 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.sender === 'assistant' && (
                <div className="w-8 h-8 rounded-lg bg-purple-600/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4" />
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-2xl p-3.5 ${
                  m.sender === 'user'
                    ? 'bg-purple-600 text-white rounded-br-none'
                    : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-xs rounded-bl-none'
                }`}
              >
                <div className="whitespace-pre-wrap text-xs md:text-sm leading-relaxed">{m.text}</div>

                {/* Render Product Recommendations if any */}
                {m.recommendations && m.recommendations.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 space-y-2">
                    <div className="text-2xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                      Recommended Products:
                    </div>
                    {m.recommendations.map((rec, rIdx) => (
                      <div
                        key={rIdx}
                        className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-xs"
                      >
                        <div className="font-bold text-slate-900 dark:text-white flex items-center justify-between">
                          <span>{rec.product_name}</span>
                          <Badge variant="purple" size="sm">
                            {rec.recommended_thickness}
                          </Badge>
                        </div>
                        <div className="text-3xs text-slate-500 mt-0.5">
                          Density: {rec.recommended_density} | Est. Price: {rec.estimated_price_range}
                        </div>
                        {rec.verified_rationale && rec.verified_rationale.length > 0 && (
                          <ul className="mt-1.5 space-y-0.5 list-disc list-inside text-3xs text-slate-600 dark:text-slate-300">
                            {rec.verified_rationale.slice(0, 2).map((r, i) => (
                              <li key={i}>{r}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {chatMutation.isPending && (
            <div className="flex gap-3 items-center text-xs text-purple-600 dark:text-purple-400">
              <div className="w-8 h-8 rounded-lg bg-purple-600/10 flex items-center justify-center">
                <Sparkles className="w-4 h-4 animate-spin" />
              </div>
              <span>AI Advisor is typing advice...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type your question for the AI Advisor..."
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-purple-500 outline-none"
          />
          <Button
            type="submit"
            variant="primary"
            disabled={!query.trim() || chatMutation.isPending}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-xl shadow-md"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};
