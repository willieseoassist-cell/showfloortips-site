#!/usr/bin/env python3
"""
DIY Email Verifier - verifies emails without sending anything.

How it works:
1. DNS MX lookup - checks if the domain has a mail server
2. SMTP handshake - connects to the mail server and asks "does this mailbox exist?"
3. Catch-all detection - tests a random fake address to see if server accepts everything

Usage:
  python3 verify_emails.py                    # verifies million_emails_simple.csv
  python3 verify_emails.py --input my.csv     # custom input file
  python3 verify_emails.py --workers 100      # more parallel workers (faster)
  python3 verify_emails.py --limit 10000      # only verify first N emails
"""

import csv
import smtplib
import socket
import uuid
import argparse
import time
import signal
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from collections import Counter

try:
    import dns.resolver
except ImportError:
    print("ERROR: dnspython not installed. Run: pip3 install dnspython")
    sys.exit(1)

DRIVE = Path("/Volumes/Willie Extr/tradeshow-website")

# Cache for MX lookups and catch-all results (shared across threads)
mx_cache = {}
catchall_cache = {}
domain_dead_cache = set()

# Stats
stats = Counter()
stop_flag = False


def signal_handler(sig, frame):
    global stop_flag
    print("\n\nGracefully stopping... (saving progress)")
    stop_flag = True


signal.signal(signal.SIGINT, signal_handler)


def get_mx_host(domain):
    """Get the primary MX server for a domain. Returns None if no MX found."""
    if domain in mx_cache:
        return mx_cache[domain]
    if domain in domain_dead_cache:
        return None

    try:
        records = dns.resolver.resolve(domain, "MX")
        # Sort by priority (lowest = highest priority)
        mx_hosts = sorted(records, key=lambda r: r.preference)
        mx_host = str(mx_hosts[0].exchange).rstrip(".")
        mx_cache[domain] = mx_host
        return mx_host
    except Exception:
        domain_dead_cache.add(domain)
        mx_cache[domain] = None
        return None


def smtp_check(email, mx_host, timeout=10):
    """
    Connect to MX server and verify the email exists via RCPT TO.
    Returns: 'valid', 'invalid', 'catch_all', 'unknown'
    """
    domain = email.split("@")[1]

    try:
        smtp = smtplib.SMTP(timeout=timeout)
        smtp.connect(mx_host, 25)
        smtp.ehlo_or_helo_if_needed()

        # MAIL FROM with a plausible sender
        smtp.mail("verify@verifier.com")

        # RCPT TO - this is where the magic happens
        code, message = smtp.rcpt(email)
        smtp.quit()

        if code == 250:
            # Server accepted - but could be catch-all
            # Check catch-all cache first
            if domain in catchall_cache:
                if catchall_cache[domain]:
                    return "catch_all"
                return "valid"
            return "valid"
        elif code == 550 or code == 551 or code == 552 or code == 553:
            return "invalid"
        elif code == 450 or code == 451 or code == 452:
            return "unknown"  # greylisted or temp error
        else:
            return "unknown"

    except smtplib.SMTPServerDisconnected:
        return "unknown"
    except smtplib.SMTPConnectError:
        return "unknown"
    except socket.timeout:
        return "unknown"
    except socket.gaierror:
        return "unknown"
    except OSError:
        return "unknown"
    except Exception:
        return "unknown"


def check_catch_all(domain, mx_host, timeout=10):
    """Test if a domain accepts all emails (catch-all)."""
    if domain in catchall_cache:
        return catchall_cache[domain]

    fake_email = f"{uuid.uuid4().hex[:16]}@{domain}"
    try:
        smtp = smtplib.SMTP(timeout=timeout)
        smtp.connect(mx_host, 25)
        smtp.ehlo_or_helo_if_needed()
        smtp.mail("verify@verifier.com")
        code, _ = smtp.rcpt(fake_email)
        smtp.quit()

        is_catchall = code == 250
        catchall_cache[domain] = is_catchall
        return is_catchall
    except Exception:
        catchall_cache[domain] = False
        return False


def verify_email(email):
    """Full verification pipeline for a single email."""
    global stats

    if stop_flag:
        return email, "skipped", ""

    domain = email.split("@")[1]

    # Step 1: MX lookup
    mx_host = get_mx_host(domain)
    if mx_host is None:
        stats["no_mx"] += 1
        return email, "invalid", "no_mx_record"

    stats["has_mx"] += 1

    # Step 2: SMTP check
    result = smtp_check(email, mx_host)

    if result == "valid":
        # Step 3: Catch-all detection
        is_catchall = check_catch_all(domain, mx_host)
        if is_catchall:
            stats["catch_all"] += 1
            return email, "catch_all", mx_host
        else:
            stats["valid"] += 1
            return email, "valid", mx_host
    elif result == "invalid":
        stats["invalid"] += 1
        return email, "invalid", mx_host
    else:
        stats["unknown"] += 1
        return email, "unknown", mx_host


def main():
    parser = argparse.ArgumentParser(description="DIY Email Verifier")
    parser.add_argument("--input", default=str(DRIVE / "million_emails_simple.csv"),
                        help="Input CSV file with 'email' column")
    parser.add_argument("--output", default=str(DRIVE / "verified_emails.csv"),
                        help="Output CSV file")
    parser.add_argument("--workers", type=int, default=50,
                        help="Number of parallel workers (default: 50)")
    parser.add_argument("--limit", type=int, default=0,
                        help="Only verify first N emails (0 = all)")
    parser.add_argument("--timeout", type=int, default=10,
                        help="SMTP timeout in seconds (default: 10)")
    args = parser.parse_args()

    print("=" * 60)
    print("  DIY EMAIL VERIFIER")
    print("=" * 60)
    print(f"  Input:   {args.input}")
    print(f"  Output:  {args.output}")
    print(f"  Workers: {args.workers}")
    print(f"  Limit:   {'all' if args.limit == 0 else args.limit}")
    print("=" * 60)

    # Load emails
    print("\nLoading emails...")
    emails = []
    with open(args.input, "r") as f:
        reader = csv.DictReader(f)
        for row in reader:
            emails.append(row["email"])
            if args.limit > 0 and len(emails) >= args.limit:
                break
    print(f"  Loaded {len(emails):,} emails to verify")

    # Open output file (line-buffered for external drive)
    outfile = open(args.output, "w", newline="", buffering=1)
    writer = csv.writer(outfile)
    writer.writerow(["email", "status", "mx_host"])
    outfile.flush()

    # Verify in parallel
    print(f"\nVerifying with {args.workers} workers...")
    print("  Press Ctrl+C to stop gracefully (saves progress)\n")

    start_time = time.time()
    completed = 0

    with ThreadPoolExecutor(max_workers=args.workers) as executor:
        futures = {executor.submit(verify_email, email): email for email in emails}

        for future in as_completed(futures):
            if stop_flag:
                break

            email, status, mx_host = future.result()
            writer.writerow([email, status, mx_host])
            completed += 1

            if completed % 100 == 0:
                outfile.flush()
            if completed % 1000 == 0:
                elapsed = time.time() - start_time
                rate = completed / elapsed if elapsed > 0 else 0
                eta_seconds = (len(emails) - completed) / rate if rate > 0 else 0
                eta_hours = eta_seconds / 3600

                print(f"  [{completed:>10,} / {len(emails):,}] "
                      f"{rate:.0f}/sec | "
                      f"valid:{stats['valid']:,} "
                      f"invalid:{stats['invalid']:,} "
                      f"catch_all:{stats['catch_all']:,} "
                      f"no_mx:{stats['no_mx']:,} "
                      f"unknown:{stats['unknown']:,} | "
                      f"ETA: {eta_hours:.1f}h")

    outfile.close()
    elapsed = time.time() - start_time

    # Summary
    print(f"\n{'=' * 60}")
    print(f"  VERIFICATION COMPLETE")
    print(f"{'=' * 60}")
    print(f"  Total processed: {completed:,}")
    print(f"  Time: {elapsed/3600:.1f} hours ({elapsed:.0f} seconds)")
    print(f"  Rate: {completed/elapsed:.0f} emails/sec")
    print(f"\n  Results:")
    print(f"    Valid:     {stats['valid']:>10,}")
    print(f"    Invalid:   {stats['invalid']:>10,}")
    print(f"    Catch-all: {stats['catch_all']:>10,}")
    print(f"    No MX:     {stats['no_mx']:>10,}")
    print(f"    Unknown:   {stats['unknown']:>10,}")
    print(f"\n  Output: {args.output}")

    # Also write valid-only file
    valid_file = str(args.output).replace(".csv", "_valid_only.csv")
    print(f"\n  Extracting valid emails to {valid_file}...")
    valid_count = 0
    with open(args.output, "r") as f_in, open(valid_file, "w", newline="") as f_out:
        reader = csv.DictReader(f_in)
        writer = csv.writer(f_out)
        writer.writerow(["email", "mx_host"])
        for row in reader:
            if row["status"] == "valid":
                writer.writerow([row["email"], row["mx_host"]])
                valid_count += 1
    print(f"  {valid_count:,} valid emails saved")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    main()
