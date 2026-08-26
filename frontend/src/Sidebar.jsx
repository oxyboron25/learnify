import { Avatar } from "./shared";

const ICON_PATHS = {
  home: (
    <>
      <path d="M3 10.5 12 3l9 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 9.5V21h14V9.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.5 21v-6h5v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  plan: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M8 3v4M16 3v4M3 10h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  course: (
    <>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4a2 2 0 0 0-2-2H6.5A2.5 2.5 0 0 0 4 4.5v15z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M20 17v5H6.5a2.5 2.5 0 0 1 0-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  guide: (
    <>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path d="m15.5 8.5-2 5-5 2 2-5z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </>
  ),
  quiz: (
    <>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path d="M9.3 9.3a2.7 2.7 0 1 1 3.9 2.4c-.8.4-1.2.9-1.2 1.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="17" r="0.5" fill="currentColor" stroke="currentColor" />
    </>
  ),
  roadmaps: (
    <>
      <circle cx="6" cy="5" r="2.5" stroke="currentColor" strokeWidth="2" />
      <circle cx="18" cy="19" r="2.5" stroke="currentColor" strokeWidth="2" />
      <path d="M8.5 5H15a3 3 0 0 1 0 6H9a3 3 0 0 0 0 6h6.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  tutor: (
    <>
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  community: (
    <>
      <circle cx="9" cy="8" r="3.5" stroke="currentColor" strokeWidth="2" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M16 4.8a3.5 3.5 0 0 1 0 6.4M17.5 14.2a6.5 6.5 0 0 1 4 5.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.03 1.56V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1.11-1.56 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.56-1.03H3a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.56-1.11 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34h.08A1.7 1.7 0 0 0 10.1 3.6V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1.03 1.56 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87v.08a1.7 1.7 0 0 0 1.56 1.03H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.51.88z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
};

function SideIcon({ name }) {
  return (
    <svg className="side-icon" width="15" height="15" viewBox="0 0 24 24" fill="none">
      {ICON_PATHS[name]}
    </svg>
  );
}

const CREATE_ITEMS = [
  { key: "plan", label: "Plan", icon: "plan" },
  { key: "course", label: "Course", icon: "course" },
  { key: "guide", label: "Guide", icon: "guide" },
  { key: "quiz", label: "Quiz", icon: "quiz" },
];

const LIBRARY_ITEMS = [
  { key: "plan", label: "Plans", icon: "plan" },
  { key: "course", label: "Courses", icon: "course" },
  { key: "guide", label: "Guides", icon: "guide" },
  { key: "roadmap", label: "Roadmaps", icon: "roadmaps" },
  { key: "quiz", label: "Quizzes", icon: "quiz" },
];

export default function Sidebar({ view, setView, user, onLogout }) {
  const onHome = view.page === "roadmap";
  const isCreate = view.page === "create";
  const isLibrary = view.page === "library";

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

        <button
          className={`side-home ${onHome ? "active" : ""}`}
          onClick={() => setView({ page: "roadmap" })}
        >
          <SideIcon name="home" />
          <span>Roadmap</span>
          <em>home</em>
        </button>

        <div className="side-group">
          <div className="side-heading">Create with AI</div>
          {CREATE_ITEMS.map((it) => (
            <button
              key={it.key}
              className={`side-link ${isCreate && view.kind === it.key ? "active" : ""}`}
              onClick={() => setView({ page: "create", kind: it.key })}
            >
              <SideIcon name={it.icon} />
              {it.label}
            </button>
          ))}
        </div>

        <div className="side-group">
          <div className="side-heading">My Learning</div>
          {LIBRARY_ITEMS.map((it) => (
            <button
              key={it.key}
              className={`side-link ${isLibrary && view.tab === it.key ? "active" : ""}`}
              onClick={() => setView({ page: "library", tab: it.key })}
            >
              <SideIcon name={it.icon} />
              {it.label}
            </button>
          ))}
        </div>

        <div className="side-group">
          <button
            className={`side-link ${view.page === "tutor" ? "active" : ""}`}
            onClick={() => setView({ page: "tutor" })}
          >
            <SideIcon name="tutor" />
            Ask AI Tutor
          </button>
          <button
            className={`side-link ${view.page === "community" ? "active" : ""}`}
            onClick={() => setView({ page: "community" })}
          >
            <SideIcon name="community" />
            Community
          </button>
          <button
            className={`side-link ${view.page === "settings" ? "active" : ""}`}
            onClick={() => setView({ page: "settings" })}
          >
            <SideIcon name="settings" />
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
