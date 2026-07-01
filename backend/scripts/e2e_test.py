"""End-to-end API smoke test: upload -> create job -> poll until done."""
from __future__ import annotations

import json
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

BASE = "http://127.0.0.1:8000"
TEST_IMAGE = Path(__file__).resolve().parent / "test-photo.png"


def request(method: str, path: str, data: bytes | None = None, headers: dict | None = None):
    req = urllib.request.Request(
        f"{BASE}{path}",
        data=data,
        method=method,
        headers=headers or {},
    )
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            return resp.status, resp.read().decode()
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()


def upload_photo() -> str:
    boundary = "----MemoraBoundary"
    body = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="file"; filename="test-photo.png"\r\n'
        f"Content-Type: image/png\r\n\r\n"
    ).encode() + TEST_IMAGE.read_bytes() + f"\r\n--{boundary}--\r\n".encode()

    status, raw = request(
        "POST",
        "/api/upload-memory-photo",
        data=body,
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}"},
    )
    if status != 200:
        raise RuntimeError(f"Upload failed ({status}): {raw}")
    return json.loads(raw)["url"]


def create_job(photo_url: str) -> str:
    payload = json.dumps(
        {
            "title": "E2E Test Story",
            "description": "Automated smoke test",
            "memory_type": "family",
            "theme_name": "nostalgic_film",
            "photo_urls": [photo_url],
            "num_memory_cards": 1,
        }
    ).encode()
    status, raw = request(
        "POST",
        "/api/story-jobs",
        data=payload,
        headers={"Content-Type": "application/json"},
    )
    if status != 200:
        raise RuntimeError(f"Create job failed ({status}): {raw}")
    return json.loads(raw)["story_job_id"]


def poll_job(job_id: str, timeout_sec: int = 300) -> dict:
    deadline = time.time() + timeout_sec
    while time.time() < deadline:
        status, raw = request("GET", f"/api/story-jobs/{job_id}")
        if status != 200:
            raise RuntimeError(f"Get job failed ({status}): {raw}")
        job = json.loads(raw)
        cards = job.get("memory_cards", [])
        print(f"  job={job['status']} cards={[c['status'] for c in cards]}")
        if job["status"] in ("completed", "failed"):
            return job
        if cards and all(c["status"] in ("completed", "failed") for c in cards):
            return job
        time.sleep(3)
    raise TimeoutError("Job did not finish in time")


def main() -> int:
    print("1. Health check...")
    status, body = request("GET", "/health")
    if status != 200:
        print(f"FAIL health: {status} {body}")
        return 1
    print("   OK", body)

    if not TEST_IMAGE.exists():
        print(f"FAIL missing {TEST_IMAGE}")
        return 1

    print("2. Upload photo...")
    url = upload_photo()
    print(f"   OK {url[:80]}...")

    print("3. Create story job (1 card)...")
    job_id = create_job(url)
    print(f"   OK job_id={job_id}")

    print("4. Poll generation (up to 5 min)...")
    job = poll_job(job_id)
    for card in job["memory_cards"]:
        print(
            f"   card {card['theme_name']}: {card['status']}"
            + (f" -> {card['image_url'][:60]}..." if card.get("image_url") else "")
            + (f" err={card.get('error_message')}" if card.get("error_message") else "")
        )

    failed = [c for c in job["memory_cards"] if c["status"] == "failed"]
    if failed:
        print("FAIL one or more cards failed")
        return 1

    print("PASS e2e flow")
    return 0


if __name__ == "__main__":
    sys.exit(main())
