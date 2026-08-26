import { useEffect, useRef, useState } from "react";
import { post, setToken } from "./api";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

function GoogleButton({ onCredential }) {
  const divRef = useRef(null);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || divRef.current === null) return;

    const render = () => {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => onCredential(response.credential),
      });
      window.google.accounts.id.renderButton(divRef.current, {
        theme: "outline",
        size: "large",
        width: 320,
        text: "continue_with",
      });
    };

    if (window.google?.accounts) {
      render();
    } else {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.onload = render;
      document.head.appendChild(script);
    }
  }, [onCredential]);

  if (!GOOGLE_CLIENT_ID) {
    return (
      <button type="button" className="btn-google disabled" disabled title="Set VITE_GOOGLE_CLIENT_ID to enable">
        <GoogleIcon />
        Continue with Google
      </button>
    );
  }
  return <div ref={divRef} className="google-btn-wrap" />;
}

export function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M23.5 12.3c0-.9-.1-1.5-.3-2.2H12v4.1h6.5c-.1 1.1-.8 2.7-2.4 3.8l3.7 2.9c2.3-2.1 3.7-5.1 3.7-8.6z" />
      <path fill="#34A853" d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.7-2.9c-1 .7-2.4 1.2-4.2 1.2-3.1 0-5.8-2.1-6.7-5l-3.9 3C3.3 21.3 7.3 24 12 24z" />
      <path fill="#FBBC05" d="M5.3 14.4c-.2-.7-.4-1.5-.4-2.4s.2-1.7.4-2.4l-3.9-3C.6 8.2 0 10 0 12s.6 3.8 1.4 5.4l3.9-3z" />
      <path fill="#EA4335" d="M12 4.7c2.2 0 3.7.9 4.6 1.8L20 3.1C17.9 1.2 15.2 0 12 0 7.3 0 3.3 2.7 1.4 6.6l3.9 3c.9-2.9 3.6-4.9 6.7-4.9z" />
    </svg>
  );
}

export default function AuthPage({ onAuthed }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({
    username: "demo@learnify.app",
    email: "demo@learnify.app",
    password: "demo1234",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const path = mode === "login" ? "/login/" : "/register/";
      const data = await post(path, form, "http://localhost:8000/api/auth");
      setToken(data.token);
      onAuthed(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleCredential = async (credential) => {
    setError("");
    setBusy(true);
    try {
      const data = await post("/google/", { credential }, "http://localhost:8000/api/auth");
      setToken(data.token);
      onAuthed(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card glass">
        <a className="logo auth-logo">
          <span className="logo-mark">L</span>
          Learnify
        </a>
        <h1 className="serif-italic">{mode === "login" ? "Welcome back" : "Start learning smarter"}</h1>
        <p className="auth-sub">
          {mode === "login"
            ? "Log in to continue your personalized learning journey"
            : "Create an account and get your first AI roadmap in seconds"}
        </p>

        {error && <div className="alert auth-alert">{error}</div>}

        <form className="form" onSubmit={submit}>
          <label>
            Username or email
            <input
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder="you@example.com"
              required
            />
          </label>
          {mode === "signup" && (
            <label>
              Email
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
                required
              />
            </label>
          )}
          <label>
            Password
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="At least 6 characters"
              required
            />
          </label>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? "..." : mode === "login" ? "Log in" : "Create account"}
          </button>
        </form>

        <div className="divider"><span>or</span></div>

        <GoogleButton onCredential={handleCredential} />

        <p className="auth-switch">
          {mode === "login" ? (
            <>New here? <button onClick={() => { setMode("signup"); setError(""); }}>Create an account</button></>
          ) : (
            <>Already have an account? <button onClick={() => { setMode("login"); setError(""); }}>Log in</button></>
          )}
        </p>
      </div>
    </div>
  );
}
