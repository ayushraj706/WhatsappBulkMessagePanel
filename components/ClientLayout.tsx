"use client";
import Sidebar from "@/components/Sidebar";
import BottomNav from "@/components/BottomNav";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { isAuthenticated } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { Menu } from "lucide-react"; // Hamburger ke liye

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [isAuth, setIsAuth] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isMainSidebarOpen, setIsMainSidebarOpen] = useState(false); // Sidebar control logic

    useEffect(() => {
        const checkAuth = () => {
            const auth = isAuthenticated();
            if (!auth && pathname !== "/login") {
                router.push("/login");
            } else if (auth && pathname === "/login") {
                router.push("/");
            }
            setIsAuth(auth);
            setLoading(false);
        };
        checkAuth();
    }, [pathname, router]);

    const isLoginPage = pathname === "/login";
    const isChatPage = pathname === "/chat";

    if (loading) return null;

    return (
        <div className="bg-black min-h-[100dvh] text-white overflow-hidden">
            {!isLoginPage && isAuth && (
                <>
                    {/* Main Sidebar - Mobile par Overlay ban jayega */}
                    <div className={cn(
                        "fixed inset-y-0 left-0 z-[100] w-64 bg-black border-r border-zinc-800 transition-transform duration-300 md:translate-x-0",
                        isMainSidebarOpen ? "translate-x-0" : "-translate-x-full"
                    )}>
                        <Sidebar onClose={() => setIsMainSidebarOpen(false)} />
                    </div>
                    
                    {/* Overlay for mobile sidebar */}
                    {isMainSidebarOpen && (
                        <div 
                            className="fixed inset-0 bg-black/60 z-[90] md:hidden" 
                            onClick={() => setIsMainSidebarOpen(false)}
                        />
                    )}

                    {/* Desktop Sidebar spacing logic */}
                    <div className="hidden md:block w-64 fixed inset-y-0 left-0" />
                </>
            )}

            {/* Header with 3 Lines for Chat Page */}
            {isChatPage && (
                <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-black border-b border-zinc-800 flex items-center px-4 z-40">
                    <button onClick={() => setIsMainSidebarOpen(true)}>
                        <Menu className="w-6 h-6 text-zinc-400" />
                    </button>
                    <span className="ml-4 font-bold">BaseKey</span>
                </div>
            )}

            <main className={cn(
                "min-h-[100dvh] transition-all duration-300",
                !isLoginPage && isAuth ? "md:ml-64" : "",
                isChatPage ? "pt-14 md:pt-0" : "p-4" 
            )}>
                {children}
            </main>
        </div>
    );
}
