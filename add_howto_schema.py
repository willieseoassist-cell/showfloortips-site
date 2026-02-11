#!/usr/bin/env python3
"""Add HowTo JSON-LD schema to networking guide articles."""

import glob
import json
import os
import re

NEWS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "news")
PATTERN = os.path.join(NEWS_DIR, "networking-guide-*.html")

def build_howto_block(show_name):
    """Return a HowTo JSON-LD <script> block customized for the given show."""
    schema = {
        "@context": "https://schema.org",
        "@type": "HowTo",
        "name": f"How to Network at {show_name}",
        "description": (
            f"Step-by-step networking guide for {show_name} "
            "\u2014 from pre-show outreach to post-show follow-up"
        ),
        "step": [
            {
                "@type": "HowToStep",
                "position": 1,
                "name": "Research Attendees Before the Show",
                "text": (
                    "Review the exhibitor list and attendee profiles. "
                    "Identify 20-30 key contacts you want to meet and reach "
                    "out via LinkedIn or email before the event."
                ),
            },
            {
                "@type": "HowToStep",
                "position": 2,
                "name": "Prepare Your Elevator Pitch",
                "text": (
                    "Craft a 30-second pitch that clearly explains who you are, "
                    "what you offer, and why it matters. Practice until it feels natural."
                ),
            },
            {
                "@type": "HowToStep",
                "position": 3,
                "name": "Attend Networking Events and Receptions",
                "text": (
                    "Most trade shows host evening receptions, breakfast meetups, "
                    "and sponsored events. These informal settings are where the "
                    "best connections happen."
                ),
            },
            {
                "@type": "HowToStep",
                "position": 4,
                "name": "Work the Show Floor Strategically",
                "text": (
                    "Visit booths during less busy times (early morning or late "
                    "afternoon). Ask open-ended questions and listen more than you talk."
                ),
            },
            {
                "@type": "HowToStep",
                "position": 5,
                "name": "Follow Up Within 48 Hours",
                "text": (
                    "Send personalized follow-up emails within 48 hours while the "
                    "conversation is fresh. Reference something specific you discussed "
                    "to stand out."
                ),
            },
        ],
    }
    json_str = json.dumps(schema, indent=4)
    # Indent every line by 4 spaces to match existing formatting
    indented = "\n".join("    " + line for line in json_str.splitlines())
    return (
        '\n    <script type="application/ld+json">\n'
        + indented
        + "\n    </script>"
    )


def extract_show_name(title):
    """Extract the show name from a title like 'Networking Guide for CES 2026 - ShowFloorTips'."""
    # Remove the site name suffix
    title = re.sub(r"\s*[-|]\s*ShowFloorTips\s*$", "", title)
    # Remove the 'Networking Guide for ' prefix
    title = re.sub(r"^Networking Guide for\s+", "", title)
    return title.strip()


def process_file(filepath):
    """Add HowTo schema to a single file. Returns True if the file was updated."""
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    # Skip if HowTo schema already present
    if '"HowTo"' in content and "<script" in content:
        return False

    # Extract title
    title_match = re.search(r"<title>(.*?)</title>", content, re.DOTALL)
    if not title_match:
        print(f"  WARNING: No <title> found in {os.path.basename(filepath)}, skipping.")
        return False

    title = title_match.group(1).strip()
    show_name = extract_show_name(title)

    if not show_name:
        print(f"  WARNING: Could not extract show name from '{title}', skipping.")
        return False

    # Find the Article JSON-LD closing </script> tag.
    # We look for a script block containing "@type": "Article" and find its </script>.
    article_pattern = re.compile(
        r'(<script\s+type="application/ld\+json">\s*\{[^}]*?"@type"\s*:\s*"Article".*?</script>)',
        re.DOTALL,
    )
    article_match = article_pattern.search(content)
    if not article_match:
        print(f"  WARNING: No Article JSON-LD found in {os.path.basename(filepath)}, skipping.")
        return False

    insert_pos = article_match.end()
    howto_block = build_howto_block(show_name)

    new_content = content[:insert_pos] + howto_block + content[insert_pos:]

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(new_content)

    return True


def main():
    files = sorted(glob.glob(PATTERN))
    print(f"Found {len(files)} networking-guide-*.html files in {NEWS_DIR}")

    updated = 0
    skipped_existing = 0
    skipped_other = 0

    for filepath in files:
        basename = os.path.basename(filepath)
        result = process_file(filepath)
        if result:
            updated += 1
        elif result is False:
            # Check why it was skipped
            with open(filepath, "r", encoding="utf-8") as f:
                content = f.read()
            if '"HowTo"' in content:
                skipped_existing += 1
            else:
                skipped_other += 1

    print(f"\nDone!")
    print(f"  Files updated:                {updated}")
    print(f"  Skipped (already had HowTo):  {skipped_existing}")
    print(f"  Skipped (other reason):        {skipped_other}")
    print(f"  Total processed:              {len(files)}")


if __name__ == "__main__":
    main()
