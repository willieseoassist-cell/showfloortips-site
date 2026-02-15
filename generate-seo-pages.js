#!/usr/bin/env node
/**
 * Programmatic SEO Page Generator for ShowFloorTips
 * Generates ~500+ landing pages across 10 page types
 * Run: node generate-seo-pages.js
 * Options: --type=countries  (run one type only)
 *          --dry-run         (preview without writing)
 */

const fs = require('fs');
const path = require('path');

const BASE = __dirname;
const SITE_URL = 'https://showfloortips.com';
const TODAY = new Date().toISOString().slice(0, 10);

// ── CLI args ──
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const typeFilter = (args.find(a => a.startsWith('--type=')) || '').replace('--type=', '');

// ── Load shows data ──
console.log('Loading shows.js...');
const rawData = fs.readFileSync(path.join(BASE, 'shows.js'), 'utf8');
const match = rawData.match(/var defined_shows = (\[[\s\S]*?\]);/);
if (!match) { console.error('Could not parse shows.js'); process.exit(1); }
const shows = JSON.parse(match[1]);
console.log(`Loaded ${shows.length} shows`);

// ── Helpers ──
function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function slugify(str) {
    return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function truncate(str, len) {
    if (!str || str.length <= len) return str || '';
    return str.substring(0, len - 3) + '...';
}

function parseAttendees(str) {
    if (!str) return 0;
    return parseInt(String(str).replace(/[^0-9]/g, ''), 10) || 0;
}

function parseBoothPrice(str) {
    if (!str) return 0;
    const m = String(str).match(/\$?([\d,]+)/);
    return m ? parseInt(m[1].replace(/,/g, ''), 10) : 0;
}

function ensureDir(dir) {
    if (!dryRun && !fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

function writeFile(filePath, content) {
    if (dryRun) {
        console.log(`  [DRY RUN] Would write: ${filePath}`);
    } else {
        fs.writeFileSync(filePath, content, 'utf8');
    }
}

// Track all generated URLs for sitemap
const generatedUrls = [];
let totalGenerated = 0;

// ── State abbreviation mapping ──
const STATE_ABBRS = {
    'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR', 'California': 'CA',
    'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE', 'Florida': 'FL', 'Georgia': 'GA',
    'Hawaii': 'HI', 'Idaho': 'ID', 'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA',
    'Kansas': 'KS', 'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
    'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS', 'Missouri': 'MO',
    'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV', 'New Hampshire': 'NH', 'New Jersey': 'NJ',
    'New Mexico': 'NM', 'New York': 'NY', 'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH',
    'Oklahoma': 'OK', 'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
    'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT', 'Vermont': 'VT',
    'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV', 'Wisconsin': 'WI', 'Wyoming': 'WY',
    'District of Columbia': 'DC'
};
const ABBR_TO_STATE = Object.fromEntries(Object.entries(STATE_ABBRS).map(([k, v]) => [v, k]));

// Known cities per state for fallback matching
const STATE_CITIES = {
    'CO': ['Denver', 'Colorado Springs', 'Aurora', 'Boulder'],
    'TN': ['Nashville', 'Memphis', 'Knoxville', 'Chattanooga'],
    'LA': ['New Orleans', 'Baton Rouge', 'Shreveport'],
    'DC': ['Washington'],
    'NC': ['Charlotte', 'Raleigh', 'Durham', 'Greensboro'],
    'MI': ['Detroit', 'Grand Rapids', 'Ann Arbor'],
    'AZ': ['Phoenix', 'Scottsdale', 'Tucson', 'Mesa'],
    'MN': ['Minneapolis', 'St. Paul', 'Bloomington'],
    'MO': ['Kansas City', 'St. Louis', 'Springfield'],
    'OR': ['Portland', 'Eugene', 'Bend'],
    'IN': ['Indianapolis', 'Fort Wayne'],
    'WA': ['Seattle', 'Tacoma', 'Spokane'],
    'WI': ['Milwaukee', 'Madison', 'Green Bay'],
    'UT': ['Salt Lake City', 'Park City', 'Provo'],
    'NJ': ['Atlantic City', 'Newark', 'Jersey City'],
    'MD': ['Baltimore', 'National Harbor', 'Bethesda'],
    'KY': ['Louisville', 'Lexington'],
    'OK': ['Oklahoma City', 'Tulsa'],
    'SC': ['Charleston', 'Myrtle Beach', 'Columbia'],
    'RI': ['Providence', 'Newport'],
    'NE': ['Omaha', 'Lincoln'],
    'AL': ['Birmingham', 'Huntsville', 'Mobile'],
    'HI': ['Honolulu'],
    'IA': ['Des Moines', 'Cedar Rapids'],
    'CT': ['Hartford', 'Stamford'],
    'VA': ['Richmond', 'Virginia Beach', 'Arlington'],
    'KS': ['Kansas City', 'Wichita'],
};

function getShowsForState(abbr) {
    const stateName = ABBR_TO_STATE[abbr] || '';
    const cities = (STATE_CITIES[abbr] || []).map(c => c.toLowerCase());
    return shows.filter(s => {
        if (s.country !== 'United States' && s.country !== 'US') return false;
        const st = (s.state || '').toUpperCase();
        if (st === abbr) return true;
        if (st.toLowerCase() === stateName.toLowerCase()) return true;
        if (cities.length > 0) {
            const c = (s.city || '').toLowerCase();
            if (cities.some(kc => c === kc || c.indexOf(kc) !== -1)) return true;
        }
        return false;
    });
}

// ── Existing pages (to skip) ──
const existingIndustrySlugs = ['technology', 'healthcare', 'manufacturing', 'food-beverage', 'construction', 'automotive', 'energy', 'fashion-beauty', 'defense-security', 'education', 'finance', 'agriculture', 'marine-maritime', 'sports-recreation', 'travel-hospitality'];
const existingStateSlugs = ['california', 'florida', 'georgia', 'illinois', 'massachusetts', 'nevada', 'new-york', 'ohio', 'pennsylvania', 'texas'];
const existingCitySlugs = ['las-vegas', 'chicago', 'orlando', 'new-york', 'anaheim', 'san-francisco', 'atlanta', 'houston', 'dallas', 'san-diego', 'boston', 'denver', 'philadelphia', 'nashville', 'miami', 'new-orleans', 'phoenix', 'minneapolis', 'detroit', 'seattle'];

// ── Unsplash images by topic ──
const IMAGES = {
    default: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&h=630&fit=crop',
    technology: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&h=630&fit=crop',
    business: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=1200&h=630&fit=crop',
    environment: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&h=630&fit=crop',
    arts: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=1200&h=630&fit=crop',
    pet: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=1200&h=630&fit=crop',
    packaging: 'https://images.unsplash.com/photo-1607166452427-7e4477e0e5d0?w=1200&h=630&fit=crop',
    realestate: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&h=630&fit=crop',
    mining: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200&h=630&fit=crop',
    textiles: 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=1200&h=630&fit=crop',
    printing: 'https://images.unsplash.com/photo-1588666309990-d68f08e3d4a6?w=1200&h=630&fit=crop',
    pharma: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=1200&h=630&fit=crop',
    biotech: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=1200&h=630&fit=crop',
    aerospace: 'https://images.unsplash.com/photo-1517976487492-5750f3195933?w=1200&h=630&fit=crop',
    plastics: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=1200&h=630&fit=crop',
    telecom: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&h=630&fit=crop',
    venue: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&h=630&fit=crop',
    seasonal: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=630&fit=crop',
    budget: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=1200&h=630&fit=crop',
    mega: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=1200&h=630&fit=crop',
};

// Category icons
const CATEGORY_ICONS = {
    'Business & Trade': '💼', 'Technology': '💻', 'Healthcare': '🏥', 'Manufacturing': '🏭',
    'Food & Beverage': '🍽️', 'Construction': '🏗️', 'Automotive': '🚗', 'Energy': '⚡',
    'Fashion & Beauty': '👗', 'Sports & Recreation': '⚽', 'Defense & Security': '🛡️',
    'Agriculture': '🌾', 'Education': '🎓', 'Environmental': '🌍', 'Arts & Entertainment': '🎭',
    'Finance': '💰', 'Pet & Animal': '🐾', 'Packaging & Logistics': '📦', 'Real Estate': '🏠',
    'Travel & Hospitality': '✈️', 'Mining & Metals': '⛏️', 'Textiles': '🧵',
    'Printing & Publishing': '🖨️', 'Marine & Maritime': '🚢', 'Business': '📊',
    'Pharmaceuticals': '💊', 'Biotechnology': '🧬', 'Aerospace': '🚀',
    'Plastics & Rubber': '♻️', 'Telecommunications': '📡'
};

// ═══════════════════════════════════════════════════════════
// SHARED HTML TEMPLATES
// ═══════════════════════════════════════════════════════════

function ga4Tag() {
    return `<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-M52J9WDRBW"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-M52J9WDRBW');
</script>`;
}

function headerNav() {
    return `    <header class="header">
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
    </header>`;
}

function footerHtml() {
    return `    <footer class="footer">
        <div class="footer-grid">
            <div class="footer-col">
                <h4>ShowFloorTips</h4>
                <p style="color:#94a3b8;font-size:0.85rem;line-height:1.6">The #1 trade show intelligence platform. 24,800+ shows across 120+ countries.</p>
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
    </footer>`;
}

function newsletterHtml() {
    return `<section style="max-width:640px;margin:3rem auto;padding:2rem;text-align:center">
    <h3 style="font-size:1.3rem;font-weight:700;color:#0a0a0a;margin-bottom:0.5rem">Stay Ahead of the Show Floor</h3>
    <p style="color:#64748b;font-size:0.95rem;margin-bottom:1.5rem;line-height:1.6">Get weekly trade show insights, new show alerts, and exhibitor tips delivered to your inbox.</p>
    <form action="https://app.beehiiv.com/subscribe" method="POST" style="display:flex;gap:8px;max-width:440px;margin:0 auto;flex-wrap:wrap;justify-content:center">
        <input type="hidden" name="publication_id" value="pub_3ced7630-50d2-4bb9-8f43-728c48a80034">
        <input type="email" name="email" placeholder="Your email address" required style="flex:1;min-width:200px;padding:0.75rem 1rem;border:1px solid #e2e8f0;border-radius:8px;font-size:0.95rem;font-family:inherit">
        <button type="submit" style="padding:0.75rem 1.5rem;background:#0a0a0a;color:#fff;border:none;border-radius:8px;font-weight:600;font-size:0.95rem;cursor:pointer;font-family:inherit;white-space:nowrap">Subscribe Free</button>
    </form>
    <p style="font-size:0.75rem;color:#94a3b8;margin-top:0.75rem">No spam. Unsubscribe anytime.</p>
</section>`;
}

function scannlyCta(context) {
    return `        <div class="scannly-cta">
            <h3>Capture Every Lead at ${escapeHtml(context)}</h3>
            <p>Scannly turns badge scans into qualified leads with AI-powered follow-up. Works at any trade show.</p>
            <a href="/scannly.html">Try Scannly Free</a>
        </div>`;
}

function darkModeScript() {
    return `    function toggleDarkMode() {
        document.body.classList.toggle('dark-mode');
        var isDark = document.body.classList.contains('dark-mode');
        localStorage.setItem('darkMode', isDark);
        document.getElementById('darkIcon').style.display = isDark ? 'none' : '';
        document.getElementById('lightIcon').style.display = isDark ? '' : 'none';
    }
    if (localStorage.getItem('darkMode') === 'true') { toggleDarkMode(); }`;
}

function pageCSS() {
    return `        .ind-hero { background: #0a0a0a; color: #fff; padding: 4rem 2rem 3rem; text-align: center }
        .ind-hero h1 { font-size: 2.6rem; font-weight: 800; letter-spacing: -0.03em; margin-bottom: 0.75rem }
        .ind-hero .icon { font-size: 3rem; margin-bottom: 1rem; display: block }
        .ind-hero p { font-size: 1.05rem; color: #94a3b8; max-width: 640px; margin: 0 auto; line-height: 1.7 }
        .ind-hero .stats { display: flex; justify-content: center; gap: 2.5rem; margin-top: 2rem; flex-wrap: wrap }
        .ind-hero .stat { text-align: center }
        .ind-hero .stat-num { font-size: 1.75rem; font-weight: 800 }
        .ind-hero .stat-label { font-size: 0.8rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 0.25rem }
        .ind-nav { display: flex; flex-wrap: wrap; gap: 0.5rem; justify-content: center; padding: 1.5rem 2rem; background: #f8fafc; border-bottom: 1px solid #e2e8f0 }
        .ind-nav a { padding: 0.4rem 0.85rem; border-radius: 6px; font-size: 0.82rem; font-weight: 500; color: #475569; text-decoration: none; transition: background 0.2s }
        .ind-nav a:hover { background: #e2e8f0; color: #0a0a0a }
        .ind-nav a.active { background: #0a0a0a; color: #fff }
        .ind-content { max-width: 1000px; margin: 0 auto; padding: 2rem }
        .ind-intro { font-size: 1.05rem; color: #334155; line-height: 1.85; margin-bottom: 2rem; padding: 1.5rem; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0 }
        .ind-filters { display: flex; gap: 1rem; flex-wrap: wrap; margin-bottom: 1.5rem; align-items: center }
        .ind-filters select, .ind-filters input { padding: 0.6rem 1rem; border: 1px solid #d1d5db; border-radius: 8px; font-size: 0.9rem; font-family: inherit }
        .ind-filters input { flex: 1; min-width: 200px }
        .ind-count { font-size: 0.9rem; color: #64748b; margin-bottom: 1rem }
        .show-grid { display: flex; flex-direction: column; gap: 1rem }
        .show-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1.5rem; display: grid; grid-template-columns: 1fr auto; gap: 1rem; align-items: start; transition: border-color 0.2s, box-shadow 0.2s }
        .show-card:hover { border-color: #334155; box-shadow: 0 4px 16px rgba(0,0,0,0.06) }
        .show-card h3 { font-size: 1.05rem; font-weight: 700; margin-bottom: 0.4rem }
        .show-card h3 a { color: #0a0a0a; text-decoration: none }
        .show-card h3 a:hover { color: #334155 }
        .show-meta { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.5rem }
        .show-tag { display: inline-flex; align-items: center; gap: 0.25rem; background: #f1f5f9; color: #475569; font-size: 0.78rem; padding: 0.25rem 0.6rem; border-radius: 5px; font-weight: 500 }
        .show-desc { font-size: 0.88rem; color: #64748b; line-height: 1.6 }
        .show-action { display: flex; flex-direction: column; align-items: flex-end; gap: 0.4rem; min-width: 110px }
        .btn-view { display: inline-block; padding: 0.6rem 1.1rem; background: #0a0a0a; color: #fff; border-radius: 8px; font-size: 0.82rem; font-weight: 600; text-decoration: none; transition: background 0.2s; white-space: nowrap }
        .btn-view:hover { background: #1e293b }
        .show-date { font-size: 0.82rem; color: #64748b; font-weight: 500 }
        .load-more { text-align: center; margin: 2rem 0 }
        .load-more button { padding: 0.875rem 2.5rem; background: #0a0a0a; color: #fff; border: none; border-radius: 10px; font-size: 0.95rem; font-weight: 600; cursor: pointer }
        .load-more button:hover { background: #1e293b }
        .scannly-cta { background: #eef2ff; border: 1px solid #c7d2fe; border-radius: 16px; padding: 2rem; text-align: center; margin: 2.5rem 0 }
        .scannly-cta h3 { font-size: 1.2rem; font-weight: 700; color: #1e293b; margin-bottom: 0.5rem }
        .scannly-cta p { color: #475569; font-size: 0.9rem; margin-bottom: 1rem }
        .scannly-cta a { display: inline-block; padding: 0.75rem 1.75rem; background: #6366f1; color: #fff; border-radius: 10px; font-weight: 600; text-decoration: none }
        .related-links { margin: 2.5rem 0 }
        .related-links h2 { font-size: 1.3rem; font-weight: 700; margin-bottom: 1rem }
        .link-grid { display: flex; flex-wrap: wrap; gap: 0.5rem }
        .link-grid a { padding: 0.4rem 0.8rem; background: #f1f5f9; border-radius: 6px; color: #334155; text-decoration: none; font-size: 0.85rem; font-weight: 500; transition: all 0.2s }
        .link-grid a:hover { background: #0a0a0a; color: #fff }
        .breadcrumb { padding: 1rem 2rem; font-size: 0.85rem; color: #64748b; max-width: 1000px; margin: 0 auto }
        .breadcrumb a { color: #475569; text-decoration: none }
        .breadcrumb a:hover { text-decoration: underline }
        @media(max-width:768px) {
            .ind-hero h1 { font-size: 1.6rem }
            .show-card { grid-template-columns: 1fr }
            .show-action { flex-direction: row; align-items: center }
        }
        /* Dark mode */
        html[data-theme="dark"] .ind-hero, body.dark-mode .ind-hero { background: #0f0f23 }
        html[data-theme="dark"] .ind-nav, body.dark-mode .ind-nav { background: #1a1a2e; border-bottom-color: #2a2a4a }
        html[data-theme="dark"] .ind-nav a, body.dark-mode .ind-nav a { color: #94a3b8 }
        html[data-theme="dark"] .ind-nav a:hover, body.dark-mode .ind-nav a:hover { background: #2a2a4a; color: #e2e8f0 }
        html[data-theme="dark"] .ind-nav a.active, body.dark-mode .ind-nav a.active { background: #e2e8f0; color: #0f0f23 }
        html[data-theme="dark"] .ind-intro, body.dark-mode .ind-intro { background: #1e1e32; border-color: #2a2a4a; color: #94a3b8 }
        html[data-theme="dark"] .ind-filters select, html[data-theme="dark"] .ind-filters input, body.dark-mode .ind-filters select, body.dark-mode .ind-filters input { background: #1e1e32; border-color: #2a2a4a; color: #e2e8f0 }
        html[data-theme="dark"] .ind-count, body.dark-mode .ind-count { color: #94a3b8 }
        html[data-theme="dark"] .show-card, body.dark-mode .show-card { background: #1e1e32; border-color: #2a2a4a }
        html[data-theme="dark"] .show-card:hover, body.dark-mode .show-card:hover { border-color: #94a3b8 }
        html[data-theme="dark"] .show-card h3 a, body.dark-mode .show-card h3 a { color: #e2e8f0 }
        html[data-theme="dark"] .show-tag, body.dark-mode .show-tag { background: #16213e; color: #94a3b8 }
        html[data-theme="dark"] .show-desc, body.dark-mode .show-desc { color: #94a3b8 }
        html[data-theme="dark"] .show-date, body.dark-mode .show-date { color: #94a3b8 }
        html[data-theme="dark"] .btn-view, body.dark-mode .btn-view { background: #e2e8f0; color: #0f0f23 }
        html[data-theme="dark"] .btn-view:hover, body.dark-mode .btn-view:hover { background: #cbd5e1 }
        html[data-theme="dark"] .load-more button, body.dark-mode .load-more button { background: #e2e8f0; color: #0f0f23 }
        html[data-theme="dark"] .scannly-cta, body.dark-mode .scannly-cta { background: #1e1e32; border-color: #2a2a4a }
        html[data-theme="dark"] .scannly-cta h3, body.dark-mode .scannly-cta h3 { color: #e2e8f0 }
        html[data-theme="dark"] .scannly-cta p, body.dark-mode .scannly-cta p { color: #94a3b8 }
        html[data-theme="dark"] .related-links, body.dark-mode .related-links { color: #e2e8f0 }
        html[data-theme="dark"] .related-links h2, body.dark-mode .related-links h2 { color: #e2e8f0 }
        html[data-theme="dark"] .link-grid a, body.dark-mode .link-grid a { background: #1e1e32; color: #94a3b8; border: 1px solid #2a2a4a }
        html[data-theme="dark"] .link-grid a:hover, body.dark-mode .link-grid a:hover { background: #e2e8f0; color: #0f0f23 }
        html[data-theme="dark"] .breadcrumb, body.dark-mode .breadcrumb { color: #94a3b8 }
        html[data-theme="dark"] .breadcrumb a, body.dark-mode .breadcrumb a { color: #94a3b8 }`;
}

// Client-side filter + render script (parameterized)
function filterScript(filterField, filterValue, extraFilterHtml) {
    const filterCode = filterField === 'category'
        ? `s.category === FILTER_VALUE`
        : filterField === 'country'
        ? `s.country === FILTER_VALUE`
        : filterField === 'state'
        ? `(s.state || '').toUpperCase() === FILTER_VALUE || (s.country === 'United States' && STATE_CITIES.some(function(c) { return (s.city || '').toLowerCase() === c; }))`
        : filterField === 'city'
        ? `(s.city || '').toLowerCase() === FILTER_VALUE.toLowerCase()`
        : filterField === 'venue'
        ? `(s.venue || '') === FILTER_VALUE`
        : filterField === 'attendees_min'
        ? `parseAtt(s.attendees) >= FILTER_VALUE`
        : filterField === 'attendees_max'
        ? `parseAtt(s.attendees) > 0 && parseAtt(s.attendees) <= FILTER_VALUE`
        : filterField === 'attendees_range'
        ? `parseAtt(s.attendees) >= FILTER_MIN && parseAtt(s.attendees) <= FILTER_MAX`
        : filterField === 'booth_max'
        ? `parseBooth(s.booth_price) > 0 && parseBooth(s.booth_price) <= FILTER_VALUE`
        : filterField === 'booth_range'
        ? `parseBooth(s.booth_price) >= FILTER_MIN && parseBooth(s.booth_price) <= FILTER_MAX`
        : filterField === 'season'
        ? `getMonth(s.sort_date) >= FILTER_MIN && getMonth(s.sort_date) <= FILTER_MAX`
        : filterField === 'combo'
        ? `s.category === FILTER_CAT && s.country === FILTER_COUNTRY`
        : `true`;

    return filterCode;
}

// Full client-side JS for a listing page
function listingScript(config) {
    // config: { filterType, filterValue, extraVars, stateCities, filterMin, filterMax, filterCat, filterCountry }
    let filterSetup = '';
    let filterCondition = '';

    if (config.filterType === 'category') {
        filterSetup = `var FILTER_VALUE = ${JSON.stringify(config.filterValue)};`;
        filterCondition = 's.category === FILTER_VALUE';
    } else if (config.filterType === 'country') {
        filterSetup = `var FILTER_VALUE = ${JSON.stringify(config.filterValue)};`;
        filterCondition = 's.country === FILTER_VALUE';
    } else if (config.filterType === 'state') {
        filterSetup = `var FILTER_VALUE = ${JSON.stringify(config.filterValue)};\n        var STATE_CITIES = ${JSON.stringify((config.stateCities || []).map(c => c.toLowerCase()))};`;
        filterCondition = '((s.state || "").toUpperCase() === FILTER_VALUE || (s.country === "United States" && STATE_CITIES.some(function(c) { return (s.city || "").toLowerCase() === c; })))';
    } else if (config.filterType === 'city') {
        filterSetup = `var FILTER_VALUE = ${JSON.stringify(config.filterValue)};`;
        filterCondition = '(s.city || "").toLowerCase() === FILTER_VALUE.toLowerCase()';
    } else if (config.filterType === 'venue') {
        filterSetup = `var FILTER_VALUE = ${JSON.stringify(config.filterValue)};`;
        filterCondition = '(s.venue || "") === FILTER_VALUE';
    } else if (config.filterType === 'attendees_min') {
        filterSetup = `var FILTER_VALUE = ${config.filterValue};`;
        filterCondition = 'parseAtt(s.attendees) >= FILTER_VALUE';
    } else if (config.filterType === 'attendees_range') {
        filterSetup = `var FILTER_MIN = ${config.filterMin}; var FILTER_MAX = ${config.filterMax};`;
        filterCondition = 'parseAtt(s.attendees) >= FILTER_MIN && parseAtt(s.attendees) <= FILTER_MAX';
    } else if (config.filterType === 'booth_max') {
        filterSetup = `var FILTER_VALUE = ${config.filterValue};`;
        filterCondition = 'parseBooth(s.booth_price) > 0 && parseBooth(s.booth_price) <= FILTER_VALUE';
    } else if (config.filterType === 'booth_range') {
        filterSetup = `var FILTER_MIN = ${config.filterMin}; var FILTER_MAX = ${config.filterMax};`;
        filterCondition = 'parseBooth(s.booth_price) >= FILTER_MIN && parseBooth(s.booth_price) <= FILTER_MAX';
    } else if (config.filterType === 'season') {
        filterSetup = `var FILTER_MIN = ${config.filterMin}; var FILTER_MAX = ${config.filterMax};`;
        filterCondition = 'getMonth(s.sort_date) >= FILTER_MIN && getMonth(s.sort_date) <= FILTER_MAX';
    } else if (config.filterType === 'combo') {
        filterSetup = `var FILTER_CAT = ${JSON.stringify(config.filterCat)}; var FILTER_COUNTRY = ${JSON.stringify(config.filterCountry)};`;
        filterCondition = 's.category === FILTER_CAT && s.country === FILTER_COUNTRY';
    }

    return `    <script src="/shows.js"></script>
    <script>
    (function() {
        ${filterSetup}
        var PAGE_SIZE = 25;
        var currentPage = 1;
        var filteredShows = [];

        function parseAtt(s) { if (!s) return 0; return parseInt(String(s).replace(/[^0-9]/g, ''), 10) || 0; }
        function parseBooth(s) { if (!s) return 0; var m = String(s).match(/\\$?([\\d,]+)/); return m ? parseInt(m[1].replace(/,/g, ''), 10) : 0; }
        function getMonth(d) { if (!d) return 0; return parseInt(d.substring(5, 7), 10); }

        var allShows = (typeof defined_shows !== 'undefined' ? defined_shows : []).filter(function(s) {
            return ${filterCondition};
        });

        // Stats
        var countries = {}, cities = {}, cats = {};
        allShows.forEach(function(s) {
            if (s.country) countries[s.country] = 1;
            if (s.city) cities[s.city] = 1;
            if (s.category) cats[s.category] = 1;
        });
        var sc = document.getElementById('showCount'); if (sc) sc.textContent = allShows.length.toLocaleString();
        var cc = document.getElementById('countryCount'); if (cc) cc.textContent = Object.keys(countries).length;
        var cic = document.getElementById('cityCount'); if (cic) cic.textContent = Object.keys(cities).length;
        var catc = document.getElementById('catCount'); if (catc) catc.textContent = Object.keys(cats).length;
        var tc = document.getElementById('totalCount'); if (tc) tc.textContent = allShows.length;

        // Populate filters
        var countrySelect = document.getElementById('countryFilter');
        if (countrySelect) {
            Object.keys(countries).sort().forEach(function(c) {
                var opt = document.createElement('option'); opt.value = c; opt.textContent = c; countrySelect.appendChild(opt);
            });
        }
        var catSelect = document.getElementById('categoryFilter');
        if (catSelect) {
            Object.keys(cats).sort().forEach(function(c) {
                var opt = document.createElement('option'); opt.value = c; opt.textContent = c; catSelect.appendChild(opt);
            });
        }

        function formatDate(d) {
            if (!d) return 'TBD';
            var parts = d.substring(0, 10).split('-');
            if (parts.length !== 3) return d;
            var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
            return months[parseInt(parts[1], 10) - 1] + ' ' + parseInt(parts[2], 10) + ', ' + parts[0];
        }

        function filterAndSort() {
            var q = (document.getElementById('searchInput') || {}).value || '';
            q = q.toLowerCase();
            var country = (document.getElementById('countryFilter') || {}).value || '';
            var cat = (document.getElementById('categoryFilter') || {}).value || '';
            var sort = (document.getElementById('sortSelect') || {}).value || 'date-asc';

            filteredShows = allShows.filter(function(s) {
                if (q && !((s.title || '').toLowerCase().includes(q) || (s.city || '').toLowerCase().includes(q) || (s.venue || '').toLowerCase().includes(q))) return false;
                if (country && s.country !== country) return false;
                if (cat && s.category !== cat) return false;
                return true;
            });

            filteredShows.sort(function(a, b) {
                if (sort === 'name-asc') return (a.title || '').localeCompare(b.title || '');
                if (sort === 'name-desc') return (b.title || '').localeCompare(a.title || '');
                if (sort === 'date-desc') return (b.sort_date || 'z').localeCompare(a.sort_date || 'z');
                return (a.sort_date || 'z').localeCompare(b.sort_date || 'z');
            });

            currentPage = 1;
            render();
        }

        function render() {
            var grid = document.getElementById('showGrid');
            if (!grid) return;
            var visible = filteredShows.slice(0, currentPage * PAGE_SIZE);
            var vc = document.getElementById('visibleCount'); if (vc) vc.textContent = visible.length;
            var tc2 = document.getElementById('totalCount'); if (tc2) tc2.textContent = filteredShows.length;

            grid.innerHTML = visible.map(function(s) {
                return '<div class="show-card">' +
                    '<div>' +
                        '<h3><a href="/shows/' + s.slug + '">' + (s.title || 'Untitled Show') + '</a></h3>' +
                        '<div class="show-meta">' +
                            (s.city ? '<span class="show-tag">\\u{1F4CD} ' + s.city + (s.country ? ', ' + s.country : '') + '</span>' : '') +
                            (s.venue ? '<span class="show-tag">\\u{1F3DB} ' + s.venue + '</span>' : '') +
                            (s.category ? '<span class="show-tag">' + s.category + '</span>' : '') +
                        '</div>' +
                        (s.description ? '<p class="show-desc">' + s.description.substring(0, 150) + (s.description.length > 150 ? '...' : '') + '</p>' : '') +
                    '</div>' +
                    '<div class="show-action">' +
                        '<a href="/shows/' + s.slug + '" class="btn-view">View Details</a>' +
                        '<span class="show-date">' + formatDate(s.sort_date) + '</span>' +
                        (s.attendees ? '<span class="show-date">' + s.attendees + '</span>' : '') +
                    '</div>' +
                '</div>';
            }).join('');

            var lm = document.getElementById('loadMore');
            if (lm) lm.style.display = visible.length < filteredShows.length ? '' : 'none';
        }

        window.loadMore = function() { currentPage++; render(); };

        var si = document.getElementById('searchInput'); if (si) si.addEventListener('input', filterAndSort);
        var ss = document.getElementById('sortSelect'); if (ss) ss.addEventListener('change', filterAndSort);
        var cf = document.getElementById('countryFilter'); if (cf) cf.addEventListener('change', filterAndSort);
        var catf = document.getElementById('categoryFilter'); if (catf) catf.addEventListener('change', filterAndSort);

        filterAndSort();
    })();

    ${darkModeScript()}
    </script>`;
}

// Build a complete page
function buildPage(config) {
    // config: { title, metaDesc, keywords, canonicalPath, ogImage, breadcrumbs, heroIcon, heroTitle, heroDesc,
    //           introText, filterType, filterValue, stateCities, filterMin, filterMax, filterCat, filterCountry,
    //           relatedLinksTitle, relatedLinks, extraNav, showCategoryFilter, showCountryFilter, scannlyContext }
    const ogImage = config.ogImage || IMAGES.default;
    const seoTitle = truncate(config.title, 60);
    const metaDesc = truncate(config.metaDesc, 160);

    const breadcrumbJson = config.breadcrumbs ? JSON.stringify({
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "name": escapeHtml(config.heroTitle || config.title),
        "description": escapeHtml(metaDesc),
        "url": SITE_URL + config.canonicalPath,
        "publisher": {"@type": "Organization", "name": "ShowFloorTips", "url": SITE_URL},
        "breadcrumb": {
            "@type": "BreadcrumbList",
            "itemListElement": config.breadcrumbs.map((b, i) => ({
                "@type": "ListItem", "position": i + 1, "name": b.name, "item": b.url
            }))
        }
    }, null, 8) : '';

    const navHtml = config.extraNav || '';
    const categoryFilterHtml = config.showCategoryFilter ? `
            <select id="categoryFilter">
                <option value="">All Industries</option>
            </select>` : '';
    const countryFilterHtml = config.showCountryFilter !== false ? `
            <select id="countryFilter">
                <option value="">All Countries</option>
            </select>` : '';

    const relatedHtml = config.relatedLinks && config.relatedLinks.length > 0 ? `
        <div class="related-links">
            <h2>${escapeHtml(config.relatedLinksTitle || 'Related Pages')}</h2>
            <div class="link-grid">
${config.relatedLinks.map(l => `                <a href="${l.url}">${escapeHtml(l.name)}</a>`).join('\n')}
            </div>
        </div>` : '';

    return `<!DOCTYPE html>
<html lang="en">
<head>
${ga4Tag()}
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(seoTitle)}</title>
    <meta name="description" content="${escapeHtml(metaDesc)}">
    <meta name="keywords" content="${escapeHtml(config.keywords || '')}">
    <meta property="og:title" content="${escapeHtml(seoTitle)}">
    <meta property="og:description" content="${escapeHtml(metaDesc)}">
    <meta property="og:type" content="website">
    <meta property="og:url" content="${SITE_URL}${config.canonicalPath}">
    <meta property="og:image" content="${ogImage}">
    <meta property="og:site_name" content="ShowFloorTips">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(seoTitle)}">
    <meta name="twitter:description" content="${escapeHtml(metaDesc)}">
    <meta name="twitter:image" content="${ogImage}">
    <link rel="canonical" href="${SITE_URL}${config.canonicalPath}">
    <link rel="stylesheet" href="/styles.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
${breadcrumbJson ? `    <script type="application/ld+json">\n    ${breadcrumbJson}\n    </script>` : ''}
    <style>
${pageCSS()}
    </style>
</head>
<body>
${headerNav()}
${config.breadcrumbs ? `
    <nav class="breadcrumb">
        ${config.breadcrumbs.slice(0, -1).map(b => `<a href="${b.url}">${escapeHtml(b.name)}</a>`).join(' &rsaquo; ')} &rsaquo; ${escapeHtml(config.breadcrumbs[config.breadcrumbs.length - 1].name)}
    </nav>` : ''}
${navHtml}

    <section class="ind-hero">
        ${config.heroIcon ? `<span class="icon">${config.heroIcon}</span>` : ''}
        <h1>${escapeHtml(config.heroTitle || config.title)}</h1>
        <p>${escapeHtml(config.heroDesc || config.metaDesc)}</p>
        <div class="stats">
            <div class="stat"><div class="stat-num" id="showCount">...</div><div class="stat-label">Shows Found</div></div>
            <div class="stat"><div class="stat-num" id="countryCount">...</div><div class="stat-label">Countries</div></div>
            <div class="stat"><div class="stat-num" id="cityCount">...</div><div class="stat-label">Cities</div></div>
        </div>
    </section>

    <div class="ind-content">
${config.introText ? `        <div class="ind-intro">${escapeHtml(config.introText)}</div>\n` : ''}
        <div class="ind-filters">
            <input type="text" id="searchInput" placeholder="Search shows...">
            <select id="sortSelect">
                <option value="date-asc">Soonest First</option>
                <option value="date-desc">Latest First</option>
                <option value="name-asc">A-Z</option>
                <option value="name-desc">Z-A</option>
            </select>${categoryFilterHtml}${countryFilterHtml}
        </div>

        <p class="ind-count">Showing <strong id="visibleCount">0</strong> of <strong id="totalCount">0</strong> shows</p>

        <div class="show-grid" id="showGrid"></div>

        <div class="load-more" id="loadMore" style="display:none">
            <button onclick="loadMore()">Load More Shows</button>
        </div>

${scannlyCta(config.scannlyContext || 'Your Next Trade Show')}
${relatedHtml}
    </div>

${newsletterHtml()}
${footerHtml()}

${listingScript(config)}
</body>
</html>`;
}


// ═══════════════════════════════════════════════════════════
// PAGE TYPE GENERATORS
// ═══════════════════════════════════════════════════════════

// ── 1. Missing Industry Pages ──
function generateIndustryPages() {
    console.log('\n=== Generating Missing Industry Pages ===');
    const dir = path.join(BASE, 'industries');
    const cats = {};
    shows.forEach(s => { if (s.category) cats[s.category] = (cats[s.category] || 0) + 1; });

    let count = 0;
    const newIndustries = [];

    Object.entries(cats)
        .filter(([cat, num]) => num >= 50 && !existingIndustrySlugs.includes(slugify(cat)))
        .sort((a, b) => b[1] - a[1])
        .forEach(([cat, num]) => {
            const slug = slugify(cat);
            const icon = CATEGORY_ICONS[cat] || '📋';
            const filePath = path.join(dir, slug + '.html');
            const canonicalPath = `/industries/${slug}.html`;

            // Get related industries for cross-linking
            const relatedIndustries = Object.keys(cats)
                .filter(c => c !== cat && cats[c] >= 50)
                .sort(() => Math.random() - 0.5)
                .slice(0, 8)
                .map(c => ({ name: c, url: `/industries/${slugify(c)}.html` }));

            const introTexts = {
                'Business & Trade': 'Business and trade shows bring together professionals from every sector for networking, deal-making, and discovering new products and services. These events range from large multi-industry expositions to focused B2B matchmaking forums.',
                'Environmental': 'Environmental trade shows spotlight sustainability, clean technology, waste management, water treatment, and green building solutions. These events connect innovators, regulators, and businesses working to build a more sustainable future.',
                'Arts & Entertainment': 'Arts and entertainment trade shows showcase everything from live event technology and stage design to film production, music industry innovation, and theme park attractions. Connect with creative professionals and industry leaders.',
                'Pet & Animal': 'Pet and animal industry trade shows cover pet food, veterinary products, grooming equipment, animal health innovations, and pet retail trends. These events connect manufacturers, distributors, retailers, and veterinary professionals.',
                'Packaging & Logistics': 'Packaging and logistics trade shows feature the latest in packaging materials, machinery, supply chain solutions, warehousing technology, and transportation logistics. Essential events for manufacturers, distributors, and logistics professionals.',
                'Real Estate': 'Real estate trade shows bring together developers, investors, brokers, property managers, and PropTech innovators. From commercial developments to residential trends, these events shape how the world builds and invests.',
                'Mining & Metals': 'Mining and metals trade shows showcase extraction technologies, mineral processing equipment, safety solutions, and sustainable mining practices. These events connect mining companies with equipment suppliers and technology providers.',
                'Textiles': 'Textile trade shows feature fabrics, yarns, dyeing technology, garment manufacturing equipment, and sustainable textile innovations. Essential events for fashion brands, textile manufacturers, and material sourcing professionals.',
                'Printing & Publishing': 'Printing and publishing trade shows showcase digital printing technology, packaging printing, signage solutions, and publishing industry innovations. Connect with printers, publishers, and media professionals.',
                'Business': 'General business trade shows and expos bring together entrepreneurs, executives, and business service providers for networking, learning, and deal-making across industries.',
                'Pharmaceuticals': 'Pharmaceutical trade shows cover drug development, clinical trials, regulatory compliance, pharmaceutical manufacturing, and distribution. These events connect pharma companies with suppliers, researchers, and healthcare professionals.',
                'Biotechnology': 'Biotechnology trade shows highlight advances in genomics, biomanufacturing, cell therapy, agricultural biotech, and life sciences research. These events bring together scientists, investors, and biotech companies.',
                'Aerospace': 'Aerospace trade shows feature aircraft, defense systems, space technology, avionics, and aviation services. From major air shows to specialized defense exhibitions, these events shape the future of flight and space exploration.',
                'Plastics & Rubber': 'Plastics and rubber trade shows showcase injection molding, extrusion, recycling technology, raw materials, and sustainable polymer solutions. Essential for manufacturers, processors, and material suppliers.',
                'Telecommunications': 'Telecommunications trade shows cover 5G infrastructure, fiber optics, satellite communications, network equipment, and digital connectivity solutions. Connect with carriers, equipment makers, and technology providers.',
            };

            const html = buildPage({
                title: `${cat} Trade Shows 2026 | ShowFloorTips`,
                metaDesc: `Browse ${num}+ ${cat.toLowerCase()} trade shows worldwide. Find the best ${cat.toLowerCase()} expos, conventions, and exhibitions for 2026.`,
                keywords: `${cat.toLowerCase()} trade shows, ${cat.toLowerCase()} expos 2026, ${cat.toLowerCase()} conventions, ${cat.toLowerCase()} exhibitions`,
                canonicalPath,
                ogImage: IMAGES[slugify(cat)] || IMAGES.default,
                breadcrumbs: [
                    { name: 'Home', url: SITE_URL },
                    { name: 'Industries', url: SITE_URL + '/industries/' },
                    { name: cat, url: SITE_URL + canonicalPath }
                ],
                heroIcon: icon,
                heroTitle: `${cat} Trade Shows`,
                heroDesc: `Browse ${num}+ ${cat.toLowerCase()} trade shows worldwide for 2026. Find dates, venues, booth costs, and exhibitor tips.`,
                introText: introTexts[cat] || `Discover ${cat.toLowerCase()} trade shows happening around the world in 2026. Browse upcoming events with dates, venues, and exhibitor information.`,
                filterType: 'category',
                filterValue: cat,
                showCategoryFilter: false,
                showCountryFilter: true,
                scannlyContext: `Your Next ${cat} Show`,
                relatedLinksTitle: 'Related Industries',
                relatedLinks: relatedIndustries,
            });

            writeFile(filePath, html);
            generatedUrls.push(canonicalPath);
            newIndustries.push({ name: cat, slug, count: num });
            count++;
            console.log(`  Generated: industries/${slug}.html (${num} shows)`);
        });

    console.log(`  Total: ${count} industry pages`);
    totalGenerated += count;
    return newIndustries;
}

// ── 2. Country Pages ──
function generateCountryPages() {
    console.log('\n=== Generating Country Pages ===');
    const dir = path.join(BASE, 'countries');
    ensureDir(dir);

    const countries = {};
    shows.forEach(s => { if (s.country) countries[s.country] = (countries[s.country] || 0) + 1; });

    let count = 0;
    const generated = [];

    Object.entries(countries)
        .filter(([c, num]) => num >= 20)
        .sort((a, b) => b[1] - a[1])
        .forEach(([country, num]) => {
            const slug = slugify(country);
            const filePath = path.join(dir, slug + '.html');
            const canonicalPath = `/countries/${slug}.html`;

            const otherCountries = Object.entries(countries)
                .filter(([c]) => c !== country && countries[c] >= 20)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 12)
                .map(([c]) => ({ name: c, url: `/countries/${slugify(c)}.html` }));

            const html = buildPage({
                title: `Trade Shows in ${country} 2026 | ShowFloorTips`,
                metaDesc: `Browse ${num}+ trade shows in ${country} for 2026. Find upcoming expos, conventions, and exhibitions with dates, venues, and booth costs.`,
                keywords: `trade shows in ${country}, ${country} expos 2026, ${country} conventions, ${country} exhibitions, ${country} trade fairs`,
                canonicalPath,
                ogImage: IMAGES.default,
                breadcrumbs: [
                    { name: 'Home', url: SITE_URL },
                    { name: 'Countries', url: SITE_URL + '/countries/' },
                    { name: `${country} Trade Shows`, url: SITE_URL + canonicalPath }
                ],
                heroIcon: '🌍',
                heroTitle: `Trade Shows in ${country}`,
                heroDesc: `Discover ${num}+ trade shows, expos, and conventions in ${country} for 2026. Browse by date, industry, and city.`,
                introText: `${country} hosts a diverse range of trade shows and exhibitions across multiple industries. Browse all upcoming events in ${country} with dates, venues, booth pricing, and exhibitor tips.`,
                filterType: 'country',
                filterValue: country,
                showCategoryFilter: true,
                showCountryFilter: false,
                scannlyContext: `Your Next Show in ${country}`,
                relatedLinksTitle: 'Browse More Countries',
                relatedLinks: otherCountries,
            });

            writeFile(filePath, html);
            generatedUrls.push(canonicalPath);
            generated.push({ name: country, slug, count: num });
            count++;
            console.log(`  Generated: countries/${slug}.html (${num} shows)`);
        });

    // Generate index page
    const indexHtml = buildIndexPage({
        title: 'Trade Shows by Country 2026 | ShowFloorTips',
        metaDesc: 'Browse trade shows in 50+ countries worldwide. Find conventions, expos, and exhibitions by country for 2026.',
        canonicalPath: '/countries/',
        heroTitle: 'Trade Shows by Country',
        heroDesc: 'Browse trade shows in 50+ countries worldwide. Each country page lists all upcoming expos with dates, venues, and exhibitor information.',
        items: generated,
        itemUrlPrefix: '/countries/',
    });
    writeFile(path.join(dir, 'index.html'), indexHtml);
    generatedUrls.push('/countries/');
    count++;

    console.log(`  Total: ${count} country pages (inc. index)`);
    totalGenerated += count;
    return generated;
}

// ── 3. Missing US State Pages ──
function generateStatePages() {
    console.log('\n=== Generating Missing US State Pages ===');
    const dir = path.join(BASE, 'states');

    const states = {};
    shows.forEach(s => {
        if ((s.country === 'United States' || s.country === 'US') && s.state) {
            const st = s.state.toUpperCase();
            states[st] = (states[st] || 0) + 1;
        }
    });

    let count = 0;
    const generated = [];

    Object.entries(states)
        .filter(([abbr, num]) => num >= 3 && ABBR_TO_STATE[abbr] && !existingStateSlugs.includes(slugify(ABBR_TO_STATE[abbr])))
        .sort((a, b) => b[1] - a[1])
        .forEach(([abbr, num]) => {
            const stateName = ABBR_TO_STATE[abbr];
            const slug = slugify(stateName);
            const filePath = path.join(dir, slug + '.html');
            const canonicalPath = `/states/${slug}.html`;
            const cities = STATE_CITIES[abbr] || [];

            const otherStates = Object.entries(states)
                .filter(([a]) => a !== abbr && ABBR_TO_STATE[a])
                .sort((a, b) => b[1] - a[1])
                .slice(0, 12)
                .map(([a]) => ({ name: ABBR_TO_STATE[a], url: `/states/${slugify(ABBR_TO_STATE[a])}.html` }));

            const html = buildPage({
                title: `Trade Shows in ${stateName} 2026 | ShowFloorTips`,
                metaDesc: `Browse ${num}+ trade shows in ${stateName} for 2026. Find upcoming expos, conventions, and exhibitions with dates, venues, and exhibitor tips.`,
                keywords: `trade shows in ${stateName}, ${stateName} conventions 2026, ${stateName} expos, ${stateName} exhibitions, ${abbr} trade shows`,
                canonicalPath,
                ogImage: IMAGES.default,
                breadcrumbs: [
                    { name: 'Home', url: SITE_URL },
                    { name: 'States', url: SITE_URL + '/states/' },
                    { name: `${stateName} Trade Shows`, url: SITE_URL + canonicalPath }
                ],
                heroIcon: '🏛️',
                heroTitle: `Trade Shows in ${stateName}`,
                heroDesc: `Discover ${num}+ trade shows, expos, and conventions in ${stateName} for 2026.`,
                introText: `${stateName} hosts trade shows and exhibitions across multiple industries. Browse all upcoming events in ${stateName} with dates, venues, booth pricing, and exhibitor tips.${cities.length > 0 ? ' Major convention cities include ' + cities.join(', ') + '.' : ''}`,
                filterType: 'state',
                filterValue: abbr,
                stateCities: cities,
                showCategoryFilter: true,
                showCountryFilter: false,
                scannlyContext: `Your Next Show in ${stateName}`,
                relatedLinksTitle: 'Browse More States',
                relatedLinks: otherStates,
            });

            writeFile(filePath, html);
            generatedUrls.push(canonicalPath);
            generated.push({ name: stateName, slug, count: num, abbr });
            count++;
            console.log(`  Generated: states/${slug}.html (${num} shows)`);
        });

    console.log(`  Total: ${count} state pages`);
    totalGenerated += count;
    return generated;
}

// ── 4 & 5. US City + International City Pages ──
function generateCityPages() {
    console.log('\n=== Generating New City Pages ===');
    const dir = path.join(BASE, 'cities');

    // US cities with 10+ shows
    const usCities = {};
    shows.forEach(s => {
        if ((s.country === 'United States' || s.country === 'US') && s.city) {
            usCities[s.city] = (usCities[s.city] || 0) + 1;
        }
    });

    // International cities with 100+ shows
    const intlCities = {};
    shows.forEach(s => {
        if (s.country && s.country !== 'United States' && s.country !== 'US' && s.city) {
            intlCities[s.city] = (intlCities[s.city] || 0) + 1;
        }
    });

    let count = 0;
    const generated = [];

    // US Cities
    Object.entries(usCities)
        .filter(([city, num]) => num >= 10 && !existingCitySlugs.includes(slugify(city)))
        .sort((a, b) => b[1] - a[1])
        .forEach(([city, num]) => {
            const slug = slugify(city);
            const filePath = path.join(dir, slug + '.html');
            const canonicalPath = `/cities/${slug}.html`;

            const otherCities = [...Object.entries(usCities), ...Object.entries(intlCities)]
                .filter(([c]) => c !== city)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 12)
                .map(([c]) => ({ name: c, url: `/cities/${slugify(c)}.html` }));

            const html = buildPage({
                title: `Trade Shows in ${city} 2026 | ShowFloorTips`,
                metaDesc: `Browse ${num}+ trade shows in ${city} for 2026. Find upcoming expos, conventions, and exhibitions with dates, venues, and booth costs.`,
                keywords: `trade shows in ${city}, ${city} conventions 2026, ${city} expos, trade shows ${city}`,
                canonicalPath,
                ogImage: IMAGES.default,
                breadcrumbs: [
                    { name: 'Home', url: SITE_URL },
                    { name: 'Cities', url: SITE_URL + '/cities/' },
                    { name: `${city} Trade Shows`, url: SITE_URL + canonicalPath }
                ],
                heroIcon: '🏙️',
                heroTitle: `Trade Shows in ${city}`,
                heroDesc: `Discover ${num}+ trade shows, expos, and conventions in ${city} for 2026.`,
                introText: `${city} hosts trade shows and exhibitions across multiple industries. Browse all upcoming events with dates, venues, booth pricing, and exhibitor tips.`,
                filterType: 'city',
                filterValue: city,
                showCategoryFilter: true,
                showCountryFilter: false,
                scannlyContext: `Your Next Show in ${city}`,
                relatedLinksTitle: 'Browse More Cities',
                relatedLinks: otherCities,
            });

            writeFile(filePath, html);
            generatedUrls.push(canonicalPath);
            generated.push({ name: city, slug, count: num, type: 'us' });
            count++;
            console.log(`  Generated: cities/${slug}.html (${num} shows, US)`);
        });

    // International Cities
    Object.entries(intlCities)
        .filter(([city, num]) => num >= 100)
        .sort((a, b) => b[1] - a[1])
        .forEach(([city, num]) => {
            const slug = slugify(city);
            if (existingCitySlugs.includes(slug)) return;
            const filePath = path.join(dir, slug + '.html');
            const canonicalPath = `/cities/${slug}.html`;

            // Find country for this city
            const cityShow = shows.find(s => s.city === city && s.country);
            const country = cityShow ? cityShow.country : '';

            const otherCities = Object.entries(intlCities)
                .filter(([c]) => c !== city && intlCities[c] >= 100)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 12)
                .map(([c]) => ({ name: c, url: `/cities/${slugify(c)}.html` }));

            const html = buildPage({
                title: `Trade Shows in ${city} 2026 | ShowFloorTips`,
                metaDesc: `Browse ${num}+ trade shows in ${city}${country ? ', ' + country : ''} for 2026. Find expos, conventions, and exhibitions with dates and venues.`,
                keywords: `trade shows in ${city}, ${city} expos 2026, ${city} conventions, ${city} exhibitions`,
                canonicalPath,
                ogImage: IMAGES.default,
                breadcrumbs: [
                    { name: 'Home', url: SITE_URL },
                    { name: 'Cities', url: SITE_URL + '/cities/' },
                    { name: `${city} Trade Shows`, url: SITE_URL + canonicalPath }
                ],
                heroIcon: '🌏',
                heroTitle: `Trade Shows in ${city}`,
                heroDesc: `Discover ${num}+ trade shows, expos, and conventions in ${city}${country ? ', ' + country : ''} for 2026.`,
                introText: `${city}${country ? ', ' + country + ',' : ''} is a major international trade show destination. Browse all upcoming exhibitions with dates, venues, and exhibitor information.`,
                filterType: 'city',
                filterValue: city,
                showCategoryFilter: true,
                showCountryFilter: false,
                scannlyContext: `Your Next Show in ${city}`,
                relatedLinksTitle: 'Browse More Cities',
                relatedLinks: otherCities,
            });

            writeFile(filePath, html);
            generatedUrls.push(canonicalPath);
            generated.push({ name: city, slug, count: num, type: 'intl', country });
            count++;
            console.log(`  Generated: cities/${slug}.html (${num} shows, intl)`);
        });

    console.log(`  Total: ${count} city pages`);
    totalGenerated += count;
    return generated;
}

// ── 6. Venue Pages ──
function generateVenuePages() {
    console.log('\n=== Generating Venue Pages ===');
    const dir = path.join(BASE, 'venues');
    ensureDir(dir);

    const venues = {};
    shows.forEach(s => { if (s.venue) venues[s.venue] = (venues[s.venue] || 0) + 1; });

    let count = 0;
    const generated = [];

    Object.entries(venues)
        .filter(([v, num]) => num >= 50)
        .sort((a, b) => b[1] - a[1])
        .forEach(([venue, num]) => {
            const slug = slugify(venue);
            const filePath = path.join(dir, slug + '.html');
            const canonicalPath = `/venues/${slug}.html`;

            // Find city/country for this venue
            const venueShow = shows.find(s => s.venue === venue);
            const city = venueShow ? venueShow.city : '';
            const country = venueShow ? venueShow.country : '';

            const otherVenues = Object.entries(venues)
                .filter(([v]) => v !== venue && venues[v] >= 50)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10)
                .map(([v]) => ({ name: v, url: `/venues/${slugify(v)}.html` }));

            const html = buildPage({
                title: `Trade Shows at ${venue} 2026 | ShowFloorTips`,
                metaDesc: `Browse ${num}+ trade shows at ${venue}${city ? ' in ' + city : ''}. Find upcoming expos with dates, booth costs, and exhibitor tips.`,
                keywords: `${venue} trade shows, ${venue} events 2026, ${venue} exhibitions, trade shows at ${venue}`,
                canonicalPath,
                ogImage: IMAGES.venue,
                breadcrumbs: [
                    { name: 'Home', url: SITE_URL },
                    { name: 'Venues', url: SITE_URL + '/venues/' },
                    { name: venue, url: SITE_URL + canonicalPath }
                ],
                heroIcon: '🏛️',
                heroTitle: `Trade Shows at ${venue}`,
                heroDesc: `Discover ${num}+ trade shows and exhibitions at ${venue}${city ? ' in ' + city : ''}${country ? ', ' + country : ''}.`,
                introText: `${venue}${city ? ' in ' + city : ''}${country ? ', ' + country : ''} is a premier trade show and exhibition venue. Browse all upcoming events hosted at this venue with dates, industries, and exhibitor information.`,
                filterType: 'venue',
                filterValue: venue,
                showCategoryFilter: true,
                showCountryFilter: false,
                scannlyContext: venue,
                relatedLinksTitle: 'Browse More Venues',
                relatedLinks: otherVenues,
            });

            writeFile(filePath, html);
            generatedUrls.push(canonicalPath);
            generated.push({ name: venue, slug, count: num, city, country });
            count++;
            console.log(`  Generated: venues/${slug}.html (${num} shows)`);
        });

    // Generate index
    const indexHtml = buildIndexPage({
        title: 'Trade Shows by Venue 2026 | ShowFloorTips',
        metaDesc: 'Browse trade shows at the world\'s top convention centers and exhibition venues. Find events by venue for 2026.',
        canonicalPath: '/venues/',
        heroTitle: 'Trade Shows by Venue',
        heroDesc: 'Browse trade shows at the world\'s top convention centers and exhibition venues.',
        items: generated,
        itemUrlPrefix: '/venues/',
    });
    writeFile(path.join(dir, 'index.html'), indexHtml);
    generatedUrls.push('/venues/');
    count++;

    console.log(`  Total: ${count} venue pages (inc. index)`);
    totalGenerated += count;
    return generated;
}

// ── 7. Attendee Size Tier Pages ──
function generateSizeTierPages() {
    console.log('\n=== Generating Attendee Size Tier Pages ===');
    const dir = path.join(BASE, 'browse');
    ensureDir(dir);

    const tiers = [
        { slug: 'mega-trade-shows', title: 'Mega Trade Shows (50,000+ Attendees)', filterType: 'attendees_min', filterValue: 50000, desc: 'The largest trade shows in the world with 50,000+ attendees. These mega events are industry-defining exhibitions that attract professionals from around the globe.' },
        { slug: 'large-trade-shows', title: 'Large Trade Shows (20,000-49,999)', filterType: 'attendees_range', filterMin: 20000, filterMax: 49999, desc: 'Large-scale trade shows with 20,000 to 49,999 attendees. Major industry events with extensive exhibit halls and comprehensive programming.' },
        { slug: 'mid-size-trade-shows', title: 'Mid-Size Trade Shows (5,000-19,999)', filterType: 'attendees_range', filterMin: 5000, filterMax: 19999, desc: 'Mid-size trade shows with 5,000 to 19,999 attendees. These focused events offer excellent networking opportunities and targeted industry content.' },
        { slug: 'small-trade-shows', title: 'Small Trade Shows (1,000-4,999)', filterType: 'attendees_range', filterMin: 1000, filterMax: 4999, desc: 'Smaller, more intimate trade shows with 1,000 to 4,999 attendees. Perfect for focused networking and niche industry exploration.' },
        { slug: 'boutique-trade-shows', title: 'Boutique Trade Shows (Under 1,000)', filterType: 'attendees_range', filterMin: 1, filterMax: 999, desc: 'Boutique and specialized trade shows with fewer than 1,000 attendees. Highly focused events with premium networking and curated attendee lists.' },
        { slug: 'highest-attendance-trade-shows', title: 'Highest Attendance Trade Shows 2026', filterType: 'attendees_min', filterValue: 10000, desc: 'The most-attended trade shows of 2026. These blockbuster events draw tens of thousands of professionals and define their industries.' },
    ];

    let count = 0;
    const generated = [];

    tiers.forEach(tier => {
        // Pre-count
        const tierShows = shows.filter(s => {
            const att = parseAttendees(s.attendees);
            if (tier.filterType === 'attendees_min') return att >= tier.filterValue;
            if (tier.filterType === 'attendees_range') return att >= tier.filterMin && att <= tier.filterMax;
            return false;
        });
        if (tierShows.length < 10) {
            console.log(`  Skipped: browse/${tier.slug}.html (only ${tierShows.length} shows)`);
            return;
        }

        const filePath = path.join(dir, tier.slug + '.html');
        const canonicalPath = `/browse/${tier.slug}.html`;

        const otherTiers = tiers.filter(t => t.slug !== tier.slug)
            .map(t => ({ name: t.title, url: `/browse/${t.slug}.html` }));

        const html = buildPage({
            title: `${tier.title} | ShowFloorTips`,
            metaDesc: `Browse ${tierShows.length}+ ${tier.title.toLowerCase()}. Find the biggest and best trade shows by attendance for 2026.`,
            keywords: `${tier.title.toLowerCase()}, biggest trade shows, largest expos, trade show attendance`,
            canonicalPath,
            ogImage: IMAGES.mega,
            breadcrumbs: [
                { name: 'Home', url: SITE_URL },
                { name: 'Browse', url: SITE_URL + '/browse/' },
                { name: tier.title, url: SITE_URL + canonicalPath }
            ],
            heroIcon: '📊',
            heroTitle: tier.title,
            heroDesc: `${tierShows.length}+ trade shows in this size tier for 2026.`,
            introText: tier.desc,
            filterType: tier.filterType,
            filterValue: tier.filterValue,
            filterMin: tier.filterMin,
            filterMax: tier.filterMax,
            showCategoryFilter: true,
            showCountryFilter: true,
            scannlyContext: 'Your Next Trade Show',
            relatedLinksTitle: 'Browse by Size',
            relatedLinks: otherTiers,
        });

        writeFile(filePath, html);
        generatedUrls.push(canonicalPath);
        generated.push({ name: tier.title, slug: tier.slug, count: tierShows.length });
        count++;
        console.log(`  Generated: browse/${tier.slug}.html (${tierShows.length} shows)`);
    });

    console.log(`  Total: ${count} size tier pages`);
    totalGenerated += count;
    return generated;
}

// ── 8. Booth Price Tier Pages ──
function generatePriceTierPages() {
    console.log('\n=== Generating Booth Price Tier Pages ===');
    const dir = path.join(BASE, 'browse');
    ensureDir(dir);

    const tiers = [
        { slug: 'budget-trade-shows', title: 'Budget Trade Shows (Under $5,000)', filterType: 'booth_max', filterValue: 5000, desc: 'Affordable trade shows with booth prices under $5,000. Perfect for startups, small businesses, and first-time exhibitors looking to maximize ROI on a budget.' },
        { slug: 'mid-range-trade-shows', title: 'Mid-Range Trade Shows ($5,000-$15,000)', filterType: 'booth_range', filterMin: 5000, filterMax: 15000, desc: 'Mid-range trade shows with booth costs between $5,000 and $15,000. Well-established events offering strong value for growing businesses.' },
        { slug: 'premium-trade-shows', title: 'Premium Trade Shows ($15,000-$30,000)', filterType: 'booth_range', filterMin: 15000, filterMax: 30000, desc: 'Premium trade shows with booth investments of $15,000 to $30,000. Major industry events with high-quality attendees and strong lead generation potential.' },
        { slug: 'luxury-trade-shows', title: 'Luxury Trade Shows ($30,000+)', filterType: 'booth_range', filterMin: 30000, filterMax: 999999, desc: 'Top-tier trade shows with booth investments of $30,000 and above. The most prestigious events in their industries, attracting premium exhibitors and high-value buyers.' },
        { slug: 'affordable-trade-shows', title: 'Most Affordable Trade Shows 2026', filterType: 'booth_max', filterValue: 3000, desc: 'The most affordable trade shows for 2026 with booth prices under $3,000. Low-cost opportunities to exhibit your products and grow your business.' },
    ];

    let count = 0;
    const generated = [];

    tiers.forEach(tier => {
        const tierShows = shows.filter(s => {
            const price = parseBoothPrice(s.booth_price);
            if (tier.filterType === 'booth_max') return price > 0 && price <= tier.filterValue;
            if (tier.filterType === 'booth_range') return price >= tier.filterMin && price <= tier.filterMax;
            return false;
        });
        if (tierShows.length < 10) {
            console.log(`  Skipped: browse/${tier.slug}.html (only ${tierShows.length} shows)`);
            return;
        }

        const filePath = path.join(dir, tier.slug + '.html');
        const canonicalPath = `/browse/${tier.slug}.html`;

        const otherTiers = tiers.filter(t => t.slug !== tier.slug)
            .map(t => ({ name: t.title, url: `/browse/${t.slug}.html` }));

        const html = buildPage({
            title: `${tier.title} | ShowFloorTips`,
            metaDesc: `Browse ${tierShows.length}+ ${tier.title.toLowerCase()} for 2026. Find trade shows that fit your exhibiting budget.`,
            keywords: `${tier.title.toLowerCase()}, affordable trade shows, cheap booth costs, trade show booth prices`,
            canonicalPath,
            ogImage: IMAGES.budget,
            breadcrumbs: [
                { name: 'Home', url: SITE_URL },
                { name: 'Browse', url: SITE_URL + '/browse/' },
                { name: tier.title, url: SITE_URL + canonicalPath }
            ],
            heroIcon: '💰',
            heroTitle: tier.title,
            heroDesc: `${tierShows.length}+ trade shows in this price range for 2026.`,
            introText: tier.desc,
            filterType: tier.filterType,
            filterValue: tier.filterValue,
            filterMin: tier.filterMin,
            filterMax: tier.filterMax,
            showCategoryFilter: true,
            showCountryFilter: true,
            scannlyContext: 'Your Next Trade Show',
            relatedLinksTitle: 'Browse by Price',
            relatedLinks: otherTiers,
        });

        writeFile(filePath, html);
        generatedUrls.push(canonicalPath);
        generated.push({ name: tier.title, slug: tier.slug, count: tierShows.length });
        count++;
        console.log(`  Generated: browse/${tier.slug}.html (${tierShows.length} shows)`);
    });

    console.log(`  Total: ${count} price tier pages`);
    totalGenerated += count;
    return generated;
}

// ── 9. Seasonal Pages ──
function generateSeasonalPages() {
    console.log('\n=== Generating Seasonal Pages ===');
    const dir = path.join(BASE, 'browse');
    ensureDir(dir);

    const seasons = [
        { slug: 'spring-trade-shows', title: 'Spring 2026 Trade Shows', filterType: 'season', filterMin: 3, filterMax: 5, desc: 'Trade shows happening in spring 2026 (March through May). Plan your spring exhibition season with our complete directory of upcoming events.' },
        { slug: 'summer-trade-shows', title: 'Summer 2026 Trade Shows', filterType: 'season', filterMin: 6, filterMax: 8, desc: 'Trade shows happening in summer 2026 (June through August). Browse summer exhibitions, conventions, and expos across all industries.' },
        { slug: 'fall-trade-shows', title: 'Fall 2026 Trade Shows', filterType: 'season', filterMin: 9, filterMax: 11, desc: 'Trade shows happening in fall 2026 (September through November). The busiest trade show season of the year with major industry events.' },
        { slug: 'winter-trade-shows', title: 'Winter 2026-2027 Trade Shows', filterType: 'season', filterMin: 12, filterMax: 2, desc: 'Trade shows happening in winter 2026-2027 (December through February). Start the new year strong with these winter exhibitions and conventions.' },
    ];

    let count = 0;
    const generated = [];

    seasons.forEach(season => {
        // Handle winter wrapping (Dec=12, Jan=1, Feb=2)
        const seasonShows = shows.filter(s => {
            if (!s.sort_date) return false;
            const month = parseInt(s.sort_date.substring(5, 7), 10);
            if (season.filterMin <= season.filterMax) {
                return month >= season.filterMin && month <= season.filterMax;
            } else {
                return month >= season.filterMin || month <= season.filterMax;
            }
        });

        if (seasonShows.length < 10) {
            console.log(`  Skipped: browse/${season.slug}.html (only ${seasonShows.length} shows)`);
            return;
        }

        const filePath = path.join(dir, season.slug + '.html');
        const canonicalPath = `/browse/${season.slug}.html`;

        const otherSeasons = seasons.filter(s => s.slug !== season.slug)
            .map(s => ({ name: s.title, url: `/browse/${s.slug}.html` }));

        // For winter, we need special handling in client-side filter
        let filterConfig = {
            filterType: season.filterType,
            filterMin: season.filterMin,
            filterMax: season.filterMax,
        };

        const html = buildPage({
            title: `${season.title} | ShowFloorTips`,
            metaDesc: `Browse ${seasonShows.length}+ ${season.title.toLowerCase()}. Plan your exhibition season with dates, venues, and booth costs.`,
            keywords: `${season.title.toLowerCase()}, seasonal trade shows, upcoming expos, trade show calendar 2026`,
            canonicalPath,
            ogImage: IMAGES.seasonal,
            breadcrumbs: [
                { name: 'Home', url: SITE_URL },
                { name: 'Browse', url: SITE_URL + '/browse/' },
                { name: season.title, url: SITE_URL + canonicalPath }
            ],
            heroIcon: season.filterMin >= 3 && season.filterMin <= 5 ? '🌸' : season.filterMin >= 6 && season.filterMin <= 8 ? '☀️' : season.filterMin >= 9 && season.filterMin <= 11 ? '🍂' : '❄️',
            heroTitle: season.title,
            heroDesc: `${seasonShows.length}+ trade shows this season. Plan ahead with our complete directory.`,
            introText: season.desc,
            ...filterConfig,
            showCategoryFilter: true,
            showCountryFilter: true,
            scannlyContext: 'Your Next Trade Show',
            relatedLinksTitle: 'Browse by Season',
            relatedLinks: otherSeasons,
        });

        writeFile(filePath, html);
        generatedUrls.push(canonicalPath);
        generated.push({ name: season.title, slug: season.slug, count: seasonShows.length });
        count++;
        console.log(`  Generated: browse/${season.slug}.html (${seasonShows.length} shows)`);
    });

    console.log(`  Total: ${count} seasonal pages`);
    totalGenerated += count;
    return generated;
}

// ── 10. Country+Category Combo Pages ──
function generateComboPages() {
    console.log('\n=== Generating Country+Category Combo Pages ===');
    const dir = path.join(BASE, 'browse');
    ensureDir(dir);

    // Top countries and categories
    const topCountries = {};
    shows.forEach(s => { if (s.country) topCountries[s.country] = (topCountries[s.country] || 0) + 1; });
    const countriesList = Object.entries(topCountries)
        .filter(([c, n]) => n >= 100)
        .sort((a, b) => b[1] - a[1])
        .map(([c]) => c);

    const topCats = {};
    shows.forEach(s => { if (s.category) topCats[s.category] = (topCats[s.category] || 0) + 1; });
    const catsList = Object.entries(topCats)
        .filter(([c, n]) => n >= 200)
        .sort((a, b) => b[1] - a[1])
        .map(([c]) => c);

    let count = 0;
    const generated = [];

    for (const country of countriesList) {
        for (const cat of catsList) {
            // Count shows for this combo
            const comboShows = shows.filter(s => s.country === country && s.category === cat);
            if (comboShows.length < 10) continue;

            const slug = `${slugify(cat)}-trade-shows-in-${slugify(country)}`;
            const filePath = path.join(dir, slug + '.html');
            const canonicalPath = `/browse/${slug}.html`;

            const relatedCombos = [];
            // Same country, different categories
            catsList.filter(c => c !== cat).slice(0, 4).forEach(c => {
                relatedCombos.push({ name: `${c} in ${country}`, url: `/browse/${slugify(c)}-trade-shows-in-${slugify(country)}.html` });
            });
            // Same category, different countries
            countriesList.filter(c => c !== country).slice(0, 4).forEach(c => {
                relatedCombos.push({ name: `${cat} in ${c}`, url: `/browse/${slugify(cat)}-trade-shows-in-${slugify(c)}.html` });
            });

            const html = buildPage({
                title: `${cat} Trade Shows in ${country} 2026`,
                metaDesc: `Browse ${comboShows.length}+ ${cat.toLowerCase()} trade shows in ${country} for 2026. Find expos with dates, venues, and booth costs.`,
                keywords: `${cat.toLowerCase()} trade shows in ${country}, ${country} ${cat.toLowerCase()} expos, ${cat.toLowerCase()} exhibitions ${country}`,
                canonicalPath,
                ogImage: IMAGES[slugify(cat)] || IMAGES.default,
                breadcrumbs: [
                    { name: 'Home', url: SITE_URL },
                    { name: 'Browse', url: SITE_URL + '/browse/' },
                    { name: `${cat} in ${country}`, url: SITE_URL + canonicalPath }
                ],
                heroIcon: CATEGORY_ICONS[cat] || '📋',
                heroTitle: `${cat} Trade Shows in ${country}`,
                heroDesc: `${comboShows.length}+ ${cat.toLowerCase()} trade shows in ${country} for 2026.`,
                introText: `Discover ${cat.toLowerCase()} trade shows and exhibitions in ${country}. Browse events with dates, venues, booth pricing, and exhibitor tips.`,
                filterType: 'combo',
                filterCat: cat,
                filterCountry: country,
                showCategoryFilter: false,
                showCountryFilter: false,
                scannlyContext: `Your Next ${cat} Show in ${country}`,
                relatedLinksTitle: 'Related Pages',
                relatedLinks: relatedCombos,
            });

            writeFile(filePath, html);
            generatedUrls.push(canonicalPath);
            generated.push({ name: `${cat} in ${country}`, slug, count: comboShows.length });
            count++;
            if (count % 50 === 0) console.log(`  ...${count} combo pages generated`);
        }
    }

    console.log(`  Total: ${count} combo pages`);
    totalGenerated += count;
    return generated;
}


// ═══════════════════════════════════════════════════════════
// INDEX PAGE BUILDER
// ═══════════════════════════════════════════════════════════

function buildIndexPage(config) {
    // config: { title, metaDesc, canonicalPath, heroTitle, heroDesc, items, itemUrlPrefix }
    const seoTitle = truncate(config.title, 60);
    const metaDesc = truncate(config.metaDesc, 160);

    const itemCards = config.items.map((item, i) => `
            <a href="${config.itemUrlPrefix}${item.slug}.html" style="display:block;background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:1.5rem;text-decoration:none;transition:border-color 0.2s,box-shadow 0.2s">
                <div style="font-size:1.15rem;font-weight:700;color:#0a0a0a;margin-bottom:0.35rem">${i + 1}. ${escapeHtml(item.name)}</div>
                <div style="font-size:1.5rem;font-weight:800;color:#0a0a0a">${item.count}</div>
                <div style="font-size:0.78rem;color:#64748b;text-transform:uppercase;letter-spacing:0.05em">Trade Shows</div>
                <span style="display:inline-block;margin-top:0.75rem;font-size:0.85rem;font-weight:600;color:#475569">Browse shows &rarr;</span>
            </a>`).join('\n');

    return `<!DOCTYPE html>
<html lang="en">
<head>
${ga4Tag()}
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(seoTitle)}</title>
    <meta name="description" content="${escapeHtml(metaDesc)}">
    <meta property="og:title" content="${escapeHtml(seoTitle)}">
    <meta property="og:description" content="${escapeHtml(metaDesc)}">
    <meta property="og:type" content="website">
    <meta property="og:url" content="${SITE_URL}${config.canonicalPath}">
    <meta property="og:site_name" content="ShowFloorTips">
    <meta name="twitter:card" content="summary_large_image">
    <link rel="canonical" href="${SITE_URL}${config.canonicalPath}">
    <link rel="stylesheet" href="/styles.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "name": "${escapeHtml(config.heroTitle)}",
        "description": "${escapeHtml(metaDesc)}",
        "url": "${SITE_URL}${config.canonicalPath}",
        "publisher": {"@type": "Organization", "name": "ShowFloorTips", "url": "${SITE_URL}"}
    }
    </script>
    <style>
        .idx-hero { background: #0a0a0a; color: #fff; padding: 4rem 2rem 3rem; text-align: center }
        .idx-hero h1 { font-size: 2.6rem; font-weight: 800; letter-spacing: -0.03em; margin-bottom: 0.75rem }
        .idx-hero p { font-size: 1.05rem; color: #94a3b8; max-width: 640px; margin: 0 auto; line-height: 1.7 }
        .idx-content { max-width: 1000px; margin: 0 auto; padding: 2rem }
        .idx-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem }
        .idx-grid a:hover { border-color: #334155; box-shadow: 0 4px 16px rgba(0,0,0,0.06) }
        @media(max-width:768px) { .idx-hero h1 { font-size: 1.75rem } .idx-grid { grid-template-columns: 1fr } }
        body.dark-mode .idx-hero { background: #0f0f23 }
        body.dark-mode .idx-grid a { background: #1e1e32; border-color: #2a2a4a; color: #e2e8f0 }
        body.dark-mode .idx-grid a div:first-child { color: #e2e8f0 }
        body.dark-mode .idx-grid a div:nth-child(2) { color: #e2e8f0 }
    </style>
</head>
<body>
${headerNav()}

    <section class="idx-hero">
        <h1>${escapeHtml(config.heroTitle)}</h1>
        <p>${escapeHtml(config.heroDesc)}</p>
    </section>

    <div class="idx-content">
        <div style="text-align:center;margin-bottom:2rem">
            <div style="font-size:2rem;font-weight:800;color:#0a0a0a">${config.items.length}</div>
            <div style="font-size:0.82rem;color:#64748b;text-transform:uppercase;letter-spacing:0.05em">${config.heroTitle.includes('Venue') ? 'Venues' : config.heroTitle.includes('Country') ? 'Countries' : 'Pages'}</div>
        </div>
        <div class="idx-grid">
${itemCards}
        </div>
    </div>

${newsletterHtml()}
${footerHtml()}

    <script>
    ${darkModeScript()}
    </script>
</body>
</html>`;
}

// ── Browse Index Page ──
function generateBrowseIndex(sizeTiers, priceTiers, seasonals, combos) {
    console.log('\n=== Generating Browse Index ===');
    const dir = path.join(BASE, 'browse');
    ensureDir(dir);

    const allItems = [
        { heading: 'By Attendee Size', items: sizeTiers },
        { heading: 'By Booth Price', items: priceTiers },
        { heading: 'By Season', items: seasonals },
    ];

    const sectionHtml = allItems.map(section => `
        <h2 style="font-size:1.3rem;font-weight:700;margin:2rem 0 1rem">${escapeHtml(section.heading)}</h2>
        <div class="idx-grid">
${section.items.map(item => `
            <a href="/browse/${item.slug}.html" style="display:block;background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:1.5rem;text-decoration:none;transition:border-color 0.2s,box-shadow 0.2s">
                <div style="font-size:1rem;font-weight:700;color:#0a0a0a;margin-bottom:0.35rem">${escapeHtml(item.name)}</div>
                <div style="font-size:1.3rem;font-weight:800;color:#0a0a0a">${item.count}+ shows</div>
                <span style="display:inline-block;margin-top:0.5rem;font-size:0.85rem;font-weight:600;color:#475569">Browse &rarr;</span>
            </a>`).join('\n')}
        </div>`).join('\n');

    // Top combo pages
    const topCombos = combos.sort((a, b) => b.count - a.count).slice(0, 24);
    const comboHtml = `
        <h2 style="font-size:1.3rem;font-weight:700;margin:2rem 0 1rem">By Country + Industry (${combos.length} pages)</h2>
        <div class="idx-grid">
${topCombos.map(item => `
            <a href="/browse/${item.slug}.html" style="display:block;background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:1.5rem;text-decoration:none;transition:border-color 0.2s,box-shadow 0.2s">
                <div style="font-size:0.95rem;font-weight:700;color:#0a0a0a;margin-bottom:0.35rem">${escapeHtml(item.name)}</div>
                <div style="font-size:1.3rem;font-weight:800;color:#0a0a0a">${item.count}+ shows</div>
                <span style="display:inline-block;margin-top:0.5rem;font-size:0.85rem;font-weight:600;color:#475569">Browse &rarr;</span>
            </a>`).join('\n')}
        </div>
        <p style="text-align:center;margin-top:1rem;color:#64748b;font-size:0.9rem">...and ${combos.length - topCombos.length} more country+industry pages</p>`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
${ga4Tag()}
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Browse Trade Shows 2026 | ShowFloorTips</title>
    <meta name="description" content="Browse trade shows by size, price, season, or country+industry combination. Find the perfect events for your exhibiting strategy.">
    <meta property="og:title" content="Browse Trade Shows 2026 | ShowFloorTips">
    <meta property="og:description" content="Browse trade shows by size, price, season, or country+industry combination.">
    <meta property="og:type" content="website">
    <meta property="og:url" content="${SITE_URL}/browse/">
    <meta property="og:site_name" content="ShowFloorTips">
    <meta name="twitter:card" content="summary_large_image">
    <link rel="canonical" href="${SITE_URL}/browse/">
    <link rel="stylesheet" href="/styles.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        .idx-hero { background: #0a0a0a; color: #fff; padding: 4rem 2rem 3rem; text-align: center }
        .idx-hero h1 { font-size: 2.6rem; font-weight: 800; letter-spacing: -0.03em; margin-bottom: 0.75rem }
        .idx-hero p { font-size: 1.05rem; color: #94a3b8; max-width: 640px; margin: 0 auto; line-height: 1.7 }
        .idx-content { max-width: 1000px; margin: 0 auto; padding: 2rem }
        .idx-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem }
        .idx-grid a:hover { border-color: #334155; box-shadow: 0 4px 16px rgba(0,0,0,0.06) }
        @media(max-width:768px) { .idx-hero h1 { font-size: 1.75rem } .idx-grid { grid-template-columns: 1fr } }
        body.dark-mode .idx-hero { background: #0f0f23 }
        body.dark-mode .idx-grid a { background: #1e1e32; border-color: #2a2a4a }
        body.dark-mode .idx-grid a div:first-child { color: #e2e8f0 }
        body.dark-mode h2 { color: #e2e8f0 }
    </style>
</head>
<body>
${headerNav()}

    <section class="idx-hero">
        <h1>Browse Trade Shows</h1>
        <p>Explore trade shows by attendance size, booth cost, season, or country+industry combination.</p>
    </section>

    <div class="idx-content">
${sectionHtml}
${comboHtml}
    </div>

${newsletterHtml()}
${footerHtml()}

    <script>
    ${darkModeScript()}
    </script>
</body>
</html>`;

    writeFile(path.join(dir, 'index.html'), html);
    generatedUrls.push('/browse/');
    totalGenerated++;
}


// ═══════════════════════════════════════════════════════════
// SITEMAP UPDATER
// ═══════════════════════════════════════════════════════════

function updateSitemap() {
    console.log('\n=== Updating Sitemap ===');
    const sitemapPath = path.join(BASE, 'sitemap-pages.xml');
    let sitemap = fs.readFileSync(sitemapPath, 'utf8');

    // Remove closing </urlset> tag
    sitemap = sitemap.replace('</urlset>', '');

    // Add new URLs
    let added = 0;
    for (const url of generatedUrls) {
        const fullUrl = SITE_URL + url;
        // Check if already in sitemap
        if (sitemap.includes(`<loc>${fullUrl}</loc>`)) continue;

        sitemap += `  <url>\n    <loc>${fullUrl}</loc>\n    <lastmod>${TODAY}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
        added++;
    }

    sitemap += '</urlset>';

    if (!dryRun) {
        fs.writeFileSync(sitemapPath, sitemap, 'utf8');
    }
    console.log(`  Added ${added} new URLs to sitemap (${generatedUrls.length} total generated, ${generatedUrls.length - added} already existed)`);
}


// ═══════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════

console.log(`\nShowFloorTips SEO Page Generator`);
console.log(`================================`);
if (dryRun) console.log('DRY RUN MODE — no files will be written\n');
if (typeFilter) console.log(`Running only: ${typeFilter}\n`);

const results = {};

const generators = {
    industries: generateIndustryPages,
    countries: generateCountryPages,
    states: generateStatePages,
    cities: generateCityPages,
    venues: generateVenuePages,
    'size-tiers': generateSizeTierPages,
    'price-tiers': generatePriceTierPages,
    seasonal: generateSeasonalPages,
    combos: generateComboPages,
};

if (typeFilter) {
    if (generators[typeFilter]) {
        results[typeFilter] = generators[typeFilter]();
    } else {
        console.error(`Unknown type: ${typeFilter}. Available: ${Object.keys(generators).join(', ')}`);
        process.exit(1);
    }
} else {
    // Run all generators
    results.industries = generateIndustryPages();
    results.countries = generateCountryPages();
    results.states = generateStatePages();
    results.cities = generateCityPages();
    results.venues = generateVenuePages();
    results['size-tiers'] = generateSizeTierPages();
    results['price-tiers'] = generatePriceTierPages();
    results.seasonal = generateSeasonalPages();
    results.combos = generateComboPages();

    // Generate browse index
    generateBrowseIndex(
        results['size-tiers'] || [],
        results['price-tiers'] || [],
        results.seasonal || [],
        results.combos || []
    );

    // Update sitemap
    updateSitemap();
}

// Summary
console.log(`\n================================`);
console.log(`SUMMARY`);
console.log(`================================`);
console.log(`Total pages generated: ${totalGenerated}`);
console.log(`Total URLs for sitemap: ${generatedUrls.length}`);
Object.entries(results).forEach(([type, items]) => {
    if (Array.isArray(items)) {
        console.log(`  ${type}: ${items.length} pages`);
    }
});
if (dryRun) {
    console.log(`\nThis was a DRY RUN. Run without --dry-run to generate files.`);
}
console.log(`\nDone!`);
