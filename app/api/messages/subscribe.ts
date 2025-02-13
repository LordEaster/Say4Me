import { NextApiRequest, NextApiResponse } from "next";

let clients: NextApiResponse[] = [];

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "GET") {
        res.status(405).json({ error: "Method Not Allowed" });
        return;
    }

    // Set SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Access-Control-Allow-Origin", "*"); // Enable CORS (Adjust if needed)

    // Prevent Next.js from prematurely closing the response
    res.flushHeaders();

    // Send initial connection confirmation
    res.write("data: Connected\n\n");

    // Add to client list
    clients.push(res);

    // Handle client disconnect
    req.on("close", () => {
        clients = clients.filter((client) => client !== res);
    });
}

// Function to send messages to all connected clients
export function sendMessageToClients(message: object) {
    clients.forEach((client) => {
        try {
            client.write(`data: ${JSON.stringify(message)}\n\n`);
        } catch (error) {
            console.error("Error sending message to SSE client:", error);
        }
    });
}
