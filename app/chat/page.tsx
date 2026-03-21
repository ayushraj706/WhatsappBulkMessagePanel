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
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorder = useRef<MediaRecorder | null>(null);

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
    setIsInputFocused(false);
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
    }
  };

  return (
    <div className="flex h-full w-full max-w-full bg-white dark:bg-black text-zinc-950 dark:text-white overflow-hidden transition-colors duration-300">
      
      {/* 1. Sidebar Section */}
      <div className={cn(
        "w-full md:w-80 border-r border-zinc-200 dark:border-zinc-800 flex flex-col bg-white dark:bg-black shrink-0 transition-all",
        selectedContact ? "hidden md:flex" : "flex"
      )}>
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
            <h1 className="text-xl font-bold">Messages</h1>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {contacts.map((num) => (
            <div key={num} onClick={() => setSelectedContact(num)} className="p-4 flex items-center gap-3 cursor-pointer border-b border-zinc-100 dark:border-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors">
              <ChatBubbleAvatar fallback={String(num).slice(-2)} className="h-10 w-10 border border-zinc-200 dark:border-zinc-700" />
              <div className="min-w-0 text-left">
                  <p className="font-semibold text-sm truncate">{num}</p>
                  <p className="text-[10px] text-green-500 font-medium">Online</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Chat Window Section */}
      <div className={cn(
        "flex-1 flex flex-col bg-zinc-50 dark:bg-black relative min-h-0 w-full max-w-full transition-colors", 
        !selectedContact ? "hidden md:flex" : "flex"
      )}>
        {selectedContact ? (
          <>
            {/* STABLE SUB-HEADER: Pehle bg-black tha, ab white/black switch hoga */}
            <div className="h-14 border-b border-zinc-200 dark:border-zinc-900 bg-white dark:bg-black/90 backdrop-blur-md flex items-center gap-3 px-4 shrink-0 z-40 w-full transition-colors">
              <button onClick={() => setSelectedContact(null)} className="md:hidden">
                <ChevronLeft className="w-6 h-6 text-zinc-800 dark:text-zinc-200" />
              </button>
              <div className="flex flex-col text-left">
                <span className="font-bold text-sm tracking-tight text-zinc-900 dark:text-white">{selectedContact}</span>
                <span className="text-[10px] text-zinc-500 dark:text-zinc-500 font-bold uppercase tracking-widest">WhatsApp Business</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto w-full relative bg-white dark:bg-black transition-colors">
              <ChatMessageList className="p-4 pr-6 space-y-6 min-h-full">
                {filteredMessages.map((msg) => (
                  <ChatBubble key={msg.id} variant={msg.type === "sent" ? "sent" : "received"}>
                    <ChatBubbleMessage className={cn(
                        "text-sm shadow-sm",
                        msg.type === "sent" ? "bg-blue-600 text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white"
                    )}>
                      {msg.text}
                      <ChatBubbleTimestamp timestamp="Just now" className="text-[9px] mt-1 opacity-60" />
                    </ChatBubbleMessage>
                  </ChatBubble>
                ))}
              </ChatMessageList>
            </div>

            {/* INTERACTIVE INPUT BAR: Icons use text-zinc-800 (Light) and text-white (Dark) */}
            <div className="pb-6 pt-2 pl-0 pr-6 bg-white dark:bg-black border-t border-zinc-200 dark:border-zinc-900 shrink-0 z-40 w-full transition-colors">
              <div className="flex items-center gap-1.5 md:gap-3 transition-all">
                
                <div className={cn(
                  "flex items-center gap-0.5 text-zinc-800 dark:text-white transition-all duration-300 overflow-hidden shrink-0",
                  isInputFocused ? "w-0 opacity-0 invisible" : "w-auto opacity-100 visible"
                )}>
                  <button className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition"><Camera className="w-5 h-5 md:w-6 md:h-6" /></button>
                  <button className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition"><ImageIcon className="w-5 h-5 md:w-6 md:h-6" /></button>
                  <button className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition"><Paperclip className="w-5 h-5 md:w-6 md:h-6" /></button>
                  <button className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition"><MessageSquare className="w-5 h-5 md:w-6 md:h-6" /></button>
                  
                  <button onMouseDown={startRecording} onMouseUp={stopRecording} className={cn("p-2 rounded-full", isRecording ? "bg-red-600 text-white animate-pulse" : "hover:bg-zinc-100 dark:hover:bg-zinc-800")}><Mic className="w-5 h-5 md:w-6 md:h-6" /></button>
                </div>

                <button onClick={() => setIsInputFocused(false)} className={cn("transition-all duration-300 shrink-0", isInputFocused ? "w-10 opacity-100" : "w-0 opacity-0")}><ChevronRight className="w-6 h-6 text-blue-500" /></button>

                <div className="flex-1 flex items-center bg-zinc-100 dark:bg-[#1c1c1e] rounded-full px-4 py-1 border border-transparent focus-within:border-zinc-300 dark:focus-within:border-zinc-700 transition-all ml-1 shadow-sm">
                  <ChatInput 
                    placeholder="Aa" 
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
                    onFocus={() => setIsInputFocused(true)}
                    className="h-10 text-zinc-900 dark:text-white"
                  />
                  {/* Emoji Icon: dynamic color switch */}
                  <button className="text-zinc-700 dark:text-zinc-400 hover:text-blue-500 p-1"><Smile className="w-5 h-5" /></button>
                </div>

                <div className="flex items-center min-w-[40px] justify-center shrink-0">
                  {inputText.trim().length > 0 ? (
                    <button onClick={() => handleSend()} className="p-2 bg-blue-600 rounded-full shadow-lg transform scale-110"><Send className="w-4 h-4 text-white fill-current" /></button>
                  ) : (
                    /* Heart Icon: Remains red but ensure outline is crisp */
                    <button onClick={() => handleSend("❤️")} className="p-2 text-red-500 hover:scale-125 transition-transform"><Heart className="w-6 h-6 fill-current shadow-sm" /></button>
                  )}
                </div>
              </div>
              {isRecording && <p className="text-[10px] text-red-500 font-bold ml-12 mt-1 uppercase tracking-widest animate-pulse">Recording...</p>}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-600 bg-white dark:bg-black font-bold uppercase tracking-widest opacity-50">
             <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-900 rounded-3xl flex items-center justify-center mb-4 border border-zinc-200 dark:border-zinc-800 shadow-sm"><span className="text-2xl">💬</span></div>
             <p className="text-sm">Select a chat</p>
          </div>
        )}
      </div>
    </div>
  );
}
