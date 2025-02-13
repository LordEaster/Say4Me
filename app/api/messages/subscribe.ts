import { NextApiRequest, NextApiResponse } from "next";

let clients: NextApiResponse[] = [];

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    // Set up headers for Server-Sent Events (SSE)
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // Send an initial connection message
    res.write("data: Connected\n\n");

    // Add client to the list
    clients.push(res);

    // Handle client disconnect
    req.on("close", () => {
        clients = clients.filter((client) => client !== res);
        res.end();
    });
}

// Function to send messages to all clients
export function sendMessageToClients(message: object) {
    clients.forEach((client) => {
        client.write(`data: ${JSON.stringify(message)}\n\n`);
    });
}
