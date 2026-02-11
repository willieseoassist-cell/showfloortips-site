#!/usr/bin/env python3
"""
Generate XML sitemaps and RSS feed for ShowFloorTips.com
"""

import os
import re
import json
import math
from datetime import datetime, timezone
from email.utils import format_datetime

BASE_URL = "https://showfloortips.com"
SITE_DIR = "/Volumes/Willie Extr/tradeshow-website"
TODAY = "2026-02-10"
SHOWS_PER_SITEMAP = 40000

def get_html_files(directory, prefix=""):
    """Get all .html files in a directory."""
    files = []
    full_path = os.path.join(SITE_DIR, directory) if directory else SITE_DIR
    if not os.path.isdir(full_path):
        return files
    for f in sorted(os.listdir(full_path)):
        if f.endswith(".html"):
            if directory:
                files.append(f"{directory}/{f}")
            else:
                files.append(f)
    return files

def get_show_slugs():
    """Extract all show slugs from shows.js."""
    slugs = []
    slug_pattern = re.compile(r'"slug"\s*:\s*"([^"]+)"')
    with open(os.path.join(SITE_DIR, "shows.js"), "r") as f:
        for line in f:
            match = slug_pattern.search(line)
            if match:
                slugs.append(match.group(1))
    return slugs

def xml_escape(text):
    """Escape special XML characters."""
    text = text.replace("&", "&amp;")
    text = text.replace("<", "&lt;")
    text = text.replace(">", "&gt;")
    text = text.replace("'", "&apos;")
    text = text.replace('"', "&quot;")
    return text

def generate_url_entry(path, lastmod, changefreq, priority):
    """Generate a single <url> entry."""
    loc = f"{BASE_URL}/{path}" if path else BASE_URL
    # Clean up double slashes (but not in https://)
    loc = loc.replace("//", "/").replace("https:/", "https://")
    return f"""  <url>
    <loc>{loc}</loc>
    <lastmod>{lastmod}</lastmod>
    <changefreq>{changefreq}</changefreq>
    <priority>{priority}</priority>
  </url>"""

def generate_sitemap_xml(url_entries):
    """Wrap URL entries in sitemap XML."""
    header = '<?xml version="1.0" encoding="UTF-8"?>\n'
    header += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    footer = '\n</urlset>'
    return header + "\n".join(url_entries) + footer

def generate_sitemap_index(sitemap_files):
    """Generate sitemap index XML."""
    header = '<?xml version="1.0" encoding="UTF-8"?>\n'
    header += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    entries = []
    for filename in sitemap_files:
        entries.append(f"""  <sitemap>
    <loc>{BASE_URL}/{filename}</loc>
    <lastmod>{TODAY}</lastmod>
  </sitemap>""")
    footer = '\n</sitemapindex>'
    return header + "\n".join(entries) + footer

# ── MAIN PAGES (priority 0.9, homepage 1.0) ──
main_pages = [
    "index.html", "news.html", "travel.html", "products.html", "show.html",
    "city-shows.html", "compare.html", "map.html", "lead-calculator.html",
    "packing-list.html", "cost-estimator.html", "flight-deals.html",
    "roi-calculator.html", "this-week.html", "venue-maps.html",
    "sponsor.html", "media-kit.html", "newsletter.html", "scannly.html",
    "bundle.html"
]

# Also pick up any other root .html files not in the main list
all_root_html = get_html_files("")
extra_root = [f for f in all_root_html if f not in main_pages]

# News and travel articles
news_files = get_html_files("news")
travel_files = get_html_files("travel")

print(f"Main pages: {len(main_pages)}")
print(f"Extra root pages: {len(extra_root)}")
print(f"News articles: {len(news_files)}")
print(f"Travel guides: {len(travel_files)}")

# ── Build sitemap-pages.xml ──
page_entries = []

# Homepage
page_entries.append(generate_url_entry("", TODAY, "daily", "1.0"))

# Main pages (excluding index.html since we added homepage)
for page in main_pages:
    if page == "index.html":
        continue
    page_entries.append(generate_url_entry(page, TODAY, "weekly", "0.9"))

# Extra root pages
for page in extra_root:
    page_entries.append(generate_url_entry(page, TODAY, "weekly", "0.8"))

# News articles
for page in news_files:
    page_entries.append(generate_url_entry(page, TODAY, "weekly", "0.8"))

# Travel guides
for page in travel_files:
    page_entries.append(generate_url_entry(page, TODAY, "weekly", "0.8"))

sitemap_pages_xml = generate_sitemap_xml(page_entries)
with open(os.path.join(SITE_DIR, "sitemap-pages.xml"), "w") as f:
    f.write(sitemap_pages_xml)
print(f"Written sitemap-pages.xml with {len(page_entries)} URLs")

# ── Build sitemap-shows-N.xml ──
print("Extracting show slugs from shows.js...")
show_slugs = get_show_slugs()
print(f"Found {len(show_slugs)} show slugs")

num_show_sitemaps = math.ceil(len(show_slugs) / SHOWS_PER_SITEMAP)
show_sitemap_files = []

for i in range(num_show_sitemaps):
    batch = show_slugs[i * SHOWS_PER_SITEMAP : (i + 1) * SHOWS_PER_SITEMAP]
    entries = []
    for slug in batch:
        entries.append(generate_url_entry(f"shows/{slug}", TODAY, "weekly", "0.7"))
    filename = f"sitemap-shows-{i + 1}.xml"
    show_sitemap_files.append(filename)
    sitemap_xml = generate_sitemap_xml(entries)
    with open(os.path.join(SITE_DIR, filename), "w") as f:
        f.write(sitemap_xml)
    print(f"Written {filename} with {len(entries)} URLs")

# ── Build sitemap-index.xml ──
all_sitemap_files = ["sitemap-pages.xml"] + show_sitemap_files
sitemap_index_xml = generate_sitemap_index(all_sitemap_files)
with open(os.path.join(SITE_DIR, "sitemap-index.xml"), "w") as f:
    f.write(sitemap_index_xml)
print(f"Written sitemap-index.xml pointing to {len(all_sitemap_files)} sitemaps")

# ══════════════════════════════════════════════
# ── RSS FEED GENERATION ──
# ══════════════════════════════════════════════

print("\n── Generating RSS Feed ──")

# Parse news.js to extract article data
with open(os.path.join(SITE_DIR, "news.js"), "r") as f:
    content = f.read()

# Extract the JSON array from "var NEWS_DATA = [...];"
# Find the start of the array
array_start = content.index("[")
# We need to find the matching closing bracket
bracket_count = 0
array_end = array_start
for idx in range(array_start, len(content)):
    if content[idx] == "[":
        bracket_count += 1
    elif content[idx] == "]":
        bracket_count -= 1
        if bracket_count == 0:
            array_end = idx + 1
            break

json_str = content[array_start:array_end]
articles = json.loads(json_str)

print(f"Total articles in news.js: {len(articles)}")

# Take the first 50 (they are already sorted most recent first)
rss_articles = articles[:50]

def to_rfc822(date_str):
    """Convert date string to RFC 822 format."""
    # Handle both "2026-02-10" and "2026-02-10T00:00:00Z" formats
    date_str = date_str.split("T")[0]
    dt = datetime.strptime(date_str, "%Y-%m-%d")
    dt = dt.replace(tzinfo=timezone.utc)
    return format_datetime(dt)

# Build the RSS XML
now_rfc822 = format_datetime(datetime.now(timezone.utc))

rss_items = []
for article in rss_articles:
    title = xml_escape(article["title"])
    summary = xml_escape(article.get("summary", ""))
    pub_date = to_rfc822(article["published_date"])

    # Normalize URL: remove leading slash if present, ensure it starts with news/
    url = article.get("url", f"news/{article['slug']}.html")
    url = url.lstrip("/")
    full_url = f"{BASE_URL}/{url}"

    rss_items.append(f"""    <item>
      <title>{title}</title>
      <link>{full_url}</link>
      <description>{summary}</description>
      <pubDate>{pub_date}</pubDate>
      <guid>{full_url}</guid>
    </item>""")

rss_xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>ShowFloorTips - Trade Show News &amp; Insights</title>
  <link>{BASE_URL}</link>
  <description>The latest trade show news, exhibitor strategies, networking guides, and industry analysis from ShowFloorTips.</description>
  <language>en-us</language>
  <lastBuildDate>{now_rfc822}</lastBuildDate>
  <atom:link href="{BASE_URL}/rss.xml" rel="self" type="application/rss+xml"/>
{chr(10).join(rss_items)}
</channel>
</rss>"""

with open(os.path.join(SITE_DIR, "rss.xml"), "w") as f:
    f.write(rss_xml)
print(f"Written rss.xml with {len(rss_items)} items")

print("\n── All done! ──")
