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

    const { name, email, company, tier, message } = req.body || {};

    // Validate required fields
    if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Name is required' });
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: 'Valid email is required' });
    }
    if (!company || !company.trim()) {
        return res.status(400).json({ error: 'Company is required' });
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
        console.error('RESEND_API_KEY not configured');
        return res.status(500).json({ error: 'Server configuration error' });
    }

    const tierDisplay = tier || 'Not specified';
    const messageDisplay = message || 'No additional message.';

    // Email to the site owner with the inquiry details
    const ownerEmailHtml = `
        <h2>New Sponsorship Inquiry</h2>
        <table style="border-collapse:collapse;width:100%;max-width:600px;font-family:Arial,sans-serif;">
            <tr>
                <td style="padding:8px 12px;font-weight:bold;border-bottom:1px solid #eee;width:140px;">Name</td>
                <td style="padding:8px 12px;border-bottom:1px solid #eee;">${escapeHtml(name)}</td>
            </tr>
            <tr>
                <td style="padding:8px 12px;font-weight:bold;border-bottom:1px solid #eee;">Email</td>
                <td style="padding:8px 12px;border-bottom:1px solid #eee;"><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></td>
            </tr>
            <tr>
                <td style="padding:8px 12px;font-weight:bold;border-bottom:1px solid #eee;">Company</td>
                <td style="padding:8px 12px;border-bottom:1px solid #eee;">${escapeHtml(company)}</td>
            </tr>
            <tr>
                <td style="padding:8px 12px;font-weight:bold;border-bottom:1px solid #eee;">Tier Interest</td>
                <td style="padding:8px 12px;border-bottom:1px solid #eee;">${escapeHtml(tierDisplay)}</td>
            </tr>
            <tr>
                <td style="padding:8px 12px;font-weight:bold;vertical-align:top;">Message</td>
                <td style="padding:8px 12px;">${escapeHtml(messageDisplay).replace(/\n/g, '<br>')}</td>
            </tr>
        </table>
        <p style="margin-top:20px;color:#666;font-size:13px;">Reply directly to this email to respond to the inquiry.</p>
    `;

    // Confirmation email to the person who submitted
    const confirmationHtml = `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
            <h2 style="color:#1a1a1a;">Thanks for your interest in sponsoring ShowFloorTips!</h2>
            <p>Hi ${escapeHtml(name.split(' ')[0])},</p>
            <p>We've received your sponsorship inquiry and will get back to you within 1&ndash;2 business days.</p>
            <p><strong>Here's a summary of what you submitted:</strong></p>
            <ul style="line-height:1.8;">
                <li><strong>Company:</strong> ${escapeHtml(company)}</li>
                <li><strong>Tier Interest:</strong> ${escapeHtml(tierDisplay)}</li>
                <li><strong>Message:</strong> ${escapeHtml(messageDisplay)}</li>
            </ul>
            <p>In the meantime, feel free to reply to this email if you have any questions.</p>
            <p style="margin-top:24px;">Best,<br>The ShowFloorTips Team</p>
        </div>
    `;

    try {
        // Send both emails in parallel
        const [ownerResult, confirmResult] = await Promise.all([
            // 1. Inquiry email to site owner
            fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${resendApiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    from: 'ShowFloorTips <info@showfloortips.com>',
                    to: ['willie.seo.assist@gmail.com'],
                    reply_to: email,
                    subject: `Sponsorship Inquiry from ${company}`,
                    html: ownerEmailHtml
                })
            }),
            // 2. Confirmation email to the submitter
            fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${resendApiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    from: 'ShowFloorTips <info@showfloortips.com>',
                    to: [email],
                    subject: 'We received your sponsorship inquiry - ShowFloorTips',
                    html: confirmationHtml
                })
            })
        ]);

        const ownerData = await ownerResult.json();
        const confirmData = await confirmResult.json();

        if (!ownerResult.ok) {
            console.error('Owner email failed:', ownerData);
            return res.status(500).json({ error: 'Failed to send inquiry email' });
        }

        // Log but don't fail if confirmation email fails
        if (!confirmResult.ok) {
            console.error('Confirmation email failed:', confirmData);
        }

        return res.status(200).json({ success: true });

    } catch (err) {
        console.error('Sponsor inquiry error:', err);
        return res.status(500).json({ error: 'Server error' });
    }
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
