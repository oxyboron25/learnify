"""AI generation endpoints: plan, course, guide, quiz. One Gemini call each."""
import json

import google.generativeai as genai
from dotenv import load_dotenv
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from accounts.keys import UsageLimitExceeded, resolve_gemini_key
from .models import Artifact

load_dotenv()

GEMINI_TIMEOUT = 25


def _gemini_json(prompt, schema, api_key=None):
    """One Gemini call, max one retry. Returns parsed dict or None."""
    if not api_key:
        return None
    for _attempt in range(2):
        try:
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel("gemini-3.6-flash")
            response = model.generate_content(
                prompt,
                generation_config=genai.GenerationConfig(
                    response_mime_type="application/json",
                    response_schema=schema,
                    temperature=0.6,
                ),
                request_options={"timeout": GEMINI_TIMEOUT},
            )
            data = json.loads(response.text)
            if isinstance(data, dict):
                return data
        except Exception:
            pass
    return None


PLAN_SCHEMA = {
    "type": "object",
    "properties": {
        "title": {"type": "string"},
        "summary": {"type": "string"},
        "weeks": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "week": {"type": "integer"},
                    "focus": {"type": "string"},
                    "tasks": {"type": "array", "items": {"type": "string"}},
                },
                "required": ["week", "focus", "tasks"],
            },
        },
    },
    "required": ["title", "summary", "weeks"],
}

COURSE_SCHEMA = {
    "type": "object",
    "properties": {
        "title": {"type": "string"},
        "summary": {"type": "string"},
        "modules": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "title": {"type": "string"},
                    "lessons": {"type": "array", "items": {"type": "string"}},
                },
                "required": ["title", "lessons"],
            },
        },
    },
    "required": ["title", "summary", "modules"],
}

GUIDE_SCHEMA = {
    "type": "object",
    "properties": {
        "title": {"type": "string"},
        "sections": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "heading": {"type": "string"},
                    "body": {"type": "string"},
                },
                "required": ["heading", "body"],
            },
        },
    },
    "required": ["title", "sections"],
}

QUIZ_SCHEMA = {
    "type": "object",
    "properties": {
        "title": {"type": "string"},
        "questions": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "question": {"type": "string"},
                    "options": {"type": "array", "items": {"type": "string"}},
                    "answer_index": {"type": "integer"},
                    "model_answer": {"type": "string"},
                },
                "required": ["question"],
            },
        },
    },
    "required": ["title", "questions"],
}

PLAN_FALLBACK = {
    "title": "Learning Plan",
    "summary": "A structured weekly plan to reach your goal step by step.",
    "weeks": [
        {"week": 1, "focus": "Fundamentals", "tasks": ["Learn core concepts", "Set up your environment", "Complete one beginner tutorial"]},
        {"week": 2, "focus": "Guided practice", "tasks": ["Build a guided project", "Read official documentation", "Review key concepts"]},
        {"week": 3, "focus": "Build independently", "tasks": ["Build your own small project", "Share it for feedback", "Identify gaps and revisit topics"]},
    ],
}

COURSE_FALLBACK = {
    "title": "Course",
    "summary": "A practical introduction covering the essentials.",
    "modules": [
        {"title": "Getting Started", "lessons": ["Overview and setup", "Core concepts", "Your first example", "Common pitfalls"]},
        {"title": "Working in Depth", "lessons": ["Key techniques", "Hands-on exercise", "Debugging and tools", "Best practices"]},
        {"title": "Real-World Application", "lessons": ["Building a mini project", "Testing what you built", "Performance basics", "Next steps"]},
    ],
}

GUIDE_FALLBACK = {
    "title": "Guide",
    "sections": [
        {"heading": "Introduction", "body": "This guide walks you through the essentials of the topic, from first principles to practical application."},
        {"heading": "Core Concepts", "body": "Focus on the fundamental building blocks first. Understand the why behind each concept before moving to tooling and frameworks."},
        {"heading": "Putting It Into Practice", "body": "Apply what you learned in a small project. Practical repetition is what turns knowledge into skill."},
    ],
}

QUIZ_FALLBACK = {
    "title": "Knowledge Check",
    "questions": [
        {"question": "What is the best way to retain what you learn?", "options": ["Only reading", "Building projects", "Watching videos", "Highlighting notes"], "answer_index": 1},
        {"question": "When stuck on a bug, what should you try first?", "options": ["Rewrite everything", "Reproduce it reliably", "Ask AI immediately", "Restart your machine"], "answer_index": 1},
        {"question": "What makes a good learning routine?", "options": ["One 12-hour session", "Consistent short sessions", "Only weekends", "Random timing"], "answer_index": 1},
    ],
}


def _save_artifact(kind, topic, data, user=None):
    row = Artifact.objects.create(
        kind=kind, topic=topic, data=data,
        user=user if getattr(user, "is_authenticated", False) else None,
    )
    return {"id": row.id, "kind": kind, "topic": row.topic, "data": row.data}


def _key_for(request):
    try:
        return resolve_gemini_key(request.user), None
    except UsageLimitExceeded:
        return None, Response(
            {"error": "Free daily AI limit reached. Upgrade to Premium or add your own API key (BYOK) in Settings."},
            status=status.HTTP_429_TOO_MANY_REQUESTS,
        )


@api_view(["POST"])
def gen_plan(request):
    api_key, err = _key_for(request)
    if err:
        return err
    answers = request.data.get("answers", {})
    goal = str(answers.get("goal", ""))
    experience = str(answers.get("experience", "beginner"))
    hours = str(answers.get("hours", "5-10"))
    interests = str(answers.get("interests", ""))
    timeline = str(answers.get("timeline", "1-3 months"))

    prompt = (
        "Create a personalized week-by-week learning plan for a software developer.\n"
        f"Main goal: {goal}\nExperience: {experience}\n"
        f"Hours available per week: {hours}\nTopics of interest: {interests}\n"
        f"Timeline: {timeline}\n"
        "Return JSON with title, summary, and weeks (4 to 8 weeks). Each week has "
        "week (number), focus (short string) and tasks (3 to 5 concrete strings)."
    )
    data = _gemini_json(prompt, PLAN_SCHEMA, api_key)
    if not data or not data.get("weeks"):
        data = {**PLAN_FALLBACK, "title": f"Learning Plan: {goal or 'Software Development'}"}
    return Response(_save_artifact("plan", goal or interests or "Learning Plan", data, request.user))


@api_view(["POST"])
def gen_course(request):
    api_key, err = _key_for(request)
    if err:
        return err
    topic = str(request.data.get("topic", "")).strip()
    level = str(request.data.get("level", "beginner"))
    if not topic:
        return Response({"error": "topic is required"}, status=400)

    prompt = (
        f"Create a course outline for the topic '{topic}' at {level} level.\n"
        "Return JSON with title, summary, and modules (5 to 8). Each module has "
        "title and lessons (3 to 5 short lesson-name strings)."
    )
    data = _gemini_json(prompt, COURSE_SCHEMA, api_key)
    if not data or not data.get("modules"):
        data = {**COURSE_FALLBACK, "title": f"Course: {topic}"}
    return Response(_save_artifact("course", topic, data, request.user))


@api_view(["POST"])
def gen_guide(request):
    api_key, err = _key_for(request)
    if err:
        return err
    topic = str(request.data.get("topic", "")).strip()
    if not topic:
        return Response({"error": "topic is required"}, status=400)

    prompt = (
        f"Write a concise beginner-friendly guide about '{topic}' for software developers.\n"
        "Return JSON with title and sections (4 to 6). Each section has heading and "
        "body (a solid paragraph, plain text, no markdown)."
    )
    data = _gemini_json(prompt, GUIDE_SCHEMA, api_key)
    if not data or not data.get("sections"):
        data = {**GUIDE_FALLBACK, "title": f"Guide: {topic}"}
    return Response(_save_artifact("guide", topic, data, request.user))


@api_view(["POST"])
def gen_quiz(request):
    api_key, err = _key_for(request)
    if err:
        return err
    topic = str(request.data.get("topic", "")).strip()
    fmt = str(request.data.get("format", "mcq"))
    if not topic:
        return Response({"error": "topic is required"}, status=400)

    if fmt == "open":
        instruction = (
            "Questions are open-ended: each has question and model_answer (2-3 "
            "sentences), no options."
        )
    else:
        instruction = (
            "Questions are multiple-choice: each has question, options (4 strings), "
            "and answer_index (0-based int of the correct option). Create 5 questions."
        )

    prompt = (
        f"Create a quiz to test understanding of '{topic}' for software developers.\n"
        f"{instruction}\n"
        'Return JSON with title and questions.'
    )
    data = _gemini_json(prompt, QUIZ_SCHEMA, api_key)
    if not data or not data.get("questions"):
        data = {**QUIZ_FALLBACK, "title": f"Quiz: {topic}"}
    return Response(_save_artifact("quiz", topic, data, request.user))


@api_view(["GET"])
def library(request):
    kind = request.GET.get("kind", "")
    q = request.GET.get("q", "").strip()
    if request.user.is_authenticated:
        rows = Artifact.objects.filter(user=request.user)
    else:
        rows = Artifact.objects.filter(user__isnull=True)
    rows = rows.order_by("-created_at")
    if kind in Artifact.KINDS:
        rows = rows.filter(kind=kind)
    if q:
        rows = rows.filter(topic__icontains=q)
    return Response({"items": [r.serialize() for r in rows[:50]]})


@api_view(["GET"])
def library_detail(request, pk):
    try:
        row = Artifact.objects.get(pk=pk)
    except Artifact.DoesNotExist:
        return Response({"error": "not found"}, status=404)
    return Response(row.serialize())
