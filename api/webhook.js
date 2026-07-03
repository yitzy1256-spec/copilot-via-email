/**
 * Webhook endpoint for receiving GroupMe messages
 * Sends them back to your Gmail inbox
 */

const { gmail } = require("../src/gmail");
const { fetchGroupMeMessages } = require("../src/groupme");

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
      const emailBody = formatGroupMeMessage(msg);

      await gmail.sendEmail({
        to: process.env.GMAIL_EMAIL,
        subject: `💬 GroupMe: ${msg.name}`,
        body: emailBody,
      });

      console.log(`✅ Sent email from ${msg.name}`);
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

function formatGroupMeMessage(msg) {
  let body = `From: ${msg.name}\n`;
  body += `Time: ${new Date(msg.created_at * 1000).toLocaleString()}\n\n`;
  body += msg.text || "[No text message]";

  if (msg.attachments && msg.attachments.length > 0) {
    body += `\n\nAttachments: ${msg.attachments.length} file(s)`;
  }

  return body;
}
