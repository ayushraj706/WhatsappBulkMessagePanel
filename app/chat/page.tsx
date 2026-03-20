"use client";
import { useState, useEffect, useRef } from "react";
import { Plus, Blocks, MessageSquarePlus, Mic, Paperclip, ChevronLeft } from "lucide-react"; 
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import { ChatBubble, ChatBubbleMessage, ChatBubbleAvatar, ChatBubbleTimestamp } from "@/components/ui/chat/chat-bubble";
import { ChatMessageList } from "@/components/ui/chat/chat-message-list";
import { cn } from "@/lib/utils";

// 1. Premium Gradient Icon
const ChatListHeaderIcon = () => (
  <div className="w-10 h-10 rounded-xl flex items-center justify-center p-0.5 border border-zinc-700 shadow-inner relative overflow-hidden flex-shrink-0">
    <div className="absolute inset-0 bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600 opacity-80" />
    <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px]" />
    <svg viewBox="0 0 100 100" className="w-6 h-6 relative z-10 text-white drop-shadow-md">
      <path fill="currentColor" d="M20,30 Q20,20 30,20 H70 Q80,20 80,30 V60 Q80,70 70,70 H40 L20,90 V70 Q20,70 20,60 Z"/>
    </svg>
  </div>
);

export default function MobileOptimizedChat() {
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query(collection(db, "chats"), orderBy("timestamp", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  const contacts = Array.from(new Set(messages.map(m => m.sender))).filter(s => s !== "Me");
  const filteredMessages = messages.filter(m => 
    (m.sender === selectedContact) || (m.type === "sent" && m.receiver === selectedContact)
  );

  const handleSend = async () => {
    if (!inputText.trim() || !selectedContact) return;
    const textToSend = inputText;
    setInputText("");
    try {
      await addDoc(collection(db, "chats"), {
        text: textToSend,
        sender: "Me",
        receiver: selectedContact,
        type: "sent",
        timestamp: serverTimestamp(),
      });
      await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: selectedContact, message: textToSend }),
      });
    } catch (err) { console.error(err); }
  };

  return (
    // ml-64 aur padding ka jhamela Layout se handle ho raha hai
    <div className="flex h-screen bg-black text-white w-full overflow-hidden">
      
      {/* 1. Contact Sidebar - Mobile par tabhi dikhega jab koi chat selected NA ho */}
      <div className={cn(
        "w-full md:w-80 border-r border-zinc-800 flex flex-col flex-shrink-0 bg-black transition-all",
        selectedContact ? "hidden md:flex" : "flex"
      )}>
        <div className="p-4 border-b border-zinc-800 flex items-center gap-3">
          <ChatListHeaderIcon /> 
          <div>
            <h1 className="text-lg font-bold tracking-tight">Messages</h1>
            <p className="text-[10px] text-zinc-500">BaseKey WhatsApp Panel</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {contacts.map((num) => (
            <div 
              key={num} 
              onClick={() => setSelectedContact(num)}
              className={cn(
                "p-4 flex items-center gap-3 cursor-pointer transition-all border-b border-zinc-900",
                selectedContact === num ? "bg-zinc-800" : "hover:bg-zinc-900"
              )}
            >
              <ChatBubbleAvatar fallback={num.toString().slice(-2)} className="h-10 w-10 border border-zinc-700" />
              <div className="flex-1 min-w-0 text-left">
                <p className="font-semibold text-sm truncate">{num}</p>
                <p className="text-[10px] text-green-500 truncate font-medium">Online</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Chat Area - Mobile par tabhi dikhega jab contact selected ho */}
      <div className={cn(
        "flex-1 flex flex-col bg-[#050505] transition-all",
        !selectedContact ? "hidden md:flex" : "flex"
      )}>
        {selectedContact ? (
          <>
            <div className="p-4 border-b border-zinc-800 bg-black/60 backdrop-blur-md flex items-center gap-3">
              {/* Back button for mobile */}
              <button onClick={() => setSelectedContact(null)} className="md:hidden text-zinc-400">
                <ChevronLeft className="w-6 h-6" />
              </button>
              <span className="font-bold text-sm tracking-wide">{selectedContact}</span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar" ref={scrollRef}>
              <ChatMessageList>
                {filteredMessages.map((msg) => (
                  <ChatBubble key={msg.id} variant={msg.type === "sent" ? "sent" : "received"}>
                    <ChatBubbleAvatar fallback={msg.type === "sent" ? "Me" : msg.sender.slice(-2)} className="h-8 w-8" />
                    <ChatBubbleMessage 
                       className={msg.type === "sent" ? "bg-blue-600 text-white" : "bg-zinc-800 text-white"}
                       variant={msg.type === "sent" ? "sent" : "received"}
                    >
                      {msg.text}
                      <ChatBubbleTimestamp timestamp={msg.timestamp ? "Just now" : "..."} />
                    </ChatBubbleMessage>
                  </ChatBubble>
                ))}
              </ChatMessageList>
            </div>

            {/* ADVANCED INPUT PILL */}
            <div className="p-3 md:p-4 border-t border-zinc-800 bg-black">
              <div className="flex items-center gap-2 bg-zinc-900 rounded-full px-4 py-1.5 border border-zinc-800 focus-within:border-zinc-700 transition-all">
                
                {/* Left Side Icons */}
                <button className="text-zinc-500 hover:text-white transition p-1">
                  <Paperclip className="w-5 h-5" />
                </button>
                <button className="text-blue-500 hover:text-white transition p-1" title="Interview Message">
                  <Blocks className="w-5 h-5" /> 
                </button>
                <button className="text-green-500 hover:text-white transition p-1" title="Send Template">
                  <MessageSquarePlus className="w-5 h-5" /> 
                </button>

                <input 
                  className="bg-transparent flex-1 outline-none text-sm p-2 text-white placeholder:text-zinc-600"
                  placeholder="Type message..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
                />

                {/* Right Side Icons */}
                <button className="text-zinc-500 hover:text-red-500 transition p-2 bg-zinc-800 rounded-full" title="Make Recording">
                  <Mic className="w-5 h-5" /> 
                </button>
                <button onClick={handleSend} className="text-blue-500 font-bold text-sm px-2 hidden md:block">Send</button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-600">
             <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mb-5 border border-zinc-800 shadow-2xl">
                 <span className="text-3xl">💬</span>
             </div>
             <p className="text-sm font-medium tracking-tight">Select a contact to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
}
