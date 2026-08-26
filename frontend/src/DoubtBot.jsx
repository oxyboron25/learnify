import { useEffect, useRef, useState } from "react";
import API from "./api";

export default function DoubtBot({ roadmapId, topic }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState(() => [
    {
      role: "bot",
      text: topic
        ? `Hi! Ask me anything about ${topic} or your roadmap.`
        : "Hi! Ask me anything you're learning.",
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, open]);

  const send = async () => {
    const q = input.trim();
    if (!q || busy) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text: q }]);
    setBusy(true);
    try {
      const res = await fetch(`${API}/ask/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, roadmap_id: roadmapId }),
      });
      const data = await res.json();
      setMessages((m) => [
        ...m,
        { role: "bot", text: data.answer || data.error || "Something went wrong." },
      ]);
    } catch {
      setMessages((m) => [...m, { role: "bot", text: "Could not reach the tutor. Is the backend running?" }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className={`doubt-panel ${open ? "open" : ""}`}>
        <div className="doubt-head">
          <span className="doubt-title"><span className="doubt-dot" />Doubt Bot</span>
          <button className="close-btn" onClick={() => setOpen(false)} aria-label="Minimize">&minus;</button>
        </div>
        <div className="doubt-messages" ref={listRef}>
          {messages.map((m, i) => (
            <div key={i} className={`msg ${m.role}`}>{m.text}</div>
          ))}
          {busy && <div className="msg bot typing">Thinking...</div>}
        </div>
        <div className="doubt-input-row">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Ask a doubt..."
          />
          <button onClick={send} disabled={busy || !input.trim()}>Send</button>
        </div>
      </div>
      <button className={`doubt-fab ${open ? "hidden" : ""}`} onClick={() => setOpen(true)}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Ask a doubt
      </button>
    </>
  );
}
