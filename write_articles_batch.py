#!/usr/bin/env python3
"""Batch-write articles for ShowFloorTips."""
import os
import json

BASE = '/Volumes/Willie Extr/tradeshow-website'
NEWS_DIR = os.path.join(BASE, 'news')
TODAY = '2026-02-11'

ARTICLES = [
    # Cost-of-Exhibiting Guides
    {
        "title": "How Much Does It Really Cost to Exhibit at CES? A Complete Budget Breakdown",
        "slug": "cost-of-exhibiting-ces-2026-budget-breakdown",
        "category": "Cost Guide",
        "summary": "CES booth space starts at $42/sq ft for inline booths. But the real cost includes drayage, electrical, hotels at 3x normal rates, and mandatory union labor. Here's every line item you need to budget for.",
        "image": "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80",
        "content": """
<p>CES is the world's most important consumer electronics trade show, attracting 130,000+ attendees to Las Vegas every January. But exhibiting there comes with a price tag that catches first-timers off guard.</p>

<h2>Booth Space Costs</h2>
<p>CES booth rental rates vary by hall and booth type:</p>
<ul>
<li><strong>Inline booth (10x10):</strong> $4,200-$5,500 ($42-$55/sq ft)</li>
<li><strong>Corner booth (10x10):</strong> $5,000-$6,600 (10-20% premium)</li>
<li><strong>Island booth (20x20):</strong> $16,800-$22,000</li>
<li><strong>Eureka Park (startups):</strong> ~$1,500-$4,000 for tabletop</li>
</ul>
<p>Early bird discounts (typically 15-20%) require commitment 6+ months before the show.</p>

<h2>Booth Design & Build</h2>
<p>Your booth structure is often the biggest variable cost:</p>
<ul>
<li><strong>Pop-up display (DIY):</strong> $500-$2,000</li>
<li><strong>Custom 10x10:</strong> $10,000-$30,000</li>
<li><strong>Custom 20x20:</strong> $40,000-$100,000+</li>
<li><strong>Rental display:</strong> $3,000-$15,000 (saves 40-60% vs. purchase)</li>
</ul>

<h2>Show Services (The Hidden Costs)</h2>
<p>These are the line items that blow budgets:</p>
<ul>
<li><strong>Drayage:</strong> $150-$200 per CWT (100 lbs). A typical 10x10 booth ships 800-1,200 lbs = $1,200-$2,400</li>
<li><strong>Electrical:</strong> $350-$800 for standard 500W outlet</li>
<li><strong>Internet:</strong> $800-$2,500 for dedicated Wi-Fi</li>
<li><strong>Carpet:</strong> $300-$500 for standard 10x10</li>
<li><strong>Furniture rental:</strong> $200-$800 (table, chairs, counter)</li>
<li><strong>Lead retrieval:</strong> $300-$500 per scanner</li>
</ul>

<h2>Travel & Accommodation</h2>
<p>Las Vegas hotel rates during CES are 2-3x normal:</p>
<ul>
<li><strong>Hotel (4 nights):</strong> $1,200-$3,000 per person</li>
<li><strong>Flights:</strong> $300-$800 per person</li>
<li><strong>Meals:</strong> $75-$150/day per person</li>
<li><strong>Ground transport:</strong> $200-$400 total</li>
</ul>
<p>For a team of 4, travel alone can exceed $12,000.</p>

<h2>Marketing & Collateral</h2>
<ul>
<li><strong>Pre-show email campaign:</strong> $500-$2,000</li>
<li><strong>Printed materials:</strong> $300-$1,000</li>
<li><strong>Promotional giveaways:</strong> $500-$3,000</li>
<li><strong>Press outreach:</strong> $1,000-$5,000</li>
</ul>

<h2>Total Budget Summary</h2>
<table style="width:100%;border-collapse:collapse;margin:1.5rem 0">
<tr style="background:#f1f5f9"><th style="padding:0.75rem;text-align:left;border:1px solid #e2e8f0">Category</th><th style="padding:0.75rem;text-align:right;border:1px solid #e2e8f0">10x10 Booth</th><th style="padding:0.75rem;text-align:right;border:1px solid #e2e8f0">20x20 Booth</th></tr>
<tr><td style="padding:0.75rem;border:1px solid #e2e8f0">Booth Space</td><td style="padding:0.75rem;text-align:right;border:1px solid #e2e8f0">$4,200-$5,500</td><td style="padding:0.75rem;text-align:right;border:1px solid #e2e8f0">$16,800-$22,000</td></tr>
<tr><td style="padding:0.75rem;border:1px solid #e2e8f0">Booth Design/Build</td><td style="padding:0.75rem;text-align:right;border:1px solid #e2e8f0">$3,000-$15,000</td><td style="padding:0.75rem;text-align:right;border:1px solid #e2e8f0">$40,000-$100,000</td></tr>
<tr><td style="padding:0.75rem;border:1px solid #e2e8f0">Show Services</td><td style="padding:0.75rem;text-align:right;border:1px solid #e2e8f0">$2,500-$5,000</td><td style="padding:0.75rem;text-align:right;border:1px solid #e2e8f0">$6,000-$15,000</td></tr>
<tr><td style="padding:0.75rem;border:1px solid #e2e8f0">Travel (4 people)</td><td style="padding:0.75rem;text-align:right;border:1px solid #e2e8f0">$8,000-$16,000</td><td style="padding:0.75rem;text-align:right;border:1px solid #e2e8f0">$12,000-$24,000</td></tr>
<tr><td style="padding:0.75rem;border:1px solid #e2e8f0">Marketing</td><td style="padding:0.75rem;text-align:right;border:1px solid #e2e8f0">$2,000-$6,000</td><td style="padding:0.75rem;text-align:right;border:1px solid #e2e8f0">$5,000-$15,000</td></tr>
<tr style="background:#0a0a0a;color:#fff"><td style="padding:0.75rem;border:1px solid #e2e8f0"><strong>TOTAL</strong></td><td style="padding:0.75rem;text-align:right;border:1px solid #e2e8f0"><strong>$19,700-$47,500</strong></td><td style="padding:0.75rem;text-align:right;border:1px solid #e2e8f0"><strong>$79,800-$176,000</strong></td></tr>
</table>
<p>The median first-time CES exhibitor with a 10x10 booth spends around $30,000 all-in. Use the <a href="/roi-calculator.html">ShowFloorTips ROI Calculator</a> to determine if the investment makes sense for your company.</p>
"""
    },
    {
        "title": "NRF Exhibitor Cost Guide — What You'll Actually Spend at the Big Show",
        "slug": "cost-of-exhibiting-nrf-2026-retail-trade-show",
        "category": "Cost Guide",
        "summary": "NRF's Big Show attracts 40,000 retail professionals to New York City every January. Booth space, Javits Center drayage, NYC hotels, and union labor add up fast. Here's the real cost breakdown.",
        "image": "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80",
        "content": """
<p>The NRF Big Show is the retail industry's flagship event, held at the Javits Center in New York City. With 40,000+ attendees including executives from every major retailer, the ROI potential is massive — but so are the costs.</p>

<h2>Booth Space at NRF</h2>
<ul>
<li><strong>Inline booth (10x10):</strong> $4,500-$6,000 ($45-$60/sq ft)</li>
<li><strong>Corner/Peninsula:</strong> $5,500-$7,500</li>
<li><strong>Island booth (20x20):</strong> $18,000-$24,000</li>
<li><strong>Innovation Lab (startup):</strong> $2,500-$5,000</li>
</ul>

<h2>Javits Center Show Services</h2>
<p>The Javits Center in Manhattan has some of the highest service costs in the country:</p>
<ul>
<li><strong>Drayage:</strong> $180-$250 per CWT — among the most expensive venues</li>
<li><strong>Electrical:</strong> $400-$900 (Javits rates are premium)</li>
<li><strong>Internet:</strong> $1,000-$3,000</li>
<li><strong>Union labor:</strong> Required for most setup tasks, $80-$120/hour</li>
<li><strong>Furniture:</strong> $300-$1,000</li>
</ul>

<h2>NYC Travel Costs</h2>
<p>New York City during NRF week (mid-January) means premium everything:</p>
<ul>
<li><strong>Hotel (3-4 nights):</strong> $1,500-$4,000 per person (Midtown Manhattan)</li>
<li><strong>Flights:</strong> $200-$600 per person</li>
<li><strong>Meals:</strong> $100-$200/day per person (NYC dining prices)</li>
<li><strong>Ground transport:</strong> $150-$300 (subway + occasional Uber)</li>
</ul>

<h2>Total NRF Budget</h2>
<table style="width:100%;border-collapse:collapse;margin:1.5rem 0">
<tr style="background:#f1f5f9"><th style="padding:0.75rem;text-align:left;border:1px solid #e2e8f0">Line Item</th><th style="padding:0.75rem;text-align:right;border:1px solid #e2e8f0">10x10 Budget</th></tr>
<tr><td style="padding:0.75rem;border:1px solid #e2e8f0">Booth Space</td><td style="padding:0.75rem;text-align:right;border:1px solid #e2e8f0">$4,500-$6,000</td></tr>
<tr><td style="padding:0.75rem;border:1px solid #e2e8f0">Booth Design</td><td style="padding:0.75rem;text-align:right;border:1px solid #e2e8f0">$5,000-$20,000</td></tr>
<tr><td style="padding:0.75rem;border:1px solid #e2e8f0">Show Services</td><td style="padding:0.75rem;text-align:right;border:1px solid #e2e8f0">$3,000-$7,000</td></tr>
<tr><td style="padding:0.75rem;border:1px solid #e2e8f0">Travel (3 people)</td><td style="padding:0.75rem;text-align:right;border:1px solid #e2e8f0">$7,500-$15,000</td></tr>
<tr><td style="padding:0.75rem;border:1px solid #e2e8f0">Marketing</td><td style="padding:0.75rem;text-align:right;border:1px solid #e2e8f0">$2,000-$5,000</td></tr>
<tr style="background:#0a0a0a;color:#fff"><td style="padding:0.75rem;border:1px solid #e2e8f0"><strong>TOTAL</strong></td><td style="padding:0.75rem;text-align:right;border:1px solid #e2e8f0"><strong>$22,000-$53,000</strong></td></tr>
</table>
<p>NRF is expensive because New York is expensive. But the quality of retail decision-makers in attendance makes it one of the highest-ROI shows in the industry. Calculate your expected return with our <a href="/roi-calculator.html">ROI Calculator</a>.</p>
"""
    },
    # First-Timer Guides
    {
        "title": "First-Time Exhibitor Survival Guide — 15 Mistakes That Will Cost You Thousands",
        "slug": "first-time-exhibitor-guide-15-costly-mistakes-2026",
        "category": "Networking Guide",
        "summary": "First-time exhibitors waste an average of $8,000 per show on avoidable mistakes. From ordering services late (30% surcharge) to skipping pre-show marketing, here are the 15 errors that kill ROI.",
        "image": "https://images.unsplash.com/photo-1556761175-b413da4baf72?w=800&q=80",
        "content": """
<p>Your first trade show can be a career-defining success or an expensive lesson. The difference usually comes down to preparation. Here are the 15 most common first-time exhibitor mistakes — and exactly how to avoid each one.</p>

<h2>1. Not Setting Measurable Goals</h2>
<p>Vague goals like "get our name out there" make it impossible to measure ROI. Set specific targets: 50 qualified leads, 10 demo appointments, 3 partnership meetings. Without numbers, you can't calculate whether the show was worth the investment.</p>

<h2>2. Ordering Show Services After the Deadline</h2>
<p>Every show service — electrical, drayage, internet, furniture — has an "advance" rate and an "at-show" rate. The at-show rate is typically 30-40% higher. Missing the advance deadline on a 20x20 booth can cost an extra $2,000-$5,000.</p>

<h2>3. Shipping Freight Too Late</h2>
<p>The advance warehouse has a receiving window. Miss it and your materials go to the show site at premium "direct-to-show" drayage rates. Worse, if your freight arrives after setup begins, you might be building your booth while the show is already open.</p>

<h2>4. Skipping Pre-Show Marketing</h2>
<p>80% of trade show attendees plan their booth visits before arriving. If you're not in their plan, you're relying entirely on walk-by traffic. Send emails, post on social media, and schedule appointments at least 3 weeks before the show.</p>

<h2>5. Overstaffing or Understaffing the Booth</h2>
<p>Too many people in a 10x10 booth creates a wall that repels visitors. Too few means missed connections. Rule of thumb: one staffer per 50 square feet of booth space, with shift rotations to keep energy high.</p>

<h2>6. Not Training Booth Staff</h2>
<p>Your booth team needs to know: the elevator pitch (under 30 seconds), qualification questions, demo flow, and lead capture process. A 1-hour training session the day before the show pays for itself many times over.</p>

<h2>7. Relying on the Show's Lead Retrieval System</h2>
<p>Show-provided badge scanners capture basic contact info but rarely integrate with your CRM. Apps like <a href="/scannly.html">Scannly</a> let you add notes, qualify leads, and sync directly to your pipeline.</p>

<h2>8. Sitting in Your Booth</h2>
<p>Sitting signals "I don't want to be bothered." Stand near the aisle edge, make eye contact, and engage passersby. Studies show standing booth staff generate 3x more conversations than seated staff.</p>

<h2>9. No Follow-Up Plan</h2>
<p>50% of trade show leads are never followed up. Have email templates ready, assign leads to sales reps before you leave the show, and commit to contacting every lead within 48 hours.</p>

<h2>10. Choosing the Wrong Booth Location</h2>
<p>Avoid dead-end aisles, back corners, and spots next to food courts (people rush past). Request locations near entrances, restrooms, or session rooms where foot traffic is highest. Study the floor plan before signing.</p>

<h2>11. Bringing Too Much Inventory</h2>
<p>Every pound you ship costs money in freight and drayage. Bring enough product for demos and display, not your entire warehouse. Ship excess inventory back from the show site to avoid expensive return drayage.</p>

<h2>12. Ignoring Your Neighbors</h2>
<p>The exhibitors next to you are potential partners, referral sources, or future customers. Introduce yourself during setup, share leads that aren't relevant to you, and build relationships that outlast the show.</p>

<h2>13. Not Getting Certificate of Insurance Early</h2>
<p>Most venues require a COI listing the show organizer and convention center as additional insured. This can take 1-2 weeks to process. Last-minute requests mean premium rush fees from your insurance broker.</p>

<h2>14. Forgetting About Drayage</h2>
<p>Drayage (material handling) is the #1 surprise cost for first-time exhibitors. At $150-$250 per 100 pounds, a 1,000-pound booth shipment costs $1,500-$2,500 just to move from the dock to your space — and the same again to move it back.</p>

<h2>15. Not Calculating ROI After the Show</h2>
<p>Without measuring results, you can't improve. Track: total cost, leads captured, leads converted, revenue generated. Use the <a href="/roi-calculator.html">ShowFloorTips ROI Calculator</a> to see your actual return and decide whether to rebook.</p>
"""
    },
    # Top 10 / Seasonal
    {
        "title": "Top 10 Trade Shows Every Small Business Should Attend in 2026",
        "slug": "top-10-trade-shows-small-business-2026",
        "category": "Industry Insight",
        "summary": "Small businesses with limited budgets need shows that deliver maximum ROI. These 10 events offer affordable booth space, high buyer density, and proven track records for companies under $10M revenue.",
        "image": "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&q=80",
        "content": """
<p>Small businesses can't afford to waste $30,000 on the wrong trade show. These 10 events were selected for affordable booth costs, high buyer-to-exhibitor ratios, and strong track records of generating real business for smaller companies.</p>

<h2>1. Natural Products Expo West (Anaheim, March)</h2>
<p><strong>Best for:</strong> Food, beverage, and wellness startups</p>
<p><strong>Why:</strong> Expo West's Hot Products section lets new brands exhibit for $2,500-$4,000. Major retailers like Whole Foods, Sprouts, and Target actively scout the show for new products. Over 65,000 attendees with serious buying intent.</p>

<h2>2. SXSW Trade Show (Austin, March)</h2>
<p><strong>Best for:</strong> Tech startups, creative agencies, media companies</p>
<p><strong>Why:</strong> SXSW's Trade Show is smaller and more intimate than CES but draws equally influential attendees. Tabletop exhibits start around $3,000. The festival atmosphere creates natural networking opportunities.</p>

<h2>3. National Hardware Show (Las Vegas, March)</h2>
<p><strong>Best for:</strong> Hardware, tools, home improvement products</p>
<p><strong>Why:</strong> Inventor's Corner offers exhibit space from $1,500. Retailers from Ace, True Value, and independent hardware stores actively buy at this show.</p>

<h2>4. ASD Market Week (Las Vegas, March/August)</h2>
<p><strong>Best for:</strong> Consumer products, general merchandise, gifts</p>
<p><strong>Why:</strong> ASD attracts 45,000+ buyers from retail, wholesale, and e-commerce. Booth prices are among the most competitive for a show this size. Twice-yearly timing lets you test in spring and scale in fall.</p>

<h2>5. ICFF (New York, May)</h2>
<p><strong>Best for:</strong> Furniture designers, lighting, home accessories</p>
<p><strong>Why:</strong> ICFF is the premier design show in North America. Emerging brands section offers smaller spaces at accessible prices. Interior designers and architects attend with project budgets.</p>

<h2>6. Outdoor Retailer (Salt Lake City, June)</h2>
<p><strong>Best for:</strong> Outdoor gear, apparel, accessories</p>
<p><strong>Why:</strong> Every major outdoor retailer from REI to Bass Pro sends buyers. The On Show section gives emerging brands a platform starting around $2,000.</p>

<h2>7. PACK EXPO (Chicago, October)</h2>
<p><strong>Best for:</strong> Packaging equipment, materials, services</p>
<p><strong>Why:</strong> PACK EXPO connects packaging solution providers with 45,000+ buyers. Small exhibitor packages include turnkey booths, reducing setup complexity for first-timers.</p>

<h2>8. Fancy Food Show (New York, June)</h2>
<p><strong>Best for:</strong> Specialty food producers, gourmet products</p>
<p><strong>Why:</strong> The Specialty Food Association runs one of the best shows for artisan food brands. Retailer buyer programs ensure booth visitors have purchasing authority.</p>

<h2>9. Global Pet Expo (Orlando, March)</h2>
<p><strong>Best for:</strong> Pet products, accessories, pet tech</p>
<p><strong>Why:</strong> New Product Showcase puts emerging brands in front of 1,100+ buyers from PetSmart, Petco, Chewy, and independent pet stores. The pet industry grows 6-8% annually.</p>

<h2>10. HIMSS (Orlando, March)</h2>
<p><strong>Best for:</strong> Health IT, digital health startups</p>
<p><strong>Why:</strong> HIMSS Digital Health Innovation section gives startups access to 45,000 health IT professionals. Hospital CIOs, clinic administrators, and health system buyers all attend.</p>

<h2>Budget Planning Tips for Small Businesses</h2>
<ul>
<li><strong>Start with tabletop:</strong> Many shows offer tabletop exhibits for $1,500-$3,000 — perfect for testing a show before committing to a full booth</li>
<li><strong>Share a booth:</strong> Split a 10x10 with a complementary (non-competing) company to cut costs in half</li>
<li><strong>Book early:</strong> Early bird discounts save 15-25% on booth space</li>
<li><strong>Use the <a href="/roi-calculator.html">ROI Calculator</a></strong> to set realistic lead targets before committing</li>
</ul>
"""
    },
    {
        "title": "Spring 2026 Trade Show Season Preview — 50 Must-Know Events from March to May",
        "slug": "spring-2026-trade-show-season-preview-march-may",
        "category": "Industry Insight",
        "summary": "Spring 2026 is packed with major trade shows across every industry. From CONEXPO and Expo West in March to ICFF and Computex in May, here's your planning guide for the busiest season of the year.",
        "image": "https://images.unsplash.com/photo-1531058020387-3be344556be6?w=800&q=80",
        "content": """
<p>Spring is the busiest trade show season, with more major events concentrated in March-May than any other quarter. Here's what exhibitors need to know about the biggest shows coming up.</p>

<h2>March 2026 Highlights</h2>

<h3>CONEXPO-CON/AGG (Las Vegas, March 3-7)</h3>
<p>The construction industry's largest show draws 130,000+ attendees and fills 2.8 million square feet of exhibit space. This triennial event is a must for heavy equipment manufacturers, concrete producers, and construction technology companies.</p>

<h3>Natural Products Expo West (Anaheim, March 4-7)</h3>
<p>The natural and organic food industry's flagship event attracts 65,000+ professionals. New product launches here can catapult brands into major retail distribution overnight.</p>

<h3>HIMSS Global Health Conference (Orlando, March 10-14)</h3>
<p>45,000+ health IT professionals gather to evaluate digital health solutions. Hospital systems, health plans, and government agencies send buyers with seven-figure budgets.</p>

<h3>ProFood Tech (Chicago, March 17-19)</h3>
<p>Food and beverage processing technology show connecting equipment manufacturers with food producers. Strong B2B buying activity and technical education.</p>

<h2>April 2026 Highlights</h2>

<h3>NAB Show (Las Vegas, April 5-8)</h3>
<p>The media and entertainment technology show draws 90,000+ attendees. Broadcast, streaming, film production, and content creation companies fill the Las Vegas Convention Center.</p>

<h3>Hannover Messe (Hannover, April 20-24)</h3>
<p>The world's largest industrial technology show. 200,000+ attendees from 70+ countries. If you sell to manufacturers, this is the global stage.</p>

<h3>AAPEX (Las Vegas, April)</h3>
<p>The automotive aftermarket show pairs with SEMA for the industry's biggest week. Parts manufacturers, distributors, and service providers converge on Las Vegas.</p>

<h2>May 2026 Highlights</h2>

<h3>ICFF (New York, May 17-20)</h3>
<p>North America's premier contemporary furniture and design show. Interior designers, architects, and high-end retailers source the next season's collections.</p>

<h3>Computex (Taipei, May 26-29)</h3>
<p>Asia's largest ICT trade show and the global stage for computing hardware, components, and peripherals. Critical for any company in the PC supply chain.</p>

<h3>NeoCon (Chicago, June 9-11)</h3>
<p>Commercial interior design's most important event. Furniture manufacturers, flooring companies, and architectural product makers exhibit at the Merchandise Mart.</p>

<h2>Planning Tips for Spring Season</h2>
<ul>
<li><strong>Book hotels NOW:</strong> Spring show hotel blocks sell out months in advance, especially in Las Vegas and New York</li>
<li><strong>Order services early:</strong> Advance deadlines for spring shows are typically 4-6 weeks before — don't get hit with at-show surcharges</li>
<li><strong>If exhibiting at multiple shows:</strong> Route freight strategically to reduce shipping costs between events</li>
<li><strong>Use our <a href="/calendar.html">Trade Show Calendar</a></strong> to see every spring event and plan your schedule</li>
</ul>
"""
    },
]

def make_article_html(article):
    return f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{article["title"]} | ShowFloorTips</title>
<meta name="description" content="{article["summary"]}">
<meta name="news_keywords" content="{article["category"]}, Trade Shows, Exhibitors, 2026">
<meta property="og:title" content="{article["title"]}">
<meta property="og:description" content="{article["summary"]}">
<meta property="og:image" content="{article["image"]}">
<meta property="og:url" content="https://showfloortips.com/news/{article["slug"]}.html">
<meta property="og:type" content="article">
<meta name="twitter:card" content="summary_large_image">
<link rel="canonical" href="https://showfloortips.com/news/{article["slug"]}.html">
<link rel="preconnect" href="https://images.unsplash.com">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<script type="application/ld+json">
{{
  "@context": "https://schema.org",
  "@type": "NewsArticle",
  "headline": "{article["title"]}",
  "image": "{article["image"]}",
  "datePublished": "{TODAY}",
  "dateModified": "{TODAY}",
  "author": {{"@type": "Organization", "name": "ShowFloorTips"}},
  "publisher": {{"@type": "Organization", "name": "ShowFloorTips", "logo": {{"@type": "ImageObject", "url": "https://showfloortips.com/images/logo.png"}}}},
  "description": "{article["summary"]}"
}}
</script>
<script type="application/ld+json">
{{
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
        {{"@type": "ListItem", "position": 1, "name": "Home", "item": "https://showfloortips.com"}},
        {{"@type": "ListItem", "position": 2, "name": "News", "item": "https://showfloortips.com/news.html"}},
        {{"@type": "ListItem", "position": 3, "name": "{article["title"][:60]}", "item": "https://showfloortips.com/news/{article["slug"]}.html"}}
    ]
}}
</script>
<style>
body {{ font-family: 'Inter', -apple-system, sans-serif; margin: 0; background: #fff; color: #1a1a2e }}
.article-nav {{ background: #0a0a0a; padding: 1rem 2rem; display: flex; align-items: center; gap: 1.5rem; flex-wrap: wrap }}
.article-nav a {{ color: #a0a0a0; text-decoration: none; font-size: 0.85rem; font-weight: 500; transition: color 0.2s }}
.article-nav a:hover {{ color: #fff }}
.article-nav .logo {{ color: #fff; font-weight: 800; font-size: 1.1rem }}
.article-hero {{ position: relative; height: 400px; background-size: cover; background-position: center; display: flex; align-items: flex-end }}
.article-hero-overlay {{ position: absolute; inset: 0; background: linear-gradient(transparent 40%, rgba(0,0,0,0.85)) }}
.article-hero-content {{ position: relative; z-index: 2; padding: 2rem; max-width: 800px }}
.article-hero-content .category {{ display: inline-block; background: #fff; color: #0a0a0a; padding: 0.3rem 0.75rem; border-radius: 4px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.75rem }}
.article-hero-content h1 {{ color: #fff; font-size: 2rem; font-weight: 800; line-height: 1.2; margin: 0 }}
.article-body {{ max-width: 760px; margin: 0 auto; padding: 2rem; font-size: 1.05rem; line-height: 1.85; color: #334155 }}
.article-body h2 {{ font-size: 1.4rem; font-weight: 700; color: #0a0a0a; margin: 2rem 0 0.75rem; letter-spacing: -0.01em }}
.article-body h3 {{ font-size: 1.15rem; font-weight: 600; color: #1e293b; margin: 1.5rem 0 0.5rem }}
.article-body p {{ margin: 0 0 1.25rem }}
.article-body ul, .article-body ol {{ margin: 0 0 1.25rem; padding-left: 1.5rem }}
.article-body li {{ margin-bottom: 0.5rem }}
.article-body a {{ color: #2563eb; text-decoration: none; font-weight: 500 }}
.article-body a:hover {{ text-decoration: underline }}
.article-body table {{ border-collapse: collapse; width: 100%; margin: 1.5rem 0 }}
.article-meta {{ display: flex; gap: 1rem; align-items: center; margin-bottom: 2rem; padding-bottom: 1rem; border-bottom: 1px solid #e2e8f0 }}
.article-meta time {{ font-size: 0.85rem; color: #64748b }}
.article-meta .source {{ font-size: 0.85rem; color: #64748b; font-weight: 500 }}
.social-share {{ display: flex; gap: 0.5rem; margin: 2rem 0; padding: 1rem 0; border-top: 1px solid #e2e8f0 }}
.social-share a {{ display: inline-flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 8px; background: #f1f5f9; color: #475569; text-decoration: none; font-size: 0.85rem; transition: background 0.2s }}
.social-share a:hover {{ background: #e2e8f0 }}
.scannly-cta {{ background: #eef2ff; border: 1px solid #c7d2fe; border-radius: 12px; padding: 1.5rem; text-align: center; margin: 2rem 0 }}
.scannly-cta h3 {{ font-size: 1.1rem; font-weight: 700; color: #1e293b; margin-bottom: 0.5rem }}
.scannly-cta p {{ color: #475569; font-size: 0.9rem; margin-bottom: 1rem }}
.scannly-cta a {{ display: inline-block; padding: 0.6rem 1.5rem; background: #6366f1; color: #fff; border-radius: 8px; font-weight: 600; text-decoration: none }}
.article-footer {{ background: #f8fafc; padding: 2rem; text-align: center; font-size: 0.85rem; color: #64748b; border-top: 1px solid #e2e8f0 }}
.article-footer a {{ color: #475569 }}
@media(max-width:768px) {{ .article-hero {{ height: 280px }} .article-hero-content h1 {{ font-size: 1.4rem }} .article-body {{ padding: 1.5rem }} }}
</style>
</head>
<body>
<nav class="article-nav">
    <a href="/" class="logo">ShowFloorTips</a>
    <a href="/#shows">Trade Shows</a>
    <a href="/news.html">News</a>
    <a href="/travel.html">Travel</a>
    <a href="/guide.html">Guide</a> | <a href="/products.html">Products</a>
    <a href="/scannly.html" style="color:#818cf8">Try Scannly</a>
</nav>

<div class="article-hero" style="background-image:url('{article["image"]}')">
    <div class="article-hero-overlay"></div>
    <div class="article-hero-content">
        <span class="category">{article["category"]}</span>
        <h1>{article["title"]}</h1>
    </div>
</div>

<article class="article-body">
    <div class="article-meta">
        <span class="source">ShowFloorTips</span>
        <time datetime="{TODAY}">Feb 11, 2026</time>
    </div>

    {article["content"]}

    <div class="social-share">
        <a href="https://twitter.com/intent/tweet?text={article["title"].replace(" ", "+")}&url=https://showfloortips.com/news/{article["slug"]}.html" target="_blank" rel="noopener" title="Share on X">X</a>
        <a href="https://www.linkedin.com/sharing/share-offsite/?url=https://showfloortips.com/news/{article["slug"]}.html" target="_blank" rel="noopener" title="Share on LinkedIn">in</a>
        <a href="https://www.facebook.com/sharer/sharer.php?u=https://showfloortips.com/news/{article["slug"]}.html" target="_blank" rel="noopener" title="Share on Facebook">f</a>
        <a href="mailto:?subject={article["title"]}&body=https://showfloortips.com/news/{article["slug"]}.html" title="Share via Email">@</a>
    </div>

    <div class="scannly-cta">
        <h3>Capture Every Lead at Your Next Show</h3>
        <p>Scannly turns badge scans into qualified leads with AI-powered follow-up.</p>
        <a href="/scannly.html">Try Scannly Free</a>
    </div>
</article>

<footer class="article-footer">
    <p>&copy; 2026 ShowFloorTips. <a href="/">Home</a> | <a href="/news.html">All News</a> | <a href="/guide.html">Guide</a> | <a href="/products.html">Products</a></p>
</footer>
</body>
</html>'''

# Write all articles
for article in ARTICLES:
    filepath = os.path.join(NEWS_DIR, f'{article["slug"]}.html')
    html = make_article_html(article)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(html)
    print(f'Created: {article["slug"]}.html')

# Update news.js
print('\nUpdating news.js...')
with open(os.path.join(BASE, 'news.js'), 'r', encoding='utf-8') as f:
    content = f.read()

new_entries = []
for article in ARTICLES:
    entry = {
        "title": article["title"],
        "slug": article["slug"],
        "category": article["category"],
        "summary": article["summary"],
        "source": "ShowFloorTips",
        "published_date": TODAY,
        "image_url": article["image"],
        "url": f'news/{article["slug"]}.html'
    }
    new_entries.append(json.dumps(entry, indent=2))

insert_text = ',\n  '.join(new_entries)
content = content.replace('var NEWS_DATA = [\n  {', f'var NEWS_DATA = [\n  {insert_text},\n  {{')

with open(os.path.join(BASE, 'news.js'), 'w', encoding='utf-8') as f:
    f.write(content)

print(f'\nDone! Created {len(ARTICLES)} articles and updated news.js.')
