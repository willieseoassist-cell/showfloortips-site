import { readFileSync } from 'fs';
import { join } from 'path';

let cachedShows = null;

function loadShows() {
    if (cachedShows) return cachedShows;
    const filePath = join(process.cwd(), 'shows.js');
    const content = readFileSync(filePath, 'utf8');
    const match = content.match(/var defined_shows = (\[[\s\S]*\]);/);
    if (!match) throw new Error('Could not parse shows data');
    cachedShows = JSON.parse(match[1]);
    return cachedShows;
}

function normalizeCategory(cat) {
    return cat.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export default function handler(req, res) {
    // CORS: allow any origin so widgets can be embedded anywhere
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=7200');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const shows = loadShows();
        const { category, count, month, year } = req.query;
        const limit = Math.min(parseInt(count) || 10, 50);
        const today = new Date().toISOString().split('T')[0];

        // Filter to upcoming shows
        let upcoming = shows.filter(s => s.sort_date && s.sort_date >= today);

        // Filter by category if provided
        if (category && category !== 'all') {
            const normCat = normalizeCategory(category);
            upcoming = upcoming.filter(s => {
                const normShowCat = normalizeCategory(s.category || '');
                return normShowCat.includes(normCat) || normCat.includes(normShowCat);
            });
        }

        // Filter by month/year for calendar widget
        if (month && year) {
            const m = parseInt(month);
            const y = parseInt(year);
            upcoming = shows.filter(s => {
                if (!s.sort_date) return false;
                const d = new Date(s.sort_date + 'T00:00:00');
                return d.getMonth() + 1 === m && d.getFullYear() === y;
            });
            // Also apply category filter for calendar
            if (category && category !== 'all') {
                const normCat = normalizeCategory(category);
                upcoming = upcoming.filter(s => {
                    const normShowCat = normalizeCategory(s.category || '');
                    return normShowCat.includes(normCat) || normCat.includes(normShowCat);
                });
            }
        }

        // Sort by date
        upcoming.sort((a, b) => (a.sort_date || '').localeCompare(b.sort_date || ''));

        // Limit results (not for calendar month requests)
        if (!month) {
            upcoming = upcoming.slice(0, limit);
        }

        // Return minimal payload: only fields needed by widgets
        const result = upcoming.map(s => ({
            t: s.title,
            s: s.slug,
            d: s.date,
            sd: s.sort_date,
            ci: s.city,
            co: s.country,
            ca: s.category
        }));

        return res.status(200).json({ shows: result });
    } catch (err) {
        return res.status(500).json({ error: 'Failed to load shows data' });
    }
}
