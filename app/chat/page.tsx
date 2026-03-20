"use client";
import { useState, useEffect, useRef } from "react";
import { Plus, Blocks, MessageSquarePlus, Mic, Paperclip } from "lucide-react"; // Icons
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import { ChatBubble, ChatBubbleMessage } from "@/components/ui/chat/chat-bubble";
import { ChatMessageList } from "@/components/ui/chat/chat-message-list";
import { cn } from "@/lib/utils";

// 1. Customized Gradient Icon Component (Reference Picture Jaisa)
const ChatListHeaderIcon = () => (
  <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center p-0.5 border border-zinc-700 shadow-inner relative overflow-hidden flex-shrink-0">
    <div className="absolute inset-0 bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600 opacity-80" />
    <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px]" />
    <svg viewBox="0 0 100 100" className="w-6 h-6 md:w-8 md:h-8 relative z-10 text-white drop-shadow-md">
      <path fill="currentColor" d="M20,30 Q20,20 30,20 H70 Q80,20 80,30 V60 Q80,70 70,70 H40 L20,90 V70 Q20,70 20,60 Z"/>
    </svg>
  </div>
);

export default function MobileFirstAdvancedChat() {
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false); // Mobile sidebar control
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
    // RESPONSIVE MAIN CONTAINER (MOBILE FULL SCREEN)
    <div className="flex h-screen bg-black ml-0 md:ml-64 text-white overflow-hidden pb-[70px] md:pb-0">
      
      {/* 1. Sleek Compact Sidebar (Mobile Friendly) */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 bg-black border-r border-zinc-800 flex flex-col transition-transform duration-300 transform",
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full",
        "md:relative md:translate-x-0 md:w-64 md:flex-shrink-0"
      )}>
        <div className="p-4 border-b border-zinc-800 flex items-center gap-3">
          <ChatListHeaderIcon /> 
          <div>
            <h1 className="text-lg font-bold tracking-tight">Messages</h1>
            <p className="text-xs text-zinc-500">Live WhatsApp Chat</p>
          </div>
          {/* Close button for mobile sidebar */}
          <button onClick={() => setMobileMenuOpen(false)} className="md:hidden ml-auto text-zinc-500">X</button>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {contacts.map((num) => (
            <div 
              key={num} 
              onClick={() => { setSelectedContact(num); setMobileMenuOpen(false); }} // Auto close sidebar on mobile
              className={cn(
                "p-4 flex items-center gap-3 cursor-pointer transition-all border-b border-zinc-900",
                selectedContact === num ? "bg-zinc-800" : "hover:bg-zinc-900"
              )}
            >
              <div className="w-11 h-11 bg-zinc-700 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold border border-zinc-700">
                {num.toString().slice(-2)}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="font-semibold text-sm truncate">{num}</p>
                <p className="text-[11px] text-green-500 truncate font-medium">Online</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Chat Area */}
      <div className="flex-1 flex flex-col bg-black relative">
        {selectedContact ? (
          <>
            <div className="p-3 md:p-4 border-b border-zinc-800 bg-black/40 backdrop-blur-md flex items-center gap-3 z-40">
              {/* Hamburger Menu for Mobile */}
              <button onClick={() => setMobileMenuOpen(true)} className="md:hidden text-zinc-400">
                <Plus className="w-6 h-6 rotate-45" /> 
              </button>
              <span className="font-bold text-sm md:text-lg tracking-wide">{selectedContact}</span>
            </div>

            <div className="flex-1 overflow-y-auto p-3 md:p-6 space-y-3 custom-scrollbar" ref={scrollRef}>
              <ChatMessageList>
                {filteredMessages.map((msg) => (
                  <ChatBubble key={msg.id} variant={msg.type === "sent" ? "sent" : "received"}>
                    <ChatBubbleMessage 
                       className={msg.type === "sent" ? "bg-blue-600 text-white" : "bg-zinc-800 text-white"}
                       variant={msg.type === "sent" ? "sent" : "received"}
                    >
                      {msg.text}
                    </ChatBubbleMessage>
                  </ChatBubble>
                ))}
              </ChatMessageList>
            </div>

            {/* INTEGRATED PILL INPUT WITH MOBILE-FIRST ADVANCED ICONS */}
            <div className="fixed bottom-0 left-0 md:left-64 right-0 bg-zinc-950 border-t border-zinc-800 p-2 md:p-3 z-50">
              <div className="flex items-center gap-1.5 md:gap-2 bg-zinc-900 rounded-full px-2.5 py-1 md:px-4 md:py-2 border border-zinc-800 focus-within:border-zinc-700 transition-all shadow-inner">
                
                {/* Advanced Icons (Left Side) */}
                <button className="text-zinc-400 hover:text-white p-1 md:p-2 transition">
                  <Paperclip className="w-4 h-4 md:w-5 md:h-5" /> {/* Keep attachment icon */}
                </button>
                <button className="text-blue-500 hover:text-white p-1 md:p-2 transition">
                  <Blocks className="w-4 h-4 md:w-5 md:h-5" /> {/* Interview/Interactive Message Icon */}
                </button>
                <button className="text-green-500 hover:text-white p-1 md:p-2 transition">
                  <MessageSquarePlus className="w-4 h-4 md:w-5 md:h-5" /> {/* Template Icon */}
                </button>

                {/* Main Input Field (Responsive font) */}
                <input 
                  className="bg-transparent flex-1 outline-none text-xs md:text-sm p-1.5 md:p-2 text-white placeholder:text-zinc-600"
                  placeholder="Message..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
                />

                {/* Recording Button (Right Side) */}
                <button className="text-zinc-400 hover:text-red-500 p-1.5 md:p-2 transition flex items-center gap-1 bg-zinc-800 rounded-full">
                  <Mic className="w-5 h-5" /> {/* Make Button - Microphone */}
                  <span className="text-[10px] hidden md:inline">Hold</span>
                </button>

                {/* Main Send Button (Desktop/Laptop) */}
                <button 
                  onClick={handleSend}
                  className="hidden md:inline text-blue-500 font-bold text-sm px-3 hover:text-white transition-colors"
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
