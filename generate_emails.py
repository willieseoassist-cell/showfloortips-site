#!/usr/bin/env python3
"""
Generate common pattern emails for all domains.
Produces multiple email variants per domain for outreach.
"""

import csv
from pathlib import Path

HOME = Path.home()

# Common email prefixes used by businesses
PATTERNS = [
    "info",
    "contact",
    "hello",
    "sales",
    "support",
    "admin",
    "team",
    "marketing",
    "press",
    "partnerships",
]

# Load domains from the million_domains.csv
print("Loading domains...")
domains = []
with open(HOME / "million_domains.csv", "r") as f:
    reader = csv.DictReader(f)
    for row in reader:
        domains.append(row)
print(f"  Loaded {len(domains):,} domains")

# Generate emails - one row per email (long format for email tools)
output_long = HOME / "million_emails_long.csv"
print(f"\nGenerating emails (long format) to {output_long}...")
email_count = 0
with open(output_long, "w", newline="") as f:
    writer = csv.writer(f)
    writer.writerow(["email", "domain", "prefix", "rank", "source", "company"])
    for row in domains:
        domain = row["domain"]
        for prefix in PATTERNS:
            email = f"{prefix}@{domain}"
            writer.writerow([
                email,
                domain,
                prefix,
                row["rank"],
                row["source"],
                row.get("company", ""),
            ])
            email_count += 1

print(f"  Generated {email_count:,} emails (long format)")

# Generate emails - one row per domain with all emails as columns (wide format)
output_wide = HOME / "million_emails_wide.csv"
print(f"\nGenerating emails (wide format) to {output_wide}...")
with open(output_wide, "w", newline="") as f:
    writer = csv.writer(f)
    header = ["domain", "rank", "source", "company"] + [f"email_{p}" for p in PATTERNS]
    writer.writerow(header)
    for row in domains:
        domain = row["domain"]
        emails = [f"{p}@{domain}" for p in PATTERNS]
        writer.writerow([
            domain,
            row["rank"],
            row["source"],
            row.get("company", ""),
        ] + emails)

# Generate a simple single-email-per-domain list (info@ only - highest hit rate)
output_simple = HOME / "million_emails_simple.csv"
print(f"\nGenerating simple list (info@ only) to {output_simple}...")
with open(output_simple, "w", newline="") as f:
    writer = csv.writer(f)
    writer.writerow(["email", "domain", "rank"])
    for row in domains:
        writer.writerow([
            f"info@{row['domain']}",
            row["domain"],
            row["rank"],
        ])

# Stats
print(f"\n--- SUMMARY ---")
print(f"Total domains: {len(domains):,}")
print(f"Email patterns per domain: {len(PATTERNS)}")
print(f"Total emails generated: {email_count:,}")
print(f"\nOutput files:")
print(f"  {output_long}")
print(f"    -> {email_count:,} rows, one email per row (best for Instantly/Smartlead)")
print(f"  {output_wide}")
print(f"    -> {len(domains):,} rows, all emails as columns (best for spreadsheets)")
print(f"  {output_simple}")
print(f"    -> {len(domains):,} rows, info@ only (highest catch-all hit rate)")
print(f"\nPatterns used: {', '.join(p + '@' for p in PATTERNS)}")
print(f"\nNEXT STEP: Verify emails with NeverBounce, ZeroBounce, or MillionVerifier")
print(f"  before sending to avoid bounces and protect sender reputation.")
