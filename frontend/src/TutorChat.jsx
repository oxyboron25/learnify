import { useEffect, useRef, useState } from "react";
import API, { post } from "./api";

const SUGGESTIONS = [
  "What roadmap should I pick?",
  "What are the best jobs for me?",
  "Recommend me a project based on my expertise",
  "Recommend me a topic I can learn in an hour",
];

const CHIPS = ["Help select a career path", "Help me find a job", "Learn a Topic", "Test my Knowledge"];

export default function TutorChat({ topic }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages]);

  const ask = async (q) => {
    const question = (q || input).trim();
    if (!question || busy) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text: question }]);
    setBusy(true);
    try {
      const data = await post("/ask/", { question, roadmap_id: null });
      setMessages((m) => [
        ...m,
        { role: "bot", text: data.answer || data.error || "Something went wrong." },
      ]);
    } catch (err) {
      setMessages((m) => [...m, { role: "bot", text: err.message || "Could not reach the tutor." }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="tutor-page">
      {messages.length === 0 ? (
        <div className="tutor-empty">
          <h2>How can I help you?</h2>
          <div className="tutor-chips">
            {CHIPS.map((c) => (
              <span key={c} className="tutor-chip">{c}</span>
            ))}
          </div>
          <div className="tutor-suggestions">
            {SUGGESTIONS.map((s) => (
              <button key={s} className="tutor-suggestion" onClick={() => ask(s)}>
                {s}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="tutor-messages" ref={listRef}>
          {messages.map((m, i) => (
            <div key={i} className={`tutor-msg ${m.role}`}>
              <div className="tutor-msg-role">{m.role === "user" ? "You" : "AI Tutor"}</div>
              <div className="tutor-msg-text">{m.text}</div>
            </div>
          ))}
          {busy && <div className="tutor-msg bot"><div className="tutor-msg-role">AI Tutor</div><div className="tutor-msg-text typing">Thinking...</div></div>}
        </div>
      )}

      <div className="tutor-input-wrap">
        {topic && <div className="tutor-context">Learning context: {topic}</div>}
        <div className="tutor-input-row">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && ask()}
            placeholder="Ask me anything..."
          />
          <button onClick={() => ask()} disabled={busy || !input.trim()}>Send</button>
        </div>
      </div>
    </main>
  );
}
