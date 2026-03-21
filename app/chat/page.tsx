"use client";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, updateDoc, doc } from "firebase/firestore";
import { ChatBubble, ChatBubbleMessage, ChatBubbleAvatar } from "@/components/ui/chat/chat-bubble";
import { ChatMessageList } from "@/components/ui/chat/chat-message-list";
import { ChevronLeft, Check, CheckCheck, Clock, X } from "lucide-react"; 
import { cn } from "@/lib/utils";
import { ChatInputBar } from "@/components/ChatInputBar";

export default function ModularMessengerChat() {
  const [messages, setMessages] = useState<any[]>([]);
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, "chats"), orderBy("timestamp", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  const handleSend = async (text: string, file: File | null) => {
    if (!selectedContact) return;
    try {
      const docRef = await addDoc(collection(db, "chats"), {
        text, imageUrl: "", status: "sending", sender: "Me", receiver: selectedContact, type: "sent", timestamp: serverTimestamp(),
      });

      let finalMediaUrl = "";
      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        const data = await res.json();
        finalMediaUrl = data.url;
      }

      const metaRes = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: selectedContact, message: text, imageUrl: finalMediaUrl, type: finalMediaUrl ? "image" : "text" }),
      });

      const metaData = await metaRes.json();
      if (metaRes.ok && metaData.messages?.[0]?.id) {
          await updateDoc(doc(db, "chats", docRef.id), { imageUrl: finalMediaUrl, metaId: metaData.messages[0].id, status: "sent" });
      }
    } catch (err) { console.error(err); }
  };

  const handleVoiceSend = async (blob: Blob) => {
    if (!selectedContact) return;
    try {
      const formData = new FormData();
      formData.append('file', blob, 'voice.ogg');
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.url) {
        const docRef = await addDoc(collection(db, "chats"), {
          text: "🎤 Voice Note", audioUrl: data.url, status: "sending", sender: "Me", receiver: selectedContact, type: "sent", timestamp: serverTimestamp(),
        });
        const metaRes = await fetch("/api/whatsapp/send", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ to: selectedContact, audioUrl: data.url, type: "audio" }),
        });
        const metaData = await metaRes.json();
        if (metaData.messages?.[0]?.id) {
          await updateDoc(doc(db, "chats", docRef.id), { metaId: metaData.messages[0].id, status: "sent" });
        }
      }
    } catch (err) { console.error(err); }
  };

  return (
    <div className="flex h-full w-full bg-white dark:bg-[#050505] text-black dark:text-white overflow-hidden">
      {/* Sidebar logic same rahegi... */}
      <div className={cn("w-full md:w-80 border-r border-zinc-200 dark:border-zinc-900 flex flex-col shrink-0", selectedContact ? "hidden md:flex" : "flex")}>
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-900 font-bold text-xl tracking-tight">Messages</div>
        <div className="flex-1 overflow-y-auto">
          {Array.from(new Set(messages.map(m => m.sender))).filter(s => s !== "Me").map((num) => (
            <div key={num} onClick={() => setSelectedContact(num)} className="p-4 flex items-center gap-3 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900 border-b dark:border-zinc-900/40">
              <ChatBubbleAvatar fallback={String(num).slice(-2)} className="h-12 w-12" />
              <div className="text-left font-bold text-sm">{num}</div>
            </div>
          ))}
        </div>
      </div>

      <div className={cn("flex-1 flex flex-col relative w-full", !selectedContact ? "hidden md:flex" : "flex")}>
        {selectedContact ? (
          <>
            {/* Header... */}
            <div className="h-14 border-b border-zinc-200 dark:border-zinc-900 bg-white/90 dark:bg-[#050505]/90 backdrop-blur-md flex items-center gap-3 px-4 z-40">
              <button onClick={() => setSelectedContact(null)} className="md:hidden"><ChevronLeft /></button>
              <span className="font-bold text-sm tracking-tight">{selectedContact}</span>
            </div>

            <div className="flex-1 overflow-y-auto bg-white dark:bg-[#050505] custom-scrollbar">
              <ChatMessageList className="p-4 space-y-2 pb-24">
                {messages.filter(m => (m.sender === selectedContact) || (m.type === "sent" && m.receiver === selectedContact)).map((msg) => (
                  <ChatBubble key={msg.id} variant={msg.type === "sent" ? "sent" : "received"}>
                    <ChatBubbleMessage className={cn(
                        "text-[15px] relative shadow-sm rounded-2xl",
                        msg.imageUrl ? "p-1 bg-zinc-100 dark:bg-zinc-900" : "px-4 py-2.5",
                        msg.type === "sent" ? "bg-blue-600 text-white" : "bg-zinc-100 dark:bg-zinc-900 text-black dark:text-white"
                    )}>
                      {msg.imageUrl && <img src={msg.imageUrl} className="max-w-[260px] max-h-[300px] object-cover rounded-xl cursor-pointer" onClick={() => setLightboxImage(msg.imageUrl)} />}
                      {msg.audioUrl && <div className="p-2 min-w-[180px]"><audio controls className="w-full h-8 invert dark:invert-0"><source src={msg.audioUrl} /></audio></div>}
                      {msg.text && <p className={cn("leading-tight", msg.imageUrl && "mt-1 px-2 pb-1")}>{msg.text}</p>}
                      {msg.type === "sent" && (
                        <div className="flex justify-end mt-0.5 -mr-1">
                          {msg.status === "sending" && <Clock className="w-3 h-3 opacity-60 animate-spin" />}
                          {msg.status === "sent" && <Check className="w-3.5 h-3.5 text-zinc-300" />}
                          {msg.status === "delivered" && <CheckCheck className="w-3.5 h-3.5 text-zinc-300" />}
                          {msg.status === "read" && <CheckCheck className="w-3.5 h-3.5 text-red-500 font-bold" />}
                        </div>
                      )}
                    </ChatBubbleMessage>
                  </ChatBubble>
                ))}
              </ChatMessageList>
            </div>

            {/* MODULAR INPUT BAR */}
            <ChatInputBar onSend={handleSend} onVoiceSend={handleVoiceSend} />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-zinc-400 opacity-30 font-bold uppercase tracking-[0.4em]">BaseKey Chat</div>
        )}
      </div>

      {lightboxImage && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-4">
           <button onClick={() => setLightboxImage(null)} className="absolute top-8 right-8 text-white p-3 rounded-full hover:bg-white/10"><X className="w-10 h-10" /></button>
           <img src={lightboxImage} alt="Fullscreen" className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl" />
        </div>
      )}
    </div>
  );
}
