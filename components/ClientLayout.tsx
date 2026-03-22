"use client";

import Sidebar from "@/components/Sidebar";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { isAuthenticated } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { Menu } from "lucide-react";

// --- NATIVE CAPACITOR IMPORTS ---
import { PushNotifications } from "@capacitor/push-notifications";
import { Device } from "@capacitor/device";
import { Geolocation } from "@capacitor/geolocation";
import { Camera } from "@capacitor/camera";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [isAuth, setIsAuth] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isMainSidebarOpen, setIsMainSidebarOpen] = useState(false);

    useEffect(() => {
        // 1. Authentication Logic
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

        // 2. ASALI ANDROID PERMISSIONS & REGISTRATION
        const initNativeApp = async () => {
            const info = await Device.getInfo();
            
            // Ye logic sirf Android/iOS App par chalegi, browser par nahi
            if (info.platform !== 'web') {
                try {
                    // A. Notification Permission
                    let pushPerm = await PushNotifications.checkPermissions();
                    if (pushPerm.receive !== 'granted') {
                        pushPerm = await PushNotifications.requestPermissions();
                    }
                    if (pushPerm.receive === 'granted') {
                        await PushNotifications.register();
                    }

                    // B. Media/Camera Permission (Future photo sending ke liye)
                    await Camera.requestPermissions();

                    // C. Location Permission (Jo aapne manga tha)
                    await Geolocation.requestPermissions();

                    // D. FCM Token Register & Save
                    PushNotifications.addListener('registration', async (token) => {
                        const deviceId = (await Device.getId()).identifier;
                        
                        // Firestore mein check karein agar device pehle se hai
                        const q = query(collection(db, "subscriptions"), where("deviceId", "==", deviceId));
                        const snapshot = await getDocs(q);

                        if (snapshot.empty) {
                            await addDoc(collection(db, "subscriptions"), {
                                token: token.value,
                                deviceId: deviceId,
                                platform: info.platform,
                                model: info.model,
                                timestamp: serverTimestamp()
                            });
                            console.log("LOG: Device Registered Successfully ✅");
                        }
                    });

                    // E. Error handling
                    PushNotifications.addListener('registrationError', (error) => {
                        console.error('FCM Registration Error:', error);
                    });

                } catch (err) {
                    console.error("Native Permission Error:", err);
                }
            }
        };

        initNativeApp();
    }, [pathname, router]);

    const isLoginPage = pathname === "/login";
    if (loading) return null;

    return (
        <div className="bg-black h-[100dvh] w-full text-white overflow-hidden flex flex-col relative">
            {!isLoginPage && isAuth && (
                <>
                    <div className={cn(
                        "fixed inset-y-0 left-0 z-[100] w-64 bg-black border-r border-zinc-800 transition-transform duration-300 md:translate-x-0",
                        isMainSidebarOpen ? "translate-x-0" : "-translate-x-full"
                    )}>
                        <Sidebar onClose={() => setIsMainSidebarOpen(false)} />
                    </div>
                    
                    <div className="h-14 bg-black border-b border-zinc-800 flex items-center px-4 shrink-0 z-40 md:ml-64 transition-all">
                        <button onClick={() => setIsMainSidebarOpen(true)} className="md:hidden p-2 -ml-2">
                            <Menu className="w-6 h-6 text-zinc-400" />
                        </button>
                        <span className="ml-2 font-bold text-sm tracking-tight uppercase tracking-widest text-zinc-500">BaseKey Panel</span>
                    </div>

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
