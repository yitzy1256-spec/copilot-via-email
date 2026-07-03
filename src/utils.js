/**
 * Utility functions
 */

const crypto = require('crypto');

/**
 * Verify that a notification came from Gmail
 * (Optional: adds security layer)
 */
function verifyGmailNotification(req) {
  // Gmail sends notifications with a specific format
  // You can add additional verification here if needed
  return true;
}

/**
 * Generate a source GUID for deduplication
 */
function generateSourceGuid(emailId, suffix = '') {
  return `${emailId}${suffix ? '-' + suffix : ''}`;
}

module.exports = {
  verifyGmailNotification,
  generateSourceGuid,
};
