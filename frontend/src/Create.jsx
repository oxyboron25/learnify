import { useState } from "react";
import { post } from "./api";
import { Loading } from "./shared";

const PLAN_QUESTIONS = [
  { key: "goal", q: "What is your main learning goal?", options: ["Get a Job", "Grow in my current role", "Build Projects / Side Hustles", "Strengthen Fundamentals", "Explore a New Field"] },
  { key: "experience", q: "How much experience do you have?", options: ["Complete beginner", "Some basics", "Intermediate", "Advanced"] },
  { key: "hours", q: "How many hours can you commit per week?", options: ["1-3", "3-5", "5-10", "10+"] },
  { key: "interests", q: "Which areas interest you most? (type freely)", options: null },
  { key: "timeline", q: "What is your timeline?", options: ["2 weeks", "1 month", "1-3 months", "3-6 months"] },
];

export function PlanCreate({ onSaved }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({ goal: "", experience: "", hours: "", interests: "", timeline: "" });
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const q = PLAN_QUESTIONS[step];
  const pick = (val) => {
    setAnswers((a) => ({ ...a, [q.key]: val }));
    if (step < PLAN_QUESTIONS.length - 1) setStep(step + 1);
    else setStep(PLAN_QUESTIONS.length); // done, show generate
  };

  const generate = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await post("/ai/plan/", { answers });
      setResult(data);
      onSaved();
    } catch (err) {
      setError(err.message || "Generation failed.");
    } finally {
      setLoading(false);
    }
  };

  if (result) return <PlanView artifact={result} />;

  return (
    <main className="content narrow">
      <div className="page-title">
        <h2>Create a Learning Plan</h2>
        <p>Answer a few questions to get a customized week-by-week plan.</p>
      </div>

      {step < PLAN_QUESTIONS.length ? (
        <div className="panel">
          <div className="wizard-progress">
            <span>{step + 1} of {PLAN_QUESTIONS.length}</span>
            <div className="wizard-bar"><div style={{ width: `${((step + 1) / PLAN_QUESTIONS.length) * 100}%` }} /></div>
          </div>
          <h3 className="wizard-q">{q.q}</h3>
          {q.options ? (
            <div className="wizard-options">
              {q.options.map((opt) => (
                <label key={opt} className="wizard-option">
                  <input
                    type="radio"
                    name={q.key}
                    checked={answers[q.key] === opt}
                    onChange={() => pick(opt)}
                  />
                  {opt}
                </label>
              ))}
            </div>
          ) : (
            <div className="wizard-text">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="e.g. backend, databases, machine learning"
              />
              <button
                className="btn btn-primary"
                onClick={() => { setAnswers((a) => ({ ...a, interests: text })); setStep(step + 1); }}
              >
                Next Question
              </button>
            </div>
          )}
          {q.options && answers[q.key] && step > 0 && (
            <button className="btn btn-secondary wizard-next" onClick={() => setStep(step + 1)}>
              Next Question
            </button>
          )}
        </div>
      ) : (
        <div className="panel wizard-done">
          <h3>Ready to generate your plan</h3>
          <ul className="answers-list">
            {PLAN_QUESTIONS.map((qq) => (
              <li key={qq.key}><strong>{qq.q}</strong> {answers[qq.key] || "-"}</li>
            ))}
          </ul>
          <button className="btn btn-dark" onClick={generate} disabled={loading}>
            {loading ? "Generating..." : "Generate Plan"}
          </button>
        </div>
      )}

      {loading && <Loading text="Building your personalized plan..." />}
      {error && <div className="alert">{error}</div>}
    </main>
  );
}

export function PlanView({ artifact }) {
  const d = artifact.data || {};
  return (
    <main className="content narrow">
      <div className="page-title">
        <h2>{d.title || artifact.topic}</h2>
        <p>{d.summary}</p>
      </div>
      <ol className="timeline">
        {(d.weeks || []).map((w, i) => (
          <li key={i} className="node">
            <span className="node-dot">W{w.week}</span>
            <div className="node-card">
              <div className="node-head"><h3>{w.focus}</h3></div>
              <ul className="task-list">
                {(w.tasks || []).map((t, j) => <li key={j}>{t}</li>)}
              </ul>
            </div>
          </li>
        ))}
      </ol>
    </main>
  );
}

function CourseCreateForm({ onSaved }) {
  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState("beginner");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await post("/ai/course/", { topic, level });
      setResult(data);
      onSaved();
    } catch (err) {
      setError(err.message || "Generation failed.");
    } finally {
      setLoading(false);
    }
  };

  if (result) return <CourseView artifact={result} />;

  return (
    <main className="content narrow">
      <div className="page-title center">
        <h2>What can I help you learn?</h2>
        <p>Enter a topic below to generate a personalized course for it</p>
      </div>
      <form className="panel form" onSubmit={submit}>
        <label>
          Topic
          <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Go Concurrency, React Hooks" required />
        </label>
        <label>
          Level
          <select value={level} onChange={(e) => setLevel(e.target.value)}>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </label>
        <button type="submit" className="btn btn-dark" disabled={loading}>
          {loading ? "Generating..." : "Generate Course"}
        </button>
      </form>
      {loading && <Loading text="Designing your course..." />}
      {error && <div className="alert">{error}</div>}
    </main>
  );
}

export function CourseView({ artifact }) {
  const d = artifact.data || {};
  return (
    <main className="content narrow">
      <div className="page-title">
        <h2>{d.title || artifact.topic}</h2>
        <p>{d.summary}</p>
      </div>
      <ol className="timeline">
        {(d.modules || []).map((m, i) => (
          <li key={i} className="node">
            <span className="node-dot">{i + 1}</span>
            <div className="node-card">
              <div className="node-head">
                <h3>{m.title}</h3>
                <span className="xp-chip">{(m.lessons || []).length} lessons</span>
              </div>
              <ul className="task-list">
                {(m.lessons || []).map((l, j) => <li key={j}>{l}</li>)}
              </ul>
            </div>
          </li>
        ))}
      </ol>
    </main>
  );
}

function GuideCreateForm({ onSaved }) {
  const [topic, setTopic] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await post("/ai/guide/", { topic });
      setResult(data);
      onSaved();
    } catch (err) {
      setError(err.message || "Generation failed.");
    } finally {
      setLoading(false);
    }
  };

  if (result) return <GuideView artifact={result} />;

  return (
    <main className="content narrow">
      <div className="page-title center">
        <h2>Write a Guide</h2>
        <p>Get a concise, structured guide on any topic</p>
      </div>
      <form className="panel form" onSubmit={submit}>
        <label>
          Topic
          <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. How DNS works, REST vs GraphQL" required />
        </label>
        <button type="submit" className="btn btn-dark" disabled={loading}>
          {loading ? "Writing..." : "Generate Guide"}
        </button>
      </form>
      {loading && <Loading text="Writing your guide..." />}
      {error && <div className="alert">{error}</div>}
    </main>
  );
}

export function GuideView({ artifact }) {
  const d = artifact.data || {};
  return (
    <main className="content narrow">
      <div className="page-title">
        <h2>{d.title || artifact.topic}</h2>
      </div>
      <article className="guide-article">
        {(d.sections || []).map((s, i) => (
          <section key={i}>
            <h4>{s.heading}</h4>
            <p>{s.body}</p>
          </section>
        ))}
      </article>
    </main>
  );
}

function QuizCreateForm({ onSaved }) {
  const [topic, setTopic] = useState("");
  const [format, setFormat] = useState("mcq");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await post("/ai/quiz/", { topic, format });
      setResult(data);
      onSaved();
    } catch (err) {
      setError(err.message || "Generation failed.");
    } finally {
      setLoading(false);
    }
  };

  if (result) return <QuizPlay artifact={result} />;

  return (
    <main className="content narrow">
      <div className="page-title center">
        <h2>Test your Knowledge</h2>
        <p>Create a personalized quiz to test your understanding of any topic</p>
      </div>
      <form className="panel form" onSubmit={submit}>
        <label>
          What topic would you like to quiz yourself on?
          <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. JavaScript Closures, SQL Joins" required />
        </label>
        <label>
          Format
          <select value={format} onChange={(e) => setFormat(e.target.value)}>
            <option value="mcq">Multi-Choice</option>
            <option value="open">Open-Ended</option>
          </select>
        </label>
        <button type="submit" className="btn btn-dark" disabled={loading}>
          {loading ? "Generating..." : "Generate Quiz"}
        </button>
      </form>
      {loading && <Loading text="Creating your quiz..." />}
      {error && <div className="alert">{error}</div>}
    </main>
  );
}

export function QuizPlay({ artifact }) {
  const d = artifact.data || {};
  const questions = d.questions || [];
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const mcq = questions.filter((q) => q.options && q.options.length);
  const score = mcq.filter((q, qi) => answers[q.question] === q.answer_index).length;

  return (
    <main className="content narrow">
      <div className="page-title">
        <h2>{d.title || artifact.topic}</h2>
        <p>{questions.length} questions</p>
      </div>

      {questions.map((q, i) => {
        const hasOptions = q.options && q.options.length;
        return (
          <div key={i} className="panel quiz-block">
            <h4>{i + 1}. {q.question}</h4>
            {hasOptions ? (
              <div className="quiz-options light">
                {q.options.map((opt, j) => {
                  let cls = "";
                  if (submitted) {
                    if (j === q.answer_index) cls = "correct";
                    else if (answers[q.question] === j) cls = "wrong";
                  } else if (answers[q.question] === j) {
                    cls = "picked";
                  }
                  return (
                    <button
                      key={j}
                      className={`quiz-option light ${cls}`}
                      disabled={submitted}
                      onClick={() => setAnswers((a) => ({ ...a, [q.question]: j }))}
                    >
                      <span className="option-key">{String.fromCharCode(65 + j)}</span>
                      {opt}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div>
                <textarea
                  className="open-answer"
                  rows={3}
                  placeholder="Write your answer..."
                  value={answers[q.question] || ""}
                  disabled={submitted}
                  onChange={(e) => setAnswers((a) => ({ ...a, [q.question]: e.target.value }))}
                />
                {submitted && q.model_answer && (
                  <div className="model-answer">
                    <strong>Model answer:</strong> {q.model_answer}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {!submitted ? (
        <button className="btn btn-dark" onClick={() => setSubmitted(true)} disabled={Object.keys(answers).length < questions.length}>
          Submit Answers
        </button>
      ) : (
        <div className="quiz-score">
          Score: {score} / {mcq.length} multiple-choice correct
        </div>
      )}
    </main>
  );
}

export default function Create({ kind, onSaved }) {
  if (kind === "plan") return <PlanCreate onSaved={onSaved} />;
  if (kind === "course") return <CourseCreateForm onSaved={onSaved} />;
  if (kind === "guide") return <GuideCreateForm onSaved={onSaved} />;
  if (kind === "quiz") return <QuizCreateForm onSaved={onSaved} />;
  return null;
}

export function ArtifactView({ artifact }) {
  if (artifact.kind === "plan") return <PlanView artifact={artifact} />;
  if (artifact.kind === "course") return <CourseView artifact={artifact} />;
  if (artifact.kind === "guide") return <GuideView artifact={artifact} />;
  if (artifact.kind === "quiz") return <QuizPlay artifact={artifact} />;
  return null;
}
