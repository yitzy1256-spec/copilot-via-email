/**
 * Cron job: Runs every 5 minutes to sync Gmail emails
 * Triggered by Vercel's scheduler
 */

const { gmail } = require("../src/gmail");
const { sendToGroupMe, uploadMedia } = require("../src/groupme");

module.exports = async (req, res) => {
  try {
    // Only allow POST from Vercel
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    console.log("🔄 Starting email sync...");

    // Fetch emails from Gmail with "copilot" trigger
    const emails = await gmail.fetchEmailsWithTrigger("copilot");
    console.log(`📧 Found ${emails.length} emails with 'copilot' trigger`);

    for (const email of emails) {
      console.log(`Processing email: ${email.subject}`);

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
    }

    res.status(200).json({
      success: true,
      message: `Processed ${emails.length} emails`,
    });
  } catch (error) {
    console.error("❌ Sync failed:", error);
    res.status(500).json({ error: error.message });
  }
};
