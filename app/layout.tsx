import "./globals.css";
import { Outfit } from "next/font/google";
import { cn } from "@/lib/utils";
import ClientLayout from "@/components/ClientLayout";
import { ThemeProvider } from "@/components/ThemeProvider"; // Ise import karo
import type { Metadata, Viewport } from "next";

const font = Outfit({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "WaBulkSender - Free WhatsApp Bulk Sender",
    description: "Open source WhatsApp bulk sender using Official Cloud API",
};

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        /* 1. 'className' hata di aur 'suppressHydrationWarning' joda */
        <html lang="en" suppressHydrationWarning>
            <body 
                className={cn(
                    font.className, 
                    /* 2. Body ko dynamic banaya: Light mein white, Dark mein black */
                    "bg-white dark:bg-black text-zinc-950 dark:text-white transition-colors duration-300"
                )}
            >
                {/* 3. ThemeProvider se wrap kiya taaki Sidebar buttons kaam karein */}
                <ThemeProvider 
                    attribute="class" 
                    defaultTheme="system" 
                    enableSystem
                >
                    <ClientLayout>
                        {children}
                    </ClientLayout>
                </ThemeProvider>
            </body>
        </html>
    );
}
