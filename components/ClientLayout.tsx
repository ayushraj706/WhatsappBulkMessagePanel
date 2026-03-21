"use client";
import Sidebar from "@/components/Sidebar";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { isAuthenticated } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { Menu } from "lucide-react";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [isAuth, setIsAuth] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isMainSidebarOpen, setIsMainSidebarOpen] = useState(false);

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
        // 100dvh ensures nothing is cut off at the bottom
        <div className="bg-black h-[100dvh] w-full text-white overflow-hidden flex flex-col relative">
            {!isLoginPage && isAuth && (
                <>
                    {/* Main Sidebar */}
                    <div className={cn(
                        "fixed inset-y-0 left-0 z-[100] w-64 bg-black border-r border-zinc-800 transition-transform duration-300 md:translate-x-0",
                        isMainSidebarOpen ? "translate-x-0" : "-translate-x-full"
                    )}>
                        <Sidebar onClose={() => setIsMainSidebarOpen(false)} />
                    </div>
                    
                    {/* Global Top Header */}
                    <div className="h-14 bg-black border-b border-zinc-800 flex items-center px-4 shrink-0 z-40 md:ml-64 transition-all">
                        <button onClick={() => setIsMainSidebarOpen(true)} className="md:hidden p-2 -ml-2">
                            <Menu className="w-6 h-6 text-zinc-400" />
                        </button>
                        <span className="ml-2 font-bold text-sm tracking-tight">BaseKey Panel</span>
                    </div>

                    {/* Overlay */}
                    {isMainSidebarOpen && (
                        <div className="fixed inset-0 bg-black/60 z-[90] md:hidden" onClick={() => setIsMainSidebarOpen(false)} />
                    )}
                </>
            )}

            <main className={cn(
                "flex-1 flex flex-col min-h-0 overflow-hidden",
                !isLoginPage && isAuth ? "md:ml-64" : ""
            )}>
                {children}
            </main>
        </div>
    );
}
