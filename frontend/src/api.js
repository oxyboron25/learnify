const API = "http://localhost:8000/api/roadmap";
const AUTH = "http://localhost:8000/api/auth";

export function getToken() {
  return localStorage.getItem("learnify_token") || "";
}

export function setToken(token) {
  if (token) localStorage.setItem("learnify_token", token);
  else localStorage.removeItem("learnify_token");
}

function headers(extra = {}) {
  const h = { "Content-Type": "application/json", ...extra };
  const token = getToken();
  if (token) h.Authorization = `Token ${token}`;
  return h;
}

async function handle(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data;
}

export async function post(path, body, base = API) {
  const res = await fetch(`${base}${path}`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
  });
  return handle(res);
}

export async function get(path, base = API) {
  const res = await fetch(`${base}${path}`, { headers: headers() });
  return handle(res);
}

export async function fetchMe() {
  try {
    return await get("/me/", AUTH);
  } catch {
    setToken("");
    return null;
  }
}

export default API;
