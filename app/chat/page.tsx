"use client";
import { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import { ChatBubble, ChatBubbleMessage, ChatBubbleAvatar, ChatBubbleTimestamp } from "@/components/ui/chat/chat-bubble";
import { ChatMessageList } from "@/components/ui/chat/chat-message-list";
import { Blocks, MessageSquarePlus, Mic, ChevronLeft, Send, X, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdvancedPerfectChat() {
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  
  // Interactive Popups State
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  
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

  const handleSend = async (customText?: string) => {
    const text = customText || inputText;
    if (!text.trim() || !selectedContact) return;
    
    setInputText("");
    setShowQuickActions(false);
    setShowTemplates(false);

    try {
      await addDoc(collection(db, "chats"), {
        text, sender: "Me", receiver: selectedContact, type: "sent", timestamp: serverTimestamp(),
      });
      await fetch("/api/whatsapp/send", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: selectedContact, message: text }),
      });
    } catch (err) { console.error(err); }
  };

  return (
    <div className="flex h-full bg-black text-white w-full overflow-hidden">
      
      {/* 1. Numbers List View (Contacts) */}
      <div className={cn(
        "w-full md:w-80 border-r border-zinc-800 flex flex-col flex-shrink-0 bg-black",
        selectedContact ? "hidden md:flex" : "flex"
      )}>
        <div className="p-4 border-b border-zinc-800 bg-black sticky top-0 z-10 shrink-0">
          <h1 className="text-xl font-bold tracking-tight text-left">Messages</h1>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {contacts.map((num) => (
            <div key={num} onClick={() => setSelectedContact(num)} className="p-4 flex items-center gap-3 cursor-pointer border-b border-zinc-900 hover:bg-zinc-800 transition-all">
              <ChatBubbleAvatar fallback={String(num).slice(-2)} className="h-12 w-12 border border-zinc-700" />
              <div className="flex-1 min-w-0 text-left">
                <p className="font-semibold text-sm truncate">{num}</p>
                <p className="text-[10px] text-green-500 font-medium">Online</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Chat Window - FIXED STABILITY */}
      <div className={cn("flex-1 flex flex-col bg-[#050505] relative h-full", !selectedContact ? "hidden md:flex" : "flex")}>
        {selectedContact ? (
          <>
            {/* FIXED HEADER: BaseKey Panel ke niche hamesha dikhega */}
            <div className="h-14 border-b border-zinc-800 bg-black/80 backdrop-blur-md flex items-center gap-3 px-4 shrink-0 z-50">
              <button onClick={() => setSelectedContact(null)} className="p-1 -ml-1 md:hidden">
                <ChevronLeft className="w-6 h-6 text-zinc-400" />
              </button>
              <div className="flex flex-col text-left">
                <span className="font-bold text-sm tracking-tight">{selectedContact}</span>
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">WhatsApp Business</span>
              </div>
            </div>

            {/* MESSAGE AREA: flex-1 ensures middle gap fix */}
            <div className="flex-1 overflow-y-auto relative z-10">
              <ChatMessageList className="p-4 pb-8 space-y-6 min-h-full">
                {filteredMessages.map((msg) => (
                  <ChatBubble key={msg.id} variant={msg.type === "sent" ? "sent" : "received"}>
                    <ChatBubbleMessage className={cn("text-sm shadow-md", msg.type === "sent" ? "bg-blue-600" : "bg-zinc-800")}>
                      {msg.text}
                      <ChatBubbleTimestamp timestamp="Just now" className="text-[9px] mt-1 opacity-60" />
                    </ChatBubbleMessage>
                  </ChatBubble>
                ))}
              </ChatMessageList>
            </div>

            {/* QUICK ACTIONS POPUP */}
            {showQuickActions && (
              <div className="absolute bottom-24 left-4 right-4 md:left-auto md:right-8 bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-2xl z-[60] animate-in slide-in-from-bottom-4 duration-200">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-[10px] font-bold text-zinc-500 uppercase">Interview Buttons</h3>
                  <button onClick={() => setShowQuickActions(false)}><X className="w-4 h-4" /></button>
                </div>
                <div className="flex flex-col gap-2">
                  {["I am interested", "Tell me more", "Not now"].map((btn) => (
                    <button key={btn} onClick={() => handleSend(btn)} className="text-left p-3 rounded-xl bg-zinc-800 hover:bg-blue-600 transition-colors text-sm font-medium">
                      {btn}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* TEMPLATE POPUP */}
            {showTemplates && (
              <div className="absolute bottom-24 left-4 right-4 md:left-8 bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-2xl z-[60] animate-in slide-in-from-bottom-4 duration-200">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-[10px] font-bold text-green-500 uppercase">Saved Templates</h3>
                  <button onClick={() => setShowTemplates(false)}><X className="w-4 h-4" /></button>
                </div>
                <div className="space-y-2">
                  <button onClick={() => handleSend("Welcome to BaseKey! How can we help you?")} className="w-full text-left p-3 rounded-xl bg-zinc-800 hover:bg-green-600 transition-colors text-xs flex items-center justify-between">
                    Welcome Message <CheckCircle2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}

            {/* STABLE INPUT BAR: Shifted left and fixed */}
            <div className="py-4 pl-2 pr-4 bg-black border-t border-zinc-800 shrink-0 z-50">
              <div className="flex items-center gap-1.5 bg-zinc-900 rounded-full px-4 py-1.5 border border-zinc-800 focus-within:border-zinc-700 transition-all shadow-xl">
                {/* BLUE BLOCKS: Interview Icons */}
                <button onClick={() => { setShowQuickActions(!showQuickActions); setShowTemplates(false); }} className={cn("p-1.5 rounded-full transition-colors", showQuickActions ? "bg-blue-600 text-white" : "text-blue-500 hover:bg-zinc-800")}>
                  <Blocks className="w-5 h-5" />
                </button>
                {/* GREEN MESSAGE: Templates */}
                <button onClick={() => { setShowTemplates(!showTemplates); setShowQuickActions(false); }} className={cn("p-1.5 rounded-full transition-colors", showTemplates ? "bg-green-600 text-white" : "text-green-500 hover:bg-zinc-800")}>
                  <MessageSquarePlus className="w-5 h-5" />
                </button>
                
                <input 
                  className="bg-transparent flex-1 outline-none text-sm p-1.5 text-white"
                  placeholder="Type a message..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
                />
                
                <button className="text-zinc-500 hover:text-red-500 p-2 bg-zinc-800 rounded-full transition-colors"><Mic className="w-5 h-5" /></button>
                <button onClick={() => handleSend()} className="text-blue-500 hover:scale-110 transition-transform p-1"><Send className="w-5 h-5" /></button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-600">
            <div className="w-16 h-16 bg-zinc-900 rounded-3xl flex items-center justify-center mb-4 border border-zinc-800 shadow-xl">
               <span className="text-2xl">💬</span>
            </div>
            <p className="text-sm font-bold uppercase tracking-widest opacity-50">Select a chat to start</p>
          </div>
        )}
      </div>
    </div>
  );
}
