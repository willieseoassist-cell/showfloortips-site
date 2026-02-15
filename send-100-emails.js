#!/usr/bin/env node
/**
 * Send 100 sponsorship outreach emails to new trade show industry companies
 * All unique domains — no overlap with previously contacted companies
 */

const https = require('https');

const API_KEY = 're_CGmCArUb_D1qyCSuaXGhsdRdUtZk5XhcZ';
const FROM = 'ShowFloorTips <hello@showfloortips.com>';
const DELAY_MS = 1000; // 1 second between sends

const CONTACTS = [
  // === EXHIBIT DESIGN / BUILD (20) ===
  { to: 'info@exhibitus.com', company: 'Exhibitus', cat: 'Exhibit Design' },
  { to: 'info@condit.com', company: 'Condit Exhibits', cat: 'Exhibit Design' },
  { to: 'info@craftsmenindustries.com', company: 'Craftsmen Industries', cat: 'Exhibit Design' },
  { to: 'info@mossinc.com', company: 'Moss Inc', cat: 'Exhibit Design' },
  { to: 'info@colorreflections.com', company: 'Color Reflections', cat: 'Exhibit Design' },
  { to: 'info@ewiworldwide.com', company: 'EWI Worldwide', cat: 'Exhibit Design' },
  { to: 'info@xibitsolutions.com', company: 'Xibit Solutions', cat: 'Exhibit Design' },
  { to: 'info@aluvision.com', company: 'Aluvision', cat: 'Exhibit Design' },
  { to: 'info@expodisplays.com', company: 'Expo Displays', cat: 'Exhibit Design' },
  { to: 'info@nomadicdisplay.com', company: 'Nomadic Display', cat: 'Exhibit Design' },
  { to: 'info@excaliburexhibits.com', company: 'Excalibur Exhibits', cat: 'Exhibit Design' },
  { to: 'info@proexhibits.com', company: 'Pro Exhibits', cat: 'Exhibit Design' },
  { to: 'info@nparallel.com', company: 'nParallel', cat: 'Exhibit Design' },
  { to: 'info@structureexhibits.com', company: 'Structure Exhibits', cat: 'Exhibit Design' },
  { to: 'info@hillandpartners.com', company: 'Hill & Partners', cat: 'Exhibit Design' },
  { to: 'info@theexpogroup.com', company: 'The Expo Group', cat: 'Exhibit Design' },
  { to: 'info@featherliteexhibits.com', company: 'Featherlite Exhibits', cat: 'Exhibit Design' },
  { to: 'info@optimagraphics.com', company: 'Optima Graphics', cat: 'Exhibit Design' },
  { to: 'info@kubik.com', company: 'Kubik', cat: 'Exhibit Design' },
  { to: 'info@bfrg.com', company: 'Brede Allied', cat: 'Exhibit Design' },

  // === EVENT TECHNOLOGY (15) ===
  { to: 'info@whova.com', company: 'Whova', cat: 'Event Technology' },
  { to: 'info@hubilo.com', company: 'Hubilo', cat: 'Event Technology' },
  { to: 'info@rainfocus.com', company: 'RainFocus', cat: 'Event Technology' },
  { to: 'info@pathable.com', company: 'Pathable', cat: 'Event Technology' },
  { to: 'info@boomset.com', company: 'Boomset', cat: 'Event Technology' },
  { to: 'hello@socio.events', company: 'Socio Events', cat: 'Event Technology' },
  { to: 'info@validar.com', company: 'Validar', cat: 'Event Technology' },
  { to: 'info@icapture.com', company: 'iCapture', cat: 'Event Technology' },
  { to: 'info@leadliaison.com', company: 'Lead Liaison', cat: 'Event Technology' },
  { to: 'info@certain.com', company: 'Certain', cat: 'Event Technology' },
  { to: 'partnerships@eventbrite.com', company: 'Eventbrite', cat: 'Event Technology' },
  { to: 'info@attendify.com', company: 'Attendify', cat: 'Event Technology' },
  { to: 'hello@grip.events', company: 'Grip', cat: 'Event Technology' },
  { to: 'hello@brella.io', company: 'Brella', cat: 'Event Technology' },
  { to: 'info@spotme.com', company: 'SpotMe', cat: 'Event Technology' },

  // === PROMOTIONAL PRODUCTS (10) ===
  { to: 'info@halo.com', company: 'HALO Branded Solutions', cat: 'Promotional Products' },
  { to: 'info@pinnaclepromotions.com', company: 'Pinnacle Promotions', cat: 'Promotional Products' },
  { to: 'info@epromos.com', company: 'ePromos', cat: 'Promotional Products' },
  { to: 'info@qualitylogoproducts.com', company: 'Quality Logo Products', cat: 'Promotional Products' },
  { to: 'info@anypromo.com', company: 'AnyPromo', cat: 'Promotional Products' },
  { to: 'info@kotisdesign.com', company: 'Kotis Design', cat: 'Promotional Products' },
  { to: 'info@brandspirit.com', company: 'Brand Spirit', cat: 'Promotional Products' },
  { to: 'info@amsterdamprinting.com', company: 'Amsterdam Printing', cat: 'Promotional Products' },
  { to: 'info@nationalpen.com', company: 'National Pen', cat: 'Promotional Products' },
  { to: 'info@crestline.com', company: 'Crestline', cat: 'Promotional Products' },

  // === EVENT FURNITURE / RENTAL (8) ===
  { to: 'events@cortevents.com', company: 'CORT Events', cat: 'Furniture Rental' },
  { to: 'info@afrevents.com', company: 'AFR Event Furnishings', cat: 'Furniture Rental' },
  { to: 'info@formdecor.com', company: 'FormDecor', cat: 'Furniture Rental' },
  { to: 'info@taylorcreativeinc.com', company: 'Taylor Creative', cat: 'Furniture Rental' },
  { to: 'info@blueprintstudios.com', company: 'Blueprint Studios', cat: 'Furniture Rental' },
  { to: 'rentals@signatureeventrentals.com', company: 'Signature Event Rentals', cat: 'Furniture Rental' },
  { to: 'info@eventaccents.com', company: 'EventAccents', cat: 'Furniture Rental' },
  { to: 'info@classicpartyrentals.com', company: 'Classic Party Rentals', cat: 'Furniture Rental' },

  // === AV / PRODUCTION (7) ===
  { to: 'info@worldstage.com', company: 'WorldStage', cat: 'AV Production' },
  { to: 'info@bartha.com', company: 'Bartha', cat: 'AV Production' },
  { to: 'info@bluewatertech.com', company: 'Bluewater Technologies', cat: 'AV Production' },
  { to: 'info@lmg.net', company: 'LMG', cat: 'AV Production' },
  { to: 'info@prg.com', company: 'PRG', cat: 'AV Production' },
  { to: 'info@presentationproducts.com', company: 'Presentation Products', cat: 'AV Production' },
  { to: 'info@ccsprojects.com', company: 'CCS Presentation Systems', cat: 'AV Production' },

  // === SIGNAGE / GRAPHICS (5) ===
  { to: 'info@fastsigns.com', company: 'FASTSIGNS', cat: 'Signage' },
  { to: 'info@speedpro.com', company: 'SpeedPro', cat: 'Signage' },
  { to: 'info@alphagraphics.com', company: 'AlphaGraphics', cat: 'Signage' },
  { to: 'info@artaius.com', company: 'Artaius Group', cat: 'Signage' },
  { to: 'info@imagemakers.com', company: 'Image Makers', cat: 'Signage' },

  // === CONVENTION CENTERS / VENUES (10) ===
  { to: 'info@mccormickplace.com', company: 'McCormick Place', cat: 'Convention Center' },
  { to: 'info@javitscenter.com', company: 'Javits Center', cat: 'Convention Center' },
  { to: 'info@occc.net', company: 'Orange County Convention Center', cat: 'Convention Center' },
  { to: 'sales@gwcc.com', company: 'Georgia World Congress Center', cat: 'Convention Center' },
  { to: 'info@visitsandiego.com', company: 'San Diego Convention Center', cat: 'Convention Center' },
  { to: 'info@nrgpark.com', company: 'NRG Center Houston', cat: 'Convention Center' },
  { to: 'info@visitdallas.com', company: 'Dallas Convention Center', cat: 'Convention Center' },
  { to: 'info@eventsdc.com', company: 'EventsDC', cat: 'Convention Center' },
  { to: 'info@signatureboston.com', company: 'Boston Convention Center', cat: 'Convention Center' },
  { to: 'info@visitanaheim.org', company: 'Anaheim Convention Center', cat: 'Convention Center' },

  // === ASSOCIATIONS (8) ===
  { to: 'info@hcea.org', company: 'HCEA', cat: 'Association' },
  { to: 'membership@pcma.org', company: 'PCMA', cat: 'Association' },
  { to: 'info@ileahub.com', company: 'ILEA', cat: 'Association' },
  { to: 'info@siteglobal.com', company: 'SITE', cat: 'Association' },
  { to: 'info@eventscouncil.org', company: 'Events Industry Council', cat: 'Association' },
  { to: 'info@amcinstitute.org', company: 'AMC Institute', cat: 'Association' },
  { to: 'info@aipc.org', company: 'AIPC', cat: 'Association' },
  { to: 'icca@iccaworld.org', company: 'ICCA', cat: 'Association' },

  // === CORPORATE TRAVEL (5) ===
  { to: 'info@bcdtravel.com', company: 'BCD Travel', cat: 'Corporate Travel' },
  { to: 'info@mycwt.com', company: 'CWT', cat: 'Corporate Travel' },
  { to: 'info@amexglobalbusinesstravel.com', company: 'American Express GBT', cat: 'Corporate Travel' },
  { to: 'info@travelctm.com', company: 'Corporate Travel Management', cat: 'Corporate Travel' },
  { to: 'info@directtravel.com', company: 'Direct Travel', cat: 'Corporate Travel' },

  // === EVENT STAFFING (5) ===
  { to: 'info@atneventstaffing.com', company: 'ATN Event Staffing', cat: 'Event Staffing' },
  { to: 'info@attackmarketing.com', company: 'Attack! Marketing', cat: 'Event Staffing' },
  { to: 'info@hypeagency.com', company: 'Hype Agency', cat: 'Event Staffing' },
  { to: 'info@nationaleventstaffing.com', company: 'National Event Staffing', cat: 'Event Staffing' },
  { to: 'info@tigerpistol.com', company: 'Tigerpistol Events', cat: 'Event Staffing' },

  // === EVENT INSURANCE (3) ===
  { to: 'info@kandkinsurance.com', company: 'K&K Insurance', cat: 'Event Insurance' },
  { to: 'info@eventhelper.com', company: 'EventHelper', cat: 'Event Insurance' },
  { to: 'hello@thimble.com', company: 'Thimble', cat: 'Event Insurance' },

  // === FLOORING / ELECTRICAL (4) ===
  { to: 'info@tradeshowflooring.com', company: 'Trade Show Flooring', cat: 'Show Services' },
  { to: 'info@snaplockflooring.com', company: 'Snap Lock Industries', cat: 'Show Services' },
  { to: 'info@edlen.com', company: 'Edlen Electrical', cat: 'Show Services' },
  { to: 'info@bfrg.com', company: 'Brede Exposition Services', cat: 'Show Services' },
];

function generateEmail(contact) {
  const subject = `Sponsorship Opportunity - ShowFloorTips.com (25,000+ Trade Show Articles)`;

  const html = `<div style="font-family:Arial,sans-serif;max-width:600px;color:#333;line-height:1.6">
<p>Hi ${contact.company} Team,</p>

<p>I'm reaching out from <a href="https://showfloortips.com" style="color:#e94560">ShowFloorTips.com</a> — the largest independent trade show resource online with <strong>25,000+ articles</strong>, <strong>24,800+ show listings</strong>, and growing organic traffic from exhibitors, event planners, and trade show professionals.</p>

<p>We offer premium sponsorship placements designed for companies in the ${contact.cat.toLowerCase()} space:</p>

<ul>
<li><strong>Homepage Placement</strong> — featured logo and link seen by every visitor</li>
<li><strong>Sponsored Articles</strong> — dedicated content showcasing your brand and services</li>
<li><strong>Category Sponsorship</strong> — own an entire industry vertical (e.g., "Technology Trade Shows presented by ${contact.company}")</li>
<li><strong>Newsletter Features</strong> — placement in our weekly digest to 10,000+ subscribers</li>
<li><strong>Show Page Listings</strong> — premium placement on individual trade show pages</li>
</ul>

<p>Our audience is exactly who you want to reach: exhibitors researching shows, event managers planning logistics, and procurement professionals looking for ${contact.cat.toLowerCase()} services.</p>

<p>Packages start at <strong>$1,500/month</strong> for Bronze placement, with Silver ($3,000/mo) and Gold ($5,000/mo) tiers offering increasing visibility and content opportunities.</p>

<p>Would you be interested in seeing our media kit with full traffic data and pricing details? Just reply to this email.</p>

<p>Best regards,<br>
<strong>ShowFloorTips Team</strong><br>
<a href="https://showfloortips.com" style="color:#e94560">showfloortips.com</a></p>
</div>`;

  return { subject, html };
}

function sendEmail(contact) {
  return new Promise((resolve, reject) => {
    const { subject, html } = generateEmail(contact);
    const payload = JSON.stringify({
      from: FROM,
      to: [contact.to],
      subject: subject,
      html: html
    });

    const options = {
      hostname: 'api.resend.com',
      path: '/emails',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ success: true, to: contact.to, company: contact.company, id: result.id });
          } else {
            resolve({ success: false, to: contact.to, company: contact.company, error: result.message || body });
          }
        } catch (e) {
          resolve({ success: false, to: contact.to, company: contact.company, error: body });
        }
      });
    });

    req.on('error', (e) => {
      resolve({ success: false, to: contact.to, company: contact.company, error: e.message });
    });

    req.write(payload);
    req.end();
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  // Verify no duplicate domains
  const domains = CONTACTS.map(c => c.to.split('@')[1].toLowerCase());
  const uniqueDomains = new Set(domains);
  if (uniqueDomains.size !== CONTACTS.length) {
    const dupes = domains.filter((d, i) => domains.indexOf(d) !== i);
    console.error('DUPLICATE DOMAINS FOUND:', [...new Set(dupes)]);
    // Remove duplicates
    const seen = new Set();
    const deduped = CONTACTS.filter(c => {
      const d = c.to.split('@')[1].toLowerCase();
      if (seen.has(d)) return false;
      seen.add(d);
      return true;
    });
    console.log(`Removed ${CONTACTS.length - deduped.length} duplicates. Sending ${deduped.length} emails.`);
    CONTACTS.length = 0;
    CONTACTS.push(...deduped);
  }

  console.log(`Sending ${CONTACTS.length} sponsorship emails...\n`);

  let sent = 0, failed = 0, errors = [];

  for (let i = 0; i < CONTACTS.length; i++) {
    const contact = CONTACTS[i];
    const result = await sendEmail(contact);

    if (result.success) {
      sent++;
      console.log(`[${i + 1}/${CONTACTS.length}] OK  ${contact.company} (${contact.to})`);
    } else {
      failed++;
      errors.push(result);
      console.log(`[${i + 1}/${CONTACTS.length}] ERR ${contact.company} (${contact.to}) — ${result.error}`);
    }

    // Rate limit
    if (i < CONTACTS.length - 1) {
      await sleep(DELAY_MS);
    }
  }

  console.log(`\n=== RESULTS ===`);
  console.log(`Sent: ${sent}`);
  console.log(`Failed: ${failed}`);
  if (errors.length > 0) {
    console.log(`\nFailed emails:`);
    errors.forEach(e => console.log(`  - ${e.company} (${e.to}): ${e.error}`));
  }

  // Print category breakdown
  const cats = {};
  CONTACTS.forEach(c => { cats[c.cat] = (cats[c.cat] || 0) + 1; });
  console.log(`\nCategory breakdown:`);
  Object.entries(cats).sort((a, b) => b[1] - a[1]).forEach(([cat, count]) => {
    console.log(`  ${cat}: ${count}`);
  });
}

main();
