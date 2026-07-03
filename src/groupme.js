/**
 * GroupMe API client
 * Handles sending messages and uploading media
 */

const axios = require("axios");
const FormData = require("form-data");

class GroupMeClient {
  constructor() {
    this.token = process.env.GROUPME_ACCESS_TOKEN;
    this.groupId = process.env.GROUPME_GROUP_ID;
    this.baseUrl = "https://api.groupme.com/v3";
    this.imageUploadUrl = process.env.GROUPME_IMAGE_UPLOAD_URL;
  }

  /**
   * Send text message to GroupMe
   */
  async sendToGroupMe({ text = null, attachments = [], sourceGuid }) {
    try {
      const payload = {
        message: {
          source_guid: sourceGuid,
          text: text || "",
          attachments: attachments,
        },
      };

      const res = await axios.post(
        `${this.baseUrl}/groups/${this.groupId}/messages?token=${this.token}`,
        payload,
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      console.log(`✅ Message sent to GroupMe: ${sourceGuid}`);
      return res.data;
    } catch (error) {
      console.error("❌ Failed to send GroupMe message:", error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Upload media to GroupMe
   */
  async uploadMedia(attachment) {
    try {
      const { filename, mimeType, attachmentId, messageId } = attachment;

      // If it's from Gmail, download it first
      let fileData;
      if (attachmentId && messageId) {
        const { gmail } = require("./gmail");
        const downloaded = await gmail.downloadAttachment(messageId, attachmentId);
        fileData = downloaded.data;
      } else {
        fileData = attachment.data;
      }

      // Upload to GroupMe
      const formData = new FormData();
      formData.append("file", fileData, { filename, contentType: mimeType });

      const res = await axios.post(this.imageUploadUrl, formData, {
        headers: {
          ...formData.getHeaders(),
          "X-Access-Token": this.token,
        },
      });

      console.log(`✅ Media uploaded: ${filename}`);
      return res.data.payload.url;
    } catch (error) {
      console.error("❌ Failed to upload media:", error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Fetch latest GroupMe messages
   */
  async fetchGroupMeMessages(limit = 20) {
    try {
      const res = await axios.get(
        `${this.baseUrl}/groups/${this.groupId}/messages?token=${this.token}&limit=${limit}`
      );

      return res.data.response.messages || [];
    } catch (error) {
      console.error("❌ Failed to fetch GroupMe messages:", error.response?.data || error.message);
      throw error;
    }
  }
}

module.exports = {
  sendToGroupMe: (payload) => new GroupMeClient().sendToGroupMe(payload),
  uploadMedia: (attachment) => new GroupMeClient().uploadMedia(attachment),
  fetchGroupMeMessages: (limit) => new GroupMeClient().fetchGroupMeMessages(limit),
};
