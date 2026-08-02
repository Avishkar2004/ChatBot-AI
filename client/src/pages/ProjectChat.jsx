import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowUp,
  Check,
  ChevronLeft,
  Copy,
  Lightbulb,
  MessageCircleQuestion,
  Smile,
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
} from '../services/projects.js';
import {
  Avatar,
  Button,
  IconButton,
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

const ProjectChat = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const [project, setProject] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const endRef = useRef(null);
  const textareaRef = useRef(null);
  const sendingRef = useRef(false);
  const lastDraftRef = useRef('');
  const copyTimeoutRef = useRef(null);
  const [copyState, setCopyState] = useState(null); // { key, content, status: 'copied' | 'failed' }
  const [copyingKey, setCopyingKey] = useState(null);

  const mdPlugins = useMemo(
    () => ({
      remarkPlugins: [remarkGfm],
      rehypePlugins: [rehypeHighlight],
    }),
    []
  );

  useEffect(() => {
    const load = async () => {
      setIsLoadingHistory(true);
      try {
        const p = await getProject(projectId);
        setProject(p);
        // Load chat history
        try {
          const history = await getChatHistory(projectId);
          if (history?.sessionId) setSessionId(history.sessionId);
          if (history && history.messages && Array.isArray(history.messages)) {
            // Parse messages if they're strings
            const parsedMessages = history.messages.map((msg) => {
              if (typeof msg === 'string') {
                try {
                  return JSON.parse(msg);
                } catch {
                  return { role: 'user', content: msg };
                }
              }
              return msg;
            });
            setMessages(parsedMessages);
          } else {
            setMessages([]);
          }
        } catch (historyError) {
          // If history doesn't exist or fails, start with empty messages
          setMessages([]);
        }
      } catch (e) {
        setError(e.message);
      } finally {
        setIsLoadingHistory(false);
      }
    };
    if (token) load();
  }, [token, projectId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const canSend = !!input.trim() && !isSending && !isLoadingHistory && !isClearing;

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const send = async (e) => {
    if (e?.preventDefault) e.preventDefault();

    // Synchronous guard prevents double-send (Enter + click)
    if (sendingRef.current) return;
    if (!canSend) return;

    const trimmed = input.trim();
    const userMsg = { role: 'user', content: trimmed };
    lastDraftRef.current = trimmed;

    // Optimistic UI: append the user message plus an empty assistant bubble
    // that we stream tokens into as they arrive.
    setMessages((m) => [...m, userMsg, { role: 'assistant', content: '', streaming: true }]);
    setInput('');
    setError('');

    sendingRef.current = true;
    setIsSending(true);

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

    try {
      await sendChatStream(projectId, trimmed, sessionId || undefined, {
        onMeta: (meta) => {
          if (meta?.sessionId && meta.sessionId !== sessionId) {
            setSessionId(meta.sessionId);
          }
        },
        onDelta: (_delta, full) => {
          updateStreaming((last) => ({ ...last, content: full }));
        },
      });

      // Finalize: drop the streaming flag and guard against an empty reply.
      updateStreaming((last) => ({
        role: 'assistant',
        content: last.content?.trim()
          ? last.content
          : 'I couldn’t generate a response this time. Please try again.',
      }));
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to send message. Please try again.';
      setError(msg);

      // Rollback the assistant placeholder and the optimistic user message,
      // then restore the draft for editing/retry.
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
      sendingRef.current = false;
      setIsSending(false);
    }
  };

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
  }, [projectId]);

  useEffect(() => {
    if (copyState && copyState.key >= messages.length) {
      resetCopyState();
    }
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

    if (!success) {
      setCopyState({ key: messageKey, content: trimmed, status: 'failed' });
      copyTimeoutRef.current = setTimeout(() => {
        setCopyState(null);
        copyTimeoutRef.current = null;
      }, 2500);
      return;
    }

    setCopyState({ key: messageKey, content: trimmed, status: 'copied' });
    copyTimeoutRef.current = setTimeout(() => {
      setCopyState(null);
      copyTimeoutRef.current = null;
    }, 2000);
  };

  const getCopyFeedback = (messageKey, content) => {
    const trimmed = (content || '').trim();
    if (!copyState || copyState.key !== messageKey || copyState.content !== trimmed) {
      return null;
    }
    return copyState.status;
  };

  const handleClearChat = async () => {
    setIsClearing(true);
    setError('');
    try {
      await clearChatHistory(projectId);
      setMessages([]);
      setSessionId('');
      setShowClearConfirm(false);
      setError('');
      resetCopyState();
    } catch (e) {
      setError(e.message || 'Failed to clear chat history');
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="flex h-[100dvh] flex-col bg-surface">
      {/* Header */}
      <header className="z-20 shrink-0 border-b border-line bg-surface/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-3xl items-center gap-3 px-4 sm:px-6">
          <IconButton
            label="Back"
            icon={ChevronLeft}
            size="lg"
            onClick={() => navigate(-1)}
            className="-ml-2"
          />
          <LogoMark size="md" />
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-[15px] font-semibold leading-tight text-white">
              {project?.name || 'AI Assistant'}
            </h1>
            <p className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <span
                className={cn(
                  'h-1.5 w-1.5 rounded-full',
                  isSending ? 'animate-pulse-dot bg-brand-400' : 'bg-emerald-400'
                )}
              />
              {isSending ? 'Responding' : 'Online'}
            </p>
          </div>
          {messages.length > 0 && (
            <IconButton
              label="Clear conversation"
              icon={Trash2}
              size="lg"
              variant="danger"
              onClick={() => setShowClearConfirm(true)}
            />
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
                    <div key={idx} className="flex justify-end gap-3">
                      <p className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-brand-600 px-4 py-2.5 text-sm leading-relaxed text-white">
                        {m.content}
                      </p>
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
                  <div key={idx} className="flex gap-3">
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

                          {!!m.content?.trim() && !m.streaming && (
                            <button
                              type="button"
                              onClick={() => handleCopyResponse(idx, m.content)}
                              disabled={isCopying}
                              aria-live="polite"
                              className={cn(
                                'focus-ring mt-2.5 inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 text-xs font-medium transition-colors disabled:opacity-60',
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

          <form onSubmit={send}>
            {/* The whole shell takes the focus ring, so the textarea and its
                send button read as one control. */}
            <div className="flex items-end gap-2 rounded-xl border border-line bg-surface-muted/50 p-2 transition-colors focus-within:border-brand-500/60 focus-within:ring-2 focus-within:ring-brand-500/20">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Send a message…"
                rows="1"
                disabled={isSending || isLoadingHistory || isClearing}
                aria-label="Message"
                className={cn(
                  'max-h-40 min-h-[2.25rem] flex-1 resize-none bg-transparent px-2 py-1.5 text-sm leading-relaxed',
                  'text-slate-100 placeholder:text-slate-500 focus:outline-none disabled:opacity-60',
                  input.trim().length === 0 ? 'overflow-hidden' : 'overflow-y-auto'
                )}
                onKeyDown={(e) => {
                  // Avoid sending while IME composing (important for some keyboards/languages)
                  if (e.isComposing) return;
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    send(e);
                  }
                }}
              />
              <Button
                type="submit"
                size="md"
                disabled={!canSend}
                loading={isSending}
                aria-label="Send message"
                className="!h-9 !w-9 !px-0"
              >
                {!isSending && <ArrowUp size={16} aria-hidden="true" />}
              </Button>
            </div>
          </form>

          <p className="mt-2 px-1 text-[11px] text-slate-600">
            <Kbd>Enter</Kbd> to send · <Kbd>Shift</Kbd> + <Kbd>Enter</Kbd> for a new line
          </p>
        </div>
      </div>

      <Modal
        open={showClearConfirm}
        onClose={() => !isClearing && setShowClearConfirm(false)}
        size="sm"
        title="Clear conversation?"
        description="Every message in this conversation will be permanently deleted. This cannot be undone."
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setShowClearConfirm(false)}
              disabled={isClearing}
            >
              Cancel
            </Button>
            <Button variant="danger" loading={isClearing} onClick={handleClearChat}>
              Clear conversation
            </Button>
          </>
        }
      >
        <p className="tnum text-[13px] text-slate-400">
          {messages.length} message{messages.length === 1 ? '' : 's'} will be removed.
        </p>
      </Modal>
    </div>
  );
};

function Kbd({ children }) {
  return (
    <kbd className="rounded border border-line bg-white/[0.04] px-1.5 py-0.5 font-sans text-[10px] font-medium text-slate-400">
      {children}
    </kbd>
  );
}

export default ProjectChat;
