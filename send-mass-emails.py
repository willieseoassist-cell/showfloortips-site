#!/usr/bin/env python3
"""
ShowFloorTips Mass Email Sender via Amazon SES SMTP
Sends personalized outreach to company domains from domain lists.
Designed for 100K+ emails per day.

Usage:
    python3 send-mass-emails.py                     # sends up to 100K emails
    python3 send-mass-emails.py --test              # sends 1 test email
    python3 send-mass-emails.py --dry-run           # counts targets, doesn't send
    python3 send-mass-emails.py --limit 5000        # send only 5000
    python3 send-mass-emails.py --resume            # resume from last position
"""

import json, time, smtplib, sys, os, re
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Amazon SES SMTP
SES_HOST = "email-smtp.us-east-2.amazonaws.com"
SES_PORT = 587
SES_USER = "AKIA44KLBQHB7PHZ4TWO"
SES_PASS = "BBlD6WOghsmLIIcbzNbVylCE35P050vmkP2XzD/adt+V"

FROM_EMAIL = "Willie Austin <info@showfloortips.com>"
FROM_ADDR = "info@showfloortips.com"
SUBJECT = "Find your next trade show — 25,000+ listed on ShowFloorTips"

# Domain files to process (in order)
DOMAIN_FILES = [
    os.path.join(BASE_DIR, "all-domains.txt"),
    os.path.join(BASE_DIR, "domains-extra.txt"),
]

# Email prefixes to try for each domain
EMAIL_PREFIXES = ["info"]

# Tracking
SENT_LOG = os.path.join(BASE_DIR, "mass-emails-sent.jsonl")
PROGRESS_FILE = os.path.join(BASE_DIR, "mass-emails-progress.json")
RUN_LOG = os.path.join(BASE_DIR, "mass-emails.log")

SUPPRESS_FILE = os.path.join(BASE_DIR, "suppressed-emails.txt")

MAX_PER_RUN = 100000
DELAY_BETWEEN = 0.075  # ~13/sec, under SES 14/sec limit
RECONNECT_EVERY = 500
SAVE_EVERY = 200

# Domains to skip
SKIP_DOMAINS = {
    "google.com", "facebook.com", "youtube.com", "instagram.com",
    "twitter.com", "linkedin.com", "microsoft.com", "apple.com",
    "github.com", "wikipedia.org", "wordpress.org", "amazon.com",
    "pinterest.com", "vimeo.com", "reddit.com", "tumblr.com",
    "flickr.com", "dropbox.com", "cloudflare.com", "googleapis.com",
    "googletagmanager.com", "goo.gl", "youtu.be", "x.com",
    "bit.ly", "t.co", "maps.google.com", "play.google.com",
    "en.wikipedia.org", "medium.com", "wordpress.com", "blogger.com",
    "squarespace.com", "wix.com", "weebly.com", "shopify.com",
    "godaddy.com", "namecheap.com", "hubspot.com", "mailchimp.com",
    "constantcontact.com", "sendgrid.com", "twilio.com",
    "showfloortips.com",  # ourselves
}

TEMPLATE = """<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:24px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;max-width:600px;width:100%;">

<!-- Header -->
<tr><td style="background:#0a0a0a;padding:24px 32px;text-align:center;">
<h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.5px;">ShowFloorTips</h1>
<p style="margin:4px 0 0;color:#a3a3a3;font-size:12px;">The #1 Trade Show Intelligence Platform</p>
</td></tr>

<!-- Body -->
<tr><td style="padding:32px 32px 16px;">
<p style="margin:0 0 16px;color:#0a0a0a;font-size:15px;line-height:1.7;">Hi there,</p>

<p style="margin:0 0 16px;color:#333;font-size:15px;line-height:1.7;">
I&rsquo;m Willie Austin, founder of <strong>ShowFloorTips.com</strong>. We&rsquo;ve built the largest trade show directory online &mdash; <strong>25,000+ events</strong> across <strong>120+ countries</strong> &mdash; and I think it could be valuable for your team.
</p>

<p style="margin:0 0 16px;color:#333;font-size:15px;line-height:1.7;">
Whether you&rsquo;re looking for new trade shows to exhibit at, evaluating events to attend, or researching your industry&rsquo;s conference landscape, ShowFloorTips has you covered.
</p>
</td></tr>

<!-- Stats Grid -->
<tr><td style="padding:0 32px 24px;">
<table width="100%" cellpadding="0" cellspacing="0">
<tr>
<td width="50%" style="padding:0 6px 12px 0;">
<div style="background:#fafafa;border:1px solid #e5e5e5;border-radius:10px;padding:16px 20px;text-align:center;">
<p style="margin:0;font-size:24px;font-weight:800;color:#0a0a0a;">25,000+</p>
<p style="margin:4px 0 0;font-size:12px;color:#737373;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Trade Shows Listed</p>
</div>
</td>
<td width="50%" style="padding:0 0 12px 6px;">
<div style="background:#fafafa;border:1px solid #e5e5e5;border-radius:10px;padding:16px 20px;text-align:center;">
<p style="margin:0;font-size:24px;font-weight:800;color:#0a0a0a;">120+</p>
<p style="margin:4px 0 0;font-size:12px;color:#737373;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Countries Covered</p>
</div>
</td>
</tr>
<tr>
<td width="50%" style="padding:0 6px 0 0;">
<div style="background:#fafafa;border:1px solid #e5e5e5;border-radius:10px;padding:16px 20px;text-align:center;">
<p style="margin:0;font-size:24px;font-weight:800;color:#0a0a0a;">25,600+</p>
<p style="margin:4px 0 0;font-size:12px;color:#737373;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Articles &amp; Guides</p>
</div>
</td>
<td width="50%" style="padding:0 0 0 6px;">
<div style="background:#fafafa;border:1px solid #e5e5e5;border-radius:10px;padding:16px 20px;text-align:center;">
<p style="margin:0;font-size:24px;font-weight:800;color:#0a0a0a;">Free</p>
<p style="margin:4px 0 0;font-size:12px;color:#737373;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Search &amp; Browse</p>
</div>
</td>
</tr>
</table>
</td></tr>

<!-- What You Get -->
<tr><td style="padding:0 32px 24px;">
<p style="margin:0 0 12px;font-size:15px;font-weight:700;color:#0a0a0a;">What ShowFloorTips Offers:</p>
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td style="padding:6px 0;font-size:14px;color:#333;line-height:1.5;">&bull; <strong>Search by industry, city, or date</strong> &mdash; find the perfect events for your business</td></tr>
<tr><td style="padding:6px 0;font-size:14px;color:#333;line-height:1.5;">&bull; <strong>Exhibitor cost guides</strong> &mdash; know what to budget before you commit</td></tr>
<tr><td style="padding:6px 0;font-size:14px;color:#333;line-height:1.5;">&bull; <strong>Networking strategies</strong> &mdash; proven tips for every major show</td></tr>
<tr><td style="padding:6px 0;font-size:14px;color:#333;line-height:1.5;">&bull; <strong>Show comparisons</strong> &mdash; side-by-side analysis of competing events</td></tr>
<tr><td style="padding:6px 0;font-size:14px;color:#333;line-height:1.5;">&bull; <strong>Industry news &amp; trends</strong> &mdash; stay ahead of what&rsquo;s shaping the trade show landscape</td></tr>
</table>
</td></tr>

<!-- CTA -->
<tr><td style="padding:0 32px 28px;text-align:center;">
<a href="https://showfloortips.com" style="display:inline-block;padding:14px 32px;background:#0a0a0a;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;border-radius:8px;">Explore Trade Shows</a>
</td></tr>

<!-- Sign Off -->
<tr><td style="padding:0 32px 32px;">
<p style="margin:0 0 4px;font-size:15px;color:#333;line-height:1.7;">Best regards,</p>
<p style="margin:0 0 2px;font-size:15px;font-weight:700;color:#0a0a0a;">Willie Austin</p>
<p style="margin:0 0 2px;font-size:13px;color:#737373;">Founder, ShowFloorTips</p>
<p style="margin:0 0 2px;font-size:13px;color:#737373;">info@showfloortips.com &bull; (334) 327-0246</p>
<p style="margin:0;font-size:13px;color:#737373;">showfloortips.com</p>
</td></tr>

<!-- Footer -->
<tr><td style="background:#fafafa;padding:20px 32px;border-top:1px solid #e5e5e5;">
<p style="margin:0;font-size:11px;color:#a3a3a3;text-align:center;line-height:1.5;">
ShowFloorTips &bull; The #1 Trade Show Intelligence Platform<br>
<a href="mailto:info@showfloortips.com?subject=unsubscribe" style="color:#737373;">Unsubscribe</a>
</p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>"""


def log(msg):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{timestamp}] {msg}"
    print(line)
    with open(RUN_LOG, "a") as f:
        f.write(line + "\n")


def load_sent_domains():
    """Load set of already-sent domains from JSONL log."""
    sent = set()
    if os.path.exists(SENT_LOG):
        with open(SENT_LOG, "r") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    rec = json.loads(line)
                    sent.add(rec.get("domain", ""))
                except json.JSONDecodeError:
                    continue
    return sent


def load_progress():
    """Load resume progress."""
    if os.path.exists(PROGRESS_FILE):
        with open(PROGRESS_FILE, "r") as f:
            return json.load(f)
    return {"file_index": 0, "line_offset": 0, "total_sent": 0}


def save_progress(progress):
    with open(PROGRESS_FILE, "w") as f:
        json.dump(progress, f)


def log_sent(domain, email, status, error=None):
    """Append to JSONL sent log."""
    rec = {
        "domain": domain,
        "email": email,
        "status": status,
        "date": datetime.now().isoformat()
    }
    if error:
        rec["error"] = str(error)[:200]
    with open(SENT_LOG, "a") as f:
        f.write(json.dumps(rec) + "\n")


def load_suppressed():
    """Load suppressed/bounced emails."""
    if not os.path.exists(SUPPRESS_FILE):
        return set()
    with open(SUPPRESS_FILE, "r") as f:
        return set(line.strip().lower() for line in f if line.strip())


def load_domains():
    """Load all domains from domain files, deduped."""
    suppressed = load_suppressed()
    domains = []
    seen = set()
    for filepath in DOMAIN_FILES:
        if not os.path.exists(filepath):
            continue
        with open(filepath, "r") as f:
            for line in f:
                d = line.strip().lower()
                if not d or d in seen or d in SKIP_DOMAINS:
                    continue
                # Skip subdomains of skip list
                if any(d.endswith("." + s) for s in SKIP_DOMAINS):
                    continue
                # Must look like a domain
                if "." not in d or len(d) < 4:
                    continue
                # Skip suppressed domains
                if f"info@{d}" in suppressed:
                    continue
                seen.add(d)
                domains.append(d)
    return domains


def get_smtp():
    """Create SES SMTP connection."""
    server = smtplib.SMTP(SES_HOST, SES_PORT)
    server.ehlo()
    server.starttls()
    server.ehlo()
    server.login(SES_USER, SES_PASS)
    return server


def send_one(smtp, to_email, domain):
    """Send one email via existing SMTP connection."""
    msg = MIMEMultipart("alternative")
    msg["From"] = FROM_EMAIL
    msg["To"] = to_email
    msg["Subject"] = SUBJECT
    msg["List-Unsubscribe"] = "<mailto:info@showfloortips.com?subject=unsubscribe>"
    msg.attach(MIMEText(TEMPLATE, "html", "utf-8"))
    smtp.sendmail(FROM_ADDR, to_email, msg.as_string())


def main():
    test_mode = "--test" in sys.argv
    dry_run = "--dry-run" in sys.argv
    resume = "--resume" in sys.argv

    limit = MAX_PER_RUN
    if "--limit" in sys.argv:
        idx = sys.argv.index("--limit")
        if idx + 1 < len(sys.argv):
            limit = int(sys.argv[idx + 1])

    log("=== MASS EMAIL SENDER START ===")

    if test_mode:
        log("TEST MODE — sending to willie.seo.assist@gmail.com via SES")
        try:
            smtp = get_smtp()
            send_one(smtp, "willie.seo.assist@gmail.com", "test.com")
            smtp.quit()
            log("  SENT test email via SES")
        except Exception as e:
            log(f"  FAIL: {e}")
        return

    # Load domains
    domains = load_domains()
    log(f"Total unique domains loaded: {len(domains)}")

    # Load already sent
    sent_domains = load_sent_domains()
    log(f"Already sent to: {len(sent_domains)} domains")

    # Filter to unsent
    unsent = [d for d in domains if d not in sent_domains]
    log(f"Remaining to send: {len(unsent)}")

    if not unsent:
        log("All domains contacted. Done.")
        return

    batch = unsent[:limit]
    log(f"This run will process: {len(batch)} domains")

    if dry_run:
        for i, d in enumerate(batch[:20]):
            log(f"  DRY RUN [{i+1}]: info@{d}")
        if len(batch) > 20:
            log(f"  ... and {len(batch)-20} more")
        log(f"=== DRY RUN DONE — {len(batch)} would be sent ===")
        return

    # Open SMTP connection
    smtp = None
    try:
        smtp = get_smtp()
        log("SES SMTP connected")
    except Exception as e:
        log(f"FATAL: Cannot connect to SES: {e}")
        return

    success = 0
    failed = 0
    start_time = time.time()

    for i, domain in enumerate(batch):
        email = f"info@{domain}"

        # Reconnect SMTP periodically
        if success > 0 and success % RECONNECT_EVERY == 0:
            try:
                smtp.quit()
            except Exception:
                pass
            try:
                smtp = get_smtp()
                log(f"  SMTP reconnected at #{success}")
            except Exception as e:
                log(f"  FATAL: Reconnect failed: {e}")
                break

        try:
            send_one(smtp, email, domain)
            success += 1
            log_sent(domain, email, "sent")

            if success % 500 == 0:
                elapsed = time.time() - start_time
                rate = success / elapsed * 3600 if elapsed > 0 else 0
                log(f"  Progress: {success}/{len(batch)} sent ({rate:.0f}/hr) — latest: {email}")
            elif success <= 5:
                log(f"  [{i+1}/{len(batch)}] SENT: {email}")

        except smtplib.SMTPResponseException as e:
            if e.smtp_code == 454:  # throttled
                log(f"  SES throttled at #{success}. Waiting 10s...")
                time.sleep(10)
                try:
                    smtp.quit()
                except Exception:
                    pass
                try:
                    smtp = get_smtp()
                    send_one(smtp, email, domain)
                    success += 1
                    log_sent(domain, email, "sent")
                except Exception as e2:
                    failed += 1
                    log_sent(domain, email, "failed", e2)
            else:
                failed += 1
                log_sent(domain, email, "failed", e)
                if failed % 50 == 0:
                    log(f"  {failed} failures so far. Latest: {email} — {str(e)[:60]}")

        except Exception as e:
            failed += 1
            log_sent(domain, email, "failed", e)
            # Reconnect if connection dropped
            try:
                smtp = get_smtp()
            except Exception:
                log(f"  FATAL: Lost SES connection at #{success}. Exiting.")
                break

        time.sleep(DELAY_BETWEEN)

    if smtp:
        try:
            smtp.quit()
        except Exception:
            pass

    elapsed = time.time() - start_time
    rate = success / elapsed * 3600 if elapsed > 0 else 0
    log(f"=== DONE — {success} sent, {failed} failed in {elapsed/60:.1f} min ({rate:.0f}/hr) ===")
    log(f"Total domains contacted: {len(sent_domains) + success}")


if __name__ == "__main__":
    main()
