import "./globals.css";
import { Outfit } from "next/font/google";
import { cn } from "@/lib/utils";
import ClientLayout from "@/components/ClientLayout";
import { ThemeProvider } from "@/components/ThemeProvider";
import type { Metadata, Viewport } from "next";

const font = Outfit({ subsets: ["latin"] });

// PWA Metadata: Isse browser ise asali App samjhega
export const metadata: Metadata = {
    title: "BaseKey Messenger",
    description: "WhatsApp Bulk & Real-Time Chat Panel",
    manifest: "/manifest.json", // Link to your public/manifest.json
    appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: "BaseKey",
    },
};

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    themeColor: "#050505", // Dark theme for app header
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                {/* Asali Push Notification ke liye icons */}
                <link rel="icon" href="/icon-192x192.png" />
                <link rel="apple-touch-icon" href="/icon-192x192.png" />
            </head>
            <body 
                className={cn(
                    font.className, 
                    "bg-white dark:bg-black text-zinc-950 dark:text-white transition-colors duration-300"
                )}
            >
                <ThemeProvider 
                    attribute="class" 
                    defaultTheme="system" 
                    enableSystem
                >
                    {/* Note: Service Worker registration logic aapke ClientLayout mein jayegi */}
                    <ClientLayout>
                        {children}
                    </ClientLayout>
                </ThemeProvider>
            </body>
        </html>
    );
}
