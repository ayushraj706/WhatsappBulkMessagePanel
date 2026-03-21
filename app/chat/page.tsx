"use client";
import { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import { ChatBubble, ChatBubbleMessage, ChatBubbleAvatar, ChatBubbleTimestamp } from "@/components/ui/chat/chat-bubble";
import { ChatMessageList } from "@/components/ui/chat/chat-message-list";
import { 
  Camera, Image as ImageIcon, Paperclip, MessageSquare, 
  Mic, Heart, Send, Smile, ChevronLeft, ChevronRight // Naya icon
} from "lucide-react"; 
import { ChatInput } from "@/components/ui/chat/chat-input";
import { cn } from "@/lib/utils";

export default function MessengerStyleChat() {
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  
  // 1. New States (Focus & Recording)
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
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
    const textToSend = customText || inputText;
    if (!textToSend.trim() || !selectedContact) return;
    
    setInputText("");
    setIsInputFocused(false); // Send ke baad icons wapas
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

  // 2. Heart Quick Send
  const sendHeart = () => handleSend("❤️");

  // 3. Recording Functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      mediaRecorder.current.start();
      setIsRecording(true);
    } catch (err) { console.error("Mic error:", err); }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      setIsRecording(false);
      mediaRecorder.current.ondataavailable = async (e) => {
        console.log("Audio ready for Cloudinary!");
      };
    }
  };

  return (
    <div className="flex h-full w-full max-w-full bg-black text-white overflow-hidden overflow-x-hidden">
      
      {/* Sidebar Section */}
      <div className={cn("w-full md:w-80 border-r border-zinc-800 flex flex-col bg-black shrink-0", selectedContact ? "hidden md:flex" : "flex")}>
        <div className="p-4 border-b border-zinc-800 shrink-0"><h1 className="text-xl font-bold">Messages</h1></div>
        <div className="flex-1 overflow-y-auto">
          {contacts.map((num) => (
            <div key={num} onClick={() => setSelectedContact(num)} className="p-4 flex items-center gap-3 cursor-pointer border-b border-zinc-900 hover:bg-zinc-800 transition-colors">
              <ChatBubbleAvatar fallback={String(num).slice(-2)} className="h-10 w-10 border border-zinc-700" />
              <div className="min-w-0 text-left"><p className="font-semibold text-sm truncate">{num}</p><p className="text-[10px] text-green-500">Online</p></div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Window Section */}
      <div className={cn("flex-1 flex flex-col bg-black relative min-h-0 w-full max-w-full", !selectedContact ? "hidden md:flex" : "flex")}>
        {selectedContact ? (
          <>
            <div className="h-14 border-b border-zinc-900 bg-black/80 backdrop-blur-md flex items-center gap-3 px-4 shrink-0 z-40">
              <button onClick={() => setSelectedContact(null)} className="md:hidden"><ChevronLeft className="w-6 h-6 text-zinc-400" /></button>
              <div className="flex flex-col text-left">
                <span className="font-bold text-sm tracking-tight">{selectedContact}</span>
                <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">WhatsApp Business</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto w-full relative">
              {/* pr-6 to stop cutting */}
              <ChatMessageList className="p-4 pr-6 space-y-6 min-h-full">
                {filteredMessages.map((msg) => (
                  <ChatBubble key={msg.id} variant={msg.type === "sent" ? "sent" : "received"}>
                    <ChatBubbleMessage className={msg.type === "sent" ? "bg-blue-600" : "bg-zinc-800"}>
                      {msg.text}
                      <ChatBubbleTimestamp timestamp="Just now" className="text-[10px] mt-1 opacity-50" />
                    </ChatBubbleMessage>
                  </ChatBubble>
                ))}
              </ChatMessageList>
            </div>

            {/* INTERACTIVE MESSENGER INPUT BAR */}
            <div className="pb-6 pt-2 pl-0 pr-6 bg-black border-t border-zinc-900 shrink-0 z-40 w-full">
              <div className="flex items-center gap-1 md:gap-3 transition-all duration-300">
                
                {/* 1. Icons - Hide on Focus */}
                <div className={cn(
                  "flex items-center gap-0.5 text-white transition-all duration-300 overflow-hidden shrink-0",
                  isInputFocused ? "w-0 opacity-0 invisible" : "w-auto opacity-100 visible"
                )}>
                  <button className="p-2 hover:bg-zinc-800 rounded-full transition"><Camera className="w-5 h-5 md:w-6 md:h-6" /></button>
                  <button className="p-2 hover:bg-zinc-800 rounded-full transition"><ImageIcon className="w-5 h-5 md:w-6 md:h-6" /></button>
                  <button className="p-2 hover:bg-zinc-800 rounded-full transition"><Paperclip className="w-5 h-5 md:w-6 md:h-6" /></button>
                  <button className="p-2 hover:bg-zinc-800 rounded-full transition"><MessageSquare className="w-5 h-5 md:w-6 md:h-6" /></button>
                  
                  <button 
                    onMouseDown={startRecording} onMouseUp={stopRecording}
                    className={cn("p-2 rounded-full transition-all", isRecording ? "bg-red-600 text-white animate-pulse" : "hover:bg-zinc-800 text-white")}
                  >
                    <Mic className="w-5 h-5 md:w-6 md:h-6" />
                  </button>
                </div>

                {/* 2. Expand Arrow - Show only on Focus */}
                <button 
                    onClick={() => setIsInputFocused(false)}
                    className={cn(
                        "transition-all duration-300 overflow-hidden shrink-0 hover:bg-zinc-800 rounded-full",
                        isInputFocused ? "w-10 h-10 flex items-center justify-center opacity-100 p-2" : "w-0 h-0 opacity-0"
                    )}
                >
                    <ChevronRight className="w-6 h-6 text-blue-500" />
                </button>

                {/* 3. Central Pill Input */}
                <div className="flex-1 flex items-center bg-[#1c1c1e] rounded-full px-4 py-1 border border-transparent focus-within:border-zinc-700 transition-all ml-1">
                  <ChatInput 
                    placeholder="Aa" 
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
                    onFocus={() => setIsInputFocused(true)} // Focus triggers collapse
                    className="h-10 text-white"
                  />
                  <button className="text-zinc-400 hover:text-white p-1"><Smile className="w-5 h-5" /></button>
                </div>

                {/* 4. Right Side: Heart/Send */}
                <div className="flex items-center min-w-[40px] justify-center shrink-0">
                  {inputText.trim().length > 0 ? (
                    <button onClick={() => handleSend()} className="p-2 bg-blue-600 rounded-full shadow-lg transform scale-110 transition-all"><Send className="w-4 h-4 text-white fill-current" /></button>
                  ) : (
                    <button onClick={sendHeart} className="p-2 text-red-500 hover:scale-125 transition-transform"><Heart className="w-6 h-6 fill-current" /></button>
                  )}
                </div>

              </div>
              {isRecording && <p className="text-[10px] text-red-500 font-bold ml-12 mt-1 uppercase tracking-widest">Recording...</p>}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-600 font-bold opacity-50 uppercase tracking-widest">Select a chat</div>
        )}
      </div>
    </div>
  );
}
