import { useEffect, useState } from "react";
import { get } from "./api";
import { ArtifactView, CourseView, GuideView, PlanView, QuizPlay } from "./Create";

const TABS = [
  { key: "plan", label: "Plans" },
  { key: "course", label: "Courses" },
  { key: "guide", label: "Guides" },
  { key: "roadmap", label: "Roadmaps" },
  { key: "quiz", label: "Quizzes" },
];

const KIND_LABEL = { plan: "learning plans", course: "courses", guide: "guides", roadmap: "roadmaps", quiz: "quizzes" };

export default function Library({ tab, setTab, openRoadmap, openArtifact }) {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    setDetail(null);
    setLoading(true);
    const qs = new URLSearchParams();
    if (q) qs.set("q", q);
    let url;
    if (tab === "roadmap") {
      url = `/list/${qs.toString() ? `?${qs}` : ""}`;
    } else {
      qs.set("kind", tab);
      url = `/library/${qs.toString() ? `?${qs}` : ""}`;
    }
    get(url)
      .then((d) => setItems(d.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [tab, q]);

  if (detail) {
    return (
      <main className="content">
        <button className="btn btn-secondary back-btn" onClick={() => setDetail(null)}>
          Back to library
        </button>
        {detail.kind === "plan" && <PlanView artifact={detail} />}
        {detail.kind === "course" && <CourseView artifact={detail} />}
        {detail.kind === "guide" && <GuideView artifact={detail} />}
        {detail.kind === "quiz" && <QuizPlay artifact={detail} />}
      </main>
    );
  }

  return (
    <main className="content wide">
      <div className="page-title row">
        <div>
          <h2>Library</h2>
          <p>Explore your AI-generated guides, courses, learning plans and roadmaps</p>
        </div>
      </div>

      <div className="lib-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`lib-tab ${tab === t.key ? "active" : ""}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <input
        className="search-input"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={`Search ${KIND_LABEL[tab]}...`}
      />

      {loading ? (
        <div className="loading">Loading...</div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
              <path d="M2 6c0-1.1.9-2 2-2h5l2 2h9a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6z" stroke="#98a2b3" strokeWidth="1.5"/>
            </svg>
          </div>
          <h4>No {KIND_LABEL[tab]} found</h4>
          <p>You haven't generated any {KIND_LABEL[tab]} yet.</p>
        </div>
      ) : tab === "roadmap" ? (
        <div className="card-grid">
          {items.map((r) => (
            <button key={r.id} className="course-card" onClick={() => openRoadmap(r.id)}>
              <h4>{r.topic}</h4>
              <div className="course-meta">
                <span className={`pill pill-${r.level}`}>{r.level}</span>
                <span>{r.modules} modules</span>
                <span>{r.xp_total} XP earned</span>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="card-grid">
          {items.map((a) => (
            <button key={a.id} className="course-card" onClick={() => setDetail(a)}>
              <span className="kind-tag">{a.kind}</span>
              <h4>{(a.data && (a.data.title || a.data.summary)) || a.topic}</h4>
              <div className="course-meta">
                <span>{new Date(a.created_at).toLocaleDateString()}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </main>
  );
}
