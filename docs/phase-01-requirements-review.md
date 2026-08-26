# Phase 1 — Requirements Review & Overall Architecture

**Project:** Learnify V0 — AI-Powered Developer Roadmap Platform
**Status:** Approved (with decisions logged in §7)
**Date:** 2026-07-21

---

## 1. Understanding of the Mission

Learnify V0 is a **deterministic decision engine with an AI presentation layer** — not an AI product with a backend attached. The defensible engineering core is:

> Evidence → Derived Mastery → DAG-constrained Roadmap → Project Recommendation → Explanation

The AI only narrates what the engine already decided. Every architectural choice in this document protects that boundary, because that is what makes this project interview-grade rather than tutorial-grade.

---

## 2. What's Strong in the Spec (Validated, Kept As-Is)

- **"AI never decides the roadmap"** — non-negotiable. Enforced structurally: the mentor receives engine output as read-only context and has no write path.
- **Evidence-derived mastery instead of self-assigned scores** — the single best design decision in the spec.
- **DAG in PostgreSQL, not Neo4j** — correct at this scale (~15–40 skills). Graph algorithms in application code over relational storage is also a stronger interview story than delegating to a graph DB.
- **Clean Architecture inside a monolith** — a well-layered modular monolith beats premature microservices for V0.
- **Redis/Celery restraint** — using them only where they earn their operational cost.

---

## 3. Weaknesses, Gaps, and Resolutions

### W1 — The example skill graph is a *line*, not a graph

**Problem:** Git → Linux → Python → … → Docker is a single chain. Topological sort on a chain is trivial and demonstrates nothing.

**Resolution:** Seed a realistic DAG with **multiple parents** (e.g., Django requires Python + OOP + SQL + HTTP; Celery requires Django + Redis). Add **cycle detection at write time**: any new prerequisite edge is validated (DFS from target) before insert, enforced in the service layer plus a DB-level trigger as defense in depth. The DAG invariant must be *guaranteed*, not assumed.

### W2 — Diagnostic → evidence mapping is underspecified

**Problem:** "Contributes evidence toward one or more skills" has no defined semantics. What does a "No" answer mean? Can self-reported diagnostics alone certify mastery?

**Resolution:**

- Each question maps to skills with an explicit **weight** (0–1). "Yes" creates evidence of that strength; **"No" creates nothing** — absence of evidence is not negative evidence.
- **Cap diagnostic-derived mastery** (max 0.45). Self-report can put a skill on the "probably known" radar, but only completed projects push mastery to "known" (≥ 0.70). Gaming-resistant by design.

### W3 — Mastery derivation function is undefined

**Resolution:** **noisy-OR combination**:

```
mastery = 1 − Π(1 − wᵢ)      over all evidence strengths wᵢ for that skill
```

Properties that matter: bounded in [0,1), monotonic (more evidence never hurts), order-independent (deterministic), and **per-evidence contribution is computable** — which powers explanations like *"Redis mastery 0.72: 0.45 from diagnostic, 0.50 from URL Shortener."* Thresholds (known ≥ 0.70) live in one config module, never as scattered magic numbers. Time-decay of evidence: **deferred post-V0** (schema-compatible).

### W4 — "Prerequisite satisfied" semantics need a hard definition

**Resolution:** A skill is **satisfied** when derived mastery ≥ threshold. The roadmap only ever *scores* skills on the **frontier** — the set of not-yet-known skills whose prerequisites are all satisfied. Everything downstream of the frontier is excluded from scoring (but visible as "locked"). This definition guarantees the algorithm can never violate prerequisite constraints, structurally rather than by careful coding.

### W5 — Priority scoring needs an explicit, deterministic formula

**Resolution:** for each frontier skill:

```
priority = w₁·career_importance + w₂·unlock_value − w₃·effort_norm + w₄·existing_mastery
```

- `unlock_value` = **transitive** unlock count (full downstream closure, not just direct children — cheap at this scale).
- `effort_norm` penalizes large time investments (prefer quick wins early).
- `existing_mastery` rewards finishing what is partially evidenced.
- **Deterministic tie-break:** fixed skill ordering key. Same inputs → byte-identical roadmap. This property gets a dedicated test.

### W6 — Project lifecycle rules are missing

**Resolution:**

- A project is **recommendable** iff all `required_skills` are satisfied.
- Recommendation ranking: number of **frontier skills taught** → difficulty progression → estimated duration.
- Completion is user-reported but structured: the user confirms each **learning objective**; completion writes **one idempotent PROJECT evidence** per taught skill (unique constraint on `(user, skill, project)` — survives double-submits).
- Project completion is the only evidence type allowed to push mastery past the "known" threshold (see W2).

### W7 — Roadmaps are derived artifacts; the spec doesn't capture versioning

**Resolution:** Every recompute writes a new **immutable `Roadmap` row with a version number**; `RoadmapNode`s hang off it. Cost: trivial storage. Payoff: the dashboard can answer *"what changed in my roadmap and why"* — a diff between two deterministic snapshots.

### W8 — "Auto-recompute" via Celery is the wrong default

**Problem:** Recompute over a ~30-node graph is single-digit milliseconds. Routing it through Celery buys stale-read bugs (dashboard reads before worker finishes) in exchange for nothing.

**Resolution (APPROVED):** **Recompute synchronously** in the same request that writes evidence (after DB commit), then invalidate Redis keys. Celery is reserved for genuinely slow work: **AI narrative generation**. If the graph ever grows to thousands of nodes, recompute moves to Celery — the service boundary is designed so that is a one-line dispatch change.

### W9 — AI Mentor trust boundary needs explicit rules

**Resolution:**

- Mentor context is **assembled server-side from the database** on every request. The client sends only the question. Client-supplied roadmap/skill state is never accepted.
- The mentor's system prompt receives the **engine's structured reasons**, so the LLM renders explanations rather than inventing them. Grounding by construction.
- Explanations of a given roadmap version are **cached in Redis** keyed by `(roadmap_version, question_hash)` — deterministic input means aggressive caching is safe and keeps API costs near zero during development.
- Provider abstraction: `LLMProvider` protocol with Gemini and OpenAI implementations, selected by env var. No vendor SDK leaks outside the infrastructure layer. **Default: Gemini** (free tier, no billing setup).

### W10 — Content needs a seeding strategy, or it rots in fixtures

**Resolution:** Skills, edges, questions, and projects ship as **versioned, idempotent seed files** (Python data modules) loaded via a management command, keyed by slug. Content-as-code: reviewable in PRs, diffable, re-runnable. Django's built-in admin covers curation — no custom admin dashboard (stays out of scope).

### W11 — Missing cross-cutting production concerns

All cheap, all included:

- **Idempotency constraints** on all user-generated writes (diagnostic responses, project completions).
- **Uniform error envelope** `{error: {code, message, details}}` + request-ID middleware + structured JSON logging.
- **drf-spectacular** for OpenAPI/Swagger (actively maintained; drf-yasg is effectively unmaintained).
- `/health/` endpoint for Docker healthchecks.
- django-filter + cursor pagination defaults.

### W12 — "Backend Engineer only" shouldn't mean hardcoded

**Resolution:** Model `CareerTrack` as an entity (one row in V0) with per-skill importance weights. The engine reads importance *through* the track. Cost: one extra table. Payoff: no hardcoded career logic in the engine; multi-track becomes a data problem later instead of a refactor.

---

## 4. Explicit Deferrals

**Deferred but schema-compatible** (no migration pain later): evidence decay, GitHub/resume analyzers (the `Evidence.source_type` enum already accommodates them), multi-track, tool-calling mentor.

**Excluded by design:** everything on the original out-of-scope list (GitHub analyzer, resume analyzer, social features, gamification, notifications, leaderboards, certificates, custom admin dashboard, multi-agent AI, microservices, Kafka, Neo4j, Kubernetes, Elasticsearch), plus email verification and social auth (V0: username/email + password only).

---

## 5. Overall Architecture

### 5.1 System Context

```
┌────────────┐   HTTPS/JSON   ┌──────────────────────────────────────┐
│ React SPA  │ ─────────────▶ │        Django Modular Monolith        │
│ (Vite+TS)  │ ◀───────────── │                                       │
└────────────┘   JWT + v1 API │  Presentation: DRF views/serializers  │
                              │  Application:  services (use cases)   │
┌────────────┐                │  Domain:       pure engines (no       │
│ Gemini     │ ◀────────────  │                Django imports)        │
│ (default)  │  explain-only  │  Infrastructure: ORM repos, Redis,    │
└────────────┘                │                LLM providers          │
                              └───────┬───────────────┬──────────────┘
                              ┌───────▼──────┐  ┌─────▼─────┐  ┌──────▼──────┐
                              │  PostgreSQL  │  │   Redis   │  │ Celery      │
                              │  (truth)     │  │  (cache)  │  │ (AI jobs)   │
                              └──────────────┘  └───────────┘  └─────────────┘
```

### 5.2 The Core Pipeline

```
Diagnostic / Project Completion
        │
        ▼
┌─────────────────┐   noisy-OR    ┌──────────────────┐
│ Evidence Engine │ ────────────▶ │ Mastery per skill │   (W2, W3)
└────────┬────────┘               └────────┬─────────┘
         │ evidence written                 │ frontier = prereqs satisfied
         ▼                                   ▼
┌─────────────────────────────────────────────────────┐
│ Roadmap Engine (pure function):                      │
│   frontier → topo-constrained priority scoring       │
│   → ordered roadmap + per-node reasons               │   (W4, W5)
└────────┬────────────────────────────────────────────┘
         │ new Roadmap version (immutable)              │
         ▼                                               ▼
┌──────────────────┐                          ┌─────────────────┐
│ Project Engine:   │                          │ AI Mentor:      │
│ recommend from    │                          │ explains engine │
│ satisfied-skills  │                          │ output only     │
└──────────────────┘                          └─────────────────┘
```

### 5.3 Layering Rules (Enforced, Not Aspirational)

- **Domain** (`skills`, `evidence`, `roadmap`, `projects` engines): pure Python, dataclasses in/out, zero Django/ORM imports. Testable with in-memory graphs — algorithm unit tests live here.
- **Application**: services orchestrating use cases (`CompleteProjectService`, `SubmitDiagnosticService`). All business rules live here or in domain. Views are thin.
- **Infrastructure**: Django ORM repositories, Redis cache adapter, LLM providers. Implements interfaces the application layer defines.
- **Presentation**: DRF views/serializers, Swagger, error envelope, auth.
- Dependency direction only ever points inward. `import-linter` contracts make layering violations fail CI.

### 5.4 Django App Boundaries (Modular Monolith)

`accounts` · `skills` · `diagnostics` · `evidence` · `roadmap` · `projects` · `dashboard` · `mentor` · `core` (errors, logging, pagination, health)

### 5.5 Caching Strategy (Redis Earns Its Place)

| Key | Contents | Invalidation |
|---|---|---|
| `roadmap:{user}:current` | current roadmap version payload | on recompute |
| `dashboard:{user}` | assembled dashboard | on evidence write / project completion |
| `mentor:{version}:{qhash}` | AI explanations | natural (version-keyed) |

PostgreSQL is always the source of truth; Redis holds only rebuildable derivatives.

### 5.6 Technology Selections

Python 3.12 · Django 5.x · DRF · djangorestframework-simplejwt (rotating refresh tokens) · psycopg 3 · drf-spectacular · django-filter · Celery 5 + Redis broker · Gemini/OpenAI behind `LLMProvider` protocol (default: Gemini) · Docker Compose (web, worker, postgres, redis, frontend) · pytest + factory-boy · Vite + React 18 + TS + Tailwind.

---

## 6. Interview-Narrative Payoff

Every piece maps to a talking point: **graph algorithms** (topological sort, cycle detection, transitive closure), **deterministic systems** (noisy-OR, stable scoring, versioned snapshots), **clean architecture** (pure domain, import-linter enforcement), **database design** (normalized schema, idempotency constraints), **caching discipline** (derivatives only, explicit invalidation), **AI engineering** (grounded explanations, trust boundary, provider abstraction, cost control via caching).

---

## 7. Decisions Log

| # | Decision | Outcome | Date |
|---|---|---|---|
| D1 | LLM provider | **Gemini** as default; OpenAI implemented behind `LLMProvider` interface, switchable via env var | 2026-07-21 |
| D2 | Roadmap recompute trigger | **Synchronous** on evidence write (post-commit) + Redis invalidation; Celery reserved for AI narrative generation | 2026-07-21 |
| D3 | AI Mentor memory | **Stateless Q&A** — each question answered independently with full server-side context; no conversation persistence in V0 | 2026-07-21 |

---

*Next: Phase 2 — Database Schema & ER Design.*
