#!/usr/bin/env python3
"""Generate 10 industry landing pages for ShowFloorTips."""
import os

INDUSTRIES = [
    {
        "slug": "technology",
        "name": "Technology",
        "category": "Technology",
        "title": "Best Technology Trade Shows 2026 — CES, MWC & 1,200+ Tech Expos",
        "description": "Browse 1,200+ technology trade shows worldwide. Find the best tech expos for AI, cybersecurity, SaaS, consumer electronics, and enterprise software in 2026.",
        "h1": "Technology Trade Shows",
        "intro": "From CES in Las Vegas to Mobile World Congress in Barcelona, technology trade shows are where the future gets unveiled. Whether you're exhibiting AI solutions, SaaS platforms, cybersecurity tools, or consumer electronics, these events connect you with buyers, investors, and partners who drive the tech industry forward.",
        "keywords": "technology trade shows, tech expos 2026, CES, MWC, cybersecurity conferences, SaaS events, AI trade shows, consumer electronics expo",
        "icon": "💻",
        "count": "1,200+"
    },
    {
        "slug": "healthcare",
        "name": "Healthcare",
        "category": "Healthcare",
        "title": "Best Healthcare Trade Shows 2026 — HIMSS, RSNA & 990+ Medical Expos",
        "description": "Browse 990+ healthcare trade shows and medical conferences. Find the best events for medtech, pharma, hospital equipment, and digital health in 2026.",
        "h1": "Healthcare Trade Shows",
        "intro": "Healthcare trade shows are where medical innovation meets the practitioners who adopt it. From HIMSS and RSNA to regional medtech expos, these events showcase everything from surgical robotics to electronic health records. Whether you're a device manufacturer, pharma company, or health IT vendor, these shows put you in front of decision-makers.",
        "keywords": "healthcare trade shows, medical conferences 2026, HIMSS, RSNA, medtech expos, pharma trade shows, hospital equipment, digital health events",
        "icon": "🏥",
        "count": "990+"
    },
    {
        "slug": "manufacturing",
        "name": "Manufacturing",
        "category": "Manufacturing",
        "title": "Best Manufacturing Trade Shows 2026 — IMTS, Hannover Messe & 940+ Expos",
        "description": "Browse 940+ manufacturing trade shows worldwide. Find events for CNC, automation, robotics, 3D printing, and industrial equipment in 2026.",
        "h1": "Manufacturing Trade Shows",
        "intro": "Manufacturing trade shows are the backbone of industrial commerce. Events like IMTS, Hannover Messe, and FABTECH bring together machine tool builders, automation specialists, and industrial buyers under one roof. If you make things that make things, these shows are where deals happen.",
        "keywords": "manufacturing trade shows, IMTS, Hannover Messe, FABTECH, CNC expos, automation trade shows, robotics events, industrial equipment",
        "icon": "🏭",
        "count": "940+"
    },
    {
        "slug": "food-beverage",
        "name": "Food & Beverage",
        "category": "Food & Beverage",
        "title": "Best Food & Beverage Trade Shows 2026 — NRA Show, Expo West & 920+ Events",
        "description": "Browse 920+ food and beverage trade shows. Find events for restaurant equipment, natural products, specialty foods, and food tech in 2026.",
        "h1": "Food & Beverage Trade Shows",
        "intro": "Food and beverage trade shows are where products get discovered, distributors sign deals, and restaurant chains find their next menu innovation. From the NRA Show in Chicago to Natural Products Expo West in Anaheim, these events drive billions in food industry commerce every year.",
        "keywords": "food trade shows, beverage expos 2026, NRA Show, Expo West, specialty food events, restaurant equipment, food tech, natural products",
        "icon": "🍽️",
        "count": "920+"
    },
    {
        "slug": "construction",
        "name": "Construction",
        "category": "Construction",
        "title": "Best Construction Trade Shows 2026 — CONEXPO, World of Concrete & 900+ Events",
        "description": "Browse 900+ construction trade shows worldwide. Find events for heavy equipment, building materials, architecture, and infrastructure in 2026.",
        "h1": "Construction Trade Shows",
        "intro": "Construction trade shows put massive equipment, cutting-edge building materials, and infrastructure innovation all in one place. CONEXPO-CON/AGG, World of Concrete, and The Buildings Show are where contractors, architects, and developers come to source, compare, and buy. If you serve the built environment, these events deliver qualified leads at scale.",
        "keywords": "construction trade shows, CONEXPO, World of Concrete, building materials expo, heavy equipment shows, architecture events, infrastructure trade shows",
        "icon": "🏗️",
        "count": "900+"
    },
    {
        "slug": "automotive",
        "name": "Automotive",
        "category": "Automotive",
        "title": "Best Automotive Trade Shows 2026 — SEMA, Detroit Auto Show & 880+ Events",
        "description": "Browse 880+ automotive trade shows worldwide. Find events for EV, aftermarket, auto parts, motorsports, and connected vehicles in 2026.",
        "h1": "Automotive Trade Shows",
        "intro": "Automotive trade shows are transforming as the industry shifts to electric vehicles, autonomous driving, and connected mobility. From SEMA and the Detroit Auto Show to Automechanika, these events bring together OEMs, aftermarket suppliers, fleet managers, and tech companies redefining transportation.",
        "keywords": "automotive trade shows, SEMA, Detroit Auto Show, EV expos, auto parts shows, aftermarket events, connected vehicles, motorsports",
        "icon": "🚗",
        "count": "880+"
    },
    {
        "slug": "energy",
        "name": "Energy",
        "category": "Energy",
        "title": "Best Energy Trade Shows 2026 — OTC, Solar Power & 870+ Events",
        "description": "Browse 870+ energy trade shows worldwide. Find events for oil & gas, solar, wind, nuclear, and clean energy technology in 2026.",
        "h1": "Energy Trade Shows",
        "intro": "Energy trade shows span the full spectrum from oil and gas to solar, wind, and hydrogen. Events like OTC, Solar Power International, and WindEnergy Hamburg connect producers, utilities, and technology providers in an industry undergoing its biggest transformation in a century.",
        "keywords": "energy trade shows, OTC, Solar Power International, oil gas conferences, renewable energy expos, clean energy events, wind energy, hydrogen",
        "icon": "⚡",
        "count": "870+"
    },
    {
        "slug": "fashion-beauty",
        "name": "Fashion & Beauty",
        "category": "Fashion & Beauty",
        "title": "Best Fashion & Beauty Trade Shows 2026 — Cosmoprof, MAGIC & 830+ Events",
        "description": "Browse 830+ fashion and beauty trade shows. Find events for cosmetics, apparel, accessories, skincare, and retail fashion in 2026.",
        "h1": "Fashion & Beauty Trade Shows",
        "intro": "Fashion and beauty trade shows are where trends become products and products become brands. From Cosmoprof and Beautycon to MAGIC and Premiere Vision, these events connect designers, manufacturers, retailers, and influencers across the entire style ecosystem.",
        "keywords": "fashion trade shows, beauty expos 2026, Cosmoprof, MAGIC, cosmetics events, apparel trade shows, skincare, retail fashion",
        "icon": "👗",
        "count": "830+"
    },
    {
        "slug": "defense-security",
        "name": "Defense & Security",
        "category": "Defense & Security",
        "title": "Best Defense & Security Trade Shows 2026 — AUSA, ISC West & 780+ Events",
        "description": "Browse 780+ defense and security trade shows. Find events for military equipment, cybersecurity, homeland security, and surveillance tech in 2026.",
        "h1": "Defense & Security Trade Shows",
        "intro": "Defense and security trade shows are high-stakes events where governments, military branches, and security firms evaluate next-generation equipment. Events like AUSA, ISC West, DSEI, and IDEX bring together defense contractors, cybersecurity firms, and public safety agencies with budgets measured in billions.",
        "keywords": "defense trade shows, security expos 2026, AUSA, ISC West, DSEI, military equipment, cybersecurity events, homeland security",
        "icon": "🛡️",
        "count": "780+"
    },
    {
        "slug": "education",
        "name": "Education",
        "category": "Education",
        "title": "Best Education Trade Shows 2026 — ISTE, BETT & 770+ Events",
        "description": "Browse 770+ education trade shows and conferences. Find events for edtech, higher education, K-12, and learning innovation in 2026.",
        "h1": "Education Trade Shows",
        "intro": "Education trade shows bring together the tools, technology, and ideas that shape how people learn. From ISTE and BETT to regional education conferences, these events connect edtech companies, publishers, and school administrators with the solutions transforming classrooms worldwide.",
        "keywords": "education trade shows, edtech conferences 2026, ISTE, BETT, higher education expos, K-12 events, learning technology, school administration",
        "icon": "📚",
        "count": "770+"
    }
]

TEMPLATE = '''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title} | ShowFloorTips</title>
    <meta name="description" content="{description}">
    <meta name="keywords" content="{keywords}">
    <meta property="og:title" content="{title}">
    <meta property="og:description" content="{description}">
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://showfloortips.com/industries/{slug}.html">
    <meta name="twitter:card" content="summary_large_image">
    <link rel="canonical" href="https://showfloortips.com/industries/{slug}.html">
    <link rel="stylesheet" href="/styles.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <script type="application/ld+json">
    {{
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "name": "{h1} — ShowFloorTips",
        "description": "{description}",
        "url": "https://showfloortips.com/industries/{slug}.html",
        "publisher": {{"@type": "Organization", "name": "ShowFloorTips", "url": "https://showfloortips.com"}},
        "breadcrumb": {{
            "@type": "BreadcrumbList",
            "itemListElement": [
                {{"@type": "ListItem", "position": 1, "name": "Home", "item": "https://showfloortips.com"}},
                {{"@type": "ListItem", "position": 2, "name": "Industries", "item": "https://showfloortips.com/industries/"}},
                {{"@type": "ListItem", "position": 3, "name": "{name}", "item": "https://showfloortips.com/industries/{slug}.html"}}
            ]
        }}
    }}
    </script>
    <style>
        .ind-hero {{ background: #0a0a0a; color: #fff; padding: 4rem 2rem 3rem; text-align: center }}
        .ind-hero h1 {{ font-size: 2.6rem; font-weight: 800; letter-spacing: -0.03em; margin-bottom: 0.75rem }}
        .ind-hero .icon {{ font-size: 3rem; margin-bottom: 1rem; display: block }}
        .ind-hero p {{ font-size: 1.05rem; color: #94a3b8; max-width: 640px; margin: 0 auto; line-height: 1.7 }}
        .ind-hero .stats {{ display: flex; justify-content: center; gap: 2.5rem; margin-top: 2rem; flex-wrap: wrap }}
        .ind-hero .stat {{ text-align: center }}
        .ind-hero .stat-num {{ font-size: 1.75rem; font-weight: 800 }}
        .ind-hero .stat-label {{ font-size: 0.8rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 0.25rem }}
        .ind-nav {{ display: flex; flex-wrap: wrap; gap: 0.5rem; justify-content: center; padding: 1.5rem 2rem; background: #f8fafc; border-bottom: 1px solid #e2e8f0 }}
        .ind-nav a {{ padding: 0.4rem 0.85rem; border-radius: 6px; font-size: 0.82rem; font-weight: 500; color: #475569; text-decoration: none; transition: background 0.2s }}
        .ind-nav a:hover {{ background: #e2e8f0; color: #0a0a0a }}
        .ind-nav a.active {{ background: #0a0a0a; color: #fff }}
        .ind-content {{ max-width: 1000px; margin: 0 auto; padding: 2rem }}
        .ind-intro {{ font-size: 1.05rem; color: #334155; line-height: 1.85; margin-bottom: 2rem; padding: 1.5rem; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0 }}
        .ind-filters {{ display: flex; gap: 1rem; flex-wrap: wrap; margin-bottom: 1.5rem; align-items: center }}
        .ind-filters select, .ind-filters input {{ padding: 0.6rem 1rem; border: 1px solid #d1d5db; border-radius: 8px; font-size: 0.9rem; font-family: inherit }}
        .ind-filters input {{ flex: 1; min-width: 200px }}
        .ind-count {{ font-size: 0.9rem; color: #64748b; margin-bottom: 1rem }}
        .show-grid {{ display: flex; flex-direction: column; gap: 1rem }}
        .show-card {{ background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1.5rem; display: grid; grid-template-columns: 1fr auto; gap: 1rem; align-items: start; transition: border-color 0.2s, box-shadow 0.2s }}
        .show-card:hover {{ border-color: #334155; box-shadow: 0 4px 16px rgba(0,0,0,0.06) }}
        .show-card h3 {{ font-size: 1.05rem; font-weight: 700; margin-bottom: 0.4rem }}
        .show-card h3 a {{ color: #0a0a0a; text-decoration: none }}
        .show-card h3 a:hover {{ color: #334155 }}
        .show-meta {{ display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.5rem }}
        .show-tag {{ display: inline-flex; align-items: center; gap: 0.25rem; background: #f1f5f9; color: #475569; font-size: 0.78rem; padding: 0.25rem 0.6rem; border-radius: 5px; font-weight: 500 }}
        .show-desc {{ font-size: 0.88rem; color: #64748b; line-height: 1.6 }}
        .show-action {{ display: flex; flex-direction: column; align-items: flex-end; gap: 0.4rem; min-width: 110px }}
        .btn-view {{ display: inline-block; padding: 0.6rem 1.1rem; background: #0a0a0a; color: #fff; border-radius: 8px; font-size: 0.82rem; font-weight: 600; text-decoration: none; transition: background 0.2s; white-space: nowrap }}
        .btn-view:hover {{ background: #1e293b }}
        .show-date {{ font-size: 0.82rem; color: #64748b; font-weight: 500 }}
        .load-more {{ text-align: center; margin: 2rem 0 }}
        .load-more button {{ padding: 0.875rem 2.5rem; background: #0a0a0a; color: #fff; border: none; border-radius: 10px; font-size: 0.95rem; font-weight: 600; cursor: pointer }}
        .load-more button:hover {{ background: #1e293b }}
        .scannly-cta {{ background: #eef2ff; border: 1px solid #c7d2fe; border-radius: 16px; padding: 2rem; text-align: center; margin: 2.5rem 0 }}
        .scannly-cta h3 {{ font-size: 1.2rem; font-weight: 700; color: #1e293b; margin-bottom: 0.5rem }}
        .scannly-cta p {{ color: #475569; font-size: 0.9rem; margin-bottom: 1rem }}
        .scannly-cta a {{ display: inline-block; padding: 0.75rem 1.75rem; background: #6366f1; color: #fff; border-radius: 10px; font-weight: 600; text-decoration: none }}
        .related-articles {{ margin: 2.5rem 0 }}
        .related-articles h2 {{ font-size: 1.3rem; font-weight: 700; margin-bottom: 1rem }}
        .article-cards {{ display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem }}
        .article-card {{ background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 1.25rem; transition: border-color 0.2s }}
        .article-card:hover {{ border-color: #334155 }}
        .article-card h4 {{ font-size: 0.92rem; font-weight: 600; margin-bottom: 0.4rem }}
        .article-card h4 a {{ color: #0a0a0a; text-decoration: none }}
        .article-card p {{ font-size: 0.82rem; color: #64748b; line-height: 1.5 }}
        @media(max-width:768px) {{
            .ind-hero h1 {{ font-size: 1.6rem }}
            .show-card {{ grid-template-columns: 1fr }}
            .show-action {{ flex-direction: row; align-items: center }}
        }}
    </style>
</head>
<body>
    <header class="header">
        <div class="header-inner">
            <a href="/" class="logo">ShowFloorTips</a>
            <nav>
                <ul class="nav-links">
                    <li><a href="/#shows">Trade Shows</a></li>
                    <li><a href="/this-week.html">This Week</a></li>
                    <li><a href="/news.html">News</a></li>
                    <li><a href="/travel.html">Travel</a></li>
                    <li><a href="/venue-maps.html">Maps</a></li>
                    <li><a href="/roi-calculator.html">ROI Calculator</a></li>
                    <li><a href="/guide.html">Guide</a></li>
                    <li><a href="/products.html">Products</a></li>
                    <li><a href="/scannly.html" class="nav-cta">Try Scannly</a></li>
                </ul>
            </nav>
            <button id="darkModeToggle" onclick="toggleDarkMode()" aria-label="Toggle dark mode" style="background:none;border:none;cursor:pointer;padding:4px;color:var(--gray-500);display:flex;align-items:center">
                <svg id="darkIcon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                <svg id="lightIcon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:none"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
            </button>
            <button class="mobile-menu-btn" onclick="document.querySelector('.nav-links').classList.toggle('show')" aria-label="Menu">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
        </div>
    </header>

    <div class="ind-nav">
        <a href="/industries/technology.html"{active_tech}>Technology</a>
        <a href="/industries/healthcare.html"{active_health}>Healthcare</a>
        <a href="/industries/manufacturing.html"{active_mfg}>Manufacturing</a>
        <a href="/industries/food-beverage.html"{active_food}>Food & Beverage</a>
        <a href="/industries/construction.html"{active_const}>Construction</a>
        <a href="/industries/automotive.html"{active_auto}>Automotive</a>
        <a href="/industries/energy.html"{active_energy}>Energy</a>
        <a href="/industries/fashion-beauty.html"{active_fashion}>Fashion & Beauty</a>
        <a href="/industries/defense-security.html"{active_defense}>Defense & Security</a>
        <a href="/industries/education.html"{active_edu}>Education</a>
    </div>

    <section class="ind-hero">
        <span class="icon">{icon}</span>
        <h1>{h1}</h1>
        <p>{intro_short}</p>
        <div class="stats">
            <div class="stat"><div class="stat-num" id="showCount">...</div><div class="stat-label">Shows Found</div></div>
            <div class="stat"><div class="stat-num" id="countryCount">...</div><div class="stat-label">Countries</div></div>
            <div class="stat"><div class="stat-num" id="cityCount">...</div><div class="stat-label">Cities</div></div>
        </div>
    </section>

    <div class="ind-content">
        <div class="ind-intro">{intro}</div>

        <div class="ind-filters">
            <input type="text" id="searchInput" placeholder="Search {name_lower} shows...">
            <select id="sortSelect">
                <option value="date-asc">Soonest First</option>
                <option value="date-desc">Latest First</option>
                <option value="name-asc">A–Z</option>
                <option value="name-desc">Z–A</option>
            </select>
            <select id="countryFilter">
                <option value="">All Countries</option>
            </select>
        </div>

        <p class="ind-count">Showing <strong id="visibleCount">0</strong> of <strong id="totalCount">0</strong> {name_lower} trade shows</p>

        <div class="show-grid" id="showGrid"></div>

        <div class="load-more" id="loadMore" style="display:none">
            <button onclick="loadMore()">Load More Shows</button>
        </div>

        <div class="scannly-cta">
            <h3>Capture Every Lead at Your Next {name} Show</h3>
            <p>Scannly turns badge scans into qualified leads with AI-powered follow-up. Works at any {name_lower} trade show.</p>
            <a href="/scannly.html">Try Scannly Free</a>
        </div>

        <div class="related-articles" id="relatedArticles"></div>
    </div>

    <footer class="footer">
        <div class="footer-grid">
            <div class="footer-col">
                <h4>ShowFloorTips</h4>
                <p style="color:#94a3b8;font-size:0.85rem;line-height:1.6">The #1 trade show intelligence platform. 24,600+ shows across 120+ countries.</p>
            </div>
            <div class="footer-col">
                <h4>Resources</h4>
                <ul>
                    <li><a href="/guide.html">Ultimate Guide</a></li>
                    <li><a href="/travel.html">Travel Guides</a></li>
                    <li><a href="/news.html">Industry News</a></li>
                    <li><a href="/products.html">Products</a></li>
                </ul>
            </div>
            <div class="footer-col">
                <h4>Tools</h4>
                <ul>
                    <li><a href="/roi-calculator.html">ROI Calculator</a></li>
                    <li><a href="/compare.html">Compare Shows</a></li>
                    <li><a href="/venue-maps.html">Venue Maps</a></li>
                    <li><a href="/flight-deals.html">Flight Deals</a></li>
                </ul>
            </div>
            <div class="footer-col">
                <h4>Company</h4>
                <ul>
                    <li><a href="/sponsor.html">Sponsor With Us</a></li>
                    <li><a href="/media-kit.html">Media Kit</a></li>
                    <li><a href="/newsletter.html">Newsletter</a></li>
                </ul>
            </div>
        </div>
        <div class="footer-bottom">
            <p>&copy; 2026 ShowFloorTips. All rights reserved.</p>
        </div>
    </footer>

    <script src="/shows.js"></script>
    <script src="/news.js"></script>
    <script>
    (function() {{
        var CATEGORY = "{category}";
        var PAGE_SIZE = 25;
        var currentPage = 1;
        var filteredShows = [];

        // Get shows for this industry
        var allShows = (typeof defined_shows !== 'undefined' ? defined_shows : []).filter(function(s) {{
            return s.category === CATEGORY;
        }});

        // Stats
        var countries = {{}};
        var cities = {{}};
        allShows.forEach(function(s) {{
            if (s.country) countries[s.country] = 1;
            if (s.city) cities[s.city] = 1;
        }});
        document.getElementById('showCount').textContent = allShows.length.toLocaleString();
        document.getElementById('countryCount').textContent = Object.keys(countries).length;
        document.getElementById('cityCount').textContent = Object.keys(cities).length;
        document.getElementById('totalCount').textContent = allShows.length;

        // Populate country filter
        var countrySelect = document.getElementById('countryFilter');
        Object.keys(countries).sort().forEach(function(c) {{
            var opt = document.createElement('option');
            opt.value = c;
            opt.textContent = c;
            countrySelect.appendChild(opt);
        }});

        function formatDate(d) {{
            if (!d) return 'TBD';
            var parts = d.substring(0, 10).split('-');
            if (parts.length !== 3) return d;
            var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
            return months[parseInt(parts[1], 10) - 1] + ' ' + parseInt(parts[2], 10) + ', ' + parts[0];
        }}

        function filterAndSort() {{
            var q = document.getElementById('searchInput').value.toLowerCase();
            var country = document.getElementById('countryFilter').value;
            var sort = document.getElementById('sortSelect').value;

            filteredShows = allShows.filter(function(s) {{
                if (q && !((s.title || '').toLowerCase().includes(q) || (s.city || '').toLowerCase().includes(q) || (s.venue || '').toLowerCase().includes(q))) return false;
                if (country && s.country !== country) return false;
                return true;
            }});

            filteredShows.sort(function(a, b) {{
                if (sort === 'name-asc') return (a.title || '').localeCompare(b.title || '');
                if (sort === 'name-desc') return (b.title || '').localeCompare(a.title || '');
                var da = a.start_date || 'z';
                var db = b.start_date || 'z';
                return sort === 'date-desc' ? db.localeCompare(da) : da.localeCompare(db);
            }});

            currentPage = 1;
            render();
        }}

        function render() {{
            var grid = document.getElementById('showGrid');
            var visible = filteredShows.slice(0, currentPage * PAGE_SIZE);
            document.getElementById('visibleCount').textContent = visible.length;
            document.getElementById('totalCount').textContent = filteredShows.length;

            grid.innerHTML = visible.map(function(s) {{
                return '<div class="show-card">' +
                    '<div>' +
                        '<h3><a href="/shows/' + s.slug + '">' + (s.title || 'Untitled Show') + '</a></h3>' +
                        '<div class="show-meta">' +
                            (s.city ? '<span class="show-tag">📍 ' + s.city + (s.country ? ', ' + s.country : '') + '</span>' : '') +
                            (s.venue ? '<span class="show-tag">🏛️ ' + s.venue + '</span>' : '') +
                        '</div>' +
                        (s.description ? '<p class="show-desc">' + s.description.substring(0, 150) + (s.description.length > 150 ? '...' : '') + '</p>' : '') +
                    '</div>' +
                    '<div class="show-action">' +
                        '<a href="/shows/' + s.slug + '" class="btn-view">View Details</a>' +
                        '<span class="show-date">' + formatDate(s.start_date) + '</span>' +
                    '</div>' +
                '</div>';
            }}).join('');

            document.getElementById('loadMore').style.display = visible.length < filteredShows.length ? '' : 'none';
        }}

        window.loadMore = function() {{
            currentPage++;
            render();
        }};

        document.getElementById('searchInput').addEventListener('input', filterAndSort);
        document.getElementById('sortSelect').addEventListener('change', filterAndSort);
        document.getElementById('countryFilter').addEventListener('change', filterAndSort);

        // Related articles
        var relatedDiv = document.getElementById('relatedArticles');
        if (typeof NEWS_DATA !== 'undefined') {{
            var keywords = CATEGORY.toLowerCase().split(/[\\s&]+/);
            var related = NEWS_DATA.filter(function(a) {{
                var t = (a.title || '').toLowerCase() + ' ' + (a.summary || '').toLowerCase();
                return keywords.some(function(k) {{ return k.length > 2 && t.includes(k); }});
            }}).slice(0, 6);

            if (related.length > 0) {{
                relatedDiv.innerHTML = '<h2>Latest {name} Trade Show News</h2><div class="article-cards">' +
                    related.map(function(a) {{
                        return '<div class="article-card"><h4><a href="/' + a.url + '">' + a.title + '</a></h4><p>' + (a.summary || '').substring(0, 120) + '...</p></div>';
                    }}).join('') + '</div>';
            }}
        }}

        filterAndSort();
    }})();

    // Dark mode
    function toggleDarkMode() {{
        document.body.classList.toggle('dark-mode');
        var isDark = document.body.classList.contains('dark-mode');
        localStorage.setItem('darkMode', isDark);
        document.getElementById('darkIcon').style.display = isDark ? 'none' : '';
        document.getElementById('lightIcon').style.display = isDark ? '' : 'none';
    }}
    if (localStorage.getItem('darkMode') === 'true') {{ toggleDarkMode(); }}
    </script>
</body>
</html>'''

# Active class mappings
ACTIVE_MAP = {
    'technology': 'active_tech',
    'healthcare': 'active_health',
    'manufacturing': 'active_mfg',
    'food-beverage': 'active_food',
    'construction': 'active_const',
    'automotive': 'active_auto',
    'energy': 'active_energy',
    'fashion-beauty': 'active_fashion',
    'defense-security': 'active_defense',
    'education': 'active_edu'
}

BASE_DIR = '/Volumes/Willie Extr/tradeshow-website/industries'

for ind in INDUSTRIES:
    # Build active class replacements
    replacements = {}
    for key, val in ACTIVE_MAP.items():
        replacements[val] = ' class="active"' if key == ind['slug'] else ''

    html = TEMPLATE.format(
        title=ind['title'],
        description=ind['description'],
        keywords=ind['keywords'],
        h1=ind['h1'],
        icon=ind['icon'],
        intro=ind['intro'],
        intro_short=ind['description'],
        name=ind['name'],
        name_lower=ind['name'].lower(),
        slug=ind['slug'],
        category=ind['category'],
        count=ind['count'],
        **replacements
    )

    filepath = os.path.join(BASE_DIR, f'{ind["slug"]}.html')
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(html)
    print(f'Created {filepath}')

# Create industries index page
index_html = '''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Trade Shows by Industry — Browse 24,600+ Events | ShowFloorTips</title>
    <meta name="description" content="Browse trade shows organized by industry. Technology, healthcare, manufacturing, food, construction, automotive, energy, fashion, defense, and education events worldwide.">
    <link rel="canonical" href="https://showfloortips.com/industries/">
    <link rel="stylesheet" href="/styles.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "name": "Trade Shows by Industry — ShowFloorTips",
        "description": "Browse trade shows organized by industry. 24,600+ events across 10 major industries.",
        "url": "https://showfloortips.com/industries/",
        "publisher": {"@type": "Organization", "name": "ShowFloorTips"}
    }
    </script>
    <style>
        .ind-hero { background: #0a0a0a; color: #fff; padding: 4rem 2rem 3rem; text-align: center }
        .ind-hero h1 { font-size: 2.6rem; font-weight: 800; letter-spacing: -0.03em; margin-bottom: 0.75rem }
        .ind-hero p { font-size: 1.05rem; color: #94a3b8; max-width: 640px; margin: 0 auto; line-height: 1.7 }
        .ind-grid { max-width: 1000px; margin: 2rem auto; padding: 0 2rem; display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.25rem }
        .ind-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 2rem; text-align: center; transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s; text-decoration: none; color: inherit; display: block }
        .ind-card:hover { border-color: #334155; box-shadow: 0 8px 24px rgba(0,0,0,0.08); transform: translateY(-2px) }
        .ind-card .icon { font-size: 2.5rem; margin-bottom: 0.75rem; display: block }
        .ind-card h2 { font-size: 1.15rem; font-weight: 700; color: #0a0a0a; margin-bottom: 0.5rem }
        .ind-card p { font-size: 0.88rem; color: #64748b; line-height: 1.5; margin-bottom: 0.75rem }
        .ind-card .count { font-size: 0.82rem; font-weight: 600; color: #334155; background: #f1f5f9; display: inline-block; padding: 0.3rem 0.75rem; border-radius: 6px }
    </style>
</head>
<body>
    <header class="header">
        <div class="header-inner">
            <a href="/" class="logo">ShowFloorTips</a>
            <nav>
                <ul class="nav-links">
                    <li><a href="/#shows">Trade Shows</a></li>
                    <li><a href="/this-week.html">This Week</a></li>
                    <li><a href="/news.html">News</a></li>
                    <li><a href="/travel.html">Travel</a></li>
                    <li><a href="/venue-maps.html">Maps</a></li>
                    <li><a href="/roi-calculator.html">ROI Calculator</a></li>
                    <li><a href="/guide.html">Guide</a></li>
                    <li><a href="/products.html">Products</a></li>
                    <li><a href="/scannly.html" class="nav-cta">Try Scannly</a></li>
                </ul>
            </nav>
            <button class="mobile-menu-btn" onclick="document.querySelector('.nav-links').classList.toggle('show')" aria-label="Menu">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
        </div>
    </header>

    <section class="ind-hero">
        <h1>Trade Shows by Industry</h1>
        <p>Browse 24,600+ trade shows organized by the 10 largest industries. Find the events that matter most to your business.</p>
    </section>

    <div class="ind-grid">
''' + ''.join([f'''        <a href="/industries/{ind['slug']}.html" class="ind-card">
            <span class="icon">{ind['icon']}</span>
            <h2>{ind['name']} Trade Shows</h2>
            <p>{ind['description'][:100]}...</p>
            <span class="count">{ind['count']} Shows</span>
        </a>
''' for ind in INDUSTRIES]) + '''    </div>

    <footer class="footer">
        <div class="footer-grid">
            <div class="footer-col">
                <h4>ShowFloorTips</h4>
                <p style="color:#94a3b8;font-size:0.85rem;line-height:1.6">The #1 trade show intelligence platform.</p>
            </div>
            <div class="footer-col">
                <h4>Resources</h4>
                <ul>
                    <li><a href="/guide.html">Ultimate Guide</a></li>
                    <li><a href="/travel.html">Travel Guides</a></li>
                    <li><a href="/news.html">Industry News</a></li>
                </ul>
            </div>
            <div class="footer-col">
                <h4>Tools</h4>
                <ul>
                    <li><a href="/roi-calculator.html">ROI Calculator</a></li>
                    <li><a href="/compare.html">Compare Shows</a></li>
                    <li><a href="/venue-maps.html">Venue Maps</a></li>
                </ul>
            </div>
            <div class="footer-col">
                <h4>Company</h4>
                <ul>
                    <li><a href="/sponsor.html">Sponsor With Us</a></li>
                    <li><a href="/media-kit.html">Media Kit</a></li>
                    <li><a href="/newsletter.html">Newsletter</a></li>
                </ul>
            </div>
        </div>
        <div class="footer-bottom">
            <p>&copy; 2026 ShowFloorTips. All rights reserved.</p>
        </div>
    </footer>
</body>
</html>'''

with open(os.path.join(BASE_DIR, 'index.html'), 'w', encoding='utf-8') as f:
    f.write(index_html)
print(f'Created {BASE_DIR}/index.html')

print('\nDone! Created 11 industry pages.')
