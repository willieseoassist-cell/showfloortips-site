#!/usr/bin/env python3
"""
ShowFloorTips Sponsor Pitch Sender
Reads email-sponsor-pitch.html and sends to contacts via Resend API.
Tracks which emails were already sent to avoid duplicates.

Usage:
    python3 send-sponsor-pitch.py                # sends to remaining contacts
    python3 send-sponsor-pitch.py --test         # sends only to willie.seo.assist@gmail.com
    python3 send-sponsor-pitch.py --reset        # clears sent log and starts fresh
"""

import json, time, urllib.request, urllib.error, re, sys, os

RESEND_KEY = "re_CGmCArUb_D1qyCSuaXGhsdRdUtZk5XhcZ"
FROM_EMAIL = "Willie Austin <info@showfloortips.com>"
SUBJECT = "Partnership Opportunity \u2014 ShowFloorTips (24,600+ Trade Shows)"
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TEMPLATE_FILE = os.path.join(BASE_DIR, "email-sponsor-pitch.html")
CLAUDE_MD = os.path.join(BASE_DIR, "CLAUDE.md")
SENT_LOG = os.path.join(BASE_DIR, "sponsor-pitch-sent.json")

def get_emails():
    with open(CLAUDE_MD, 'r') as f:
        content = f.read()
    start = content.find('Shows contacted (60+ unique shows')
    end = content.find('#### Deployment', start)
    section = content[start:end]
    all_emails = set()
    for local, domain in re.findall(r'([a-zA-Z0-9._%+-]+)\s*@\s*([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})', section):
        all_emails.add(f'{local}@{domain}'.lower())
    for p in re.findall(r'\(([^)]+)\)', section):
        dm = re.search(r'@\s*([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})', p)
        if dm:
            domain = dm.group(1)
            before = p[:p.index('@')]
            for name in before.split(','):
                name = name.strip().rstrip(',')
                if name and re.match(r'^[a-zA-Z0-9._%+-]+$', name):
                    all_emails.add(f'{name}@{domain}'.lower())
    return sorted(all_emails)

def load_sent():
    if os.path.exists(SENT_LOG):
        with open(SENT_LOG, 'r') as f:
            return set(json.load(f))
    return set()

def save_sent(sent):
    with open(SENT_LOG, 'w') as f:
        json.dump(sorted(sent), f, indent=2)

def main():
    test_mode = '--test' in sys.argv
    if '--reset' in sys.argv:
        if os.path.exists(SENT_LOG):
            os.remove(SENT_LOG)
        print("Sent log cleared.")
        return

    with open(TEMPLATE_FILE, 'r', encoding='utf-8') as f:
        html_body = f.read()

    if test_mode:
        recipients = ['willie.seo.assist@gmail.com']
        sent = set()
        print("TEST MODE\n")
    else:
        all_emails = get_emails()
        sent = load_sent()
        recipients = [e for e in all_emails if e not in sent]
        print(f"Total contacts: {len(all_emails)}")
        print(f"Already sent: {len(sent)}")
        print(f"Remaining: {len(recipients)}\n")

    if not recipients:
        print("All contacts have been sent. Use --reset to start fresh.")
        return

    success = 0
    failed = 0

    for i, email in enumerate(recipients):
        payload = json.dumps({
            "from": FROM_EMAIL,
            "to": [email],
            "subject": SUBJECT,
            "html": html_body
        }).encode('utf-8')

        req = urllib.request.Request("https://api.resend.com/emails", data=payload, method='POST')
        req.add_header('Authorization', f'Bearer {RESEND_KEY}')
        req.add_header('Content-Type', 'application/json; charset=utf-8')
        req.add_header('User-Agent', 'ShowFloorTips/1.0')

        try:
            resp = urllib.request.urlopen(req)
            json.loads(resp.read())
            success += 1
            sent.add(email)
            save_sent(sent)
            print(f"  [{i+1}/{len(recipients)}] SENT: {email}")
        except urllib.error.HTTPError as e:
            body = e.read().decode()
            if e.code == 429:
                print(f"\n  Rate limited at {email}. {success} sent this run. Run again later.")
                save_sent(sent)
                break
            failed += 1
            print(f"  [{i+1}/{len(recipients)}] FAIL: {email} ({e.code})")
        except Exception as e:
            failed += 1
            print(f"  [{i+1}/{len(recipients)}] ERROR: {email}")

        time.sleep(0.9)

    save_sent(sent)
    print(f"\n{'='*50}")
    print(f"This run: {success} sent, {failed} failed")
    print(f"Total sent so far: {len(sent)}")

if __name__ == '__main__':
    main()
