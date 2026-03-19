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

  // Auto-scroll logic
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
      
      // WhatsApp API call (Backend logic)
      await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: selectedContact, message: text }),
      });
    } catch (err) { console.error(err); }
  };

  return (
    <div className="flex h-screen bg-black ml-64 text-white overflow-hidden">
      
      {/* 1. Compact Contact Sidebar */}
      <div className="w-64 border-r border-gray-800 flex flex-col bg-black">
        <div className="p-4 border-b border-gray-800">
          <h1 className="text-lg font-bold tracking-tight">Messages</h1>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {contacts.map((num) => (
            <div 
              key={num} 
              onClick={() => setSelectedContact(num)}
              className={cn(
                "p-3 flex items-center gap-3 cursor-pointer transition-all duration-200 border-b border-gray-900/30",
                selectedContact === num ? "bg-gray-800" : "hover:bg-gray-900"
              )}
            >
              <div className="w-10 h-10 bg-gradient-to-tr from-gray-700 to-gray-600 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold border border-gray-700">
                {num.toString().slice(-2)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{num}</p>
                <p className="text-[10px] text-gray-500 truncate">Tap to reply</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Chat Area */}
      <div className="flex-1 flex flex-col bg-[#050505]">
        {selectedContact ? (
          <>
            {/* Chat Header */}
            <div className="p-3 border-b border-gray-800 bg-black/60 backdrop-blur-md flex items-center gap-3">
               <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center text-[10px]">
                {selectedContact.toString().slice(-2)}
              </div>
              <span className="font-bold text-sm tracking-wide">{selectedContact}</span>
            </div>

            {/* Message List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2" ref={scrollRef}>
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

            {/* Instagram-Style Pill Input */}
            <div className="p-4 border-t border-gray-800 bg-black">
              <div className="flex items-center bg-gray-900 rounded-full px-4 py-1.5 border border-gray-800 focus-within:border-gray-600 transition-all">
                <input 
                  className="bg-transparent flex-1 outline-none text-sm p-2 text-white placeholder-gray-500"
                  placeholder="Message..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend(e.currentTarget.value);
                      e.currentTarget.value = "";
                    }
                  }}
                />
                <button 
                  onClick={(e) => {
                    const input = e.currentTarget.previousSibling as HTMLInputElement;
                    handleSend(input.value);
                    input.value = "";
                  }}
                  className="text-blue-500 font-bold text-sm px-2 hover:text-white transition-colors"
                >
                  Send
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-800">
                 <span className="text-3xl">✉️</span>
              </div>
              <p className="text-gray-500 text-sm font-medium">Select a contact to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
