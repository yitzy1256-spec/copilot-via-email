# Gmail ↔ GroupMe Integration

Converts your Gmail inbox into a GroupMe interface. This integration:

- 📧 **Reads emails from Gmail inbox** with "copilot" trigger
- 💬 **Sends messages to GroupMe** (text + emojis + attachments)
- 📨 **Emails you GroupMe messages** back to Gmail
- ⚡ **Triggered by Gmail push notifications** (instant, no daily limits)

## Why This Approach?

✅ **No daily limits** (Google Apps Script has 100/day limit)
✅ **Works on Vercel Hobby plan** (unlimited webhooks)
✅ **Instant trigger** (not polling every minute)
✅ **Only processes emails you actually send** (efficient)

---

## Setup

### 1. Gmail API Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project
3. Enable **Gmail API**
4. Create OAuth 2.0 credentials (Desktop app)
5. Download credentials as JSON
6. Extract:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - Generate `GOOGLE_REFRESH_TOKEN` (requires OAuth flow - see instructions above)

### 2. GroupMe Setup

1. Get your **GroupMe Access Token** from https://dev.groupme.com
2. Get your **Group ID** from the group URL
3. Get your **Sender ID** (your user ID in GroupMe)

### 3. Deploy to Vercel

```bash
npm install
vercel deploy --prod
```

Add all environment variables in Vercel dashboard.

### 4. Enable Gmail Push Notifications (IMPORTANT!)

After deploying, run this setup script:

```bash
node scripts/setup-gmail-notifications.js
```

This subscribes your Vercel webhook to Gmail notifications.

---

## Environment Variables

Add these to Vercel dashboard:


```

---

## How It Works

### ⬇️ Gmail → GroupMe (Instant)

1. **You send an email** with "copilot" in the subject
2. **Gmail sends a push notification** to your Vercel webhook
3. **Webhook receives notification** and fetches the email
4. **Text + attachments are posted to GroupMe**
5. **Email is moved to trash**

### ⬆️ GroupMe → Gmail (Via Webhook)

1. **GroupMe sends a webhook** (requires setup)
2. **Webhook receives message**
3. **Email is sent to your inbox**

---

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|----------|
| `/api/gmail-notification` | POST | Receives Gmail push notifications |
| `/api/webhook` | POST | Receives GroupMe messages |

---

## Local Development

```bash
npm install
vercel env pull
npm run dev
```

Visit `http://localhost:3000/api/gmail-notification` to test.

---

## Troubleshooting

- **"Gmail API error"**: Check refresh token expiration
- **"No notifications received"**: Run `scripts/setup-gmail-notifications.js` again
- **"GroupMe 401"**: Verify access token is correct
- **"No emails found"**: Check subject line includes "copilot" trigger word
- **Media not uploading**: Verify `GROUPME_IMAGE_UPLOAD_URL`

---

## Files Structure

```
.
├── api/
│   ├── gmail-notification.js    # 👈 Main webhook (receives Gmail push notifications)
│   └── webhook.js                # GroupMe webhook
├── src/
│   ├── gmail.js                  # Gmail API client
│   ├── groupme.js                # GroupMe API client
│   └── utils.js                  # Utilities
├── scripts/
│   └── setup-gmail-notifications.js  # 👈 Run this ONCE to enable notifications
└── vercel.json
```

---

## License

MIT
