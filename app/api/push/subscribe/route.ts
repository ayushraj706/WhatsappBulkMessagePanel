import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, query, where } from "firebase/firestore";

export async function POST(req: Request) {
  try {
    const sub = await req.json();

    // 1. Data Check: Agar endpoint nahi hai toh error de do
    if (!sub || !sub.endpoint) {
      return NextResponse.json({ error: "Invalid subscription object" }, { status: 400 });
    }

    // 2. Duplicate Check: Kya ye address pehle se hai?
    const q = query(collection(db, "subscriptions"), where("endpoint", "==", sub.endpoint));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      // 3. Ekdum saaf format mein save karo (Strict Mapping)
      await addDoc(collection(db, "subscriptions"), {
        endpoint: sub.endpoint,
        keys: {
          auth: sub.keys?.auth || "",
          p256dh: sub.keys?.p256dh || ""
        },
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Subscription Save Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
