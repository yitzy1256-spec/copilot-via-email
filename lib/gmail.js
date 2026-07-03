import dotenv from "dotenv";
import { google } from "googleapis";

dotenv.config();

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    "https://developers.google.com/oauthplayground"
);

oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN
});

export const gmail = google.gmail({
    version: "v1",
    auth: oauth2Client
});
export async function getCopilotEmails() {

    const response = await gmail.users.messages.list({
        userId: "me",
        q: "in:inbox is:unread subject:copilot"
    });

    return response.data.messages || [];
}
export async function getEmail(messageId) {

    const response = await gmail.users.messages.get({
        userId: "me",
        id: messageId
    });

    return response.data;
}
export function getPlainText(payload) {

    if (!payload)
        return "";

    if (payload.mimeType === "text/plain") {
        return decodeBody(payload.body.data);
    }

    if (!payload.parts)
        return "";

    for (const part of payload.parts) {

        if (part.mimeType === "text/plain") {
            return decodeBody(part.body.data);
        }

        if (part.parts) {

            const nested = getPlainText(part);

            if (nested)
                return nested;
        }
    }

    return "";
}
export async function getAttachments(message) {

    const files = [];

    async function walk(parts = []) {

        for (const part of parts) {

            if (
                part.filename &&
                part.body &&
                part.body.attachmentId
            ) {

                const attachment =
                    await gmail.users.messages.attachments.get({

                        userId: "me",

                        messageId: message.id,

                        id: part.body.attachmentId
                    });

                files.push({

                    filename: part.filename,

                    mimeType: part.mimeType,

                    data: Buffer.from(
                        attachment.data.data
                            .replace(/-/g, "+")
                            .replace(/_/g, "/"),
                        "base64"
                    )

                });
            }

            if (part.parts)
                await walk(part.parts);
        }
    }

    await walk(message.payload.parts || []);

    return files;
}
export async function markRead(id) {

    await gmail.users.messages.modify({

        userId: "me",

        id,

        requestBody: {

            removeLabelIds: [

                "UNREAD"

            ]
        }

    });

}
export async function sendEmail(
    to,
    subject,
    body
) {

    const message = [

        `To: ${to}`,

        "Content-Type: text/plain; charset=utf-8",

        "MIME-Version: 1.0",

        `Subject: ${subject}`,

        "",

        body

    ].join("\n");

    const encoded = Buffer
        .from(message)
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");

    await gmail.users.messages.send({

        userId: "me",

        requestBody: {

            raw: encoded

        }

    });

}
