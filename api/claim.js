export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const {
        show_name,
        organizer_name,
        email,
        phone,
        company,
        website,
        tier,
        message
    } = req.body || {};

    // Validate required fields
    const missing = [];
    if (!show_name || !show_name.trim()) missing.push('show_name');
    if (!organizer_name || !organizer_name.trim()) missing.push('organizer_name');
    if (!email || !email.trim()) missing.push('email');
    if (!company || !company.trim()) missing.push('company');
    if (!tier || !tier.trim()) missing.push('tier');

    if (missing.length > 0) {
        return res.status(400).json({
            error: `Missing required fields: ${missing.join(', ')}`
        });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
        return res.status(400).json({ error: 'Invalid email address' });
    }

    // Validate tier
    const validTiers = ['starter', 'pro', 'premium'];
    if (!validTiers.includes(tier.trim().toLowerCase())) {
        return res.status(400).json({ error: 'Invalid tier. Must be starter, pro, or premium.' });
    }

    const RESEND_API_KEY = 're_CGmCArUb_D1qyCSuaXGhsdRdUtZk5XhcZ';
    const FROM_EMAIL = 'Show Floor Tips Team <info@showfloortips.com>';
    const ADMIN_EMAIL = 'info@showfloortips.com';

    const timestamp = new Date().toISOString();
    const tierLabel = tier.trim().charAt(0).toUpperCase() + tier.trim().slice(1);

    // Build admin notification email HTML
    const adminEmailHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
    <div style="max-width:600px;margin:0 auto;padding:24px;">
        <div style="background:#0a0a0a;border-radius:12px 12px 0 0;padding:32px;text-align:center;">
            <h1 style="color:#ffffff;font-size:22px;margin:0 0 8px;">New Claim Request</h1>
            <p style="color:#a3a3a3;font-size:14px;margin:0;">${show_name.trim()} &mdash; ${tierLabel} Tier</p>
        </div>
        <div style="background:#ffffff;border:1px solid #e5e5e5;border-top:none;border-radius:0 0 12px 12px;padding:32px;">
            <table style="width:100%;border-collapse:collapse;">
                <tr>
                    <td style="padding:12px 0;border-bottom:1px solid #f5f5f5;font-size:13px;color:#737373;font-weight:600;width:140px;vertical-align:top;">Show Name</td>
                    <td style="padding:12px 0;border-bottom:1px solid #f5f5f5;font-size:14px;color:#0a0a0a;font-weight:600;">${show_name.trim()}</td>
                </tr>
                <tr>
                    <td style="padding:12px 0;border-bottom:1px solid #f5f5f5;font-size:13px;color:#737373;font-weight:600;vertical-align:top;">Organizer</td>
                    <td style="padding:12px 0;border-bottom:1px solid #f5f5f5;font-size:14px;color:#0a0a0a;">${organizer_name.trim()}</td>
                </tr>
                <tr>
                    <td style="padding:12px 0;border-bottom:1px solid #f5f5f5;font-size:13px;color:#737373;font-weight:600;vertical-align:top;">Email</td>
                    <td style="padding:12px 0;border-bottom:1px solid #f5f5f5;font-size:14px;color:#0a0a0a;">
                        <a href="mailto:${email.trim()}" style="color:#2563eb;text-decoration:none;">${email.trim()}</a>
                    </td>
                </tr>
                <tr>
                    <td style="padding:12px 0;border-bottom:1px solid #f5f5f5;font-size:13px;color:#737373;font-weight:600;vertical-align:top;">Phone</td>
                    <td style="padding:12px 0;border-bottom:1px solid #f5f5f5;font-size:14px;color:#0a0a0a;">${phone ? phone.trim() : 'Not provided'}</td>
                </tr>
                <tr>
                    <td style="padding:12px 0;border-bottom:1px solid #f5f5f5;font-size:13px;color:#737373;font-weight:600;vertical-align:top;">Company</td>
                    <td style="padding:12px 0;border-bottom:1px solid #f5f5f5;font-size:14px;color:#0a0a0a;">${company.trim()}</td>
                </tr>
                <tr>
                    <td style="padding:12px 0;border-bottom:1px solid #f5f5f5;font-size:13px;color:#737373;font-weight:600;vertical-align:top;">Website</td>
                    <td style="padding:12px 0;border-bottom:1px solid #f5f5f5;font-size:14px;color:#0a0a0a;">
                        <a href="${website ? website.trim() : '#'}" style="color:#2563eb;text-decoration:none;">${website ? website.trim() : 'Not provided'}</a>
                    </td>
                </tr>
                <tr>
                    <td style="padding:12px 0;border-bottom:1px solid #f5f5f5;font-size:13px;color:#737373;font-weight:600;vertical-align:top;">Selected Tier</td>
                    <td style="padding:12px 0;border-bottom:1px solid #f5f5f5;font-size:14px;color:#0a0a0a;">
                        <span style="display:inline-block;padding:4px 12px;background:${tier.trim().toLowerCase() === 'premium' ? '#0a0a0a' : tier.trim().toLowerCase() === 'pro' ? '#262626' : '#f5f5f5'};color:${tier.trim().toLowerCase() === 'starter' ? '#0a0a0a' : '#ffffff'};border-radius:20px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;">${tierLabel}</span>
                    </td>
                </tr>
                <tr>
                    <td style="padding:12px 0;border-bottom:1px solid #f5f5f5;font-size:13px;color:#737373;font-weight:600;vertical-align:top;">Message</td>
                    <td style="padding:12px 0;border-bottom:1px solid #f5f5f5;font-size:14px;color:#0a0a0a;">${message ? message.trim().replace(/\n/g, '<br>') : 'No additional message'}</td>
                </tr>
                <tr>
                    <td style="padding:12px 0;font-size:13px;color:#737373;font-weight:600;vertical-align:top;">Submitted</td>
                    <td style="padding:12px 0;font-size:14px;color:#737373;">${new Date(timestamp).toLocaleString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' })}</td>
                </tr>
            </table>
            <div style="margin-top:24px;padding-top:24px;border-top:1px solid #e5e5e5;text-align:center;">
                <a href="mailto:${email.trim()}?subject=Re: Your Claim Request for ${encodeURIComponent(show_name.trim())} - ShowFloorTips" style="display:inline-block;padding:12px 24px;background:#0a0a0a;color:#ffffff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:700;">Reply to Organizer</a>
            </div>
        </div>
        <p style="text-align:center;font-size:12px;color:#a3a3a3;margin-top:16px;">This notification was sent from showfloortips.com claim system</p>
    </div>
</body>
</html>`;

    // Build organizer confirmation email HTML
    const confirmationEmailHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
    <div style="max-width:600px;margin:0 auto;padding:24px;">
        <div style="background:#0a0a0a;border-radius:12px 12px 0 0;padding:32px;text-align:center;">
            <h1 style="color:#ffffff;font-size:20px;margin:0 0 4px;letter-spacing:-0.02em;">ShowFloorTips</h1>
            <p style="color:#a3a3a3;font-size:13px;margin:0;">The Internet's Largest Trade Show Directory</p>
        </div>
        <div style="background:#ffffff;border:1px solid #e5e5e5;border-top:none;border-radius:0 0 12px 12px;padding:32px;">
            <h2 style="font-size:20px;color:#0a0a0a;margin:0 0 16px;letter-spacing:-0.02em;">Your Claim Request Has Been Received</h2>
            <p style="font-size:15px;color:#525252;line-height:1.7;margin:0 0 16px;">
                Hi ${organizer_name.trim()},
            </p>
            <p style="font-size:15px;color:#525252;line-height:1.7;margin:0 0 16px;">
                Thank you for submitting a claim request for <strong>${show_name.trim()}</strong> on ShowFloorTips. We're excited to help you take control of your listing.
            </p>

            <div style="background:#fafafa;border:1px solid #e5e5e5;border-radius:8px;padding:20px;margin:24px 0;">
                <h3 style="font-size:14px;color:#0a0a0a;margin:0 0 12px;text-transform:uppercase;letter-spacing:0.05em;">Your Claim Summary</h3>
                <table style="width:100%;border-collapse:collapse;">
                    <tr>
                        <td style="padding:6px 0;font-size:13px;color:#737373;">Show</td>
                        <td style="padding:6px 0;font-size:13px;color:#0a0a0a;font-weight:600;text-align:right;">${show_name.trim()}</td>
                    </tr>
                    <tr>
                        <td style="padding:6px 0;font-size:13px;color:#737373;">Plan</td>
                        <td style="padding:6px 0;font-size:13px;color:#0a0a0a;font-weight:600;text-align:right;">${tierLabel}${tier.trim().toLowerCase() === 'pro' ? ' ($149/mo)' : tier.trim().toLowerCase() === 'premium' ? ' ($499/mo)' : ' (Free)'}</td>
                    </tr>
                    <tr>
                        <td style="padding:6px 0;font-size:13px;color:#737373;">Company</td>
                        <td style="padding:6px 0;font-size:13px;color:#0a0a0a;font-weight:600;text-align:right;">${company.trim()}</td>
                    </tr>
                </table>
            </div>

            <h3 style="font-size:16px;color:#0a0a0a;margin:24px 0 12px;">What Happens Next</h3>
            <div style="margin-bottom:16px;">
                <div style="display:flex;margin-bottom:12px;">
                    <div style="width:28px;height:28px;background:#0a0a0a;color:#fff;border-radius:50%;font-size:13px;font-weight:700;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;margin-right:12px;line-height:28px;text-align:center;">1</div>
                    <div>
                        <p style="font-size:14px;color:#0a0a0a;font-weight:600;margin:0 0 2px;padding-top:4px;">Verification Review</p>
                        <p style="font-size:13px;color:#737373;margin:0;line-height:1.5;">Our team will review your claim and verify your organizer status within <strong>24-48 hours</strong>.</p>
                    </div>
                </div>
                <div style="display:flex;margin-bottom:12px;">
                    <div style="width:28px;height:28px;background:#0a0a0a;color:#fff;border-radius:50%;font-size:13px;font-weight:700;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;margin-right:12px;line-height:28px;text-align:center;">2</div>
                    <div>
                        <p style="font-size:14px;color:#0a0a0a;font-weight:600;margin:0 0 2px;padding-top:4px;">Confirmation Email</p>
                        <p style="font-size:13px;color:#737373;margin:0;line-height:1.5;">Once verified, you'll receive an email with your listing management dashboard access.</p>
                    </div>
                </div>
                <div style="display:flex;">
                    <div style="width:28px;height:28px;background:#0a0a0a;color:#fff;border-radius:50%;font-size:13px;font-weight:700;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;margin-right:12px;line-height:28px;text-align:center;">3</div>
                    <div>
                        <p style="font-size:14px;color:#0a0a0a;font-weight:600;margin:0 0 2px;padding-top:4px;">Go Live</p>
                        <p style="font-size:13px;color:#737373;margin:0;line-height:1.5;">Update your listing details, add branding, and start capturing leads immediately.</p>
                    </div>
                </div>
            </div>

            <div style="margin-top:24px;padding-top:24px;border-top:1px solid #e5e5e5;">
                <p style="font-size:14px;color:#525252;line-height:1.7;margin:0 0 8px;">
                    Have questions? Reply to this email or reach us at:
                </p>
                <p style="font-size:14px;color:#0a0a0a;margin:0;">
                    <a href="mailto:info@showfloortips.com" style="color:#2563eb;text-decoration:none;font-weight:600;">info@showfloortips.com</a>
                </p>
            </div>
        </div>
        <div style="text-align:center;padding:24px 0;">
            <p style="font-size:13px;color:#a3a3a3;margin:0 0 4px;">ShowFloorTips &mdash; The Internet's Largest Trade Show Directory</p>
            <p style="font-size:12px;color:#d4d4d4;margin:0;">25,000+ shows &bull; 100,000+ monthly visitors &bull; 120+ countries</p>
        </div>
    </div>
</body>
</html>`;

    try {
        // Send admin notification email
        const adminEmailResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: FROM_EMAIL,
                to: [ADMIN_EMAIL],
                subject: `New Claim Request: ${show_name.trim()} — ${tierLabel} Tier`,
                html: adminEmailHtml
            })
        });

        if (!adminEmailResponse.ok) {
            const adminError = await adminEmailResponse.json();
            console.error('Admin email error:', adminError);
            return res.status(500).json({
                error: 'Failed to process claim. Please try again or email info@showfloortips.com directly.'
            });
        }

        // Send confirmation email to organizer
        const confirmEmailResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: FROM_EMAIL,
                to: [email.trim()],
                reply_to: ADMIN_EMAIL,
                subject: `Your Claim Request for ${show_name.trim()} — ShowFloorTips`,
                html: confirmationEmailHtml
            })
        });

        if (!confirmEmailResponse.ok) {
            const confirmError = await confirmEmailResponse.json();
            console.error('Confirmation email error:', confirmError);
            // Don't fail the whole request - admin already got notified
        }

        // Return success with claim data
        return res.status(200).json({
            success: true,
            message: 'Claim submitted successfully',
            claim: {
                show_name: show_name.trim(),
                organizer_name: organizer_name.trim(),
                email: email.trim(),
                phone: phone ? phone.trim() : '',
                company: company.trim(),
                website: website ? website.trim() : '',
                tier: tier.trim().toLowerCase(),
                message: message ? message.trim() : '',
                submitted_at: timestamp
            }
        });

    } catch (err) {
        console.error('Claim submission error:', err);
        return res.status(500).json({
            error: 'Server error. Please try again or email info@showfloortips.com directly.'
        });
    }
}
