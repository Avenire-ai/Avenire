import { ReactNode, Suspense } from "react";
import type { Metadata } from "next";
import "@avenire/ui/globals.css";
import { ThemeProvider } from "@avenire/ui/providers/theme";
import { Toaster } from "@avenire/ui/src/components/sonner";
import { StorageSSRPlugin } from "@avenire/storage/ssr"
import { extractRouterConfig } from "@avenire/storage";
import { router } from "../lib/upload";
import Script from "next/script"
import { TooltipProvider } from "@avenire/ui/components/tooltip";
import { ServiceWorkerRegistration, OfflineIndicator } from "../components/ServiceWorkerRegistration";
import type { Viewport } from 'next'

export const viewport: Viewport = {
  themeColor: "#3b82f6",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "Avenire",
  description: "Illuminate Your Learning & Research Journey with AI",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Avenire",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "Avenire",
    title: "Avenire - AI Learning Platform",
    description: "Illuminate Your Learning & Research Journey with AI",
  },
  twitter: {
    card: "summary_large_image",
    title: "Avenire - AI Learning Platform",
    description: "Illuminate Your Learning & Research Journey with AI",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={"antialiased overflow-hidden"}>
      {/* Load heavy scripts lazily to improve initial page load */}
      <Script
        src="https://cdn.jsdelivr.net/pyodide/v0.25.1/full/pyodide.js"
        strategy="lazyOnload"
        id="pyodide-script"
      />
      <Script
        src="https://www.desmos.com/api/v1.10/calculator.js?apiKey=dcb31709b452b1cf9dc26972add0fda6"
        strategy="lazyOnload"
        id="desmos-script"
      />
      <body>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <StorageSSRPlugin routerConfig={extractRouterConfig(router)} />
          <TooltipProvider>
            {children}
          </TooltipProvider>
          <Toaster />
          <ServiceWorkerRegistration />
          <OfflineIndicator />
        </ThemeProvider>
      </body>
    </html>
  );
}