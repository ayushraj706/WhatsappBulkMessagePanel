import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, query, where } from "firebase/firestore";

export async function POST(req: Request) {
    const sub = await req.json();
    
    // Address ko save karo taaki webhook ise use kar sake
    const q = query(collection(db, "subscriptions"), where("endpoint", "==", sub.endpoint));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
        await addDoc(collection(db, "subscriptions"), {
            ...sub,
            timestamp: new Date()
        });
    }
    return NextResponse.json({ success: true });
}
