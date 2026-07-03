# Gmail ↔ GroupMe Integration

Converts your Google Scripts into a Node.js application hosted on Vercel. This integration:

- 📧 **Reads emails from Gmail inbox** with "copilot" trigger
- 💬 **Sends messages to GroupMe** (text + emojis + attachments)
- 📨 **Emails you GroupMe messages** back to Gmail
- ▶️ **Runs on a 5-minute cron schedule** via Vercel

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
   - Generate `GOOGLE_REFRESH_TOKEN` (requires local OAuth flow)

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

## Environment Variables

```env
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REFRESH_TOKEN=...
GMAIL_EMAIL=your-email@gmail.com

GROUPME_ACCESS_TOKEN=...
GROUPME_GROUP_ID=...
GROUPME_SENDER_ID=...
GROUPME_IMAGE_UPLOAD_URL=https://image.groupme.com/pictures

WEBHOOK_SECRET=random_secret_key
```

## How It Works

### ⬇️ Gmail → GroupMe

1. **Every 5 minutes**: Cron checks inbox for emails with "copilot" in subject
2. **Send to GroupMe**: Text content + attachments are posted to your group
3. **Cleanup**: Email is moved to trash

### ⬆️ GroupMe → Gmail

1. **Webhook trigger**: Receives new GroupMe messages (requires webhook setup)
2. **Filter & Download**: Extracts text, emojis, and media
3. **Email to You**: Sends formatted email with attachments to your Gmail

## Local Development

```bash
npm install
vercel env pull
npm run dev
```

Visit `http://localhost:3000/api/webhook` to test.

## Troubleshooting

- **"Gmail API error"**: Check refresh token expiration
- **"GroupMe 401"**: Verify access token is correct
- **"No emails found"**: Check subject line includes "copilot" trigger word
- **Media not uploading**: Verify GROUPME_IMAGE_UPLOAD_URL

## License

MIT
