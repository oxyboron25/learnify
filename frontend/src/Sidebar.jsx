import { Avatar } from "./shared";

const CREATE_ITEMS = [
  { key: "plan", label: "Plan" },
  { key: "course", label: "Course" },
  { key: "guide", label: "Guide" },
  { key: "roadmap", label: "Roadmap" },
  { key: "quiz", label: "Quiz" },
];

const LIBRARY_ITEMS = [
  { key: "plan", label: "Plans" },
  { key: "course", label: "Courses" },
  { key: "guide", label: "Guides" },
  { key: "roadmap", label: "Roadmaps" },
  { key: "quiz", label: "Quizzes" },
];

export default function Sidebar({ view, setView, open }) {
  return (
    <aside className={`sidebar ${open ? "open" : ""}`}>
      <div className="side-top">
        <a className="logo side-logo" onClick={() => setView({ page: "roadmap" })}>
          <span className="logo-mark">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M4 18 L12 10 L20 18" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M4 11 L12 3 L20 11" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          Learnify
        </a>
        <div className="side-brand">
          <strong>AI Tutor</strong>
          <span>Your personalized learning companion</span>
        </div>

        <div className="side-group">
          <div className="side-heading">Create with AI</div>
          {CREATE_ITEMS.map((it) => (
            <button
              key={it.key}
              className={`side-link ${view.page === "create" && view.kind === it.key ? "active" : ""}`}
              onClick={() => setView({ page: "create", kind: it.key })}
            >
              {it.label}
            </button>
          ))}
        </div>

        <div className="side-group">
          <div className="side-heading">My Learning</div>
          {LIBRARY_ITEMS.map((it) => (
            <button
              key={it.key}
              className={`side-link ${view.page === "library" && view.tab === it.key ? "active" : ""}`}
              onClick={() => setView({ page: "library", tab: it.key })}
            >
              {it.label}
            </button>
          ))}
        </div>

        <div className="side-group">
          <button
            className={`side-link ${view.page === "tutor" ? "active" : ""}`}
            onClick={() => setView({ page: "tutor" })}
          >
            Ask AI Tutor
          </button>
          <button
            className={`side-link ${view.page === "community" ? "active" : ""}`}
            onClick={() => setView({ page: "community" })}
          >
            Community
          </button>
        </div>

        <div className="upgrade-box">
          <strong>Upgrade</strong>
          <span>Unlimited AI chats, courses, guides, roadmaps and more.</span>
          <em>Free demo user</em>
        </div>
      </div>

      <div className="side-profile">
        <Avatar name="Ankit" />
        <div className="user-meta">
          <span className="user-name">Ankit</span>
          <span className="user-plan">Free User</span>
        </div>
      </div>
    </aside>
  );
}
