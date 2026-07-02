"""
OPTIONAL: upload visual/quiz-game lesson content JSONs to Supabase Storage
and point the lessons table at the storage URLs.

By default the app serves content directly from public/content/ (see
scripts/seed_visual_lessons.sql) — no upload needed. Use this script only if
you want content hosted in Supabase Storage instead (e.g. to update lessons
without redeploying the app).

Prereqs:
  1. Run migrate_visual_lessons.sql in the Supabase SQL Editor.
  2. Create a public storage bucket named `visual`.

Content layout (this repo):
  public/content/<course-slug>/lesson_01.json, lesson_02.json, ...

Each JSON declares its own "type" ("visual" or "quiz_game") and "title".

Usage:
  python scripts/upload_visual.py                # upload all courses under content/
  python scripts/upload_visual.py spanish-kids-1 # upload one course
"""

import json
import os
import re
import sys

from dotenv import load_dotenv
from supabase import create_client

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_KEY"]
CONTENT_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "content")
BUCKET = "visual"

sb = create_client(SUPABASE_URL, SUPABASE_KEY)


def upload_file(remote_path, data):
    try:
        sb.storage.from_(BUCKET).upload(
            remote_path, data,
            file_options={"content-type": "application/json", "upsert": "true"},
        )
    except Exception as e:
        if "Duplicate" in str(e) or "already exists" in str(e).lower():
            sb.storage.from_(BUCKET).update(
                remote_path, data,
                file_options={"content-type": "application/json"},
            )
        else:
            raise


def upload_course(slug):
    course_dir = os.path.join(CONTENT_DIR, slug)
    course = sb.table("courses").select("id").eq("slug", slug).execute()
    if not course.data:
        print(f"!! Course '{slug}' not found in DB — run migrate_visual_lessons.sql first")
        return
    course_id = course.data[0]["id"]
    print(f"Course {slug} ({course_id})")

    lesson_files = sorted(
        f for f in os.listdir(course_dir) if re.fullmatch(r"lesson_\d+\.json", f)
    )
    for filename in lesson_files:
        lesson_num = int(re.search(r"\d+", filename).group())
        path = os.path.join(course_dir, filename)
        with open(path, "rb") as f:
            data = f.read()
        content = json.loads(data)

        remote_path = f"{slug}/{filename}"
        print(f"  L{lesson_num}: {content['title']} ({content['type']})...", end=" ", flush=True)
        upload_file(remote_path, data)

        content_url = f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET}/{remote_path}"
        sb.table("lessons").upsert({
            "course_id": course_id,
            "lesson_number": lesson_num,
            "title": content["title"],
            "lesson_type": content["type"],
            "content_url": content_url,
        }, on_conflict="course_id,lesson_number").execute()
        print("done")


if __name__ == "__main__":
    slugs = sys.argv[1:] or sorted(
        d for d in os.listdir(CONTENT_DIR)
        if os.path.isdir(os.path.join(CONTENT_DIR, d))
    )
    for slug in slugs:
        upload_course(slug)
    print("\nAll visual lessons uploaded!")
