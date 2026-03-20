"use client";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";

[span_14](start_span)[span_15](start_span)[span_16](start_span)[span_17](start_span)[span_18](start_span)[span_19](start_span)// AAPKI BHEJI HUI 8 FILES KA SAHI ISTEMAL[span_14](end_span)[span_15](end_span)[span_16](end_span)[span_17](end_span)[span_18](end_span)[span_19](end_span)
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
      
      {/* 1. Sidebar - Sleek & Compact */}
      <div className="w-72 border-r border-zinc-800 flex flex-col flex-shrink-0 bg-black">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <h1 className="text-lg font-bold tracking-tight">Messages</h1>
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {contacts.map((num) => (
            <div 
              key={num} 
              onClick={() => setSelectedContact(num)}
              className={cn(
                "p-4 flex items-center gap-3 cursor-pointer transition-all border-b border-zinc-900",
                selectedContact === num ? "bg-zinc-800" : "hover:bg-zinc-900"
              )}
            >
              [span_20](start_span)<ChatBubbleAvatar fallback={num.toString().slice(-2)} className="h-10 w-10 border border-zinc-700" />[span_20](end_span)
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate">{num}</p>
                <p className="text-[10px] text-zinc-500 truncate">Tap to open chat</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Main Chat Area */}
      <div className="flex-1 flex flex-col bg-[#050505]">
        {selectedContact ? (
          <>
            <div className="p-4 border-b border-zinc-800 bg-black/40 backdrop-blur-md flex items-center gap-3">
              <span className="font-bold text-sm tracking-wide">{selectedContact}</span>
            </div>

            [span_21](start_span){/* ChatMessageList handles the Scroll logic from useAutoScroll[span_21](end_span) */}
            <ChatMessageList className="flex-1 p-4 space-y-6">
              {filteredMessages.map((msg) => (
                [span_22](start_span)[span_23](start_span)<ChatBubble key={msg.id} variant={msg.type === "sent" ? "sent" : "received"}>[span_22](end_span)[span_23](end_span)
                  <ChatBubbleAvatar 
                    fallback={msg.type === "sent" ? "ME" : msg.sender.slice(-2)} 
                    className="h-8 w-8"
                  [span_24](start_span)/>[span_24](end_span)
                  <ChatBubbleMessage variant={msg.type === "sent" ? [span_25](start_span)"sent" : "received"}>[span_25](end_span)
                    {msg.text}
                    [span_26](start_span){/* Timestamp for professional feel[span_26](end_span) */}
                    <ChatBubbleTimestamp 
                      timestamp={msg.timestamp ? new Date(msg.timestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "..."} 
                    />
                  </ChatBubbleMessage>
                </ChatBubble>
              ))}
            </ChatMessageList>

            [span_27](start_span){/* Integrated Pill Input[span_27](end_span) */}
            <div className="p-4 border-t border-zinc-800 bg-black">
              <div className="flex items-center gap-2 bg-zinc-900 rounded-full px-4 py-1 border border-zinc-800 focus-within:border-zinc-700">
                <ChatInput 
                  placeholder="Type a message..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }}}
                  className="border-none bg-transparent focus-visible:ring-0 min-h-0 h-10 py-2" 
                [span_28](start_span)/>[span_28](end_span)
                <button 
                  onClick={handleSend}
                  className="text-blue-500 font-bold text-sm px-2 hover:text-white transition-colors"
                >
                  Send
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-600">
             <p className="text-sm font-medium">Select a contact to view messages</p>
          </div>
        )}
      </div>
    </div>
  );
}
