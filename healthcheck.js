#!/usr/bin/env node
// ShowFloorTips Health Check — Monitors site health and logs results
// Run: node healthcheck.js
// Auto-run: launchctl load ~/Library/LaunchAgents/com.showfloortips.healthcheck.plist

const https = require('https');
const fs = require('fs');
const path = require('path');

const SITE = 'https://showfloortips.com';
const LOG_FILE = path.join(__dirname, 'healthcheck.log');
const MAX_LOG_SIZE = 5 * 1024 * 1024; // 5MB max log size

const CHECKS = [
  // Critical data files
  { url: '/shows-lite.js', expect: 200, minSize: 5000000, name: 'shows-lite.js' },
  { url: '/shows.js', expect: 200, minSize: 10000000, name: 'shows.js' },
  { url: '/shows-full.js', expect: 200, minSize: 20000000, name: 'shows-full.js' },
  { url: '/news.js', expect: 200, minSize: 5000000, name: 'news.js' },
  { url: '/homepage-data.js', expect: 200, minSize: 100, name: 'homepage-data.js' },
  // Key pages
  { url: '/', expect: 200, minSize: 10000, name: 'Homepage' },
  { url: '/news.html', expect: 200, minSize: 5000, name: 'News page' },
  { url: '/calendar.html', expect: 200, minSize: 5000, name: 'Calendar' },
  { url: '/show.html', expect: 200, minSize: 5000, name: 'Show detail' },
  { url: '/technology-trade-shows.html', expect: 200, minSize: 5000, name: 'Tech category' },
  // API endpoints
  { url: '/api/subscribe', expect: 405, name: 'Subscribe API (GET=405)' },
];

function log(msg) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ${msg}\n`;
  process.stdout.write(line);
  fs.appendFileSync(LOG_FILE, line);
}

function fetch(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { timeout: 30000 }, (res) => {
      let size = 0;
      res.on('data', (chunk) => { size += chunk.length; });
      res.on('end', () => resolve({ status: res.statusCode, size, headers: res.headers }));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

function fetchBody(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { timeout: 60000 }, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, body }));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

async function checkEndpoints() {
  let passed = 0;
  let failed = 0;

  for (const check of CHECKS) {
    try {
      const result = await fetch(SITE + check.url);
      const statusOk = result.status === check.expect;
      const sizeOk = !check.minSize || result.size >= check.minSize;

      if (statusOk && sizeOk) {
        log(`  OK   ${check.name} — ${result.status} ${(result.size / 1024 / 1024).toFixed(1)}MB`);
        passed++;
      } else {
        const reasons = [];
        if (!statusOk) reasons.push(`status ${result.status} (expected ${check.expect})`);
        if (!sizeOk) reasons.push(`size ${result.size} < ${check.minSize}`);
        log(`  FAIL ${check.name} — ${reasons.join(', ')}`);
        failed++;
      }
    } catch (err) {
      log(`  FAIL ${check.name} — ${err.message}`);
      failed++;
    }
  }

  return { passed, failed };
}

async function checkShowsData() {
  try {
    const { body } = await fetchBody(SITE + '/shows-lite.js');
    // Check it defines the right variables
    if (!body.startsWith('var defined_shows')) {
      log('  FAIL shows-lite.js — does not start with "var defined_shows"');
      return false;
    }
    if (!body.includes('var SHOWS_DATA = defined_shows')) {
      log('  FAIL shows-lite.js — missing SHOWS_DATA alias');
      return false;
    }
    // Count shows (rough check)
    const count = (body.match(/\"slug\"/g) || []).length;
    if (count < 20000) {
      log(`  FAIL shows-lite.js — only ${count} shows (expected 25000+)`);
      return false;
    }
    log(`  OK   shows-lite.js data — ~${count} shows, SHOWS_DATA alias present`);
    return true;
  } catch (err) {
    log(`  FAIL shows-lite.js data check — ${err.message}`);
    return false;
  }
}

async function checkNewsSort() {
  try {
    const { body } = await fetchBody(SITE + '/news.js');

    // Extract article data via regex (avoid eval for safety)
    const nowISO = new Date().toISOString();

    // Check first few News Insights articles have valid timestamps
    const niMatches = body.match(/"category":"News Insights"[^}]*"published_date":"([^"]+)"/g);
    if (!niMatches || niMatches.length === 0) {
      log('  FAIL news.js — no News Insights articles found');
      return false;
    }

    // Check first News Insights date is today and not future
    const firstDate = niMatches[0].match(/"published_date":"([^"]+)"/)[1];
    const today = new Date().toISOString().substring(0, 10);
    if (!firstDate.startsWith(today)) {
      log(`  WARN news.js — top News Insights date is ${firstDate}, not today (${today})`);
    }
    if (firstDate > nowISO) {
      log(`  FAIL news.js — top News Insights is future-dated: ${firstDate} > ${nowISO}`);
      return false;
    }

    log(`  OK   news.js — ${niMatches.length} News Insights found, top date: ${firstDate}`);
    return true;
  } catch (err) {
    log(`  FAIL news.js sort check — ${err.message}`);
    return false;
  }
}

async function checkTopImages() {
  let broken = 0;
  try {
    const { body } = await fetchBody(SITE + '/news.js');

    // Extract image URLs from first 20 articles
    const imgMatches = [...body.matchAll(/"image_url":"(https:\/\/[^"]+)"/g)].slice(0, 20);

    for (const match of imgMatches) {
      const imgUrl = match[1];
      try {
        const result = await fetch(imgUrl);
        if (result.status !== 200) {
          log(`  FAIL Image 404: ${imgUrl}`);
          broken++;
        }
      } catch (err) {
        log(`  FAIL Image error: ${imgUrl} — ${err.message}`);
        broken++;
      }
    }

    if (broken === 0) {
      log(`  OK   Top ${imgMatches.length} article images — all loading`);
    } else {
      log(`  FAIL ${broken}/${imgMatches.length} article images broken`);
    }
  } catch (err) {
    log(`  FAIL Image check — ${err.message}`);
  }
  return broken;
}

async function rotateLogs() {
  try {
    const stats = fs.statSync(LOG_FILE);
    if (stats.size > MAX_LOG_SIZE) {
      const content = fs.readFileSync(LOG_FILE, 'utf8');
      const lines = content.split('\n');
      // Keep last 50% of lines
      const keep = lines.slice(Math.floor(lines.length / 2));
      fs.writeFileSync(LOG_FILE, keep.join('\n'));
      log('Log rotated (exceeded 5MB)');
    }
  } catch (e) {
    // File doesn't exist yet, that's fine
  }
}

async function run() {
  await rotateLogs();

  log('=== HEALTH CHECK START ===');

  // 1. Endpoint checks
  log('Checking endpoints...');
  const { passed, failed } = await checkEndpoints();

  // 2. Shows data validation
  log('Validating shows data...');
  await checkShowsData();

  // 3. News sort order
  log('Checking news sort order...');
  await checkNewsSort();

  // 4. Top article images
  log('Checking top article images...');
  const brokenImages = await checkTopImages();

  // Summary
  const status = failed === 0 && brokenImages === 0 ? 'HEALTHY' : 'ISSUES DETECTED';
  log(`=== ${status} — ${passed}/${passed + failed} endpoints OK, ${brokenImages} broken images ===`);
  log('');

  if (failed > 0 || brokenImages > 0) {
    process.exit(1);
  }
}

run().catch(err => {
  log(`FATAL: ${err.message}`);
  process.exit(1);
});
