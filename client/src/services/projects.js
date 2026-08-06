import api, { API_ENDPOINTS, normalizeApiError } from "../config/api.js";
import { getToken, clearSession } from "../lib/authStorage";

const unwrapList = (data, key) => {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data[key])) return data[key];
  if (data && Array.isArray(data.data)) return data.data;
  return [];
};

export async function listProjects(forceRefresh = false) {
  try {
    // Add cache-busting query parameter if force refresh is needed
    const url = forceRefresh
      ? `${API_ENDPOINTS.projects.list}?_t=${Date.now()}`
      : API_ENDPOINTS.projects.list;

    const response = await api.get(url);
    const data = response.data;
    const list = unwrapList(data, "projects");
    if (list.length || Array.isArray(data) || data?.projects || data?.data) {
      return list;
    }
    return data ? [data] : [];
  } catch (error) {
    throw normalizeApiError(error, "Could not load your projects.");
  }
}

export async function createProject(payload) {
  try {
    const response = await api.post(API_ENDPOINTS.projects.create, payload);
    return response.data;
  } catch (error) {
    throw normalizeApiError(error, "Could not create the project.");
  }
}

export async function getProject(projectId) {
  try {
    const response = await api.get(API_ENDPOINTS.projects.get(projectId));
    return response.data;
  } catch (error) {
    throw normalizeApiError(error, "Could not load this project.");
  }
}

export async function updateProject(projectId, payload) {
  try {
    const response = await api.put(
      API_ENDPOINTS.projects.update(projectId),
      payload
    );
    return response.data;
  } catch (error) {
    throw normalizeApiError(error, "Could not save the project.");
  }
}

export async function deleteProject(projectId) {
  try {
    const response = await api.delete(API_ENDPOINTS.projects.delete(projectId));
    return response.data;
  } catch (error) {
    throw normalizeApiError(error, "Could not delete the project.");
  }
}

export async function listPrompts(projectId, forceRefresh = false) {
  try {
    const url = forceRefresh
      ? `${API_ENDPOINTS.prompts.list(projectId)}?_t=${Date.now()}`
      : API_ENDPOINTS.prompts.list(projectId);
    const response = await api.get(url);
    return unwrapList(response.data, "prompts");
  } catch (error) {
    throw normalizeApiError(error, "Could not load the instructions.");
  }
}

export async function createPrompt(projectId, payload) {
  try {
    const response = await api.post(
      API_ENDPOINTS.prompts.create(projectId),
      payload
    );
    return response.data;
  } catch (error) {
    throw normalizeApiError(error, "Could not save the instruction.");
  }
}

export async function getPrompt(projectId, promptId) {
  try {
    const response = await api.get(
      API_ENDPOINTS.prompts.get(projectId, promptId)
    );
    return response.data;
  } catch (error) {
    throw normalizeApiError(error, "Could not load the instruction.");
  }
}

export async function updatePrompt(projectId, promptId, payload) {
  try {
    const response = await api.put(
      API_ENDPOINTS.prompts.update(projectId, promptId),
      payload
    );
    return response.data;
  } catch (error) {
    throw normalizeApiError(error, "Could not save the instruction.");
  }
}

export async function deletePrompt(projectId, promptId) {
  try {
    const response = await api.delete(
      API_ENDPOINTS.prompts.delete(projectId, promptId)
    );
    return response.data;
  } catch (error) {
    throw normalizeApiError(error, "Could not delete the instruction.");
  }
}

// ---------------------------------------------------------------------------
// Conversation threads
// ---------------------------------------------------------------------------

export async function listConversations(projectId) {
  try {
    const response = await api.get(API_ENDPOINTS.conversations.list(projectId));
    return unwrapList(response.data, "conversations");
  } catch (error) {
    throw normalizeApiError(error, "Could not load your conversations.");
  }
}

export async function createConversation(projectId, title) {
  try {
    const response = await api.post(
      API_ENDPOINTS.conversations.create(projectId),
      title ? { title } : {}
    );
    return response.data?.conversation ?? response.data;
  } catch (error) {
    throw normalizeApiError(error, "Could not start a new chat.");
  }
}

export async function renameConversation(projectId, conversationId, title) {
  try {
    const response = await api.patch(
      API_ENDPOINTS.conversations.rename(projectId, conversationId),
      { title }
    );
    return response.data?.conversation ?? response.data;
  } catch (error) {
    throw normalizeApiError(error, "Could not rename this chat.");
  }
}

export async function deleteConversation(projectId, conversationId) {
  try {
    const response = await api.delete(
      API_ENDPOINTS.conversations.delete(projectId, conversationId)
    );
    return response.data;
  } catch (error) {
    throw normalizeApiError(error, "Could not delete this chat.");
  }
}

export async function searchConversations(projectId, query, { signal } = {}) {
  try {
    const response = await api.get(
      API_ENDPOINTS.conversations.search(projectId),
      { params: { q: query }, signal }
    );
    return unwrapList(response.data, "results");
  } catch (error) {
    if (error?.code === "ERR_CANCELED") return [];
    throw normalizeApiError(error, "Search failed. Please try again.");
  }
}

// ---------------------------------------------------------------------------
// Chat
// ---------------------------------------------------------------------------

export async function sendChat(projectId, message, conversationId) {
  try {
    const response = await api.post(API_ENDPOINTS.chat.send(projectId), {
      message,
      conversationId,
    });
    return response.data;
  } catch (error) {
    throw normalizeApiError(error, "Could not send your message.");
  }
}

/**
 * Stream a chat reply over Server-Sent Events.
 *
 * Axios can't read a streaming body in the browser, so we use fetch +
 * ReadableStream directly. Deltas are delivered via the `onDelta` callback as
 * they arrive; the resolved promise contains the full reply plus metadata.
 *
 * Pass `signal` to stop a reply mid-flight — aborting closes the connection,
 * which the server sees and uses to stop generating.
 *
 * @param {string} projectId
 * @param {string} message
 * @param {{ conversationId?: string, retryFromMessageId?: string }} [options]
 * @param {{ onDelta?: (delta: string, full: string) => void,
 *           onMeta?: (meta: { model?: string, conversationId?: string }) => void,
 *           onSaved?: (saved: { userMessageId?: string, assistantMessageId?: string, title?: string }) => void,
 *           signal?: AbortSignal }} [handlers]
 * @returns {Promise<{ reply: string, model?: string, conversationId?: string, stopped?: boolean }>}
 */
export async function sendChatStream(
  projectId,
  message,
  { conversationId, retryFromMessageId } = {},
  { onDelta, onMeta, onSaved, signal } = {}
) {
  const token = getToken();

  let response;
  try {
    response = await fetch(API_ENDPOINTS.chat.stream(projectId), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ message, conversationId, retryFromMessageId }),
      signal,
    });
  } catch (err) {
    if (err?.name === "AbortError") throw err;
    throw new Error("Can't reach the server. Check your connection and try again.");
  }

  if (response.status === 401) {
    // Mirror the axios interceptor: drop the dead token and bounce to login.
    clearSession();
    window.location.href = "/login";
    throw new Error("Session expired. Please log in again.");
  }

  if (!response.ok || !response.body) {
    let msg = `Request failed (${response.status})`;
    try {
      const data = await response.json();
      msg = data?.message || msg;
    } catch {
      // non-JSON error body; keep the generic message
    }
    throw new Error(msg);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let full = "";
  let meta = {};
  let saved;
  let stopped = false;

  // Aborting mid-read rejects `reader.read()`; that is a deliberate stop, not
  // a failure, so it resolves with whatever text already arrived.
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // SSE events are separated by a blank line. Keep the trailing partial
      // chunk in the buffer until its terminator arrives.
      const events = buffer.split("\n\n");
      buffer = events.pop() ?? "";

      for (const evt of events) {
        const line = evt.trim();
        if (!line.startsWith("data:")) continue;

        const data = line.slice(5).trim();
        if (!data || data === "[DONE]") continue;

        let payload;
        try {
          payload = JSON.parse(data);
        } catch {
          continue; // ignore malformed frames
        }

        if (payload.error) throw new Error(payload.error);
        if (payload.meta) {
          meta = payload.meta;
          onMeta?.(payload.meta);
        }
        if (payload.saved) {
          saved = payload.saved;
          onSaved?.(payload.saved);
        }
        if (payload.delta) {
          full += payload.delta;
          onDelta?.(payload.delta, full);
        }
      }
    }
  } catch (err) {
    if (err?.name === "AbortError" || signal?.aborted) {
      stopped = true;
    } else {
      throw err;
    }
  } finally {
    try {
      reader.releaseLock?.();
    } catch {
      // already released by the abort
    }
  }

  return { reply: full, stopped, saved, ...meta };
}

export async function getChatHistory(projectId, conversationId) {
  try {
    const response = await api.get(API_ENDPOINTS.chat.history(projectId), {
      params: conversationId ? { conversationId } : undefined,
    });
    return response.data;
  } catch (error) {
    throw normalizeApiError(error, "Could not load this conversation.");
  }
}

export async function clearChatHistory(projectId, conversationId) {
  try {
    const response = await api.delete(API_ENDPOINTS.chat.clear(projectId), {
      params: conversationId ? { conversationId } : undefined,
    });
    return response.data;
  } catch (error) {
    throw normalizeApiError(error, "Could not clear this conversation.");
  }
}
