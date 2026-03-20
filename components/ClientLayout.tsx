"use client";
import Sidebar from "@/components/Sidebar";
import BottomNav from "@/components/BottomNav";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { isAuthenticated } from "@/lib/auth";
import { cn } from "@/lib/utils";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [isAuth, setIsAuth] = useState(false);
    const [loading, setLoading] = useState(true);

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
        <div className="bg-black min-h-screen">
            {!isLoginPage && isAuth && (
                <>
                    <div className="hidden md:block">
                        <Sidebar />
                    </div>
                    {/* Chat page par BottomNav HATANA hai */}
                    {!isChatPage && <BottomNav />}
                </>
            )}
            <main
                className={cn(
                    "min-h-screen transition-all duration-300",
                    !isLoginPage && isAuth ? "md:ml-64" : "",
                    // Chat page par koi bottom padding nahi chahiye ab
                    !isChatPage && !isLoginPage && isAuth ? "p-4 md:p-8 pb-24 md:pb-8" : "p-0"
                )}
            >
                {children}
            </main>
        </div>
    );
}
