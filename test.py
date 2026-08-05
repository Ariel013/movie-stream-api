# test_api.py
import requests
import sys

API_URL = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8000"

tests = [
    ("GET /health",              f"{API_URL}/health"),
    ("GET /movies",              f"{API_URL}/movies"),
    ("GET /comments/new",        f"{API_URL}/comments/new"),
    ("GET /comments/new?movie=", f"{API_URL}/comments/new?movie=Stranger Things"),
    ("GET /stats",               f"{API_URL}/stats"),
    ("GET /docs",                f"{API_URL}/docs"),
]

print(f"\n🔍 Smoke test → {API_URL}\n")
all_ok = True

for label, url in tests:
    r = requests.get(url, timeout=10)
    status = "✅" if r.status_code == 200 else "❌"
    print(f"  {status} {label:<35} [{r.status_code}]")
    if r.status_code != 200:
        all_ok = False

# Test 404
r = requests.get(f"{API_URL}/comments/new?movie=FilmInexistant")
status = "✅" if r.status_code == 404 else "❌"
print(f"  {status} GET /comments/new?movie=FilmInexistant  [{r.status_code}] (404 attendu)")

print(f"\n{'✅ Tous les tests passent' if all_ok else '❌ Des tests échouent'}\n")