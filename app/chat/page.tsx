"use client";
import { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import { ChatBubble, ChatBubbleMessage, ChatBubbleAvatar, ChatBubbleTimestamp } from "@/components/ui/chat/chat-bubble";
import { ChatMessageList } from "@/components/ui/chat/chat-message-list";
import { Blocks, MessageSquarePlus, Mic, ChevronLeft, Send } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ChatFlowPage() {
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
        text: textToSend, sender: "Me", receiver: selectedContact, type: "sent", timestamp: serverTimestamp(),
      });
      await fetch("/api/whatsapp/send", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: selectedContact, message: textToSend }),
      });
    } catch (err) { console.error(err); }
  };

  return (
    <div className="flex flex-1 bg-black text-white w-full overflow-hidden">
      
      {/* 1. Contacts View - Mobile par tabhi dikhega jab koi select na ho */}
      <div className={cn(
        "w-full md:w-80 border-r border-zinc-800 flex flex-col flex-shrink-0 bg-black",
        selectedContact ? "hidden md:flex" : "flex"
      )}>
        <div className="p-4 border-b border-zinc-800">
          <h1 className="text-xl font-bold tracking-tight">Messages</h1>
        </div>
        <div className="flex-1 overflow-y-auto">
          {contacts.map((num) => (
            <div 
              key={num} 
              onClick={() => setSelectedContact(num)}
              className="p-4 flex items-center gap-3 cursor-pointer border-b border-zinc-900 hover:bg-zinc-800 transition-colors"
            >
              <ChatBubbleAvatar fallback={String(num).slice(-2)} className="h-12 w-12 border border-zinc-700" />
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate">{num}</p>
                <p className="text-[10px] text-green-500">Active</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Chat Window View */}
      <div className={cn(
        "flex-1 flex flex-col bg-[#050505]",
        !selectedContact ? "hidden md:flex" : "flex"
      )}>
        {selectedContact ? (
          <>
            <div className="p-4 border-b border-zinc-800 bg-black/60 backdrop-blur-md flex items-center gap-3">
              <button onClick={() => setSelectedContact(null)} className="md:hidden">
                <ChevronLeft className="w-6 h-6 text-zinc-400" />
              </button>
              <span className="font-bold text-sm tracking-wide">{selectedContact}</span>
            </div>

            <div className="flex-1 overflow-y-auto">
              <ChatMessageList className="p-4 space-y-6">
                {filteredMessages.map((msg) => (
                  <ChatBubble key={msg.id} variant={msg.type === "sent" ? "sent" : "received"}>
                    <ChatBubbleMessage className={msg.type === "sent" ? "bg-blue-600 text-white" : "bg-zinc-800 text-white"}>
                      {msg.text}
                      <ChatBubbleTimestamp timestamp="Just now" />
                    </ChatBubbleMessage>
                  </ChatBubble>
                ))}
              </ChatMessageList>
            </div>

            {/* Input - Safe from cutting */}
            <div className="p-4 bg-zinc-950 border-t border-zinc-800">
              <div className="flex items-center gap-2 bg-zinc-900 rounded-full px-4 py-2 border border-zinc-800 focus-within:border-zinc-700 transition-all">
                <button className="text-blue-500"><Blocks className="w-5 h-5" /></button>
                <button className="text-green-500"><MessageSquarePlus className="w-5 h-5" /></button>
                <input 
                  className="bg-transparent flex-1 outline-none text-sm p-1 text-white"
                  placeholder="Type message..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
                />
                <button className="text-zinc-500 hover:text-red-500 p-2 bg-zinc-800 rounded-full"><Mic className="w-5 h-5" /></button>
                <button onClick={handleSend} className="text-blue-500"><Send className="w-5 h-5" /></button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-zinc-600">
            <p className="text-sm font-medium">Select a conversation to start</p>
          </div>
        )}
      </div>
    </div>
  );
}
