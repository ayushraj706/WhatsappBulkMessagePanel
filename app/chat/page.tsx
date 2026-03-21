"use client";
import { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import { ChatBubble, ChatBubbleMessage, ChatBubbleAvatar, ChatBubbleTimestamp } from "@/components/ui/chat/chat-bubble";
import { ChatMessageList } from "@/components/ui/chat/chat-message-list";
import { 
  Camera, ImageIcon, Paperclip, X,
  Mic, Send, ChevronLeft, ChevronRight, Square
} from "lucide-react"; 
import { ChatInput } from "@/components/ui/chat/chat-input";
import { cn } from "@/lib/utils";

// PREMIUM BOLD ICONS
const MessengerSmile = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
    <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zM9 13a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm6 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm-3 5.5c-2.33 0-4.31-1.46-5.11-3.5h10.22c-.8 2.04-2.78 3.5-5.11 3.5z" />
  </svg>
);

const MessengerHeart = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
  </svg>
);

export default function UltimateMessengerChat() {
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [showIcons, setShowIcons] = useState(true);
  
  // Media & Upload States
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Mic Logic States
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const camRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const q = query(collection(db, "chats"), orderBy("timestamp", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  // Recording Timer
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => setRecordingSeconds(s => s + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setRecordingSeconds(0);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isRecording]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setShowIcons(false);
    }
  };

  const cancelSelection = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setShowIcons(inputText.length === 0);
  };

  // Fixed Send Logic (Fixed TypeScript Error)
  const handleSend = async (customText?: string) => {
    const textToSend = typeof customText === "string" ? customText : inputText;
    if ((!textToSend.trim() && !selectedFile) || !selectedContact) return;
    
    setIsUploading(true);
    let finalImageUrl = "";

    try {
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        const data = await res.json();
        finalImageUrl = data.url;
      }

      await addDoc(collection(db, "chats"), {
        text: textToSend,
        imageUrl: finalImageUrl,
        sender: "Me",
        receiver: selectedContact,
        type: "sent",
        timestamp: serverTimestamp(),
      });

      await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          to: selectedContact, 
          message: textToSend,
          imageUrl: finalImageUrl,
          type: finalImageUrl ? "image" : "text"
        }),
      });

      setInputText("");
      cancelSelection();
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  // MICROPHONE LOGIC
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorder.current = recorder;
      audioChunks.current = [];

      recorder.ondataavailable = (e) => audioChunks.current.push(e.data);
      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
        await uploadAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setIsRecording(true);
    } catch (err) {
      alert("Mic permission needed!");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      setIsRecording(false);
    }
  };

  const uploadAudio = async (blob: Blob) => {
    if (!selectedContact) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', blob, 'voice-note.webm');

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();

      if (data.url) {
        await addDoc(collection(db, "chats"), {
          text: "🎤 Voice Note",
          audioUrl: data.url,
          sender: "Me",
          receiver: selectedContact,
          type: "sent",
          timestamp: serverTimestamp(),
        });

        // WhatsApp Audio Send
        await fetch("/api/whatsapp/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ to: selectedContact, audioUrl: data.url, type: "audio" }),
        });
      }
    } catch (err) { console.error(err); }
    finally { setIsUploading(false); }
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="flex h-full w-full max-w-full bg-white dark:bg-[#050505] text-black dark:text-white overflow-hidden transition-colors duration-500">
      
      {/* 1. Sidebar */}
      <div className={cn(
        "w-full md:w-80 border-r border-zinc-200 dark:border-zinc-900 flex flex-col bg-white dark:bg-[#050505] shrink-0",
        selectedContact ? "hidden md:flex" : "flex"
      )}>
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-900 font-bold text-xl">Messages</div>
        <div className="flex-1 overflow-y-auto">
          {Array.from(new Set(messages.map(m => m.sender))).filter(s => s !== "Me").map((num) => (
            <div key={num} onClick={() => setSelectedContact(num)} className="p-4 flex items-center gap-3 cursor-pointer border-b border-zinc-100 dark:border-zinc-900/50 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors">
              <ChatBubbleAvatar fallback={String(num).slice(-2)} className="h-12 w-12 border-2 border-zinc-200 dark:border-zinc-800" />
              <div className="text-left"><p className="font-bold text-sm">{num}</p><p className="text-[10px] text-green-500 font-bold">ONLINE</p></div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Chat Window */}
      <div className={cn("flex-1 flex flex-col bg-white dark:bg-[#050505] relative w-full", !selectedContact ? "hidden md:flex" : "flex")}>
        {selectedContact ? (
          <>
            <div className="h-14 border-b border-zinc-200 dark:border-zinc-900 bg-white/95 dark:bg-[#050505]/95 backdrop-blur-md flex items-center gap-3 px-4 shrink-0 z-40 w-full transition-colors">
              <button onClick={() => setSelectedContact(null)} className="md:hidden"><ChevronLeft /></button>
              <div className="flex flex-col"><span className="font-bold text-sm tracking-tight">{selectedContact}</span><span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">BaseKey Verified</span></div>
            </div>

            <div className="flex-1 overflow-y-auto w-full bg-white dark:bg-[#050505] custom-scrollbar">
              <ChatMessageList className="p-4 pr-6 space-y-6 min-h-full pb-24">
                {messages.filter(m => (m.sender === selectedContact) || (m.type === "sent" && m.receiver === selectedContact)).map((msg) => (
                  <ChatBubble key={msg.id} variant={msg.type === "sent" ? "sent" : "received"}>
                    <ChatBubbleMessage className={cn(
                        "text-[15px] px-4 py-2.5 rounded-2xl shadow-sm",
                        msg.type === "sent" ? "bg-blue-600 text-white" : "bg-zinc-100 dark:bg-zinc-900 text-black dark:text-white border dark:border-zinc-800/50"
                    )}>
                      {msg.imageUrl && (
                        <img src={msg.imageUrl} alt="media" className="rounded-lg max-w-[220px] h-auto mb-2 cursor-pointer" onClick={() => window.open(msg.imageUrl, '_blank')} />
                      )}
                      {msg.audioUrl && (
                        <audio controls className="w-48 h-8 invert dark:invert-0"><source src={msg.audioUrl} type="audio/webm" /></audio>
                      )}
                      {msg.text && <p className="leading-tight">{msg.text}</p>}
                      <ChatBubbleTimestamp timestamp="Just now" className="text-[9px] mt-1 opacity-50 block font-bold" />
                    </ChatBubbleMessage>
                  </ChatBubble>
                ))}
              </ChatMessageList>
            </div>

            {/* INTERACTIVE INPUT BAR AREA */}
            <div className="pb-8 pt-2 pl-2 pr-4 bg-white dark:bg-[#050505] border-t border-zinc-200 dark:border-zinc-900 shrink-0 z-40 w-full">
              
              {previewUrl && (
                <div className="flex items-center gap-2 mb-3 ml-2 relative w-fit scale-in-center">
                   <img src={previewUrl} alt="preview" className="w-20 h-20 rounded-2xl object-cover border-2 border-blue-500 shadow-xl" />
                   <button onClick={cancelSelection} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg"><X className="w-3 h-3"/></button>
                </div>
              )}

              <div className="flex items-center gap-1.5">
                {!isRecording && (
                  <div className={cn(
                    "flex items-center gap-0 text-black dark:text-white transition-all duration-300",
                    showIcons ? "w-auto opacity-100 visible" : "w-0 opacity-0 invisible"
                  )}>
                    <button onClick={() => camRef.current?.click()} className="p-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full"><Camera className="w-6 h-6" /></button>
                    <button onClick={() => galleryRef.current?.click()} className="p-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full"><ImageIcon className="w-6 h-6" /></button>
                    <button onClick={() => fileRef.current?.click()} className="p-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full"><Paperclip className="w-6 h-6 rotate-45" /></button>
                  </div>
                )}

                <input type="file" ref={camRef} onChange={handleFileSelect} className="hidden" accept="image/*" capture="environment" />
                <input type="file" ref={galleryRef} onChange={handleFileSelect} className="hidden" accept="image/*,video/*" />
                <input type="file" ref={fileRef} onChange={handleFileSelect} className="hidden" accept="*" />

                {/* MIC RECORDING UI */}
                {isRecording ? (
                  <div className="flex-1 flex items-center justify-between bg-red-50 dark:bg-red-950/20 px-4 py-2 rounded-full border border-red-200 dark:border-red-900/50 animate-pulse">
                    <div className="flex items-center gap-2">
                       <div className="w-2.5 h-2.5 bg-red-600 rounded-full animate-ping" />
                       <span className="text-red-600 font-mono font-bold text-sm">{formatTime(recordingSeconds)}</span>
                    </div>
                    <button onClick={stopRecording} className="text-red-600 font-black text-xs uppercase tracking-tighter flex items-center gap-1">
                      <Square className="w-4 h-4 fill-current" /> STOP
                    </button>
                  </div>
                ) : (
                  <>
                    <button 
                        onMouseDown={(e) => { e.preventDefault(); setShowIcons(!showIcons); }}
                        className={cn(
                            "transition-all duration-300 shrink-0 p-2 flex items-center justify-center",
                            !showIcons && !previewUrl ? "w-10 opacity-100 visible" : "w-0 opacity-0 invisible overflow-hidden"
                        )}
                    >
                        <ChevronRight className="w-7 h-7 text-blue-500" />
                    </button>

                    {/* ULTRA LONG PILL */}
                    <div className="flex-1 flex items-center bg-zinc-100 dark:bg-zinc-900 rounded-[24px] px-4 py-1.5 border border-transparent focus-within:border-zinc-300 dark:focus-within:border-zinc-800 transition-all shadow-inner">
                      <ChatInput 
                        ref={inputRef}
                        placeholder="Aa" 
                        value={inputText}
                        onChange={(e) => {
                          setInputText(e.target.value);
                          if (e.target.value.length > 0) setShowIcons(false);
                          else if (!previewUrl) setShowIcons(true);
                        }}
                        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                        className="h-10 text-black dark:text-white text-[16px]"
                      />
                      <button className="text-black dark:text-zinc-400 p-1 hover:scale-110"><MessengerSmile /></button>
                    </div>
                  </>
                )}

                <div className="flex items-center min-w-[48px] justify-center shrink-0">
                  {isRecording ? null : (inputText.trim().length > 0 || selectedFile) ? (
                    <button onClick={() => handleSend()} disabled={isUploading} className={cn("p-3 bg-blue-600 rounded-full shadow-lg transform active:scale-90 transition-all", isUploading && "opacity-50")}>
                      <Send className="w-5 h-5 text-white fill-current" />
                    </button>
                  ) : (
                    <div className="flex items-center">
                      <button onClick={startRecording} className="p-2.5 text-black dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-full transition-all">
                        <Mic className="w-6 h-6" />
                      </button>
                      <button onClick={() => handleSend("❤️")} className="p-2.5 transition-all text-black dark:text-red-500 hover:scale-125">
                        <MessengerHeart className="w-7 h-7" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-800 font-black uppercase tracking-[0.4em] opacity-30">Select a chat</div>
        )}
      </div>
    </div>
  );
}
