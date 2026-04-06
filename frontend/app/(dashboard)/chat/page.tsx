'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { chatApi } from '@/lib/api';
import { getSession } from '@/lib/auth';

type UiMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
};

type ChatSession = {
  id: string;
  title: string;
  updatedAt: string;
  messages: UiMessage[];
};

const SESSIONS_STORAGE_KEY = 'hrm_chat_widget_sessions_v2';
const ACTIVE_SESSION_STORAGE_KEY = 'hrm_chat_widget_active_session_v2';

function storageKey(base: string) {
  const email = getSession()?.email?.trim().toLowerCase();
  const safeEmail = email ? email.replace(/[^a-z0-9@._-]/g, '_') : 'guest';
  return `${base}:${safeEmail}`;
}

function nowLabel() {
  return new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

function isoNow() {
  return new Date().toISOString();
}

function makeSessionTitle(firstUserMessage: string) {
  const text = firstUserMessage.trim();
  if (!text) return 'Cuộc trò chuyện mới';
  return text.length > 50 ? `${text.slice(0, 50)}...` : text;
}

function createEmptySession(): ChatSession {
  return {
    id: crypto.randomUUID(),
    title: 'Cuộc trò chuyện mới',
    updatedAt: isoNow(),
    messages: [],
  };
}

function sortSessions(list: ChatSession[]) {
  return [...list].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export default function ChatPage() {
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState('');
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  const activeSession = useMemo(
    () => sessions.find((s) => s.id === activeSessionId) || null,
    [sessions, activeSessionId]
  );

  const messages = useMemo(() => activeSession?.messages ?? [], [activeSession]);

  useEffect(() => {
    const sessionsKey = storageKey(SESSIONS_STORAGE_KEY);
    const activeKey = storageKey(ACTIVE_SESSION_STORAGE_KEY);
    try {
      const rawSessions = localStorage.getItem(sessionsKey);
      const rawActive = localStorage.getItem(activeKey);
      if (rawSessions) {
        const parsed = JSON.parse(rawSessions) as ChatSession[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          const sorted = sortSessions(parsed);
          setSessions(sorted);
          setActiveSessionId(
            rawActive && sorted.some((s) => s.id === rawActive) ? rawActive : sorted[0].id
          );
          return;
        }
      }
    } catch (e) {
      console.error('Failed to load sessions', e);
    }
    const empty = createEmptySession();
    setSessions([empty]);
    setActiveSessionId(empty.id);
  }, []);

  useEffect(() => {
    if (sessions.length === 0) return;
    const sessionsKey = storageKey(SESSIONS_STORAGE_KEY);
    const activeKey = storageKey(ACTIVE_SESSION_STORAGE_KEY);
    localStorage.setItem(sessionsKey, JSON.stringify(sessions.slice(0, 50)));
    if (activeSessionId) {
      localStorage.setItem(activeKey, activeSessionId);
    }
  }, [sessions, activeSessionId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  function handleCreateSession() {
    const session = createEmptySession();
    setSessions((prev) => sortSessions([session, ...prev]));
    setActiveSessionId(session.id);
    setText('');
  }

  function handleDeleteSession(sessionId: string, e: React.MouseEvent) {
    e.stopPropagation();
    setSessions((prev) => {
      const filtered = prev.filter((s) => s.id !== sessionId);
      if (filtered.length === 0) {
        const next = createEmptySession();
        setActiveSessionId(next.id);
        return [next];
      }
      if (activeSessionId === sessionId) {
        setActiveSessionId(filtered[0].id);
      }
      return sortSessions(filtered);
    });
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const content = text.trim();
    if (!content || loading || !activeSessionId) return;

    const userMsg: UiMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: nowLabel(),
    };

    const currentSession = sessions.find(s => s.id === activeSessionId);
    if (!currentSession) return;

    const nextMessages = [...currentSession.messages, userMsg];
    const hasUserBefore = currentSession.messages.some(m => m.role === 'user');

    setSessions(prev => sortSessions(prev.map(s => 
      s.id === activeSessionId 
        ? { ...s, title: hasUserBefore ? s.title : makeSessionTitle(content), updatedAt: isoNow(), messages: nextMessages }
        : s
    )));

    setText('');
    setLoading(true);

    try {
      const data = await chatApi.sendMessage({
        message: content,
        history: nextMessages.slice(-20).map(m => ({ role: m.role, content: m.content }))
      });

      const botMsg: UiMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.message || 'Mình chưa có phản hồi phù hợp.',
        timestamp: nowLabel(),
      };

      setSessions(prev => prev.map(s => 
        s.id === activeSessionId 
          ? { ...s, updatedAt: isoNow(), messages: [...s.messages, botMsg] }
          : s
      ));
    } catch (error) {
      const botErr: UiMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Không thể kết nối chatbot lúc này. Vui lòng thử lại sau.',
        timestamp: nowLabel(),
      };
      setSessions(prev => prev.map(s => 
        s.id === activeSessionId 
          ? { ...s, messages: [...s.messages, botErr] }
          : s
      ));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-140px)] gap-6 p-2">
      {/* Sidebar - History */}
      <div className="w-[320px] flex flex-col bg-white/70 dark:bg-slate-950/40 rounded-[40px] border border-black/5 dark:border-white/10 overflow-hidden shadow-2xl backdrop-blur-3xl transition-colors duration-500">
        <div className="p-8 border-b border-black/5 dark:border-white/5">
           <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight mb-6">Lịch sử Chat</h2>
           <button
             onClick={handleCreateSession}
             className="w-full py-4 rounded-[22px] bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-black uppercase tracking-widest transition-all shadow-glow shadow-indigo-500/20 flex items-center justify-center gap-3 active:scale-95"
           >
              <span>+ Đoạn chat mới</span>
           </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {sessions.map((s) => (
            <div
              key={s.id}
              onClick={() => setActiveSessionId(s.id)}
              className={`group p-5 rounded-[28px] border transition-all duration-500 relative overflow-hidden ${
                s.id === activeSessionId
                  ? 'bg-indigo-600/10 dark:bg-indigo-600/40 border-indigo-500/50 shadow-inner'
                  : 'bg-black/5 dark:bg-white/5 border-transparent hover:bg-black/10 dark:hover:bg-white/10'
              }`}
            >
              <div className="flex items-start justify-between gap-4 relative z-10">
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-black truncate uppercase tracking-tight ${s.id === activeSessionId ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-100'}`}>
                    {s.title}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-1">
                    {new Date(s.updatedAt).toLocaleDateString('vi-VN')}
                  </p>
                </div>
                <button
                  onClick={(e) => handleDeleteSession(s.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-xl hover:bg-rose-500/10 dark:hover:bg-rose-500/20 text-slate-400 hover:text-rose-600 dark:hover:text-rose-500 transition-all active:scale-90"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
              {s.id === activeSessionId && (
                <div className="absolute left-0 top-4 bottom-4 w-1 bg-indigo-600 dark:bg-indigo-500 rounded-r-full shadow-glow-sm" theme-aware />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white/80 dark:bg-slate-950/30 rounded-[40px] border border-black/5 dark:border-white/10 shadow-2xl relative overflow-hidden backdrop-blur-3xl transition-colors duration-500">
        {/* Chat Header */}
        <div className="p-8 border-b border-black/5 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-black/40">
           <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-indigo-600 rounded-[22px] flex items-center justify-center text-white shadow-glow shadow-indigo-500/30">
                 <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              </div>
              <div>
                 <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight leading-none mb-1">Trợ lý AI HRM</h2>
                 <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600 dark:text-indigo-400">Premium Intelligence</p>
              </div>
           </div>
           <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-full border border-emerald-500/20 dark:border-emerald-500/30">
                 <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-glow shadow-emerald-500/50" />
                 <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Sẵn sàng</span>
              </div>
           </div>
        </div>

        {/* Message List */}
        <div className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar scroll-smooth">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-10">
               <div className="w-32 h-32 bg-indigo-600/10 dark:bg-indigo-600/20 rounded-[48px] flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-10 border border-indigo-500/10 dark:border-indigo-500/20 shadow-inner">
                  <svg className="w-16 h-16 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
               </div>
               <h3 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tight mb-4">Chào bạn, tôi có thể giúp gì?</h3>
               <p className="text-slate-600 dark:text-slate-300 max-w-md font-bold text-sm leading-relaxed">
                  Hãy hỏi tôi về bảng lương, chính sách công ty, thủ tục nghỉ phép hoặc bất kỳ thắc mắc nào về nhân sự.
               </p>
               <div className="grid grid-cols-2 gap-4 mt-12 w-full max-w-2xl text-left">
                  {[
                    "Lương tháng này của tôi là bao nhiêu?",
                    "Hướng dẫn thủ tục xin nghỉ phép",
                    "Dự án AI_BOT có những ai làm?",
                    "Quy định về làm thêm giờ (OT)"
                  ].map(q => (
                    <button key={q} onClick={() => setText(q)} className="p-6 rounded-[28px] bg-white dark:bg-white/10 border border-black/5 dark:border-white/10 hover:border-indigo-500/50 hover:bg-indigo-600/5 dark:hover:bg-indigo-600/10 transition-all text-sm text-slate-700 dark:text-slate-100 font-black group shadow-lg">
                       <span className="group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors uppercase tracking-tight">{q}</span>
                    </button>
                  ))}
               </div>
            </div>
          ) : (
            messages.map((m) => (
              <div key={m.id} className={`flex w-full animate-in fade-in slide-in-from-bottom-4 duration-500 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex max-w-[80%] gap-5 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-2xl ${
                    m.role === 'user' ? 'bg-indigo-600 text-white shadow-indigo-500/40' : 'bg-slate-200 dark:bg-slate-900 border border-black/5 dark:border-white/20 text-indigo-600 dark:text-indigo-400'
                  }`}>
                    {m.role === 'user' ? (
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    ) : (
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    )}
                  </div>
                  <div className={`flex flex-col gap-2 ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`p-6 rounded-[32px] text-[15px] font-bold leading-relaxed shadow-3xl ${
                      m.role === 'user'
                        ? 'bg-gradient-to-br from-indigo-600 to-indigo-800 text-white rounded-tr-none'
                        : 'bg-white dark:bg-slate-950/80 border border-black/10 dark:border-white/20 text-slate-800 dark:text-slate-100 rounded-tl-none backdrop-blur-3xl'
                    }`}>
                       <p className="whitespace-pre-wrap">{m.content}</p>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mt-1">{m.timestamp}</span>
                  </div>
                </div>
              </div>
            ))
          )}
          {loading && (
            <div className="flex gap-4 items-center text-indigo-600 dark:text-indigo-400 animate-pulse p-4 ml-16 bg-white/50 dark:bg-slate-950/40 rounded-2xl w-fit border border-black/5 dark:border-white/5">
               <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce" />
               </div>
               <span className="text-[10px] font-black uppercase tracking-widest">Trợ lý đang suy nghĩ...</span>
            </div>
          )}
          <div ref={bottomRef} className="h-4" />
        </div>

        {/* Input Bar */}
        <div className="p-10 bg-slate-50/80 dark:bg-black/60 border-t border-black/5 dark:border-white/5 backdrop-blur-2xl">
           <form onSubmit={onSubmit} className="max-w-4xl mx-auto flex gap-4 bg-white dark:bg-white/5 p-3 rounded-[32px] border border-black/10 dark:border-white/20 shadow-2xl focus-within:border-indigo-500/50 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all duration-500">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Đặt câu hỏi cho Trợ lý HRM..."
                className="flex-1 bg-transparent px-6 py-4 outline-none text-slate-800 dark:text-white font-black placeholder:text-slate-400 placeholder:font-black placeholder:uppercase placeholder:text-[11px] placeholder:tracking-widest"
              />
              <button
                type="submit"
                disabled={!text.trim() || loading}
                className="px-10 rounded-[24px] bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase text-[11px] tracking-widest transition-all shadow-glow shadow-indigo-500/30 disabled:opacity-30 active:scale-95 duration-300"
              >
                {loading ? 'Đang gửi...' : 'Gửi câu hỏi'}
              </button>
           </form>
           <p className="text-[9px] text-center mt-6 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest opacity-60">
             AI có thể đưa ra câu trả lời không chính xác. Vui lòng kiểm tra lại với HR khi cần thiết.
           </p>
        </div>
      </div>
    </div>
  );
}
