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

export default function MessengerStyleChat() {
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  
  // Logic States
  const [isManualCollapsed, setIsManualCollapsed] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null); // Keyboard persistence ke liye

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

  // 1 Akshar type hote hi icons gayab, ya manual toggle
  const shouldHideIcons = inputText.length > 0 || isManualCollapsed;

  // Arrow Click logic: Keyboard on rakhte hue toggle karna
  const toggleIcons = (e: React.MouseEvent) => {
    e.preventDefault(); // Click hone par input focus nahi jayega
    setIsManualCollapsed(!isManualCollapsed);
    if (inputRef.current) inputRef.current.focus(); // Wapas focus input par
  };

  return (
    <div className="flex h-full w-full max-w-full bg-white dark:bg-[#09090b] text-zinc-950 dark:text-white overflow-hidden transition-colors duration-500">
      
      {/* 1. Sidebar Section */}
      <div className={cn(
        "w-full md:w-80 border-r border-zinc-200 dark:border-zinc-800 flex flex-col bg-white dark:bg-[#09090b] shrink-0 transition-all",
        selectedContact ? "hidden md:flex" : "flex"
      )}>
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
            <h1 className="text-xl font-bold tracking-tight">Messages</h1>
        </div>
        <div className="flex-1 overflow-y-auto">
          {messages.length > 0 && Array.from(new Set(messages.map(m => m.sender))).filter(s => s !== "Me").map((num) => (
            <div key={num} onClick={() => setSelectedContact(num)} className="p-4 flex items-center gap-3 cursor-pointer border-b border-zinc-100 dark:border-zinc-900/50 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors">
              <ChatBubbleAvatar fallback={String(num).slice(-2)} className="h-10 w-10 border border-zinc-200 dark:border-zinc-700" />
              <div className="min-w-0 text-left">
                  <p className="font-semibold text-sm truncate">{num}</p>
                  <p className="text-[10px] text-green-500 font-medium">Active</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Chat Window Section */}
      <div className={cn(
        "flex-1 flex flex-col bg-zinc-50 dark:bg-black relative min-h-0 w-full max-w-full", 
        !selectedContact ? "hidden md:flex" : "flex"
      )}>
        {selectedContact ? (
          <>
            {/* DYNAMIC HEADER: Background changes with theme */}
            <div className="h-14 border-b border-zinc-200 dark:border-zinc-900 bg-white/95 dark:bg-[#09090b]/95 backdrop-blur-md flex items-center gap-3 px-4 shrink-0 z-40 w-full transition-colors">
              <button onClick={() => setSelectedContact(null)} className="md:hidden">
                <ChevronLeft className="w-6 h-6 text-black dark:text-zinc-200" />
              </button>
              <div className="flex flex-col text-left">
                <span className="font-bold text-sm tracking-tight text-black dark:text-white">{selectedContact}</span>
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest opacity-80">WhatsApp Business</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto w-full relative bg-white dark:bg-[#09090b] transition-colors">
              <ChatMessageList className="p-4 pr-6 space-y-6 min-h-full">
                {filteredMessages.map((msg) => (
                  <ChatBubble key={msg.id} variant={msg.type === "sent" ? "sent" : "received"}>
                    <ChatBubbleMessage className={cn(
                        "text-sm shadow-sm border border-transparent",
                        msg.type === "sent" 
                          ? "bg-blue-600 text-white" 
                          /* RECEIVED BUBBLE: Lite mode mein light zinc */
                          : "bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white dark:border-zinc-700/50"
                    )}>
                      {msg.text}
                      <ChatBubbleTimestamp timestamp="Just now" className="text-[9px] mt-1 opacity-60 font-medium" />
                    </ChatBubbleMessage>
                  </ChatBubble>
                ))}
              </ChatMessageList>
            </div>

            {/* INTERACTIVE MESSENGER INPUT BAR */}
            <div className="pb-6 pt-2 pl-0 pr-6 bg-white dark:bg-[#09090b] border-t border-zinc-200 dark:border-zinc-900 shrink-0 z-40 w-full transition-colors">
              <div className="flex items-center gap-1 md:gap-3">
                
                {/* ICON GROUP: Pure Black in Lite mode */}
                <div className={cn(
                  "flex items-center gap-0.5 text-black dark:text-white transition-all duration-300 overflow-hidden shrink-0",
                  shouldHideIcons ? "w-0 opacity-0 invisible" : "w-auto opacity-100 visible"
                )}>
                  <button className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full"><Camera className="w-5 h-5 md:w-6 md:h-6" /></button>
                  <button className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full"><ImageIcon className="w-5 h-5 md:w-6 md:h-6" /></button>
                  <button className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full"><Paperclip className="w-5 h-5 md:w-6 md:h-6" /></button>
                  <button className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full"><Mic className="w-5 h-5 md:w-6 md:h-6" /></button>
                </div>

                {/* MANUAL TOGGLE ARROW: Keyboard focused rahega */}
                <button 
                    onMouseDown={toggleIcons} // MouseDown use kiya keyboard na hataane ke liye
                    className={cn(
                        "transition-all duration-300 shrink-0 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full p-2 flex items-center justify-center",
                        shouldHideIcons ? "w-10 opacity-100 visible" : "w-0 opacity-0 invisible"
                    )}
                >
                    <ChevronRight className={cn("w-6 h-6 text-blue-500 transition-transform", isManualCollapsed ? "rotate-0" : "rotate-180")} />
                </button>

                {/* PILL INPUT AREA */}
                <div className="flex-1 flex items-center bg-zinc-100 dark:bg-zinc-900 rounded-full px-4 py-1 border border-transparent focus-within:border-zinc-300 dark:focus-within:border-zinc-700 transition-all ml-1">
                  <ChatInput 
                    ref={inputRef} // Focus handle karne ke liye
                    placeholder="Aa" 
                    value={inputText}
                    onChange={(e) => {
                      setInputText(e.target.value);
                      if (e.target.value.length > 0) setIsManualCollapsed(false);
                    }}
                    onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
                    className="h-10 text-black dark:text-white"
                  />
                  {/* Emoji: Pure Black in Lite mode */}
                  <button className="text-black dark:text-zinc-400 p-1"><Smile className="w-5 h-5" /></button>
                </div>

                <div className="flex items-center min-w-[40px] justify-center shrink-0">
                  {inputText.trim().length > 0 ? (
                    <button onClick={() => handleSend()} className="p-2 bg-blue-600 rounded-full shadow-lg transform scale-110 active:scale-95 transition-all"><Send className="w-4 h-4 text-white fill-current" /></button>
                  ) : (
                    /* HEART: Input bar mein Pure Black (Lite) / Red (Dark) */
                    <button 
                      onClick={() => handleSend("❤️")} 
                      className="p-2 transition-all hover:scale-125 text-black dark:text-red-500"
                    >
                      <Heart className="w-6 h-6 fill-current" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-zinc-400 dark:text-zinc-700 bg-white dark:bg-[#09090b] font-bold uppercase tracking-widest opacity-50">Select a chat</div>
        )}
      </div>
    </div>
  );
}
