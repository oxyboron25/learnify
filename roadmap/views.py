import json
import os
from datetime import date, timedelta

import google.generativeai as genai
from dotenv import load_dotenv
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .fallback_roadmap import FALLBACK_ROADMAP
from .models import Roadmap

load_dotenv()

GEMINI_TIMEOUT = 25

RESPONSE_SCHEMA = {
    "type": "object",
    "properties": {
        "topic": {"type": "string"},
        "level": {"type": "string"},
        "goal": {"type": "string"},
        "modules": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "title": {"type": "string"},
                    "description": {"type": "string"},
                    "xp": {"type": "integer"},
                    "resources": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "title": {"type": "string"},
                                "url": {"type": "string"},
                                "source": {"type": "string"},
                            },
                            "required": ["title", "url"],
                        },
                    },
                },
                "required": ["title", "description", "xp"],
            },
        },
        "resources": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "title": {"type": "string"},
                    "url": {"type": "string"},
                    "source": {"type": "string"},
                },
                "required": ["title", "url"],
            },
        },
        "final_challenge": {
            "type": "object",
            "properties": {
                "title": {"type": "string"},
                "description": {"type": "string"},
                "xp": {"type": "integer"},
                "question": {"type": "string"},
                "options": {
                    "type": "array",
                    "items": {"type": "string"},
                },
                "answer_index": {"type": "integer"},
            },
            "required": ["title", "description", "xp", "question", "options", "answer_index"],
        },
    },
    "required": ["topic", "level", "goal", "modules", "resources"],
}


def _validate_roadmap(data):
    if not isinstance(data, dict):
        return False
    modules = data.get("modules")
    if not isinstance(modules, list) or not (3 <= len(modules) <= 15):
        return False
    for m in modules:
        if not isinstance(m, dict) or not m.get("title") or not isinstance(m.get("xp"), int):
            return False
    return True


def _clean_resources(raw, cap):
    """Keep at most `cap` well-formed resources; tolerate a missing/invalid list."""
    if not isinstance(raw, list):
        return []
    clean = [
        {"title": str(r["title"]), "url": str(r["url"]), "source": str(r.get("source", ""))}
        for r in raw
        if isinstance(r, dict) and r.get("title") and r.get("url")
    ]
    return clean[:cap]


def _sanitize_resources(data):
    return _clean_resources(data.get("resources"), 5)


def _apply_module_resources(modules):
    """Attach sanitized per-module resources (max 3 each) in place."""
    for m in modules:
        if isinstance(m, dict):
            m["resources"] = _clean_resources(m.get("resources"), 3)
    return modules


def _sanitize_final_challenge(data):
    fc = data.get("final_challenge")
    if not isinstance(fc, dict) or not fc.get("title") or not fc.get("question"):
        return {}
    options = fc.get("options")
    try:
        answer_index = int(fc.get("answer_index", -1))
    except (TypeError, ValueError):
        return {}
    if not isinstance(options, list) or len(options) < 2 or not (0 <= answer_index < len(options)):
        return {}
    try:
        xp = int(fc.get("xp", 150))
    except (TypeError, ValueError):
        xp = 150
    return {
        "title": str(fc["title"]),
        "description": str(fc.get("description", "")),
        "xp": xp,
        "question": str(fc["question"]),
        "options": [str(o) for o in options],
        "answer_index": answer_index,
    }


def generate_with_gemini(topic, level, goal):
    """One Gemini call. Returns validated dict or None. Never retries more than once."""
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return None

    prompt = (
        f"Create a personalized gamified learning roadmap for software development.\n"
        f"Topic: {topic}\n"
        f"Learner level: {level}\n"
        f"Goal: {goal}\n\n"
        'Respond ONLY with JSON matching this exact schema: {"topic": string, '
        '"level": string, "goal": string, "modules": [{"title": string, '
        '"description": string, "xp": integer, "resources": [{"title": string, '
        '"url": string, "source": string}]}], "resources": [{"title": string, '
        '"url": string, "source": string}]}. '
        "Include 6 to 10 ordered modules from fundamentals to the goal. "
        "Each module's xp must be an integer between 50 and 200. "
        "Each module must include 2 to 3 specific learning resources relevant to "
        "that module (well-known YouTube videos/playlists, Medium articles, or "
        "official docs) with real URLs. "
        'The top-level "resources" field must contain exactly 5 of the best '
        "overall resources for this topic with real URLs. "
        'The "final_challenge" must be a capstone task for this roadmap: a short '
        "hands-on project description plus ONE multiple-choice quiz question "
        "(3 to 4 options) testing the most important concept, where answer_index "
        "is the 0-based index of the correct option."
    )

    for attempt in range(2):  # max one retry
        try:
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel("gemini-3.6-flash")
            response = model.generate_content(
                prompt,
                generation_config=genai.GenerationConfig(
                    response_mime_type="application/json",
                    response_schema=RESPONSE_SCHEMA,
                ),
                request_options={"timeout": GEMINI_TIMEOUT},
            )
            data = json.loads(response.text)
            if _validate_roadmap(data):
                return data
        except Exception:
            pass
    return None


@api_view(["POST"])
def ask_doubt(request):
    """One Gemini call per question. No retries beyond one."""
    question = request.data.get("question", "").strip()
    if not question:
        return Response({"error": "question is required"}, status=status.HTTP_400_BAD_REQUEST)

    roadmap_id = request.data.get("roadmap_id")
    context = ""
    if roadmap_id:
        try:
            row = Roadmap.objects.get(pk=roadmap_id)
            topics = ", ".join(m.get("title", "") for m in row.modules)
            context = (
                f"The learner is currently studying '{row.topic}' at {row.level} level "
                f"with the goal: {row.goal}. The roadmap covers these modules: {topics}.\n"
            )
        except (Roadmap.DoesNotExist, TypeError, ValueError):
            pass

    prompt = (
        "You are Learnify's doubt-solving tutor for software development learners. "
        "Answer clearly and concisely (under 150 words), using simple language and a "
        "short example or analogy when helpful.\n"
        f"{context}"
        f"Learner's doubt: {question}"
    )

    api_key = os.getenv("GEMINI_API_KEY")
    answer = None
    if api_key:
        for attempt in range(2):
            try:
                genai.configure(api_key=api_key)
                model = genai.GenerativeModel("gemini-3.6-flash")
                response = model.generate_content(
                    prompt,
                    generation_config=genai.GenerationConfig(
                        temperature=0.4,
                        max_output_tokens=400,
                    ),
                    request_options={"timeout": GEMINI_TIMEOUT},
                )
                answer = (response.text or "").strip()
                if answer:
                    break
            except Exception:
                pass
        else:
            answer = None

    if not answer:
        return Response(
            {"error": "Could not reach the tutor right now. Please try again in a moment."},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )
    return Response({"answer": answer})


@api_view(["POST"])
def generate(request):
    topic = request.data.get("topic", "").strip()
    level = request.data.get("level", "beginner").strip()
    goal = request.data.get("goal", "").strip()

    if not topic:
        return Response({"error": "topic is required"}, status=status.HTTP_400_BAD_REQUEST)

    roadmap_data = generate_with_gemini(topic, level, goal)
    used_fallback = roadmap_data is None
    if used_fallback:
        roadmap_data = {**FALLBACK_ROADMAP, "topic": topic or FALLBACK_ROADMAP["topic"], "level": level or "beginner"}

    row = Roadmap.objects.create(
        topic=roadmap_data.get("topic", topic),
        level=roadmap_data.get("level", level),
        goal=roadmap_data.get("goal", goal),
        modules=_apply_module_resources(roadmap_data["modules"]),
        resources=_sanitize_resources(roadmap_data),
        final_challenge=_sanitize_final_challenge(roadmap_data),
    )
    payload = row.serialize()
    payload["used_fallback"] = used_fallback
    return Response(payload)


@api_view(["GET"])
def detail(request, pk):
    try:
        row = Roadmap.objects.get(pk=pk)
    except Roadmap.DoesNotExist:
        return Response({"error": "not found"}, status=status.HTTP_404_NOT_FOUND)
    return Response(row.serialize())


@api_view(["PATCH"])
def complete(request, pk):
    try:
        row = Roadmap.objects.get(pk=pk)
    except Roadmap.DoesNotExist:
        return Response({"error": "not found"}, status=status.HTTP_404_NOT_FOUND)

    try:
        index = int(request.data.get("index"))
    except (TypeError, ValueError):
        return Response({"error": "index is required"}, status=status.HTTP_400_BAD_REQUEST)

    n_modules = len(row.modules)
    if index == n_modules:
        # The final challenge lives outside the modules list.
        if not row.final_challenge:
            return Response({"error": "no final challenge"}, status=status.HTTP_400_BAD_REQUEST)
        xp_value = int(row.final_challenge.get("xp", 0))
    elif 0 <= index < n_modules:
        xp_value = int(row.modules[index].get("xp", 0))
    else:
        return Response({"error": "invalid module index"}, status=status.HTTP_400_BAD_REQUEST)

    # Idempotent: completing the same module twice must not double-count XP.
    if index in row.completed:
        return Response(row.serialize())

    today = date.today()
    today_str = today.isoformat()

    row.completed.append(index)
    row.xp_total += xp_value

    # Day-wise check-in: streak counts consecutive days with at least one completion.
    last = row.last_checkin
    if isinstance(last, str):
        last = date.fromisoformat(last)
    if last != today:
        if last == today - timedelta(days=1):
            row.streak += 1
        else:
            row.streak = 1
        row.last_checkin = today_str
        if today_str not in row.checkins:
            row.checkins.append(today_str)

    row.save()
    return Response(row.serialize())
