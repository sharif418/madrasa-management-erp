import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Noto_Sans_Bengali, Noto_Naskh_Arabic } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Providers } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const notoBengali = Noto_Sans_Bengali({
  variable: "--font-bengali",
  subsets: ["bengali"],
  weight: ["400", "500", "600", "700"],
});

const notoArabic = Noto_Naskh_Arabic({
  variable: "--font-arabic",
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Madrasa Manager — Complete Madrasa Management ERP",
  description:
    "The complete digital platform for modern madrasas. Manage students, track Hifz, handle Shariah-compliant finance, and engage guardians — in Bangla, English, and Arabic.",
  keywords: [
    "madrasa", "madrasa management", "ERP", "Hifz tracking", "Shariah finance",
    "Islamic school", "Bangladesh", "Qawmi", "Alia", "multi-tenant SaaS",
  ],
  authors: [{ name: "Madrasa Manager" }],
  icons: { icon: "/logo.svg" },
  manifest: "/manifest.json",
  openGraph: {
    title: "Madrasa Manager — Complete Madrasa Management ERP",
    description: "The complete digital platform for modern madrasas.",
    type: "website",
  },
};

const SW_REGISTER = `
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('/sw.js').catch(function () {});
    });
  }
`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="bn" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#059669" />
        <link rel="manifest" href="/manifest.json" />
        <script dangerouslySetInnerHTML={{ __html: SW_REGISTER }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${notoBengali.variable} ${notoArabic.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <Providers>
            {children}
          </Providers>
        </ThemeProvider>
        <Toaster />
        <Sonner />
      </body>
    </html>
  );
}
