import axios from "axios";
import FormData from "form-data";
import dotenv from "dotenv";
import { randomUUID } from "crypto";

dotenv.config();

const TOKEN = process.env.GROUPME_ACCESS_TOKEN;
const GROUP_ID = process.env.GROUP_ID;

const api = axios.create({
    headers: {
        "X-Access-Token": TOKEN
    }
});

export default api;
export async function sendText(text) {

    if (!text || !text.trim()) return;

    await api.post(
        `https://api.groupme.com/v3/groups/${GROUP_ID}/messages`,
        {
            message: {
                source_guid: randomUUID(),
                text
            }
        }
    );

}
export async function uploadMedia(buffer, mimeType) {

    const response = await axios.post(

        "https://image.groupme.com/pictures",

        buffer,

        {

            headers: {

                "Content-Type": mimeType,

                "X-Access-Token": TOKEN

            }

        }

    );

    return response.data.payload.url;

}
export async function sendImage(url) {

    await api.post(

        `https://api.groupme.com/v3/groups/${GROUP_ID}/messages`,

        {

            message: {

                source_guid: randomUUID(),

                attachments: [

                    {

                        type: "image",

                        url

                    }

                ]

            }

        }

    );

}
export async function sendVideo(url) {

    await api.post(

        `https://api.groupme.com/v3/groups/${GROUP_ID}/messages`,

        {

            message: {

                source_guid: randomUUID(),

                attachments: [

                    {

                        type: "video",

                        url

                    }

                ]

            }

        }

    );

}
export async function sendAttachment(file) {

    const uploaded = await uploadMedia(
        file.data,
        file.mimeType
    );

    if (file.mimeType.startsWith("video/")) {

        return sendVideo(uploaded);

    }

    return sendImage(uploaded);

}
export async function getMessages(limit = 20) {

    const response = await api.get(

        `https://api.groupme.com/v3/groups/${GROUP_ID}/messages`,

        {

            params: {

                limit

            }

        }

    );

    return response.data.response.messages;

}
export async function downloadMedia(url) {

    const response = await axios.get(

        url,

        {

            responseType: "arraybuffer",

            headers: {

                "User-Agent": "Mozilla/5.0"

            }

        }

    );

    return Buffer.from(response.data);

}
export async function retry(fn, attempts = 3) {

    let lastError;

    for (let i = 0; i < attempts; i++) {

        try {

            return await fn();

        }

        catch (err) {

            lastError = err;

            await new Promise(resolve =>
                setTimeout(resolve, 1000)
            );

        }

    }

    throw lastError;

}
export function isMine(message) {

    return (
        message.sender_id ===
        process.env.MY_SENDER_ID
    );

}
export function simplifyMessage(message) {

    return {

        id: message.id,

        sender: message.name,

        senderId: message.sender_id,

        text: message.text || "",

        createdAt: new Date(
            message.created_at * 1000
        ),

        attachments:
            message.attachments || []

    };

}
const msg = simplifyMessage(groupmeMessage);

console.log(msg.sender);
console.log(msg.text);
console.log(msg.createdAt);
