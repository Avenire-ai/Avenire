import { ReactNode } from "react";
import type { Metadata } from "next";
import "@avenire/ui/globals.css";
import { ThemeProvider } from "@avenire/ui/providers/theme";
import { Toaster } from "@avenire/ui/src/components/sonner";
import { StorageSSRPlugin } from "@avenire/storage/ssr"
import { extractRouterConfig } from "@avenire/storage";
import { router } from "../lib/upload";
import Script from "next/script"
import { TooltipProvider } from "@avenire/ui/components/tooltip";

export const metadata: Metadata = {
  title: "Avenire",
  description: "Avenire",
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
        </ThemeProvider>
      </body>
    </html>
  );
}
