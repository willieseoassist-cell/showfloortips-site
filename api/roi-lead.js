export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', 'https://showfloortips.com');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { email, source, timestamp } = req.body || {};

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: 'Valid email required' });
    }

    const resendKey = process.env.RESEND_KEY || 're_CGmCArUb_D1qyCSuaXGhsdRdUtZk5XhcZ';

    try {
        // 1. Notify you about the new lead
        await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${resendKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: 'ShowFloorTips <info@showfloortips.com>',
                to: ['willie.seo.assist@gmail.com'],
                subject: `New ROI Calculator Lead: ${email}`,
                html: `<p><strong>New lead from ROI Calculator</strong></p>
                       <p>Email: ${email}</p>
                       <p>Source: ${source || 'roi-calculator'}</p>
                       <p>Time: ${timestamp || new Date().toISOString()}</p>`
            })
        });

        // 2. Subscribe to newsletter via Beehiiv
        const beehiivKey = process.env.BEEHIIV_API_KEY;
        if (beehiivKey) {
            await fetch(
                'https://api.beehiiv.com/v2/publications/pub_3ced7630-50d2-4bb9-8f43-728c48a80034/subscriptions',
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${beehiivKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email: email,
                        reactivate_existing: true,
                        send_welcome_email: true,
                        utm_source: 'roi-calculator'
                    })
                }
            );
        }

        return res.status(200).json({ success: true });
    } catch (err) {
        // Still return success to not block the user
        return res.status(200).json({ success: true });
    }
}
