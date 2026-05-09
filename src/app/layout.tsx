import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { AuthListener } from "@/components/layout/AuthListener";
import { LoginPage } from "@/components/LoginPage";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TaniPintar - Petani Cerdas, Harga Adil, Panen Maksimal",
  description: "Platform digital pertanian Indonesia untuk petani cerdas. Akses harga real-time, marketplace langsung, dan akademi pertanian interaktif. Mendukung SDGs Pendidikan & Ekonomi.",
  keywords: ["TaniPintar", "pertanian Indonesia", "harga komoditas", "petani cerdas", "SDGs", "marketplace pertanian", "digital farming"],
  authors: [{ name: "TaniPintar Team" }],
  icons: {
    icon: "/logo-tanipintar.png",
  },
  openGraph: {
    title: "TaniPintar - Petani Cerdas, Harga Adil, Panen Maksimal",
    description: "Platform digital pertanian Indonesia. Harga real-time, marketplace langsung, akademi interaktif.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <AuthListener>
            {children}
            <LoginPage />
          </AuthListener>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
