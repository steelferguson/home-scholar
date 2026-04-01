"""
Upload audio files and vocab MDs to Supabase Storage,
and populate the lessons table.

Run setup_db.sql first, then run this script.
"""

import os
import re
from dotenv import load_dotenv
from supabase import create_client

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_KEY"]

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

COURSES = [
    {
        "slug": "czech-2",
        "audio_dir": "/Users/steelferguson/daily_sessions/projects/czech_pimsleur/output",
        "lesson_range": range(31, 61),
        "lesson_prefix": "lesson_",
    },
    {
        "slug": "spanish-1",
        "audio_dir": "/Users/steelferguson/daily_sessions/projects/spanish_pimsleur/output",
        "lesson_range": range(1, 31),
        "lesson_prefix": "lesson_",
    },
    {
        "slug": "english-connect-1",
        "audio_dir": "/Users/steelferguson/daily_sessions/projects/english_for_spanish/output",
        "lesson_range": range(1, 15),
        "lesson_prefix": "lesson_",
    },
]


def get_duration_from_file(filepath):
    """Estimate duration from file size (128kbps MP3 ≈ 960KB/min)."""
    size_bytes = os.path.getsize(filepath)
    return round(size_bytes / (960 * 1024), 1)


def get_lesson_title(audio_dir, lesson_num):
    """Try to extract title from the lesson Python file."""
    # Check all possible lesson source dirs
    for project_dir in [
        "/Users/steelferguson/daily_sessions/projects/czech_pimsleur/lessons",
        "/Users/steelferguson/daily_sessions/projects/spanish_pimsleur/lessons",
        "/Users/steelferguson/daily_sessions/projects/english_for_spanish/lessons",
    ]:
        py_file = os.path.join(project_dir, f"lesson_{lesson_num:02d}.py")
        if os.path.exists(py_file):
            with open(py_file) as f:
                content = f.read()
            match = re.search(r'TITLE\s*=\s*"([^"]+)"', content)
            if match:
                return match.group(1)
    return f"Lesson {lesson_num}"


def ensure_bucket(name):
    """Create storage bucket if it doesn't exist."""
    try:
        supabase.storage.create_bucket(name, options={"public": True})
        print(f"  Created bucket: {name}")
    except Exception as e:
        if "already exists" in str(e).lower() or "Duplicate" in str(e):
            print(f"  Bucket exists: {name}")
        else:
            print(f"  Bucket note: {e}")


def upload_file(bucket, remote_path, local_path, content_type):
    """Upload a file to Supabase storage."""
    with open(local_path, "rb") as f:
        data = f.read()
    try:
        supabase.storage.from_(bucket).upload(
            remote_path, data,
            file_options={"content-type": content_type, "upsert": "true"}
        )
    except Exception as e:
        if "Duplicate" in str(e) or "already exists" in str(e).lower():
            supabase.storage.from_(bucket).update(
                remote_path, data,
                file_options={"content-type": content_type}
            )
        else:
            raise


def main():
    print("Setting up storage buckets...")
    ensure_bucket("audio")
    ensure_bucket("vocab")

    for course in COURSES:
        slug = course["slug"]
        audio_dir = course["audio_dir"]
        lesson_range = course["lesson_range"]

        # Get course ID
        result = supabase.table("courses").select("id").eq("slug", slug).execute()
        if not result.data:
            print(f"\nCourse '{slug}' not found in database. Run setup_db.sql first.")
            continue
        course_id = result.data[0]["id"]

        print(f"\n=== {slug} ({len(lesson_range)} lessons) ===")

        for lesson_num in lesson_range:
            mp3_file = os.path.join(audio_dir, f"lesson_{lesson_num:02d}.mp3")
            vocab_file = os.path.join(audio_dir, f"lesson_{lesson_num:02d}_vocab.md")

            if not os.path.exists(mp3_file):
                print(f"  Skipping lesson {lesson_num}: MP3 not found")
                continue

            # Upload MP3
            remote_audio = f"{slug}/lesson_{lesson_num:02d}.mp3"
            print(f"  Uploading lesson {lesson_num} audio...", end=" ", flush=True)
            upload_file("audio", remote_audio, mp3_file, "audio/mpeg")
            print("done")

            # Upload vocab if exists
            remote_vocab = None
            if os.path.exists(vocab_file):
                remote_vocab = f"{slug}/lesson_{lesson_num:02d}_vocab.md"
                upload_file("vocab", remote_vocab, vocab_file, "text/markdown")

            # Get duration and title
            duration = get_duration_from_file(mp3_file)
            title = get_lesson_title(audio_dir, lesson_num)

            # Build public URLs
            audio_url = f"{SUPABASE_URL}/storage/v1/object/public/audio/{remote_audio}"
            vocab_url = f"{SUPABASE_URL}/storage/v1/object/public/vocab/{remote_vocab}" if remote_vocab else None

            # Upsert lesson record
            supabase.table("lessons").upsert({
                "course_id": course_id,
                "lesson_number": lesson_num,
                "title": title,
                "duration_minutes": duration,
                "audio_url": audio_url,
                "vocab_url": vocab_url,
            }, on_conflict="course_id,lesson_number").execute()

        print(f"  Done: {slug}")

    print("\nAll uploads complete!")


if __name__ == "__main__":
    main()
