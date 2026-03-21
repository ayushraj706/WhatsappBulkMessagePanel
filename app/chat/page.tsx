"use client";
import { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import { ChatBubble, ChatBubbleMessage, ChatBubbleAvatar, ChatBubbleTimestamp } from "@/components/ui/chat/chat-bubble";
import { ChatMessageList } from "@/components/ui/chat/chat-message-list";
import { Blocks, MessageSquarePlus, Mic, ChevronLeft, Send, X } from "lucide-react";
import { cn } from "@/lib/utils";

export default function PerfectChatPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
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
  const filteredMessages = messages.filter(m => (m.sender === selectedContact) || (m.type === "sent" && m.receiver === selectedContact));

  const handleSend = async (customText?: string) => {
    const text = customText || inputText;
    if (!text.trim() || !selectedContact) return;
    setInputText("");
    setShowQuickActions(false);
    setShowTemplates(false);
    try {
      await addDoc(collection(db, "chats"), { text, sender: "Me", receiver: selectedContact, type: "sent", timestamp: serverTimestamp() });
      await fetch("/api/whatsapp/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ to: selectedContact, message: text }) });
    } catch (err) { console.error(err); }
  };

  return (
    // 'max-w-full' aur 'overflow-x-hidden' right-side cutting rokne ke liye
    <div className="flex h-full w-full max-w-full bg-black text-white overflow-hidden overflow-x-hidden">
      
      {/* 1. Numbers List Sidebar */}
      <div className={cn("w-full md:w-80 border-r border-zinc-800 flex flex-col bg-black shrink-0", selectedContact ? "hidden md:flex" : "flex")}>
        <div className="p-4 border-b border-zinc-800 sticky top-0 bg-black z-10 shrink-0">
          <h1 className="text-xl font-bold">Messages</h1>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {contacts.map((num) => (
            <div key={num} onClick={() => setSelectedContact(num)} className="p-4 flex items-center gap-3 cursor-pointer border-b border-zinc-900 hover:bg-zinc-800 transition-colors">
              <ChatBubbleAvatar fallback={String(num).slice(-2)} className="h-10 w-10 border border-zinc-700" />
              <div className="min-w-0 text-left"><p className="font-semibold text-sm truncate">{num}</p><p className="text-[10px] text-green-500 font-medium">Online</p></div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Chat Window - NO CUTTING */}
      <div className={cn("flex-1 flex flex-col bg-[#050505] relative min-h-0 w-full max-w-full", !selectedContact ? "hidden md:flex" : "flex")}>
        {selectedContact ? (
          <>
            {/* STABLE SUB-HEADER */}
            <div className="h-14 border-b border-zinc-800 bg-black/80 backdrop-blur-md flex items-center gap-3 px-4 shrink-0 z-40 w-full">
              <button onClick={() => setSelectedContact(null)} className="p-1 -ml-1 md:hidden"><ChevronLeft className="w-6 h-6 text-zinc-400" /></button>
              <div className="flex flex-col text-left">
                <span className="font-bold text-sm tracking-tight">{selectedContact}</span>
                <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">WhatsApp Business</span>
              </div>
            </div>

            {/* MESSAGE AREA: padding-right added to prevent cutting */}
            <div className="flex-1 overflow-y-auto relative bg-black w-full">
              <ChatMessageList className="p-4 pr-6 space-y-6 min-h-full">
                {filteredMessages.map((msg) => (
                  <ChatBubble key={msg.id} variant={msg.type === "sent" ? "sent" : "received"}>
                    <ChatBubbleMessage className={cn(
                      "text-sm shadow-md",
                      msg.type === "sent" ? "bg-blue-600 text-white" : "bg-zinc-800 text-white"
                    )}>
                      {msg.text}
                      <ChatBubbleTimestamp timestamp="Just now" className="text-[9px] mt-1 opacity-50" />
                    </ChatBubbleMessage>
                  </ChatBubble>
                ))}
              </ChatMessageList>
            </div>

            {/* STABLE INPUT BAR: pl-0 for left shift, pr-6 to stop cutting */}
            <div className="py-4 pl-0 pr-6 bg-black border-t border-zinc-800 shrink-0 z-40 w-full">
              <div className="flex items-center gap-2 bg-zinc-900 rounded-full px-4 py-1.5 border border-zinc-800 shadow-2xl focus-within:border-zinc-700 transition-all ml-2">
                <button onClick={() => setShowQuickActions(!showQuickActions)} className="text-blue-500 hover:text-white p-1">
                  <Blocks className="w-5 h-5" />
                </button>
                <button onClick={() => setShowTemplates(!showTemplates)} className="text-green-500 hover:text-white p-1">
                  <MessageSquarePlus className="w-5 h-5" />
                </button>
                <input 
                  className="bg-transparent flex-1 outline-none text-sm p-1.5 text-white"
                  placeholder="Type message..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
                />
                <button className="text-zinc-500 p-2 bg-zinc-800 rounded-full hover:text-red-500 transition-colors">
                  <Mic className="w-5 h-5" />
                </button>
                <button onClick={() => handleSend()} className="text-blue-500 hover:scale-110 transition-transform flex-shrink-0">
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-600">
             <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mb-4 border border-zinc-800 shadow-xl"><span className="text-2xl">💬</span></div>
             <p className="text-sm font-medium tracking-widest uppercase opacity-50">Select a chat to start</p>
          </div>
        )}
      </div>
    </div>
  );
}
