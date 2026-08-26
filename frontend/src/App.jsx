import { useEffect, useState } from "react";
import API, { get, post, getToken, setToken, fetchMe } from "./api";
import AuthPage from "./Auth";
import Settings from "./Settings";
import CalendarPanel from "./Calendar";
import DoubtBot from "./DoubtBot";
import Sidebar from "./Sidebar";
import RoadmapView, { RoadmapForm, loadRoadmapById } from "./RoadmapView";
import Create, { ArtifactView } from "./Create";
import Library from "./Library";
import Community from "./Community";
import TutorChat from "./TutorChat";

function ThemeToggle({ theme, setTheme }) {
  return (
    <button
      className="theme-toggle"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      {theme === "dark" ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="2"/>
          <path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M19.1 4.9l-1.8 1.8M6.7 17.3l-1.8 1.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.8 6.8 0 0 0 9.8 9.8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
    </button>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [view, setView] = useState({ page: "roadmap" });
  const [roadmap, setRoadmap] = useState(null);
  const [error, setError] = useState("");
  const [theme, setThemeState] = useState(
    () => localStorage.getItem("learnify_theme") || "dark"
  );

  const setTheme = (t) => {
    setThemeState(t);
    localStorage.setItem("learnify_theme", t);
    document.documentElement.dataset.theme = t;
  };

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, []);

  useEffect(() => {
    if (getToken()) {
      fetchMe().then(setUser).finally(() => setChecking(false));
    } else {
      setChecking(false);
    }
    const id = localStorage.getItem("learnify_roadmap_id");
    if (id) loadRoadmapById(id, setRoadmap).catch(() => {});
  }, []);

  const onAuthed = (u) => {
    setUser(u);
    setRoadmap(null);
    setView({ page: "roadmap" });
  };

  const logout = async () => {
    try { await post("/logout/", {}, "http://localhost:8000/api/auth"); } catch {}
    setToken("");
    setUser(null);
    setRoadmap(null);
    setView({ page: "roadmap" });
  };

  const onRoadmapGenerated = (data) => {
    setRoadmap(data);
    localStorage.setItem("learnify_roadmap_id", String(data.id));
    setView({ page: "roadmap" });
  };

  const openRoadmap = async (id) => {
    const ok = await loadRoadmapById(id, setRoadmap);
    if (ok) {
      localStorage.setItem("learnify_roadmap_id", String(id));
      setView({ page: "roadmap" });
    } else {
      setError("Could not open that roadmap.");
    }
  };

  const openArtifact = (artifactId) => {
    get(`/library/${artifactId}/`).then((a) => setView({ page: "artifact", artifact: a }));
  };

  if (checking) {
    return <div className="loading full-screen">Loading...</div>;
  }

  if (!user) {
    return <AuthPage onAuthed={onAuthed} />;
  }

  return (
    <div className="shell">
      <Sidebar view={view} setView={setView} user={user} onLogout={logout} />

      <div className="main-area">
        <header className="topbar slim">
          <div className="topbar-right">
            {roadmap && view.page === "roadmap" && (
              <CalendarPanel checkins={roadmap.checkins} streak={roadmap.streak} />
            )}
            <ThemeToggle theme={theme} setTheme={setTheme} />
            {!user.is_premium && (
              <button className="btn-premium" onClick={() => setView({ page: "settings" })}>
                Buy Premium
              </button>
            )}
          </div>
        </header>

        {error && <div className="alert">{error}</div>}

        {view.page === "roadmap" && (
          roadmap ? (
            <RoadmapView roadmap={roadmap} setRoadmap={setRoadmap} onError={setError} />
          ) : (
            <RoadmapForm onGenerated={onRoadmapGenerated} onError={setError} />
          )
        )}

        {view.page === "create" && (
          <Create
            kind={view.kind}
            onSaved={() => {}}
            key={view.kind + (view.nonce || "")}
          />
        )}

        {view.page === "settings" && (
          <Settings user={user} onUserUpdated={setUser} theme={theme} setTheme={setTheme} />
        )}

        {view.page === "artifact" && (
          <main className="content">
            <button
              className="btn btn-secondary back-btn"
              onClick={() => setView({ page: "library", tab: view.artifact.kind })}
            >
              Back to library
            </button>
            <ArtifactView artifact={view.artifact} />
          </main>
        )}

        {view.page === "library" && (
          <Library
            tab={view.tab || "plan"}
            setTab={(tab) => setView({ page: "library", tab })}
            openRoadmap={openRoadmap}
            openArtifact={openArtifact}
          />
        )}

        {view.page === "tutor" && <TutorChat topic={roadmap ? roadmap.topic : null} />}

        {view.page === "community" && (
          <Community onNew={() => setView({ page: "create", kind: "course" })} />
        )}
      </div>

      {view.page !== "settings" && (
        <DoubtBot roadmapId={roadmap ? roadmap.id : null} topic={roadmap ? roadmap.topic : null} />
      )}
    </div>
  );
}
