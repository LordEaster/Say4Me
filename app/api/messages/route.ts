import { NextResponse } from "next/server";
import { MongoClient, ObjectId } from "mongodb";
import { sendMessageToClients } from "./subscribe";
import { v4 as uuidv4 } from "uuid";

const MONGODB_URI = process.env.MONGODB_URI!;
const OLLAMA_API_URL = process.env.OLLAMA_API_URL!;
const MODEL = process.env.LLM_MODEL!;

let client: MongoClient | null = null;

async function connectToDatabase() {
  if (!client) {
    client = await MongoClient.connect(MONGODB_URI);
  }
  return client.db();
}

// Force Next.js API route to be dynamic
export const dynamic = "force-dynamic";

// **Message Screening Function**
async function screenMessage(message: string) {
  try {
    console.log(`Sending message to ${OLLAMA_API_URL}/api/generate with model ${MODEL} and prompt: ${message}`);

    const response = await fetch(`${OLLAMA_API_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        prompt: `Analyze this message for profanity, hate speech, or sexual harassment in Thai, Romanized Thai, or English. Reject messages with explicit references to body parts, sexual acts, or inappropriate advances. Allow respectful compliments. Respond with 'approved' or 'rejected'. Message: '${message}'`,
        stream: false,
      }),
    });

    if (!response.ok) throw new Error("AI screening failed");

    const data = await response.json();
    console.log(`Screening response: ${data.response}`);

    return data.response.toLowerCase().trim().includes("approved");
  } catch (error) {
    console.error("Error screening message:", error);
    return false;
  }
}

// **GET (Lazy Fetching & Pagination)**
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get("sessionId");

    const db = await connectToDatabase();
    const query = sessionId ? { sessionId } : {};

    const messages = await db
      .collection("messages")
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json(
      messages.map((msg) => ({
        id: msg._id.toString(),
        recipient: msg.recipient,
        message: msg.message,
        sessionId: msg.sessionId,
        viewerCount: msg.viewerCount || 0, // Default to 0
      }))
    );
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

// **POST (Send Message with Screening)**
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const recipient = formData.get("recipient")?.toString();
    const message = formData.get("message")?.toString();
    let sessionId = formData.get("sessionId")?.toString();

    if (!recipient || !message) {
      return NextResponse.json({ error: "Recipient and message required" }, { status: 400 });
    }

    if (!sessionId) {
      sessionId = uuidv4();
    }

    const isApproved = await screenMessage(message);
    if (!isApproved) {
      return NextResponse.json({ error: "Message contains inappropriate content" }, { status: 400 });
    }

    // Store message in MongoDB
    const db = await connectToDatabase();
    const result = await db.collection("messages").insertOne({
      recipient,
      message,
      sessionId,
      viewerCount: 0,
      createdAt: new Date(),
    });

    const messageData = {
      id: result.insertedId.toString(),
      recipient,
      message,
      sessionId,
      viewerCount: 0,
    };

    sendMessageToClients(messageData);

    return NextResponse.json(messageData, { status: 201 });
  } catch (error) {
    console.error("Error processing message:", error);
    return NextResponse.json({ error: "Failed to process message" }, { status: 500 });
  }
}

// **PATCH (Increment Viewer Count)**
export async function PATCH(request: Request) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "Message ID required" }, { status: 400 });
    }

    const db = await connectToDatabase();
    const message = await db.collection("messages").findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $inc: { viewerCount: 1 } },
      { returnDocument: "after" }
    );

    if (!message || !message.value) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    return NextResponse.json({ viewerCount: message.value.viewerCount });
  } catch (error) {
    console.error("Error updating viewer count:", error);
    return NextResponse.json({ error: "Failed to update viewer count" }, { status: 500 });
  }
}
