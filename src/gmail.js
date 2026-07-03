/**
 * Gmail API client
 * Handles fetching emails with "copilot" trigger and sending emails
 */

const { google } = require("googleapis");
const fs = require("fs");

class GmailClient {
  constructor() {
    this.gmail = null;
    this.auth = null;
  }

  async initialize() {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      "http://localhost:3000/callback"
    );

    oauth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
    });

    this.auth = oauth2Client;
    this.gmail = google.gmail({ version: "v1", auth: oauth2Client });
  }

  /**
   * Fetch emails from inbox with "copilot" trigger
   */
  async fetchEmailsWithTrigger(trigger = "copilot") {
    if (!this.gmail) await this.initialize();

    try {
      // Build query: inbox only, contains trigger word in subject, unread
      let query = `in:inbox subject:${trigger} is:unread`;

      console.log(`🔍 Gmail query: ${query}`);

      const res = await this.gmail.users.messages.list({
        userId: "me",
        q: query,
        maxResults: 10,
      });

      const messageIds = res.data.messages || [];
      if (messageIds.length === 0) {
        console.log("No emails found");
        return [];
      }

      // Fetch full message details
      const emails = [];
      for (const msg of messageIds) {
        const fullMessage = await this.gmail.users.messages.get({
          userId: "me",
          id: msg.id,
          format: "full",
        });

        emails.push(this.parseMessage(fullMessage.data));
      }

      return emails;
    } catch (error) {
      console.error("❌ Failed to fetch emails:", error.message);
      throw error;
    }
  }

  /**
   * Parse Gmail message format
   */
  parseMessage(message) {
    const headers = message.payload.headers;
    const subject = headers.find((h) => h.name === "Subject")?.value || "[No Subject]";
    const from = headers.find((h) => h.name === "From")?.value || "Unknown";

    let body = "";
    let attachments = [];

    // Get body
    if (message.payload.parts) {
      for (const part of message.payload.parts) {
        if (part.mimeType === "text/plain" && part.body.data) {
          body = Buffer.from(part.body.data, "base64").toString("utf-8");
        }

        // Handle attachments
        if (part.filename && part.body.attachmentId) {
          attachments.push({
            filename: part.filename,
            mimeType: part.mimeType,
            attachmentId: part.body.attachmentId,
            messageId: message.id,
          });
        }
      }
    } else if (message.payload.body.data) {
      body = Buffer.from(message.payload.body.data, "base64").toString("utf-8");
    }

    return {
      id: message.id,
      subject,
      from,
      body: body.trim(),
      attachments,
    };
  }

  /**
   * Download attachment
   */
  async downloadAttachment(messageId, attachmentId) {
    if (!this.gmail) await this.initialize();

    try {
      const res = await this.gmail.users.messages.attachments.get({
        userId: "me",
        messageId,
        id: attachmentId,
      });

      return {
        data: Buffer.from(res.data.data, "base64"),
        mimeType: res.data.mimeType,
      };
    } catch (error) {
      console.error("❌ Failed to download attachment:", error.message);
      throw error;
    }
  }

  /**
   * Mark email as processed (move to trash)
   */
  async markEmailAsProcessed(messageId) {
    if (!this.gmail) await this.initialize();

    try {
      await this.gmail.users.messages.trash({
        userId: "me",
        id: messageId,
      });

      console.log(`🗑️ Moved email ${messageId} to trash`);
    } catch (error) {
      console.error("❌ Failed to trash email:", error.message);
    }
  }

  /**
   * Send email
   */
  async sendEmail({ to, subject, body, attachments = [] }) {
    if (!this.gmail) await this.initialize();

    try {
      const message = this.createMessage(to, subject, body, attachments);

      await this.gmail.users.messages.send({
        userId: "me",
        requestBody: {
          raw: message,
        },
      });

      console.log(`✅ Email sent to ${to}`);
    } catch (error) {
      console.error("❌ Failed to send email:", error.message);
      throw error;
    }
  }

  createMessage(to, subject, body, attachments = []) {
    const boundary = "===============7330845974216740156==";
    let emailContent = `To: ${to}\nSubject: ${subject}\nMIME-Version: 1.0\nContent-Type: multipart/mixed; boundary="${boundary}"\n\n`;

    // Add body
    emailContent += `--${boundary}\nContent-Type: text/plain; charset="UTF-8"\nContent-Transfer-Encoding: 7bit\n\n${body}\n`;

    // Add attachments if any
    for (const attachment of attachments) {
      emailContent += `\n--${boundary}\nContent-Type: ${attachment.mimeType}; name="${attachment.filename}"\nContent-Disposition: attachment; filename="${attachment.filename}"\nContent-Transfer-Encoding: base64\n\n${Buffer.from(attachment.data).toString("base64")}\n`;
    }

    emailContent += `\n--${boundary}--`;

    return Buffer.from(emailContent).toString("base64").replace(/\+/g, "-").replace(/\//g, "_");
  }
}

module.exports = {
  gmail: new GmailClient(),
};
