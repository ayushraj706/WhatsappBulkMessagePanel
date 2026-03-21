"use client";
import { useState, useRef } from "react";
import { Camera, ImageIcon, Plus, Mic, Send, X, Square } from "lucide-react";
import { ChatInput } from "@/components/ui/chat/chat-input";
import { cn } from "@/lib/utils";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";

// Icons
const MessengerSmile = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zM9 13a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm6 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm-3 5.5c-2.33 0-4.31-1.46-5.11-3.5h10.22c-.8 2.04-2.78 3.5-5.11 3.5z" /></svg>
);
const MessengerHeart = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
);

interface Props {
  onSend: (text: string, file: File | null) => Promise<void>;
  onVoiceSend: (blob: Blob) => Promise<void>;
}

export function ChatInputBar({ onSend, onVoiceSend }: Props) {
  const [inputText, setInputText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showIcons, setShowIcons] = useState(true);

  const camRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setShowIcons(false);
    }
  };

  const handleActionSend = async () => {
    await onSend(inputText, selectedFile);
    setInputText("");
    setSelectedFile(null);
    setPreviewUrl(null);
    setShowIcons(true);
  };

  const { isRecording, recordingSeconds, startRecording, stopRecording } = useVoiceRecorder(onVoiceSend);

  return (
    <div className="pb-8 pt-2 px-4 bg-white dark:bg-[#050505] border-t border-zinc-200 dark:border-zinc-900 shrink-0 z-40 w-full">
      {previewUrl && (
        <div className="flex items-center gap-2 mb-3 relative w-fit">
          <img src={previewUrl} alt="preview" className="w-16 h-16 rounded-xl object-cover border-2 border-blue-500 shadow-xl" />
          <button onClick={() => {setSelectedFile(null); setPreviewUrl(null); setShowIcons(true);}} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg"><X className="w-3 h-3"/></button>
        </div>
      )}

      <div className="flex items-center gap-2">
        {!isRecording && (
          <div className={cn("flex items-center transition-all duration-300", showIcons ? "w-auto opacity-100" : "w-0 opacity-0 invisible overflow-hidden")}>
            <button onClick={() => camRef.current?.click()} className="p-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-transform active:scale-90"><Camera className="w-6 h-6" /></button>
            <button onClick={() => galleryRef.current?.click()} className="p-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-transform active:scale-90"><ImageIcon className="w-6 h-6" /></button>
          </div>
        )}
        <input type="file" ref={camRef} onChange={handleFileSelect} className="hidden" accept="image/*" capture="environment" />
        <input type="file" ref={galleryRef} onChange={handleFileSelect} className="hidden" accept="image/*,video/*" />

        {isRecording ? (
          <div className="flex-1 flex items-center justify-between bg-red-50 dark:bg-red-950/20 px-4 py-2 rounded-full border border-red-200 dark:border-red-900/50">
            <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 bg-red-600 rounded-full animate-ping" /><span className="text-red-600 font-mono font-bold text-sm">{recordingSeconds}s</span></div>
            <button onClick={stopRecording} className="text-red-600 font-bold text-xs uppercase">STOP</button>
          </div>
        ) : (
          <div className="flex-1 flex items-center bg-zinc-100 dark:bg-zinc-900 rounded-[28px] px-2 py-1.5 focus-within:ring-1 ring-zinc-300 dark:ring-zinc-800 transition-all ml-1">
            <button className="p-2 text-zinc-500 hover:text-zinc-800 dark:hover:text-white transition-colors"><Plus className="w-6 h-6" /></button>
            <ChatInput placeholder="Aa" value={inputText} onChange={(e) => { setInputText(e.target.value); setShowIcons(e.target.value.length === 0); }} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleActionSend(); } }} className="h-10 text-black dark:text-white" />
            <button className="text-zinc-500 p-1.5 hover:scale-110 active:scale-90 transition-transform"><MessengerSmile /></button>
          </div>
        )}

        <div className="shrink-0 flex items-center min-w-[48px] justify-center">
          {!isRecording && (
            <>
              {inputText.trim().length > 0 || selectedFile ? (
                <button onClick={handleActionSend} className="p-3 bg-blue-600 rounded-full shadow-lg active:scale-90 transition-all"><Send className="w-5 h-5 text-white" /></button>
              ) : (
                <div className="flex items-center">
                  <button onClick={startRecording} className="p-2.5 text-black dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-full transition-all"><Mic className="w-6 h-6" /></button>
                  <button onClick={() => onSend("❤️", null)} className="p-2.5 transition-all text-black dark:text-red-500 hover:scale-125"><MessengerHeart className="w-7 h-7" /></button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

