import React, { useState, useRef, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  Bot,
  Sparkles,
  Send,
  X,
  Layers,
  ChevronRight,
  RefreshCw,
  Copy,
  Check,
  Building2,
  Cpu,
  Truck,
  FileSpreadsheet,
  ShieldCheck,
  Maximize2,
  Minimize2,
  CornerDownLeft,
} from 'lucide-react';
import { apiClient } from '../../api/client';
import { Button } from './Button';
import { Badge } from './Badge';
import { AIAdvisorResponse, ProductRecommendationItem } from '../../types';

interface AiAdvisorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  recommendations?: ProductRecommendationItem[];
}

/**
 * Robust markdown block & table parser for AI Advisor responses
 */
const renderFormattedText = (rawText: string) => {
  if (!rawText) return null;

  // Split into paragraphs / lines
  const lines = rawText.split('\n');
  const elements: React.ReactNode[] = [];
  let tableBuffer: string[] = [];
  let inTable = false;

  const flushTable = (keyPrefix: number) => {
    if (tableBuffer.length === 0) return null;

    const rows = tableBuffer
      .filter((r) => r.trim().startsWith('|') && !r.includes('---'))
      .map((r) =>
        r
          .split('|')
          .slice(1, -1)
          .map((c) => c.trim())
      );

    const headers = rows[0] || [];
    const bodyRows = rows.slice(1);

    tableBuffer = [];
    inTable = false;

    return (
      <div key={`table-${keyPrefix}`} className="my-3 overflow-x-auto rounded-xl border border-slate-700/80 bg-slate-900/90 shadow-sm">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-purple-950/60 border-b border-slate-700/80 text-purple-200">
              {headers.map((h, hIdx) => (
                <th key={hIdx} className="px-3.5 py-2.5 font-bold tracking-wide">
                  {renderInlineFormatting(h)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80 text-slate-200">
            {bodyRows.map((row, rIdx) => (
              <tr
                key={rIdx}
                className={rIdx % 2 === 0 ? 'bg-slate-900/40 hover:bg-slate-800/50' : 'bg-slate-850/40 hover:bg-slate-800/50'}
              >
                {row.map((cell, cIdx) => (
                  <td key={cIdx} className="px-3.5 py-2 text-xs leading-relaxed">
                    {renderInlineFormatting(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    // Check if line is part of a markdown table
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      inTable = true;
      tableBuffer.push(trimmed);
      return;
    } else if (inTable) {
      elements.push(flushTable(idx));
    }

    if (!trimmed) {
      elements.push(<div key={`spacer-${idx}`} className="h-2" />);
      return;
    }

    // Headings (###, ##, #)
    if (trimmed.startsWith('### ')) {
      elements.push(
        <div key={`h3-${idx}`} className="mt-3 mb-1.5 pb-1 border-b border-purple-500/20 flex items-center gap-2">
          <div className="w-1.5 h-4 rounded-full bg-purple-500" />
          <h4 className="text-sm font-bold text-purple-200 tracking-tight">
            {renderInlineFormatting(trimmed.substring(4))}
          </h4>
        </div>
      );
    } else if (trimmed.startsWith('## ')) {
      elements.push(
        <div key={`h2-${idx}`} className="mt-4 mb-2 pb-1 border-b border-purple-500/30 flex items-center gap-2">
          <div className="w-2 h-4 rounded-full bg-indigo-500" />
          <h3 className="text-base font-extrabold text-white tracking-tight">
            {renderInlineFormatting(trimmed.substring(3))}
          </h3>
        </div>
      );
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      // Bullet points
      elements.push(
        <div key={`bullet-${idx}`} className="flex items-start gap-2 text-xs leading-relaxed my-1 pl-1 text-slate-200">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5 shrink-0" />
          <div className="flex-1">{renderInlineFormatting(trimmed.substring(2))}</div>
        </div>
      );
    } else {
      // Regular paragraph text
      elements.push(
        <p key={`p-${idx}`} className="text-xs leading-relaxed text-slate-200 my-1">
          {renderInlineFormatting(trimmed)}
        </p>
      );
    }
  });

  if (inTable) {
    elements.push(flushTable(lines.length));
  }

  return <div className="space-y-1">{elements}</div>;
};

/**
 * Parses bold text (**text**), italics (*text*), and code (`code`)
 */
const renderInlineFormatting = (text: string): React.ReactNode => {
  if (!text) return null;

  // Split by bold (**...**) and inline code (`...`)
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);

  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-bold text-white bg-purple-500/20 px-1 py-0.5 rounded text-purple-200">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={i} className="font-mono text-2xs bg-slate-800 text-purple-300 px-1.5 py-0.5 rounded border border-purple-500/20">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
};

export const AiAdvisorModal: React.FC<AiAdvisorModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      sender: 'assistant',
      text: '### FixoBoard Executive AI Manufacturing & Database Advisor\n\nHello! I am connected in real-time to your factory database and technical knowledge base.\n\n- **Live Production Metrics**: Track good sheets output, machine speeds, scrap & yields.\n- **Sales Orders & POs**: Query open bookings, customer order status, and dispatch schedules.\n- **Technical Specs**: Expert guidance on **PVC/WPC thickness**, **density requirements**, and **plywood comparisons**.\n\nWhat would you like to inspect today?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom whenever messages change or typing is active
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom('auto');
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom('smooth');
  }, [messages]);

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
      const newMsg: ChatMessage = {
        id: `ai_${Date.now()}`,
        sender: 'assistant',
        text: data.assistant_reply || data.response_text || 'No response generated.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        recommendations: data.recommended_products || data.matched_products || [],
      };
      setMessages((prev) => [...prev, newMsg]);
    },
    onError: (err: any) => {
      const errMsg: ChatMessage = {
        id: `err_${Date.now()}`,
        sender: 'assistant',
        text: `### Service Error\n\nUnable to reach AI Advisor backend: **${err.message || 'Network Timeout'}**.\n\nPlease verify that the FastAPI backend is online.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errMsg]);
    },
  });

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim() || chatMutation.isPending) return;

    const userText = query.trim();
    const newMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, newMsg]);
    setQuery('');
    chatMutation.mutate(userText);
  };

  const handleQuickPrompt = (promptText: string) => {
    if (chatMutation.isPending) return;
    const newMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: promptText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, newMsg]);
    chatMutation.mutate(promptText);
  };

  const handleResetChat = () => {
    setConversationId(undefined);
    setMessages([
      {
        id: `reset_${Date.now()}`,
        sender: 'assistant',
        text: '### Conversation Reset\n\nNew consultation session started. How can I assist with your manufacturing or product operations?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const copyMessageText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Right-Side Chatbot Drawer */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-3 sm:pl-8 pointer-events-none">
        <div
          className={`pointer-events-auto w-screen transition-all duration-300 ease-in-out flex flex-col h-full bg-slate-900 text-slate-100 shadow-2xl border-l border-slate-800 ${
            isExpanded ? 'max-w-3xl md:max-w-4xl' : 'max-w-lg md:max-w-xl'
          }`}
        >
          {/* Executive Header */}
          <div className="p-4 bg-gradient-to-r from-slate-950 via-purple-950 to-indigo-950 border-b border-slate-800 flex items-center justify-between shadow-md shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-300 shadow-inner">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                    FixoBoard AI Advisor
                  </h3>
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-3xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    LIVE DB
                  </span>
                </div>
                <p className="text-3xs sm:text-2xs text-slate-300">
                  Plant Intelligence • Technical Specs • Live Telemetry
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-slate-400">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? 'Collapse' : 'Expand window'}
                className="p-2 rounded-lg hover:text-white hover:bg-white/10 transition-colors"
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={handleResetChat}
                title="Reset conversation"
                className="p-2 rounded-lg hover:text-white hover:bg-white/10 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                title="Close Advisor"
                className="p-2 rounded-lg hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Consultation Chips */}
          <div className="px-3.5 py-2.5 bg-slate-950/80 border-b border-slate-800 flex items-center gap-2 overflow-x-auto text-xs shrink-0 no-scrollbar">
            <span className="text-slate-400 text-3xs font-semibold uppercase tracking-wider shrink-0">
              Quick Inquiries:
            </span>
            <button
              onClick={() => handleQuickPrompt('Which board thickness and density is best for modular kitchen carcasses?')}
              className="px-2.5 py-1 rounded-lg bg-slate-850 hover:bg-purple-900/40 text-slate-200 border border-slate-700/80 hover:border-purple-500/40 text-3xs font-medium shrink-0 transition-colors flex items-center gap-1"
            >
              <Building2 className="w-3 h-3 text-purple-400" />
              Kitchen Carcass Specs
            </button>
            <button
              onClick={() => handleQuickPrompt('Suggest density and specifications for waterproof bathroom doors')}
              className="px-2.5 py-1 rounded-lg bg-slate-850 hover:bg-purple-900/40 text-slate-200 border border-slate-700/80 hover:border-purple-500/40 text-3xs font-medium shrink-0 transition-colors flex items-center gap-1"
            >
              <Layers className="w-3 h-3 text-indigo-400" />
              Bathroom Doors
            </button>
            <button
              onClick={() => handleQuickPrompt('Show live production runs, sheets produced and scrap waste kg')}
              className="px-2.5 py-1 rounded-lg bg-slate-850 hover:bg-purple-900/40 text-slate-200 border border-slate-700/80 hover:border-purple-500/40 text-3xs font-medium shrink-0 transition-colors flex items-center gap-1"
            >
              <Cpu className="w-3 h-3 text-emerald-400" />
              Production & Scrap
            </button>
            <button
              onClick={() => handleQuickPrompt('List all active and open sales orders with total amounts')}
              className="px-2.5 py-1 rounded-lg bg-slate-850 hover:bg-purple-900/40 text-slate-200 border border-slate-700/80 hover:border-purple-500/40 text-3xs font-medium shrink-0 transition-colors flex items-center gap-1"
            >
              <FileSpreadsheet className="w-3 h-3 text-blue-400" />
              Open Orders
            </button>
            <button
              onClick={() => handleQuickPrompt('What are key advantages of FixoBoard Lead-Free PVC over commercial plywood?')}
              className="px-2.5 py-1 rounded-lg bg-slate-850 hover:bg-purple-900/40 text-slate-200 border border-slate-700/80 hover:border-purple-500/40 text-3xs font-medium shrink-0 transition-colors flex items-center gap-1"
            >
              <ShieldCheck className="w-3 h-3 text-amber-400" />
              FixoBoard vs Plywood
            </button>
          </div>

          {/* Messages Container */}
          <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4 bg-gradient-to-b from-slate-900 via-slate-925 to-slate-950">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                {/* Message Header Badge */}
                <div className="flex items-center gap-2 mb-1 px-1">
                  {m.sender === 'assistant' ? (
                    <>
                      <div className="w-4 h-4 rounded bg-purple-500/20 text-purple-400 flex items-center justify-center">
                        <Sparkles className="w-2.5 h-2.5" />
                      </div>
                      <span className="text-3xs font-bold uppercase tracking-wider text-purple-300">
                        FixoBoard AI Intelligence
                      </span>
                    </>
                  ) : (
                    <span className="text-3xs font-bold uppercase tracking-wider text-indigo-300">
                      You (User)
                    </span>
                  )}
                  <span className="text-3xs text-slate-400">{m.timestamp}</span>
                </div>

                {/* Message Bubble */}
                <div
                  className={`w-full max-w-[94%] rounded-2xl transition-all ${
                    m.sender === 'user'
                      ? 'bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 text-white rounded-tr-xs shadow-lg p-3.5 sm:p-4 border border-indigo-400/30'
                      : 'bg-slate-850/95 text-slate-100 border border-slate-700/90 shadow-xl rounded-tl-xs p-4 sm:p-5 backdrop-blur-md'
                  }`}
                >
                  {/* Assistant Toolbar for quick copy */}
                  {m.sender === 'assistant' && (
                    <div className="flex justify-end mb-1">
                      <button
                        onClick={() => copyMessageText(m.id, m.text)}
                        className="text-3xs text-slate-400 hover:text-white flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 transition-colors"
                        title="Copy text to clipboard"
                      >
                        {copiedId === m.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Formatted Content */}
                  {m.sender === 'assistant' ? (
                    renderFormattedText(m.text)
                  ) : (
                    <div className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-medium">
                      {m.text}
                    </div>
                  )}

                  {/* Render Technical Product Cards if Matched */}
                  {m.recommendations && m.recommendations.length > 0 && (
                    <div className="mt-4 pt-3.5 border-t border-slate-700/80 space-y-2.5">
                      <div className="text-3xs font-extrabold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Verified Technical Recommendations:
                      </div>
                      {m.recommendations.map((rec, rIdx) => (
                        <div
                          key={rIdx}
                          className="p-3 rounded-xl bg-slate-900/90 border border-purple-500/30 text-xs shadow-inner"
                        >
                          <div className="font-bold text-white flex items-center justify-between">
                            <span>{rec.product_name}</span>
                            <Badge variant="purple" size="sm">
                              {rec.recommended_thickness}
                            </Badge>
                          </div>
                          <div className="text-3xs text-slate-300 mt-1 font-medium">
                            Density Grade: <span className="text-purple-300 font-bold">{rec.recommended_density}</span> | Est. Price: {rec.estimated_price_range}
                          </div>
                          {rec.verified_rationale && rec.verified_rationale.length > 0 && (
                            <ul className="mt-2 space-y-1 list-disc list-inside text-3xs text-slate-300">
                              {rec.verified_rationale.slice(0, 3).map((r, i) => (
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

            {/* Typing Indicator */}
            {chatMutation.isPending && (
              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-850 border border-purple-500/30 text-purple-300 text-xs shadow-lg max-w-xs animate-pulse">
                <div className="w-6 h-6 rounded-lg bg-purple-600/30 flex items-center justify-center shrink-0">
                  <Sparkles className="w-3.5 h-3.5 text-purple-300 animate-spin" />
                </div>
                <div className="space-y-1">
                  <div className="font-semibold text-white">AI Advisor is analyzing database...</div>
                  <div className="text-3xs text-slate-400">Synthesizing live records & specs</div>
                </div>
              </div>
            )}

            {/* Scroll Target */}
            <div ref={messagesEndRef} className="h-2" />
          </div>

          {/* Chat Input Bar */}
          <form
            onSubmit={handleSend}
            className="p-3.5 bg-slate-950 border-t border-slate-800 flex items-center gap-2 shrink-0"
          >
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask anything (e.g. 'Show orders for ABC Traders', 'Scrap waste today')..."
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900 text-white text-xs sm:text-sm placeholder-slate-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
            />
            <Button
              type="submit"
              variant="primary"
              disabled={!query.trim() || chatMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white px-4 py-2.5 rounded-xl shadow-md flex items-center gap-1.5 text-xs font-bold shrink-0 transition-all disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Ask AI</span>
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};
