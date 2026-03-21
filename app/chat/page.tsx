"use client";
import { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import { ChatBubble, ChatBubbleMessage, ChatBubbleAvatar, ChatBubbleTimestamp } from "@/components/ui/chat/chat-bubble";
import { ChatMessageList } from "@/components/ui/chat/chat-message-list";
import { 
  Camera, ImageIcon, Paperclip, 
  Mic, Send, ChevronLeft, ChevronRight 
} from "lucide-react"; 
import { ChatInput } from "@/components/ui/chat/chat-input";
import { cn } from "@/lib/utils";

// CUSTOM MESSENGER ICONS (Bhai, ye ekdum example photo jaise hain)
const MessengerSmile = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
    <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm3.5 7a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm-7 0a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm7 8.5c-1.352 1.258-3.111 2-5 2s-3.648-.742-5-2a.5.5 0 01.687-.725C7.23 17.65 9.505 18.5 12 18.5s4.77-.85 5.813-1.725a.5.5 0 01.687.725z" />
  </svg>
);

const MessengerHeart = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
  </svg>
);

export default function DeepDarkMessengerChat() {
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [isManualCollapsed, setIsManualCollapsed] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const q = query(collection(db, "chats"), orderBy("timestamp", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  const filteredMessages = messages.filter(m => (m.sender === selectedContact) || (m.type === "sent" && m.receiver === selectedContact));

  const handleSend = async (customText?: string) => {
    const textToSend = customText || inputText;
    if (!textToSend.trim() || !selectedContact) return;
    setInputText("");
    setIsManualCollapsed(false);
    try {
      await addDoc(collection(db, "chats"), {
        text: textToSend, sender: "Me", receiver: selectedContact, type: "sent", timestamp: serverTimestamp(),
      });
      await fetch("/api/whatsapp/send", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: selectedContact, message: textToSend }),
      });
    } catch (err) { console.error(err); }
  };

  const shouldHideIcons = inputText.length > 0 || isManualCollapsed;

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault(); 
    setIsManualCollapsed(!isManualCollapsed);
    if (inputRef.current) inputRef.current.focus(); 
  };

  return (
    <div className="flex h-full w-full max-w-full bg-white dark:bg-[#050505] text-black dark:text-white overflow-hidden transition-colors duration-500">
      
      {/* 1. Sidebar Section */}
      <div className={cn(
        "w-full md:w-80 border-r border-zinc-200 dark:border-zinc-900 flex flex-col bg-white dark:bg-[#050505] shrink-0",
        selectedContact ? "hidden md:flex" : "flex"
      )}>
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-900 shrink-0">
            <h1 className="text-xl font-bold tracking-tight">Messages</h1>
        </div>
        <div className="flex-1 overflow-y-auto">
          {Array.from(new Set(messages.map(m => m.sender))).filter(s => s !== "Me").map((num) => (
            <div key={num} onClick={() => setSelectedContact(num)} className="p-4 flex items-center gap-3 cursor-pointer border-b border-zinc-100 dark:border-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-900">
              <ChatBubbleAvatar fallback={String(num).slice(-2)} className="h-11 w-11 border border-zinc-200 dark:border-zinc-800" />
              <div className="min-w-0 text-left"><p className="font-semibold text-sm">{num}</p><p className="text-[10px] text-green-500 font-bold uppercase">Online</p></div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Chat Window Section */}
      <div className={cn(
        "flex-1 flex flex-col bg-white dark:bg-[#050505] relative min-h-0 w-full", 
        !selectedContact ? "hidden md:flex" : "flex"
      )}>
        {selectedContact ? (
          <>
            <div className="h-14 border-b border-zinc-200 dark:border-zinc-900 bg-white/95 dark:bg-[#050505]/95 backdrop-blur-md flex items-center gap-3 px-4 shrink-0 z-40 w-full">
              <button onClick={() => setSelectedContact(null)} className="md:hidden">
                <ChevronLeft className="w-6 h-6 text-black dark:text-white" />
              </button>
              <div className="flex flex-col text-left">
                <span className="font-bold text-sm tracking-tight text-black dark:text-white">{selectedContact}</span>
                <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">BaseKey Verified</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto w-full relative bg-white dark:bg-[#050505]">
              <ChatMessageList className="p-4 pr-6 space-y-6 min-h-full">
                {filteredMessages.map((msg) => (
                  <ChatBubble key={msg.id} variant={msg.type === "sent" ? "sent" : "received"}>
                    <ChatBubbleMessage className={cn(
                        "text-[15px] shadow-sm px-4 py-2.5 rounded-2xl",
                        msg.type === "sent" ? "bg-blue-600 text-white" : "bg-zinc-100 dark:bg-zinc-900 text-black dark:text-white border dark:border-zinc-800/50"
                    )}>
                      {msg.text}
                      <ChatBubbleTimestamp timestamp="Just now" className="text-[9px] mt-1.5 opacity-50 font-bold" />
                    </ChatBubbleMessage>
                  </ChatBubble>
                ))}
              </ChatMessageList>
            </div>

            {/* INTERACTIVE INPUT BAR */}
            <div className="pb-8 pt-2 pl-0 pr-6 bg-white dark:bg-[#050505] border-t border-zinc-200 dark:border-zinc-900 shrink-0 z-40 w-full transition-all">
              <div className="flex items-center gap-1 md:gap-3">
                
                {/* ICON GROUP: Solid Black in Lite mode */}
                <div className={cn(
                  "flex items-center gap-0.5 text-black dark:text-white transition-all duration-300 overflow-hidden shrink-0",
                  shouldHideIcons ? "w-0 opacity-0 invisible -translate-x-10" : "w-auto opacity-100 visible translate-x-0"
                )}>
                  <button className="p-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-transform active:scale-90"><Camera className="w-6 h-6" /></button>
                  <button className="p-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-transform active:scale-90"><ImageIcon className="w-6 h-6" /></button>
                  <button className="p-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-transform active:scale-90"><Paperclip className="w-6 h-6 rotate-45" /></button>
                  <button className="p-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-transform active:scale-90"><Mic className="w-6 h-6" /></button>
                </div>

                {/* THE ARROW: Working perfectly */}
                <button 
                    onMouseDown={handleToggle}
                    className={cn(
                        "transition-all duration-300 shrink-0 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-full p-2.5 flex items-center justify-center",
                        shouldHideIcons ? "w-11 opacity-100 visible" : "w-0 opacity-0 invisible"
                    )}
                >
                    <ChevronRight className={cn("w-7 h-7 text-blue-500 transition-transform duration-300", isManualCollapsed ? "rotate-0" : "rotate-180")} />
                </button>

                <div className="flex-1 flex items-center bg-zinc-100 dark:bg-zinc-900 rounded-[22px] px-4 py-1.5 border border-transparent focus-within:border-zinc-300 dark:focus-within:border-zinc-800 transition-all ml-1">
                  <ChatInput 
                    ref={inputRef}
                    placeholder="Aa" 
                    value={inputText}
                    onChange={(e) => {
                      setInputText(e.target.value);
                      if (e.target.value.length > 0) setIsManualCollapsed(false);
                    }}
                    onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
                    className="h-10 text-black dark:text-white text-[16px]"
                  />
                  <button className="text-black dark:text-zinc-400 p-1.5 hover:scale-110 active:scale-90 transition-transform">
                    <MessengerSmile />
                  </button>
                </div>

                <div className="flex items-center min-w-[48px] justify-center shrink-0">
                  {inputText.trim().length > 0 ? (
                    <button onClick={() => handleSend()} className="p-3 bg-blue-600 rounded-full shadow-lg transform active:scale-90 transition-all"><Send className="w-5 h-5 text-white fill-current" /></button>
                  ) : (
                    /* HEART: Pure Black in Lite, Red in Dark */
                    <button onClick={() => handleSend("❤️")} className="p-2.5 transition-all hover:scale-125 active:scale-90 text-black dark:text-red-500">
                      <MessengerHeart className="w-7 h-7" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-800 bg-white dark:bg-[#050505] font-black uppercase tracking-[0.3em] opacity-40">Select a chat</div>
        )}
      </div>
    </div>
  );
}
