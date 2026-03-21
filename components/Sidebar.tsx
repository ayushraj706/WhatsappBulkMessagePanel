"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { logout } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { 
  LayoutDashboard, Send, LogOut, MessageSquare, 
  MessageCircle, X, Sun, Moon, Monitor 
} from "lucide-react";

export default function Sidebar({ onClose }: { onClose?: () => void }) {
    const pathname = usePathname();
    const router = useRouter();
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [flash, setFlash] = useState(false); // Aajib effect ke liye state

    useEffect(() => { setMounted(true); }, []);

    // Theme badalne par "Flash" dene wala function
    const changeTheme = (newTheme: string) => {
        setTheme(newTheme);
        setFlash(true);
        setTimeout(() => setFlash(false), 400); // 0.4 second ka flash
    };

    if (!mounted) return null;

    return (
        <div className="h-full w-full bg-white dark:bg-[#09090b] border-r border-zinc-200 dark:border-zinc-800 flex flex-col transition-all duration-500 relative overflow-hidden">
            
            {/* AAJIB FLASH OVERLAY: Click par chamkega */}
            {flash && (
                <div className="absolute inset-0 bg-white dark:bg-zinc-100 opacity-20 z-50 animate-out fade-out duration-300 pointer-events-none" />
            )}

            {/* Logo Section */}
            <div className="p-6 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/20">
                        <MessageSquare className="w-6 h-6 text-white" />
                    </div>
                    <h1 className="text-xl font-bold text-zinc-900 dark:text-white">WaBulk</h1>
                </div>
                <button onClick={onClose} className="md:hidden p-2 text-zinc-500"><X /></button>
            </div>

            {/* Menu Section */}
            <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
                {[
                    { icon: LayoutDashboard, label: "Dashboard", href: "/" },
                    { icon: Send, label: "Broadcast", href: "/broadcast" },
                    { icon: MessageCircle, label: "Chat", href: "/chat" }, 
                ].map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={onClose}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                                isActive
                                    ? "bg-green-500 text-white shadow-md shadow-green-500/20"
                                    : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                            )}
                        >
                            <Icon className="w-5 h-5" />
                            <span className="font-medium text-sm">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* THEME SETTING BAR: Sleek & Clicky */}
            <div className="p-4 mx-4 mb-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 shrink-0">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3 ml-1 text-left">Appearance</p>
                <div className="flex items-center justify-between bg-white dark:bg-black p-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800">
                    
                    <button 
                        onClick={() => changeTheme("light")}
                        className={cn(
                            "flex-1 p-2 rounded-lg transition-all flex justify-center items-center gap-2",
                            theme === "light" ? "bg-zinc-100 text-orange-500 shadow-inner scale-105" : "text-zinc-400 hover:scale-110"
                        )}
                    >
                        <Sun className="w-4 h-4" />
                    </button>

                    <button 
                        onClick={() => changeTheme("dark")}
                        className={cn(
                            "flex-1 p-2 rounded-lg transition-all flex justify-center items-center gap-2",
                            theme === "dark" ? "bg-zinc-800 text-blue-400 shadow-inner scale-105" : "text-zinc-400 hover:scale-110"
                        )}
                    >
                        <Moon className="w-4 h-4" />
                    </button>

                    <button 
                        onClick={() => changeTheme("system")}
                        className={cn(
                            "flex-1 p-2 rounded-lg transition-all flex justify-center items-center gap-2",
                            theme === "system" ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-inner scale-105" : "text-zinc-400 hover:scale-110"
                        )}
                    >
                        <Monitor className="w-4 h-4" />
                    </button>
                </div>

                {/* STATUS BAR: Ye humein batayega ki logic chal raha hai ya nahi */}
                <div className="mt-3 px-2 py-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg text-[9px] font-mono text-zinc-600 dark:text-zinc-400 flex justify-between uppercase">
                    <span>Engine: Active</span>
                    <span className="font-bold text-blue-500">{theme} Mode</span>
                </div>
            </div>

            <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
                <button onClick={logout} className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-zinc-500 hover:bg-red-50 hover:text-red-500 transition-all">
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium text-sm">Logout</span>
                </button>
            </div>
        </div>
    );
}
