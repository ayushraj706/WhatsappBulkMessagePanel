import { NextResponse } from "next/server";
import { db } from "@/lib/firebase"; 
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

// 1. Verification (Handshake) - Same rahega
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.NEXT_PUBLIC_WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

// 2. Optimized POST Route
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const value = body.entry?.[0]?.changes?.[0]?.value;
    const message = value?.messages?.[0];
    const contact = value?.contacts?.[0];
    const status = value?.statuses?.[0]; // Message status check karne ke liye

    // LOGS: Status check karne ke liye (Vercel logs mein dikhega)
    if (status) {
        console.log(`Message ${status.id} is now ${status.status}`);
    }

    if (message) {
      let content = "";
      let mediaId = "";

      // MEDIA TYPE CHECK
      if (message.type === "text") {
        content = message.text?.body;
      } else if (message.type === "image") {
        content = "📸 Photo Received";
        mediaId = message.image?.id;
      } else if (message.type === "audio") {
        content = "🎤 Voice Note Received";
        mediaId = message.audio?.id;
      } else {
        content = `Unsupported: ${message.type}`;
      }

      await addDoc(collection(db, "chats"), {
        sender: message.from,
        name: contact?.profile?.name || "Unknown",
        text: content,
        media_id: mediaId, // Future mein image download karne ke liye
        timestamp: serverTimestamp(),
        type: "incoming"
      });
    }

    return NextResponse.json({ status: "success" });
  } catch (error) {
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}
