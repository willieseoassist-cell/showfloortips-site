# ShowFloorTips — Standing Instructions for Claude

## Mission
**Be the #1 trade show resource on the internet.** Produce the best content, the richest data, and the most useful tools. Always think of new ways to make ShowFloorTips indispensable — the site exhibitors can't stop coming back to. Outclass every competitor. No exceptions.

## Rules
1. **NEVER** access or make changes to `memory-tradeshow-app` or `Developer/hidden app`
2. **Compact after every code change**
3. **Never store or make changes locally** — all work happens on the drive (`/Volumes/Willie Extr/tradeshow-website`)
4. **Update this file** after completing any task — log what was done in the Achievement Log below

## Project Setup
- **Repo:** `willieseoassist-cell/showfloortips-site` on GitHub (main branch)
- **Hosting:** Vercel (auto-deploys from GitHub BUT requires `--archive=tgz` due to 24K+ files exceeding 15K file limit)
- **Deploy command:** `cd "/Volumes/Willie Extr/tradeshow-website" && npx vercel --prod --archive=tgz --yes`
- **Payments:** Stripe (`stripe_links.json` — 19 products, $7.99-$14.99)
- **Email:** Resend API for outreach
  - **API Key:** `re_CGmCArUb_D1qyCSuaXGhsdRdUtZk5XhcZ`
  - **From:** `Show Floor Tips Team <info@showfloortips.com>`
  - **Domain:** showfloortips.com (verified, DKIM + SPF confirmed)
  - **Rate limit:** ~2 req/sec, use 0.8-1s delays between sends
  - **Must use `User-Agent: ShowFloorTips/1.0` header** (Cloudflare blocks default Python UA)
- **Data files:** `shows.js` (exhibit records, 29MB, 24,615+ shows), `news.js` (article index, 14MB)
- **Articles:** `/news/` folder — self-contained HTML files
- **Site URL:** https://showfloortips.com
- **Aliases:** site-six-phi-86.vercel.app, site-showfloortips-projects.vercel.app

## Competitor
- **Primary competitor:** https://www.orbus.com/about-us/usa-tradeshow-list
- We must be better than Orbus in every way — more shows, better data, better UX, better SEO
- Study their site regularly and ensure ShowFloorTips surpasses them

## Revenue Plan ($1M Target)
- **Digital Products:** $150K (Stripe, $7.99-$14.99 guides)
- **Pro Subscription:** $300K (premium tier)
- **Scannly App:** $200K (lead capture tool)
- **Affiliates:** $100K (hotel, travel, booth services)
- **Sponsored Listings:** $150K (event sponsors — Bronze $1.5K/mo, Silver $3K/mo, Gold $5K/mo)
- **Data/Reports:** $100K (industry reports)
- Full plan in `MILLION-DOLLAR-PLAN.md`

## Growth Strategy
- SEO is the primary growth channel (24K+ articles, sitemaps, structured data)
- Newsletter opt-in to capture emails legitimately
- Social media, Google Ads, partnerships with trade show organizers
- **Sponsor outreach via Resend** — send 100+ emails per day to upcoming show organizers
- NO email scraping or unsolicited outreach to random people — protect the domain reputation

## Daily Tasks (Every Session)

### 0. Send Sponsor Outreach Emails (100/day)
- Pull upcoming shows from `shows.js` (next 60-90 days)
- Search for event organizer/sponsor/exhibit contact emails
- Send personalized partnership pitch emails via Resend API
- Track what was sent in the Achievement Log below to avoid duplicate outreach
- Focus on shows with 5K+ attendees and real organizer websites
- **Always use Python** for sending (not curl) due to HTML escaping issues in shell

### 1. Monitor Competitor (Orbus)
- Check https://www.orbus.com/about-us/usa-tradeshow-list for any new shows
- Any new shows they add that we DON'T already have, we add to our site in our own format with richer data (hotels, tips, booth costs, etc.)
- Always check shows.js for duplicates before adding
- We must always have everything they have and more

### 2. Add 10-15 New Articles (Mix of Types)
- Follow the existing article HTML template format (inline CSS, SEO meta, JSON-LD, Scannly CTA)
- Article types:
  - **Networking Guides** — "Networking Guide for [Show Name]"
  - **Comparison Articles** — "[Show A] vs [Show B]: Which Should You Exhibit At?"
  - **News Insight Articles** — Take the day's most popular/trending news stories and rewrite them through a trade show lens. Top-level writing. Hook the reader from the first sentence. Each article should be better than the last. Make readers feel like they NEED ShowFloorTips to stay informed.
- Writing quality: Magazine-level. No filler. Every paragraph earns its place. Hook readers from line one.
- Add corresponding entries to `news.js`
- Use Unsplash images consistent with existing articles

### 3. Scrape for New Exhibits
- Search the internet for upcoming trade shows, expos, conferences, and conventions
- Add new entries to `shows.js` following the existing JSON format:
  - title, slug, category, date, sort_date, location, venue, city, state, country
  - description, host, website, search_url, image, hotels, booth_price
  - registration_info, attendees, exhibitors, tips (5 strategies), source
- Avoid duplicates — check existing data before adding

## Sponsorship Pricing Tiers
- **Bronze:** $1,500/month ($15K/year) — show page partner listing, logo in sidebar, 1 sponsored article/quarter
- **Silver:** $3,000/month ($30K/year) — everything in Bronze + homepage rotation, 1 article/month, newsletter logo, category banner
- **Gold:** $5,000/month ($50K/year) — everything in Silver + permanent homepage placement, 2 articles/month, dedicated newsletter blast, traffic data reports, "Recommended" badge

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

---

## Achievement Log

### Feb 9, 2026 — Session 1

#### SEO & Site Fixes
- Added HSTS header to `vercel.json` (Strict-Transport-Security) to fix Google Search Console Non-HTTPS URL issue
- Fixed Google Search snippet — updated meta description, title, og:image, og:site_name, twitter:description, twitter:image, enhanced JSON-LD with SearchAction and publisher
- Previous Google result showed stale GoDaddy text; now shows proper ShowFloorTips description

#### Homepage Addiction Features Added
- FOMO ticker banner (shows count of trade shows this week/month)
- "Happening Soon" section with 4 live countdown timers to nearest shows
- "Trending Shows This Week" section showing top 4 by attendance with ranked badges
- "Latest Insights" section with 3 article cards linking to news articles

#### Articles Created (12 total)
**News Insight Articles (5):**
- `news/ai-disruption-what-exhibitors-must-know-2026.html`
- `news/eu-chip-race-semiconductor-trade-shows-2026.html`
- `news/super-bowl-lx-what-exhibitors-learn-from-halftime.html`
- `news/cybersecurity-threats-trade-show-booth-technology.html`
- `news/construction-labor-shortage-trade-show-impact-2026.html`

**Networking Guides (4):**
- `news/networking-guide-euroshop-2026.html`
- `news/networking-guide-vive-2026.html`
- `news/networking-guide-wvc-2026.html`
- `news/networking-guide-fruit-logistica-2026.html`

**Comparison Articles (3):**
- `news/euroshop-vs-nrf-comparison.html`
- `news/vive-vs-himss-comparison.html`
- `news/world-of-concrete-vs-conexpo-comparison.html`

#### Sponsor Outreach — 105 Emails Sent
**Shows contacted (60+ unique shows, some with multiple contacts):**

EuroShop (BolzJ, PaessensJ, MoebiusE, info @messe-duesseldorf.de) | VIVE/HLTH (sales@hlth.com) | CHIME (foundationstaff, info @chimecentral.org) | Canadian International AutoShow (dmcclean, cias @autoshow.ca) | National Farm Machinery Show (don.tourte@farmprogress.com, sponsorship@kyvenues.com) | World AG Expo (info@farmshow.org) | Toy Fair NY (lmangiaracina@toyassociation.org) | MAGIC Las Vegas (cs@fashionresource.com) | NAHB Builders Show (msutton@nahb.org) | KBIS (diana.gallagher@emeraldx.com) | PACK EXPO East (sales@pmmi.org) | NAPE Summit (sponsorships@NAPEexpo.com) | Intersolar NA (sales@iesna.com) | MWC Barcelona (sponsorship@gsma.com) | CONEXPO-CON/AGG (exhibitors@aem.org) | Natural Products Expo West (exhibitors@expowest.com, exhibitorservices@newhope.com) | ITB Berlin (itb@messe-berlin.de, teresa.baumgarten@messe-berlin.de) | HIMSS (exhibitors@himssconference.com, HIMSSCustomerSuccess@informa.com) | GDC (gamemarketing@informa.com) | Seafood Expo NA (kbutland@divcom.com) | ISC West (inquiry@iscwest.com) | RSAC (kwhite@nthdegree.com) | ACC (acc-exhibits@acc.org) | Cosmoprof Bologna (info@cosmoprof.com, l.aguiati@bolognafiere.it) | MIPIM (customer.service@rxglobal.com) | Franchise Expo Paris (info@franchiseparis.com, carolina.gautron@infopro-digital.com) | Embedded World (gina.giessmann@nuernbergmesse.de) | Commodity Classic (apodkul@soy.org) | AAOS (schott, abogdal @aaos.org) | Pittcon (info, marketing @pittcon.org) | Japan Shop (tradefairs@congre.co.jp) | Taipei Bakery Show (office@bakery.org.tw) | IFA Convention (ljames@franchise.org) | SXSW (sales@sxsw.com) | National Restaurant Association Show (RestaurantShowSales, restaurantshowexhibitorservices @informa.com) | Hannover Messe (info@messe.de) | NAB Show (exhibit@nab.org) | InfoComm (exhibitsales@avixa.org) | Licensing Expo (exhibitors@licensingexpo.com) | AIME Melbourne (aime, matt.pearce @talk2.media) | ATD (globalsponsorships@td.org) | SHRM (sponsorships@shrm.org) | ProMat (sales, gbaer @mhi.org) | Automate (sales, azmikly @automate.org) | AORN (aornexhibsales@us.wearemci.com, sgeraths@aorn.org) | SHOT Show (exhibitorhelp, regmgr @shotshow.org) | Outdoor Retailer (john.krause@outdoorretailer.com) | NY Now (customerservice@nynow.com, lauren.riccacesare@emeraldx.com) | ASD Market Week (customerservice@asdonline.com) | SupplySide West (sponsorships@supplysideshow.com) | IFT FIRST (mshey, tsheetz @ift.org) | CEDIA Expo (cmenefee, chelsea.cafiero @emeraldx.com, cedia@cedia.org) | Cosmoprof Asia (visit-ca@informa.com) | Warsaw Motorcycle Show (media2@warsawexpo.eu) | WTM London (rxinfo@rxglobal.com) | RC Show (rcshow@restaurantscanada.org) | Ceramitec (exhibiting@ceramitec.com) | Naidex (sales@naidex.co.uk) | ENADA Spring (orietta.foschi@iegexpo.it) | Expodental (expodental@ifema.es) | Western Hunting Expo (chris@huntexpo.com) | BioFach (info@biofach.de) | WEST/AFCEA (jessica.neiers@spargoinc.com) | GEAPS (sponsorship@geaps.com) | Enterprise Connect (Jessica.Cheng@informa.com) | ASCRS (exhibits@ascrs.org) | Dubai Boat Show (info@boatshowdubai.com) | AHR Expo (info@ahrexpo.com) | SOCMA (meetings@socma.org) | Prosper Show (tim.berry@emeraldx.com)

#### Deployment
- Pushed all changes to GitHub (main branch)
- Deployed to Vercel with `--archive=tgz` (24,227 files)
- Live at https://showfloortips.com

#### Revenue Plan
- Created `MILLION-DOLLAR-PLAN.md` with 6 revenue streams and 3-phase roadmap
- Defined sponsorship pricing tiers (Bronze $15K/yr, Silver $30K/yr, Gold $50K/yr)

### Feb 9, 2026 — Session 2

#### Articles Created (8 total — 5 news insight + 3 new)
**News Insight Articles (5):**
- `news/jimmy-lai-hong-kong-exhibitor-asia-strategy-2026.html`
- `news/tariffs-reshaping-exhibit-budgets-2026.html`
- `news/labor-shortage-booth-build-delay-2026.html`
- `news/bridgepay-ransomware-trade-show-payments-2026.html`
- `news/saaspocalypse-exhibitor-tech-stack-2026.html`

### Feb 9, 2026 — Session 3

#### Articles Created (3 total)
**News Insight (1):**
- `news/japan-first-female-pm-asia-trade-shows-2026.html` — Sanae Takaichi's landslide victory and what it means for Asia's exhibition industry

**Networking Guide (1):**
- `news/networking-guide-natural-products-expo-west-2026.html` — Complete networking playbook for 89,000-attendee Expo West

**Comparison (1):**
- `news/sxsw-vs-ces-comparison.html` — SXSW's 300K creative audience vs CES's 138K hardware buyers

#### New Shows Added to shows.js (12 new, total now 24,600)
- NVIDIA GTC 2026 (Mar 16-19, San Jose)
- Google Cloud Next 2026 (Apr 22-24, Las Vegas)
- Adobe Summit 2026 (Apr 19-22, Las Vegas)
- Databricks Data + AI Summit 2026 (Jun 15-18, San Francisco)
- Cisco Live 2026 (May 31 - Jun 4, Las Vegas)
- Shoptalk Spring 2026 (Mar 24-26, Las Vegas)
- IPC APEX EXPO 2026 (Mar 17-19, Anaheim)
- CommerceNext Growth Show 2026 (Jun 24-26, New York)
- CLEANPOWER 2026 (May 18-21, San Diego)
- SuperAI Conference 2026 (Jun 10-11, Singapore)
- National Restaurant Association Show 2026 (May 16-19, Chicago)
- FIME 2026 (Jun 17-19, Miami Beach)

#### Sponsor Outreach
- Received response from SXSW sales team (Lanesia, sales@sxsw.com) requesting partnership details
- SXSW dates confirmed: SXSW EDU Mar 9-12, SXSW Mar 12-18, 2026
- **Sent reply to sales@sxsw.com** with company details (ShowFloorTips, Willie Austin, info@showfloortips.com, (334) 327-0246) — awaiting account executive follow-up

#### Orbus Monitoring
- Orbus competitor page (orbus.com/about-us/usa-tradeshow-list) appears to be JS-rendered, not accessible via fetch — needs manual browser check next session

#### Deployment
- Pushed all changes to GitHub (main branch)
- Deployed to Vercel with `--archive=tgz`
- Live at https://showfloortips.com

### Feb 9, 2026 — Session 4

#### Travel Section Built (Affiliate Revenue Play)
- **Created `/travel.html` hub page** — city guide cards, travel tips, hotel booking advice, Amazon product recommendations
- **10 city guide articles created in `/travel/`:**
  - Las Vegas, Chicago, Orlando, New York City, Anaheim, San Francisco, Atlanta, Houston, Dallas, San Diego
  - Each guide: hotels (Booking.com links), neighborhoods, transportation, restaurants, packing tips, pro tips
  - Magazine-quality writing, JSON-LD SEO, self-contained inline CSS
- **Amazon Associates integrated** — Tag: `showfloortips-20`, products: Anker power bank, Samsonite carry-on, banner stands, travel backpack, cable organizer, wrinkle releaser, business card holder, retractable banner
- **Navigation updated across ALL 24,183+ pages** — "Travel" tab added to nav + "Travel Guides" added to footer on:
  - 9 main pages (index, news, products, roi-calculator, city-shows, show, sponsor, media-kit, newsletter)
  - 24,174 article pages in /news/
- **Internal linking added:**
  - city-shows.html: Travel guide banner appears on city pages for all 10 guide cities
  - show.html: Travel guide link appears in hotel/travel section for shows in guide cities
- **Purpose:** Build travel content layer for Travelpayouts/Booking.com affiliate reapplication + Amazon Associates revenue

#### Deployment
- Pushed all changes to GitHub (main branch)
- Deployed to Vercel with `--archive=tgz`
- Live at https://showfloortips.com

### Feb 9, 2026 — Session 5

#### Articles Created (10 total)
**News Insight Articles (5):**
- `news/return-to-office-trade-show-attendance-boom-2026.html` — Return-to-office mandates supercharging trade show attendance
- `news/ai-infrastructure-boom-reshaping-tech-trade-shows-2026.html` — $2T AI infrastructure boom reshaping every tech show floor
- `news/space-industry-trade-shows-fastest-growing-2026.html` — Space industry shows are the fastest-growing exhibition sector
- `news/global-inflation-cooling-exhibitor-budgets-2026.html` — Inflation cooling but exhibitor budgets haven't caught up
- `news/ev-price-war-auto-trade-shows-2026.html` — EV price war (BYD, Tesla, Chinese OEMs) transforming auto show floors

**Networking Guides (3):**
- `news/networking-guide-nvidia-gtc-2026.html` — NVIDIA GTC (30K+ AI developers, San Jose, Mar 16-19)
- `news/networking-guide-nab-show-2026.html` — NAB Show (100K+ media pros, Las Vegas, Apr 12-16)
- `news/networking-guide-sxsw-2026.html` — SXSW (300K+ attendees, Austin, Mar 12-18)

**Comparison Articles (2):**
- `news/nab-show-vs-infocomm-comparison.html` — NAB Show (content creators) vs InfoComm (AV integrators)
- `news/gdc-vs-pax-gaming-shows-comparison.html` — GDC (B2B developers) vs PAX (B2C consumers)

#### New Shows Added to shows.js (15 new, total now 24,615)
- MJBizCon 2026 (Nov 17, Las Vegas) — Cannabis
- Hall of Flowers 2026 (Mar 18, Ventura) — Cannabis
- NECANN Boston 2026 (Apr 24, Boston) — Cannabis
- Commercial UAV Expo 2026 (Sep 1, Las Vegas) — Drones
- Money20/20 USA 2026 (Oct 18, Las Vegas) — Fintech
- FinovateEurope 2026 (Feb 10, London) — Fintech
- FinTech Americas Miami 2026 (Mar 24, Miami) — Fintech
- Global Pet Expo 2026 (Mar 25, Orlando) — Pet Industry
- SuperZoo 2026 (Aug 18, Las Vegas) — Pet Industry
- Petfood Forum 2026 (Apr 28, Kansas City) — Pet Industry
- Greenbuild 2026 (Oct 20, New York) — Sustainability
- GreenTech Amsterdam 2026 (Jun 9, Amsterdam) — Agriculture
- INTERGEO 2026 (Sep 15, Munich) — Geospatial
- Climate Technology Show 2026 (Mar 24, London) — Clean Tech
- World Future Energy Summit 2026 (Jan 13, Abu Dhabi) — Energy

#### Deployment
- Pushed all changes to GitHub (main branch)
- Deployed to Vercel with `--archive=tgz`
- Live at https://showfloortips.com

### Feb 9, 2026 — Session 6

#### Amazon Affiliate Product Image Fix (travel.html)
- Fixed 8 broken Amazon product images (were using fabricated m.media-amazon.com URLs that 404'd)
- Downloaded product images from official manufacturer websites and hosted locally in `/images/products/`
- Images sourced from: Anker, Samsonite (LuggageBase), Downy, MATEIN, BAGSMART, ExponetUSA, EasyOrderBanners, Kinzd
- Updated all 8 Amazon ASINs to verified product listings
- Updated prices to current values (Anker $109.99, Downy $7.49, BAGSMART $15.99)
- All links verified with `showfloortips-20` affiliate tag

#### City Guide Card Image Fix (travel.html)
- Fixed 3 broken Unsplash city images (Atlanta, Houston, San Diego were 404)
- Replaced ALL 10 city card images with locally-hosted versions in `/images/cities/`
- Replacement images: Atlanta & San Diego from Pexels, Houston from Pexels; 7 others downloaded from Unsplash before they break
- No more external image dependencies on travel.html — all images self-hosted

#### Amazon ASIN Updates (10 city guide articles)
- Updated 13 affiliate links across all 10 city guides in `/travel/` to verified ASINs
- Replacements: Anker B0BN744Y71→B09VPHVT2Z, MATEIN B0BSHF7WHJ→B06XZTZ7GB, MaxGear B07VJYZGRL→B074TZ9TS1, BAGSMART B075Y3BTRN→B017SKRWL4, Samsonite B09NNMBPMJ→B01M0A3BKH, Downy B08LH59SXZ→B07ZG4D84D, Banner B0BY8CY8B5→B0CDN222CL
- Verified zero old ASINs remain in any file

#### New Files Added
- `/images/products/` — 8 product images (anker, samsonite, downy, matein, bagsmart, retractable-banner, backdrop-banner, business-card-holder)
- `/images/cities/` — 10 city images (las-vegas, chicago, orlando, new-york, anaheim, san-francisco, atlanta, houston, dallas, san-diego)

#### Deployment
- Pushed all changes to GitHub (main branch)
- Deployed to Vercel with `--archive=tgz`
- Live at https://showfloortips.com

### Feb 9, 2026 — Session 7

#### Major Feature Build — 6 New Interactive Tool Pages
- **`/compare.html`** (1,540 lines) — Show Comparison Tool: compare 2-3 shows side by side, winner highlighting, badges ("Largest", "Best Value", "Soonest"), URL parameter support for sharing
- **`/map.html`** (1,239 lines) — Interactive World Map: Leaflet.js + MarkerCluster, 156 city coordinates + 77 country fallbacks, filter bar (industry/country/date), sidebar panel, 24,600+ show markers with chunked loading
- **`/lead-calculator.html`** (2,274 lines) — Lead Value Calculator: 3-section input form, real-time results dashboard with CPL/Pipeline/ROI/Payback, bar charts, ROI gauge, downloadable HTML report, localStorage save/load, industry benchmarks
- **`/packing-list.html`** (2,018 lines) — Smart Packing List Generator: city/duration/role/season/booth inputs, 30 cities (20 US + 10 international), 18+ city-specific tips, collapsible categories, progress bar, localStorage persistence, print/email/reset, Amazon affiliate links (`showfloortips-20`)
- **`/cost-estimator.html`** (1,526 lines) — Trip Cost Estimator: 18 cities (US + international), team size slider, booth size dropdown, stacked bar chart visualization, city-specific pro tips, print stylesheet
- **`/flight-deals.html`** (1,040 lines) — Flight & Travel Deals: 3-column quick booking (Google Flights, Booking.com, Google Cars), 7 money-saving tips, flight cost table, Amazon travel gear, city guide links

#### Homepage Enhancements (index.html)
- **Dark Mode** — Toggle button in header, `html[data-theme="dark"]` CSS variable overrides, localStorage persistence, smooth transitions
- **PWA Support** — `manifest.json` (standalone, #0a0a0a theme), `sw.js` service worker (network-first, cache fallback)
- **Search Autocomplete** — Dropdown suggestions filtering SHOWS_DATA by title, 8 results max, click-to-navigate
- **Recently Viewed** — Horizontal scrollable strip of last 6 viewed shows, localStorage persistence
- **Bookmark/Save Shows** — Heart icon on cards, "Saved Shows" filter pill, localStorage persistence, toast notifications
- **Calendar Export** — "Add to Calendar" button in show modal, generates .ics file download with VCALENDAR/VEVENT

#### Show Page Enhancements (show.html)
- **Similar Shows Recommendations** — "Similar Shows You Might Like" section, filters by same category, sorted by date proximity, top 4 cards with responsive grid
- **Exhibitor Reviews** — Full review system: 1-5 star rating, role dropdown, year selector, text review, "worth it" toggle, localStorage persistence per show, sort controls (recent/highest/lowest), average rating display, XSS-safe via DOM text nodes

#### Dark Mode CSS (styles.css)
- ~300 lines of dark mode CSS added (line 1576+)
- Inverted all CSS custom properties for `html[data-theme="dark"]`
- Covers: header, hero, search, stats, filters, cards, modals, buttons, footer, and all component variants

#### Articles Created (13 total)
**Cost-of-Exhibiting City Guides (4):**
- `news/cost-of-exhibiting-las-vegas-2026.html` — Comprehensive Las Vegas exhibiting cost breakdown
- `news/cost-of-exhibiting-chicago-2026.html` — McCormick Place union labor focus
- `news/cost-of-exhibiting-orlando-2026.html` — Orange County Convention Center costs
- `news/cost-of-exhibiting-new-york-2026.html` — Javits Center premium pricing

**Exhibitor Spotlight Case Studies (3):**
- `news/exhibitor-spotlight-saas-startup-ces-2026.html` — SaaS startup CES case study
- `news/exhibitor-spotlight-manufacturer-pack-expo-2026.html` — GreenPack PACK EXPO case study (200 leads, $1.2M orders, 18.5x ROI)
- `news/exhibitor-spotlight-healthcare-himss-2026.html` — Healthcare company HIMSS case study

**FAQ Exhibitor Guides (3):**
- `news/faq-ces-2026-exhibitor-guide.html` — 16 FAQ items with accordion
- `news/faq-sxsw-2026-exhibitor-guide.html` — 14 FAQ items covering brand activations, badges, networking
- `news/faq-nab-show-2026-exhibitor-guide.html` — NAB Show exhibitor FAQ guide

**Industry Trend Reports (3):**
- `news/trade-show-industry-trends-q1-2026.html` — Q1 2026 industry trends (AI, sustainability, hybrid decline, rising costs)
- `news/technology-trade-show-landscape-2026.html` — Tech show landscape: AI/ML, Enterprise, Consumer, Cybersecurity, Cloud, Gaming categories
- `news/exhibitor-spending-trends-2026.html` — Budget trends & benchmarks by company size and industry

#### Navigation & Footer Updates (20+ files)
- **Main pages updated (9):** index.html, news.html, travel.html, products.html, city-shows.html, sponsor.html, media-kit.html, newsletter.html, vendors.html
- **Tool pages updated (11):** compare.html, map.html, lead-calculator.html, packing-list.html, cost-estimator.html, flight-deals.html, roi-calculator.html, budget-planner.html, checklist.html, toolkit.html, qr-generator.html
- **Standard footer now includes:**
  - Resources: Trade Shows, Products/News, Exhibitor Tips, Newsletter, Travel Guides, Flight Deals
  - Tools: Scannly, ROI Calculator, Cost Estimator, Lead Calculator, Show Comparison, Interactive Map, Packing List

#### New Files Added
- `/compare.html` — Show comparison tool
- `/map.html` — Interactive world map
- `/lead-calculator.html` — Lead value calculator
- `/packing-list.html` — Smart packing list generator
- `/cost-estimator.html` — Trip cost estimator
- `/flight-deals.html` — Flight & travel deals
- `/manifest.json` — PWA manifest
- `/sw.js` — Service worker (network-first cache)
- 13 new article HTML files in `/news/`

#### Deployment
- Pushed all changes to GitHub (main branch)
- Deployed to Vercel with `--archive=tgz`
- Live at https://showfloortips.com
