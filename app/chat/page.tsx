"use client";
import { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, updateDoc, doc } from "firebase/firestore";
import { ChatBubble, ChatBubbleMessage, ChatBubbleAvatar } from "@/components/ui/chat/chat-bubble";
import { ChatMessageList } from "@/components/ui/chat/chat-message-list";
import { 
  Camera, ImageIcon, Paperclip, X,
  Mic, Send, ChevronLeft, ChevronRight, Square,
  Check, CheckCheck, Clock 
} from "lucide-react"; 
import { ChatInput } from "@/components/ui/chat/chat-input";
import { cn } from "@/lib/utils";

// PREMIUM BOLD ICONS
const MessengerSmile = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zM9 13a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm6 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm-3 5.5c-2.33 0-4.31-1.46-5.11-3.5h10.22c-.8 2.04-2.78 3.5-5.11 3.5z" /></svg>
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

  // Fixed Send Logic with Optimistic UI and Ticks
  const handleSend = async (customText?: string) => {
    const textToSend = typeof customText === "string" ? customText : inputText;
    if ((!textToSend.trim() && !selectedFile) || !selectedContact) return;
    
    setIsUploading(true);
    const tempFile = selectedFile;
    const tempPreview = previewUrl;

    // UI Reset
    setInputText("");
    setSelectedFile(null);
    setPreviewUrl(null);
    setShowIcons(true);

    try {
      // 1. Firebase mein turant gray photo dikhao (Optimistic UI)
      const docRef = await addDoc(collection(db, "chats"), {
        text: textToSend,
        imageUrl: tempPreview || "",
        status: "sending", // Clock icon dikhega
        sender: "Me",
        receiver: selectedContact,
        type: "sent",
        timestamp: serverTimestamp(),
      });

      let finalMediaUrl = "";
      if (tempFile) {
        const formData = new FormData();
        formData.append('file', tempFile);
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        const data = await res.json();
        finalMediaUrl = data.url;
      }

      // 2. WhatsApp Meta API ko bhejien
      const metaRes = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          to: selectedContact, 
          message: textToSend,
          imageUrl: finalMediaUrl,
          type: finalMediaUrl ? "image" : "text"
        }),
      });

      // 3. Status Update to Blue Ticks (CheckCheck icon)
      await updateDoc(doc(db, "chats", docRef.id), {
        imageUrl: finalMediaUrl,
        status: metaRes.ok ? "read" : "sent"
      });

    } catch (err) { console.error(err); }
    finally { setIsUploading(false); }
  };

  // MICROPHONE LOGIC
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      mediaRecorder.current = recorder;
      audioChunks.current = [];

      recorder.ondataavailable = (e) => audioChunks.current.push(e.data);
      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/ogg' });
        await uploadAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setIsRecording(true);
    } catch (err) { alert("Mic permission needed!"); }
  };

  const uploadAudio = async (blob: Blob) => {
    if (!selectedContact) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', blob, 'voice.ogg');
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();

      if (data.url) {
        await addDoc(collection(db, "chats"), {
          text: "🎤 Voice Note",
          audioUrl: data.url,
          status: "read", // Blue tick for voice
          sender: "Me",
          receiver: selectedContact,
          type: "sent",
          timestamp: serverTimestamp(),
        });
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
              <ChatBubbleAvatar fallback={String(num).slice(-2)} className="h-11 w-11 border border-zinc-200 dark:border-zinc-800" />
              <div className="text-left font-semibold text-sm">{num}</div>
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
              <span className="font-bold text-sm tracking-tight">{selectedContact}</span>
            </div>

            <div className="flex-1 overflow-y-auto w-full bg-white dark:bg-[#050505] custom-scrollbar">
              <ChatMessageList className="p-4 space-y-4 pb-24">
                {messages.filter(m => (m.sender === selectedContact) || (m.type === "sent" && m.receiver === selectedContact)).map((msg) => (
                  <ChatBubble key={msg.id} variant={msg.type === "sent" ? "sent" : "received"}>
                    {/* CLEAN MEDIA MESSAGE: Removed blue borders */}
                    <ChatBubbleMessage className={cn(
                        "text-[15px] px-4 py-2 rounded-2xl relative shadow-sm",
                        msg.type === "sent" ? "bg-blue-600 text-white" : "bg-zinc-100 dark:bg-zinc-900 text-black dark:text-white"
                    )}>
                      {msg.imageUrl && (
                        <div className={cn("mb-1 overflow-hidden rounded-xl", msg.status === "sending" && "opacity-40 grayscale")}>
                           <img src={msg.imageUrl} alt="media" className="max-w-[240px] h-auto cursor-pointer" onClick={() => window.open(msg.imageUrl, '_blank')} />
                        </div>
                      )}
                      {msg.audioUrl && <audio controls className="w-48 h-8 invert dark:invert-0 my-1"><source src={msg.audioUrl} /></audio>}
                      {msg.text && <p className="leading-tight">{msg.text}</p>}
                      
                      {/* TICKS STATUS */}
                      {msg.type === "sent" && (
                        <div className="flex justify-end mt-0.5 -mr-1">
                          {msg.status === "sending" && <Clock className="w-3 h-3 opacity-60 animate-spin" />}
                          {msg.status === "sent" && <Check className="w-3.5 h-3.5 opacity-60" />}
                          {msg.status === "read" && <CheckCheck className="w-3.5 h-3.5 text-blue-300" />}
                        </div>
                      )}
                    </ChatBubbleMessage>
                  </ChatBubble>
                ))}
              </ChatMessageList>
            </div>

            {/* INTERACTIVE INPUT BAR AREA */}
            <div className="pb-8 pt-2 pl-2 pr-4 bg-white dark:bg-[#050505] border-t border-zinc-200 dark:border-zinc-900 shrink-0 z-40 w-full transition-all">
              {previewUrl && (
                <div className="flex items-center gap-2 mb-3 ml-2 relative w-fit scale-in-center">
                   <img src={previewUrl} alt="preview" className="w-16 h-16 rounded-xl object-cover border border-blue-500/30" />
                   <button onClick={cancelSelection} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg"><X className="w-3 h-3"/></button>
                </div>
              )}

              <div className="flex items-center gap-1.5">
                {!isRecording && (
                  <div className={cn(
                    "flex items-center gap-0 text-black dark:text-white transition-all duration-300",
                    showIcons ? "w-auto opacity-100 visible" : "w-0 opacity-0 invisible overflow-hidden"
                  )}>
                    {/* SEPARATE MEDIA INPUTS */}
                    <button onClick={() => camRef.current?.click()} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition"><Camera className="w-6 h-6" /></button>
                    <button onClick={() => galleryRef.current?.click()} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition"><ImageIcon className="w-6 h-6" /></button>
                    <button onClick={() => fileRef.current?.click()} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition"><Paperclip className="w-6 h-6 rotate-45" /></button>
                  </div>
                )}

                <input type="file" ref={camRef} onChange={handleFileSelect} className="hidden" accept="image/*" capture="environment" />
                <input type="file" ref={galleryRef} onChange={handleFileSelect} className="hidden" accept="image/*,video/*" />
                <input type="file" ref={fileRef} onChange={handleFileSelect} className="hidden" accept="*" />

                {isRecording ? (
                  <div className="flex-1 flex items-center justify-between bg-red-50 dark:bg-red-950/20 px-4 py-2 rounded-full border border-red-200 dark:border-red-900/50">
                    <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 bg-red-600 rounded-full animate-ping" /><span className="text-red-600 font-mono font-bold text-sm">{formatTime(recordingSeconds)}s</span></div>
                    <button onClick={stopRecording} className="text-red-600 font-bold text-xs"><Square className="w-4 h-4 inline mr-1" /> STOP</button>
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
                    <div className="flex-1 flex items-center bg-zinc-100 dark:bg-zinc-900 rounded-[24px] px-4 py-1.5 border border-transparent focus-within:ring-1 ring-zinc-300 dark:ring-zinc-800 transition-all shadow-inner ml-1">
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
                        className="h-10 text-black dark:text-white"
                      />
                      <button className="text-zinc-500 p-1.5 hover:scale-110 active:scale-90 transition-transform"><MessengerSmile /></button>
                    </div>
                  </>
                )}

                <div className="flex items-center min-w-[48px] justify-center shrink-0">
                  {!isRecording && (
                    <>
                      {inputText.trim().length > 0 || selectedFile ? (
                        <button onClick={() => handleSend()} disabled={isUploading} className={cn("p-2.5 bg-blue-600 rounded-full shadow-lg active:scale-95 transition-all", isUploading && "opacity-50")}>
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
                    </>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-zinc-400 opacity-30 font-bold uppercase tracking-[0.4em]">BaseKey Chat</div>
        )}
      </div>
    </div>
  );
                        }
