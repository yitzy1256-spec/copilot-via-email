/**
 * Webhook endpoint for receiving GroupMe messages
 * Sends them back to your Gmail inbox with all attachments
 */

const { gmail } = require("../src/gmail");
const { fetchGroupMeMessages, downloadMedia } = require("../src/groupme");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    console.log("🔔 Webhook received");

    // Track processed messages in memory
    if (!global.processedIds) {
      global.processedIds = [];
    }

    // Fetch latest GroupMe messages
    const messages = await fetchGroupMeMessages(20);

    let newMessages = [];
    for (const msg of messages) {
      // Skip if already processed or from self
      if (global.processedIds.includes(msg.id) || msg.sender_id === process.env.GROUPME_SENDER_ID) {
        continue;
      }

      newMessages.push(msg);
      global.processedIds.push(msg.id);
    }

    if (newMessages.length === 0) {
      return res.status(200).json({ message: "No new messages" });
    }

    console.log(`📨 Found ${newMessages.length} new GroupMe messages`);

    // Format and send to Gmail
    for (const msg of newMessages) {
      const { emailBody, attachments } = await formatGroupMeMessage(msg);

      await gmail.sendEmail({
        to: process.env.GMAIL_EMAIL,
        subject: `💬 GroupMe: ${msg.name}`,
        body: emailBody,
        attachments: attachments,
      });

      console.log(`✅ Sent email from ${msg.name} with ${attachments.length} attachment(s)`);
    }

    res.status(200).json({
      success: true,
      messagesProcessed: newMessages.length,
    });
  } catch (error) {
    console.error("❌ Webhook error:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Format GroupMe message for email
 * Download and include all media attachments
 */
async function formatGroupMeMessage(msg) {
  let body = `From: ${msg.name}\n`;
  body += `Time: ${new Date(msg.created_at * 1000).toLocaleString()}\n\n`;
  body += msg.text || "[No text message]";

  let attachments = [];

  // Process media attachments from GroupMe
  if (msg.attachments && msg.attachments.length > 0) {
    body += `\n\n---\nMedia Attachments (${msg.attachments.length}):";

    for (const attachment of msg.attachments) {
      try {
        if (attachment.type === "image" && attachment.url) {
          console.log(`📷 Processing image: ${attachment.url}`);
          const mediaData = await downloadMedia(attachment.url);
          attachments.push(mediaData);
          body += `\n✅ Image: ${mediaData.filename}`;
        } else if (attachment.type === "video" && attachment.url) {
          console.log(`🎥 Processing video: ${attachment.url}`);
          const mediaData = await downloadMedia(attachment.url);
          attachments.push(mediaData);
          body += `\n✅ Video: ${mediaData.filename}`;
        } else if (attachment.type === "file" && attachment.url) {
          console.log(`📎 Processing file: ${attachment.url}`);
          const mediaData = await downloadMedia(attachment.url);
          attachments.push(mediaData);
          body += `\n✅ File: ${mediaData.filename}`;
        }
      } catch (err) {
        console.error(`❌ Failed to download attachment:`, err.message);
        body += `\n❌ Failed to download: ${attachment.url}`;
      }
    }
  }

  return { emailBody: body, attachments };
}
