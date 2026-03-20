"use client";
import { useState, useEffect, useRef } from "react";
import { Menu, Blocks, MessageSquarePlus, Mic, Paperclip, ChevronLeft } from "lucide-react"; 
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import { ChatBubble, ChatBubbleMessage, ChatBubbleAvatar, ChatBubbleTimestamp } from "@/components/ui/chat/chat-bubble";
import { ChatMessageList } from "@/components/ui/chat/chat-message-list";
import { cn } from "@/lib/utils";

export default function ChatwoodStyleChat() {
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile sidebar state
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
    <div className="flex h-screen bg-black text-white w-full overflow-hidden">
      
      {/* 1. Contacts Sidebar (Mobile Responsive) */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 bg-black border-r border-zinc-800 flex flex-col transition-transform duration-300 md:relative md:translate-x-0 md:w-80 md:flex",
        isSidebarOpen || !selectedContact ? "translate-x-0 flex" : "-translate-x-full hidden"
      )}>
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <h1 className="text-lg font-bold tracking-tight">Messages</h1>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-zinc-500">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {contacts.map((num) => (
            <div 
              key={num} 
              onClick={() => { setSelectedContact(num); setIsSidebarOpen(false); }}
              className={cn(
                "p-4 flex items-center gap-3 cursor-pointer border-b border-zinc-900",
                selectedContact === num ? "bg-zinc-800" : "hover:bg-zinc-900"
              )}
            >
              <ChatBubbleAvatar fallback={String(num).slice(-2)} className="h-10 w-10 border border-zinc-700" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{num}</p>
                <p className="text-[10px] text-green-500">Online</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Chat Area */}
      <div className={cn(
        "flex-1 flex flex-col bg-[#050505]",
        !selectedContact ? "hidden md:flex" : "flex"
      )}>
        {selectedContact ? (
          <>
            {/* Professional Top Header */}
            <div className="p-4 border-b border-zinc-800 bg-black/60 backdrop-blur-md flex items-center gap-4">
              {/* Menu Icon (Three Lines) */}
              <button onClick={() => setIsSidebarOpen(true)} className="text-zinc-400 hover:text-white">
                <Menu className="w-6 h-6" /> 
              </button>
              <span className="font-bold text-sm">{selectedContact}</span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar" ref={scrollRef}>
              <ChatMessageList>
                {filteredMessages.map((msg) => (
                  <ChatBubble key={msg.id} variant={msg.type === "sent" ? "sent" : "received"}>
                    <ChatBubbleMessage 
                       className={msg.type === "sent" ? "bg-blue-600 text-white" : "bg-zinc-800 text-white"}
                    >
                      {msg.text}
                      <ChatBubbleTimestamp timestamp={msg.timestamp ? "Just now" : "..."} />
                    </ChatBubbleMessage>
                  </ChatBubble>
                ))}
              </ChatMessageList>
            </div>

            {/* Input - Ab koi Bottom Nav ise nahi rokega! */}
            <div className="p-4 border-t border-zinc-800 bg-black pb-8 md:pb-4">
              <div className="flex items-center gap-2 bg-zinc-900 rounded-full px-4 py-2 border border-zinc-800">
                <button className="text-blue-500 hover:text-white p-1"><Blocks className="w-5 h-5" /></button>
                <button className="text-green-500 hover:text-white p-1"><MessageSquarePlus className="w-5 h-5" /></button>
                <input 
                  className="bg-transparent flex-1 outline-none text-sm p-2 text-white"
                  placeholder="Type a message..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
                />
                <button className="text-zinc-500 hover:text-red-500 p-2 bg-zinc-800 rounded-full"><Mic className="w-5 h-5" /></button>
                <button onClick={handleSend} className="text-blue-500 font-bold text-sm px-2">Send</button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-600">
             <button onClick={() => setIsSidebarOpen(true)} className="md:hidden mb-4 p-2 bg-zinc-900 rounded-lg border border-zinc-800 flex items-center gap-2">
               <Menu className="w-5 h-5" /> Select Contact
             </button>
             <p className="text-sm">Select a contact to view messages</p>
          </div>
        )}
      </div>
    </div>
  );
}
