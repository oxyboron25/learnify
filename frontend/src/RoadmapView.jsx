import { useState } from "react";
import API, { post } from "./api";
import { ModuleResources } from "./shared";

function FinalChallenge({ challenge, index, completed, onComplete }) {
  const [selected, setSelected] = useState(null);
  if (!challenge || !challenge.question) return null;
  const isCorrect = selected !== null && selected === challenge.answer_index;

  const pick = (i) => {
    if (completed || isCorrect) return;
    setSelected(i);
    if (i === challenge.answer_index) onComplete(index);
  };

  return (
    <section className={`challenge-card ${completed ? "done" : ""}`}>
      <div className="challenge-head">
        <span className="challenge-badge">Final Challenge</span>
        <span className="challenge-xp">+{challenge.xp} XP</span>
      </div>
      <h3>{challenge.title}</h3>
      {challenge.description && <p className="challenge-desc">{challenge.description}</p>}
      <div className="quiz">
        <p className="quiz-q">{challenge.question}</p>
        <div className="quiz-options">
          {challenge.options.map((opt, i) => {
            const state =
              i === selected ? (i === challenge.answer_index ? "correct" : "wrong") : "";
            return (
              <button
                key={i}
                className={`quiz-option ${state}`}
                onClick={() => pick(i)}
                disabled={completed || (selected !== null && isCorrect)}
              >
                <span className="option-key">{String.fromCharCode(65 + i)}</span>
                {opt}
              </button>
            );
          })}
        </div>
      </div>
      {completed && <p className="challenge-done-label">Challenge complete</p>}
      {!completed && isCorrect && <p className="challenge-done-label">Correct - XP awarded</p>}
      {!completed && selected !== null && !isCorrect && (
        <p className="challenge-hint">Not quite. Try another answer.</p>
      )}
    </section>
  );
}

export function RoadmapForm({ onGenerated, onError }) {
  const [form, setForm] = useState({ topic: "", level: "beginner", goal: "" });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await post("/generate/", form);
      onGenerated(data);
    } catch (err) {
      onError(err.message || "Generation failed. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  const generateEverything = async () => {
    const presets = [
      { topic: "Web Development", level: "beginner", goal: "Become job-ready as a full-stack developer" },
      { topic: "Machine Learning", level: "intermediate", goal: "Land an ML engineer internship" },
      { topic: "Data Structures", level: "intermediate", goal: "Crack coding interviews" },
      { topic: "DevOps", level: "beginner", goal: "Automate deployments with CI/CD" },
      { topic: "Rust", level: "advanced", goal: "Build high-performance systems tools" },
    ];
    const preset = presets[Math.floor(Math.random() * presets.length)];
    setForm(preset);
    setLoading(true);
    try {
      const data = await post("/generate/", preset);
      onGenerated(data);
    } catch (err) {
      onError(err.message || "Generation failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <section className="hero">
        <h1>AI Learning Roadmaps</h1>
        <p>
          Tell us what you want to learn and get a personalized, step-by-step roadmap
          with XP rewards. Check in daily to build your streak.
        </p>
      </section>
      <form className="panel form" onSubmit={submit}>
        <label>
          Topic
          <input
            value={form.topic}
            onChange={(e) => setForm({ ...form, topic: e.target.value })}
            placeholder="e.g. Web Development, Machine Learning, Rust"
            required
          />
        </label>
        <label>
          Current Level
          <select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </label>
        <label>
          Goal
          <input
            value={form.goal}
            onChange={(e) => setForm({ ...form, goal: e.target.value })}
            placeholder="e.g. Become job-ready as a backend engineer"
          />
        </label>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Generating..." : "Generate Roadmap"}
        </button>
        <div className="divider"><span>or</span></div>
        <button type="button" className="btn btn-outline" onClick={generateEverything} disabled={loading}>
          One-click: generate everything here
        </button>
      </form>
      {loading && <div className="loading">Generating your personalized roadmap...</div>}
    </>
  );
}

export default function RoadmapView({ roadmap, setRoadmap, onError }) {
  const markComplete = async (index) => {
    try {
      const data = await post(`/${roadmap.id}/complete/`, { index });
      setRoadmap(data);
    } catch {
      onError("Could not mark this module as complete.");
    }
  };

  if (!roadmap) return null;

  const maxXp = roadmap.modules.reduce((s, m) => s + m.xp, 0);
  const pct = maxXp ? Math.min(100, Math.round((roadmap.xp_total / maxXp) * 100)) : 0;
  const completedCount = roadmap.completed.length;

  return (
    <main className="content">
      <div className="roadmap-head">
        <h2>{roadmap.topic}</h2>
        <span className={`pill pill-${roadmap.level}`}>{roadmap.level}</span>
      </div>
      {roadmap.goal && <p className="goal">{roadmap.goal}</p>}

      <div className="progress-panel">
        <div className="progress-meta">
          <span>{completedCount} of {roadmap.modules.length} modules complete</span>
          <span className="progress-xp">{roadmap.xp_total} / {maxXp} XP</span>
        </div>
        <div className="xpbar"><div className="xpbar-fill" style={{ width: `${pct}%` }} /></div>
      </div>

      <ol className="timeline">
        {roadmap.modules.map((m, i) => {
          const done = roadmap.completed.includes(i);
          return (
            <li key={i} className={`node ${done ? "done" : ""}`}>
              <span className="node-dot">{done ? String.fromCharCode(10003) : i + 1}</span>
              <div className="node-card">
                <div className="node-head">
                  <h3>{m.title}</h3>
                  <span className="xp-chip">{m.xp} XP</span>
                </div>
                <p>{m.description}</p>
                <ModuleResources resources={m.resources} />
                {!done ? (
                  <button className="btn btn-primary btn-sm" onClick={() => markComplete(i)}>
                    Mark as complete
                  </button>
                ) : (
                  <span className="done-label">Completed</span>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      <FinalChallenge
        challenge={roadmap.final_challenge}
        index={roadmap.modules.length}
        completed={roadmap.completed.includes(roadmap.modules.length)}
        onComplete={markComplete}
      />

      <section className="test-understanding">
        <h3>Test your understanding</h3>
        <p>
          The fastest way to make knowledge stick is to build. Take on small
          self-directed projects, break things, fix them, and revisit modules
          whenever you get stuck.
        </p>
        <div className="tu-actions">
          <a href="#" className="btn btn-primary tu-btn" onClick={(e) => e.preventDefault()}>
            Browse practice project ideas
          </a>
          <button className="btn btn-secondary" onClick={() => setRoadmap(null)}>
            Start a new roadmap
          </button>
        </div>
      </section>
    </main>
  );
}

export async function loadRoadmapById(id, setRoadmap) {
  const res = await fetch(`${API}/${id}/`);
  if (!res.ok) {
    localStorage.removeItem("learnify_roadmap_id");
    return false;
  }
  setRoadmap(await res.json());
  return true;
}
