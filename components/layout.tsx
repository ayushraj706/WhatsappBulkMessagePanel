import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css"; // Aapki css file

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // 'suppressHydrationWarning' zaroori hai taaki browser gussa na kare
    <html lang="en" suppressHydrationWarning>
      <body>
        {/* Is line ne pure app ko 'Theme' ke signal se jodd diya hai */}
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
