#!/usr/bin/env node
/**
 * Trade Show Database - Comprehensive Statistical Analysis
 * Generates a detailed report from defined_shows data in shows.js
 */

const fs = require('fs');
const path = require('path');

// ── Load and parse shows.js ──────────────────────────────────────────────────
const raw = fs.readFileSync(path.join(__dirname, 'shows.js'), 'utf8');
// Strip "var defined_shows = " prefix and trailing ";\nvar SHOWS_DATA = defined_shows;" suffix
const jsonStr = raw.replace(/^var\s+defined_shows\s*=\s*/, '')
                    .replace(/;\s*var\s+SHOWS_DATA\s*=\s*defined_shows;\s*$/, '')
                    .trim()
                    .replace(/;$/, '');
const shows = JSON.parse(jsonStr);

// ── Helpers ──────────────────────────────────────────────────────────────────
function unique(arr) { return [...new Set(arr.filter(Boolean))]; }
function pct(n, d) { return d ? (n / d * 100).toFixed(1) + '%' : '0%'; }
function dollars(n) { return isNaN(n) ? 'N/A' : '$' + Math.round(n).toLocaleString('en-US'); }
function commaNum(n) { return n.toLocaleString('en-US'); }
function pad(s, len) { return String(s).padEnd(len); }
function padL(s, len) { return String(s).padStart(len); }

function parseBoothPrice(str) {
  if (!str) return null;
  const nums = str.match(/[\d,]+/g);
  if (!nums || nums.length === 0) return null;
  const parsed = nums.map(n => parseInt(n.replace(/,/g, ''), 10)).filter(n => !isNaN(n));
  if (parsed.length === 0) return null;
  // midpoint of range, or single value
  if (parsed.length >= 2) return (parsed[0] + parsed[parsed.length - 1]) / 2;
  return parsed[0];
}

function parseAttendance(str) {
  if (!str) return null;
  const m = str.match(/([\d,]+)/);
  if (!m) return null;
  return parseInt(m[1].replace(/,/g, ''), 10);
}

function topN(map, n, total) {
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([k, v], i) => {
      const line = `  ${padL(i + 1, 3)}. ${pad(k, 45)} ${padL(commaNum(v), 6)}`;
      return total ? line + `  (${pct(v, total)})` : line;
    })
    .join('\n');
}

function countBy(arr, keyFn) {
  const map = {};
  for (const item of arr) {
    const key = keyFn(item);
    if (key) map[key] = (map[key] || 0) + 1;
  }
  return map;
}

function avgBy(arr, keyFn, valFn) {
  const sums = {};
  const counts = {};
  for (const item of arr) {
    const key = keyFn(item);
    const val = valFn(item);
    if (key && val !== null && !isNaN(val)) {
      sums[key] = (sums[key] || 0) + val;
      counts[key] = (counts[key] || 0) + 1;
    }
  }
  const result = {};
  for (const k of Object.keys(sums)) {
    result[k] = { avg: sums[k] / counts[k], count: counts[k] };
  }
  return result;
}

// ── Country → Continent mapping ──────────────────────────────────────────────
const continentMap = {
  // North America
  'USA': 'North America', 'US': 'North America', 'Canada': 'North America', 'Mexico': 'North America',
  'Costa Rica': 'North America', 'Panama': 'North America', 'Jamaica': 'North America',
  'Dominican Republic': 'North America', 'Puerto Rico': 'North America', 'Trinidad and Tobago': 'North America',
  'Guatemala': 'North America', 'Honduras': 'North America', 'El Salvador': 'North America',
  'Nicaragua': 'North America', 'Cuba': 'North America', 'Bahamas': 'North America',
  'Barbados': 'North America', 'Bermuda': 'North America',
  // South America
  'Brazil': 'South America', 'Argentina': 'South America', 'Colombia': 'South America',
  'Chile': 'South America', 'Peru': 'South America', 'Ecuador': 'South America',
  'Venezuela': 'South America', 'Uruguay': 'South America', 'Paraguay': 'South America',
  'Bolivia': 'South America',
  // Europe
  'UK': 'Europe', 'Germany': 'Europe', 'France': 'Europe', 'Italy': 'Europe', 'Spain': 'Europe',
  'Netherlands': 'Europe', 'Belgium': 'Europe', 'Austria': 'Europe', 'Switzerland': 'Europe',
  'Sweden': 'Europe', 'Norway': 'Europe', 'Denmark': 'Europe', 'Finland': 'Europe',
  'Ireland': 'Europe', 'Portugal': 'Europe', 'Poland': 'Europe', 'Czech Republic': 'Europe',
  'Czechia': 'Europe', 'Hungary': 'Europe', 'Romania': 'Europe', 'Greece': 'Europe',
  'Croatia': 'Europe', 'Serbia': 'Europe', 'Bulgaria': 'Europe', 'Slovakia': 'Europe',
  'Slovenia': 'Europe', 'Lithuania': 'Europe', 'Latvia': 'Europe', 'Estonia': 'Europe',
  'Luxembourg': 'Europe', 'Malta': 'Europe', 'Cyprus': 'Europe', 'Iceland': 'Europe',
  'Monaco': 'Europe', 'Ukraine': 'Europe', 'Turkey': 'Europe', 'Russia': 'Europe',
  'Bosnia and Herzegovina': 'Europe', 'North Macedonia': 'Europe', 'Albania': 'Europe',
  'Montenegro': 'Europe', 'Moldova': 'Europe', 'Belarus': 'Europe',
  // Asia
  'China': 'Asia', 'Japan': 'Asia', 'South Korea': 'Asia', 'India': 'Asia',
  'Singapore': 'Asia', 'Thailand': 'Asia', 'Malaysia': 'Asia', 'Indonesia': 'Asia',
  'Philippines': 'Asia', 'Vietnam': 'Asia', 'Taiwan': 'Asia', 'Hong Kong': 'Asia',
  'Pakistan': 'Asia', 'Bangladesh': 'Asia', 'Sri Lanka': 'Asia', 'Myanmar': 'Asia',
  'Cambodia': 'Asia', 'Laos': 'Asia', 'Nepal': 'Asia', 'Mongolia': 'Asia',
  'Kazakhstan': 'Asia', 'Uzbekistan': 'Asia', 'Macau': 'Asia',
  // Middle East
  'UAE': 'Middle East', 'Saudi Arabia': 'Middle East', 'Qatar': 'Middle East',
  'Bahrain': 'Middle East', 'Kuwait': 'Middle East', 'Oman': 'Middle East',
  'Israel': 'Middle East', 'Jordan': 'Middle East', 'Lebanon': 'Middle East',
  'Iraq': 'Middle East', 'Iran': 'Middle East', 'Yemen': 'Middle East',
  // Africa
  'South Africa': 'Africa', 'Nigeria': 'Africa', 'Kenya': 'Africa', 'Egypt': 'Africa',
  'Morocco': 'Africa', 'Ghana': 'Africa', 'Ethiopia': 'Africa', 'Tanzania': 'Africa',
  'Uganda': 'Africa', 'Rwanda': 'Africa', 'Tunisia': 'Africa', 'Algeria': 'Africa',
  'Senegal': 'Africa', 'Ivory Coast': 'Africa', 'Cameroon': 'Africa', 'Mozambique': 'Africa',
  'Zambia': 'Africa', 'Zimbabwe': 'Africa', 'Botswana': 'Africa', 'Namibia': 'Africa',
  'Mauritius': 'Africa', 'Madagascar': 'Africa', 'Angola': 'Africa',
  // Oceania
  'Australia': 'Oceania', 'New Zealand': 'Oceania', 'Fiji': 'Oceania',
  'Papua New Guinea': 'Oceania',
};

function getContinent(country) {
  if (!country) return 'Unknown';
  return continentMap[country] || 'Other/Unknown';
}

// ── US State extraction ──────────────────────────────────────────────────────
const usStateAbbrevs = {
  'AL':'Alabama','AK':'Alaska','AZ':'Arizona','AR':'Arkansas','CA':'California',
  'CO':'Colorado','CT':'Connecticut','DE':'Delaware','FL':'Florida','GA':'Georgia',
  'HI':'Hawaii','ID':'Idaho','IL':'Illinois','IN':'Indiana','IA':'Iowa',
  'KS':'Kansas','KY':'Kentucky','LA':'Louisiana','ME':'Maine','MD':'Maryland',
  'MA':'Massachusetts','MI':'Michigan','MN':'Minnesota','MS':'Mississippi','MO':'Missouri',
  'MT':'Montana','NE':'Nebraska','NV':'Nevada','NH':'New Hampshire','NJ':'New Jersey',
  'NM':'New Mexico','NY':'New York','NC':'North Carolina','ND':'North Dakota','OH':'Ohio',
  'OK':'Oklahoma','OR':'Oregon','PA':'Pennsylvania','RI':'Rhode Island','SC':'South Carolina',
  'SD':'South Dakota','TN':'Tennessee','TX':'Texas','UT':'Utah','VT':'Vermont',
  'VA':'Virginia','WA':'Washington','WV':'West Virginia','WI':'Wisconsin','WY':'Wyoming',
  'DC':'District of Columbia'
};

// ── BEGIN ANALYSIS ───────────────────────────────────────────────────────────
const lines = [];
function out(s = '') { lines.push(s); }
function hr() { out('─'.repeat(90)); }
function section(title) { out(''); hr(); out(`  ${title.toUpperCase()}`); hr(); }

const total = shows.length;
const countries = countBy(shows, s => s.country);
const cities = countBy(shows, s => s.city);
const venues = countBy(shows, s => s.venue);
const categories = countBy(shows, s => s.category);
const hosts = countBy(shows, s => s.host);

// ══════════════════════════════════════════════════════════════════════════════
out('══════════════════════════════════════════════════════════════════════════════════════════');
out('  TRADE SHOW DATABASE — COMPREHENSIVE STATISTICAL ANALYSIS');
out('  Generated: ' + new Date().toISOString().split('T')[0]);
out('══════════════════════════════════════════════════════════════════════════════════════════');

// ── 1. VOLUME STATS ──────────────────────────────────────────────────────────
section('1. VOLUME STATISTICS');
out(`  Total Shows:               ${commaNum(total)}`);
out(`  Total Unique Countries:    ${commaNum(Object.keys(countries).length)}`);
out(`  Total Unique Cities:       ${commaNum(Object.keys(cities).length)}`);
out(`  Total Unique Venues:       ${commaNum(Object.keys(venues).length)}`);
out(`  Total Unique Categories:   ${commaNum(Object.keys(categories).length)}`);
out(`  Total Unique Organizers:   ${commaNum(Object.keys(hosts).length)}`);

// ── 2. GEOGRAPHIC DISTRIBUTION ───────────────────────────────────────────────
section('2. GEOGRAPHIC DISTRIBUTION');

out('\n  Top 20 Countries by Show Count:');
out(topN(countries, 20, total));

out('\n  Top 20 Cities by Show Count:');
out(topN(cities, 20, total));

// US states
const usShows = shows.filter(s => s.country === 'USA' || s.country === 'US');
const stateMap = {};
for (const s of usShows) {
  let st = s.state;
  if (!st) {
    // try to extract from location
    const locMatch = s.location && s.location.match(/,\s*([A-Z]{2})$/);
    if (locMatch && usStateAbbrevs[locMatch[1]]) st = usStateAbbrevs[locMatch[1]];
  }
  if (st) {
    const full = usStateAbbrevs[st] || st;
    stateMap[full] = (stateMap[full] || 0) + 1;
  }
}
out(`\n  Top 10 US States by Show Count (of ${commaNum(usShows.length)} US shows):`);
out(topN(stateMap, 10, usShows.length));

// Continents
const continents = countBy(shows, s => getContinent(s.country));
out('\n  Shows by Continent:');
out(topN(continents, 10, total));

// ── 3. INDUSTRY DISTRIBUTION ─────────────────────────────────────────────────
section('3. INDUSTRY / CATEGORY DISTRIBUTION');
out('\n  Top 30 Categories by Show Count:');
out(topN(categories, 30, total));

// ── 4. TEMPORAL DISTRIBUTION ─────────────────────────────────────────────────
section('4. TEMPORAL DISTRIBUTION');

const monthNames = ['January','February','March','April','May','June',
                    'July','August','September','October','November','December'];

// Parse sort_date
const dated = shows.map(s => {
  if (!s.sort_date) return null;
  const d = new Date(s.sort_date + 'T00:00:00');
  if (isNaN(d)) return null;
  return { show: s, date: d, month: d.getMonth(), year: d.getFullYear(), day: d.getDay() };
}).filter(Boolean);

// Shows by month
const byMonth = {};
for (const d of dated) {
  const key = `${d.year}-${String(d.month + 1).padStart(2, '0')}`;
  byMonth[key] = (byMonth[key] || 0) + 1;
}
out(`\n  Shows by Month (${dated[0] ? dated[0].year : '2026'}):`);
const year2026 = dated.filter(d => d.year === 2026);
for (let m = 0; m < 12; m++) {
  const cnt = year2026.filter(d => d.month === m).length;
  const bar = '█'.repeat(Math.round(cnt / Math.max(1, ...Array.from({length:12}, (_, i) => year2026.filter(d => d.month === i).length)) * 40));
  out(`    ${pad(monthNames[m], 12)} ${padL(commaNum(cnt), 6)}  ${bar}`);
}

// Shows by quarter
out('\n  Shows by Quarter (2026):');
for (let q = 0; q < 4; q++) {
  const cnt = year2026.filter(d => d.month >= q * 3 && d.month < (q + 1) * 3).length;
  out(`    Q${q + 1}:  ${padL(commaNum(cnt), 6)}  (${pct(cnt, year2026.length)})`);
}

// Busiest week
const weekMap = {};
for (const d of year2026) {
  // ISO week number
  const jan1 = new Date(d.date.getFullYear(), 0, 1);
  const dayOfYear = Math.floor((d.date - jan1) / 86400000) + 1;
  const weekNum = Math.ceil((dayOfYear + jan1.getDay()) / 7);
  weekMap[weekNum] = (weekMap[weekNum] || 0) + 1;
}
const busiestWeek = Object.entries(weekMap).sort((a, b) => b[1] - a[1])[0];
if (busiestWeek) {
  // Find the Monday of that week
  const jan1 = new Date(2026, 0, 1);
  const weekStart = new Date(jan1.getTime() + ((busiestWeek[0] - 1) * 7 - jan1.getDay() + 1) * 86400000);
  const weekEnd = new Date(weekStart.getTime() + 6 * 86400000);
  const fmt = d => `${monthNames[d.getMonth()].slice(0, 3)} ${d.getDate()}`;
  out(`\n  Busiest Week of 2026: Week ${busiestWeek[0]} (${fmt(weekStart)} – ${fmt(weekEnd)}) with ${commaNum(busiestWeek[1])} shows`);
}

// Day of week
const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const byDay = {};
for (const d of dated) { byDay[d.day] = (byDay[d.day] || 0) + 1; }
out('\n  Shows by Starting Day of Week:');
for (let i = 0; i < 7; i++) {
  const cnt = byDay[i] || 0;
  out(`    ${pad(dayNames[i], 12)} ${padL(commaNum(cnt), 6)}  (${pct(cnt, dated.length)})`);
}

// ── 5. COST ANALYSIS ─────────────────────────────────────────────────────────
section('5. BOOTH COST ANALYSIS');

const prices = shows.map(s => ({ show: s, price: parseBoothPrice(s.booth_price) })).filter(p => p.price !== null);
const priceVals = prices.map(p => p.price);
const avgPrice = priceVals.reduce((a, b) => a + b, 0) / priceVals.length;
const sortedPrices = [...priceVals].sort((a, b) => a - b);
const medianPrice = sortedPrices[Math.floor(sortedPrices.length / 2)];

out(`\n  Shows with booth pricing data: ${commaNum(prices.length)} / ${commaNum(total)} (${pct(prices.length, total)})`);
out(`  Average booth price (midpoint): ${dollars(avgPrice)}`);
out(`  Median booth price (midpoint):  ${dollars(medianPrice)}`);
out(`  Min booth price midpoint:       ${dollars(sortedPrices[0])}`);
out(`  Max booth price midpoint:       ${dollars(sortedPrices[sortedPrices.length - 1])}`);

// Price by industry
const priceByIndustry = avgBy(prices, p => p.show.category, p => p.price);
const industryPriceSorted = Object.entries(priceByIndustry)
  .filter(([_, v]) => v.count >= 3)
  .sort((a, b) => b[1].avg - a[1].avg);
out('\n  Top 15 Most Expensive Industries (avg booth midpoint, min 3 shows):');
industryPriceSorted.slice(0, 15).forEach(([k, v], i) => {
  out(`  ${padL(i + 1, 3)}. ${pad(k, 40)} ${padL(dollars(v.avg), 10)}  (n=${v.count})`);
});
out('\n  Top 15 Cheapest Industries (avg booth midpoint, min 3 shows):');
industryPriceSorted.slice(-15).reverse().forEach(([k, v], i) => {
  out(`  ${padL(i + 1, 3)}. ${pad(k, 40)} ${padL(dollars(v.avg), 10)}  (n=${v.count})`);
});

// Price by country
const priceByCountry = avgBy(prices, p => p.show.country, p => p.price);
const countryPriceSorted = Object.entries(priceByCountry)
  .filter(([_, v]) => v.count >= 3)
  .sort((a, b) => b[1].avg - a[1].avg);
out('\n  Top 10 Most Expensive Countries (avg booth midpoint, min 3 shows):');
countryPriceSorted.slice(0, 10).forEach(([k, v], i) => {
  out(`  ${padL(i + 1, 3)}. ${pad(k, 40)} ${padL(dollars(v.avg), 10)}  (n=${v.count})`);
});

// Price by city
const priceByCity = avgBy(prices, p => p.show.city, p => p.price);
const cityPriceSorted = Object.entries(priceByCity)
  .filter(([_, v]) => v.count >= 3)
  .sort((a, b) => b[1].avg - a[1].avg);
out('\n  Top 10 Most Expensive Cities (avg booth midpoint, min 3 shows):');
cityPriceSorted.slice(0, 10).forEach(([k, v], i) => {
  out(`  ${padL(i + 1, 3)}. ${pad(k, 40)} ${padL(dollars(v.avg), 10)}  (n=${v.count})`);
});

// Booth price range distribution
const rangeBuckets = { '$0-$2,500': 0, '$2,501-$5,000': 0, '$5,001-$10,000': 0,
  '$10,001-$20,000': 0, '$20,001-$50,000': 0, '$50,001-$100,000': 0, '$100,000+': 0 };
for (const p of priceVals) {
  if (p <= 2500) rangeBuckets['$0-$2,500']++;
  else if (p <= 5000) rangeBuckets['$2,501-$5,000']++;
  else if (p <= 10000) rangeBuckets['$5,001-$10,000']++;
  else if (p <= 20000) rangeBuckets['$10,001-$20,000']++;
  else if (p <= 50000) rangeBuckets['$20,001-$50,000']++;
  else if (p <= 100000) rangeBuckets['$50,001-$100,000']++;
  else rangeBuckets['$100,000+']++;
}
out('\n  Booth Price Range Distribution (midpoint):');
for (const [range, cnt] of Object.entries(rangeBuckets)) {
  const bar = '█'.repeat(Math.round(cnt / Math.max(...Object.values(rangeBuckets)) * 40));
  out(`    ${pad(range, 20)} ${padL(commaNum(cnt), 6)}  (${pct(cnt, priceVals.length)})  ${bar}`);
}

// ── 6. ATTENDANCE ANALYSIS ───────────────────────────────────────────────────
section('6. ATTENDANCE ANALYSIS');

const attendances = shows.map(s => ({ show: s, att: parseAttendance(s.attendees) })).filter(a => a.att !== null && a.att > 0);
const attVals = attendances.map(a => a.att);
const avgAtt = attVals.reduce((a, b) => a + b, 0) / attVals.length;
const sortedAtt = [...attVals].sort((a, b) => a - b);
const medianAtt = sortedAtt[Math.floor(sortedAtt.length / 2)];

out(`\n  Shows with attendance data: ${commaNum(attendances.length)} / ${commaNum(total)} (${pct(attendances.length, total)})`);
out(`  Average attendance:  ${commaNum(Math.round(avgAtt))}`);
out(`  Median attendance:   ${commaNum(medianAtt)}`);
out(`  Min attendance:      ${commaNum(sortedAtt[0])}`);
out(`  Max attendance:      ${commaNum(sortedAtt[sortedAtt.length - 1])}`);

// Top 20 largest shows
out('\n  Top 20 Largest Shows by Attendance:');
attendances.sort((a, b) => b.att - a.att).slice(0, 20).forEach((a, i) => {
  out(`  ${padL(i + 1, 3)}. ${pad(a.show.title, 55)} ${padL(commaNum(a.att), 10)}  (${a.show.city}, ${a.show.country})`);
});

// Attendance by industry
const attByIndustry = avgBy(attendances, a => a.show.category, a => a.att);
const industryAttSorted = Object.entries(attByIndustry)
  .filter(([_, v]) => v.count >= 3)
  .sort((a, b) => b[1].avg - a[1].avg);
out('\n  Top 20 Industries by Average Attendance (min 3 shows):');
industryAttSorted.slice(0, 20).forEach(([k, v], i) => {
  out(`  ${padL(i + 1, 3)}. ${pad(k, 40)} ${padL(commaNum(Math.round(v.avg)), 10)}  (n=${v.count})`);
});

// Attendance by country
const attByCountry = avgBy(attendances, a => a.show.country, a => a.att);
const countryAttSorted = Object.entries(attByCountry)
  .filter(([_, v]) => v.count >= 3)
  .sort((a, b) => b[1].avg - a[1].avg);
out('\n  Top 15 Countries by Average Attendance (min 3 shows):');
countryAttSorted.slice(0, 15).forEach(([k, v], i) => {
  out(`  ${padL(i + 1, 3)}. ${pad(k, 40)} ${padL(commaNum(Math.round(v.avg)), 10)}  (n=${v.count})`);
});

// ── 7. VENUE ANALYSIS ────────────────────────────────────────────────────────
section('7. VENUE ANALYSIS');

out('\n  Top 20 Most-Used Venues:');
out(topN(venues, 20, total));

const venueValues = Object.values(venues);
const venueAvg = venueValues.reduce((a, b) => a + b, 0) / venueValues.length;
const sortedVenues = [...venueValues].sort((a, b) => a - b);
const venueMedian = sortedVenues[Math.floor(sortedVenues.length / 2)];
const venueMax = sortedVenues[sortedVenues.length - 1];
out(`\n  Venue Statistics:`);
out(`    Total unique venues:         ${commaNum(venueValues.length)}`);
out(`    Average shows per venue:     ${venueAvg.toFixed(2)}`);
out(`    Median shows per venue:      ${venueMedian}`);
out(`    Max shows at single venue:   ${venueMax}`);

// Venue show count distribution
const venueDist = {};
for (const v of venueValues) {
  const bucket = v >= 10 ? '10+' : String(v);
  venueDist[bucket] = (venueDist[bucket] || 0) + 1;
}
out('\n  Distribution of Shows per Venue:');
const bucketOrder = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10+'];
for (const b of bucketOrder) {
  if (venueDist[b]) {
    const bar = '█'.repeat(Math.round((venueDist[b] / Math.max(...Object.values(venueDist))) * 40));
    out(`    ${pad(b + ' show(s)', 15)} ${padL(commaNum(venueDist[b]), 6)} venues  ${bar}`);
  }
}

// ── 8. OTHER INSIGHTS ────────────────────────────────────────────────────────
section('8. OTHER INSIGHTS & DATA QUALITY');

const withHotels = shows.filter(s => s.hotels && Array.isArray(s.hotels) && s.hotels.length > 0);
const withTips = shows.filter(s => s.tips && Array.isArray(s.tips) && s.tips.length > 0);
const withWebsite = shows.filter(s => s.website && s.website.trim().length > 0);
const withDescription = shows.filter(s => s.description && s.description.trim().length > 0);
const withRegistration = shows.filter(s => s.registration_info && s.registration_info.trim().length > 0);
const withImage = shows.filter(s => s.image && s.image.trim().length > 0);
const withExhibitors = shows.filter(s => s.exhibitors && s.exhibitors.trim().length > 0);

out(`\n  Data Completeness:`);
out(`    Shows with hotel data:         ${commaNum(withHotels.length)} / ${commaNum(total)}  (${pct(withHotels.length, total)})`);
out(`    Shows with exhibitor tips:     ${commaNum(withTips.length)} / ${commaNum(total)}  (${pct(withTips.length, total)})`);
out(`    Shows with official website:   ${commaNum(withWebsite.length)} / ${commaNum(total)}  (${pct(withWebsite.length, total)})`);
out(`    Shows with description:        ${commaNum(withDescription.length)} / ${commaNum(total)}  (${pct(withDescription.length, total)})`);
out(`    Shows with registration info:  ${commaNum(withRegistration.length)} / ${commaNum(total)}  (${pct(withRegistration.length, total)})`);
out(`    Shows with image:              ${commaNum(withImage.length)} / ${commaNum(total)}  (${pct(withImage.length, total)})`);
out(`    Shows with exhibitor count:    ${commaNum(withExhibitors.length)} / ${commaNum(total)}  (${pct(withExhibitors.length, total)})`);
out(`    Shows with booth pricing:      ${commaNum(prices.length)} / ${commaNum(total)}  (${pct(prices.length, total)})`);
out(`    Shows with attendance data:    ${commaNum(attendances.length)} / ${commaNum(total)}  (${pct(attendances.length, total)})`);

// Hotels per show
const hotelCounts = withHotels.map(s => s.hotels.length);
const avgHotels = hotelCounts.reduce((a, b) => a + b, 0) / hotelCounts.length;
const maxHotels = Math.max(...hotelCounts);
out(`\n  Hotel Listings:`);
out(`    Average hotels per show (when present): ${avgHotels.toFixed(2)}`);
out(`    Max hotels listed for a single show:    ${maxHotels}`);

// Tips per show
const tipCounts = withTips.map(s => s.tips.length);
const avgTips = tipCounts.reduce((a, b) => a + b, 0) / tipCounts.length;
out(`\n  Exhibitor Tips:`);
out(`    Average tips per show (when present): ${avgTips.toFixed(2)}`);

// Most common raw booth_price strings
const rawPriceStrings = {};
for (const s of shows) {
  if (s.booth_price) rawPriceStrings[s.booth_price] = (rawPriceStrings[s.booth_price] || 0) + 1;
}
out('\n  Most Common Booth Price Strings (Top 20):');
Object.entries(rawPriceStrings).sort((a, b) => b[1] - a[1]).slice(0, 20).forEach(([k, v], i) => {
  out(`  ${padL(i + 1, 3)}. ${pad(k, 35)} ${padL(commaNum(v), 6)}  (${pct(v, prices.length)})`);
});

// Source breakdown
const sources = countBy(shows, s => s.source);
out('\n  Data Source Breakdown:');
out(topN(sources, 10, total));

// ── Footer ───────────────────────────────────────────────────────────────────
out('');
hr();
out(`  END OF REPORT — ${commaNum(total)} shows analyzed`);
hr();

// ── Output ───────────────────────────────────────────────────────────────────
const output = lines.join('\n');
console.log(output);
fs.writeFileSync(path.join(__dirname, 'show-analysis-results.txt'), output, 'utf8');
console.log('\n[Report saved to show-analysis-results.txt]');
