# ShowFloorTips — Standing Instructions for Claude

## Mission
**Be the #1 trade show resource on the internet.** Produce the best content, the richest data, and the most useful tools. Always think of new ways to make ShowFloorTips indispensable — the site exhibitors can't stop coming back to. Outclass every competitor. No exceptions.

## Rules
1. **NEVER** access or make changes to `memory-tradeshow-app` or `Developer/hidden app`
2. **Compact after every code change**
3. **Never store or make changes locally** — all work happens on the drive (`/Volumes/Willie Extr/tradeshow-website`)

## Project Setup
- **Repo:** `willieseoassist-cell/showfloortips-site` on GitHub (main branch)
- **Hosting:** Vercel (auto-deploys from GitHub)
- **Payments:** Stripe (`stripe_links.json`)
- **Data files:** `shows.js` (exhibit records), `news.js` (article index)
- **Articles:** `/news/` folder — self-contained HTML files

## Competitor
- **Primary competitor:** https://www.orbus.com/about-us/usa-tradeshow-list
- We must be better than Orbus in every way — more shows, better data, better UX, better SEO
- Study their site regularly and ensure ShowFloorTips surpasses them

## Growth Strategy
- SEO is the primary growth channel (24K+ articles, sitemaps, structured data)
- Newsletter opt-in to capture emails legitimately
- Social media, Google Ads, partnerships with trade show organizers
- NO email scraping or unsolicited outreach — protect the domain reputation

## Daily Tasks (Every Session)

### 0. Monitor Competitor (Orbus)
- Check https://www.orbus.com/about-us/usa-tradeshow-list for any new shows
- Any new shows they add that we DON'T already have, we add to our site in our own format with richer data (hotels, tips, booth costs, etc.)
- Always check shows.js for duplicates before adding
- We must always have everything they have and more


### 1. Add 10-15 New Articles (Mix of Types)
- Follow the existing article HTML template format (inline CSS, SEO meta, JSON-LD, Scannly CTA)
- Article types:
  - **Networking Guides** — "Networking Guide for [Show Name]"
  - **Comparison Articles** — "[Show A] vs [Show B]: Which Should You Exhibit At?"
  - **News Insight Articles** — Take the day's most popular/trending news stories and rewrite them through a trade show lens. Top-level writing. Hook the reader from the first sentence. Each article should be better than the last. Make readers feel like they NEED ShowFloorTips to stay informed.
- Writing quality: Magazine-level. No filler. Every paragraph earns its place. Hook readers from line one.
- Add corresponding entries to `news.js`
- Use Unsplash images consistent with existing articles

### 2. Scrape for New Exhibits
- Search the internet for upcoming trade shows, expos, conferences, and conventions
- Add new entries to `shows.js` following the existing JSON format:
  - title, slug, category, date, sort_date, location, venue, city, state, country
  - description, host, website, search_url, image, hotels, booth_price
  - registration_info, attendees, exhibitors, tips (5 strategies), source
- Avoid duplicates — check existing data before adding

## Content Formats Reference

### Show Record (shows.js)
```json
{
  "title": "Show Name",
  "slug": "show-name",
  "category": "Industry",
  "date": "01 Jan. 2026",
  "sort_date": "2026-01-01",
  "location": "Venue, City",
  "venue": "Venue Name",
  "city": "City",
  "state": "",
  "country": "Country",
  "description": "Short description",
  "host": "Organizer",
  "website": "https://...",
  "search_url": "https://www.google.com/search?q=...",
  "image": "https://images.unsplash.com/...",
  "hotels": [{"name": "Hotel", "distance": "0.5 miles", "price_range": "$100-$250/night"}],
  "booth_price": "$2,000 - $10,000",
  "registration_info": "",
  "attendees": "10,000+",
  "exhibitors": "500+",
  "source": "generated",
  "tips": ["Tip 1", "Tip 2", "Tip 3", "Tip 4", "Tip 5"]
}
```

### News Article Types
- **Networking Guide:** "Networking Guide for [Show Name]" — pre-show outreach, floor tactics, follow-up, mistakes to avoid
- **Comparison Article:** "[Show A] vs [Show B]: Which Should You Exhibit At?" — profiles, head-to-head, cost comparison, verdict

### Article HTML Template
- Self-contained inline CSS (Inter font, monochrome design)
- SEO: og tags, twitter cards, canonical URL, JSON-LD schema.org Article
- Sticky header: ShowFloorTips logo + nav (Trade Shows, News, ROI Calculator, Products, Scannly CTA)
- Hero: breadcrumb, category badge, h1, meta (author + date)
- Body: featured image, article content with h2/h3, stat-callout, blockquote, key-takeaway
- Sidebar: Quick Links + Show Details
- Scannly CTA at bottom of article
- Footer: brand, resources, tools, industry browse
