"use client";
import { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import { ChatBubble, ChatBubbleMessage, ChatBubbleAvatar } from "@/components/ui/chat/chat-bubble";
import { ChatMessageList } from "@/components/ui/chat/chat-message-list";
import { ChatInput } from "@/components/ui/chat/chat-input";
import { cn } from "@/lib/utils";

export default function InstagramChat() {
  const [messages, setMessages] = useState<any[]>([]);
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query(collection(db, "chats"), orderBy("timestamp", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  // Unique Contacts nikalne ke liye
  const contacts = Array.from(new Set(messages.map(m => m.sender))).filter(s => s !== "Me");

  const filteredMessages = messages.filter(m => m.sender === selectedContact || (m.type === "sent" && selectedContact));

  const handleSend = async (text: string) => {
    if (!text.trim() || !selectedContact) return;
    try {
      await addDoc(collection(db, "chats"), {
        text,
        sender: "Me",
        receiver: selectedContact, // Isse pata chalega reply kise bhej rahe ho
        type: "sent",
        timestamp: serverTimestamp(),
      });
      // Meta API call yahan aayegi
    } catch (err) { console.error(err); }
  };

  return (
    <div className="flex h-screen bg-black ml-64 text-white overflow-hidden">
      
      {/* 1. Contact Sidebar (Instagram Style) */}
      <div className="w-80 border-r border-gray-800 flex flex-col">
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-xl font-bold">Messages</h1>
        </div>
        <div className="flex-1 overflow-y-auto">
          {contacts.map((num) => (
            <div 
              key={num} 
              onClick={() => setSelectedContact(num)}
              className={cn(
                "p-4 flex items-center gap-3 cursor-pointer hover:bg-gray-900 transition",
                selectedContact === num && "bg-gray-800"
              )}
            >
              <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center font-bold">
                {num.slice(-2)}
              </div>
              <div>
                <p className="font-medium">{num}</p>
                <p className="text-xs text-gray-500">Click to chat</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedContact ? (
          <>
            <div className="p-4 border-b border-gray-800 bg-black/50 backdrop-blur-md sticky top-0 z-10">
              <span className="font-bold text-lg">{selectedContact}</span>
            </div>

            <div className="flex-1 overflow-y-auto p-4" ref={scrollRef}>
              <ChatMessageList>
                {filteredMessages.map((msg) => (
                  <ChatBubble key={msg.id} variant={msg.type === "sent" ? "sent" : "received"}>
                    <ChatBubbleMessage variant={msg.type === "sent" ? "sent" : "received"}>
                      {msg.text}
                    </ChatBubbleMessage>
                  </ChatBubble>
                ))}
              </ChatMessageList>
            </div>

            {/* Mast Instagram-Style Input */}
            <div className="p-4 border-t border-gray-800">
              <div className="flex items-center bg-gray-900 rounded-full px-4 py-2 border border-gray-700 focus-within:border-gray-500 transition">
                <input 
                  className="bg-transparent flex-1 outline-none text-sm p-2"
                  placeholder="Message..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSend(e.currentTarget.value);
                      e.currentTarget.value = "";
                    }
                  }}
                />
                <button className="text-blue-500 font-bold px-2 hover:text-white transition">Send</button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-center items-center justify-center text-gray-500">
            Select a contact to start chatting
          </div>
        )}
      </div>
    </div>
  );
}
