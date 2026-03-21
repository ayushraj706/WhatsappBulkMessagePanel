import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";
import type { Metadata, Viewport } from "next";

// PWA Metadata: Isse app phone mein install hone layak banti hai
export const metadata: Metadata = {
    title: "BaseKey Messenger",
    description: "WhatsApp Bulk & Real-Time Chat Panel",
    manifest: "/manifest.json", //
    appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: "BaseKey",
    },
};

// Viewport: Mobile screen par app ko fit karne ke liye
export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    themeColor: "#050505", // Dark header for the app
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Browser aur Notification ke icons */}
        <link rel="icon" href="/icon-192x192.png" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
      </head>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
