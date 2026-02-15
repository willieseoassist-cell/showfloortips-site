#!/usr/bin/env node
/**
 * Scrape & Generate 1M Trade Show Industry Emails
 *
 * Usage:
 *   node scrape-million-emails.js build       - Build email file from all sources
 *   node scrape-million-emails.js add-domains  - Add domains from domains-extra.txt
 *   node scrape-million-emails.js status       - Show counts
 */

const fs = require('fs');
const path = require('path');

const OUT_FILE = path.join(__dirname, 'million-emails.csv');
const DOMAINS_FILE = path.join(__dirname, 'all-domains.txt');
const EXTRA_FILE = path.join(__dirname, 'domains-extra.txt');

// Email prefixes to generate per domain
const PREFIXES = ['info', 'contact', 'sales', 'hello', 'marketing'];

// Domains to exclude (social media, big consumer sites, etc.)
const EXCLUDE = new Set([
  'google.com','facebook.com','twitter.com','instagram.com','linkedin.com','youtube.com',
  'tiktok.com','reddit.com','wikipedia.org','amazon.com','apple.com','microsoft.com',
  'github.com','stackoverflow.com','medium.com','wordpress.com','blogger.com',
  'tumblr.com','pinterest.com','snapchat.com','whatsapp.com','telegram.org',
  'gmail.com','yahoo.com','outlook.com','hotmail.com','aol.com','mail.com',
  'gov','edu','mil','example.com','localhost','test.com',
]);

function isExcluded(domain) {
  if (!domain || domain.length < 4) return true;
  if (!domain.includes('.')) return true;
  for (const ex of EXCLUDE) {
    if (domain === ex || domain.endsWith('.' + ex)) return true;
  }
  // Exclude government and education domains
  if (domain.endsWith('.gov') || domain.endsWith('.edu') || domain.endsWith('.mil')) return true;
  return false;
}

function extractDomain(url) {
  try {
    const u = url.startsWith('http') ? url : 'https://' + url;
    return new URL(u).hostname.replace(/^www\./, '').toLowerCase();
  } catch { return null; }
}

// Phase 1: Extract domains from shows.js
function extractShowDomains() {
  console.log('Phase 1: Extracting domains from shows.js...');
  try {
    eval(fs.readFileSync(path.join(__dirname, 'shows.js'), 'utf8'));
    const shows = typeof defined_shows !== 'undefined' ? defined_shows : [];
    const domains = new Set();
    shows.forEach(s => {
      if (s.website) {
        const d = extractDomain(s.website);
        if (d && !isExcluded(d)) domains.add(d);
      }
    });
    console.log(`  Found ${domains.size} unique domains from ${shows.length} shows`);
    return domains;
  } catch (e) {
    console.log(`  Error loading shows.js: ${e.message}`);
    return new Set();
  }
}

// Phase 2: Load domains from pipeline seeds
function loadPipelineSeeds() {
  console.log('Phase 2: Loading pipeline seed domains...');
  try {
    const lines = fs.readFileSync(path.join(__dirname, 'pipeline-leads.jsonl'), 'utf8').trim().split('\n');
    const domains = new Set();
    lines.forEach(l => {
      try { const lead = JSON.parse(l); if (lead.domain) domains.add(lead.domain); } catch {}
    });
    console.log(`  Found ${domains.size} unique domains from pipeline`);
    return domains;
  } catch { return new Set(); }
}

// Phase 3: Load extra domains from text file (one domain per line)
function loadExtraDomains() {
  console.log('Phase 3: Loading extra domains...');
  const domains = new Set();
  try {
    const lines = fs.readFileSync(EXTRA_FILE, 'utf8').trim().split('\n');
    lines.forEach(l => {
      const d = l.trim().toLowerCase().replace(/^www\./, '');
      if (d && !isExcluded(d)) domains.add(d);
    });
    console.log(`  Found ${domains.size} extra domains`);
  } catch { console.log('  No extra domains file found'); }
  return domains;
}

// Phase 4: Load previously saved domain master list
function loadSavedDomains() {
  try {
    return new Set(fs.readFileSync(DOMAINS_FILE, 'utf8').trim().split('\n').filter(Boolean));
  } catch { return new Set(); }
}

// Generate emails and save
function generateEmails(allDomains) {
  console.log(`\nGenerating emails for ${allDomains.size} unique domains...`);

  // Save master domain list
  fs.writeFileSync(DOMAINS_FILE, [...allDomains].sort().join('\n') + '\n');

  // Generate CSV
  const header = 'email,domain,prefix\n';
  let count = 0;
  const stream = fs.createWriteStream(OUT_FILE);
  stream.write(header);

  for (const domain of allDomains) {
    for (const prefix of PREFIXES) {
      stream.write(`${prefix}@${domain},${domain},${prefix}\n`);
      count++;
    }
  }

  stream.end();
  console.log(`Generated ${count.toLocaleString()} emails → ${OUT_FILE}`);
  console.log(`Master domain list: ${allDomains.size.toLocaleString()} domains → ${DOMAINS_FILE}`);
  return count;
}

// BUILD command
function build() {
  console.log('=== Building Million-Email Database ===\n');

  const allDomains = new Set();

  // Phase 1: Shows
  const showDomains = extractShowDomains();
  showDomains.forEach(d => allDomains.add(d));

  // Phase 2: Pipeline seeds
  const seedDomains = loadPipelineSeeds();
  seedDomains.forEach(d => allDomains.add(d));

  // Phase 3: Extra domains
  const extraDomains = loadExtraDomains();
  extraDomains.forEach(d => allDomains.add(d));

  // Phase 4: Previously saved
  const savedDomains = loadSavedDomains();
  savedDomains.forEach(d => allDomains.add(d));

  const total = generateEmails(allDomains);

  console.log(`\n=== SUMMARY ===`);
  console.log(`Unique domains: ${allDomains.size.toLocaleString()}`);
  console.log(`Total emails:   ${total.toLocaleString()}`);
  console.log(`Target:         1,000,000`);
  console.log(`Progress:       ${(total / 1000000 * 100).toFixed(1)}%`);
  console.log(`Need:           ${Math.max(0, 200000 - allDomains.size).toLocaleString()} more domains`);
}

// ADD-DOMAINS command
function addDomains() {
  if (!fs.existsSync(EXTRA_FILE)) {
    console.log(`No ${EXTRA_FILE} found. Create it with one domain per line.`);
    return;
  }
  build(); // Rebuild with new domains included
}

// STATUS command
function status() {
  const domainCount = fs.existsSync(DOMAINS_FILE)
    ? fs.readFileSync(DOMAINS_FILE, 'utf8').trim().split('\n').filter(Boolean).length
    : 0;
  const emailCount = domainCount * PREFIXES.length;

  console.log(`\n=== Million-Email Status ===`);
  console.log(`Unique domains: ${domainCount.toLocaleString()}`);
  console.log(`Total emails:   ${emailCount.toLocaleString()}`);
  console.log(`Target:         1,000,000`);
  console.log(`Progress:       ${(emailCount / 1000000 * 100).toFixed(1)}%`);
  console.log(`Need:           ${Math.max(0, 200000 - domainCount).toLocaleString()} more domains\n`);
}

// CLI
const cmd = process.argv[2];
switch (cmd) {
  case 'build': build(); break;
  case 'add-domains': addDomains(); break;
  case 'status': status(); break;
  default:
    console.log('Usage: node scrape-million-emails.js [build|add-domains|status]');
}
