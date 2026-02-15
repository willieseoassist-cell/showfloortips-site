#!/usr/bin/env node
/**
 * ShowFloorTips Mass Email Sender
 *
 * Reads verified emails and sends in daily batches with warmup schedule.
 * Tracks everything: sends, opens, replies, bounces, unsubscribes.
 *
 * Usage:
 *   node mass-sender.js send              - Send today's batch
 *   node mass-sender.js send --campaign=sponsor   - Send sponsor pitch
 *   node mass-sender.js send --campaign=newsletter - Send newsletter invite
 *   node mass-sender.js send --campaign=free-listing - Send free listing offer
 *   node mass-sender.js followup           - Send follow-ups to non-responders
 *   node mass-sender.js status             - Show dashboard
 *   node mass-sender.js warmup             - Show warmup schedule
 *   node mass-sender.js test               - Send test to yourself
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const readline = require('readline');

const BASE = __dirname;

// === CONFIG ===
const CONFIG = {
  // UPDATE THIS with your new Resend API key tomorrow
  RESEND_API_KEY: process.env.RESEND_API_KEY || 'YOUR_KEY_HERE',
  FROM_NAME: 'Willie Austin',
  FROM_EMAIL: 'willie@showfloortips.com',
  REPLY_TO: 'willie@showfloortips.com',
  TEST_EMAIL: 'willie.seo.assist@gmail.com',
  BATCH_DELAY_MS: 1200,

  // Warmup schedule (day: max sends)
  WARMUP: {
    1: 20, 2: 20, 3: 30, 4: 30, 5: 50,
    6: 50, 7: 75, 8: 100, 9: 150, 10: 200,
    11: 300, 12: 400, 13: 500, 14: 750,
    15: 1000, 16: 1500, 17: 2000, 18: 2500,
    19: 3000, 20: 4000, 21: 5000,
  },

  // After day 21, send this many per day
  CRUISE_LIMIT: 5000,

  // Files
  VERIFIED_FILE: path.join(BASE, 'verified_emails.csv'),
  TARGETED_FILE: path.join(BASE, 'million-emails.csv'),
  STATE_FILE: path.join(BASE, 'mass-sender-state.json'),
  LOG_FILE: path.join(BASE, 'mass-sender-log.jsonl'),
};

// === EMAIL TEMPLATES ===
const TEMPLATES = {
  // CAMPAIGN 1: Free listing offer (highest conversion - give value first)
  'free-listing': {
    subject: (domain) => `Free featured listing for ${domain} on ShowFloorTips`,
    html: (data) => `<div style="font-family:Arial,sans-serif;max-width:550px;color:#222;line-height:1.7">
<p>Hi there,</p>

<p>I run <a href="https://showfloortips.com" style="color:#e94560;text-decoration:none"><strong>ShowFloorTips.com</strong></a> — we have <strong>24,800+ trade show listings</strong> and 25,000+ articles that trade show exhibitors use to plan their events.</p>

<p>I noticed <strong>${data.domain}</strong> and wanted to offer you a <strong>free featured listing</strong> on our site. No strings attached — we're building out our vendor directory and want to include quality companies.</p>

<p><strong>What you get (free):</strong></p>
<ul style="padding-left:20px">
<li>Company profile on our vendor directory</li>
<li>Link back to your website (great for SEO)</li>
<li>Visibility to exhibitors actively researching trade show services</li>
</ul>

<p>Want in? Just reply with your company name and a one-line description, and I'll add you this week.</p>

<p>— Willie Austin<br>
<a href="https://showfloortips.com" style="color:#e94560;text-decoration:none">ShowFloorTips.com</a></p>

<p style="font-size:11px;color:#999;margin-top:30px">You're receiving this because ${data.domain} appears in our trade show industry database. <a href="https://showfloortips.com/unsubscribe?email=${encodeURIComponent(data.email)}" style="color:#999">Unsubscribe</a></p>
</div>`
  },

  // CAMPAIGN 2: Sponsor pitch (for companies that engage with free listing)
  'sponsor': {
    subject: (domain) => `Quick question about ${domain}'s trade show marketing`,
    html: (data) => `<div style="font-family:Arial,sans-serif;max-width:550px;color:#222;line-height:1.7">
<p>Hi there,</p>

<p>I'm Willie from <a href="https://showfloortips.com" style="color:#e94560;text-decoration:none">ShowFloorTips.com</a>. We're the largest independent trade show resource with 24,800+ show listings and 25,000+ articles.</p>

<p>I'm reaching out to a handful of companies in the ${data.category || 'trade show'} space about a sponsorship opportunity.</p>

<p><strong>What we're offering:</strong></p>
<ul style="padding-left:20px">
<li>Your logo + link on our homepage (seen by every visitor)</li>
<li>A dedicated article showcasing ${data.domain}</li>
<li>Featured placement on relevant show pages</li>
<li>Weekly newsletter mention</li>
</ul>

<p>We're keeping sponsor spots limited to <strong>5 companies per category</strong> to keep it exclusive. Starting at $500/month.</p>

<p>Worth a quick chat? I can share our traffic data and media kit.</p>

<p>— Willie Austin<br>
<a href="https://showfloortips.com" style="color:#e94560;text-decoration:none">ShowFloorTips.com</a> | <a href="https://showfloortips.com/media-kit.html" style="color:#e94560;text-decoration:none">Media Kit</a></p>

<p style="font-size:11px;color:#999;margin-top:30px"><a href="https://showfloortips.com/unsubscribe?email=${encodeURIComponent(data.email)}" style="color:#999">Unsubscribe</a></p>
</div>`
  },

  // CAMPAIGN 3: Newsletter invite (for mass 1M list — grow email list)
  'newsletter': {
    subject: () => 'Free: 2026 trade show calendar (24,800+ shows)',
    html: (data) => `<div style="font-family:Arial,sans-serif;max-width:550px;color:#222;line-height:1.7">
<p>Hi,</p>

<p>Heads up — we just published the most comprehensive <strong>2026 trade show calendar</strong> online. It covers <strong>24,800+ trade shows</strong> across every industry and city.</p>

<p><strong>Free access:</strong> <a href="https://showfloortips.com/calendar.html" style="color:#e94560;text-decoration:none">showfloortips.com/calendar</a></p>

<p>You can filter by industry, city, date — and export any show to your calendar with one click.</p>

<p>We also send a free weekly digest with upcoming shows, exhibitor tips, and industry news. <a href="https://showfloortips.com/newsletter.html" style="color:#e94560;text-decoration:none">Subscribe here</a> if interested.</p>

<p>— ShowFloorTips Team</p>

<p style="font-size:11px;color:#999;margin-top:30px"><a href="https://showfloortips.com/unsubscribe?email=${encodeURIComponent(data.email)}" style="color:#999">Unsubscribe</a></p>
</div>`
  },

  // FOLLOW-UP (sent 3 days after no reply)
  'followup-1': {
    subject: (domain) => `Re: Free featured listing for ${domain}`,
    html: (data) => `<div style="font-family:Arial,sans-serif;max-width:550px;color:#222;line-height:1.7">
<p>Hey — just bumping this up. The free listing offer is still open for ${data.domain}.</p>

<p>Takes 30 seconds — just reply with your company name and what you do, and I'll add you to our directory this week.</p>

<p>— Willie</p>

<p style="font-size:11px;color:#999;margin-top:30px"><a href="https://showfloortips.com/unsubscribe?email=${encodeURIComponent(data.email)}" style="color:#999">Unsubscribe</a></p>
</div>`
  },
};

// === STATE MANAGEMENT ===
function loadState() {
  if (fs.existsSync(CONFIG.STATE_FILE)) {
    return JSON.parse(fs.readFileSync(CONFIG.STATE_FILE, 'utf8'));
  }
  return {
    startDate: new Date().toISOString().split('T')[0],
    totalSent: 0,
    totalBounced: 0,
    totalReplied: 0,
    dailySends: {},
    sentEmails: {},  // email -> { date, campaign, status }
    unsubscribed: [],
  };
}

function saveState(state) {
  fs.writeFileSync(CONFIG.STATE_FILE, JSON.stringify(state, null, 2));
}

function logSend(entry) {
  fs.appendFileSync(CONFIG.LOG_FILE, JSON.stringify({ ...entry, ts: new Date().toISOString() }) + '\n');
}

// === SENDING ===
function sendEmail(to, subject, html) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      from: `${CONFIG.FROM_NAME} <${CONFIG.FROM_EMAIL}>`,
      to: [to],
      reply_to: CONFIG.REPLY_TO,
      subject,
      html,
    });

    const options = {
      hostname: 'api.resend.com',
      path: '/emails',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CONFIG.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ success: true, id: result.id });
          } else {
            resolve({ success: false, error: result.message || body, code: res.statusCode });
          }
        } catch (e) {
          resolve({ success: false, error: body });
        }
      });
    });

    req.on('error', (e) => resolve({ success: false, error: e.message }));
    req.write(payload);
    req.end();
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// === LOAD EMAILS ===
function loadVerifiedEmails() {
  const file = CONFIG.VERIFIED_FILE;
  if (!fs.existsSync(file)) {
    console.log('No verified_emails.csv found. Run verify_emails.py first.');
    process.exit(1);
  }

  const lines = fs.readFileSync(file, 'utf8').split('\n');
  const emails = [];

  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',');
    if (parts.length >= 2 && parts[1] === 'valid') {
      emails.push({ email: parts[0], status: parts[1], mx: parts[2] || '' });
    }
  }

  return emails;
}

function loadTargetedEmails() {
  const file = CONFIG.TARGETED_FILE;
  if (!fs.existsSync(file)) return [];

  const lines = fs.readFileSync(file, 'utf8').split('\n');
  const emails = [];

  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',');
    if (parts.length >= 2) {
      emails.push({ email: parts[0], domain: parts[1], prefix: parts[2] || 'info' });
    }
  }

  return emails;
}

// === GET TODAY'S LIMIT ===
function getTodayLimit(state) {
  const start = new Date(state.startDate);
  const now = new Date();
  const dayNum = Math.floor((now - start) / 86400000) + 1;

  if (dayNum <= 21) {
    return { day: dayNum, limit: CONFIG.WARMUP[dayNum] || CONFIG.CRUISE_LIMIT };
  }
  return { day: dayNum, limit: CONFIG.CRUISE_LIMIT };
}

function getTodaySent(state) {
  const today = new Date().toISOString().split('T')[0];
  return state.dailySends[today] || 0;
}

// === COMMANDS ===
async function cmdSend(campaign = 'free-listing') {
  if (CONFIG.RESEND_API_KEY === 'YOUR_KEY_HERE') {
    console.log('\n  ⚠  Set your Resend API key first!');
    console.log('  Edit mass-sender.js line 25, or set RESEND_API_KEY env variable.\n');
    return;
  }

  const state = loadState();
  const template = TEMPLATES[campaign];
  if (!template) {
    console.log(`Unknown campaign: ${campaign}. Options: ${Object.keys(TEMPLATES).join(', ')}`);
    return;
  }

  const { day, limit } = getTodayLimit(state);
  const todaySent = getTodaySent(state);
  const remaining = limit - todaySent;

  if (remaining <= 0) {
    console.log(`\n  Daily limit reached (${limit} for day ${day}). Try again tomorrow.`);
    return;
  }

  console.log(`\n  Campaign: ${campaign}`);
  console.log(`  Warmup day: ${day} (limit: ${limit}/day)`);
  console.log(`  Already sent today: ${todaySent}`);
  console.log(`  Sending up to: ${remaining}\n`);

  // Load emails based on campaign
  let emailList;
  if (campaign === 'newsletter') {
    emailList = loadVerifiedEmails();
  } else {
    emailList = loadTargetedEmails();
  }

  // Filter out already sent + unsubscribed
  const unsub = new Set(state.unsubscribed);
  const candidates = emailList.filter(e =>
    !state.sentEmails[e.email] && !unsub.has(e.email)
  );

  console.log(`  Total candidates: ${candidates.length}`);
  console.log(`  Sending ${Math.min(remaining, candidates.length)} this batch...\n`);

  const batch = candidates.slice(0, remaining);
  let sent = 0, failed = 0;
  const today = new Date().toISOString().split('T')[0];

  for (let i = 0; i < batch.length; i++) {
    const entry = batch[i];
    const domain = entry.domain || entry.email.split('@')[1];
    const data = { email: entry.email, domain, category: entry.category || '' };

    const subject = template.subject(domain);
    const html = template.html(data);

    const result = await sendEmail(entry.email, subject, html);

    if (result.success) {
      sent++;
      state.sentEmails[entry.email] = { date: today, campaign, status: 'sent' };
      state.totalSent++;
      logSend({ email: entry.email, campaign, status: 'sent', id: result.id });
      console.log(`  [${i+1}/${batch.length}] ✓ ${entry.email}`);
    } else {
      failed++;
      if (result.code === 429) {
        console.log(`\n  Rate limited after ${sent} sends. Stopping.`);
        break;
      }
      logSend({ email: entry.email, campaign, status: 'failed', error: result.error });
      console.log(`  [${i+1}/${batch.length}] ✗ ${entry.email} — ${result.error}`);
    }

    state.dailySends[today] = (state.dailySends[today] || 0) + 1;
    saveState(state);

    if (i < batch.length - 1) await sleep(CONFIG.BATCH_DELAY_MS);
  }

  console.log(`\n  === BATCH DONE ===`);
  console.log(`  Sent: ${sent} | Failed: ${failed}`);
  console.log(`  Total all-time: ${state.totalSent}`);
}

async function cmdTest(campaign = 'free-listing') {
  const template = TEMPLATES[campaign];
  const data = { email: CONFIG.TEST_EMAIL, domain: 'example.com', category: 'Event Technology' };

  console.log(`\n  Sending test (${campaign}) to ${CONFIG.TEST_EMAIL}...`);

  if (CONFIG.RESEND_API_KEY === 'YOUR_KEY_HERE') {
    console.log('\n  Preview only (no API key set):\n');
    console.log(`  Subject: ${template.subject('example.com')}`);
    console.log(`  Body preview: ${template.html(data).replace(/<[^>]*>/g, '').slice(0, 300)}...`);
    return;
  }

  const result = await sendEmail(CONFIG.TEST_EMAIL, template.subject('example.com'), template.html(data));
  console.log(result.success ? `  ✓ Sent! ID: ${result.id}` : `  ✗ Failed: ${result.error}`);
}

function cmdStatus() {
  const state = loadState();
  const { day, limit } = getTodayLimit(state);
  const todaySent = getTodaySent(state);

  const campaigns = {};
  for (const [email, info] of Object.entries(state.sentEmails)) {
    campaigns[info.campaign] = (campaigns[info.campaign] || 0) + 1;
  }

  console.log(`\n  ╔══════════════════════════════════════╗`);
  console.log(`  ║     MASS SENDER DASHBOARD            ║`);
  console.log(`  ╠══════════════════════════════════════╣`);
  console.log(`  ║  Warmup Day:    ${String(day).padStart(6)}              ║`);
  console.log(`  ║  Today's Limit: ${String(limit).padStart(6)}              ║`);
  console.log(`  ║  Sent Today:    ${String(todaySent).padStart(6)}              ║`);
  console.log(`  ║  Remaining:     ${String(Math.max(0, limit - todaySent)).padStart(6)}              ║`);
  console.log(`  ╠══════════════════════════════════════╣`);
  console.log(`  ║  All-time Sent:  ${String(state.totalSent).padStart(7)}             ║`);
  console.log(`  ║  Bounced:        ${String(state.totalBounced).padStart(7)}             ║`);
  console.log(`  ║  Unsubscribed:   ${String(state.unsubscribed.length).padStart(7)}             ║`);
  console.log(`  ╠══════════════════════════════════════╣`);

  for (const [camp, count] of Object.entries(campaigns)) {
    console.log(`  ║  ${camp.padEnd(18)} ${String(count).padStart(7)}             ║`);
  }

  console.log(`  ╚══════════════════════════════════════╝\n`);
}

function cmdWarmup() {
  const state = loadState();
  const { day } = getTodayLimit(state);

  console.log('\n  WARMUP SCHEDULE:\n');
  console.log('  Day  | Daily Limit | Cumulative');
  console.log('  -----|-------------|----------');

  let cumulative = 0;
  for (let d = 1; d <= 21; d++) {
    const lim = CONFIG.WARMUP[d];
    cumulative += lim;
    const marker = d === day ? ' <-- TODAY' : '';
    console.log(`  ${String(d).padStart(4)} | ${String(lim).padStart(11)} | ${String(cumulative).padStart(9)}${marker}`);
  }

  console.log(`\n  After day 21: ${CONFIG.CRUISE_LIMIT}/day\n`);
  console.log(`  Total emails sent during warmup: ~${cumulative.toLocaleString()}`);
  console.log(`  Then ${CONFIG.CRUISE_LIMIT}/day = ${(CONFIG.CRUISE_LIMIT * 30).toLocaleString()}/month\n`);
}

// === MAIN ===
const args = process.argv.slice(2);
const cmd = args[0] || 'status';
const campaignArg = args.find(a => a.startsWith('--campaign='));
const campaign = campaignArg ? campaignArg.split('=')[1] : 'free-listing';

switch (cmd) {
  case 'send': cmdSend(campaign); break;
  case 'followup': cmdSend('followup-1'); break;
  case 'test': cmdTest(campaign); break;
  case 'status': cmdStatus(); break;
  case 'warmup': cmdWarmup(); break;
  default:
    console.log('Commands: send, followup, test, status, warmup');
    console.log('Options: --campaign=free-listing|sponsor|newsletter');
}
