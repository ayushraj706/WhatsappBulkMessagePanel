import { NextResponse } from "next/server";
import { db } from "@/lib/firebase"; 
import { collection, query, where, getDocs, updateDoc, doc, addDoc, serverTimestamp } from "firebase/firestore";
import admin from 'firebase-admin';

// 1. Firebase Admin Initialization (FCM ke liye)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

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

    // --- A. TICK LOGIC (STATUS UPDATES) ---
    // Jab aapke panel se bheja gaya message 'Sent', 'Delivered' ya 'Read' hota hai
    const statusUpdate = value?.statuses?.[0];
    if (statusUpdate) {
      const metaId = statusUpdate.id; // Meta ki message ID
      const newStatus = statusUpdate.status; // 'sent', 'delivered', 'read'

      // Firestore mein wahi message dhoondo jo aapne panel se bheja tha
      const q = query(collection(db, "chats"), where("metaId", "==", metaId));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const msgDoc = querySnapshot.docs[0];
        // Status update karo: read = Blue Tick, delivered = Double Grey, sent = Single Grey
        await updateDoc(doc(db, "chats", msgDoc.id), {
          status: newStatus 
        });
        console.log(`LOG: Message ${metaId} updated to ${newStatus}`);
      }
      return NextResponse.json({ status: "success" });
    }

    // --- B. INCOMING MESSAGE LOGIC ---
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
        status: "read", // Incoming messages hamesha read dikhayenge
        metaId: message.id // Meta ki ID save karo taaki future mein update kar sakein
      });

      // 2. FCM PUSH NOTIFICATION (RELIABLE)
      // Firebase 'subscriptions' collection se saare devices ke tokens lo
      const subsSnapshot = await getDocs(collection(db, "subscriptions"));
      
      const payload = {
        notification: {
          title: contact?.profile?.name || message.from,
          body: content,
        },
        data: {
          url: `/chat?num=${message.from}`,
          senderId: message.from
        }
      };

      subsSnapshot.forEach((subDoc) => {
        const deviceToken = subDoc.data().token; // Humne ClientLayout mein 'token' save kiya tha
        if (deviceToken) {
          admin.messaging().send({
            ...payload,
            token: deviceToken
          }).catch(err => console.error("FCM Error:", err));
        }
      });
    }

    return NextResponse.json({ status: "success" });
  } catch (error: any) {
    console.error("LOG: Webhook Error:", error.message);
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}
