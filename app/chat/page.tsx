"use client";

import { useState, useEffect } from "react";
import { db, auth } from "@/lib/firebase"; // Tumhari hardcoded file
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import { ChatBubble, ChatBubbleMessage } from "@/components/ui/chat/chat-bubble";
import { ChatMessageList } from "@/components/ui/chat/chat-message-list";
import { ChatInput } from "@/components/ui/chat/chat-input";

export default function BaseKeyChat() {
  const [messages, setMessages] = useState<any[]>([]);

  // 1. Live Messages Load Karna (Firestore se)
  useEffect(() => {
    const q = query(collection(db, "chats"), orderBy("timestamp", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  // 2. Message Bhejne ka Logic
  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    try {
      // Firebase mein save karo taaki UI par turant dikhe
      await addDoc(collection(db, "chats"), {
        text,
        sender: "Me",
        type: "sent",
        timestamp: serverTimestamp(),
      });

      // Meta API ko call karo (Jo iamd2epak ki repo mein pehle se bani hai)
      await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: "RECEIVER_NUMBER", // Yahan test ke liye apna number dalo
          message: text,
        }),
      });
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-black ml-64 border-l border-gray-800">
      {/* Header */}
      <div className="p-4 border-b border-gray-800 bg-gray-900/50 backdrop-blur-md">
        <h2 className="text-white font-bold">BaseKey Live Chat</h2>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4">
        <ChatMessageList>
          {messages.map((msg) => (
            <ChatBubble key={msg.id} variant={msg.type === "sent" ? "sent" : "received"}>
              <ChatBubbleMessage variant={msg.type === "sent" ? "sent" : "received"}>
                {msg.text}
              </ChatBubbleMessage>
            </ChatBubble>
          ))}
        </ChatMessageList>
      </div>

      {/* Input Box */}
      <div className="p-4 bg-gray-900/50">
        <ChatInput 
          placeholder="Apna sandesh likhein..." 
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSend(e.currentTarget.value);
              e.currentTarget.value = "";
            }
          }}
        />
      </div>
    </div>
  );
}
