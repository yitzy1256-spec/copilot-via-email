/**
 * Setup script to enable Gmail Push Notifications
 * Run this ONCE to subscribe to Gmail notifications
 * 
 * Usage: node scripts/setup-gmail-notifications.js
 */

const { gmail } = require("../src/gmail");

async function setupGmailNotifications() {
  try {
    console.log("🔧 Setting up Gmail Push Notifications...");

    // Initialize Gmail client
    await gmail.initialize();

    // Subscribe to Gmail notifications
    // This will send a POST to your webhook URL whenever new emails arrive
    const topicName = "projects/myproject/topics/gmail-notifications";
    const webhookUrl = process.env.GMAIL_WEBHOOK_URL || "https://copilot-via-email.vercel.app/api/gmail-notification";

    console.log(`\n📍 Webhook URL: ${webhookUrl}`);
    console.log(`📍 Topic: ${topicName}`);

    // Call Gmail API to watch for changes
    const response = await gmail.watch(webhookUrl);

    console.log("\n✅ Success! Gmail Push Notifications enabled");
    console.log(`\n📋 Watch details:`);
    console.log(`   - Expiration: ${response.expiration}`);
    console.log(`   - History ID: ${response.historyId}`);
    console.log(`\n💡 Note: Notifications will expire after about 7 days.`);
    console.log(`   You may need to re-run this script to refresh.\n`);
  } catch (error) {
    console.error("❌ Setup failed:", error.message);
    process.exit(1);
  }
}

setupGmailNotifications();
