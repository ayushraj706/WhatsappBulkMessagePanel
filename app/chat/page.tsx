"use client";

import { useState, useEffect, useRef } from "react"; // useRef joda scroll ke liye
import { db, auth } from "@/lib/firebase"; 
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import { ChatBubble, ChatBubbleMessage } from "@/components/ui/chat/chat-bubble";
import { ChatMessageList } from "@/components/ui/chat/chat-message-list";
import { ChatInput } from "@/components/ui/chat/chat-input";

export default function BaseKeyChat() {
  const [messages, setMessages] = useState<any[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null); // Scroll reference

  // 1. Live Messages Load Karna
  useEffect(() => {
    const q = query(collection(db, "chats"), orderBy("timestamp", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  // 2. Auto-scroll jab naya message aaye
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // 3. Message Bhejne ka Logic
  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    // Yahan hum pehle message ka sender number nikal rahe hain reply dene ke liye
    // Asali app mein yahan 'SelectedContact' ka number hona chahiye
    const lastIncomingMessage = [...messages].reverse().find(m => m.type === "incoming");
    const receiverNumber = lastIncomingMessage?.sender || "91XXXXXXXXXX"; 

    try {
      await addDoc(collection(db, "chats"), {
        text,
        sender: "Me",
        type: "sent",
        timestamp: serverTimestamp(),
      });

      await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: receiverNumber, // Ab ye dynamic hai!
          message: text,
        }),
      });
    } catch (err) {
      console.error("Error:", err);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-black ml-64 border-l border-gray-800">
      <div className="p-4 border-b border-gray-800 bg-gray-900/50 backdrop-blur-md">
        <h2 className="text-white font-bold text-lg">BaseKey Live Chat</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar" ref={scrollRef}>
        <ChatMessageList>
          {messages.map((msg) => (
            <ChatBubble key={msg.id} variant={msg.type === "sent" ? "sent" : "received"}>
              {/* Incoming message hai toh number dikhao */}
              {msg.type === "incoming" && (
                <span className="text-[10px] text-gray-500 ml-2">{msg.sender}</span>
              )}
              <ChatBubbleMessage variant={msg.type === "sent" ? "sent" : "received"}>
                {msg.text}
              </ChatBubbleMessage>
            </ChatBubble>
          ))}
        </ChatMessageList>
      </div>

      <div className="p-4 bg-gray-900/50">
        <ChatInput 
          placeholder="Message likhein aur Enter dabayein..." 
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend(e.currentTarget.value);
              e.currentTarget.value = "";
            }
          }}
        />
      </div>
    </div>
  );
}
