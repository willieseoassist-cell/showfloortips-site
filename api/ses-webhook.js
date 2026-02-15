const https = require('https');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST only' });
  }

  try {
    // Vercel auto-parses JSON body, but SNS sends text/plain
    let data = req.body;
    if (typeof data === 'string') {
      data = JSON.parse(data);
    }

    // SNS subscription confirmation — must GET the SubscribeURL to activate
    if (data.Type === 'SubscriptionConfirmation') {
      const confirmUrl = data.SubscribeURL;
      console.log('SNS confirmation request received, confirming:', confirmUrl);

      await new Promise((resolve, reject) => {
        https.get(confirmUrl, (resp) => {
          let body = '';
          resp.on('data', chunk => body += chunk);
          resp.on('end', () => {
            console.log('SNS subscription confirmed successfully');
            resolve(body);
          });
        }).on('error', reject);
      });

      return res.status(200).json({ status: 'confirmed' });
    }

    // SNS notification with SES event
    if (data.Type === 'Notification') {
      let message = data.Message;
      if (typeof message === 'string') {
        message = JSON.parse(message);
      }
      const notifType = message.notificationType;

      if (notifType === 'Bounce') {
        const bounce = message.bounce;
        const emails = bounce.bouncedRecipients.map(r => r.emailAddress);
        console.log(`BOUNCE (${bounce.bounceType}/${bounce.bounceSubType}): ${emails.join(', ')}`);
      } else if (notifType === 'Complaint') {
        const complaint = message.complaint;
        const emails = complaint.complainedRecipients.map(r => r.emailAddress);
        console.log(`COMPLAINT (${complaint.complaintFeedbackType || 'unknown'}): ${emails.join(', ')}`);
      }

      return res.status(200).json({ status: 'processed', type: notifType });
    }

    console.log('Unknown SNS message type:', data.Type);
    return res.status(200).json({ status: 'ok' });
  } catch (err) {
    console.error('Webhook error:', err.message);
    return res.status(500).json({ error: err.message });
  }
};
