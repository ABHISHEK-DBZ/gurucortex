import requests
import sys

base = "http://127.0.0.1:8000"

endpoints = [
    ("Health Check", "GET", f"{base}/api/v1/health"),
    ("Reality Navigator", "POST", f"{base}/api/v1/visual/reality/Semiconductor%20Physics"),
    ("Revision Dashboard", "GET", f"{base}/api/v1/revision/dashboard"),
    ("Due Flashcards", "GET", f"{base}/api/v1/revision/flashcards/due"),
    ("Coach Recommendations", "GET", f"{base}/api/v1/coach/recommendations"),
    ("Learning Identity", "GET", f"{base}/api/v1/coach/identity"),
    ("Career Pathways", "GET", f"{base}/api/v1/career/pathways/electronics"),
    ("Focus Dashboard", "GET", f"{base}/api/v1/focus/dashboard"),
    ("Parent Link Code", "GET", f"{base}/api/v1/parent/code"),
    ("Parent Dashboard", "GET", f"{base}/api/v1/parent/dashboard"),
    ("Institution Dashboard", "GET", f"{base}/api/v1/institution/dashboard"),
]

print("=== GURUCORTEX 2.0 API VERIFICATION SUITE ===")
all_passed = True
for name, method, url in endpoints:
    try:
        if method == "GET":
            r = requests.get(url, timeout=15)
        else:
            r = requests.post(url, timeout=15)
        
        if r.status_code == 200:
            print(f"[PASS] {name:25} -> 200 OK")
        else:
            print(f"[FAIL] {name:25} -> {r.status_code}: {r.text[:80]}")
            all_passed = False
    except Exception as e:
        print(f"[FAIL] {name:25} -> Exception: {e}")
        all_passed = False

if all_passed:
    print("\nALL 11 GURUCORTEX 2.0 ENDPOINTS PASSED VERIFICATION!")
else:
    print("\nSome endpoints failed verification.")
