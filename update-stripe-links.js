const fs = require('fs');
const path = '/Volumes/Willie Extr/tradeshow-website/';

// New links from stripe_links.json
const links = JSON.parse(fs.readFileSync(path + 'stripe_links.json', 'utf8'));

// Build lookup by product name
const linkMap = {};
links.forEach(l => { linkMap[l.name] = l.paymentLink; });

// Old links to replace (from the previous stripe_links.json)
const oldLinks = [
  // Old payment links from previous account
  "https://buy.stripe.com/test_5kQcN66GY7iHetO4s13VC00",
  "https://buy.stripe.com/test_dRm4gAfducD1dpK7Ed3VC01",
  "https://buy.stripe.com/test_aFacN6d5mfPd0CY7Ed3VC02",
  "https://buy.stripe.com/test_eVq9AU1mE6eDetO3nX3VC03",
  "https://buy.stripe.com/test_dRmaEY3uM1YndpKcYx3VC04",
  "https://buy.stripe.com/test_dRm3cwghydH599ubUt3VC05",
  "https://buy.stripe.com/test_28EeVec1i8mL4Te3nX3VC06",
  "https://buy.stripe.com/test_eVqfZi7L2eL999u1fP3VC07",
  "https://buy.stripe.com/test_5kQ28s6GYgTh4Tef6F3VC08",
  "https://buy.stripe.com/test_cNi00k5CU7iHdpK6A93VC09",
  "https://buy.stripe.com/test_4gM14o2qIgTh3Pa9Ml3VC0a",
  "https://buy.stripe.com/test_dRm9AUc1i1YnetOe2B3VC0b",
  "https://buy.stripe.com/test_28E14o5CU6eD4Te9Ml3VC0c",
  "https://buy.stripe.com/test_cNi9AU0iA0Uj85q8Ih3VC0d",
  "https://buy.stripe.com/test_5kQ14o0iAeL9bhC8Ih3VC0e",
  "https://buy.stripe.com/test_aFa14o8P68mL85qe2B3VC0f",
  "https://buy.stripe.com/test_bJe6oIc1i6eD5Xi5w53VC0g",
  "https://buy.stripe.com/test_fZu7sMghyeL999u7Ed3VC0h",
  "https://buy.stripe.com/test_3cIcN67L26eDbhC6A93VC0i",
  "https://buy.stripe.com/test_28E9AU1mEauT85q4s13VC0j",
  "https://buy.stripe.com/test_fZu14ofducD12L60bL3VC0k",
  "https://buy.stripe.com/test_7sY9AUd5mcD1etO5w53VC0l",
  "https://buy.stripe.com/test_6oU00kaXe9qP0CY8Ih3VC0m",
  "https://buy.stripe.com/test_eVq28sfdu0Uj3Pa5w53VC0n"
];

// New links in same order
const newLinks = links.map(l => l.paymentLink);

const filesToUpdate = ['products.html', 'bundle.html', 'show.html'];

let totalReplacements = 0;

filesToUpdate.forEach(file => {
  let content = fs.readFileSync(path + file, 'utf8');
  let count = 0;

  for (let i = 0; i < oldLinks.length; i++) {
    const oldLink = oldLinks[i];
    const newLink = newLinks[i];
    if (content.includes(oldLink)) {
      const matches = content.split(oldLink).length - 1;
      content = content.split(oldLink).join(newLink);
      count += matches;
    }
  }

  if (count > 0) {
    fs.writeFileSync(path + file, content);
    console.log(`${file}: ${count} links replaced`);
    totalReplacements += count;
  } else {
    console.log(`${file}: no old links found`);
  }
});

console.log(`\nTotal: ${totalReplacements} replacements across ${filesToUpdate.length} files`);
