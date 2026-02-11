#!/usr/bin/env python3
"""
Add BreadcrumbList JSON-LD schema to all article HTML files in the news/ directory.

Scans all .html files, skips those that already contain BreadcrumbList,
extracts the page title, determines the category from the filename,
and injects a BreadcrumbList JSON-LD script tag after the existing
Article JSON-LD </script> tag.
"""

import os
import re
import json
import html

NEWS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "news")
BASE_URL = "https://showfloortips.com"

# Category mapping based on filename patterns
# Order matters: more specific patterns first
CATEGORY_PATTERNS = [
    ("networking-guide", "Networking Guides"),
    ("first-time", "First-Timer Guides"),
    ("cost-exhibit", "Cost Guides"),
    ("cost", "Cost Guides"),
    ("comparison", "Comparisons"),
    ("faq", "FAQ Guides"),
    ("spotlight", "Spotlights"),
    ("trend", "Trend Reports"),
    ("guide", "Guides"),
]


def get_category_name(filename):
    """Determine the category name based on filename patterns."""
    fname_lower = filename.lower()
    for pattern, category in CATEGORY_PATTERNS:
        if pattern in fname_lower:
            return category
    return "News"


def extract_title(content):
    """Extract the page title from the <title> tag and strip site name suffix."""
    match = re.search(r"<title>(.*?)</title>", content, re.DOTALL | re.IGNORECASE)
    if not match:
        return None
    raw_title = match.group(1).strip()
    # Decode HTML entities
    decoded_title = html.unescape(raw_title)
    # Strip common suffixes
    for suffix in [" | ShowFloorTips", " - ShowFloorTips"]:
        if decoded_title.endswith(suffix):
            decoded_title = decoded_title[: -len(suffix)]
    return decoded_title.strip()


def build_breadcrumb_json(title, category_name):
    """Build the BreadcrumbList JSON-LD object."""
    breadcrumb = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": BASE_URL,
            },
            {
                "@type": "ListItem",
                "position": 2,
                "name": category_name,
                "item": f"{BASE_URL}/news.html",
            },
            {
                "@type": "ListItem",
                "position": 3,
                "name": title,
            },
        ],
    }
    return breadcrumb


def inject_breadcrumb(content, breadcrumb_json):
    """
    Inject the BreadcrumbList JSON-LD right after the closing </script>
    of the existing Article JSON-LD block.

    Strategy: find the <script type="application/ld+json"> block, then find
    its closing </script>, and insert the new block right after it.
    """
    # Find the first application/ld+json script block and its closing </script>
    pattern = r'(<script\s+type="application/ld\+json">.*?</script>)'
    match = re.search(pattern, content, re.DOTALL | re.IGNORECASE)
    if not match:
        return None

    insert_pos = match.end()

    # Build the new script tag with proper indentation (matching the existing style)
    json_str = json.dumps(breadcrumb_json, indent=8, ensure_ascii=False)
    new_block = f'\n\n    <script type="application/ld+json">\n    {json_str}\n    </script>'

    new_content = content[:insert_pos] + new_block + content[insert_pos:]
    return new_content


def main():
    modified = 0
    skipped = 0
    errors = 0
    error_files = []

    # Get all .html files
    all_files = sorted(f for f in os.listdir(NEWS_DIR) if f.endswith(".html"))
    total = len(all_files)
    print(f"Found {total} HTML files in {NEWS_DIR}")

    for i, filename in enumerate(all_files, 1):
        filepath = os.path.join(NEWS_DIR, filename)

        if i % 2000 == 0 or i == total:
            print(f"  Progress: {i}/{total} files processed...")

        try:
            with open(filepath, "r", encoding="utf-8") as f:
                content = f.read()

            # Skip if already has BreadcrumbList
            if "BreadcrumbList" in content:
                skipped += 1
                continue

            # Extract title
            title = extract_title(content)
            if not title:
                print(f"  WARNING: No <title> found in {filename}, skipping.")
                errors += 1
                error_files.append((filename, "no title tag"))
                continue

            # Determine category
            category_name = get_category_name(filename)

            # Build breadcrumb JSON
            breadcrumb = build_breadcrumb_json(title, category_name)

            # Inject into content
            new_content = inject_breadcrumb(content, breadcrumb)
            if new_content is None:
                print(f"  WARNING: No ld+json script block found in {filename}, skipping.")
                errors += 1
                error_files.append((filename, "no ld+json block"))
                continue

            # Write back
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(new_content)

            modified += 1

        except Exception as e:
            print(f"  ERROR processing {filename}: {e}")
            errors += 1
            error_files.append((filename, str(e)))

    print()
    print("=" * 60)
    print(f"RESULTS:")
    print(f"  Total files scanned:  {total}")
    print(f"  Modified (injected):  {modified}")
    print(f"  Skipped (already has BreadcrumbList): {skipped}")
    print(f"  Errors:               {errors}")
    print("=" * 60)

    if error_files:
        print()
        print("Files with errors:")
        for fn, reason in error_files:
            print(f"  {fn}: {reason}")

    # Show a sample of what was injected
    if modified > 0:
        sample_file = all_files[0]
        sample_path = os.path.join(NEWS_DIR, sample_file)
        with open(sample_path, "r", encoding="utf-8") as f:
            sample_content = f.read()
        # Find and show the breadcrumb block
        bc_match = re.search(
            r'(<script type="application/ld\+json">\s*\{[^}]*"BreadcrumbList".*?</script>)',
            sample_content,
            re.DOTALL,
        )
        if bc_match:
            print()
            print(f"Sample injection from {sample_file}:")
            print("-" * 60)
            print(bc_match.group(1))
            print("-" * 60)


if __name__ == "__main__":
    main()
