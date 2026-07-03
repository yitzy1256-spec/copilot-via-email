import dotenv from "dotenv";

import {
    getCopilotEmails,
    getEmail,
    getPlainText,
    getAttachments,
    markRead
} from "../lib/gmail.js";

import {
    sendText,
    sendAttachment,
    retry
} from "../lib/groupme.js";

dotenv.config();

/*
|--------------------------------------------------------------------------
| Vercel Function
|--------------------------------------------------------------------------
*/

export default async function handler(req, res) {

    try {

        console.log("Checking Gmail...");

        const emails = await getCopilotEmails();

        console.log(`Found ${emails.length} email(s).`);

        for (const email of emails) {

            await processEmail(email.id);

        }

        return res.status(200).json({

            success: true,

            processed: emails.length

        });

    }

    catch (err) {

        console.error(err);

        return res.status(500).json({

            success: false,

            error: err.message

        });

    }

}

/*
|--------------------------------------------------------------------------
| Process One Email
|--------------------------------------------------------------------------
*/

async function processEmail(messageId) {

    console.log(`Processing ${messageId}`);

    const message = await getEmail(messageId);

    const payload = message.payload;

    const body = getPlainText(payload);

    if (body && body.trim()) {

        console.log("Sending text to GroupMe...");

        await retry(() => sendText(body));

    }

    const attachments = await getAttachments(message);

    console.log(`Found ${attachments.length} attachment(s).`);

    for (const file of attachments) {

        console.log(`Uploading ${file.filename}`);

        await retry(() => sendAttachment(file));

    }

    await markRead(messageId);

    console.log("Finished.");

}
