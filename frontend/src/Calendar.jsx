import { useEffect, useMemo, useState } from "react";

export default function Calendar({ checkins, streak }) {
  const checkedSet = useMemo(() => new Set(checkins), [checkins]);
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const monthName = now.toLocaleString("en-US", { month: "long" });

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = (new Date(year, month, 1).getDay() + 6) % 7;
  const today = now.getDate();

  const cells = [
    ...Array.from({ length: startOffset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="calendar">
      <div className="calendar-head">
        <span className="calendar-month">
          {monthName} {year}
        </span>
        <span className="streak-pill" title="Consecutive days with progress">
          <span className="streak-dot" />
          {streak} day{streak === 1 ? "" : "s"} streak
        </span>
      </div>
      <div className="calendar-grid calendar-weekdays">
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <span key={i} className="weekday">{d}</span>
        ))}
      </div>
      <div className="calendar-grid">
        {cells.map((day, i) => (
          <span
            key={i}
            className={[
              "day-cell",
              day === null ? "empty" : "",
              day !== null &&
              checkedSet.has(`${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`)
                ? "checked"
                : "",
              day === today ? "today" : "",
            ].filter(Boolean).join(" ")}
          >
            {day ?? ""}
          </span>
        ))}
      </div>
    </div>
  );
}

export function CalendarPanel({ checkins, streak }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <aside className={`calendar-panel ${open ? "open" : ""}`}>
        <div className="calendar-panel-head">
          <span>Daily Check-in</span>
          <button className="close-btn" onClick={() => setOpen(false)} aria-label="Close">&times;</button>
        </div>
        <Calendar checkins={checkins} streak={streak} />
        <p className="calendar-hint">Complete a module each day to keep your streak alive.</p>
      </aside>
      <button className={`btn-toggle-cal ${open ? "active" : ""}`} onClick={() => setOpen((o) => !o)}>
        Calendar
      </button>
    </>
  );
}
