import { useEffect, useState } from "react";
import API, { get } from "./api";
import CalendarPanel from "./Calendar";
import DoubtBot from "./DoubtBot";
import Sidebar from "./Sidebar";
import RoadmapView, { RoadmapForm, loadRoadmapById } from "./RoadmapView";
import Create, { ArtifactView } from "./Create";
import Library from "./Library";
import Community from "./Community";
import TutorChat from "./TutorChat";

const USER = { name: "Ankit" };

export default function App() {
  const [view, setView] = useState({ page: "roadmap" });
  const [roadmap, setRoadmap] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const id = localStorage.getItem("learnify_roadmap_id");
    if (id) loadRoadmapById(id, setRoadmap).catch(() => {});
  }, []);

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
    }
  };

  const openArtifact = (artifactId) => {
    get(`/library/${artifactId}/`).then((a) => setView({ page: "artifact", artifact: a }));
  };

  return (
    <div className="shell">
      <Sidebar view={view} setView={setView} />

      <div className="main-area">
        <header className="topbar slim">
          <div className="topbar-right">
            {roadmap && view.page === "roadmap" && (
              <CalendarPanel checkins={roadmap.checkins} streak={roadmap.streak} />
            )}
            <button className="btn-premium">Buy Premium</button>
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

      <DoubtBot roadmapId={roadmap ? roadmap.id : null} topic={roadmap ? roadmap.topic : null} />
    </div>
  );
}
