"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, BookOpen, Trash, Settings, ChevronDown, LogOut, User2, Layout, Pyramid } from "lucide-react"
import {
  Sidebar as ShadcnSidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarTrigger,
  useSidebar,
} from "@avenire/ui/components/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@avenire/ui/components/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@avenire/ui/components/dropdown-menu"
import { cn } from "@avenire/ui/utils"
import { useUserStore } from "../stores/userStore"
import { getRecentChats } from "../actions/actions"
import { signOut } from "@avenire/auth/client"
import useSWR from 'swr';
import Image from "next/image"
import { useCanvasStore } from "../stores/canvasStore"
import { Button } from "@avenire/ui/components/button";
import { AnimatePresence, motion } from "motion/react"

const menuItems = [
  { icon: Home, label: "Home", href: "/" },
  { icon: BookOpen, label: "New chat", href: "/chat" },
  { icon: Settings, label: "Settings", href: "/settings" },
]

export function Sidebar() {
  const [activeItem, setActiveItem] = useState("Home")
  const { open, isMobile } = useSidebar()
  const { user } = useUserStore();
  const pathname = usePathname();
  const isChatPage = pathname?.startsWith('/chat');
  const { openCanvas } = useCanvasStore();

  const { data: recentChatsData } = useSWR(
    user?.id ? '/api/history' : null,
    async () => {
      if (!user?.id) return { chats: [] };
      const { chats } = await getRecentChats(user.id);
      return { chats };
    },
    {
      refreshInterval: 0, // Disable automatic polling
      revalidateOnFocus: true, // Revalidate when window gains focus
      revalidateOnReconnect: true, // Revalidate when browser regains connection
    }
  );

  const recentChats = recentChatsData?.chats || [];

  return (
    <>
      <div className={!isMobile ? "absolute left-3 top-3 z-50 p-2 rounded-lg bg-sidebar transition-all flex flex-row gap-2" : "visibility-hidden"}>
        <SidebarTrigger />
        <AnimatePresence>
          {!open && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <Button
                size={"icon"}
                variant={"ghost"}
                className={"h-7 w-7"}
                onClick={() => { openCanvas('flashcards') }}
              >
                <Pyramid />
                <span className="sr-only">Toggle Canvas</span>
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <ShadcnSidebar className="flex-grow">
        <SidebarHeader className="flex items-center justify-center px-4 py-4">
          <div className={cn("flex items-center justify-center", open && "gap-2 w-full")}>
            <div
              className={cn(
                "flex items-center justify-center rounded-full bg-neutral-800",
                open ? "h-8 w-8" : "h-8 w-[32px] bg-opacity-80",
              )}
            >
              <Image src="/logo.png" alt="Avenire" width={32} height={32} />
            </div>
            {open && <span className="text-xl font-semibold">Avenire.</span>}
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {menuItems.map((item) => (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton
                      asChild
                      isActive={activeItem === item.label}
                      onClick={() => setActiveItem(item.label)}
                      tooltip={!open ? item.label : undefined}
                    >
                      <Link href={item.href} className={cn("flex items-center", !open && "justify-center")}>
                        <item.icon className="h-4 w-4" />
                        {open && <span className="ml-2">{item.label}</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
                {isChatPage && (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      className="cursor-pointer"
                      onClick={() => openCanvas('flashcards')}
                      tooltip={!open ? "Open Canvas" : undefined}
                    >
                      <Pyramid className="h-4 w-4" />
                      {open && <span className="ml-2">Open Canvas</span>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {open && (
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-medium text-neutral-400">Recently Opened</SidebarGroupLabel>
              <SidebarGroupContent>
                {recentChats.length > 0 ? (
                  <SidebarMenu>
                    {recentChats.map((chat) => (
                      <SidebarMenuItem key={chat.id}>
                        <SidebarMenuButton asChild>
                          <Link href={`/chat/${chat.id}`} className="text-sm">
                            <span className="truncate">{chat.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                ) : (
                  <div className="px-2 py-1.5">
                    <p className="text-sm text-muted-foreground">Start a new chat to see your conversations here</p>
                  </div>
                )}
              </SidebarGroupContent>
            </SidebarGroup>
          )}
        </SidebarContent>

        <SidebarFooter className={cn("p-4", !open && "flex items-center justify-center")}>
          <div className={cn("space-y-2", !open && "space-y-0")}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div
                  className={cn(
                    "flex items-center cursor-pointer rounded-lg hover:bg-neutral-800/70 focus:bg-neutral-800/80 transition-colors shadow-sm border border-neutral-800/40",
                    open ? "gap-2 p-2" : "justify-center",
                  )}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.imageUrl} />
                    <AvatarFallback>{user?.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  {open && (
                    <>
                      <div className="flex flex-col flex-1">
                        <span className="text-xs font-medium">{user?.name}</span>
                        <span className="text-xs text-muted-foreground">{user?.email}</span>
                      </div>
                      <ChevronDown className="h-3 w-3 text-muted-foreground" />
                    </>
                  )}
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={open ? "end" : "start"} side={open ? "right" : "right"} className="w-[220px] rounded-xl shadow-lg border border-neutral-800/40 bg-neutral-900/95 backdrop-blur-md p-2">
                <DropdownMenuItem className="rounded-md hover:bg-neutral-800/60 focus:bg-neutral-800/80 transition-colors">
                  <Link href="/profile" className="flex items-center w-full">
                    <User2 className="h-4 w-4 mr-2" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="rounded-md hover:bg-neutral-800/60 focus:bg-neutral-800/80 transition-colors">
                  <Link href="/settings" className="flex items-center w-full">
                    <Settings className="h-4 w-4 mr-2" />
                    Account Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()} className="rounded-md hover:bg-destructive/20 focus:bg-destructive/30 transition-colors">
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </SidebarFooter>
      </ShadcnSidebar>
    </>
  )
}

export function SidebarSkeleton() {
  return (
    <div className="w-[var(--sidebar-width)] bg-neutral-900 p-4">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 animate-pulse rounded-full bg-neutral-800" />
        <div className="h-6 w-24 animate-pulse rounded-md bg-neutral-800" />
      </div>
      <div className="mt-8 space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="h-4 w-4 animate-pulse rounded-md bg-neutral-800" />
            <div className="h-4 w-20 animate-pulse rounded-md bg-neutral-800" />
          </div>
        ))}
      </div>
    </div>
  )
}

