import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Cairo, IBM_Plex_Sans_Arabic, IBM_Plex_Sans, Tajawal, Scheherazade_New } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { NavBar } from "@/components/nav-bar";
import { ThemeProvider } from "@/components/theme-provider";
import { PWAInstallPrompt } from "@/components/pwa-install-prompt";
import { SplashWrapper } from "@/components/splash-wrapper";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["400", "600", "700", "900"],
  display: "swap",
});
const ibmPlexArabic = IBM_Plex_Sans_Arabic({
  variable: "--font-ibm-plex-arabic",
  subsets: ["arabic"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});
const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-ibm-plex-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});
const tajawal = Tajawal({
  variable: "--font-tajawal",
  subsets: ["arabic"],
  weight: ["300", "400", "500", "700", "900"],
  display: "swap",
});
const scheherazade = Scheherazade_New({
  variable: "--font-scheherazade",
  subsets: ["arabic"],
  weight: ["400", "700"],
  display: "optional",
  preload: false,
});
const azalDisplay = localFont({
  src: [
    { path: "../public/29LTAzal-Display.woff2" },
    { path: "../public/29LTAzal-Display.ttf" },
  ],
  variable: "--font-azal-display",
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  title: "Hayati",
  description: "Your personal life OS — wealth, worship, wellness, and life planning",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Hayati" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAFAF7" },
    { media: "(prefers-color-scheme: dark)", color: "#08060F" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const fontVars = [
    geistSans.variable,
    geistMono.variable,
    cairo.variable,
    ibmPlexArabic.variable,
    ibmPlexSans.variable,
    tajawal.variable,
    scheherazade.variable,
    azalDisplay.variable,
  ].join(" ");

  return (
    <html lang="en" className={fontVars} suppressHydrationWarning>
      <body className="min-h-screen flex flex-col" style={{ paddingTop: "env(safe-area-inset-top)" }}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange={false}>
          <SplashWrapper />
          <NavBar />
          <main className="flex-1 container mx-auto px-4 py-6 max-w-7xl pb-24 md:pb-6">{children}</main>
          <PWAInstallPrompt />
        </ThemeProvider>
      </body>
    </html>
  );
}
