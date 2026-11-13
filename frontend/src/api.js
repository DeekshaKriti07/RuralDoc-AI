const API_BASE = (import.meta.env.VITE_API_BASE || "/api").replace(/\/$/, "");

export async function signup(name, email, password) {
  const res = await fetch(`${API_BASE}/auth/signup`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Signup failed");
  return data; // { token, user }
}

export async function login(email, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Login failed");
  return data; // { token, user }
}

// Helper for all future authenticated requests
export async function apiRequest(path, options = {}) {
  
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: "include",
    signal: options.signal || AbortSignal.timeout(120000),
    headers: {
      "Content-Type": "application/json",
      
      ...options.headers,
    },
  });
  const data = await res.json();
  if (res.status === 401) window.dispatchEvent(new Event("ruraldoc-session-expired"));
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}