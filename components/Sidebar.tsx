"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { logout } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Send, LogOut, MessageSquare, MessageCircle, X } from "lucide-react";

// 1. Sidebar ke liye Props define karein (Build error fix ke liye)
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

    const handleLogout = () => {
        logout();
        router.push("/login");
    };

    return (
        // Maine isse 'fixed' hata diya hai kyunki ClientLayout ise wrap kar raha hai
        <div className="h-full w-full bg-black border-r border-zinc-800 flex flex-col">
            <div className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-900/20">
                        <MessageSquare className="w-6 h-6 text-white" />
                    </div>
                    <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                        WaBulk
                    </h1>
                </div>

                {/* Mobile par Sidebar band karne ka button */}
                <button 
                    onClick={onClose} 
                    className="md:hidden p-2 text-zinc-500 hover:text-white transition-colors"
                >
                    <X className="w-6 h-6" />
                </button>
            </div>

            <nav className="flex-1 px-4 py-6 space-y-2">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            // Jab mobile par kisi menu par click ho, toh sidebar band ho jaye
                            onClick={onClose}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                                isActive
                                    ? "bg-green-500/10 text-green-400 shadow-sm border border-green-500/20"
                                    : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
                            )}
                        >
                            <Icon className={cn("w-5 h-5 transition-colors", isActive ? "text-green-400" : "text-zinc-500 group-hover:text-zinc-300")} />
                            <span className="font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-zinc-800">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-zinc-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 group"
                >
                    <LogOut className="w-5 h-5 group-hover:text-red-400 transition-colors" />
                    <span className="font-medium">Logout</span>
                </button>
            </div>
        </div>
    );
}
