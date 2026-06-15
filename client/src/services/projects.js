import api, { API_ENDPOINTS } from "../config/api.js";

export async function listProjects(forceRefresh = false) {
  try {
    // Add cache-busting query parameter if force refresh is needed
    const url = forceRefresh
      ? `${API_ENDPOINTS.projects.list}?_t=${Date.now()}`
      : API_ENDPOINTS.projects.list;

    const response = await api.get(url);

    // Ensure we return an array
    const data = response.data;
    if (Array.isArray(data)) {
      return data;
    }

    // Handle wrapped responses
    if (data && Array.isArray(data.projects)) {
      return data.projects;
    }

    if (data && Array.isArray(data.data)) {
      return data.data;
    }

    // If it's not an array, return empty array or wrap single object
    return Array.isArray(data) ? data : data ? [data] : [];
  } catch (error) {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw error;
  }
}

export async function createProject(payload) {
  try {
    const response = await api.post(API_ENDPOINTS.projects.create, payload);
    return response.data;
  } catch (error) {
    console.error("Failed to create project:", error);

    // Extract more specific error message
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    } else if (error.message) {
      throw new Error(error.message);
    } else {
      throw new Error("Failed to create project");
    }
  }
}

export async function getProject(projectId) {
  try {
    const response = await api.get(API_ENDPOINTS.projects.get(projectId));
    return response.data;
  } catch (error) {
    console.error("Failed to fetch project:", error);
    throw error;
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
    console.error("Failed to update project:", error);
    throw error;
  }
}

export async function deleteProject(projectId) {
  try {
    const response = await api.delete(API_ENDPOINTS.projects.delete(projectId));
    return response.data;
  } catch (error) {
    console.error("Failed to delete project:", error);
    throw error;
  }
}

function normalizePromptList(data) {
  if (Array.isArray(data)) {
    return data;
  }
  if (data && Array.isArray(data.prompts)) {
    return data.prompts;
  }
  if (data && Array.isArray(data.data)) {
    return data.data;
  }
  return [];
}

export async function listPrompts(projectId, forceRefresh = false) {
  try {
    const url = forceRefresh
      ? `${API_ENDPOINTS.prompts.list(projectId)}?_t=${Date.now()}`
      : API_ENDPOINTS.prompts.list(projectId);
    const response = await api.get(url);
    return normalizePromptList(response.data);
  } catch (error) {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    console.error("Failed to fetch prompts:", error);
    throw error;
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
    console.error("Failed to create prompt:", error);
    throw error;
  }
}

export async function getPrompt(projectId, promptId) {
  try {
    const response = await api.get(
      API_ENDPOINTS.prompts.get(projectId, promptId)
    );
    return response.data;
  } catch (error) {
    console.error("Failed to fetch prompt:", error);
    throw error;
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
    console.error("Failed to update prompt:", error);
    throw error;
  }
}

export async function deletePrompt(projectId, promptId) {
  try {
    const response = await api.delete(
      API_ENDPOINTS.prompts.delete(projectId, promptId)
    );
    return response.data;
  } catch (error) {
    console.error("Failed to delete prompt:", error);
    throw error;
  }
}

export async function sendChat(projectId, message, sessionId) {
  try {
    const response = await api.post(API_ENDPOINTS.chat.send(projectId), {
      message,
      // optional: when provided, server will continue the same redis session
      sessionId,
    });
    return response.data;
  } catch (error) {
    console.error("Failed to send chat:", error);
    throw error;
  }
}

/**
 * Stream a chat reply over Server-Sent Events.
 *
 * Axios can't read a streaming body in the browser, so we use fetch +
 * ReadableStream directly. Deltas are delivered via the `onDelta` callback as
 * they arrive; the resolved promise contains the full reply plus metadata.
 *
 * @param {string} projectId
 * @param {string} message
 * @param {string} [sessionId]
 * @param {{ onDelta?: (delta: string, full: string) => void,
 *           onMeta?: (meta: { model?: string, sessionId?: string }) => void,
 *           signal?: AbortSignal }} [handlers]
 * @returns {Promise<{ reply: string, model?: string, sessionId?: string }>}
 */
export async function sendChatStream(
  projectId,
  message,
  sessionId,
  { onDelta, onMeta, signal } = {}
) {
  const token = localStorage.getItem("auth_token");

  const response = await fetch(API_ENDPOINTS.chat.stream(projectId), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ message, sessionId }),
    signal,
  });

  if (response.status === 401) {
    // Mirror the axios interceptor: drop the dead token and bounce to login.
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
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
        if (payload.delta) {
          full += payload.delta;
          onDelta?.(payload.delta, full);
        }
      }
    }
  } finally {
    reader.releaseLock?.();
  }

  return { reply: full, ...meta };
}

export async function getChatHistory(projectId) {
  try {
    const response = await api.get(API_ENDPOINTS.chat.history(projectId));
    return response.data;
  } catch (error) {
    console.error("Failed to fetch chat history:", error);
    throw error;
  }
}

export async function clearChatHistory(projectId) {
  try {
    const response = await api.delete(API_ENDPOINTS.chat.clear(projectId));
    return response.data;
  } catch (error) {
    console.error("Failed to clear chat history:", error);
    throw error;
  }
}
