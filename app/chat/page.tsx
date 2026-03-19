"use client";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";

export default function ChatPage() {
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    // Firestore se real-time messages uthana
    const q = query(collection(db, "chats"), orderBy("timestamp", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(msgList);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white p-4">
      <h1 className="text-xl font-bold mb-4 border-b border-gray-700 pb-2">BaseKey Live Chat</h1>
      <div className="flex-1 overflow-y-auto space-y-3">
        {messages.map((msg) => (
          <div key={msg.id} className={`p-3 rounded-lg max-w-[70%] ${msg.type === 'incoming' ? 'bg-gray-700 self-start' : 'bg-green-700 self-end ml-auto'}`}>
            <p className="text-xs text-gray-400">{msg.sender}</p>
            <p>{msg.text}</p>
          </div>
        ))}
      </div>
      {/* Niche ek input box bana lena reply bhejane ke liye */}
    </div>
  );
}
