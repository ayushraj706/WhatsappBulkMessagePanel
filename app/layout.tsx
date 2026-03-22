import "./globals.css";
import { Outfit } from "next/font/google";
import { cn } from "@/lib/utils";
import ClientLayout from "@/components/ClientLayout";
import { ThemeProvider } from "@/components/ThemeProvider";
import type { Metadata, Viewport } from "next";

const font = Outfit({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "BaseKey Messenger",
    description: "WhatsApp Bulk & Real-Time Chat Panel",
    manifest: "/manifest.json",
    appleWebApp: {
        capable: true,
        statusBarStyle: "black-translucent", // Status bar ko app ke saath milane ke liye
        title: "BaseKey",
    },
};

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    themeColor: "#050505", 
    viewportFit: "cover", // Notch wale phones ke liye zaroori
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body 
                className={cn(
                    font.className, 
                    "bg-white dark:bg-black text-zinc-950 dark:text-white antialiased"
                )}
            >
                <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
                    <ClientLayout>
                        {children}
                    </ClientLayout>
                </ThemeProvider>
            </body>
        </html>
    );
}
