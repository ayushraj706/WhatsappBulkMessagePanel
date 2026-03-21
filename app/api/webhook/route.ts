import { NextResponse } from "next/server";
import { db } from "@/lib/firebase"; 
import { collection, query, where, getDocs, updateDoc, doc, addDoc, serverTimestamp } from "firebase/firestore";

// 1. Meta Verification (Handshake) - Same rahega
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

// 2. Receiving Messages & Status Updates
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const value = body.entry?.[0]?.changes?.[0]?.value;

    // A. STATUS UPDATE LOGIC (For Double & Blue Ticks)
    const statusUpdate = value?.statuses?.[0];
    if (statusUpdate) {
      const metaId = statusUpdate.id; // Meta ki message ID
      const newStatus = statusUpdate.status; // 'delivered' ya 'read' (blue tick)

      // Firebase mein wahi message dhoondho
      const q = query(collection(db, "chats"), where("metaId", "==", metaId));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const msgDoc = querySnapshot.docs[0];
        // Status update karo: User ne dekh liya toh 'read' (Blue tick)
        await updateDoc(doc(db, "chats", msgDoc.id), {
          status: newStatus 
        });
      }
      return NextResponse.json({ status: "success" });
    }

    // B. INCOMING MESSAGE LOGIC
    const message = value?.messages?.[0];
    const contact = value?.contacts?.[0];

    if (message) {
      let content = "";
      let mediaData = null;

      if (message.type === "text") {
        content = message.text?.body;
      } else if (message.type === "image") {
        content = "📸 Photo";
        // Future: Meta media ID se image download karke dikhane ka logic yahan aayega
      } else if (message.type === "audio") {
        content = "🎤 Voice Note";
      }

      await addDoc(collection(db, "chats"), {
        sender: message.from,
        name: contact?.profile?.name || "Unknown",
        text: content,
        timestamp: serverTimestamp(),
        type: "incoming",
        status: "read" // Incoming messages hamesha read dikhayenge
      });
    }

    return NextResponse.json({ status: "success" });
  } catch (error) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}
