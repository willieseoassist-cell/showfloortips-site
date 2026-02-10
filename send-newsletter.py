#!/usr/bin/env python3
"""
ShowFloorTips Newsletter Sender
Reads email-template.html and sends to all subscribers via Resend API.

Usage:
    python3 send-newsletter.py                     # sends to all subscribers
    python3 send-newsletter.py --test              # sends only to willie.seo.assist@gmail.com
    python3 send-newsletter.py --subject "Custom"  # override subject line
"""

import json, time, urllib.request, urllib.error, re, sys, os

RESEND_KEY = "re_CGmCArUb_D1qyCSuaXGhsdRdUtZk5XhcZ"
FROM_EMAIL = "Show Floor Tips Team <info@showfloortips.com>"
DEFAULT_SUBJECT = "ShowFloorTips Weekly: Trade Show Intelligence for Exhibitors"
TEMPLATE_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "email-template.html")
CLAUDE_MD = os.path.join(os.path.dirname(os.path.abspath(__file__)), "CLAUDE.md")

def get_emails_from_claude_md():
    """Extract all outreach emails from CLAUDE.md"""
    with open(CLAUDE_MD, 'r') as f:
        content = f.read()

    start = content.find('Shows contacted (60+ unique shows')
    end = content.find('#### Deployment', start)
    section = content[start:end]

    all_emails = set()

    # Standard emails
    for local, domain in re.findall(r'([a-zA-Z0-9._%+-]+)\s*@\s*([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})', section):
        all_emails.add(f'{local}@{domain}'.lower())

    # Grouped emails like (name1, name2 @domain.com)
    for p in re.findall(r'\(([^)]+)\)', section):
        domain_match = re.search(r'@\s*([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})', p)
        if domain_match:
            domain = domain_match.group(1)
            before_at = p[:p.index('@')]
            for name in before_at.split(','):
                name = name.strip().rstrip(',')
                if name and re.match(r'^[a-zA-Z0-9._%+-]+$', name):
                    all_emails.add(f'{name}@{domain}'.lower())

    return sorted(all_emails)

def send_email(to_email, subject, html_body):
    """Send a single email via Resend API"""
    payload = json.dumps({
        "from": FROM_EMAIL,
        "to": [to_email],
        "subject": subject,
        "html": html_body
    }).encode('utf-8')

    req = urllib.request.Request("https://api.resend.com/emails", data=payload, method='POST')
    req.add_header('Authorization', f'Bearer {RESEND_KEY}')
    req.add_header('Content-Type', 'application/json; charset=utf-8')
    req.add_header('User-Agent', 'ShowFloorTips/1.0')

    resp = urllib.request.urlopen(req)
    return json.loads(resp.read())

def main():
    test_mode = '--test' in sys.argv

    # Parse custom subject
    subject = DEFAULT_SUBJECT
    for i, arg in enumerate(sys.argv):
        if arg == '--subject' and i + 1 < len(sys.argv):
            subject = sys.argv[i + 1]

    # Read HTML template from file (no escaping issues)
    with open(TEMPLATE_FILE, 'r', encoding='utf-8') as f:
        html_body = f.read()

    if test_mode:
        recipients = ['willie.seo.assist@gmail.com']
        print("TEST MODE: sending to willie.seo.assist@gmail.com only\n")
    else:
        recipients = get_emails_from_claude_md()

    print(f"Subject: {subject}")
    print(f"Template: {TEMPLATE_FILE}")
    print(f"Recipients: {len(recipients)}\n")

    success = 0
    failed = 0

    for i, email in enumerate(recipients):
        try:
            send_email(email, subject, html_body)
            success += 1
            print(f"  [{i+1}/{len(recipients)}] SENT: {email}")
        except urllib.error.HTTPError as e:
            body = e.read().decode()
            failed += 1
            print(f"  [{i+1}/{len(recipients)}] FAIL: {email} ({e.code}: {body[:100]})")
        except Exception as e:
            failed += 1
            print(f"  [{i+1}/{len(recipients)}] ERROR: {email} ({e})")

        time.sleep(0.9)

    print(f"\n{'='*50}")
    print(f"DONE: {success} sent, {failed} failed")

if __name__ == '__main__':
    main()
