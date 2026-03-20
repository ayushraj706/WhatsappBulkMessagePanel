"use client";
import { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";

// Aapki banayi hui components ka sahi istemal
import { 
  ChatBubble, 
  ChatBubbleAvatar, 
  ChatBubbleMessage, 
  ChatBubbleTimestamp 
} from "@/components/ui/chat/chat-bubble";
import { ChatMessageList } from "@/components/ui/chat/chat-message-list";
import { ChatInput } from "@/components/ui/chat/chat-input";
import { cn } from "@/lib/utils";

export default function InstagramStyleChat() {
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. Live Messages Loading
  useEffect(() => {
    const q = query(collection(db, "chats"), orderBy("timestamp", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  const contacts = Array.from(new Set(messages.map(m => m.sender))).filter(s => s !== "Me");
  
  // Filter messages for selected chat
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
    } catch (err) { console.error("Send Error:", err); }
  };

  return (
    <div className="flex h-screen bg-black text-white w-full overflow-hidden">
      
      {/* Sidebar Section */}
      <div className="w-72 border-r border-zinc-800 flex flex-col flex-shrink-0 bg-black">
        <div className="p-4 border-b border-zinc-800">
          <h1 className="text-lg font-bold">Messages</h1>
        </div>
        <div className="flex-1 overflow-y-auto">
          {contacts.map((num) => (
            <div 
              key={num} 
              onClick={() => setSelectedContact(num)}
              className={cn(
                "p-4 flex items-center gap-3 cursor-pointer transition-all border-b border-zinc-900",
                selectedContact === num ? "bg-zinc-800" : "hover:bg-zinc-900"
              )}
            >
              <ChatBubbleAvatar fallback={String(num).slice(-2)} className="h-10 w-10 border border-zinc-700" />
              <div className="min-w-0 text-left">
                <p className="font-semibold text-sm truncate">{num}</p>
                <p className="text-[10px] text-green-500 truncate font-medium">Online</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area Section */}
      <div className="flex-1 flex flex-col bg-[#050505]">
        {selectedContact ? (
          <>
            <div className="p-4 border-b border-zinc-800 bg-black/40 backdrop-blur-md">
              <span className="font-bold text-sm">{selectedContact}</span>
            </div>

            <ChatMessageList className="flex-1 p-4 overflow-y-auto">
              {filteredMessages.map((msg) => {
                const isSent = msg.type === "sent";
                const time = msg.timestamp 
                  ? new Date(msg.timestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                  : "...";

                return (
                  <ChatBubble key={msg.id} variant={isSent ? "sent" : "received"}>
                    <ChatBubbleAvatar 
                      fallback={isSent ? "ME" : String(msg.sender).slice(-2)} 
                      className="h-8 w-8"
                    />
                    <ChatBubbleMessage variant={isSent ? "sent" : "received"}>
                      {msg.text}
                      <ChatBubbleTimestamp timestamp={time} />
                    </ChatBubbleMessage>
                  </ChatBubble>
                );
              })}
            </ChatMessageList>

            {/* Input Pill */}
            <div className="p-4 border-t border-zinc-800 bg-black">
              <div className="flex items-center gap-2 bg-zinc-900 rounded-full px-4 py-1 border border-zinc-800">
                <ChatInput 
                  placeholder="Type a message..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  className="border-none bg-transparent focus-visible:ring-0 min-h-0 h-10 py-2" 
                />
                <button onClick={handleSend} className="text-blue-500 font-bold text-sm px-2">
                  Send
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-600">
             <p className="text-sm font-medium">Select a contact to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
}
