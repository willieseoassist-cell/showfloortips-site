#!/usr/bin/env python3
"""
ShowFloorTips Follow-Up Email Sender
Sends a follow-up "claim your listing" email to organizers who were emailed 3+ days ago
but haven't claimed their listing. Reads from claim-emails-sent.json and tracks follow-ups
in claim-followup-sent.json.

Runs daily at 10am via launchd (2 hours after the initial 8am claim-email send).

Usage:
    python3 send-followup-emails.py              # sends up to 100 follow-ups
    python3 send-followup-emails.py --test       # sends 1 test email to willie
    python3 send-followup-emails.py --dry-run    # finds eligible shows but doesn't send
"""

import json, time, urllib.request, urllib.error, sys, os
from datetime import datetime, timedelta

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
RESEND_KEY = "re_CGmCArUb_D1qyCSuaXGhsdRdUtZk5XhcZ"
FROM_EMAIL = "Willie Austin <info@showfloortips.com>"
SUBJECT_TEMPLATE = "Still unclaimed: {show} on ShowFloorTips"
TEMPLATE_FILE = os.path.join(BASE_DIR, "email-claim-followup.html")
SENT_LOG = os.path.join(BASE_DIR, "claim-emails-sent.json")
FOLLOWUP_LOG = os.path.join(BASE_DIR, "claim-followup-sent.json")
RUN_LOG = os.path.join(BASE_DIR, "claim-followup.log")
SHOWS_FILE = os.path.join(BASE_DIR, "shows.js")
MAX_EMAILS_PER_RUN = 100
DELAY_BETWEEN_SENDS = 0.9  # seconds — Resend rate ~2/sec
FOLLOWUP_AFTER_DAYS = 3


def log(msg):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{timestamp}] {msg}"
    print(line)
    with open(RUN_LOG, "a") as f:
        f.write(line + "\n")


def load_json(path):
    if os.path.exists(path):
        with open(path, "r") as f:
            return json.load(f)
    return {}


def save_json(path, data):
    with open(path, "w") as f:
        json.dump(data, f, indent=2)


def load_shows():
    """Load shows.js to get show titles from slugs."""
    with open(SHOWS_FILE, "r") as f:
        content = f.read()
    idx = content.index("[")
    bracket_count = 0
    arr_end = None
    for i, c in enumerate(content[idx:], idx):
        if c == "[":
            bracket_count += 1
        elif c == "]":
            bracket_count -= 1
            if bracket_count == 0:
                arr_end = i
                break
    shows = json.loads(content[idx:arr_end + 1])
    # Build slug -> title lookup
    return {s["slug"]: s.get("title", s["slug"]) for s in shows if s.get("slug")}


def send_email(to_email, show_name, show_slug, html_body):
    """Send via Resend API."""
    personalized = html_body.replace("{{SHOW_NAME}}", show_name).replace("{{SHOW_SLUG}}", show_slug)
    subject = SUBJECT_TEMPLATE.format(show=show_name)

    payload = json.dumps({
        "from": FROM_EMAIL,
        "to": [to_email],
        "subject": subject,
        "html": personalized
    }).encode("utf-8")

    req = urllib.request.Request("https://api.resend.com/emails", data=payload, method="POST")
    req.add_header("Authorization", f"Bearer {RESEND_KEY}")
    req.add_header("Content-Type", "application/json; charset=utf-8")
    req.add_header("User-Agent", "ShowFloorTips/1.0")

    resp = urllib.request.urlopen(req)
    return json.loads(resp.read())


def main():
    test_mode = "--test" in sys.argv
    dry_run = "--dry-run" in sys.argv

    log("=== FOLLOW-UP EMAIL SENDER START ===")

    # Load template
    with open(TEMPLATE_FILE, "r", encoding="utf-8") as f:
        html_body = f.read()

    if test_mode:
        log("TEST MODE — sending follow-up to willie.seo.assist@gmail.com via Resend")
        try:
            send_email("willie.seo.assist@gmail.com", "Test Trade Show 2026", "test-trade-show-2026", html_body)
            log("  SENT test follow-up email")
        except Exception as e:
            log(f"  FAIL test follow-up email: {e}")
        return

    # Load initial sends and follow-up tracking
    sent = load_json(SENT_LOG)
    followups = load_json(FOLLOWUP_LOG)
    show_titles = load_shows()

    log(f"Total initial sends on file: {len(sent)}")
    log(f"Already followed up: {len(followups)}")

    # Find eligible follow-ups: status "sent", 3+ days ago, not yet followed up
    now = datetime.now()
    cutoff = now - timedelta(days=FOLLOWUP_AFTER_DAYS)
    eligible = []

    for slug, info in sent.items():
        # Only follow up on successfully sent emails
        if info.get("status") != "sent":
            continue
        # Skip if already followed up
        if slug in followups:
            continue
        # Check if sent 3+ days ago
        sent_date_str = info.get("date", "")
        if not sent_date_str:
            continue
        try:
            sent_date = datetime.fromisoformat(sent_date_str)
            if sent_date <= cutoff:
                eligible.append({
                    "slug": slug,
                    "email": info["email"],
                    "title": show_titles.get(slug, slug),
                    "original_sent": sent_date_str
                })
        except (ValueError, TypeError):
            continue

    # Sort by original send date (oldest first)
    eligible.sort(key=lambda x: x["original_sent"])

    log(f"Eligible for follow-up (sent 3+ days ago, not yet followed up): {len(eligible)}")

    if not eligible:
        log("No shows eligible for follow-up. Done.")
        return

    # Process up to MAX_EMAILS_PER_RUN
    batch = eligible[:MAX_EMAILS_PER_RUN]
    success = 0
    failed = 0

    for i, show in enumerate(batch):
        slug = show["slug"]
        email = show["email"]
        title = show["title"]

        if dry_run:
            log(f"  [{i+1}/{len(batch)}] DRY RUN: {email} — {title[:50]}")
            followups[slug] = {
                "status": "dry_run",
                "email": email,
                "date": now.isoformat()
            }
            continue

        try:
            send_email(email, title, slug, html_body)
            success += 1
            followups[slug] = {
                "status": "sent",
                "email": email,
                "date": now.isoformat()
            }
            log(f"  [{i+1}/{len(batch)}] SENT follow-up: {email} — {title[:50]}")
        except urllib.error.HTTPError as e:
            if e.code == 429:
                log(f"  Rate limited at #{i+1}. {success} sent. Will resume next run.")
                save_json(FOLLOWUP_LOG, followups)
                break
            failed += 1
            followups[slug] = {
                "status": "failed",
                "email": email,
                "error": str(e.code),
                "date": now.isoformat()
            }
            log(f"  [{i+1}/{len(batch)}] FAIL ({e.code}): {email} — {title[:50]}")
        except Exception as e:
            failed += 1
            followups[slug] = {
                "status": "failed",
                "email": email,
                "error": str(e),
                "date": now.isoformat()
            }
            log(f"  [{i+1}/{len(batch)}] ERROR: {email} — {str(e)[:50]}")

        time.sleep(DELAY_BETWEEN_SENDS)
        save_json(FOLLOWUP_LOG, followups)

    save_json(FOLLOWUP_LOG, followups)
    log(f"=== DONE — {success} follow-ups sent, {failed} failed, {len(followups)} total followed up ===")


if __name__ == "__main__":
    main()
