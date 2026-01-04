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

export async function listPrompts(projectId) {
  try {
    const response = await api.get(API_ENDPOINTS.prompts.list(projectId));
    return response.data;
  } catch (error) {
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

export async function sendChat(projectId, message) {
  try {
    const response = await api.post(API_ENDPOINTS.chat.send(projectId), {
      message,
    });
    return response.data;
  } catch (error) {
    console.error("Failed to send chat:", error);
    throw error;
  }
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
