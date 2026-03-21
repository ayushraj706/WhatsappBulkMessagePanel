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

interface SidebarProps {
    onClose?: () => void;
}

const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/" },
    { icon: Send, label: "Broadcast", href: "/broadcast" },
    { icon: MessageCircle, label: "Chat", href: "/chat" }, 
];

export default function Sidebar({ onClose }: SidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    // 1. Hydration mismatch aur click issues rokne ke liye
    useEffect(() => {
        setMounted(true);
    }, []);

    const handleLogout = () => {
        logout();
        router.push("/login");
    };

    return (
        <div className="h-full w-full bg-white dark:bg-black border-r border-zinc-200 dark:border-zinc-800 flex flex-col transition-colors duration-300">
            {/* Logo Section */}
            <div className="p-6 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                        <MessageSquare className="w-6 h-6 text-white" />
                    </div>
                    <h1 className="text-xl font-bold text-zinc-900 dark:text-white">WaBulk</h1>
                </div>
                <button onClick={onClose} className="md:hidden p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">
                    <X className="w-6 h-6" />
                </button>
            </div>

            {/* Menu Section */}
            <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={onClose}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                                isActive
                                    ? "bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20"
                                    : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                            )}
                        >
                            <Icon className={cn("w-5 h-5", isActive ? "text-green-600 dark:text-green-400" : "text-zinc-400 group-hover:text-zinc-600")} />
                            <span className="font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* THEME SETTING BAR (Fixed Selection Logic) */}
            <div className="p-4 mx-4 mb-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 shrink-0">
                <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-3 ml-1">Theme Settings</p>
                <div className="flex items-center justify-between bg-white dark:bg-black p-1 rounded-xl border border-zinc-200 dark:border-zinc-800">
                    
                    {/* Buttons tabhi render honge jab component mount ho jaye */}
                    {mounted ? (
                        <>
                            <button 
                                type="button"
                                onClick={() => setTheme("light")}
                                className={cn(
                                    "flex-1 p-2 rounded-lg transition-all flex justify-center items-center",
                                    theme === "light" 
                                        ? "bg-zinc-100 dark:bg-zinc-800 text-orange-500 shadow-inner scale-105" 
                                        : "text-zinc-400 hover:text-zinc-600"
                                )}
                            >
                                <Sun className="w-4 h-4" />
                            </button>

                            <button 
                                type="button"
                                onClick={() => setTheme("dark")}
                                className={cn(
                                    "flex-1 p-2 rounded-lg transition-all flex justify-center items-center",
                                    theme === "dark" 
                                        ? "bg-zinc-100 dark:bg-zinc-800 text-blue-400 shadow-inner scale-105" 
                                        : "text-zinc-400 hover:text-zinc-600"
                                )}
                            >
                                <Moon className="w-4 h-4" />
                            </button>

                            <button 
                                type="button"
                                onClick={() => setTheme("system")}
                                className={cn(
                                    "flex-1 p-2 rounded-lg transition-all flex justify-center items-center",
                                    theme === "system" 
                                        ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-inner scale-105" 
                                        : "text-zinc-400 hover:text-zinc-600"
                                )}
                            >
                                <Monitor className="w-4 h-4" />
                            </button>
                        </>
                    ) : (
                        <div className="h-8 w-full animate-pulse bg-zinc-100 dark:bg-zinc-900 rounded-lg" />
                    )}
                </div>
            </div>

            {/* Logout Section */}
            <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 shrink-0">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-zinc-500 hover:bg-red-500/10 hover:text-red-500 transition-all duration-200 group"
                >
                    <LogOut className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    <span className="font-medium">Logout</span>
                </button>
            </div>
        </div>
    );
}
