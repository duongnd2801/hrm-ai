'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { chatApi } from '@/lib/api';
import { getSession } from '@/lib/auth';
import { useRouter } from 'next/navigation';

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

type ApiErrorPayload = {
  message?: string;
};

type ApiErrorShape = {
  response?: {
    data?: ApiErrorPayload;
  };
  message?: string;
};

type ActiveTab = 'chat' | 'history';

const LEGACY_STORAGE_KEY = 'hrm_chat_widget_history_v1';
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

function generateId() {
  if (typeof globalThis !== 'undefined') {
    const cryptoObj = globalThis.crypto as Crypto | undefined;
    if (cryptoObj && typeof cryptoObj.randomUUID === 'function') {
      return cryptoObj.randomUUID();
    }
  }

  return `chat_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

function makeSessionTitle(firstUserMessage: string) {
  const text = firstUserMessage.trim();
  if (!text) return 'Cuộc trò chuyện mới';
  return text.length > 38 ? `${text.slice(0, 38)}...` : text;
}

function createEmptySession(): ChatSession {
  return {
    id: generateId(),
    title: 'Cuộc trò chuyện mới',
    updatedAt: isoNow(),
    messages: [],
  };
}

function sortSessions(list: ChatSession[]) {
  return [...list].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

function ChatBubbleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
      <path
        d="M7 9.5h10M7 13h6m6 8-3.2-2H6a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15.8 4.6l.5 1.1 1.1.5-1.1.5-.5 1.1-.5-1.1-1.1-.5 1.1-.5.5-1.1Z"
        fill="currentColor"
      />
    </svg>
  );
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [text, setText] = useState('');
  const [hasUnread, setHasUnread] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('chat');
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [pendingDeleteSessionId, setPendingDeleteSessionId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const activeSession = useMemo(
    () => sessions.find((s) => s.id === activeSessionId) || null,
    [sessions, activeSessionId]
  );

  const messages = useMemo(() => activeSession?.messages ?? [], [activeSession]);
  const disabled = useMemo(
    () => loading || !text.trim() || !activeSessionId,
    [loading, text, activeSessionId]
  );

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      const sessionsKey = storageKey(SESSIONS_STORAGE_KEY);
      const activeKey = storageKey(ACTIVE_SESSION_STORAGE_KEY);
      const legacyKey = storageKey(LEGACY_STORAGE_KEY);

      try {
        const rawSessions = localStorage.getItem(sessionsKey);
        const rawActive = localStorage.getItem(activeKey);
        if (rawSessions) {
          const parsed = JSON.parse(rawSessions) as ChatSession[];
          if (Array.isArray(parsed) && parsed.length > 0) {
            const sorted = sortSessions(parsed);
            if (!mounted) return;
            setSessions(sorted);
            setActiveSessionId(
              rawActive && sorted.some((s) => s.id === rawActive) ? rawActive : sorted[0].id
            );
            return;
          }
        }
      } catch {
        // ignore local parse errors
      }

      try {
        const history = await chatApi.getHistory();
        if (mounted && history.length > 0) {
          const mapped: UiMessage[] = history.map((h) => ({
            id: generateId(),
            role: h.role === 'assistant' ? 'assistant' : 'user',
            content: h.content,
            timestamp: h.timestamp
              ? new Date(h.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
              : nowLabel(),
          }));
          const firstUser = mapped.find((m) => m.role === 'user')?.content || '';
          const session: ChatSession = {
            id: generateId(),
            title: makeSessionTitle(firstUser || 'Hỏi đáp HRM'),
            updatedAt: isoNow(),
            messages: mapped.slice(-120),
          };
          setSessions([session]);
          setActiveSessionId(session.id);
          return;
        }
      } catch {
        // fallback legacy storage below
      }

      try {
        const rawLegacy = sessionStorage.getItem(legacyKey) ?? sessionStorage.getItem(LEGACY_STORAGE_KEY);
        if (rawLegacy) {
          const parsedLegacy = JSON.parse(rawLegacy) as UiMessage[];
          if (Array.isArray(parsedLegacy) && parsedLegacy.length > 0) {
            const firstUser = parsedLegacy.find((m) => m.role === 'user')?.content || '';
            const session: ChatSession = {
              id: generateId(),
              title: makeSessionTitle(firstUser || 'Hỏi đáp HRM'),
              updatedAt: isoNow(),
              messages: parsedLegacy.slice(-120),
            };
            if (!mounted) return;
            setSessions([session]);
            setActiveSessionId(session.id);
            return;
          }
        }
      } catch {
        // ignore legacy parse errors
      }

      const empty = createEmptySession();
      if (mounted) {
        setSessions([empty]);
        setActiveSessionId(empty.id);
      }
    }

    bootstrap();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (sessions.length === 0) return;
    const sessionsKey = storageKey(SESSIONS_STORAGE_KEY);
    const activeKey = storageKey(ACTIVE_SESSION_STORAGE_KEY);
    localStorage.setItem(sessionsKey, JSON.stringify(sessions.slice(0, 40)));
    if (activeSessionId) {
      localStorage.setItem(activeKey, activeSessionId);
    }
  }, [sessions, activeSessionId]);

  useEffect(() => {
    if (open && hasUnread) {
      setHasUnread(false);
    }
  }, [open, hasUnread]);

  useEffect(() => {
    if (!open || activeTab !== 'chat') return;
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, loading, open, activeTab]);

  function updateActiveSession(
    updater: (session: ChatSession) => ChatSession
  ): { before: ChatSession; after: ChatSession } | null {
    if (!activeSessionId) return null;
    let pair: { before: ChatSession; after: ChatSession } | null = null;
    setSessions((prev) => {
      const next = prev.map((s) => {
        if (s.id !== activeSessionId) return s;
        const updated = updater(s);
        pair = { before: s, after: updated };
        return updated;
      });
      return sortSessions(next);
    });
    return pair;
  }

  function handleCreateSession() {
    const session = createEmptySession();
    setSessions((prev) => sortSessions([session, ...prev]));
    setActiveSessionId(session.id);
    setActiveTab('chat');
    setText('');
  }

  function handleDeleteSession(sessionId: string) {
    setPendingDeleteSessionId(sessionId);
  }

  function confirmDeleteSession() {
    const sessionId = pendingDeleteSessionId;
    if (!sessionId) return;
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
    setPendingDeleteSessionId(null);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (disabled || !activeSession) return;

    const content = text.trim();
    const userMsg: UiMessage = {
      id: generateId(),
      role: 'user',
      content,
      timestamp: nowLabel(),
    };

    const nextMessages = [...activeSession.messages, userMsg];
    const hasUserBefore = activeSession.messages.some((m) => m.role === 'user');

    updateActiveSession((session) => ({
      ...session,
      title: hasUserBefore ? session.title : makeSessionTitle(content),
      updatedAt: isoNow(),
      messages: nextMessages.slice(-120),
    }));

    setText('');
    setLoading(true);

    try {
      const data = await chatApi.sendMessage({
        message: content,
        history: nextMessages.slice(-20).map((m) => ({
          role: m.role,
          content: m.content,
        })),
      });

      const botMsg: UiMessage = {
        id: generateId(),
        role: 'assistant',
        content: data.message || 'Mình chưa có phản hồi phù hợp.',
        timestamp: nowLabel(),
      };

      updateActiveSession((session) => ({
        ...session,
        updatedAt: isoNow(),
        messages: [...session.messages, botMsg].slice(-120),
      }));

      if (!open) setHasUnread(true);
    } catch (error: unknown) {
      const err = error as ApiErrorShape;
      const botErr: UiMessage = {
        id: generateId(),
        role: 'assistant',
        content: err?.response?.data?.message || err?.message || 'Không thể kết nối chatbot lúc này.',
        timestamp: nowLabel(),
      };

      updateActiveSession((session) => ({
        ...session,
        updatedAt: isoNow(),
        messages: [...session.messages, botErr].slice(-120),
      }));

      if (!open) setHasUnread(true);
    } finally {
      setLoading(false);
    }
  }

  const chatWindow = (
    <div
      className="mb-1 w-[430px] max-w-[calc(100vw-18px)] h-[78vh] max-h-[640px] min-h-[500px] rounded-2xl border border-slate-200/80 dark:border-white/15 bg-white/95 dark:bg-slate-900/95 text-slate-900 dark:text-slate-100 shadow-2xl backdrop-blur-2xl overflow-hidden flex flex-col transition-all duration-300"
    >
      <div className="px-4 py-3 border-b border-slate-200/70 dark:border-white/10 bg-gradient-to-r from-violet-100/60 via-indigo-100/40 to-transparent dark:from-violet-900/35 dark:via-indigo-900/20 dark:to-transparent flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold tracking-wide">Trợ lý HRM AI</p>
          <p className="text-xs text-slate-600 dark:text-slate-300">Hỗ trợ nhanh lương, công, phép</p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              router.push('/chat');
            }}
            className="text-xs px-2.5 py-1 rounded-md bg-indigo-600 text-white hover:bg-indigo-500 transition-all font-bold shadow-glow-sm shadow-indigo-500/20"
          >
            Mở rộng
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-xs px-2.5 py-1 rounded-md bg-slate-200/70 hover:bg-slate-300/80 dark:bg-white/10 dark:hover:bg-white/20 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>

          <div className="px-3 pt-2 pb-1 border-b border-slate-200/70 dark:border-white/10 bg-slate-50/70 dark:bg-slate-900/70">
            <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-200/80 dark:bg-white/10 p-1">
              <button
                type="button"
                onClick={() => setActiveTab('chat')}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  activeTab === 'chat'
                    ? 'bg-white text-slate-900 shadow-sm dark:bg-indigo-500 dark:text-white'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                }`}
              >
                Chat
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  activeTab === 'history'
                    ? 'bg-white text-slate-900 shadow-sm dark:bg-indigo-500 dark:text-white'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                }`}
              >
                Đoạn chat
              </button>
            </div>
          </div>

          {activeTab === 'chat' ? (
            <>
              <div className="px-3 pt-2 pb-1 border-b border-slate-200/70 dark:border-white/10 bg-white/50 dark:bg-white/5">
                <p className="text-[11px] text-slate-500 dark:text-slate-300 truncate">
                  {activeSession?.title || 'Cuộc trò chuyện mới'}
                </p>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto px-3 py-3 space-y-3 scroll-smooth bg-gradient-to-b from-transparent to-slate-50/30 dark:to-transparent">
                {messages.length === 0 && (
                  <div className="text-xs text-slate-600 dark:text-slate-300 bg-slate-100/80 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 rounded-xl p-3">
                    Xin chào, mình là trợ lý HR nội bộ. Bạn có thể hỏi: &quot;Lương tháng này của tôi là bao nhiêu?&quot;.
                  </div>
                )}
                {messages.map((m) => (
                  <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-5 ${
                        m.role === 'user'
                          ? 'bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-lg'
                          : 'bg-slate-100/90 text-slate-800 border border-slate-200/80 dark:bg-white/10 dark:text-slate-100 dark:border-white/10'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{m.content}</p>
                      <p className="mt-1 text-[10px] opacity-80">{m.timestamp}</p>
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/10 rounded-xl px-3 py-2 w-fit">
                    Đang xử lý...
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              <form onSubmit={onSubmit} className="border-t border-slate-200/70 dark:border-white/10 px-3 py-2.5 flex gap-2 bg-slate-50/90 dark:bg-slate-900/90">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Nhập câu hỏi..."
                  className="flex-1 rounded-xl bg-white dark:bg-white/10 border border-slate-300 dark:border-white/15 px-3 py-2 text-sm text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-400"
                />
                <button
                  type="submit"
                  disabled={disabled}
                  className="rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 px-3.5 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  Gửi
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 min-h-0 overflow-y-auto px-3 py-3 space-y-2 bg-gradient-to-b from-transparent to-slate-50/30 dark:to-transparent">
              <button
                type="button"
                onClick={handleCreateSession}
                className="w-full rounded-xl px-3 py-2 text-sm font-semibold text-left border border-indigo-300/70 text-indigo-700 bg-indigo-50/80 hover:bg-indigo-100 dark:bg-indigo-500/20 dark:text-indigo-200 dark:border-indigo-400/40"
              >
                + Đoạn chat mới
              </button>
              {sessions.length === 0 ? (
                <div className="text-xs text-slate-600 dark:text-slate-300 bg-slate-100/80 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 rounded-xl p-3">
                  Chưa có đoạn chat nào.
                </div>
              ) : (
                sortSessions(sessions).map((s) => {
                  const last = s.messages[s.messages.length - 1];
                  return (
                    <div
                      key={s.id}
                      className={`w-full rounded-xl px-3 py-2 border transition ${
                        s.id === activeSessionId
                          ? 'border-indigo-400 bg-indigo-50/70 dark:bg-indigo-500/20'
                          : 'border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-white/5 hover:border-indigo-300 dark:hover:border-indigo-400'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveSessionId(s.id);
                            setActiveTab('chat');
                          }}
                          className="flex-1 text-left min-w-0"
                        >
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{s.title}</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-300 mt-1">
                            {last ? `${last.role === 'user' ? 'Bạn' : 'Trợ lý'} • ${last.timestamp}` : 'Chưa có tin nhắn'}
                          </p>
                          {last && (
                            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 line-clamp-2">{last.content}</p>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSession(s.id)}
                          className="shrink-0 text-[11px] px-2 py-1 rounded-md border border-rose-300/70 text-rose-600 hover:bg-rose-50 dark:border-rose-400/40 dark:text-rose-300 dark:hover:bg-rose-500/10"
                          aria-label="Xóa đoạn chat"
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      );

  return (
    <>
      <div className="fixed bottom-5 right-5 z-[90] flex flex-col items-end gap-2">
        {open && chatWindow}

        {open && pendingDeleteSessionId && (
          <div className="fixed inset-0 z-[95] flex items-center justify-center bg-slate-900/45 px-4">
            <div className="w-full max-w-sm rounded-2xl border border-slate-200/80 dark:border-white/15 bg-white dark:bg-slate-900 shadow-2xl p-4">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Xác nhận xóa đoạn chat</p>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                Bạn có chắc muốn xóa đoạn chat này không? Thao tác này không thể hoàn tác.
              </p>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPendingDeleteSessionId(null)}
                  className="px-3 py-1.5 rounded-lg text-sm border border-slate-300 dark:border-white/20 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteSession}
                  className="px-3 py-1.5 rounded-lg text-sm bg-rose-600 text-white hover:bg-rose-700"
                >
                  Xóa
                </button>
              </div>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            setOpen((v) => !v);
            setActiveTab('chat');
          }}
          className="group relative h-14 w-14 rounded-full bg-gradient-to-br from-violet-500 via-indigo-500 to-blue-500 text-white shadow-xl transition-transform duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          aria-label="Mở chatbot"
        >
          <span className="absolute inset-0 rounded-full bg-white/10 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
          <span className="relative z-10 flex items-center justify-center">
            <ChatBubbleIcon />
          </span>

          {hasUnread && (
            <span className="absolute -top-0.5 -right-0.5 z-20 flex h-3.5 w-3.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex h-3.5 w-3.5 rounded-full border border-white/80 bg-rose-500" />
            </span>
          )}
        </button>
      </div>
    </>
  );
}
