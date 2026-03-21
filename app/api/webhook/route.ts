import { NextResponse } from "next/server";
import { db } from "@/lib/firebase"; 
import { collection, query, where, getDocs, updateDoc, doc, addDoc, serverTimestamp } from "firebase/firestore";
import admin from 'firebase-admin';

// 1. Firebase Admin Initialization (Safe for Build Time)
if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  // Build ke waqt GitHub Actions ke paas ye keys nahi hoti, 
  // isliye ye check lagana zaroori hai taaki build fail na ho
  if (projectId && clientEmail && privateKey) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, '\n'),
      }),
    });
    console.log("Firebase Admin Initialized Successfully ✅");
  } else {
    // Ye message GitHub Actions ke logs mein dikhega
    console.warn("Firebase Admin Keys missing (Build Time). Skipping Init... ⚠️");
  }
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
    const statusUpdate = value?.statuses?.[0];
    if (statusUpdate) {
      const metaId = statusUpdate.id;
      const newStatus = statusUpdate.status;

      const q = query(collection(db, "chats"), where("metaId", "==", metaId));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const msgDoc = querySnapshot.docs[0];
        await updateDoc(doc(db, "chats", msgDoc.id), {
          status: newStatus 
        });
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

      await addDoc(collection(db, "chats"), {
        sender: message.from,
        name: contact?.profile?.name || "Unknown",
        text: content,
        timestamp: serverTimestamp(),
        type: "incoming",
        status: "read",
        metaId: message.id 
      });

      // FCM PUSH (Sirf tab chalega jab Firebase initialize hua ho)
      if (admin.apps.length > 0) {
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
          const deviceToken = subDoc.data().token;
          if (deviceToken) {
            admin.messaging().send({ ...payload, token: deviceToken })
              .catch(err => console.error("FCM Error:", err));
          }
        });
      }
    }

    return NextResponse.json({ status: "success" });
  } catch (error: any) {
    console.error("LOG: Webhook Error:", error.message);
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}
