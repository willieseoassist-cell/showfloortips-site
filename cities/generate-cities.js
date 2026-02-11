#!/usr/bin/env node
// City page generator for ShowFloorTips
// Run: node generate-cities.js
// Generates 20 city landing pages + index.html

const fs = require('fs');
const path = require('path');

const CITIES = [
    { name: 'Las Vegas', slug: 'las-vegas', state: 'Nevada', stateSlug: null, statePage: null,
      intro: 'Las Vegas is the undisputed trade show capital of the world. Home to the Las Vegas Convention Center and the Mandalay Bay Convention Center, the city hosts more major trade shows than any other destination. From CES and CONEXPO to MAGIC and SEMA, Las Vegas offers unmatched venue capacity, world-class hospitality, and seamless logistics.',
      venues: 'Las Vegas Convention Center, Mandalay Bay Convention Center, Venetian Expo, Wynn Las Vegas, MGM Grand Conference Center',
      travelGuide: true },
    { name: 'Chicago', slug: 'chicago', state: 'Illinois', stateSlug: 'illinois', statePage: '/states/illinois.html',
      intro: 'Chicago is a premier trade show city with deep roots in American industry and commerce. McCormick Place, the largest convention center in North America, hosts hundreds of major events each year. The city\'s central location, world-class dining, and robust transportation network make it a natural hub for exhibitions.',
      venues: 'McCormick Place, Navy Pier, Hyatt Regency Chicago, Marriott Marquis Chicago',
      travelGuide: true },
    { name: 'Orlando', slug: 'orlando', state: 'Florida', stateSlug: 'florida', statePage: '/states/florida.html',
      intro: 'Orlando is a powerhouse trade show destination, anchored by the Orange County Convention Center, one of the largest convention facilities in the United States. The city\'s tourism infrastructure, warm climate, and proximity to major theme parks make it an attractive choice for large-scale industry events.',
      venues: 'Orange County Convention Center, Rosen Shingle Creek, Gaylord Palms Resort & Convention Center',
      travelGuide: true },
    { name: 'New York', slug: 'new-york', state: 'New York', stateSlug: 'new-york', statePage: '/states/new-york.html',
      intro: 'New York City is a global epicenter for trade shows spanning fashion, technology, media, finance, and luxury goods. The Javits Center on Manhattan\'s west side serves as the primary convention venue, while countless boutique events take place across the five boroughs.',
      venues: 'Jacob K. Javits Convention Center, Pier 36, Metropolitan Pavilion, Brooklyn Expo Center',
      travelGuide: true },
    { name: 'Anaheim', slug: 'anaheim', state: 'California', stateSlug: 'california', statePage: '/states/california.html',
      intro: 'Anaheim is one of America\'s most visited trade show cities, home to the Anaheim Convention Center, the largest convention center on the West Coast. Its proximity to Disneyland Resort and excellent Southern California weather make it a top draw for major national events.',
      venues: 'Anaheim Convention Center, Anaheim Marriott, Hilton Anaheim',
      travelGuide: true },
    { name: 'San Francisco', slug: 'san-francisco', state: 'California', stateSlug: 'california', statePage: '/states/california.html',
      intro: 'San Francisco and the broader Bay Area are at the heart of the technology trade show circuit. Events like RSA Conference, Dreamforce, and GDC attract hundreds of thousands of tech professionals each year. The Moscone Center serves as the primary venue, while the region\'s concentration of tech companies creates an unrivaled innovation ecosystem.',
      venues: 'Moscone Center (North, South, West), Fort Mason Center, The Midway',
      travelGuide: true },
    { name: 'Atlanta', slug: 'atlanta', state: 'Georgia', stateSlug: null, statePage: null,
      intro: 'Atlanta serves as the convention capital of the Southeast, anchored by the Georgia World Congress Center, one of the largest convention complexes in the country. Hartsfield-Jackson International Airport, the busiest in the world, makes Atlanta exceptionally accessible for exhibitors and attendees.',
      venues: 'Georgia World Congress Center, Atlanta Convention Center at AmericasMart, Cobb Galleria Centre',
      travelGuide: true },
    { name: 'Houston', slug: 'houston', state: 'Texas', stateSlug: 'texas', statePage: '/states/texas.html',
      intro: 'Houston is the undisputed capital of energy trade shows, home to events like OTC (Offshore Technology Conference) and CERAWeek. The George R. Brown Convention Center and NRG Center host major industrial, medical, and technology exhibitions. Deep ties to oil, gas, aerospace, and healthcare make Houston a must-visit.',
      venues: 'George R. Brown Convention Center, NRG Center, NRG Arena, Marriott Marquis Houston',
      travelGuide: true },
    { name: 'Dallas', slug: 'dallas', state: 'Texas', stateSlug: 'texas', statePage: '/states/texas.html',
      intro: 'Dallas is a rapidly growing trade show market, bolstered by the Kay Bailey Hutchison Convention Center and a thriving business ecosystem. The city\'s central U.S. location, pro-business climate, and expanding infrastructure attract events across technology, retail, manufacturing, and livestock industries.',
      venues: 'Kay Bailey Hutchison Convention Center, Dallas Market Center, Irving Convention Center at Las Colinas',
      travelGuide: true },
    { name: 'San Diego', slug: 'san-diego', state: 'California', stateSlug: 'california', statePage: '/states/california.html',
      intro: 'San Diego is a premier trade show city known for its perfect weather, the San Diego Convention Center, and a vibrant waterfront location. The city hosts major events in biotechnology, defense, entertainment, and hospitality. San Diego\'s quality of life and research institutions make it a magnet for specialized industry gatherings.',
      venues: 'San Diego Convention Center, Manchester Grand Hyatt, Town and Country Resort',
      travelGuide: true },
    { name: 'Boston', slug: 'boston', state: 'Massachusetts', stateSlug: null, statePage: null,
      intro: 'Boston is a leading trade show city for healthcare, biotechnology, education, and technology. The Boston Convention and Exhibition Center (BCEC) hosts major events that draw from the city\'s world-renowned universities and research institutions. The concentration of hospitals, biotech firms, and tech startups creates a rich attendee base.',
      venues: 'Boston Convention and Exhibition Center (BCEC), Hynes Convention Center, Seaport World Trade Center',
      travelGuide: false },
    { name: 'Denver', slug: 'denver', state: 'Colorado', stateSlug: null, statePage: null,
      intro: 'Denver has emerged as a fast-growing trade show destination, offering the Colorado Convention Center and a rapidly expanding metro area. The city\'s central location, outdoor lifestyle, and booming tech scene attract events in energy, cannabis, outdoor recreation, and technology.',
      venues: 'Colorado Convention Center, National Western Complex, Gaylord Rockies Resort & Convention Center',
      travelGuide: false },
    { name: 'Philadelphia', slug: 'philadelphia', state: 'Pennsylvania', stateSlug: null, statePage: null,
      intro: 'Philadelphia offers a strong trade show market rooted in healthcare, pharmaceuticals, manufacturing, and life sciences. The Pennsylvania Convention Center, located in the heart of Center City, provides modern facilities for large-scale events. Its position along the Northeast Corridor makes it convenient and accessible.',
      venues: 'Pennsylvania Convention Center, Philadelphia Convention & Visitors Bureau, The Fillmore Philadelphia',
      travelGuide: false },
    { name: 'Nashville', slug: 'nashville', state: 'Tennessee', stateSlug: null, statePage: null,
      intro: 'Nashville is one of the fastest-rising trade show cities in the United States. The Music City Center, a state-of-the-art convention facility, has transformed the city into a serious contender for major national events. Beyond its famous music scene, Nashville draws shows in healthcare, technology, food and beverage, and franchise industries.',
      venues: 'Music City Center, Gaylord Opryland Resort & Convention Center, Nashville Fairgrounds',
      travelGuide: false },
    { name: 'Miami', slug: 'miami', state: 'Florida', stateSlug: 'florida', statePage: '/states/florida.html',
      intro: 'Miami is a vibrant trade show city with a unique position as a gateway between North America and Latin America. The Miami Beach Convention Center hosts major events in art, boating, hospitality, and luxury goods. The city\'s international flavor, warm climate, and growing tech scene make it increasingly popular for global exhibitions.',
      venues: 'Miami Beach Convention Center, Mana Wynwood Convention Center, Miami Airport Convention Center',
      travelGuide: false },
    { name: 'New Orleans', slug: 'new-orleans', state: 'Louisiana', stateSlug: null, statePage: null,
      intro: 'New Orleans combines world-class convention facilities with unmatched culture, cuisine, and hospitality. The Ernest N. Morial Convention Center, one of the largest in the country, hosts major events in energy, food service, healthcare, and technology. The city\'s French Quarter charm and legendary dining scene make every trade show visit memorable.',
      venues: 'Ernest N. Morial Convention Center, New Orleans Marriott, Hilton New Orleans Riverside',
      travelGuide: false },
    { name: 'Phoenix', slug: 'phoenix', state: 'Arizona', stateSlug: null, statePage: null,
      intro: 'Phoenix is a growing trade show market, offering the Phoenix Convention Center and year-round warm weather. The city\'s expanding population, business-friendly environment, and proximity to major Western markets make it an attractive option for events in technology, real estate, agriculture, and automotive industries.',
      venues: 'Phoenix Convention Center, Arizona Grand Resort & Spa, Scottsdale Convention Center',
      travelGuide: false },
    { name: 'Minneapolis', slug: 'minneapolis', state: 'Minnesota', stateSlug: null, statePage: null,
      intro: 'Minneapolis is a strong Midwestern trade show city, home to the Minneapolis Convention Center and a diverse economy that spans healthcare, agriculture, retail, and technology. The city\'s corporate headquarters concentration, cultural amenities, and efficient infrastructure make it a reliable host for national and regional exhibitions.',
      venues: 'Minneapolis Convention Center, Hyatt Regency Minneapolis, Minneapolis Marriott City Center',
      travelGuide: false },
    { name: 'Detroit', slug: 'detroit', state: 'Michigan', stateSlug: null, statePage: null,
      intro: 'Detroit is experiencing a trade show renaissance, driven by the Huntington Place convention center and the city\'s deep roots in automotive, manufacturing, and technology. The revitalized downtown, combined with Detroit\'s engineering talent pool and industrial heritage, makes it a natural home for manufacturing, mobility, and innovation events.',
      venues: 'Huntington Place (formerly TCF Center), Suburban Collection Showplace, Detroit Marriott at the Renaissance Center',
      travelGuide: false },
    { name: 'Seattle', slug: 'seattle', state: 'Washington', stateSlug: null, statePage: null,
      intro: 'Seattle is a key trade show city for technology, aerospace, maritime, and outdoor industries. The Washington State Convention Center and the city\'s thriving tech ecosystem, home to Amazon, Microsoft, and Boeing, draw specialized events from around the world. Seattle\'s innovation culture and Pacific Rim connections add global reach.',
      venues: 'Washington State Convention Center, Seattle Convention Center Summit, CenturyLink Field Event Center',
      travelGuide: false },
];

// City-to-state mapping for state page links
const STATE_MAP = {
    'Nevada': null,
    'Illinois': '/states/illinois.html',
    'Florida': '/states/florida.html',
    'New York': '/states/new-york.html',
    'California': '/states/california.html',
    'Georgia': null,
    'Texas': '/states/texas.html',
    'Massachusetts': null,
    'Colorado': null,
    'Pennsylvania': null,
    'Tennessee': null,
    'Louisiana': null,
    'Arizona': null,
    'Minnesota': null,
    'Michigan': null,
    'Washington': null,
};

// Notable industries per city for the "Popular Industries" section
const CITY_INDUSTRIES = {
    'Las Vegas': ['Technology & Electronics', 'Construction & Mining', 'Retail & Fashion', 'Food & Beverage', 'Automotive', 'Gaming & Entertainment'],
    'Chicago': ['Manufacturing', 'Food & Beverage', 'Healthcare', 'Technology', 'Architecture & Design', 'Printing & Packaging'],
    'Orlando': ['Healthcare & Medical', 'Theme Parks & Entertainment', 'Hospitality & Tourism', 'Technology', 'Education', 'Food Service'],
    'New York': ['Fashion & Beauty', 'Finance & Fintech', 'Media & Advertising', 'Technology', 'Art & Design', 'Real Estate'],
    'Anaheim': ['Food & Beverage', 'Technology', 'Education', 'Natural Products', 'Music & Entertainment', 'Dental & Medical'],
    'San Francisco': ['Technology & SaaS', 'Cybersecurity', 'Gaming & VR', 'Biotech & Life Sciences', 'Venture Capital', 'Clean Energy'],
    'Atlanta': ['Food Service', 'Technology', 'Flooring & Design', 'Security', 'Poultry & Agriculture', 'Healthcare'],
    'Houston': ['Oil & Gas', 'Aerospace', 'Healthcare', 'Petrochemical', 'Construction', 'Marine & Offshore'],
    'Dallas': ['Technology', 'Retail', 'Livestock & Agriculture', 'Manufacturing', 'Real Estate', 'Energy'],
    'San Diego': ['Biotechnology', 'Defense & Military', 'Comics & Entertainment', 'Hospitality', 'Medical Devices', 'Clean Tech'],
    'Boston': ['Biotechnology', 'Healthcare', 'Education', 'Technology', 'Life Sciences', 'Robotics & AI'],
    'Denver': ['Cannabis', 'Outdoor Recreation', 'Energy', 'Technology', 'Mining', 'Craft Beverages'],
    'Philadelphia': ['Pharmaceuticals', 'Healthcare', 'Manufacturing', 'Life Sciences', 'Food & Beverage', 'Education'],
    'Nashville': ['Healthcare', 'Music & Entertainment', 'Food & Beverage', 'Franchise', 'Technology', 'Hospitality'],
    'Miami': ['Art & Design', 'Boating & Marine', 'Hospitality', 'Luxury Goods', 'Real Estate', 'Latin American Trade'],
    'New Orleans': ['Energy', 'Food Service', 'Healthcare', 'Technology', 'Maritime', 'Tourism & Hospitality'],
    'Phoenix': ['Technology', 'Real Estate', 'Agriculture', 'Automotive', 'Semiconductor', 'Solar Energy'],
    'Minneapolis': ['Healthcare', 'Agriculture', 'Retail', 'Technology', 'Food & Beverage', 'Medical Devices'],
    'Detroit': ['Automotive', 'Manufacturing', 'Mobility & EV', 'Robotics', 'Defense', 'Technology'],
    'Seattle': ['Technology', 'Aerospace', 'Maritime', 'Outdoor & Recreation', 'Cloud Computing', 'Coffee & Food'],
};

function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function generateCityPage(city) {
    const titleCity = city.name;
    // SEO title under 60 chars
    let seoTitle = `${titleCity} Trade Shows 2026 — ShowFloorTips`;
    if (seoTitle.length > 60) {
        seoTitle = `${titleCity} Trade Shows 2026 | ShowFloorTips`;
    }
    if (seoTitle.length > 60) {
        seoTitle = `${titleCity} Trade Shows 2026 — SFT`;
    }

    const metaDesc = `Browse all ${titleCity} trade shows for 2026. Find upcoming expos, conventions, and exhibitions in ${titleCity} with dates, venues, booth costs, and exhibitor tips.`;

    const industries = CITY_INDUSTRIES[titleCity] || ['Technology', 'Healthcare', 'Manufacturing', 'Food & Beverage', 'Education', 'Retail'];

    // Travel guide link
    const travelGuideHtml = city.travelGuide
        ? `
        <div style="background:#fafafa;border:1px solid #e5e5e5;border-radius:12px;padding:1.5rem 2rem;margin-bottom:2rem;display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap">
            <div><strong style="color:#0a0a0a;font-size:1rem">Planning your trip?</strong><span style="color:#525252;font-size:0.9rem;margin-left:0.5rem">Read our complete exhibitor travel guide to ${escapeHtml(titleCity)} — hotels, flights, restaurants, and insider tips.</span></div>
            <a href="/travel/${city.slug}-trade-show-travel-guide.html" style="display:inline-block;padding:0.6rem 1.5rem;background:#0a0a0a;color:#fff;border-radius:8px;font-size:0.85rem;font-weight:600;white-space:nowrap;text-decoration:none">Read Travel Guide</a>
        </div>`
        : '';

    // State page link
    const stateLink = city.statePage
        ? `<a href="${city.statePage}" class="ct-state-link">Browse all trade shows in ${city.state} &rarr;</a>`
        : '';

    // Other cities list (excluding current)
    const otherCities = CITIES.filter(c => c.slug !== city.slug);

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(seoTitle)}</title>
    <meta name="description" content="${escapeHtml(metaDesc)}">
    <meta name="keywords" content="${titleCity} trade shows, ${titleCity} conventions 2026, ${titleCity} expos, trade shows in ${titleCity}, ${titleCity} exhibitions">
    <link rel="canonical" href="https://showfloortips.com/cities/${city.slug}.html">
    <meta property="og:title" content="${escapeHtml(seoTitle)}">
    <meta property="og:description" content="${escapeHtml(metaDesc)}">
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://showfloortips.com/cities/${city.slug}.html">
    <meta property="og:image" content="https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&h=630&fit=crop">
    <meta property="og:site_name" content="ShowFloorTips">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(seoTitle)}">
    <meta name="twitter:description" content="${escapeHtml(metaDesc)}">
    <link rel="stylesheet" href="/styles.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "name": "${titleCity} Trade Shows 2026",
        "description": "${escapeHtml(metaDesc)}",
        "url": "https://showfloortips.com/cities/${city.slug}.html",
        "publisher": {
            "@type": "Organization",
            "name": "ShowFloorTips",
            "url": "https://showfloortips.com"
        },
        "breadcrumb": {
            "@type": "BreadcrumbList",
            "itemListElement": [
                {"@type": "ListItem", "position": 1, "name": "Home", "item": "https://showfloortips.com/"},
                {"@type": "ListItem", "position": 2, "name": "Cities", "item": "https://showfloortips.com/cities/"},
                {"@type": "ListItem", "position": 3, "name": "${titleCity} Trade Shows", "item": "https://showfloortips.com/cities/${city.slug}.html"}
            ]
        }
    }
    </script>
    <style>
        .ct-hero { background: #0a0a0a; color: #fff; padding: 4rem 2rem 3rem; text-align: center }
        .ct-hero h1 { font-size: 2.6rem; font-weight: 800; letter-spacing: -0.03em; margin-bottom: 0.75rem; max-width: 800px; margin-left: auto; margin-right: auto }
        .ct-hero p { font-size: 1.05rem; color: #94a3b8; max-width: 640px; margin: 0 auto; line-height: 1.7 }
        .ct-stats { display: flex; justify-content: center; gap: 2.5rem; margin-top: 2rem; flex-wrap: wrap }
        .ct-stat { text-align: center }
        .ct-stat-num { font-size: 1.75rem; font-weight: 800 }
        .ct-stat-label { font-size: 0.8rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 0.25rem }
        .ct-breadcrumb { padding: 1rem 2rem; font-size: 0.85rem; color: #64748b; max-width: 1000px; margin: 0 auto }
        .ct-breadcrumb a { color: #475569; text-decoration: none }
        .ct-breadcrumb a:hover { text-decoration: underline }
        .ct-content { max-width: 1000px; margin: 0 auto; padding: 0 2rem 2rem }
        .ct-intro { font-size: 1.02rem; color: #334155; line-height: 1.85; margin-bottom: 2rem; padding: 1.5rem; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0 }
        .ct-sort-bar { display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; margin-bottom: 1.25rem }
        .ct-sort-bar .ct-showing { font-size: 0.9rem; color: #64748b }
        .ct-sort-bar select { padding: 0.5rem 0.85rem; border: 1px solid #d1d5db; border-radius: 8px; font-size: 0.85rem; font-family: inherit; background: #fff }
        .ct-grid { display: flex; flex-direction: column; gap: 1rem }
        .ct-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 1.5rem; display: grid; grid-template-columns: 48px 1fr auto; gap: 1.25rem; align-items: start; transition: border-color 0.2s, box-shadow 0.2s }
        .ct-card:hover { border-color: #334155; box-shadow: 0 4px 16px rgba(0,0,0,0.06) }
        .ct-rank { width: 48px; height: 48px; background: #0a0a0a; color: #fff; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 1.1rem; flex-shrink: 0 }
        .ct-card-body h3 { font-size: 1.1rem; font-weight: 700; color: #0a0a0a; margin-bottom: 0.4rem; line-height: 1.3 }
        .ct-card-body h3 a { color: inherit; text-decoration: none }
        .ct-card-body h3 a:hover { color: #334155 }
        .ct-card-meta { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-bottom: 0.6rem }
        .ct-tag { display: inline-flex; align-items: center; gap: 0.25rem; background: #f1f5f9; color: #475569; font-size: 0.78rem; padding: 0.25rem 0.6rem; border-radius: 5px; font-weight: 500 }
        .ct-card-desc { font-size: 0.88rem; color: #64748b; line-height: 1.6 }
        .ct-card-action { display: flex; flex-direction: column; align-items: flex-end; gap: 0.4rem; min-width: 110px }
        .ct-card-action .ct-btn { display: inline-block; padding: 0.6rem 1.15rem; background: #0a0a0a; color: #fff; border-radius: 8px; font-size: 0.82rem; font-weight: 600; text-decoration: none; white-space: nowrap; transition: background 0.2s }
        .ct-card-action .ct-btn:hover { background: #1e293b }
        .ct-card-action .ct-attendees { font-size: 0.82rem; color: #64748b; font-weight: 500; white-space: nowrap }
        .ct-load-more { text-align: center; margin: 2rem 0 }
        .ct-load-more button { padding: 0.8rem 2.25rem; background: #0a0a0a; color: #fff; border: none; border-radius: 10px; font-size: 0.92rem; font-weight: 600; cursor: pointer; transition: background 0.2s; font-family: inherit }
        .ct-load-more button:hover { background: #1e293b }
        .ct-industries { margin: 2.5rem 0; padding: 2rem; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px }
        .ct-industries h2 { font-size: 1.25rem; font-weight: 700; color: #0a0a0a; margin-bottom: 1rem; text-align: center }
        .ct-industries-grid { display: flex; flex-wrap: wrap; gap: 0.6rem; justify-content: center }
        .ct-industries-grid a { display: inline-block; padding: 0.5rem 1rem; border-radius: 8px; font-size: 0.85rem; font-weight: 500; color: #334155; text-decoration: none; border: 1px solid #e2e8f0; background: #fff; transition: all 0.2s }
        .ct-industries-grid a:hover { background: #0a0a0a; color: #fff; border-color: #0a0a0a }
        .ct-state-link { display: inline-block; margin-top: 0.75rem; font-size: 0.9rem; color: #475569; font-weight: 500; text-decoration: none }
        .ct-state-link:hover { color: #0a0a0a; text-decoration: underline }
        .ct-ad-slot { margin: 2rem 0; padding: 1rem; border: 1px dashed #d1d5db; border-radius: 10px; text-align: center; color: #94a3b8; font-size: 0.8rem; min-height: 90px; display: flex; align-items: center; justify-content: center; background: #fafafa }
        .ct-browse { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 2rem; margin: 2.5rem 0 }
        .ct-browse h3 { font-size: 1.2rem; font-weight: 700; color: #0a0a0a; margin-bottom: 1.25rem; text-align: center }
        .ct-browse-grid { display: flex; flex-wrap: wrap; gap: 0.5rem; justify-content: center }
        .ct-browse-grid a { display: inline-block; padding: 0.4rem 0.85rem; border-radius: 6px; font-size: 0.82rem; font-weight: 500; color: #475569; text-decoration: none; transition: all 0.2s; border: 1px solid #e2e8f0; background: #fff }
        .ct-browse-grid a:hover { background: #0a0a0a; color: #fff; border-color: #0a0a0a }
        .ct-browse-grid a.active { background: #0a0a0a; color: #fff; border-color: #0a0a0a }
        .ct-scannly { background: #eef2ff; border: 1px solid #c7d2fe; border-radius: 16px; padding: 2rem; text-align: center; margin: 2.5rem 0 }
        .ct-scannly h3 { font-size: 1.15rem; font-weight: 700; color: #1e293b; margin-bottom: 0.5rem }
        .ct-scannly p { color: #475569; font-size: 0.9rem; margin-bottom: 1rem; max-width: 480px; margin-left: auto; margin-right: auto }
        .ct-scannly a { display: inline-block; padding: 0.7rem 1.5rem; background: #6366f1; color: #fff; border-radius: 10px; font-weight: 600; text-decoration: none; transition: background 0.2s; font-size: 0.9rem }
        .ct-scannly a:hover { background: #818cf8 }
        .ct-venues { margin: 0 0 2rem; font-size: 0.92rem; color: #475569; line-height: 1.7 }
        .ct-venues strong { color: #0a0a0a }
        @media(max-width:768px) {
            .ct-hero h1 { font-size: 1.75rem }
            .ct-card { grid-template-columns: 40px 1fr; gap: 0.75rem }
            .ct-card-action { flex-direction: row; align-items: center; grid-column: 1 / -1 }
            .ct-rank { width: 40px; height: 40px; font-size: 0.95rem }
        }
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

    <nav class="ct-breadcrumb">
        <a href="/">Home</a> &rsaquo; <a href="/cities/">Cities</a> &rsaquo; ${escapeHtml(titleCity)} Trade Shows
    </nav>

    <section class="ct-hero">
        <h1>${escapeHtml(titleCity)} Trade Shows 2026</h1>
        <p>Discover trade shows, conventions, and exhibitions in ${escapeHtml(titleCity)}. Browse events by date, industry, and size.</p>
        <div class="ct-stats">
            <div class="ct-stat"><div class="ct-stat-num" id="showCount">--</div><div class="ct-stat-label">Shows</div></div>
            <div class="ct-stat"><div class="ct-stat-num" id="industryCount">--</div><div class="ct-stat-label">Industries</div></div>
            <div class="ct-stat"><div class="ct-stat-num" id="venueCount">--</div><div class="ct-stat-label">Venues</div></div>
        </div>
    </section>

    <div class="ct-content">
        <div class="ct-intro">${escapeHtml(city.intro)}</div>
${travelGuideHtml}
        <p class="ct-venues"><strong>Major venues:</strong> ${escapeHtml(city.venues)}</p>

        <!-- Ad Slot -->
        <div class="ct-ad-slot" id="ad-slot-top">
            <!-- Ad: ${titleCity} Trade Shows page - top banner -->
        </div>

        <div class="ct-sort-bar">
            <span class="ct-showing">Showing <strong id="visibleCount">0</strong> of <strong id="totalCount">0</strong> shows</span>
            <select id="sortSelect">
                <option value="attendees">Sort by Attendance</option>
                <option value="date">Sort by Date</option>
                <option value="name">Sort by Name</option>
            </select>
        </div>

        <div class="ct-grid" id="showGrid"></div>
        <div class="ct-load-more" id="loadMore" style="display:none"><button onclick="window.__loadMore()">Show More</button></div>

        <!-- Popular Industries -->
        <section class="ct-industries">
            <h2>Popular Industries in ${escapeHtml(titleCity)}</h2>
            <div class="ct-industries-grid">
${industries.map(ind => {
    const indSlug = ind.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    return `                <a href="/industries/${indSlug}.html">${escapeHtml(ind)}</a>`;
}).join('\n')}
            </div>
${stateLink ? `            ${stateLink}` : ''}
        </section>

        <!-- Ad Slot -->
        <div class="ct-ad-slot" id="ad-slot-mid">
            <!-- Ad: ${titleCity} Trade Shows page - mid-content -->
        </div>

        <!-- Scannly CTA -->
        <div class="ct-scannly">
            <h3>Exhibiting in ${escapeHtml(titleCity)}?</h3>
            <p>Capture every lead at your booth with Scannly. Scan badges, share contact info via QR code, and export leads instantly.</p>
            <a href="https://apps.apple.com/us/app/scannly/id6746970463" target="_blank" rel="noopener">Download Scannly Free</a>
        </div>

        <!-- Browse Other Cities -->
        <div class="ct-browse">
            <h3>Browse Trade Shows by City</h3>
            <div class="ct-browse-grid">
${otherCities.map(c => `                <a href="/cities/${c.slug}.html">${escapeHtml(c.name)}</a>`).join('\n')}
            </div>
        </div>
    </div>

<!-- Newsletter Signup -->
<section style="max-width:640px;margin:3rem auto;padding:2rem;text-align:center">
    <h3 style="font-size:1.3rem;font-weight:700;color:#0a0a0a;margin-bottom:0.5rem">Stay Ahead of the Show Floor</h3>
    <p style="color:#64748b;font-size:0.95rem;margin-bottom:1.5rem;line-height:1.6">Get weekly trade show insights delivered to your inbox.</p>
    <form action="https://app.beehiiv.com/subscribe" method="POST" style="display:flex;gap:8px;max-width:440px;margin:0 auto;flex-wrap:wrap;justify-content:center">
        <input type="hidden" name="publication_id" value="pub_3ced7630-50d2-4bb9-8f43-728c48a80034">
        <input type="email" name="email" placeholder="Your email address" required style="flex:1;min-width:200px;padding:0.75rem 1rem;border:1px solid #e2e8f0;border-radius:8px;font-size:0.95rem;font-family:inherit">
        <button type="submit" style="padding:0.75rem 1.5rem;background:#0a0a0a;color:#fff;border:none;border-radius:8px;font-weight:600;font-size:0.95rem;cursor:pointer;font-family:inherit;white-space:nowrap">Subscribe Free</button>
    </form>
</section>

    <footer class="footer">
        <div class="footer-inner">
            <div class="footer-grid">
                <div class="footer-brand">
                    <div class="logo">ShowFloorTips</div>
                    <p>Your guide to trade shows and exhibitions worldwide.</p>
                </div>
                <div class="footer-col">
                    <h4>Resources</h4>
                    <ul>
                        <li><a href="/#shows">Trade Shows</a></li>
                        <li><a href="/news.html">News</a></li>
                        <li><a href="/guide.html">Guide</a></li>
                        <li><a href="/products.html">Products</a></li>
                        <li><a href="/travel.html">Travel Guides</a></li>
                        <li><a href="/flight-deals.html">Flight Deals</a></li>
                    </ul>
                </div>
                <div class="footer-col">
                    <h4>Tools</h4>
                    <ul>
                        <li><a href="/scannly.html">Scannly - Lead Capture</a></li>
                        <li><a href="/roi-calculator.html">ROI Calculator</a></li>
                        <li><a href="/cost-estimator.html">Cost Estimator</a></li>
                        <li><a href="/lead-calculator.html">Lead Calculator</a></li>
                        <li><a href="/compare.html">Show Comparison</a></li>
                        <li><a href="/map.html">Interactive Map</a></li>
                        <li><a href="/packing-list.html">Packing List</a></li>
                    </ul>
                </div>
            </div>
            <div class="footer-bottom">
                <p>&copy; 2026 ShowFloorTips.com</p>
                <p>Built for exhibitors, by exhibitors</p>
            </div>
        </div>
    </footer>

    <script src="/shows.js"></script>
    <script>
    (function() {
        'use strict';
        var CITY_NAME = '${titleCity.replace(/'/g, "\\'")}';
        var PAGE_SIZE = 25;
        var currentPage = 1;
        var sortMode = 'attendees';
        var allShows = [];
        var sorted = [];

        // Gather shows for this city
        var data = (typeof defined_shows !== 'undefined') ? defined_shows : [];
        var cityLower = CITY_NAME.toLowerCase();
        for (var i = 0; i < data.length; i++) {
            if (data[i].city && data[i].city.toLowerCase() === cityLower) {
                allShows.push(data[i]);
            }
        }

        // Stats
        var cats = {}, venues = {};
        for (var j = 0; j < allShows.length; j++) {
            if (allShows[j].category) cats[allShows[j].category] = 1;
            if (allShows[j].venue) venues[allShows[j].venue] = 1;
        }
        document.getElementById('showCount').textContent = allShows.length;
        document.getElementById('industryCount').textContent = Object.keys(cats).length;
        document.getElementById('venueCount').textContent = Object.keys(venues).length;
        document.getElementById('totalCount').textContent = allShows.length;

        function parseAttendees(s) {
            if (!s) return 0;
            return parseInt(String(s).replace(/[^0-9]/g, ''), 10) || 0;
        }

        function sortShows() {
            sorted = allShows.slice();
            if (sortMode === 'attendees') {
                sorted.sort(function(a, b) {
                    var diff = parseAttendees(b.attendees) - parseAttendees(a.attendees);
                    return diff !== 0 ? diff : a.title.localeCompare(b.title);
                });
            } else if (sortMode === 'date') {
                sorted.sort(function(a, b) {
                    return (a.sort_date || 'z').localeCompare(b.sort_date || 'z');
                });
            } else {
                sorted.sort(function(a, b) { return a.title.localeCompare(b.title); });
            }
        }

        function esc(str) {
            if (!str) return '';
            return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
        }

        function renderGrid() {
            var visible = sorted.slice(0, currentPage * PAGE_SIZE);
            document.getElementById('visibleCount').textContent = visible.length;
            var html = '';
            for (var k = 0; k < visible.length; k++) {
                var s = visible[k];
                var desc = s.description ? (s.description.length > 150 ? s.description.substring(0, 147) + '...' : s.description) : '';
                html += '<div class="ct-card">';
                html += '<div class="ct-rank">' + (k + 1) + '</div>';
                html += '<div class="ct-card-body">';
                html += '<h3><a href="/shows/' + s.slug + '">' + esc(s.title) + '</a></h3>';
                html += '<div class="ct-card-meta">';
                if (s.date) html += '<span class="ct-tag">' + esc(s.date) + '</span>';
                if (s.category) html += '<span class="ct-tag">' + esc(s.category) + '</span>';
                if (s.venue) html += '<span class="ct-tag">' + esc(s.venue) + '</span>';
                html += '</div>';
                if (desc) html += '<div class="ct-card-desc">' + esc(desc) + '</div>';
                html += '</div>';
                html += '<div class="ct-card-action">';
                if (s.attendees) html += '<span class="ct-attendees">' + esc(s.attendees) + ' attendees</span>';
                html += '<a href="/shows/' + s.slug + '" class="ct-btn">View Details</a>';
                html += '</div></div>';
            }
            document.getElementById('showGrid').innerHTML = html;
            document.getElementById('loadMore').style.display = visible.length < sorted.length ? '' : 'none';
        }

        // Schema: Inject ItemList for shows
        var schemaItems = [];
        sortShows();
        var schemaMax = Math.min(sorted.length, 50);
        for (var si = 0; si < schemaMax; si++) {
            var ss = sorted[si];
            var item = {
                '@type': 'ListItem',
                'position': si + 1,
                'item': {
                    '@type': 'Event',
                    'name': ss.title,
                    'url': 'https://showfloortips.com/shows/' + ss.slug,
                    'eventAttendanceMode': 'https://schema.org/OfflineEventAttendanceMode',
                    'eventStatus': 'https://schema.org/EventScheduled'
                }
            };
            if (ss.sort_date) item.item.startDate = ss.sort_date;
            if (ss.city) {
                item.item.location = {
                    '@type': 'Place',
                    'name': ss.venue || ss.city,
                    'address': { '@type': 'PostalAddress', 'addressLocality': ss.city, 'addressRegion': ss.state || '', 'addressCountry': ss.country || '' }
                };
            }
            schemaItems.push(item);
        }
        var schemaEl = document.createElement('script');
        schemaEl.type = 'application/ld+json';
        schemaEl.textContent = JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            'name': CITY_NAME + ' Trade Shows 2026',
            'numberOfItems': allShows.length,
            'itemListElement': schemaItems
        });
        document.head.appendChild(schemaEl);

        renderGrid();

        // Sort handler
        document.getElementById('sortSelect').addEventListener('change', function() {
            sortMode = this.value;
            currentPage = 1;
            sortShows();
            renderGrid();
        });

        // Load more
        window.__loadMore = function() {
            currentPage++;
            renderGrid();
            // Scroll to newly loaded cards
        };
    })();
    </script>
</body>
</html>`;
}


function generateIndexPage() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Trade Shows by City 2026 — ShowFloorTips</title>
    <meta name="description" content="Browse trade shows in the top 20 US trade show cities. Find conventions, expos, and exhibitions in Las Vegas, Chicago, Orlando, New York, and more.">
    <meta name="keywords" content="trade shows by city, US trade show cities, convention cities, trade show destinations 2026">
    <link rel="canonical" href="https://showfloortips.com/cities/">
    <meta property="og:title" content="Trade Shows by City 2026 — ShowFloorTips">
    <meta property="og:description" content="Browse trade shows in the top 20 US trade show cities. Find conventions, expos, and exhibitions in Las Vegas, Chicago, Orlando, New York, and more.">
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://showfloortips.com/cities/">
    <meta property="og:site_name" content="ShowFloorTips">
    <link rel="stylesheet" href="/styles.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "name": "Trade Shows by City 2026",
        "description": "Browse trade shows in the top 20 US trade show cities for 2026.",
        "url": "https://showfloortips.com/cities/",
        "publisher": {
            "@type": "Organization",
            "name": "ShowFloorTips",
            "url": "https://showfloortips.com"
        }
    }
    </script>
    <style>
        .ci-hero { background: #0a0a0a; color: #fff; padding: 4rem 2rem 3rem; text-align: center }
        .ci-hero h1 { font-size: 2.6rem; font-weight: 800; letter-spacing: -0.03em; margin-bottom: 0.75rem }
        .ci-hero p { font-size: 1.05rem; color: #94a3b8; max-width: 640px; margin: 0 auto; line-height: 1.7 }
        .ci-content { max-width: 1000px; margin: 0 auto; padding: 2rem }
        .ci-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem }
        .ci-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 1.5rem; transition: border-color 0.2s, box-shadow 0.2s; text-decoration: none; display: block }
        .ci-card:hover { border-color: #334155; box-shadow: 0 4px 16px rgba(0,0,0,0.06) }
        .ci-card h2 { font-size: 1.15rem; font-weight: 700; color: #0a0a0a; margin-bottom: 0.35rem }
        .ci-card .ci-state { font-size: 0.82rem; color: #64748b; margin-bottom: 0.75rem }
        .ci-card .ci-show-count { font-size: 1.5rem; font-weight: 800; color: #0a0a0a }
        .ci-card .ci-show-label { font-size: 0.78rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em }
        .ci-card .ci-industries { display: flex; flex-wrap: wrap; gap: 0.3rem; margin-top: 0.75rem }
        .ci-card .ci-ind-tag { background: #f1f5f9; color: #475569; font-size: 0.72rem; padding: 0.2rem 0.5rem; border-radius: 4px; font-weight: 500 }
        .ci-card .ci-arrow { display: inline-block; margin-top: 0.75rem; font-size: 0.85rem; font-weight: 600; color: #475569 }
        .ci-card:hover .ci-arrow { color: #0a0a0a }
        .ci-stats-bar { display: flex; justify-content: center; gap: 3rem; margin: 2rem 0; flex-wrap: wrap }
        .ci-stats-bar .ci-sb { text-align: center }
        .ci-stats-bar .ci-sb-num { font-size: 2rem; font-weight: 800; color: #0a0a0a }
        .ci-stats-bar .ci-sb-label { font-size: 0.82rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em }
        @media(max-width:768px) {
            .ci-hero h1 { font-size: 1.75rem }
            .ci-grid { grid-template-columns: 1fr }
        }
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

    <section class="ci-hero">
        <h1>Trade Shows by City 2026</h1>
        <p>Browse trade shows in America's top 20 convention cities. Each city page lists all upcoming expos with dates, venues, and exhibitor information.</p>
    </section>

    <div class="ci-content">
        <div class="ci-stats-bar">
            <div class="ci-sb"><div class="ci-sb-num">20</div><div class="ci-sb-label">Cities</div></div>
            <div class="ci-sb"><div class="ci-sb-num" id="totalShows">--</div><div class="ci-sb-label">Total Shows</div></div>
            <div class="ci-sb"><div class="ci-sb-num" id="totalIndustries">--</div><div class="ci-sb-label">Industries</div></div>
        </div>

        <div class="ci-grid" id="cityGrid">
${CITIES.map((c, i) => {
    const industries = (CITY_INDUSTRIES[c.name] || []).slice(0, 3);
    return `            <a href="/cities/${c.slug}.html" class="ci-card" data-city="${c.name}">
                <h2>${(i + 1)}. ${escapeHtml(c.name)}</h2>
                <div class="ci-state">${escapeHtml(c.state)}</div>
                <div class="ci-show-count" data-count="city-${c.slug}">--</div>
                <div class="ci-show-label">Trade Shows</div>
                <div class="ci-industries">
${industries.map(ind => `                    <span class="ci-ind-tag">${escapeHtml(ind)}</span>`).join('\n')}
                </div>
                <span class="ci-arrow">Browse shows &rarr;</span>
            </a>`;
}).join('\n')}
        </div>
    </div>

<!-- Newsletter Signup -->
<section style="max-width:640px;margin:3rem auto;padding:2rem;text-align:center">
    <h3 style="font-size:1.3rem;font-weight:700;color:#0a0a0a;margin-bottom:0.5rem">Stay Ahead of the Show Floor</h3>
    <p style="color:#64748b;font-size:0.95rem;margin-bottom:1.5rem;line-height:1.6">Get weekly trade show insights delivered to your inbox.</p>
    <form action="https://app.beehiiv.com/subscribe" method="POST" style="display:flex;gap:8px;max-width:440px;margin:0 auto;flex-wrap:wrap;justify-content:center">
        <input type="hidden" name="publication_id" value="pub_3ced7630-50d2-4bb9-8f43-728c48a80034">
        <input type="email" name="email" placeholder="Your email address" required style="flex:1;min-width:200px;padding:0.75rem 1rem;border:1px solid #e2e8f0;border-radius:8px;font-size:0.95rem;font-family:inherit">
        <button type="submit" style="padding:0.75rem 1.5rem;background:#0a0a0a;color:#fff;border:none;border-radius:8px;font-weight:600;font-size:0.95rem;cursor:pointer;font-family:inherit;white-space:nowrap">Subscribe Free</button>
    </form>
</section>

    <footer class="footer">
        <div class="footer-inner">
            <div class="footer-grid">
                <div class="footer-brand">
                    <div class="logo">ShowFloorTips</div>
                    <p>Your guide to trade shows and exhibitions worldwide.</p>
                </div>
                <div class="footer-col">
                    <h4>Resources</h4>
                    <ul>
                        <li><a href="/#shows">Trade Shows</a></li>
                        <li><a href="/news.html">News</a></li>
                        <li><a href="/guide.html">Guide</a></li>
                        <li><a href="/products.html">Products</a></li>
                        <li><a href="/travel.html">Travel Guides</a></li>
                        <li><a href="/flight-deals.html">Flight Deals</a></li>
                    </ul>
                </div>
                <div class="footer-col">
                    <h4>Tools</h4>
                    <ul>
                        <li><a href="/scannly.html">Scannly - Lead Capture</a></li>
                        <li><a href="/roi-calculator.html">ROI Calculator</a></li>
                        <li><a href="/cost-estimator.html">Cost Estimator</a></li>
                        <li><a href="/lead-calculator.html">Lead Calculator</a></li>
                        <li><a href="/compare.html">Show Comparison</a></li>
                        <li><a href="/map.html">Interactive Map</a></li>
                        <li><a href="/packing-list.html">Packing List</a></li>
                    </ul>
                </div>
            </div>
            <div class="footer-bottom">
                <p>&copy; 2026 ShowFloorTips.com</p>
                <p>Built for exhibitors, by exhibitors</p>
            </div>
        </div>
    </footer>

    <script src="/shows.js"></script>
    <script>
    (function() {
        'use strict';
        var data = (typeof defined_shows !== 'undefined') ? defined_shows : [];
        var cityNames = ${JSON.stringify(CITIES.map(c => ({ name: c.name, slug: c.slug })))};
        var totalShows = 0;
        var allCats = {};

        for (var i = 0; i < cityNames.length; i++) {
            var cn = cityNames[i];
            var count = 0;
            for (var j = 0; j < data.length; j++) {
                if (data[j].city && data[j].city.toLowerCase() === cn.name.toLowerCase()) {
                    count++;
                    if (data[j].category) allCats[data[j].category] = 1;
                }
            }
            totalShows += count;
            var el = document.querySelector('[data-count="city-' + cn.slug + '"]');
            if (el) el.textContent = count;
        }

        document.getElementById('totalShows').textContent = totalShows;
        document.getElementById('totalIndustries').textContent = Object.keys(allCats).length;
    })();
    </script>
</body>
</html>`;
}


// Generate all files
const outDir = __dirname;

// Generate 20 city pages
CITIES.forEach(city => {
    const html = generateCityPage(city);
    const filePath = path.join(outDir, city.slug + '.html');
    fs.writeFileSync(filePath, html, 'utf8');
    console.log('Generated: ' + city.slug + '.html');
});

// Generate index page
const indexHtml = generateIndexPage();
fs.writeFileSync(path.join(outDir, 'index.html'), indexHtml, 'utf8');
console.log('Generated: index.html');

console.log('\nDone! Generated 20 city pages + index.html in /cities/');
