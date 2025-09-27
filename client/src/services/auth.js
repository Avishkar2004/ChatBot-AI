const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8000";

// Helper function to handle API responses
async function handleApiResponse(response) {
  const data = await response.json();
  
  if (!response.ok) {
    // Handle different error types
    if (response.status === 401) {
      throw new Error("Invalid credentials");
    } else if (response.status === 409) {
      throw new Error("Email already exists");
    } else if (response.status === 400) {
      throw new Error(data.message || "Invalid request");
    } else if (response.status >= 500) {
      throw new Error("Server error. Please try again later.");
    } else {
      throw new Error(data.message || "Request failed");
    }
  }
  
  return data;
}

export async function register(email, password) {
  try {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({ email, password }),
    });
    
    return await handleApiResponse(res);
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
}

export async function login(email, password) {
  try {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({ email, password }),
    });
    
    return await handleApiResponse(res);
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}

export async function fetchMe(token) {
  try {
    const res = await fetch(`${API_BASE}/api/auth/me`, {
      headers: { 
        "Authorization": `Bearer ${token}`,
        "Accept": "application/json"
      },
    });
    
    return await handleApiResponse(res);
  } catch (error) {
    console.error('Fetch user error:', error);
    throw error;
  }
}
