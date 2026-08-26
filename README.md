# Learnify 🚀

Personalized, gamified learning roadmaps for software development topics — powered by Gemini.

## Stack

- **Backend:** Django + Django REST Framework (SQLite)
- **Frontend:** React (Vite), plain CSS
- **LLM:** Google Gemini (`gemini-3.6-flash`), one call per roadmap, JSON mode with a fixed response schema. Falls back to a hardcoded sample roadmap on any API/parse failure so the demo never breaks.

## Run it

### 1. Backend (Django, port 8000)

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Put your key in `.env` in the project root (this file is gitignored):

```
GEMINI_API_KEY=your_key_here
```

Then:

```bash
python manage.py migrate
python manage.py runserver 8000
```

### 2. Frontend (Vite, port 5173)

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

## Demo flow

1. Enter a topic, level, and goal → **Generate Roadmap** (one Gemini call).
2. Roadmap renders as a vertical timeline with XP values per module.
3. Click **Mark complete** → XP and 🔥 streak update at the top.
4. Refresh the page → progress is restored (roadmap id stored in localStorage).

## API

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/roadmap/generate/` | `{topic, level, goal}` → roadmap JSON + id |
| GET | `/api/roadmap/<id>/` | Restore roadmap state |
| PATCH | `/api/roadmap/<id>/complete/` | `{index}` → adds module XP, increments streak |

If the Gemini call fails/times out, the backend silently returns the hardcoded "Web Development" fallback roadmap (flagged via `used_fallback: true` in the response).
