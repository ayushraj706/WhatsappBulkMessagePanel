"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { logout } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Send, LogOut, MessageSquare, MessageCircle } from "lucide-react";

// Yahan maine "Chat" jor diya hai
const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/" },
    { icon: Send, label: "Broadcast", href: "/broadcast" },
    { icon: MessageCircle, label: "Chat", href: "/chat" }, 
];

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = () => {
        logout();
        router.push("/login");
    };

    return (
        <div className="h-screen w-64 bg-gray-900 border-r border-gray-800 flex flex-col fixed left-0 top-0 z-50">
            <div className="p-6 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-900/20">
                    <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                    WaBulk
                </h1>
            </div>

            <nav className="flex-1 px-4 py-6 space-y-2">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                                isActive
                                    ? "bg-green-500/10 text-green-400 shadow-sm border border-green-500/20"
                                    : "text-gray-400 hover:bg-gray-800 hover:text-gray-100"
                            )}
                        >
                            <Icon className={cn("w-5 h-5 transition-colors", isActive ? "text-green-400" : "text-gray-500 group-hover:text-gray-300")} />
                            <span className="font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-gray-800">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 group"
                >
                    <LogOut className="w-5 h-5 group-hover:text-red-400 transition-colors" />
                    <span className="font-medium">Logout</span>
                </button>
            </div>
        </div>
    );
}
