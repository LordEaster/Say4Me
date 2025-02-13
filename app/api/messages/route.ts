import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import { sendMessageToClients } from "./subscribe";

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

async function screenMessage(message: string) {
  try {
    console.log(`sending message to ${OLLAMA_API_URL}/api/generate with model ${MODEL} and prompt ${message}`);
    
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

    console.log(`screening response of ${message} => ${data.response}`);
    
    return data.response.toLowerCase().trim().includes("approved");
  } catch (error) {
    console.error("Error screening message:", error);
    return false;
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const recipient = formData.get("recipient")?.toString();
    const message = formData.get("message")?.toString();

    if (!recipient || !message) {
      return NextResponse.json({ error: "Recipient and message required" }, { status: 400 });
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
      createdAt: new Date(),
    });

    const messageData = {
      id: result.insertedId.toString(),
      recipient,
      message,
    }

    sendMessageToClients(messageData);

    return NextResponse.json(
      messageData,
      { status: 201 }
    );
  } catch (error) {
    console.error("Error processing message:", error);
    return NextResponse.json({ error: "Failed to process message" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const db = await connectToDatabase();
    const messages = await db.collection("messages").find({}).sort({ createdAt: -1 }).limit(50).toArray();

    return NextResponse.json(messages.map((msg) => ({
      id: msg._id.toString(),
      recipient: msg.recipient,
      message: msg.message,
      image: msg.image,
      voice: msg.voice,
    })));
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}
