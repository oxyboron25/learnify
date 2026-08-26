"""Community course catalog: seeded data, listing with search/sort/paging, rating."""
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import CommunityCourse

SEED = [
    ("Error Handling Basics in Go", "Learn how to handle errors idiomatically in Go programs.", "beginner", 6, 24, 4.6, 128, 2140),
    ("Mastering DartPad for Flutter Development", "Practice Flutter UI development directly in the browser.", "beginner", 6, 30, 4.3, 96, 1730),
    ("Mastering Time in Go", "Timers, tickers, timeouts and time handling in Go.", "intermediate", 6, 24, 4.7, 143, 1980),
    ("Computer Hardware Components for Cyber Security", "Understand hardware fundamentals through a security lens.", "beginner", 6, 24, 4.2, 74, 1210),
    ("I/O & File Handling in Go", "Read, write and stream files efficiently in Go.", "beginner", 6, 24, 4.5, 110, 1655),
    ("Mastering the Go flag Package", "Command-line flag parsing done right.", "beginner", 5, 20, 4.1, 58, 890),
    ("Mastering encoding/json in Go", "Marshal, unmarshal and stream JSON like a pro.", "intermediate", 6, 30, 4.8, 187, 2540),
    ("Matrix & Matrix Operations for Machine Learning", "The linear algebra core you need for ML.", "intermediate", 6, 30, 4.4, 121, 1875),
    ("Python Basic Syntax and Environment Setup", "Get productive with Python from zero.", "beginner", 6, 30, 4.7, 231, 3420),
    ("Mastering Modern API Development with Node.js and Express", "Design and ship production-grade REST APIs.", "intermediate", 6, 30, 4.6, 164, 2280),
    ("Data Structures & Algorithms for the Forward Deployed Engineer", "Practical DSA for customer-facing engineers.", "intermediate", 6, 24, 4.5, 132, 1760),
    ("Mastering C# for ASP.NET Core Development", "Modern C# patterns for web backends.", "advanced", 6, 30, 4.3, 87, 1140),
    ("Digital Business Valuation using Analytics", "Quantify what a digital product is worth.", "advanced", 6, 30, 4.0, 41, 620),
    ("Programming Paradigms for Software Architecture", "OOP, FP and everything between - when to use what.", "advanced", 6, 30, 4.6, 149, 2010),
    ("What is an AI Engineer?", "Role, skills and roadmap of the AI engineering career.", "beginner", 7, 35, 4.8, 264, 4110),
    ("Fundamental IT Skills for Cybersecurity", "Networking, Linux and scripting basics for security.", "beginner", 7, 34, 4.4, 118, 1690),
    ("Mastering Temperature and Sampling in LLMs", "How generation parameters shape LLM output.", "advanced", 6, 24, 4.7, 156, 1930),
    ("HTTP Versions in API Design", "HTTP/1.1 vs 2 vs 3 and what they mean for your APIs.", "intermediate", 6, 30, 4.5, 102, 1480),
    ("Shell Basics: From Command Line Fundamentals to Automation", "Become fluent in the terminal.", "beginner", 7, 35, 4.6, 178, 2620),
    ("SQL for Data Analysis", "Queries, joins and window functions for analysts.", "beginner", 6, 28, 4.7, 203, 3140),
    ("Docker Fundamentals for Developers", "Containers, images and volumes explained simply.", "beginner", 6, 26, 4.8, 241, 3680),
    ("React Performance Optimization", "Memoization, profiling and rendering patterns.", "advanced", 6, 24, 4.5, 97, 1355),
    ("Kubernetes for Application Developers", "Deploy and operate apps on K8s.", "advanced", 7, 32, 4.4, 88, 1120),
    ("TypeScript for JavaScript Developers", "Types, generics and strict mode in practice.", "intermediate", 6, 28, 4.6, 173, 2390),
    ("System Design Basics", "Scalability, caching and queues from first principles.", "intermediate", 7, 30, 4.7, 219, 3050),
    ("Git Beyond the Basics", "Rebase, bisect, hooks and workflows that scale.", "intermediate", 5, 22, 4.5, 111, 1570),
    ("Rust for Systems Programmers", "Ownership, borrowing and zero-cost abstractions.", "advanced", 7, 34, 4.6, 134, 1740),
    ("Prompt Engineering for Developers", "Get reliable output from LLMs in real products.", "beginner", 6, 25, 4.3, 129, 2210),
    ("Testing Python Applications", "pytest, mocking and CI-ready test suites.", "intermediate", 6, 27, 4.5, 93, 1280),
    ("Linux Disk and Filesystems", "Partitions, mounts and filesystem internals.", "beginner", 7, 28, 4.4, 106, 1445),
]


def ensure_seeded():
    if CommunityCourse.objects.exists():
        return
    import random
    rng = random.Random(42)
    for title, desc, level, mods, lessons, rating, rcount, learners in SEED:
        CommunityCourse.objects.create(
            title=title,
            description=desc,
            level=level,
            modules_count=mods,
            lessons_count=lessons,
            rating_sum=int(rating * rcount),
            rating_count=rcount,
            learners=learners + rng.randint(0, 40),
        )


@api_view(["GET"])
def community_courses(request):
    ensure_seeded()
    q = request.GET.get("q", "").strip()
    sort = request.GET.get("sort", "rating")
    offset = int(request.GET.get("offset", 0) or 0)
    limit = min(int(request.GET.get("limit", 9) or 9), 30)

    rows = CommunityCourse.objects.all()
    if q:
        rows = rows.filter(title__icontains=q)
    if sort == "users":
        rows = rows.order_by("-learners", "-rating_sum")
    elif sort == "new":
        rows = rows.order_by("-created_at")
    else:
        rows = rows.order_by("-rating_sum", "-learners")

    total = rows.count()
    page = rows[offset:offset + limit]
    return Response({"total": total, "offset": offset, "items": [r.serialize() for r in page]})


@api_view(["POST"])
def rate_course(request, pk):
    try:
        row = CommunityCourse.objects.get(pk=pk)
    except CommunityCourse.DoesNotExist:
        return Response({"error": "not found"}, status=404)
    try:
        stars = int(request.data.get("stars"))
    except (TypeError, ValueError):
        return Response({"error": "stars is required"}, status=400)
    if not 1 <= stars <= 5:
        return Response({"error": "stars must be 1-5"}, status=400)

    row.rating_sum += stars
    row.rating_count += 1
    row.save()
    return Response(row.serialize())
