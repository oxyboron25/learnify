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

export default function Sidebar({ view, setView, user, onLogout }) {
  return (
    <aside className="sidebar">
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
          <em className="side-tagline">Your personalized learning companion</em>
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
          <button
            className={`side-link ${view.page === "settings" ? "active" : ""}`}
            onClick={() => setView({ page: "settings" })}
          >
            Settings
          </button>
        </div>

        {!user.is_premium && (
          <button className="upgrade-box" onClick={() => setView({ page: "settings" })}>
            <strong>Upgrade</strong>
            <span>Unlimited AI chats, courses, guides, roadmaps and more.</span>
          </button>
        )}
      </div>

      <div className="side-profile">
        <Avatar name={user.first_name || user.username} url={user.avatar_url} />
        <div className="user-meta">
          <span className="user-name">{user.first_name || user.username}</span>
          <span className="user-plan">{user.is_premium ? "Premium" : "Free User"}</span>
        </div>
        <button className="logout-btn" onClick={onLogout} title="Log out">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </aside>
  );
}
