#!/usr/bin/env python3
"""
Process Majestic Million + curated food/ag domains into a clean
1M domain list ready for email outreach.
"""

import csv
import re
from pathlib import Path

HOME = Path.home()

# 1. Load Majestic Million domains
print("Loading Majestic Million...")
majestic_domains = {}
with open(HOME / "majestic_million.csv", "r") as f:
    reader = csv.DictReader(f)
    for row in reader:
        domain = row["Domain"].strip().lower()
        majestic_domains[domain] = {
            "rank": int(row["GlobalRank"]),
            "tld": row["TLD"],
            "ref_subnets": int(row["RefSubNets"]),
            "ref_ips": int(row["RefIPs"]),
            "source": "majestic",
        }
print(f"  Loaded {len(majestic_domains):,} domains from Majestic Million")

# 2. Load curated food/ag domains from pipeline
print("\nLoading curated food/ag domains...")
curated_file = HOME / "food_ag_hospitality_domains.txt"
curated_domains = {}
if curated_file.exists():
    with open(curated_file, "r") as f:
        for line in f:
            line = line.strip()
            if ":" in line and not line.startswith("=") and not line.startswith("SECTION") \
               and not line.startswith("FOOD") and not line.startswith("Generated") \
               and not line.startswith("TOTAL") and not line.startswith("(Some"):
                parts = line.rsplit(":", 1)
                if len(parts) == 2:
                    company_name = parts[0].strip()
                    domain = parts[1].strip().lower()
                    # Skip corrupted domains
                    if "frfr" in domain or "quranta" in domain or not re.match(r'^[a-z0-9][a-z0-9.-]+\.[a-z]{2,}$', domain):
                        continue
                    curated_domains[domain] = {
                        "company": company_name,
                        "source": "curated_food_ag",
                    }
    print(f"  Loaded {len(curated_domains):,} clean curated domains")
else:
    print("  No curated file found, skipping")

# 3. Merge - curated domains that aren't already in Majestic
new_from_curated = set(curated_domains.keys()) - set(majestic_domains.keys())
overlap = set(curated_domains.keys()) & set(majestic_domains.keys())
print(f"\n  Curated domains already in Majestic: {len(overlap):,}")
print(f"  New domains from curated list: {len(new_from_curated):,}")

# 4. Write the final combined output
output_file = HOME / "million_domains.csv"
print(f"\nWriting combined output to {output_file}...")

with open(output_file, "w", newline="") as f:
    writer = csv.writer(f)
    writer.writerow(["rank", "domain", "tld", "ref_subnets", "ref_ips", "source", "company"])

    # Write Majestic domains first (ranked)
    count = 0
    for domain, info in sorted(majestic_domains.items(), key=lambda x: x[1]["rank"]):
        company = curated_domains.get(domain, {}).get("company", "")
        source = "both" if domain in curated_domains else "majestic"
        writer.writerow([
            info["rank"],
            domain,
            info["tld"],
            info["ref_subnets"],
            info["ref_ips"],
            source,
            company,
        ])
        count += 1

    # Append curated-only domains
    for domain in sorted(new_from_curated):
        count += 1
        info = curated_domains[domain]
        tld = domain.split(".")[-1]
        writer.writerow([
            count,
            domain,
            tld,
            0,
            0,
            "curated_food_ag",
            info["company"],
        ])

print(f"  Total domains written: {count:,}")

# 5. Also write a plain domain-only list
plain_file = HOME / "million_domains_plain.txt"
print(f"\nWriting plain domain list to {plain_file}...")
with open(plain_file, "w") as f:
    for domain in sorted(majestic_domains.keys(), key=lambda d: majestic_domains[d]["rank"]):
        f.write(domain + "\n")
    for domain in sorted(new_from_curated):
        f.write(domain + "\n")

# 6. Quick stats
print("\n--- SUMMARY ---")
print(f"Total unique domains: {count:,}")
print(f"  From Majestic Million: {len(majestic_domains):,}")
print(f"  Additional from curated list: {len(new_from_curated):,}")
print(f"\nOutput files:")
print(f"  {output_file} (CSV with metadata)")
print(f"  {plain_file} (one domain per line)")

# TLD distribution
tld_counts = {}
for info in majestic_domains.values():
    tld = info["tld"]
    tld_counts[tld] = tld_counts.get(tld, 0) + 1
print(f"\nTop 10 TLDs:")
for tld, cnt in sorted(tld_counts.items(), key=lambda x: -x[1])[:10]:
    print(f"  .{tld}: {cnt:,}")
