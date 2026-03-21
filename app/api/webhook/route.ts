import { NextResponse } from "next/server";
import { db } from "@/lib/firebase"; 
import { collection, query, where, getDocs, updateDoc, doc, addDoc, serverTimestamp } from "firebase/firestore";
import webpush from 'web-push';

// VAPID Setup
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

    // A. Status Update Logic
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

    // B. Incoming Message Logic
    const message = value?.messages?.[0];
    const contact = value?.contacts?.[0];

    if (message) {
      let content = "";
      if (message.type === "text") content = message.text?.body;
      else if (message.type === "image") content = "📸 Photo Received";
      else if (message.type === "audio") content = "🎤 Voice Note Received";

      await addDoc(collection(db, "chats"), {
        sender: message.from,
        name: contact?.profile?.name || "Unknown",
        text: content,
        timestamp: serverTimestamp(),
        type: "incoming",
        status: "read"
      });

      // --- REAL-TIME PUSH NOTIFICATION (RELIABLE VERSION) ---
      const subsSnapshot = await getDocs(collection(db, "subscriptions"));
      const payload = JSON.stringify({
        title: contact?.profile?.name || message.from,
        body: content,
        url: `/chat?num=${message.from}`,
        senderId: message.from
      });

      subsSnapshot.forEach((subscriptionDoc) => {
        const subData = subscriptionDoc.data();

        // STRICT VALIDATION: Isse 'endpoint' wala error kabhi nahi aayega
        if (!subData || !subData.endpoint || !subData.keys) {
            console.warn(`LOG: Skipping bad subscription record: ${subscriptionDoc.id}`);
            return;
        }

        const pushConfig = {
            endpoint: subData.endpoint,
            keys: {
                auth: subData.keys.auth,
                p256dh: subData.keys.p256dh
            }
        };

        webpush.sendNotification(pushConfig as any, payload)
          .then(() => console.log(`LOG: Push sent to ${subscriptionDoc.id}`))
          .catch(err => {
              // 410 ka matlab hai user ne app un-install kar di hai
              console.error(`LOG: Push Error (${subscriptionDoc.id}):`, err.statusCode);
          });
      });
    }

    return NextResponse.json({ status: "success" });
  } catch (error: any) {
    console.error("LOG: Critical Webhook Error:", error.message);
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}
