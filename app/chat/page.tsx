"use client";
import { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import { ChatBubble, ChatBubbleMessage } from "@/components/ui/chat/chat-bubble";
import { ChatMessageList } from "@/components/ui/chat/chat-message-list";
import { cn } from "@/lib/utils";

export default function InstagramChat() {
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState(""); // Typing control ke liye
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query(collection(db, "chats"), orderBy("timestamp", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, selectedContact]);

  const contacts = Array.from(new Set(messages.map(m => m.sender))).filter(s => s !== "Me");
  const filteredMessages = messages.filter(m => 
    (m.sender === selectedContact) || (m.type === "sent" && m.receiver === selectedContact)
  );

  const handleSend = async () => {
    if (!inputText.trim() || !selectedContact) return;
    const textToSend = inputText;
    setInputText(""); // Turant khali kar do taaki makkhan feel aaye

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
    // ml-64 hata diya hai kyunki Layout use handle kar raha hai
    <div className="flex h-screen bg-black text-white w-full overflow-hidden">
      
      {/* 1. Sidebar */}
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
              <div className="w-10 h-10 bg-zinc-700 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold">
                {num.toString().slice(-2)}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate">{num}</p>
                <p className="text-[10px] text-green-500 truncate">Online</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Chat Area */}
      <div className="flex-1 flex flex-col bg-black">
        {selectedContact ? (
          <>
            <div className="p-4 border-b border-zinc-800 flex items-center gap-3 bg-black/40 backdrop-blur-md">
              <span className="font-bold">{selectedContact}</span>
            </div>

            <div className="flex-1 overflow-y-auto p-4" ref={scrollRef}>
              <ChatMessageList>
                {filteredMessages.map((msg) => (
                  <ChatBubble key={msg.id} variant={msg.type === "sent" ? "sent" : "received"}>
                    {/* Yahan maine bubble colors ko force kiya hai taaki Instagram lage */}
                    <ChatBubbleMessage 
                       className={msg.type === "sent" ? "bg-blue-600 text-white" : "bg-zinc-800 text-white"}
                       variant={msg.type === "sent" ? "sent" : "received"}
                    >
                      {msg.text}
                    </ChatBubbleMessage>
                  </ChatBubble>
                ))}
              </ChatMessageList>
            </div>

            {/* Send Button Logic Updated Here */}
            <div className="p-4 border-t border-zinc-800 bg-black">
              <div className="flex items-center bg-zinc-900 rounded-full px-4 py-2 border border-zinc-800 focus-within:border-zinc-600 transition-all">
                <input 
                  className="bg-transparent flex-1 outline-none text-sm p-1 text-white"
                  placeholder="Message..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
                />
                <button 
                  onClick={handleSend} // AB YE KAAM KAREGA!
                  className="text-blue-500 font-bold text-sm px-2 hover:text-white transition-colors"
                >
                  Send
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-500">
             <p className="text-sm">Select a chat to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
}
