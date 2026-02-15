const https = require('https');

const SK = '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';

const products = [
  { name: "Pre-Show Planning Checklist", price: 799 },
  { name: "Booth Setup Checklist", price: 799 },
  { name: "Post-Show Teardown Checklist", price: 799 },
  { name: "Lead Follow-Up Checklist", price: 799 },
  { name: "Travel & Logistics Checklist", price: 799 },
  { name: "Trade Show Budget & ROI Calculator", price: 1299 },
  { name: "Lead Tracking Spreadsheet", price: 1299 },
  { name: "Vendor Comparison Matrix", price: 1299 },
  { name: "Show Calendar & Planning Spreadsheet", price: 1299 },
  { name: "Booth Cost Estimator", price: 1299 },
  { name: "Post-Show Follow-Up Email Pack", price: 999 },
  { name: "Pre-Show Appointment Request Emails", price: 999 },
  { name: "Thank You & Meeting Recap Emails", price: 999 },
  { name: "VIP Invitation Email Suite", price: 999 },
  { name: "Internal Team Brief Emails", price: 999 },
  { name: "First-Time Exhibitor Guide", price: 1499 },
  { name: "Booth Design Best Practices Guide", price: 1499 },
  { name: "Lead Capture Strategy Guide", price: 1499 },
  { name: "International Show Exhibitor Guide", price: 1499 },
  { name: "ROI Maximization Playbook", price: 1499 },
  { name: "Mega Bundle - All 19 Digital Products", price: 4999 },
  { name: "First-Timer Kit", price: 2499 },
  { name: "Email & Outreach Kit", price: 2999 },
  { name: "ROI & Analytics Kit", price: 3499 }
];

function stripeRequest(method, path, data) {
  return new Promise((resolve, reject) => {
    const postData = new URLSearchParams(data).toString();
    const options = {
      hostname: 'api.stripe.com',
      port: 443,
      path: '/v1' + path,
      method: method,
      headers: {
        'Authorization': 'Basic ' + Buffer.from(SK + ':').toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (parsed.error) reject(new Error(parsed.error.message));
          else resolve(parsed);
        } catch(e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  const results = [];
  const oldLinks = [];

  // Read current stripe_links.json to get old links for replacement
  const fs = require('fs');
  const oldData = JSON.parse(fs.readFileSync('/Volumes/Willie Extr/tradeshow-website/stripe_links.json', 'utf8'));
  oldData.forEach(item => oldLinks.push(item.paymentLink));

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    console.log(`[${i+1}/${products.length}] Creating: ${p.name}...`);

    const product = await stripeRequest('POST', '/products', {
      name: p.name,
      description: `ShowFloorTips digital product: ${p.name}`
    });
    console.log(`  Product: ${product.id}`);
    await sleep(300);

    const price = await stripeRequest('POST', '/prices', {
      product: product.id,
      unit_amount: p.price,
      currency: 'usd'
    });
    console.log(`  Price: ${price.id}`);
    await sleep(300);

    const link = await stripeRequest('POST', '/payment_links', {
      'line_items[0][price]': price.id,
      'line_items[0][quantity]': '1'
    });
    console.log(`  Link: ${link.url}`);
    await sleep(300);

    results.push({
      name: p.name,
      price: p.price,
      paymentLink: link.url,
      productId: product.id,
      priceId: price.id
    });
  }

  // Write updated stripe_links.json
  fs.writeFileSync('/Volumes/Willie Extr/tradeshow-website/stripe_links.json', JSON.stringify(results, null, 2));
  console.log('\nstripe_links.json updated with all ' + results.length + ' LIVE products.');

  // Now replace links in HTML files
  const filesToUpdate = ['products.html', 'bundle.html', 'show.html'];
  let totalReplacements = 0;

  filesToUpdate.forEach(file => {
    let content = fs.readFileSync('/Volumes/Willie Extr/tradeshow-website/' + file, 'utf8');
    let count = 0;
    for (let i = 0; i < oldLinks.length; i++) {
      if (content.includes(oldLinks[i])) {
        const matches = content.split(oldLinks[i]).length - 1;
        content = content.split(oldLinks[i]).join(results[i].paymentLink);
        count += matches;
      }
    }
    if (count > 0) {
      fs.writeFileSync('/Volumes/Willie Extr/tradeshow-website/' + file, content);
      console.log(`${file}: ${count} links replaced`);
      totalReplacements += count;
    } else {
      console.log(`${file}: no links to replace`);
    }
  });

  console.log(`\nTotal: ${totalReplacements} replacements across HTML files`);

  console.log('\n=== LIVE PAYMENT LINKS ===');
  results.forEach(r => {
    console.log(`${r.name} ($${(r.price/100).toFixed(2)}): ${r.paymentLink}`);
  });
}

main().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
