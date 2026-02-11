#!/usr/bin/env python3
"""
SEO Batch Update Script for ShowFloorTips news articles.
Processes all HTML files in /news/ to add:
1. Lazy loading on images (skip first image per article)
2. dateModified in JSON-LD schema
3. Social sharing buttons before Related Articles / CTA section
4. Preconnect hints for images.unsplash.com
"""

import os
import re
import time
from urllib.parse import quote

NEWS_DIR = "/Volumes/Willie Extr/tradeshow-website/news"
DATE_MODIFIED_VALUE = "2026-02-11"

# Counters
total_files = 0
files_with_errors = 0
lazy_loading_added = 0
date_modified_added = 0
social_sharing_added = 0
preconnect_added = 0


def get_social_sharing_html(article_url, article_title):
    """Generate social sharing HTML block with the given URL and title."""
    encoded_title = quote(article_title, safe="")
    encoded_url = quote(article_url, safe="")
    # For LinkedIn and Facebook, the URL param value should be encoded
    # For mailto, we use the raw title in subject and URL in body
    return f'''<div style="margin:2rem 0;padding:1.5rem;background:#f8f8f8;border-radius:12px;text-align:center">
<p style="font-weight:600;margin-bottom:0.75rem;color:#333">Share this article</p>
<div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
<a href="https://twitter.com/intent/tweet?url={encoded_url}&text={encoded_title}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:6px;padding:8px 16px;background:#000;color:#fff;border-radius:8px;text-decoration:none;font-size:0.875rem;font-weight:500">\U0001d54f Post</a>
<a href="https://www.linkedin.com/sharing/share-offsite/?url={encoded_url}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:6px;padding:8px 16px;background:#0077B5;color:#fff;border-radius:8px;text-decoration:none;font-size:0.875rem;font-weight:500">LinkedIn</a>
<a href="https://www.facebook.com/sharer/sharer.php?u={encoded_url}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:6px;padding:8px 16px;background:#1877F2;color:#fff;border-radius:8px;text-decoration:none;font-size:0.875rem;font-weight:500">Facebook</a>
<a href="mailto:?subject={encoded_title}&body=Check%20out%20this%20article%3A%20{encoded_url}" style="display:inline-flex;align-items:center;gap:6px;padding:8px 16px;background:#555;color:#fff;border-radius:8px;text-decoration:none;font-size:0.875rem;font-weight:500">Email</a>
</div>
</div>'''


def add_lazy_loading(content):
    """Add loading='lazy' to all <img> tags except the first one in the article."""
    img_pattern = re.compile(r'<img\b', re.IGNORECASE)
    matches = list(img_pattern.finditer(content))

    if len(matches) <= 1:
        # Only 0 or 1 image; the first is above the fold, skip it
        return content, 0

    count = 0
    # Process from last to first to preserve indices, skip first match (index 0)
    for match in reversed(matches[1:]):
        start = match.start()
        # Find the end of this <img ...> tag
        tag_end = content.find('>', start)
        if tag_end == -1:
            continue
        img_tag = content[start:tag_end + 1]

        # Skip if already has loading attribute
        if 'loading=' in img_tag.lower():
            continue

        # Insert loading="lazy" after '<img'
        new_tag = img_tag[:4] + ' loading="lazy"' + img_tag[4:]
        content = content[:start] + new_tag + content[tag_end + 1:]
        count += 1

    return content, count


def add_date_modified(content):
    """Add dateModified to JSON-LD Article schema if not present."""
    if '"dateModified"' in content:
        return content, False

    # Find datePublished in JSON-LD and add dateModified after it
    pattern = re.compile(
        r'("datePublished"\s*:\s*"[^"]*")',
        re.IGNORECASE
    )
    match = pattern.search(content)
    if match:
        replacement = match.group(1) + f',\n        "dateModified": "{DATE_MODIFIED_VALUE}T00:00:00Z"'
        content = content[:match.start()] + replacement + content[match.end():]
        return content, True

    return content, False


def add_social_sharing(content, filename):
    """Add social sharing section before Related Articles or CTA section."""
    if "Share this article" in content:
        return content, False

    # Extract canonical URL
    canonical_match = re.search(r'<link\s+rel="canonical"\s+href="([^"]*)"', content)
    if canonical_match:
        article_url = canonical_match.group(1)
    else:
        # Construct from filename
        article_url = f"https://showfloortips.com/news/{filename}"

    # Extract title
    title_match = re.search(r'<title>([^<]*)</title>', content)
    if title_match:
        article_title = title_match.group(1)
        # Remove " - ShowFloorTips" suffix if present
        article_title = re.sub(r'\s*-\s*ShowFloorTips$', '', article_title)
    else:
        article_title = filename.replace('.html', '').replace('-', ' ').title()

    sharing_html = get_social_sharing_html(article_url, article_title)

    # Try to insert before the Related Articles div (inline-styled)
    # Pattern: <div style="margin:48px 0 0;padding:32px 0;border-top:2px solid #e5e5e5">
    insertion_targets = [
        '<div style="margin:48px 0 0;padding:32px 0;border-top:2px solid #e5e5e5">',
        '<div class="related-articles">',
        '<div class="cta-box">',
        '<div class="article-cta">',
    ]

    for target in insertion_targets:
        idx = content.find(target)
        if idx != -1:
            content = content[:idx] + sharing_html + "\n\n" + content[idx:]
            return content, True

    return content, False


def add_preconnect(content):
    """Add preconnect hint for images.unsplash.com in <head> if not present."""
    if 'preconnect' in content and 'images.unsplash.com' in content:
        return content, False

    # Insert after the last <meta> or before the first <link> in <head>
    # Best spot: right before the first <link> tag in <head>
    head_end = content.find('</head>')
    if head_end == -1:
        return content, False

    # Find the canonical link tag and insert before it
    canonical_idx = content.find('<link rel="canonical"')
    if canonical_idx != -1 and canonical_idx < head_end:
        insert_point = canonical_idx
    else:
        # Find the first <link in <head>
        head_start = content.find('<head')
        if head_start == -1:
            return content, False
        first_link = content.find('<link', head_start)
        if first_link != -1 and first_link < head_end:
            insert_point = first_link
        else:
            # Insert before </head>
            insert_point = head_end

    preconnect_tag = '    <link rel="preconnect" href="https://images.unsplash.com">\n'
    content = content[:insert_point] + preconnect_tag + content[insert_point:]
    return content, True


def process_file(filepath, filename):
    """Process a single HTML file with all SEO improvements."""
    global lazy_loading_added, date_modified_added, social_sharing_added, preconnect_added

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content
    modified = False

    # 1. Lazy loading
    content, lazy_count = add_lazy_loading(content)
    if lazy_count > 0:
        lazy_loading_added += 1
        modified = True

    # 2. dateModified
    content, dm_added = add_date_modified(content)
    if dm_added:
        date_modified_added += 1
        modified = True

    # 3. Social sharing
    content, ss_added = add_social_sharing(content, filename)
    if ss_added:
        social_sharing_added += 1
        modified = True

    # 4. Preconnect
    content, pc_added = add_preconnect(content)
    if pc_added:
        preconnect_added += 1
        modified = True

    # Write back only if changes were made
    if modified:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)

    return modified


def main():
    global total_files, files_with_errors

    start_time = time.time()

    print(f"SEO Batch Update Script")
    print(f"Processing directory: {NEWS_DIR}")
    print(f"=" * 60)

    # Get all HTML files
    all_files = sorted([f for f in os.listdir(NEWS_DIR) if f.endswith('.html')])
    total_count = len(all_files)
    print(f"Found {total_count} HTML files to process\n")

    files_modified = 0

    for i, filename in enumerate(all_files, 1):
        filepath = os.path.join(NEWS_DIR, filename)

        try:
            was_modified = process_file(filepath, filename)
            if was_modified:
                files_modified += 1
            total_files += 1
        except Exception as e:
            files_with_errors += 1
            print(f"  ERROR processing {filename}: {e}")
            total_files += 1

        # Progress every 1000 files
        if i % 1000 == 0:
            elapsed = time.time() - start_time
            rate = i / elapsed if elapsed > 0 else 0
            print(f"  Progress: {i}/{total_count} files processed ({rate:.0f} files/sec)")

    elapsed = time.time() - start_time

    print(f"\n{'=' * 60}")
    print(f"SEO BATCH UPDATE COMPLETE")
    print(f"{'=' * 60}")
    print(f"Total files scanned:        {total_files}")
    print(f"Files modified:             {files_modified}")
    print(f"Files with errors:          {files_with_errors}")
    print(f"")
    print(f"Updates applied:")
    print(f"  Lazy loading added:       {lazy_loading_added} files")
    print(f"  dateModified added:       {date_modified_added} files")
    print(f"  Social sharing added:     {social_sharing_added} files")
    print(f"  Preconnect hints added:   {preconnect_added} files")
    print(f"")
    print(f"Time elapsed:               {elapsed:.1f} seconds")
    print(f"Processing rate:            {total_files / elapsed:.0f} files/sec" if elapsed > 0 else "")


if __name__ == "__main__":
    main()
