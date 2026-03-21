"use client";
import { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import { ChatBubble, ChatBubbleMessage, ChatBubbleAvatar, ChatBubbleTimestamp } from "@/components/ui/chat/chat-bubble";
import { ChatMessageList } from "@/components/ui/chat/chat-message-list";
import { Blocks, MessageSquarePlus, Mic, ChevronLeft, Send, X, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdvancedBaseKeyChat() {
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

  const handleSend = async (customMessage?: string) => {
    const text = customMessage || inputText;
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
      
      {/* 1. Numbers List (Contacts) */}
      <div className={cn(
        "w-full md:w-80 border-r border-zinc-800 flex flex-col flex-shrink-0 bg-black",
        selectedContact ? "hidden md:flex" : "flex"
      )}>
        <div className="p-4 border-b border-zinc-800 bg-black sticky top-0 z-10">
          <h1 className="text-xl font-bold tracking-tight">Messages</h1>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {contacts.map((num) => (
            <div key={num} onClick={() => setSelectedContact(num)} className="p-4 flex items-center gap-3 cursor-pointer border-b border-zinc-900 hover:bg-zinc-800 transition-all">
              <ChatBubbleAvatar fallback={String(num).slice(-2)} className="h-12 w-12 border border-zinc-700" />
              <div className="flex-1 min-w-0 text-left">
                <p className="font-semibold text-sm truncate">{num}</p>
                <p className="text-[10px] text-green-500 font-medium italic">Online</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Main Chat Window */}
      <div className={cn("flex-1 flex flex-col bg-[#050505] relative", !selectedContact ? "hidden md:flex" : "flex")}>
        {selectedContact ? (
          <>
            {/* FIXED HEADER */}
            <div className="h-14 md:h-16 border-b border-zinc-800 bg-black/80 backdrop-blur-md flex items-center gap-3 px-4 shrink-0 z-50">
              <button onClick={() => setSelectedContact(null)} className="md:hidden p-1 hover:bg-zinc-800 rounded-full transition-colors">
                <ChevronLeft className="w-6 h-6 text-zinc-400" />
              </button>
              <div className="flex flex-col text-left">
                <span className="font-bold text-sm md:text-base">{selectedContact}</span>
                <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold">WhatsApp Business</span>
              </div>
            </div>

            {/* SCROLLABLE MESSAGE AREA */}
            <div className="flex-1 overflow-y-auto relative bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat bg-center bg-fixed opacity-[0.03] absolute inset-0 pointer-events-none" />
            <div className="flex-1 overflow-y-auto z-10">
              <ChatMessageList className="p-4 space-y-6">
                {filteredMessages.map((msg) => (
                  <ChatBubble key={msg.id} variant={msg.type === "sent" ? "sent" : "received"}>
                    <ChatBubbleMessage className={cn("text-sm shadow-md", msg.type === "sent" ? "bg-blue-600 text-white" : "bg-zinc-800 text-white")}>
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
                  <h3 className="text-xs font-bold text-zinc-500 uppercase">Interactive Buttons</h3>
                  <button onClick={() => setShowQuickActions(false)}><X className="w-4 h-4" /></button>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {["Yes, I'm interested", "Tell me more", "Not now, thanks"].map((btnText) => (
                    <button key={btnText} onClick={() => handleSend(btnText)} className="text-left p-3 rounded-xl bg-zinc-800 hover:bg-blue-600 transition-colors text-sm font-medium">
                      {btnText}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* TEMPLATES POPUP */}
            {showTemplates && (
              <div className="absolute bottom-24 left-4 right-4 md:left-8 bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-2xl z-[60] animate-in slide-in-from-bottom-4 duration-200">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-xs font-bold text-green-500 uppercase">WhatsApp Templates</h3>
                  <button onClick={() => setShowTemplates(false)}><X className="w-4 h-4" /></button>
                </div>
                <div className="space-y-2">
                  <button onClick={() => handleSend("Hello! How can we help you today?") } className="w-full text-left p-3 rounded-xl bg-zinc-800 hover:bg-green-600 transition-colors text-xs flex items-center justify-between">
                    Welcome Message <CheckCircle2 className="w-3 h-3" />
                  </button>
                  <button onClick={() => handleSend("Your order has been confirmed!")} className="w-full text-left p-3 rounded-xl bg-zinc-800 hover:bg-green-600 transition-colors text-xs flex items-center justify-between">
                    Order Confirmation <CheckCircle2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}

            {/* FIXED INPUT BAR */}
            <div className="p-3 md:p-4 bg-black border-t border-zinc-800 shrink-0 z-50">
              <div className="flex items-center gap-1 md:gap-2 bg-zinc-900 rounded-full px-3 py-1 md:px-4 md:py-1.5 border border-zinc-800 focus-within:border-zinc-700 transition-all shadow-inner">
                {/* BLUE BLOCKS: Interview/Quick Actions */}
                <button onClick={() => { setShowQuickActions(!showQuickActions); setShowTemplates(false); }} className={cn("p-1.5 rounded-full transition-colors", showQuickActions ? "bg-blue-600 text-white" : "text-blue-500 hover:bg-zinc-800")}>
                  <Blocks className="w-5 h-5" />
                </button>
                {/* GREEN MESSAGE: Templates */}
                <button onClick={() => { setShowTemplates(!showTemplates); setShowQuickActions(false); }} className={cn("p-1.5 rounded-full transition-colors", showTemplates ? "bg-green-600 text-white" : "text-green-500 hover:bg-zinc-800")}>
                  <MessageSquarePlus className="w-5 h-5" />
                </button>
                
                <input 
                  className="bg-transparent flex-1 outline-none text-sm p-2 text-white placeholder:text-zinc-600"
                  placeholder="Type a message..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
                />
                
                {/* MIC: Recording */}
                <button className="text-zinc-500 hover:text-red-500 p-2 bg-zinc-800 rounded-full transition-colors">
                  <Mic className="w-5 h-5" />
                </button>
                <button onClick={() => handleSend()} className="text-blue-500 hover:scale-110 transition-transform p-1">
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-600 opacity-50">
            <div className="w-16 h-16 bg-zinc-900 rounded-3xl flex items-center justify-center mb-4 border border-zinc-800 shadow-2xl">
               <span className="text-2xl">💬</span>
            </div>
            <p className="text-sm font-bold uppercase tracking-widest">Select a conversation</p>
          </div>
        )}
      </div>
    </div>
  );
}
