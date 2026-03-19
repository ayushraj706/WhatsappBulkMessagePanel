"use client";
import { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import { ChatBubble, ChatBubbleMessage } from "@/components/ui/chat/chat-bubble";
import { ChatMessageList } from "@/components/ui/chat/chat-message-list";
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

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, selectedContact]);

  const contacts = Array.from(new Set(messages.map(m => m.sender))).filter(s => s !== "Me");

  const filteredMessages = messages.filter(m => 
    (m.sender === selectedContact) || (m.type === "sent" && m.receiver === selectedContact)
  );

  const handleSend = async (text: string) => {
    if (!text.trim() || !selectedContact) return;
    try {
      await addDoc(collection(db, "chats"), {
        text,
        sender: "Me",
        receiver: selectedContact,
        type: "sent",
        timestamp: serverTimestamp(),
      });
      
      await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: selectedContact, message: text }),
      });
    } catch (err) { console.error(err); }
  };

  return (
    // ml-64 tabhi rakhna agar tumhara main Sidebar (WaBulk) 'fixed' hai
    <div className="flex h-screen bg-black ml-64 text-white">
      
      {/* 1. Contact Sidebar (Left Side) */}
      <div className="w-72 border-r border-gray-800 flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-gray-800">
          <h1 className="text-lg font-bold">Messages</h1>
        </div>
        <div className="flex-1 overflow-y-auto">
          {contacts.map((num) => (
            <div 
              key={num} 
              onClick={() => setSelectedContact(num)}
              className={cn(
                "p-4 flex items-center gap-3 cursor-pointer transition-all border-b border-gray-900/50",
                selectedContact === num ? "bg-gray-800" : "hover:bg-gray-900"
              )}
            >
              <div className="w-10 h-10 bg-gray-700 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold">
                {num.toString().slice(-2)}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate">{num}</p>
                <p className="text-[10px] text-gray-400 truncate text-green-500">Online</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Chat Area (Occupies all remaining space on the RIGHT) */}
      <div className="flex-1 flex flex-col bg-[#050505]">
        {selectedContact ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-gray-800 flex items-center gap-3 bg-black/40 backdrop-blur-md">
              <span className="font-bold">{selectedContact}</span>
            </div>

            {/* Messages */}
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

            {/* Input - Sticky at Bottom */}
            <div className="p-4 border-t border-gray-800 bg-black">
              <div className="flex items-center bg-gray-900 rounded-full px-4 py-2 border border-gray-800 focus-within:border-gray-600 transition-all">
                <input 
                  className="bg-transparent flex-1 outline-none text-sm p-1 text-white"
                  placeholder="Message..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSend(e.currentTarget.value);
                      e.currentTarget.value = "";
                    }
                  }}
                />
                <button className="text-blue-500 font-bold text-sm px-2">Send</button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
             <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center mb-4 border border-gray-800">
                <span className="text-2xl">💬</span>
             </div>
             <p className="text-sm">Select a chat to read messages</p>
          </div>
        )}
      </div>
    </div>
  );
}
