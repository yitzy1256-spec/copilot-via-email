/**
 * Gmail Push Notification Webhook
 * Triggered when you send an email with "copilot" in the subject
 * No daily limits, only processes when emails are actually sent
 */

const { gmail } = require("../src/gmail");
const { sendToGroupMe, uploadMedia } = require("../src/groupme");
const { verifyGmailNotification } = require("../src/utils");

module.exports = async (req, res) => {
  try {
    // Only allow POST
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    console.log("🔔 Gmail notification received");

    // Gmail sends a notification with a message ID
    const { message } = req.body;

    if (!message || !message.data) {
      console.log("⏭️  Skipping: No message data");
      return res.status(200).json({ message: "No message data" });
    }

    // Decode the base64 message ID
    const messageId = Buffer.from(message.data, "base64").toString("utf-8");
    console.log(`📧 Processing message ID: ${messageId}`);

    // Fetch the specific email from Gmail
    const email = await gmail.fetchEmailById(messageId);

    if (!email) {
      console.log("⏭️  Skipping: Email not found");
      return res.status(200).json({ message: "Email not found" });
    }

    // Check if email has "copilot" trigger in subject
    if (!email.subject.toLowerCase().includes("copilot")) {
      console.log(`⏭️  Skipping: No 'copilot' trigger in subject`);
      return res.status(200).json({ message: "No copilot trigger" });
    }

    console.log(`✅ Processing: ${email.subject}`);

    // 1️⃣ Send text content to GroupMe
    if (email.body && email.body.trim().length > 0) {
      await sendToGroupMe({
        text: email.body,
        sourceGuid: email.id,
      });
      console.log(`✅ Sent text to GroupMe: ${email.body.substring(0, 50)}...`);
    }

    // 2️⃣ Process attachments (images, videos, GIFs)
    if (email.attachments && email.attachments.length > 0) {
      for (const attachment of email.attachments) {
        try {
          const mediaUrl = await uploadMedia(attachment);
          const attachmentType = attachment.mimeType.includes("video") ? "video" : "image";

          await sendToGroupMe({
            attachments: [{ type: attachmentType, url: mediaUrl }],
            sourceGuid: `${email.id}-${attachment.filename}`,
          });
          console.log(`✅ Sent ${attachmentType} to GroupMe: ${attachment.filename}`);
        } catch (err) {
          console.error(`❌ Failed to process attachment: ${attachment.filename}`, err.message);
        }
      }
    }

    // 3️⃣ Mark email as processed (move to trash)
    await gmail.markEmailAsProcessed(email.id);

    res.status(200).json({
      success: true,
      message: `Processed email: ${email.subject}`,
      emailId: email.id,
    });
  } catch (error) {
    console.error("❌ Webhook error:", error);
    res.status(500).json({ error: error.message });
  }
};
