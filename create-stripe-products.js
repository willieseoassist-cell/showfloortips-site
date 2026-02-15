const https = require('https');

const SK = 'sk_test_51SyEqUJXnuPSbgX9FR7Vz4KVbzufJRJk06tOj7TVkioRXCDlT15wA09kjPNTnftHCwVu4Vw2PIre7l6xrro1Vwrv00ErbV8QgU';

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

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    console.log(`[${i+1}/${products.length}] Creating: ${p.name}...`);

    // 1. Create product
    const product = await stripeRequest('POST', '/products', {
      name: p.name,
      description: `ShowFloorTips digital product: ${p.name}`
    });
    console.log(`  Product: ${product.id}`);
    await sleep(300);

    // 2. Create price
    const price = await stripeRequest('POST', '/prices', {
      product: product.id,
      unit_amount: p.price,
      currency: 'usd'
    });
    console.log(`  Price: ${price.id}`);
    await sleep(300);

    // 3. Create payment link
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

  // Write results
  const fs = require('fs');
  fs.writeFileSync('/Volumes/Willie Extr/tradeshow-website/stripe_links.json', JSON.stringify(results, null, 2));
  console.log('\nDone! stripe_links.json updated with all ' + results.length + ' products.');

  // Print summary
  console.log('\n=== PAYMENT LINKS ===');
  results.forEach(r => {
    console.log(`${r.name} ($${(r.price/100).toFixed(2)}): ${r.paymentLink}`);
  });
}

main().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
