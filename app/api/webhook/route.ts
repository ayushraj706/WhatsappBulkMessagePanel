import { NextResponse } from "next/server";
import { db } from "@/lib/firebase"; 
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

// 1. Meta Verification (Handshake)
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

// 2. Receiving Messages (Incoming)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const message = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    const contact = body.entry?.[0]?.changes?.[0]?.value?.contacts?.[0];

    if (message) {
      // Firebase mein "chats" collection mein save karna
      await addDoc(collection(db, "chats"), {
        sender: message.from, // Yahan sender ka number aayega
        name: contact?.profile?.name || "Unknown", // Sender ka WhatsApp name
        text: message.text?.body || "Media Message",
        timestamp: serverTimestamp(),
        type: "incoming" // Isse bubble left side dikhega
      });
    }
    return NextResponse.json({ status: "success" });
  } catch (error) {
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}
