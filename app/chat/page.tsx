"use client";
import { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import { ChatBubble, ChatBubbleMessage } from "@/components/ui/chat/chat-bubble";
import { ChatMessageList } from "@/components/ui/chat/chat-message-list";
import { cn } from "@/lib/utils";

// 1. Customized Gradient Icon Component (Target screenshot ke liye)
const ChatListHeaderIcon = () => (
  <div className="w-12 h-12 rounded-xl flex items-center justify-center p-0.5 border border-zinc-700 shadow-inner relative overflow-hidden flex-shrink-0">
    {/* Complex Gradient Pattern Background */}
    <div className="absolute inset-0 bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600 opacity-80" />
    <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px]" />
    {/* Inner stylized Chat SVG */}
    <svg viewBox="0 0 100 100" className="w-8 h-8 relative z-10 text-white drop-shadow-md">
      <path fill="currentColor" d="M20,30 Q20,20 30,20 H70 Q80,20 80,30 V60 Q80,70 70,70 H40 L20,90 V70 Q20,70 20,60 Z"/>
    </svg>
  </div>
);

export default function InstagramStyleChat() {
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

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, selectedContact]);

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
    // ml-64 HATA DIYA HAI - Ab koi gap nahi aayega Layout fix hone ke baad!
    <div className="flex h-screen bg-black text-white w-full overflow-hidden">
      
      {/* 1. Sleek Compact Sidebar (Target Style) */}
      <div className="w-72 border-r border-zinc-800 flex flex-col flex-shrink-0 bg-black">
        <div className="p-4 border-b border-zinc-800 flex items-center gap-3">
          <ChatListHeaderIcon /> {/* Custom gradient icon component lagaya hai */}
          <div>
            <h1 className="text-lg font-bold tracking-tight">Messages</h1>
            <p className="text-xs text-zinc-500">Live WhatsApp Chat</p>
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
              {/* Refined Initial Avatar (Number slice karke) */}
              <div className="w-11 h-11 bg-zinc-700 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold border border-zinc-700">
                {num.toString().slice(-2)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{num}</p>
                <p className="text-[11px] text-green-500 truncate font-medium">Online</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Chat Area */}
      <div className="flex-1 flex flex-col bg-black">
        {selectedContact ? (
          <>
            <div className="p-4 border-b border-zinc-800 flex items-center gap-3 bg-black/40 backdrop-blur-md">
              <span className="font-bold text-sm tracking-wide">{selectedContact}</span>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar" ref={scrollRef}>
              <ChatMessageList>
                {filteredMessages.map((msg) => (
                  <ChatBubble key={msg.id} variant={msg.type === "sent" ? "sent" : "received"}>
                    <ChatBubbleMessage 
                       // FORCE BLUE & ZINC (Target style)
                       className={msg.type === "sent" ? "bg-blue-600 text-white" : "bg-zinc-800 text-white"}
                       variant={msg.type === "sent" ? "sent" : "received"}
                    >
                      {msg.text}
                    </ChatBubbleMessage>
                  </ChatBubble>
                ))}
              </ChatMessageList>
            </div>

            {/* SLEEK PILL-SHAPED INPUT BOX (Target style) */}
            <div className="p-4 border-t border-zinc-800 bg-black">
              <div className="flex items-center bg-zinc-900 rounded-full px-5 py-2.5 border border-zinc-800 focus-within:border-zinc-600 transition-all shadow-inner">
                <input 
                  className="bg-transparent flex-1 outline-none text-sm p-1 text-white placeholder:text-zinc-600"
                  placeholder="Message..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
                />
                <button 
                  onClick={handleSend}
                  className="text-blue-500 font-bold text-sm px-3 hover:text-white transition-colors"
                >
                  Send
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-600">
             <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mb-5 border border-zinc-800">
                 <span className="text-3xl">✉️</span>
             </div>
             <p className="text-sm font-medium">Select a chat to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
}
