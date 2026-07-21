import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import {
  getProject,
  sendChatStream,
  getChatHistory,
  clearChatHistory,
} from "../services/projects.js";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";

const ProjectChat = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [project, setProject] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const endRef = useRef(null);
  const textareaRef = useRef(null);
  const sendingRef = useRef(false);
  const lastDraftRef = useRef("");
  const copyTimeoutRef = useRef(null);
  const [copyState, setCopyState] = useState(null); // { key, content, status: 'copied' | 'failed' }
  const [copyingKey, setCopyingKey] = useState(null);

  const mdPlugins = useMemo(
    () => ({
      remarkPlugins: [remarkGfm],
      rehypePlugins: [rehypeHighlight],
    }),
    [],
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
              if (typeof msg === "string") {
                try {
                  return JSON.parse(msg);
                } catch {
                  return { role: "user", content: msg };
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
          // console.log("No chat history found or error loading:", historyError.message);
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
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const canSend =
    !!input.trim() && !isSending && !isLoadingHistory && !isClearing;

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const send = async (e) => {
    if (e?.preventDefault) e.preventDefault();

    // Synchronous guard prevents double-send (Enter + click)
    if (sendingRef.current) return;
    if (!canSend) return;

    const trimmed = input.trim();
    const userMsg = { role: "user", content: trimmed };
    lastDraftRef.current = trimmed;

    // Optimistic UI: append the user message plus an empty assistant bubble
    // that we stream tokens into as they arrive.
    setMessages((m) => [
      ...m,
      userMsg,
      { role: "assistant", content: "", streaming: true },
    ]);
    setInput("");
    setError("");

    sendingRef.current = true;
    setIsSending(true);

    // Replace the trailing streaming placeholder using an updater so we never
    // depend on a stale index.
    const updateStreaming = (updater) =>
      setMessages((m) => {
        const copy = [...m];
        const last = copy[copy.length - 1];
        if (last?.role === "assistant" && last.streaming) {
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
        role: "assistant",
        content: last.content?.trim()
          ? last.content
          : "I couldn’t generate a response this time. Please try again.",
      }));
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to send message. Please try again.";
      setError(msg);

      // Rollback the assistant placeholder and the optimistic user message,
      // then restore the draft for editing/retry.
      setMessages((m) => {
        const copy = [...m];
        if (
          copy[copy.length - 1]?.role === "assistant" &&
          copy[copy.length - 1]?.streaming
        ) {
          copy.pop();
        }
        const last = copy[copy.length - 1];
        if (last?.role === "user" && last?.content === trimmed) copy.pop();
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
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(textarea);
      return ok;
    } catch (_) {
      return false;
    }
  };

  const handleCopyResponse = async (messageKey, text) => {
    const trimmed = (text || "").trim();
    if (!trimmed || copyingKey === messageKey) return;

    if (copyTimeoutRef.current) {
      clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = null;
    }

    setCopyingKey(messageKey);

    const success = await writeToClipboard(trimmed);
    setCopyingKey(null);

    if (!success) {
      setCopyState({ key: messageKey, content: trimmed, status: "failed" });
      copyTimeoutRef.current = setTimeout(() => {
        setCopyState(null);
        copyTimeoutRef.current = null;
      }, 2500);
      return;
    }

    setCopyState({ key: messageKey, content: trimmed, status: "copied" });
    copyTimeoutRef.current = setTimeout(() => {
      setCopyState(null);
      copyTimeoutRef.current = null;
    }, 2000);
  };

  const getCopyFeedback = (messageKey, content) => {
    const trimmed = (content || "").trim();
    if (
      !copyState ||
      copyState.key !== messageKey ||
      copyState.content !== trimmed
    ) {
      return null;
    }
    return copyState.status;
  };

  const handleClearChat = async () => {
    setIsClearing(true);
    setError("");
    try {
      await clearChatHistory(projectId);
      setMessages([]);
      setSessionId("");
      setShowClearConfirm(false);
      setError("");
      resetCopyState();
    } catch (e) {
      setError(e.message || "Failed to clear chat history");
    } finally {
      setIsClearing(false);
    }
  };

  const quickActions = [
    { text: "Hello! How are you?", icon: "" },
    { text: "What can you help me with?", icon: "" },
    { text: "Tell me a joke", icon: "" },
  ];

  return (
    <div className="h-[100dvh] flex flex-col bg-surface text-gray-100 overflow-hidden">
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-20 bg-surface/70 backdrop-blur-xl border-b border-white/10"
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-white/5 rounded-lg transition-colors"
              >
                <svg
                  className="w-5 h-5 text-gray-200/80"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h1 className="text-lg font-semibold text-white">
                  {project?.name || "AI Assistant"}
                </h1>
                <p className="text-xs text-gray-400">Online</p>
              </div>
              {messages.length > 0 && (
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="p-2 text-gray-300/80 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                  title="Clear chat history"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="max-w-3xl mx-auto px-4 sm:px-6 pt-3"
          >
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-center gap-2">
              <svg
                className="w-5 h-5 text-red-500 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-red-200 text-sm">{error}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Clear Chat Confirmation Modal */}
      <AnimatePresence>
        {showClearConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => !isClearing && setShowClearConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-surface-elevated rounded-2xl p-6 max-w-md w-full shadow-2xl border border-white/10"
            >
              <h3 className="text-lg font-semibold text-white mb-2">
                Clear Chat History?
              </h3>
              <p className="text-sm text-gray-300/80 mb-6">
                This will permanently delete all messages in this conversation.
                This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  disabled={isClearing}
                  className="px-4 py-2 text-gray-200/90 font-medium rounded-lg border border-white/10 hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClearChat}
                  disabled={isClearing}
                  className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {isClearing ? "Clearing..." : "Clear Chat"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto scroll-smooth">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
          {isLoadingHistory ? (
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mb-4"></div>
                <p className="text-gray-400">Loading chat history...</p>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center justify-center min-h-[60vh]"
            >
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="w-20 h-20 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-6 shadow-xl"
              >
                <svg
                  className="w-10 h-10 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </motion.div>
              <h2 className="text-2xl font-bold text-white mb-2">
                How can I help you?
              </h2>
              <p className="text-gray-400 text-center mb-8 max-w-md">
                Start a conversation with your AI assistant
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {quickActions.map((action, idx) => (
                  <motion.button
                    key={idx}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 + idx * 0.1 }}
                    onClick={() => setInput(action.text)}
                    className="px-4 py-2.5 bg-white/5 text-gray-200 rounded-xl border border-white/10 hover:border-emerald-400/50 hover:bg-emerald-500/10 transition-all text-sm font-medium flex items-center gap-2 shadow-sm hover:shadow"
                  >
                    <span>{action.icon}</span>
                    <span>{action.text}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {messages.map((m, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {m.role === "assistant" && (
                      <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                        <svg
                          className="w-4 h-4 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                          />
                        </svg>
                      </div>
                    )}
                    <div
                      className={`max-w-[75%] sm:max-w-[70%] ${m.role === "user" ? "order-first" : ""}`}
                    >
                      <div
                        className={`rounded-2xl px-4 py-3 shadow-sm ${
                          m.role === "user"
                            ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-br-sm"
                            : "bg-white/5 text-gray-100 border border-white/10 rounded-bl-sm"
                        }`}
                      >
                        {m.role === "assistant" ? (
                          m.streaming && !m.content?.trim() ? (
                            <div
                              className="flex items-center gap-1 py-1"
                              aria-label="AI is typing"
                            >
                              {[0, 0.2, 0.4].map((delay) => (
                                <motion.div
                                  key={delay}
                                  className="w-2 h-2 bg-emerald-500 rounded-full"
                                  animate={{ y: [0, -4, 0] }}
                                  transition={{
                                    duration: 0.6,
                                    repeat: Infinity,
                                    delay,
                                  }}
                                />
                              ))}
                            </div>
                          ) : (
                            <div className="markdown text-sm leading-relaxed break-words">
                              <ReactMarkdown
                                remarkPlugins={mdPlugins.remarkPlugins}
                                rehypePlugins={mdPlugins.rehypePlugins}
                                components={{
                                  a: ({ href, children, ...props }) => (
                                    <a
                                      href={href}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-emerald-600 dark:text-emerald-400 hover:underline"
                                      {...props}
                                    >
                                      {children}
                                    </a>
                                  ),
                                  code: ({
                                    inline,
                                    className,
                                    children,
                                    ...props
                                  }) => {
                                    const isInline = inline || !className;
                                    if (isInline) {
                                      return (
                                        <code
                                          className="px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 font-mono text-[0.9em]"
                                          {...props}
                                        >
                                          {children}
                                        </code>
                                      );
                                    }
                                    return (
                                      <code className={className} {...props}>
                                        {children}
                                      </code>
                                    );
                                  },
                                  pre: ({ children }) => (
                                    <pre className="rounded-xl overflow-x-auto bg-black/60 text-gray-100 p-3 border border-white/10">
                                      {children}
                                    </pre>
                                  ),
                                }}
                              >
                                {m.content || ""}
                              </ReactMarkdown>
                              {m.streaming && (
                                <span
                                  className="inline-block w-1.5 h-4 align-text-bottom ml-0.5 bg-emerald-400 animate-pulse rounded-sm"
                                  aria-hidden="true"
                                />
                              )}
                            </div>
                          )
                        ) : (
                          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                            {m.content}
                          </p>
                        )}
                      </div>
                      {m.role === "assistant" &&
                        !!m.content?.trim() &&
                        (() => {
                          const feedback = getCopyFeedback(idx, m.content);
                          const isCopying = copyingKey === idx;
                          const isCopied = feedback === "copied";
                          const isFailed = feedback === "failed";

                          return (
                            <button
                              type="button"
                              onClick={() => handleCopyResponse(idx, m.content)}
                              disabled={isCopying}
                              className={`mt-1.5 text-xs flex items-center gap-1 transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
                                isCopied
                                  ? "text-emerald-400"
                                  : isFailed
                                    ? "text-red-400"
                                    : "text-gray-400 hover:text-emerald-400"
                              }`}
                              title={
                                isCopied
                                  ? "Copied to clipboard"
                                  : isFailed
                                    ? "Could not copy"
                                    : "Copy response"
                              }
                              aria-live="polite"
                            >
                              {isCopying ? (
                                <>
                                  <svg
                                    className="w-3.5 h-3.5 animate-spin"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                  >
                                    <circle
                                      className="opacity-25"
                                      cx="12"
                                      cy="12"
                                      r="10"
                                      stroke="currentColor"
                                      strokeWidth="4"
                                    />
                                    <path
                                      className="opacity-75"
                                      fill="currentColor"
                                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    />
                                  </svg>
                                  Copying…
                                </>
                              ) : isCopied ? (
                                <>
                                  <svg
                                    className="w-3.5 h-3.5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="2"
                                      d="M5 13l4 4L19 7"
                                    />
                                  </svg>
                                  Copied
                                </>
                              ) : isFailed ? (
                                <>
                                  <svg
                                    className="w-3.5 h-3.5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="2"
                                      d="M6 18L18 6M6 6l12 12"
                                    />
                                  </svg>
                                  Failed to copy
                                </>
                              ) : (
                                <>
                                  <svg
                                    className="w-3.5 h-3.5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="2"
                                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                    />
                                  </svg>
                                  Copy
                                </>
                              )}
                            </button>
                          );
                        })()}
                      <p
                        className={`text-xs text-gray-400 mt-1.5 px-1 ${m.role === "user" ? "text-right" : "text-left"}`}
                      >
                        {m.role === "user" ? "You" : "AI"}
                      </p>
                    </div>
                    {m.role === "user" && (
                      <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                        <svg
                          className="w-4 h-4 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* The streaming assistant bubble renders its own typing dots
                  until the first token arrives, so no separate indicator. */}
              <div ref={endRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky bottom-0 bg-surface/70 backdrop-blur-xl border-t border-white/10 shadow-2xl shadow-black/30"
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
          <form onSubmit={send} className="relative">
            <div className="relative flex items-end gap-2">
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message..."
                  className={[
                    "w-full px-4 py-3 pr-12 bg-white/5 text-gray-100 placeholder-gray-400 rounded-2xl border border-white/10",
                    "focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-transparent",
                    "resize-none min-h-[48px] max-h-32 shadow-sm transition-all",
                    // Hide scrollbar when empty; allow scroll only after it reaches max height
                    input.trim().length === 0
                      ? "overflow-hidden"
                      : "overflow-y-auto",
                  ].join(" ")}
                  rows="1"
                  disabled={isSending || isLoadingHistory || isClearing}
                  onKeyDown={(e) => {
                    // Avoid sending while IME composing (important for some keyboards/languages)
                    if (e.isComposing) return;
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send(e);
                    }
                  }}
                />
                <button
                  type="submit"
                  disabled={!canSend}
                  aria-label="Send message"
                  className="absolute right-2 bottom-2 p-2 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-600 hover:to-teal-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg active:scale-95"
                >
                  {isSending ? (
                    <svg
                      className="w-4 h-4 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  ) : (
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2 px-1">
              Press{" "}
              <kbd className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-xs">
                Enter
              </kbd>{" "}
              to send,{" "}
              <kbd className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-xs">
                Shift+Enter
              </kbd>{" "}
              for new line
            </p>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default ProjectChat;
