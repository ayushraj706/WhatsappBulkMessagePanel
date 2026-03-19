"use client";

import Sidebar from "@/components/Sidebar";
import BottomNav from "@/components/BottomNav";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { isAuthenticated } from "@/lib/auth";
import { cn } from "@/lib/utils";

export default function ClientLayout({
    children,
}: {
    children: React.ReactNode;
}) {
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
    const isChatPage = pathname === "/chat"; // Chat page check

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <>
            {!isLoginPage && isAuth && (
                <>
                    <div className="hidden md:block">
                        <Sidebar />
                    </div>
                    <BottomNav />
                </>
            )}
            <main
                className={cn(
                    "min-h-screen transition-all duration-300",
                    // Agar chat page hai toh padding aur extra margin hata do
                    !isLoginPage && isAuth ? "md:ml-64" : "",
                    !isChatPage && !isLoginPage && isAuth ? "p-4 md:p-8 pb-24 md:pb-8" : "",
                    isChatPage ? "pb-16 md:pb-0" : "" // Mobile nav ke liye space
                )}
            >
                {isLoginPage || isAuth ? children : null}
            </main>
        </>
    );
}
