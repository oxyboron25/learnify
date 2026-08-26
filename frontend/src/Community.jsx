import { useEffect, useState } from "react";
import { get, post } from "./api";

function Stars({ value, onRate }) {
  return (
    <span className="stars">
      {[1, 2, 3, 4, 5].map((s) => (
        <span
          key={s}
          className={`star ${s <= Math.round(value) ? "filled" : ""} ${onRate ? "clickable" : ""}`}
          onClick={onRate ? () => onRate(s) : undefined}
          title={onRate ? `Rate ${s} star${s > 1 ? "s" : ""}` : undefined}
        >
          &#9733;
        </span>
      ))}
    </span>
  );
}

export default function Community({ onNew }) {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("rating");
  const [loading, setLoading] = useState(false);
  const [rated, setRated] = useState({});

  const load = (reset = true) => {
    setLoading(true);
    const offset = reset ? 0 : items.length;
    const qs = new URLSearchParams({ q, sort, offset, limit: 9 });
    get(`/community/courses/?${qs}`)
      .then((d) => {
        setTotal(d.total);
        setItems((prev) => (reset ? d.items : [...prev, ...d.items]));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const t = setTimeout(() => load(true), 250);
    return () => clearTimeout(t);
  }, [q, sort]);

  const rate = async (id, stars) => {
    if (rated[id]) return;
    try {
      const updated = await post(`/community/courses/${id}/rate/`, { stars });
      setItems((prev) => prev.map((c) => (c.id === id ? updated : c)));
      setRated((r) => ({ ...r, [id]: true }));
    } catch {}
  };

  return (
    <main className="content wide">
      <div className="page-title row">
        <div>
          <h2>Explore Courses</h2>
          <p>Explore the AI courses created by the community</p>
        </div>
        <button className="btn btn-dark new-btn" onClick={onNew}>+ New</button>
      </div>

      <div className="community-controls">
        <input
          className="search-input"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search courses..."
        />
        <select className="sort-select" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="rating">Top rated</option>
          <option value="users">Most learners</option>
          <option value="new">Newest</option>
        </select>
      </div>
      <p className="result-count">Showing {items.length} of {total} courses</p>

      <div className="card-grid">
        {items.map((c) => (
          <div key={c.id} className="course-card static">
            <span className={`pill pill-${c.level}`}>{c.level}</span>
            <h4>{c.title}</h4>
            <p className="course-desc">{c.description}</p>
            <div className="course-meta">
              <span>{c.modules} modules</span>
              <span>{c.lessons} lessons</span>
            </div>
            <div className="rating-row">
              <Stars value={c.rating} onRate={rated[c.id] ? null : (s) => rate(c.id, s)} />
              <span className="rating-num">{c.rating || "-"}</span>
              <span className="rating-count">({c.rating_count} ratings)</span>
              <span className="learners">{c.learners.toLocaleString()} learners</span>
            </div>
          </div>
        ))}
      </div>

      {items.length < total && (
        <button className="load-more" onClick={() => load(false)} disabled={loading}>
          {loading ? "Loading..." : "Load more courses"}
        </button>
      )}
    </main>
  );
}
