"use client"

import { ReactNode, useEffect } from "react";
import React from "react";
import { SidebarProvider, SidebarInset } from "@avenire/ui/components/sidebar";
import { Sidebar } from "../../components/sidebar";
import { useUserStore } from "../../stores/userStore";
import { unauthorized } from "next/navigation"
import { preWarmWorkerPool } from "../../lib/worker-pool-manager";
import { log, captureException } from "@avenire/logger/client";

// Client component to handle worker pre-warming
function WorkerPreWarmer() {
  React.useEffect(() => {
    // Pre-warm the Pyodide worker pool
    preWarmWorkerPool().catch();
  }, []);
  return null;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const { user, fetchUser } = useUserStore();
  React.useEffect(() => {
    // Pre-warm the Pyodide worker pool
    preWarmWorkerPool().catch((error) => {
      log.error("Failed to pre-warm worker pool", { error });
      captureException(error);
    });
  }, []);
  useEffect(() => {
    const check = async () => {
      await fetchUser();
      if (!user?.id) {
        unauthorized()
      }
    };
    check();
  }, [fetchUser]);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full overflow-hidden">
        <Sidebar />
        <div className="flex-1 w-full px-4 h-screen overflow-y-scroll pt-12 md:pt-0">
          <WorkerPreWarmer />
          {children}
        </div>
      </div>
    </SidebarProvider>
  );
}
