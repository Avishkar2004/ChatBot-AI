import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowUp,
  Check,
  ChevronLeft,
  Copy,
  Download,
  Lightbulb,
  MessageCircleQuestion,
  MessageSquarePlus,
  MoreHorizontal,
  PanelLeft,
  Pencil,
  RefreshCw,
  Search,
  Smile,
  Square,
  Trash2,
  X,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { useAuth } from '../context/AuthContext.jsx';
import {
  getProject,
  sendChatStream,
  getChatHistory,
  clearChatHistory,
  listConversations,
  createConversation,
  renameConversation,
  deleteConversation,
  searchConversations,
} from '../services/projects.js';
import {
  Avatar,
  Button,
  Drawer,
  IconButton,
  Input,
  LogoMark,
  Modal,
  Spinner,
  cn,
} from '../components/ui';

const quickActions = [
  { icon: Smile, text: 'Hello! How are you?' },
  { icon: MessageCircleQuestion, text: 'What can you help me with?' },
  { icon: Lightbulb, text: 'Tell me a joke' },
];

const relativeTime = (value) => {
  if (!value) return '';
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(value).toLocaleDateString();
};

const ProjectChat = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuth();

  const [project, setProject] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isLoadingThreads, setIsLoadingThreads] = useState(true);

  // Overlays
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [threadToDelete, setThreadToDelete] = useState(null);
  const [threadToRename, setThreadToRename] = useState(null);
  const [renameDraft, setRenameDraft] = useState('');
  const [isMutatingThread, setIsMutatingThread] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Search across every thread in this project
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // "Edit this message" replays the thread from that point.
  const [editing, setEditing] = useState(null); // { messageId, index }

  const endRef = useRef(null);
  const textareaRef = useRef(null);
  const sendingRef = useRef(false);
  const lastDraftRef = useRef('');
  const abortRef = useRef(null);
  const copyTimeoutRef = useRef(null);
  const [copyState, setCopyState] = useState(null); // { key, content, status }
  const [copyingKey, setCopyingKey] = useState(null);

  const mdPlugins = useMemo(
    () => ({
      remarkPlugins: [remarkGfm],
      rehypePlugins: [rehypeHighlight],
    }),
    []
  );

  const activeThread = useMemo(
    () => conversations.find((c) => c.id === activeId) || null,
    [conversations, activeId]
  );

  // ---------------------------------------------------------------------------
  // Loading
  // ---------------------------------------------------------------------------

  const loadThread = useCallback(
    async (conversationId) => {
      setIsLoadingHistory(true);
      setEditing(null);
      try {
        const history = await getChatHistory(projectId, conversationId);
        setMessages(Array.isArray(history?.messages) ? history.messages : []);
        if (history?.conversationId) setActiveId(history.conversationId);
      } catch (e) {
        setMessages([]);
        setError(e.message);
      } finally {
        setIsLoadingHistory(false);
      }
    },
    [projectId]
  );

  useEffect(() => {
    if (!token) return undefined;
    let cancelled = false;

    const load = async () => {
      setIsLoadingThreads(true);
      try {
        const [p, threads] = await Promise.all([
          getProject(projectId),
          listConversations(projectId).catch(() => []),
        ]);
        if (cancelled) return;
        setProject(p);
        setConversations(threads);
        await loadThread(threads[0]?.id);

        // Opening a project that has never been chatted with creates its first
        // thread server-side; pick it up so the rail is not empty.
        if (!cancelled && threads.length === 0) {
          setConversations(await listConversations(projectId).catch(() => []));
        }
      } catch (e) {
        if (!cancelled) {
          setError(e.message);
          setIsLoadingHistory(false);
        }
      } finally {
        if (!cancelled) setIsLoadingThreads(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [token, projectId, loadThread]);

  const refreshThreads = useCallback(async () => {
    try {
      setConversations(await listConversations(projectId));
    } catch {
      // The list is a convenience; a failure here must not break the chat.
    }
  }, [projectId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  // Abort any in-flight reply when leaving the page or switching threads.
  useEffect(
    () => () => {
      abortRef.current?.abort();
    },
    []
  );

  // ---------------------------------------------------------------------------
  // Search
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const term = searchQuery.trim();
    if (term.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return undefined;
    }

    const controller = new AbortController();
    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        setSearchResults(
          await searchConversations(projectId, term, { signal: controller.signal })
        );
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchQuery, projectId]);

  // ---------------------------------------------------------------------------
  // Sending
  // ---------------------------------------------------------------------------

  const canSend = !!input.trim() && !isSending && !isLoadingHistory && !isClearing;

  const runSend = useCallback(
    async (text, { retryFromMessageId, keepUpTo } = {}) => {
      const trimmed = text.trim();
      if (!trimmed || sendingRef.current) return;

      lastDraftRef.current = trimmed;
      const userMsg = { role: 'user', content: trimmed };

      // Optimistic UI: append the user message plus an empty assistant bubble
      // that we stream tokens into as they arrive. A retry first drops the
      // turns being replaced so the transcript matches what the server will do.
      setMessages((m) => {
        const base = typeof keepUpTo === 'number' ? m.slice(0, keepUpTo) : m;
        return [...base, userMsg, { role: 'assistant', content: '', streaming: true }];
      });
      setInput('');
      setError('');
      setEditing(null);

      sendingRef.current = true;
      setIsSending(true);

      const controller = new AbortController();
      abortRef.current = controller;

      // Replace the trailing streaming placeholder using an updater so we never
      // depend on a stale index.
      const updateStreaming = (updater) =>
        setMessages((m) => {
          const copy = [...m];
          const last = copy[copy.length - 1];
          if (last?.role === 'assistant' && last.streaming) {
            copy[copy.length - 1] = updater(last);
          }
          return copy;
        });

      let createdThread = false;

      try {
        const result = await sendChatStream(
          projectId,
          trimmed,
          { conversationId: activeId || undefined, retryFromMessageId },
          {
            signal: controller.signal,
            onMeta: (meta) => {
              if (meta?.conversationId && meta.conversationId !== activeId) {
                setActiveId(meta.conversationId);
                createdThread = true;
              }
            },
            onDelta: (_delta, full) => {
              updateStreaming((last) => ({ ...last, content: full }));
            },
            // Server ids arrive once the exchange is durable; attach them so
            // edit and regenerate work without reloading the thread.
            onSaved: (saved) => {
              setMessages((m) => {
                const copy = [...m];
                const assistant = copy[copy.length - 1];
                const userTurn = copy[copy.length - 2];
                if (userTurn?.role === 'user' && saved.userMessageId) {
                  copy[copy.length - 2] = { ...userTurn, id: saved.userMessageId };
                }
                if (assistant?.role === 'assistant' && saved.assistantMessageId) {
                  copy[copy.length - 1] = {
                    ...assistant,
                    id: saved.assistantMessageId,
                  };
                }
                return copy;
              });
            },
          }
        );

        // Finalize: drop the streaming flag and guard against an empty reply.
        updateStreaming((last) => ({
          ...last,
          streaming: false,
          stopped: result.stopped || undefined,
          content: last.content?.trim()
            ? last.content
            : result.stopped
              ? '_Stopped before a reply was generated._'
              : 'I couldn’t generate a response this time. Please try again.',
        }));

        if (createdThread || !activeId) await refreshThreads();
        else
          setConversations((list) =>
            list
              .map((c) =>
                c.id === activeId
                  ? { ...c, lastMessageAt: new Date().toISOString() }
                  : c
              )
              .sort(
                (a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt)
              )
          );
      } catch (err) {
        setError(err?.message || 'Failed to send message. Please try again.');

        // Roll the optimistic turns back and hand the draft back for editing.
        setMessages((m) => {
          const copy = [...m];
          if (copy[copy.length - 1]?.role === 'assistant' && copy[copy.length - 1]?.streaming) {
            copy.pop();
          }
          const last = copy[copy.length - 1];
          if (last?.role === 'user' && last?.content === trimmed) copy.pop();
          return copy;
        });
        setInput(lastDraftRef.current);
      } finally {
        abortRef.current = null;
        sendingRef.current = false;
        setIsSending(false);
      }
    },
    [projectId, activeId, refreshThreads]
  );

  const send = (e) => {
    if (e?.preventDefault) e.preventDefault();
    if (!canSend) return;
    runSend(input, {
      retryFromMessageId: editing?.messageId,
      keepUpTo: editing?.index,
    });
  };

  /** Cancel an in-flight reply. The text generated so far is kept and saved. */
  const stop = () => abortRef.current?.abort();

  const regenerate = (assistantIndex) => {
    // Re-ask the question that produced this reply.
    for (let i = assistantIndex - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        if (!messages[i].id) {
          setError('Reload the conversation before regenerating this reply.');
          return;
        }
        runSend(messages[i].content, {
          retryFromMessageId: messages[i].id,
          keepUpTo: i,
        });
        return;
      }
    }
  };

  const startEdit = (index) => {
    const message = messages[index];
    if (!message?.id) {
      setError('Reload the conversation before editing this message.');
      return;
    }
    setEditing({ messageId: message.id, index });
    setInput(message.content);
    textareaRef.current?.focus();
  };

  const cancelEdit = () => {
    setEditing(null);
    setInput('');
  };

  // ---------------------------------------------------------------------------
  // Thread actions
  // ---------------------------------------------------------------------------

  const openThread = async (id) => {
    if (id === activeId) {
      setDrawerOpen(false);
      return;
    }
    abortRef.current?.abort();
    setDrawerOpen(false);
    setSearchQuery('');
    setActiveId(id);
    await loadThread(id);
  };

  const startNewChat = async () => {
    setIsMutatingThread(true);
    try {
      const created = await createConversation(projectId);
      setConversations((list) => [
        { ...created, messageCount: 0 },
        ...list.filter((c) => c.id !== created.id),
      ]);
      setActiveId(created.id);
      setMessages([]);
      setInput('');
      setEditing(null);
      setDrawerOpen(false);
    } catch (e) {
      setError(e.message);
    } finally {
      setIsMutatingThread(false);
    }
  };

  const confirmRename = async () => {
    const title = renameDraft.trim();
    if (!title || !threadToRename) return;
    setIsMutatingThread(true);
    try {
      const updated = await renameConversation(projectId, threadToRename.id, title);
      setConversations((list) =>
        list.map((c) => (c.id === threadToRename.id ? { ...c, title: updated.title } : c))
      );
      setThreadToRename(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setIsMutatingThread(false);
    }
  };

  const confirmDeleteThread = async () => {
    if (!threadToDelete) return;
    setIsMutatingThread(true);
    try {
      await deleteConversation(projectId, threadToDelete.id);
      const remaining = conversations.filter((c) => c.id !== threadToDelete.id);
      setConversations(remaining);
      setThreadToDelete(null);

      if (threadToDelete.id === activeId) {
        setActiveId(remaining[0]?.id ?? null);
        if (remaining[0]?.id) await loadThread(remaining[0].id);
        else setMessages([]);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setIsMutatingThread(false);
    }
  };

  const handleClearChat = async () => {
    setIsClearing(true);
    setError('');
    try {
      await clearChatHistory(projectId, activeId || undefined);
      setMessages([]);
      setShowClearConfirm(false);
      setEditing(null);
      resetCopyState();
      await refreshThreads();
    } catch (e) {
      setError(e.message || 'Failed to clear chat history');
    } finally {
      setIsClearing(false);
    }
  };

  /** Download the open thread as Markdown — the transcript is the user's. */
  const exportChat = () => {
    const title = activeThread?.title || project?.name || 'conversation';
    const body = messages
      .filter((m) => m.content?.trim())
      .map((m) => `**${m.role === 'user' ? user?.username || 'You' : 'Assistant'}**\n\n${m.content}`)
      .join('\n\n---\n\n');

    const doc = `# ${title}\n\n_${project?.name || ''} · exported ${new Date().toLocaleString()}_\n\n${body}\n`;
    const url = URL.createObjectURL(new Blob([doc], { type: 'text/markdown' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // ---------------------------------------------------------------------------
  // Copy
  // ---------------------------------------------------------------------------

  const resetCopyState = () => {
    if (copyTimeoutRef.current) {
      clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = null;
    }
    setCopyState(null);
    setCopyingKey(null);
  };

  useEffect(() => () => resetCopyState(), []);
  useEffect(() => {
    resetCopyState();
  }, [projectId, activeId]);

  useEffect(() => {
    if (copyState && copyState.key >= messages.length) resetCopyState();
  }, [messages.length, copyState]);

  const writeToClipboard = async (text) => {
    if (!text) return false;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (_) {
      // fall through to legacy copy
    }
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(textarea);
      return ok;
    } catch (_) {
      return false;
    }
  };

  const handleCopyResponse = async (messageKey, text) => {
    const trimmed = (text || '').trim();
    if (!trimmed || copyingKey === messageKey) return;

    if (copyTimeoutRef.current) {
      clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = null;
    }

    setCopyingKey(messageKey);
    const success = await writeToClipboard(trimmed);
    setCopyingKey(null);

    setCopyState({
      key: messageKey,
      content: trimmed,
      status: success ? 'copied' : 'failed',
    });
    copyTimeoutRef.current = setTimeout(() => {
      setCopyState(null);
      copyTimeoutRef.current = null;
    }, success ? 2000 : 2500);
  };

  const getCopyFeedback = (messageKey, content) => {
    const trimmed = (content || '').trim();
    if (!copyState || copyState.key !== messageKey || copyState.content !== trimmed) {
      return null;
    }
    return copyState.status;
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const lastAssistantIndex = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'assistant') return i;
    }
    return -1;
  }, [messages]);

  const sidebar = (
    <ThreadSidebar
      conversations={conversations}
      activeId={activeId}
      loading={isLoadingThreads}
      busy={isMutatingThread}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      searchResults={searchResults}
      isSearching={isSearching}
      onNewChat={startNewChat}
      onSelect={openThread}
      onRename={(thread) => {
        setThreadToRename(thread);
        setRenameDraft(thread.title || '');
      }}
      onDelete={setThreadToDelete}
    />
  );

  return (
    <div className="flex h-[100dvh] bg-surface">
      {/* Threads live in a permanent rail on desktop and a drawer on mobile. */}
      <aside className="hidden w-72 shrink-0 border-r border-line bg-surface-muted/30 lg:flex lg:flex-col">
        {sidebar}
      </aside>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} side="left" title="Chats">
        <div className="-m-5 flex h-full flex-col">{sidebar}</div>
      </Drawer>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <header className="z-20 shrink-0 border-b border-line bg-surface/85 backdrop-blur-xl">
          <div className="mx-auto flex h-16 w-full max-w-3xl items-center gap-2 px-4 sm:px-6">
            <IconButton
              label="Chats"
              icon={PanelLeft}
              size="lg"
              onClick={() => setDrawerOpen(true)}
              className="-ml-2 lg:hidden"
            />
            <IconButton
              label="Back to project"
              icon={ChevronLeft}
              size="lg"
              onClick={() => navigate(`/projects/${projectId}`)}
              className="hidden lg:grid"
            />
            <LogoMark size="md" />
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-[15px] font-semibold leading-tight text-white">
                {activeThread?.title && activeThread.title !== 'New conversation'
                  ? activeThread.title
                  : project?.name || 'AI Assistant'}
              </h1>
              <p className="flex items-center gap-1.5 text-[11px] text-slate-500">
                <span
                  className={cn(
                    'h-1.5 w-1.5 rounded-full',
                    isSending ? 'animate-pulse-dot bg-brand-400' : 'bg-emerald-400'
                  )}
                />
                {isSending ? 'Responding' : project?.name || 'Online'}
              </p>
            </div>

            <IconButton
              label="New chat"
              icon={MessageSquarePlus}
              size="lg"
              onClick={startNewChat}
              disabled={isMutatingThread}
              className="lg:hidden"
            />
            {messages.length > 0 && (
              <>
                <IconButton
                  label="Export as Markdown"
                  icon={Download}
                  size="lg"
                  onClick={exportChat}
                />
                <IconButton
                  label="Clear conversation"
                  icon={Trash2}
                  size="lg"
                  variant="danger"
                  onClick={() => setShowClearConfirm(true)}
                />
              </>
            )}
          </div>
        </header>

        {/* Transcript */}
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6">
            {isLoadingHistory ? (
              <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
                <Spinner className="text-brand-400" />
                <p className="text-[13px] text-slate-500">Loading conversation…</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex min-h-[55vh] flex-col items-center justify-center text-center">
                <LogoMark size="lg" />
                <h2 className="mt-5 font-display text-display-sm font-bold text-white">
                  How can I help?
                </h2>
                <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-400">
                  Ask anything, or start with one of these.
                </p>
                <div className="mt-7 flex w-full max-w-md flex-col gap-2">
                  {quickActions.map(({ icon: Icon, text }) => (
                    <button
                      key={text}
                      type="button"
                      onClick={() => {
                        setInput(text);
                        textareaRef.current?.focus();
                      }}
                      className="focus-ring group flex items-center gap-3 rounded-xl border border-line bg-white/[0.02] px-4 py-3 text-left text-sm text-slate-300 transition-colors hover:border-line-strong hover:bg-white/[0.05] hover:text-white"
                    >
                      <Icon
                        size={16}
                        strokeWidth={1.75}
                        aria-hidden="true"
                        className="shrink-0 text-slate-500 transition-colors group-hover:text-brand-300"
                      />
                      {text}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map((m, idx) => {
                  if (m.role === 'user') {
                    return (
                      <div key={m.id || idx} className="group flex justify-end gap-3">
                        <div className="flex max-w-[85%] flex-col items-end">
                          <p className="whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-brand-600 px-4 py-2.5 text-sm leading-relaxed text-white">
                            {m.content}
                          </p>
                          {!isSending && (
                            <button
                              type="button"
                              onClick={() => startEdit(idx)}
                              className="focus-ring mt-1.5 inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 text-xs font-medium text-slate-500 opacity-0 transition hover:bg-white/[0.05] hover:text-slate-200 focus-visible:opacity-100 group-hover:opacity-100"
                            >
                              <Pencil size={12} aria-hidden="true" />
                              Edit
                            </button>
                          )}
                        </div>
                        <Avatar
                          name={user?.username}
                          email={user?.email}
                          size="md"
                          className="mt-0.5"
                        />
                      </div>
                    );
                  }

                  const feedback = getCopyFeedback(idx, m.content);
                  const isCopying = copyingKey === idx;
                  const isCopied = feedback === 'copied';
                  const isFailed = feedback === 'failed';
                  const waiting = m.streaming && !m.content?.trim();

                  return (
                    <div key={m.id || idx} className="flex gap-3">
                      <LogoMark size="md" className="mt-0.5" />
                      {/* Assistant replies are unboxed so code blocks, tables and
                          lists get the full column width instead of being
                          squeezed into a bubble. */}
                      <div className="min-w-0 flex-1">
                        {waiting ? (
                          <div className="flex h-8 items-center gap-1.5" aria-label="Thinking">
                            {[0, 1, 2].map((i) => (
                              <span
                                key={i}
                                className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-slate-500"
                                style={{ animationDelay: `${i * 0.16}s` }}
                              />
                            ))}
                          </div>
                        ) : (
                          <>
                            <div className="markdown break-words">
                              <ReactMarkdown
                                remarkPlugins={mdPlugins.remarkPlugins}
                                rehypePlugins={mdPlugins.rehypePlugins}
                                components={{
                                  a: ({ href, children, ...props }) => (
                                    <a href={href} target="_blank" rel="noreferrer" {...props}>
                                      {children}
                                    </a>
                                  ),
                                }}
                              >
                                {m.content || ''}
                              </ReactMarkdown>
                              {m.streaming && (
                                <span
                                  aria-hidden="true"
                                  className="ml-0.5 inline-block h-[1.05em] w-[2px] translate-y-[0.15em] animate-caret rounded-sm bg-brand-400"
                                />
                              )}
                            </div>

                            {m.stopped && (
                              <p className="mt-1.5 text-[11px] text-slate-500">Stopped by you</p>
                            )}

                            {!!m.content?.trim() && !m.streaming && (
                              <div className="mt-2.5 flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleCopyResponse(idx, m.content)}
                                  disabled={isCopying}
                                  aria-live="polite"
                                  className={cn(
                                    'focus-ring inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 text-xs font-medium transition-colors disabled:opacity-60',
                                    isCopied
                                      ? 'text-emerald-400'
                                      : isFailed
                                        ? 'text-rose-400'
                                        : 'text-slate-500 hover:bg-white/[0.05] hover:text-slate-200'
                                  )}
                                >
                                  {isCopying ? (
                                    <Spinner size="xs" className="text-current" />
                                  ) : isCopied ? (
                                    <Check size={13} aria-hidden="true" />
                                  ) : isFailed ? (
                                    <X size={13} aria-hidden="true" />
                                  ) : (
                                    <Copy size={13} aria-hidden="true" />
                                  )}
                                  {isCopying
                                    ? 'Copying…'
                                    : isCopied
                                      ? 'Copied'
                                      : isFailed
                                        ? 'Failed to copy'
                                        : 'Copy'}
                                </button>

                                {idx === lastAssistantIndex && !isSending && (
                                  <button
                                    type="button"
                                    onClick={() => regenerate(idx)}
                                    className="focus-ring inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 text-xs font-medium text-slate-500 transition-colors hover:bg-white/[0.05] hover:text-slate-200"
                                  >
                                    <RefreshCw size={13} aria-hidden="true" />
                                    Regenerate
                                  </button>
                                )}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={endRef} />
              </div>
            )}
          </div>
        </div>

        {/* Composer */}
        <div className="shrink-0 border-t border-line bg-surface/85 backdrop-blur-xl">
          <div className="mx-auto w-full max-w-3xl px-4 py-4 sm:px-6">
            {error && (
              <div
                role="alert"
                className="mb-3 flex items-start gap-2.5 rounded-lg border border-rose-500/25 bg-rose-500/10 px-3.5 py-2.5"
              >
                <AlertCircle size={15} className="mt-px shrink-0 text-rose-400" aria-hidden="true" />
                <p className="flex-1 text-[13px] leading-relaxed text-rose-200">{error}</p>
                <IconButton
                  label="Dismiss"
                  icon={X}
                  size="sm"
                  tooltip={false}
                  onClick={() => setError('')}
                  className="-mr-1 -mt-0.5"
                />
              </div>
            )}

            {editing && (
              <div className="mb-3 flex items-center gap-2.5 rounded-lg border border-brand-500/25 bg-brand-500/10 px-3.5 py-2.5">
                <Pencil size={14} className="shrink-0 text-brand-300" aria-hidden="true" />
                <p className="flex-1 text-[13px] text-brand-100">
                  Editing a message. Sending replaces it and everything after it.
                </p>
                <Button variant="ghost" size="xs" onClick={cancelEdit}>
                  Cancel
                </Button>
              </div>
            )}

            <form onSubmit={send}>
              {/* The whole shell takes the focus ring, so the textarea and its
                  send button read as one control. */}
              <div className="flex items-end gap-2 rounded-xl border border-line bg-surface-muted/50 p-2 transition-colors focus-within:border-brand-500/60 focus-within:ring-2 focus-within:ring-brand-500/20">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={editing ? 'Edit your message…' : 'Send a message…'}
                  rows="1"
                  disabled={isLoadingHistory || isClearing}
                  aria-label="Message"
                  className={cn(
                    'max-h-40 min-h-[2.25rem] flex-1 resize-none bg-transparent px-2 py-1.5 text-sm leading-relaxed',
                    'text-slate-100 placeholder:text-slate-500 focus:outline-none disabled:opacity-60',
                    input.trim().length === 0 ? 'overflow-hidden' : 'overflow-y-auto'
                  )}
                  onKeyDown={(e) => {
                    // Avoid sending while IME composing (important for some keyboards/languages)
                    if (e.isComposing) return;
                    if (e.key === 'Escape' && editing) {
                      e.preventDefault();
                      cancelEdit();
                      return;
                    }
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      send(e);
                    }
                  }}
                />

                {/* While a reply streams, the send button becomes a stop button
                    so a runaway or unwanted answer is always interruptible. */}
                {isSending ? (
                  <Button
                    type="button"
                    size="md"
                    variant="secondary"
                    onClick={stop}
                    aria-label="Stop generating"
                    className="!h-9 !w-9 !px-0"
                  >
                    <Square size={13} fill="currentColor" aria-hidden="true" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    size="md"
                    disabled={!canSend}
                    aria-label="Send message"
                    className="!h-9 !w-9 !px-0"
                  >
                    <ArrowUp size={16} aria-hidden="true" />
                  </Button>
                )}
              </div>
            </form>

            <p className="mt-2 px-1 text-[11px] text-slate-600">
              {isSending ? (
                <>Generating… press the stop button to end the reply early</>
              ) : (
                <>
                  <Kbd>Enter</Kbd> to send · <Kbd>Shift</Kbd> + <Kbd>Enter</Kbd> for a new line
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      <Modal
        open={showClearConfirm}
        onClose={() => !isClearing && setShowClearConfirm(false)}
        size="sm"
        title="Clear this conversation?"
        description="Every message in this conversation will be permanently deleted. This cannot be undone."
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowClearConfirm(false)} disabled={isClearing}>
              Cancel
            </Button>
            <Button variant="danger" loading={isClearing} onClick={handleClearChat}>
              Clear conversation
            </Button>
          </>
        }
      >
        <p className="tnum text-[13px] text-slate-400">
          {messages.length} message{messages.length === 1 ? '' : 's'} will be removed. Export it
          first if you want to keep a copy.
        </p>
      </Modal>

      <Modal
        open={!!threadToDelete}
        onClose={() => !isMutatingThread && setThreadToDelete(null)}
        size="sm"
        title="Delete this chat?"
        description="The chat and all of its messages will be permanently deleted."
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setThreadToDelete(null)}
              disabled={isMutatingThread}
            >
              Cancel
            </Button>
            <Button variant="danger" loading={isMutatingThread} onClick={confirmDeleteThread}>
              Delete chat
            </Button>
          </>
        }
      >
        <p className="text-[13px] text-slate-400">“{threadToDelete?.title}”</p>
      </Modal>

      <Modal
        open={!!threadToRename}
        onClose={() => !isMutatingThread && setThreadToRename(null)}
        size="sm"
        title="Rename chat"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setThreadToRename(null)}
              disabled={isMutatingThread}
            >
              Cancel
            </Button>
            <Button
              loading={isMutatingThread}
              disabled={!renameDraft.trim()}
              onClick={confirmRename}
            >
              Save
            </Button>
          </>
        }
      >
        <Input
          label="Name"
          value={renameDraft}
          maxLength={60}
          onChange={(e) => setRenameDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && confirmRename()}
          autoFocus
        />
      </Modal>
    </div>
  );
};

/** The thread rail: search, new chat, and the list of conversations. */
function ThreadSidebar({
  conversations,
  activeId,
  loading,
  busy,
  searchQuery,
  onSearchChange,
  searchResults,
  isSearching,
  onNewChat,
  onSelect,
  onRename,
  onDelete,
}) {
  const searching = searchQuery.trim().length >= 2;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 space-y-3 border-b border-line p-3">
        <Button
          size="md"
          fullWidth
          leftIcon={<MessageSquarePlus size={15} aria-hidden="true" />}
          onClick={onNewChat}
          disabled={busy}
        >
          New chat
        </Button>
        <Input
          size="md"
          type="search"
          aria-label="Search messages"
          placeholder="Search messages…"
          leftIcon={<Search size={14} aria-hidden="true" />}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {loading ? (
          <div className="flex justify-center py-8">
            <Spinner className="text-brand-400" />
          </div>
        ) : searching ? (
          <SearchResults
            results={searchResults}
            isSearching={isSearching}
            onSelect={onSelect}
          />
        ) : conversations.length === 0 ? (
          <p className="px-3 py-8 text-center text-[13px] text-slate-500">
            No chats yet. Start one above.
          </p>
        ) : (
          <ul className="space-y-0.5">
            {conversations.map((thread) => (
              <li key={thread.id} className="group relative">
                <button
                  type="button"
                  onClick={() => onSelect(thread.id)}
                  className={cn(
                    'focus-ring w-full rounded-lg px-3 py-2.5 pr-9 text-left transition-colors',
                    thread.id === activeId
                      ? 'bg-white/[0.07] text-white'
                      : 'text-slate-300 hover:bg-white/[0.04] hover:text-white'
                  )}
                >
                  <span className="block truncate text-[13px] font-medium">
                    {thread.title || 'New conversation'}
                  </span>
                  <span className="mt-0.5 block text-[11px] text-slate-500">
                    {thread.messageCount ? `${thread.messageCount} messages · ` : ''}
                    {relativeTime(thread.lastMessageAt)}
                  </span>
                </button>

                <ThreadMenu
                  onRename={() => onRename(thread)}
                  onDelete={() => onDelete(thread)}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function SearchResults({ results, isSearching, onSelect }) {
  if (isSearching) {
    return (
      <div className="flex justify-center py-8">
        <Spinner className="text-brand-400" />
      </div>
    );
  }
  if (!results.length) {
    return (
      <p className="px-3 py-8 text-center text-[13px] text-slate-500">
        No messages matched.
      </p>
    );
  }

  return (
    <ul className="space-y-1">
      {results.map((hit) => (
        <li key={hit.messageId}>
          <button
            type="button"
            onClick={() => onSelect(hit.conversationId)}
            className="focus-ring w-full rounded-lg px-3 py-2.5 text-left text-slate-300 transition-colors hover:bg-white/[0.04] hover:text-white"
          >
            <span className="block truncate text-[12px] font-medium text-slate-400">
              {hit.conversationTitle}
            </span>
            <span className="mt-1 block line-clamp-3 text-[13px] leading-snug">
              {hit.snippet}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

/** Per-thread rename/delete. A details element keeps it dependency-free. */
function ThreadMenu({ onRename, onDelete }) {
  const ref = useRef(null);

  useEffect(() => {
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) ref.current.open = false;
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  return (
    <details ref={ref} className="absolute right-1.5 top-2">
      <summary
        aria-label="Chat options"
        className="focus-ring grid h-7 w-7 cursor-pointer list-none place-items-center rounded-md text-slate-500 opacity-0 transition hover:bg-white/[0.08] hover:text-white focus-visible:opacity-100 group-hover:opacity-100 [&::-webkit-details-marker]:hidden"
      >
        <MoreHorizontal size={15} aria-hidden="true" />
      </summary>
      <div className="absolute right-0 z-30 mt-1 w-36 overflow-hidden rounded-lg border border-line bg-surface-floating py-1 shadow-overlay">
        <button
          type="button"
          onClick={(e) => {
            e.currentTarget.closest('details').open = false;
            onRename();
          }}
          className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-slate-300 hover:bg-white/[0.06] hover:text-white"
        >
          <Pencil size={13} aria-hidden="true" />
          Rename
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.currentTarget.closest('details').open = false;
            onDelete();
          }}
          className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-rose-300 hover:bg-rose-500/10"
        >
          <Trash2 size={13} aria-hidden="true" />
          Delete
        </button>
      </div>
    </details>
  );
}

function Kbd({ children }) {
  return (
    <kbd className="rounded border border-line bg-white/[0.04] px-1.5 py-0.5 font-sans text-[10px] font-medium text-slate-400">
      {children}
    </kbd>
  );
}

export default ProjectChat;
