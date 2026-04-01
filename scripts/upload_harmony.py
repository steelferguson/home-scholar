"""Upload harmony course audio + concepts to Supabase Storage."""
import os, re
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()
sb = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])

AUDIO_DIR = "/Users/steelferguson/daily_sessions/projects/harmony-course/output"
LESSON_DIR = "/Users/steelferguson/daily_sessions/projects/harmony-course/lessons"
SLUG = "harmony-1"

# Get course ID
course = sb.table("courses").select("id").eq("slug", SLUG).execute()
course_id = course.data[0]["id"]
print(f"Course ID: {course_id}")

SUPABASE_URL = os.environ["SUPABASE_URL"]

def upload_file(bucket, remote_path, local_path, content_type):
    with open(local_path, "rb") as f:
        data = f.read()
    try:
        sb.storage.from_(bucket).upload(remote_path, data,
            file_options={"content-type": content_type, "upsert": "true"})
    except Exception as e:
        if "Duplicate" in str(e) or "already exists" in str(e).lower():
            sb.storage.from_(bucket).update(remote_path, data,
                file_options={"content-type": content_type})
        else:
            raise

for i in range(1, 41):
    mp3 = os.path.join(AUDIO_DIR, f"lesson_{i:02d}.mp3")
    concepts = os.path.join(AUDIO_DIR, f"lesson_{i:02d}_concepts.md")

    if not os.path.exists(mp3):
        print(f"  Skipping {i}: no MP3")
        continue

    # Get title from lesson file
    py_file = os.path.join(LESSON_DIR, f"lesson_{i:02d}.py")
    title = f"Lesson {i}"
    if os.path.exists(py_file):
        with open(py_file) as f:
            m = re.search(r'TITLE\s*=\s*"([^"]+)"', f.read())
            if m: title = m.group(1)

    duration = round(os.path.getsize(mp3) / (960 * 1024), 1)

    # Upload audio
    remote_audio = f"{SLUG}/lesson_{i:02d}.mp3"
    print(f"  L{i}: {title} ({duration} min)...", end=" ", flush=True)
    upload_file("audio", remote_audio, mp3, "audio/mpeg")

    # Upload concepts if exists
    remote_vocab = None
    if os.path.exists(concepts):
        remote_vocab = f"{SLUG}/lesson_{i:02d}_concepts.md"
        upload_file("vocab", remote_vocab, concepts, "text/markdown")

    audio_url = f"{SUPABASE_URL}/storage/v1/object/public/audio/{remote_audio}"
    vocab_url = f"{SUPABASE_URL}/storage/v1/object/public/vocab/{remote_vocab}" if remote_vocab else None

    sb.table("lessons").upsert({
        "course_id": course_id,
        "lesson_number": i,
        "title": title,
        "duration_minutes": duration,
        "audio_url": audio_url,
        "vocab_url": vocab_url,
    }, on_conflict="course_id,lesson_number").execute()
    print("done")

print("\nAll harmony lessons uploaded!")
