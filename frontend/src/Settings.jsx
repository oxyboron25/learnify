import { useState } from "react";
import { post } from "./api";

export default function Settings({ user, onUserUpdated, theme, setTheme }) {
  const [key, setKey] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const saveKey = async () => {
    setMsg(""); setErr(""); setBusy(true);
    try {
      const updated = await post("/byok/", { gemini_api_key: key.trim() }, "http://localhost:8000/api/auth");
      onUserUpdated(updated);
      setMsg(key.trim() ? "API key saved. AI calls now use your own key." : "API key removed.");
      setKey("");
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  const togglePremium = async () => {
    setMsg(""); setErr("");
    try {
      const updated = await post("/premium/", {}, "http://localhost:8000/api/auth");
      onUserUpdated(updated);
      setMsg(updated.is_premium ? "Premium activated." : "Downgraded to free plan.");
    } catch (e) {
      setErr(e.message);
    }
  };

  return (
    <main className="content settings-page">
      <div className="page-title">
        <h2>Settings</h2>
        <p>Manage your account, plan and AI access</p>
      </div>

      {(msg || err) && (
        <div className={err ? "alert" : "notice"}>{err || msg}</div>
      )}

      <section className="glass card-block">
        <h3 className="serif-italic">Account</h3>
        <div className="account-grid">
          <div><span className="k">Username</span><span>{user.username}</span></div>
          <div><span className="k">Email</span><span>{user.email || "-"}</span></div>
          <div><span className="k">Sign-in method</span><span style={{ textTransform: "capitalize" }}>{user.provider}</span></div>
          <div><span className="k">Plan</span><span className={user.is_premium ? "plan-badge premium" : "plan-badge"}>{user.is_premium ? "Premium" : "Free"}</span></div>
          {!user.is_premium && (
            <div><span className="k">AI usage today</span><span>{user.usage_today} / {user.free_limit} free calls</span></div>
          )}
        </div>
      </section>

      <section className="glass card-block">
        <h3 className="serif-italic">Bring your own API key (BYOK)</h3>
        <p className="muted-p">
          Paste your Google Gemini API key and Learnify will use it for all AI
          generation - unlimited calls, no upgrade needed. Get one free at{" "}
          <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">Google AI Studio</a>.
        </p>
        <div className="wizard-text byok-row">
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder={user.has_byok ? "A key is saved - paste a new one to replace it" : "AIza..."}
          />
          <button className="btn btn-primary btn-sm" onClick={saveKey} disabled={busy}>
            Save
          </button>
          {user.has_byok && (
            <button className="btn btn-secondary btn-sm" onClick={() => { setKey(""); saveKey(); }}>
              Remove
            </button>
          )}
        </div>
      </section>

      <section className="glass card-block">
        <h3 className="serif-italic">Learnify Premium</h3>
        {user.is_premium ? (
          <>
            <p className="muted-p">You have unlimited AI generation with the platform key.</p>
            <button className="btn btn-secondary btn-sm" onClick={togglePremium}>Switch back to Free</button>
          </>
        ) : (
          <>
            <ul className="premium-perks">
              <li>Unlimited AI roadmaps, courses, guides &amp; quizzes</li>
              <li>Unlimited tutor &amp; doubt-bot chats</li>
              <li>No daily limits - no API key needed</li>
              <li>Priority generation speed</li>
            </ul>
            <button className="btn-premium" onClick={togglePremium}>Activate Premium (demo)</button>
          </>
        )}
      </section>

      <section className="glass card-block">
        <h3 className="serif-italic">Appearance</h3>
        <p className="muted-p">Choose how Learnify looks.</p>
        <div className="theme-row">
          <button
            className={`theme-opt ${theme === "dark" ? "active" : ""}`}
            onClick={() => setTheme("dark")}
          >
            Dark
          </button>
          <button
            className={`theme-opt ${theme === "light" ? "active" : ""}`}
            onClick={() => setTheme("light")}
          >
            Light
          </button>
        </div>
      </section>
    </main>
  );
}
