"use client";
import { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import { ChatBubble, ChatBubbleMessage, ChatBubbleAvatar, ChatBubbleTimestamp } from "@/components/ui/chat/chat-bubble";
import { ChatMessageList } from "@/components/ui/chat/chat-message-list";
import { 
  Camera, ImageIcon, Paperclip, MessageSquare, 
  Mic, Heart, Send, Smile, ChevronLeft, ChevronRight 
} from "lucide-react"; 
import { ChatInput } from "@/components/ui/chat/chat-input";
import { cn } from "@/lib/utils";

export default function DeepDarkMessenger() {
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  
  // Logic States
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

  // Logic: 1 akshar type hote hi icons hide honge
  const shouldHideIcons = inputText.length > 0 || isManualCollapsed;

  // Arrow click se keypad na hategi
  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsManualCollapsed(!isManualCollapsed);
    if (inputRef.current) inputRef.current.focus();
  };

  return (
    // Deep Dark: bg-[#050505] for that premium OLED look
    <div className="flex h-full w-full max-w-full bg-white dark:bg-[#050505] text-black dark:text-white overflow-hidden transition-colors duration-500">
      
      {/* 1. Sidebar */}
      <div className={cn(
        "w-full md:w-80 border-r border-zinc-200 dark:border-zinc-900 flex flex-col bg-white dark:bg-[#050505] shrink-0 transition-all",
        selectedContact ? "hidden md:flex" : "flex"
      )}>
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-900 shrink-0">
            <h1 className="text-xl font-bold tracking-tighter">Messages</h1>
        </div>
        <div className="flex-1 overflow-y-auto">
          {Array.from(new Set(messages.map(m => m.sender))).filter(s => s !== "Me").map((num) => (
            <div key={num} onClick={() => setSelectedContact(num)} className="p-4 flex items-center gap-3 cursor-pointer border-b border-zinc-100 dark:border-zinc-900/40 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all">
              <ChatBubbleAvatar fallback={String(num).slice(-2)} className="h-11 w-11 border border-zinc-200 dark:border-zinc-800" />
              <div className="min-w-0 text-left"><p className="font-semibold text-sm truncate">{num}</p><p className="text-[10px] text-green-500 font-bold">ACTIVE</p></div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Chat Window */}
      <div className={cn(
        "flex-1 flex flex-col bg-white dark:bg-[#050505] relative min-h-0 w-full max-w-full", 
        !selectedContact ? "hidden md:flex" : "flex"
      )}>
        {selectedContact ? (
          <>
            <div className="h-14 border-b border-zinc-200 dark:border-zinc-900 bg-white/95 dark:bg-[#050505]/95 backdrop-blur-md flex items-center gap-3 px-4 shrink-0 z-40 w-full">
              <button onClick={() => setSelectedContact(null)} className="md:hidden"><ChevronLeft className="w-6 h-6 text-black dark:text-white" /></button>
              <div className="flex flex-col text-left">
                <span className="font-extrabold text-sm tracking-tight text-black dark:text-white">{selectedContact}</span>
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">BaseKey Verified</span>
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
                      <ChatBubbleTimestamp timestamp="Just now" className="text-[9px] mt-1.5 opacity-50" />
                    </ChatBubbleMessage>
                  </ChatBubble>
                ))}
              </ChatMessageList>
            </div>

            {/* INPUT BAR: Pro Messenger Layout */}
            <div className="pb-8 pt-3 pl-0 pr-6 bg-white dark:bg-[#050505] border-t border-zinc-200 dark:border-zinc-900 shrink-0 z-40 w-full">
              <div className="flex items-center gap-1 md:gap-3 transition-all duration-300">
                
                {/* ICON GROUP: Pure Black Icons in Light mode */}
                <div className={cn(
                  "flex items-center gap-0.5 text-black dark:text-white transition-all duration-300 overflow-hidden shrink-0",
                  shouldHideIcons ? "w-0 opacity-0 -translate-x-10" : "w-auto opacity-100 translate-x-0"
                )}>
                  <button className="p-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-full transition"><Camera className="w-6 h-6" /></button>
                  <button className="p-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-full transition"><ImageIcon className="w-6 h-6" /></button>
                  <button className="p-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-full transition"><Paperclip className="w-6 h-6 rotate-45" /></button>
                  <button className="p-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-full transition"><Mic className="w-6 h-6" /></button>
                </div>

                {/* ARROW: Keypad persistence logic */}
                <button 
                    onMouseDown={handleToggle}
                    className={cn(
                        "transition-all duration-300 shrink-0 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-full p-2.5 flex items-center justify-center",
                        shouldHideIcons ? "w-11 opacity-100 scale-100" : "w-0 opacity-0 scale-0 overflow-hidden"
                    )}
                >
                    <ChevronRight className={cn("w-7 h-7 text-blue-500 transition-transform duration-300", isManualCollapsed ? "rotate-0" : "rotate-180")} />
                </button>

                {/* PILL INPUT AREA */}
                <div className="flex-1 flex items-center bg-zinc-100 dark:bg-zinc-900/80 rounded-[24px] px-4 py-1.5 border border-transparent focus-within:border-zinc-300 dark:focus-within:border-zinc-800 transition-all ml-1 shadow-inner">
                  <ChatInput 
                    ref={inputRef}
                    placeholder="Aa" 
                    value={inputText}
                    onChange={(e) => {
                      setInputText(e.target.value);
                      if (e.target.value.length > 0) setIsManualCollapsed(false);
                    }}
                    onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
                    className="h-10 text-black dark:text-white placeholder:text-zinc-500"
                  />
                  <button className="text-black dark:text-zinc-400 p-1.5 hover:scale-110 transition-transform"><Smile className="w-6 h-6" /></button>
                </div>

                <div className="flex items-center min-w-[48px] justify-center shrink-0">
                  {inputText.trim().length > 0 ? (
                    <button onClick={() => handleSend()} className="p-3 bg-blue-600 rounded-full shadow-lg transform active:scale-90 transition-all"><Send className="w-5 h-5 text-white fill-current" /></button>
                  ) : (
                    /* HEART: Pure Black in Lite, Red in Dark */
                    <button 
                      onClick={() => handleSend("❤️")} 
                      className="p-2.5 transition-all hover:scale-125 text-black dark:text-red-500"
                    >
                      <Heart className="w-7 h-7 fill-current" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-800 bg-white dark:bg-[#050505] font-black uppercase tracking-[0.2em] opacity-30">
             <MessageSquare className="w-16 h-16 mb-4" />
             <p className="text-xs">BaseKey Panel</p>
          </div>
        )}
      </div>
    </div>
  );
}
