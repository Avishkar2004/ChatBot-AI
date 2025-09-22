const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:8000';

export async function listProjects(token) {
  const res = await fetch(`${API_BASE}/api/projects`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch projects');
  return data;
}

export async function createProject(token, payload) {
  const res = await fetch(`${API_BASE}/api/projects`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to create project');
  return data;
}

export async function getProject(token, projectId) {
  const res = await fetch(`${API_BASE}/api/projects/${projectId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch project');
  return data;
}

export async function listPrompts(token, projectId) {
  const res = await fetch(`${API_BASE}/api/projects/${projectId}/prompts`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch prompts');
  return data;
}

export async function createPrompt(token, projectId, payload) {
  const res = await fetch(`${API_BASE}/api/projects/${projectId}/prompts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to create prompt');
  return data;
}

export async function sendChat(token, projectId, message) {
  const res = await fetch(`${API_BASE}/api/projects/${projectId}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ message }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to chat');
  return data;
}


