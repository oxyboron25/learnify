import { useState } from "react";

export function Avatar({ name }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return <div className="avatar avatar-fallback">{name[0]}</div>;
  }
  return (
    <img
      className="avatar"
      src="https://i.pravatar.cc/96?img=13"
      alt={name}
      onError={() => setFailed(true)}
    />
  );
}

export function ModuleResources({ resources }) {
  const [open, setOpen] = useState(false);
  if (!resources || resources.length === 0) return null;
  return (
    <div className="res-dropdown">
      <button className="res-toggle" onClick={() => setOpen((o) => !o)}>
        Study resources ({resources.length})
        <span className={`chev ${open ? "up" : ""}`}>&#9662;</span>
      </button>
      {open && (
        <ul className="resource-list">
          {resources.map((r, i) => (
            <li key={i}>
              <a href={r.url} target="_blank" rel="noreferrer" className="resource-row">
                <span className={`source-badge src-${r.source.toLowerCase().replace(/\s+/g, "-")}`}>
                  {r.source || "Link"}
                </span>
                <span className="resource-title">{r.title}</span>
                <span className="resource-arrow">&rsaquo;</span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function Loading({ text }) {
  return <div className="loading">{text || "Generating..."}</div>;
}
