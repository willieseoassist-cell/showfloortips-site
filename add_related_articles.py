#!/usr/bin/env python3
"""
Add "Related Articles" sections to all article HTML files in /news/.
Skips files that already have a Related Articles section.
Injects the section before the CTA box div.
"""

import os
import re
import json
import random

NEWS_DIR = "/Volumes/Willie Extr/tradeshow-website/news"
NEWS_JS = "/Volumes/Willie Extr/tradeshow-website/news.js"

def parse_news_js(filepath):
    """Parse news.js to extract article metadata."""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Remove the "var NEWS_DATA = " prefix and trailing semicolons
    content = content.strip()
    if content.startswith('var NEWS_DATA ='):
        content = content[len('var NEWS_DATA ='):].strip()
    if content.endswith(';'):
        content = content[:-1].strip()

    try:
        articles = json.loads(content)
    except json.JSONDecodeError as e:
        print(f"JSON parse error: {e}")
        return []

    return articles

def slug_from_filename(filename):
    """Extract slug from HTML filename."""
    return filename.replace('.html', '')

def truncate_summary(summary, max_len=100):
    """Truncate summary to ~100 chars with ellipsis."""
    if not summary or len(summary) <= max_len:
        return summary or ""
    # Find last space before max_len
    truncated = summary[:max_len]
    last_space = truncated.rfind(' ')
    if last_space > 50:
        truncated = truncated[:last_space]
    return truncated.rstrip('.,;:!? ') + "..."

def normalize_category(cat):
    """Normalize category for matching purposes."""
    if not cat:
        return ""
    return cat.lower().strip()

def get_broad_category(cat):
    """Map specific categories to broader groups for better matching."""
    cat_lower = normalize_category(cat)

    # Networking guides
    if 'networking' in cat_lower or cat_lower == 'marketing':
        return 'networking'
    # Comparisons
    if 'comparison' in cat_lower or 'business' in cat_lower:
        return 'comparison'
    # Industry insights / news
    if 'insight' in cat_lower or 'industry' in cat_lower or 'news' in cat_lower or 'analysis' in cat_lower:
        return 'insight'
    # Show updates / FAQ
    if 'show' in cat_lower or 'faq' in cat_lower or 'update' in cat_lower:
        return 'show_update'
    # Data & Trends / cost
    if 'data' in cat_lower or 'trend' in cat_lower or 'cost' in cat_lower:
        return 'data_trends'
    # Trending
    if 'trending' in cat_lower:
        return 'trending'

    return cat_lower

def find_related_articles(current_slug, current_category, articles_by_slug, all_articles, count=4):
    """Find 3-4 related articles, prioritizing same category."""
    current_broad = get_broad_category(current_category)

    # Deduplicate articles by slug (news.js has duplicates)
    seen_slugs = set()
    unique_articles = []
    for a in all_articles:
        slug = a.get('slug', '')
        if slug and slug not in seen_slugs and slug != current_slug:
            seen_slugs.add(slug)
            unique_articles.append(a)

    # Same broad category
    same_cat = [a for a in unique_articles if get_broad_category(a.get('category', '')) == current_broad]
    # Different category
    diff_cat = [a for a in unique_articles if get_broad_category(a.get('category', '')) != current_broad]

    # Shuffle for variety
    random.seed(hash(current_slug) % (2**31))  # Deterministic per article
    random.shuffle(same_cat)
    random.shuffle(diff_cat)

    # Pick from same category first, then fill with different
    related = []
    for a in same_cat[:count]:
        related.append(a)

    remaining = count - len(related)
    if remaining > 0:
        for a in diff_cat[:remaining]:
            related.append(a)

    return related[:count]

def build_related_html(related_articles):
    """Build the Related Articles HTML section."""
    if not related_articles:
        return ""

    links_html = ""
    for article in related_articles:
        slug = article.get('slug', '')
        title = article.get('title', '')
        summary = truncate_summary(article.get('summary', ''))

        # Escape HTML entities in title and summary
        title = title.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;').replace('"', '&quot;')
        summary = summary.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;').replace('"', '&quot;')

        links_html += f'''<a href="/news/{slug}.html" style="display:flex;gap:16px;text-decoration:none;color:inherit;padding:12px;border:1px solid #e5e5e5;border-radius:12px;transition:border-color 0.2s">
<div style="flex:1">
<h3 style="font-size:1rem;font-weight:600;color:#0a0a0a;margin-bottom:4px">{title}</h3>
<p style="font-size:0.85rem;color:#525252;margin:0;line-height:1.5">{summary}</p>
</div>
</a>
'''

    html = f'''<div style="margin:48px 0 0;padding:32px 0;border-top:2px solid #e5e5e5">
<h2 style="font-size:1.5rem;font-weight:700;margin-bottom:20px">Related Articles</h2>
<div style="display:grid;grid-template-columns:1fr;gap:16px">
{links_html.rstrip()}
</div>
</div>
'''
    return html

def process_file(filepath, articles_by_slug, all_articles):
    """Process a single HTML file to add Related Articles."""
    filename = os.path.basename(filepath)
    slug = slug_from_filename(filename)

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Skip if already has Related Articles
    if 'Related Articles' in content:
        return False, "already has Related Articles"

    # Determine the article's category
    # First try to find it in news.js data
    category = ""
    if slug in articles_by_slug:
        category = articles_by_slug[slug].get('category', '')
    else:
        # Try to detect from file content
        # Check the article-tag span
        tag_match = re.search(r'<span class="article-tag">([^<]+)</span>', content)
        if tag_match:
            category = tag_match.group(1)
        else:
            # Check breadcrumb or other indicators
            bread_match = re.search(r'class="article-breadcrumb"[^>]*>.*?<a[^>]*>([^<]+)</a>', content, re.DOTALL)
            if bread_match:
                category = bread_match.group(1)
            elif 'comparison' in filename:
                category = "Comparison"
            elif 'networking-guide' in filename:
                category = "Networking Guide"
            elif 'cost-exhibit' in filename or 'cost-of-exhibiting' in filename:
                category = "Data & Trends"
            elif 'guide-' in filename:
                category = "Show Updates"

    # Find related articles
    related = find_related_articles(slug, category, articles_by_slug, all_articles, count=4)

    if not related:
        return False, "no related articles found"

    related_html = build_related_html(related)

    # Try to inject before <div class="cta-box"> (editorial articles)
    cta_pattern1 = '<div class="cta-box">'
    cta_pattern2 = '<div class="article-cta">'

    # Also handle with possible indentation
    cta_pattern3 = '            <div class="article-cta">'

    inserted = False

    if cta_pattern1 in content:
        # Find the position and inject before it
        pos = content.index(cta_pattern1)
        # Check if there's a newline before it
        content = content[:pos] + related_html + "\n" + content[pos:]
        inserted = True
    elif cta_pattern3 in content:
        pos = content.index(cta_pattern3)
        # For indented article-cta, add with matching indentation
        content = content[:pos] + related_html + "\n" + content[pos:]
        inserted = True
    elif cta_pattern2 in content:
        pos = content.index(cta_pattern2)
        content = content[:pos] + related_html + "\n" + content[pos:]
        inserted = True
    else:
        # Try to inject before </article>
        if '</article>' in content:
            pos = content.index('</article>')
            content = content[:pos] + related_html + "\n" + content[pos:]
            inserted = True
        else:
            return False, "no CTA box or </article> found"

    if inserted:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True, f"added {len(related)} related articles (category: {category or 'unknown'})"

    return False, "insertion failed"

def main():
    print("Parsing news.js...")
    all_articles = parse_news_js(NEWS_JS)
    print(f"Found {len(all_articles)} article entries in news.js")

    # Build lookup by slug (use first occurrence for duplicates)
    articles_by_slug = {}
    for article in all_articles:
        slug = article.get('slug', '')
        if slug and slug not in articles_by_slug:
            articles_by_slug[slug] = article
    print(f"Unique slugs: {len(articles_by_slug)}")

    # Get all HTML files
    html_files = sorted([
        f for f in os.listdir(NEWS_DIR)
        if f.endswith('.html')
    ])
    print(f"Found {len(html_files)} HTML files in {NEWS_DIR}")

    # Process each file
    modified = 0
    skipped = 0
    errors = 0

    for filename in html_files:
        filepath = os.path.join(NEWS_DIR, filename)
        try:
            success, message = process_file(filepath, articles_by_slug, all_articles)
            if success:
                modified += 1
                if modified <= 5 or modified % 1000 == 0:
                    print(f"  [OK] {filename}: {message}")
            else:
                skipped += 1
                if 'already has' in message and skipped <= 3:
                    print(f"  [SKIP] {filename}: {message}")
        except Exception as e:
            errors += 1
            if errors <= 10:
                print(f"  [ERROR] {filename}: {e}")

    print(f"\nDone! Modified: {modified}, Skipped: {skipped}, Errors: {errors}")

if __name__ == '__main__':
    main()
