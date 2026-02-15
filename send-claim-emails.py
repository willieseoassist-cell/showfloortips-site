#!/usr/bin/env python3
"""
ShowFloorTips Claim Listing Email Sender
Finds contact emails from upcoming show websites and sends claim pitch via Resend API.
Runs daily at 8am via launchd. Sends up to 100 emails per run (Resend free tier).
Will switch to SES once production access is approved.

Usage:
    python3 send-claim-emails.py                # sends up to 100 emails
    python3 send-claim-emails.py --test         # sends 1 test email to willie
    python3 send-claim-emails.py --dry-run      # finds emails but doesn't send
"""

import json, time, urllib.request, urllib.error, re, sys, os, ssl
from datetime import datetime, timedelta

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
RESEND_KEY = "re_CGmCArUb_D1qyCSuaXGhsdRdUtZk5XhcZ"
FROM_EMAIL = "Willie Austin <info@showfloortips.com>"
SUBJECT_TEMPLATE = "Your show \"{show}\" is listed on ShowFloorTips \u2014 claim it free"
TEMPLATE_FILE = os.path.join(BASE_DIR, "email-claim-pitch.html")
SHOWS_FILE = os.path.join(BASE_DIR, "shows.js")
SENT_LOG = os.path.join(BASE_DIR, "claim-emails-sent.json")
RUN_LOG = os.path.join(BASE_DIR, "claim-emails.log")
MAX_EMAILS_PER_RUN = 500  # ~100 actual sends after skipping ~75% with no valid domain
DELAY_BETWEEN_SENDS = 0.9  # seconds — Resend rate ~2/sec

# Common contact email patterns to try
EMAIL_PATTERNS = [
    "info@{domain}", "contact@{domain}", "hello@{domain}",
    "events@{domain}", "exhibit@{domain}", "exhibitor@{domain}",
    "sales@{domain}", "marketing@{domain}", "sponsors@{domain}",
    "partnerships@{domain}", "media@{domain}",
]

def log(msg):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{timestamp}] {msg}"
    print(line)
    with open(RUN_LOG, "a") as f:
        f.write(line + "\n")

def load_shows():
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
    return json.loads(content[idx:arr_end + 1])

def load_sent():
    if os.path.exists(SENT_LOG):
        with open(SENT_LOG, "r") as f:
            return json.load(f)
    return {}

def save_sent(sent):
    with open(SENT_LOG, "w") as f:
        json.dump(sent, f, indent=2)

def extract_domain(website):
    """Extract clean domain from website URL."""
    if not website:
        return None
    website = website.strip().rstrip("/")
    if "://" in website:
        website = website.split("://")[1]
    domain = website.split("/")[0].lower()
    # Strip www.
    if domain.startswith("www."):
        domain = domain[4:]
    # Skip generic domains
    skip = {"google.com", "facebook.com", "linkedin.com", "twitter.com",
            "instagram.com", "youtube.com", "eventbrite.com", "meetup.com",
            "duckduckgo.com", "wikipedia.org"}
    if domain in skip or any(domain.endswith("." + s) for s in skip):
        return None
    return domain

def find_email_on_page(url, domain):
    """Try to scrape a contact email from the show's website."""
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE

    headers = {"User-Agent": "ShowFloorTips/1.0"}

    # Try main page and /contact
    urls_to_try = [url]
    if not url.endswith("/contact") and not url.endswith("/contact/"):
        base = url.rstrip("/")
        urls_to_try.append(base + "/contact")
        urls_to_try.append(base + "/contact-us")

    for try_url in urls_to_try:
        try:
            req = urllib.request.Request(try_url, headers=headers)
            resp = urllib.request.urlopen(req, timeout=10, context=ctx)
            html = resp.read().decode("utf-8", errors="ignore")

            # Find emails in the page
            emails = set(re.findall(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', html))

            # Filter to emails on the show's domain
            domain_emails = [e.lower() for e in emails if domain in e.lower()]

            # Prefer info@, contact@, events@, exhibit@
            priority = ["info@", "contact@", "events@", "exhibit", "hello@", "sales@", "marketing@"]
            for prefix in priority:
                for e in domain_emails:
                    if e.startswith(prefix):
                        return e

            # Return any domain email
            if domain_emails:
                return domain_emails[0]

        except Exception:
            continue

    return None

def guess_email(domain):
    """If scraping fails, guess info@ or contact@."""
    return f"info@{domain}"

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

    log("=== CLAIM EMAIL SENDER START (Resend) ===")

    # Load template
    with open(TEMPLATE_FILE, "r", encoding="utf-8") as f:
        html_body = f.read()

    if test_mode:
        log("TEST MODE — sending to willie.seo.assist@gmail.com via Resend")
        try:
            send_email("willie.seo.assist@gmail.com", "Test Trade Show 2026", "test-trade-show-2026", html_body)
            log("  SENT test email")
        except Exception as e:
            log(f"  FAIL test email: {e}")
        return

    # Load shows and find upcoming ones
    shows = load_shows()
    now = datetime.now()
    cutoff = now + timedelta(days=90)

    upcoming = []
    for s in shows:
        sd = s.get("sort_date", "")
        if not sd:
            continue
        try:
            d = datetime.strptime(sd, "%Y-%m-%d")
            if now <= d <= cutoff and s.get("website") and s.get("slug") and s.get("title"):
                upcoming.append(s)
        except ValueError:
            continue

    upcoming.sort(key=lambda s: s.get("sort_date", ""))
    log(f"Upcoming shows with websites: {len(upcoming)}")

    # Load sent log
    sent = load_sent()
    log(f"Already contacted: {len(sent)} shows")

    # Filter to unsent
    unsent = [s for s in upcoming if s["slug"] not in sent]
    log(f"Remaining to contact: {len(unsent)}")

    # Build set of already-sent email addresses to avoid duplicates
    sent_emails = set()
    for v in sent.values():
        if v.get("status") == "sent" and v.get("email"):
            sent_emails.add(v["email"].lower())

    if not unsent:
        log("All upcoming shows have been contacted. Done.")
        return

    # Process up to MAX_EMAILS_PER_RUN
    batch = unsent[:MAX_EMAILS_PER_RUN]
    success = 0
    failed = 0
    skipped = 0

    for i, show in enumerate(batch):
        title = show.get("title", "")
        slug = show.get("slug", "")
        website = show.get("website", "")
        domain = extract_domain(website)

        if not domain:
            skipped += 1
            sent[slug] = {"status": "skipped", "reason": "no valid domain", "date": now.isoformat()}
            continue

        # Try to find a contact email
        email = find_email_on_page(website, domain)
        if not email:
            email = guess_email(domain)

        # Skip if we already emailed this address (different show, same organizer)
        if email.lower() in sent_emails:
            sent[slug] = {"status": "skipped", "reason": "email already contacted", "email": email, "date": now.isoformat()}
            skipped += 1
            continue

        if dry_run:
            log(f"  [{i+1}/{len(batch)}] DRY RUN: {email} — {title[:50]}")
            sent[slug] = {"status": "dry_run", "email": email, "date": now.isoformat()}
            continue

        try:
            send_email(email, title, slug, html_body)
            success += 1
            sent[slug] = {"status": "sent", "email": email, "date": now.isoformat()}
            sent_emails.add(email.lower())
            log(f"  [{i+1}/{len(batch)}] SENT: {email} — {title[:50]}")
        except urllib.error.HTTPError as e:
            if e.code == 429:
                log(f"  Rate limited at #{i+1}. {success} sent. Will resume next run.")
                save_sent(sent)
                break
            failed += 1
            sent[slug] = {"status": "failed", "email": email, "error": str(e.code), "date": now.isoformat()}
            log(f"  [{i+1}/{len(batch)}] FAIL ({e.code}): {email} — {title[:50]}")
        except Exception as e:
            failed += 1
            sent[slug] = {"status": "failed", "email": email, "error": str(e), "date": now.isoformat()}
            log(f"  [{i+1}/{len(batch)}] ERROR: {email} — {str(e)[:50]}")

        time.sleep(DELAY_BETWEEN_SENDS)
        save_sent(sent)

    save_sent(sent)
    log(f"=== DONE — {success} sent, {failed} failed, {skipped} skipped, {len(sent)} total contacted ===")

if __name__ == "__main__":
    main()
