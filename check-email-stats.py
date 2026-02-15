#!/usr/bin/env python3
"""
ShowFloorTips Email Stats Checker
Reads sent logs and shows delivery stats, bounce rates, and suppression list.

Usage:
    python3 check-email-stats.py              # show stats for all email systems
    python3 check-email-stats.py --bounces    # show only bounced emails
"""

import json, os, sys
from datetime import datetime
from collections import Counter

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

MASS_SENT = os.path.join(BASE_DIR, "mass-emails-sent.jsonl")
CLAIM_SENT = os.path.join(BASE_DIR, "claim-emails-sent.json")
PIPELINE_SENT = os.path.join(BASE_DIR, "pipeline-sent.jsonl")
SUPPRESS_FILE = os.path.join(BASE_DIR, "suppressed-emails.txt")


def load_jsonl(filepath):
    records = []
    if not os.path.exists(filepath):
        return records
    with open(filepath, "r") as f:
        for line in f:
            line = line.strip()
            if line:
                try:
                    records.append(json.loads(line))
                except json.JSONDecodeError:
                    pass
    return records


def load_json(filepath):
    if not os.path.exists(filepath):
        return {}
    with open(filepath, "r") as f:
        return json.load(f)


def load_suppressed():
    if not os.path.exists(SUPPRESS_FILE):
        return set()
    with open(SUPPRESS_FILE, "r") as f:
        return set(line.strip().lower() for line in f if line.strip())


def save_suppressed(emails):
    with open(SUPPRESS_FILE, "w") as f:
        for e in sorted(emails):
            f.write(e + "\n")


def print_stats(name, records, email_key="email", status_key="status"):
    if not records:
        print(f"\n{'='*50}")
        print(f"  {name}: No data")
        return

    statuses = Counter(r.get(status_key, "unknown") for r in records)
    total = len(records)
    sent = statuses.get("sent", 0)
    failed = statuses.get("failed", 0)
    skipped = statuses.get("skipped", 0)

    print(f"\n{'='*50}")
    print(f"  {name}")
    print(f"{'='*50}")
    print(f"  Total records: {total:,}")
    print(f"  Sent:          {sent:,} ({sent/total*100:.1f}%)" if total else "")
    print(f"  Failed:        {failed:,} ({failed/total*100:.1f}%)" if total else "")
    if skipped:
        print(f"  Skipped:       {skipped:,}")
    for s, c in statuses.items():
        if s not in ("sent", "failed", "skipped"):
            print(f"  {s}:  {c:,}")

    # Show error breakdown for failures
    errors = Counter()
    bounced_emails = []
    for r in records:
        if r.get(status_key) == "failed":
            err = r.get("error", "unknown")
            if "not verified" in err.lower():
                errors["sandbox (not verified)"] += 1
            elif "bounce" in err.lower() or "550" in str(err):
                errors["bounced"] += 1
                bounced_emails.append(r.get(email_key, ""))
            elif "rejected" in err.lower():
                errors["rejected"] += 1
            elif "throttl" in err.lower() or "454" in str(err):
                errors["throttled"] += 1
            else:
                errors[err[:40]] += 1

    if errors:
        print(f"\n  Error breakdown:")
        for err, count in errors.most_common(10):
            print(f"    {err}: {count:,}")

    return bounced_emails


def main():
    show_bounces = "--bounces" in sys.argv

    print("\n" + "=" * 50)
    print("  SHOWFLOORTIPS EMAIL STATS")
    print(f"  {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 50)

    all_bounced = []

    # Mass emails
    mass = load_jsonl(MASS_SENT)
    bounced = print_stats("Mass Emails (SES)", mass)
    if bounced:
        all_bounced.extend(bounced)

    # Claim emails
    claim_data = load_json(CLAIM_SENT)
    if isinstance(claim_data, dict):
        claim_records = [{"slug": k, **v} for k, v in claim_data.items()]
    else:
        claim_records = []
    print_stats("Claim Emails", claim_records)

    # Pipeline/sponsor emails
    pipeline = load_jsonl(PIPELINE_SENT)
    print_stats("Sponsor Pipeline", pipeline)

    # Suppression list
    suppressed = load_suppressed()
    print(f"\n{'='*50}")
    print(f"  Suppressed emails: {len(suppressed)}")

    if show_bounces and all_bounced:
        print(f"\n  Bounced emails:")
        for e in sorted(set(all_bounced)):
            print(f"    {e}")

    # Auto-add bounces to suppression list
    if all_bounced:
        new_suppressed = suppressed | set(e.lower() for e in all_bounced if e)
        if len(new_suppressed) > len(suppressed):
            save_suppressed(new_suppressed)
            print(f"\n  Added {len(new_suppressed) - len(suppressed)} new bounced emails to suppression list")

    print()


if __name__ == "__main__":
    main()
