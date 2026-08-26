#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"

echo "Stopping any leftover Learnify servers..."
fuser -k 8000/tcp 5173/tcp 2>/dev/null || true
pkill -f "[m]anage.py runserver" 2>/dev/null || true
pkill -f "[n]ode_modules/.bin/vite" 2>/dev/null || true
sleep 2

# Wait until port 8000 is actually free
for i in $(seq 1 10); do
  fuser 8000/tcp > /dev/null 2>&1 || break
  sleep 1
done

source venv/bin/activate
python manage.py migrate --noinput > /dev/null 2>&1
python manage.py ensure_admin
python manage.py runserver 8000 &
BACKEND_PID=$!

# Wait for backend to respond before starting frontend
for i in $(seq 1 15); do
  curl -s -m 2 -o /dev/null http://localhost:8000/api/roadmap/0/ && break
  sleep 1
done

cd frontend
npm install --silent > /dev/null 2>&1
npm run dev &
FRONTEND_PID=$!

echo ""
echo "  Learnify is running:"
echo "    App      -> http://localhost:5173   <-- open this"
echo "    Backend  -> http://localhost:8000"
echo "  Press Ctrl+C to stop both."
echo ""

cleanup() {
  kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null
}
trap cleanup EXIT

wait
