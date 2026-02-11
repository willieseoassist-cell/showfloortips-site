#!/usr/bin/env python3
"""
ShowFloorTips Auto Newsletter - Sends daily at 8am via cron
Reads the latest 3 articles from news.js and sends a formatted email.

Cron entry (add with: crontab -e):
0 8 * * * /usr/bin/python3 "/Volumes/Willie Extr/tradeshow-website/auto-newsletter.py" >> /tmp/newsletter-log.txt 2>&1
"""

import json, time, urllib.request, urllib.error, re, sys, os
from datetime import datetime, date

RESEND_KEY = "re_CGmCArUb_D1qyCSuaXGhsdRdUtZk5XhcZ"
FROM_EMAIL = "Show Floor Tips Team <info@showfloortips.com>"
NEWS_JS = os.path.join(os.path.dirname(os.path.abspath(__file__)), "news.js")
CLAUDE_MD = os.path.join(os.path.dirname(os.path.abspath(__file__)), "CLAUDE.md")
SENT_LOG = os.path.join(os.path.dirname(os.path.abspath(__file__)), "newsletter-sent.json")

def get_latest_articles(count=3):
    """Get the latest N articles from news.js"""
    with open(NEWS_JS, 'r') as f:
        content = f.read()

    match = re.search(r'var NEWS_DATA = (\[.*?\]);', content, re.DOTALL)
    if not match:
        return []

    articles = json.loads(match.group(1))
    return articles[:count]

def get_emails():
    """Extract subscriber emails from CLAUDE.md"""
    with open(CLAUDE_MD, 'r') as f:
        content = f.read()

    start = content.find('Shows contacted (60+ unique shows')
    end = content.find('#### Deployment', start)
    if start == -1 or end == -1:
        return []
    section = content[start:end]

    all_emails = set()
    for local, domain in re.findall(r'([a-zA-Z0-9._%+-]+)\s*@\s*([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})', section):
        all_emails.add(f'{local}@{domain}'.lower())

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

def build_email_html(articles):
    """Build newsletter HTML from latest articles"""
    today = datetime.now().strftime("%B %d, %Y")
    weekday = datetime.now().strftime("%A")

    articles_html = ""
    categories = ["TRENDING", "INDUSTRY NEWS", "MUST READ"]

    for i, article in enumerate(articles[:3]):
        cat = categories[i] if i < len(categories) else "NEWS"
        url = f"https://showfloortips.com/{article.get('url', '')}"
        title = article.get('title', 'Untitled').replace("'", "&rsquo;").replace('"', "&quot;").replace("&", "&amp;").replace("—", "&mdash;")
        summary = article.get('summary', '').replace("'", "&rsquo;").replace('"', "&quot;").replace("&", "&amp;").replace("—", "&mdash;")

        articles_html += f"""
<tr><td style="padding:0 32px 24px;">
<table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e5e5;border-radius:8px;overflow:hidden;">
<tr><td style="padding:20px 24px;">
<p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#737373;text-transform:uppercase;letter-spacing:0.5px;">{cat}</p>
<a href="{url}" style="text-decoration:none;">
<h2 style="margin:0 0 8px;font-size:17px;color:#0a0a0a;line-height:1.4;">{title}</h2>
</a>
<p style="margin:0 0 12px;color:#525252;font-size:14px;line-height:1.6;">{summary[:200]}</p>
<a href="{url}" style="display:inline-block;padding:8px 20px;background:#0a0a0a;color:#ffffff;font-size:13px;font-weight:600;text-decoration:none;border-radius:6px;">Read More</a>
</td></tr>
</table>
</td></tr>
"""

    html = f"""<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:24px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;max-width:600px;width:100%;">

<tr><td style="background:#0a0a0a;padding:28px 32px;text-align:center;">
<h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">ShowFloorTips</h1>
<p style="margin:6px 0 0;color:#a3a3a3;font-size:13px;">Trade Show Intelligence for Exhibitors</p>
</td></tr>

<tr><td style="padding:32px 32px 20px;">
<p style="margin:0 0 16px;color:#0a0a0a;font-size:15px;line-height:1.7;">Good morning,</p>
<p style="margin:0 0 16px;color:#333333;font-size:15px;line-height:1.7;">
Happy {weekday}! Here&rsquo;s your daily trade show intelligence briefing from ShowFloorTips.
</p>
<p style="margin:0 0 4px;color:#333;font-size:15px;line-height:1.7;">Today&rsquo;s top stories:</p>
</td></tr>

{articles_html}

<tr><td style="padding:0 32px 24px;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:8px;padding:20px;">
<tr><td style="padding:20px 24px;">
<p style="margin:0 0 8px;font-size:15px;font-weight:700;color:#0a0a0a;">Quick Links</p>
<p style="margin:0;font-size:14px;line-height:2;color:#525252;">
&bull; <a href="https://showfloortips.com/this-week.html" style="color:#2563eb;text-decoration:none;">This Week&rsquo;s Trade Shows</a><br>
&bull; <a href="https://showfloortips.com/news.html" style="color:#2563eb;text-decoration:none;">All News &amp; Insights</a><br>
&bull; <a href="https://showfloortips.com/guide.html" style="color:#2563eb;text-decoration:none;">Ultimate Trade Show Guide</a><br>
&bull; <a href="https://showfloortips.com/products.html" style="color:#2563eb;text-decoration:none;">Exhibitor Toolkits</a>
</p>
</td></tr>
</table>
</td></tr>

<tr><td style="padding:0 32px 32px;text-align:center;">
<a href="https://showfloortips.com" style="display:inline-block;padding:12px 32px;background:#6366f1;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;border-radius:8px;">Visit ShowFloorTips</a>
</td></tr>

<tr><td style="background:#f9fafb;padding:24px 32px;text-align:center;border-top:1px solid #e5e5e5;">
<p style="margin:0 0 8px;color:#737373;font-size:12px;">&copy; 2026 ShowFloorTips. All rights reserved.</p>
<p style="margin:0;color:#a3a3a3;font-size:11px;">
<a href="https://showfloortips.com/about.html" style="color:#a3a3a3;">About</a> &bull;
<a href="https://showfloortips.com/contact.html" style="color:#a3a3a3;">Contact</a> &bull;
<a href="https://showfloortips.com/privacy.html" style="color:#a3a3a3;">Privacy</a>
</p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>"""
    return html

def was_sent_today():
    """Check if newsletter was already sent today"""
    if not os.path.exists(SENT_LOG):
        return False
    with open(SENT_LOG, 'r') as f:
        data = json.load(f)
    return data.get('last_sent') == str(date.today())

def mark_sent():
    """Mark today as sent"""
    with open(SENT_LOG, 'w') as f:
        json.dump({'last_sent': str(date.today()), 'timestamp': datetime.now().isoformat()}, f)

def send_email(to_email, subject, html_body):
    """Send via Resend API"""
    payload = json.dumps({
        "from": FROM_EMAIL,
        "to": [to_email],
        "subject": subject,
        "html": html_body
    }).encode('utf-8')

    req = urllib.request.Request(
        "https://api.resend.com/emails",
        data=payload,
        headers={
            "Authorization": f"Bearer {RESEND_KEY}",
            "Content-Type": "application/json",
            "User-Agent": "ShowFloorTips/1.0"
        },
        method="POST"
    )

    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return True
    except Exception as e:
        print(f"  FAILED: {to_email} - {e}")
        return False

def main():
    print(f"\n=== ShowFloorTips Auto Newsletter - {datetime.now().isoformat()} ===")

    if was_sent_today():
        print("Newsletter already sent today. Skipping.")
        return

    articles = get_latest_articles(3)
    if not articles:
        print("ERROR: No articles found in news.js")
        return

    print(f"Found {len(articles)} latest articles:")
    for a in articles:
        print(f"  - {a.get('title', 'Untitled')}")

    emails = get_emails()
    print(f"\nSending to {len(emails)} subscribers...")

    today_str = datetime.now().strftime("%b %d")
    subject = f"ShowFloorTips Daily: {articles[0].get('title', 'Trade Show News')[:60]}"
    html = build_email_html(articles)

    success = 0
    failed = 0
    for email in emails:
        if send_email(email, subject, html):
            success += 1
            print(f"  OK: {email}")
        else:
            failed += 1
        time.sleep(0.9)  # Rate limit

    mark_sent()
    print(f"\nDone! Sent: {success}, Failed: {failed}")

if __name__ == "__main__":
    main()
