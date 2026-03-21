import { NextResponse } from "next/server";
import { db } from "@/lib/firebase"; 
import { collection, query, where, getDocs, updateDoc, doc, addDoc, serverTimestamp } from "firebase/firestore";
import webpush from 'web-push'; // Pehle 'npm install web-push' karein

// VAPID Setup (Environment Variables se aayega)
webpush.setVapidDetails(
  'mailto:support@yourdomain.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

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

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const value = body.entry?.[0]?.changes?.[0]?.value;

    const statusUpdate = value?.statuses?.[0];
    if (statusUpdate) {
      const metaId = statusUpdate.id;
      const newStatus = statusUpdate.status;
      const q = query(collection(db, "chats"), where("metaId", "==", metaId));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        await updateDoc(doc(db, "chats", querySnapshot.docs[0].id), { status: newStatus });
      }
      return NextResponse.json({ status: "success" });
    }

    const message = value?.messages?.[0];
    const contact = value?.contacts?.[0];

    if (message) {
      let content = "";
      if (message.type === "text") content = message.text?.body;
      else if (message.type === "image") content = "📸 Photo Received";
      else if (message.type === "audio") content = "🎤 Voice Note Received";

      // 1. Firebase mein message save karo
      await addDoc(collection(db, "chats"), {
        sender: message.from,
        name: contact?.profile?.name || "Unknown",
        text: content,
        timestamp: serverTimestamp(),
        type: "incoming",
        status: "read"
      });

      // 2. REAL-TIME PUSH NOTIFICATION TRIGGER
      const subsSnapshot = await getDocs(collection(db, "subscriptions"));
      const payload = JSON.stringify({
        title: contact?.profile?.name || message.from,
        body: content,
        url: `/chat?num=${message.from}`,
        senderId: message.from
      });

      subsSnapshot.forEach((subscriptionDoc) => {
        webpush.sendNotification(subscriptionDoc.data() as any, payload)
          .catch(err => console.error("Notification Error:", err));
      });
    }

    return NextResponse.json({ status: "success" });
  } catch (error) {
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}
