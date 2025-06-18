"use client"

import type { ReactNode } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { X, RotateCcw, PenTool, BarChart3, HelpCircle } from "lucide-react"
import { Button } from "@avenire/ui/components/button"
import { useIsMobile as useMobile } from "@avenire/ui/src/hooks/use-mobile"
import { FlashcardViewer } from "./flashcard-viewer"
import { QuizPrompter } from "./quiz-prompter"
import { GraphViewer } from "./graph-viewer"
import { useState, useEffect } from "react"
import { WhiteboardViewer } from "./whiteboard"

interface CanvasProps {
  open: boolean
  onClose: () => void
  children?: ReactNode
  // Add callback to notify parent about dock state
  onOpenChange?: (open: boolean) => void
  chatId: string // Add chatId prop
  initialMode?: Mode // Add initialMode prop
}

export type Mode = "flashcards" | "whiteboard" | "graph" | "quiz"

const DOCK_WIDTH = 450 // Fixed width in pixels

export function Canvas({ open, onClose, children, onOpenChange, chatId, initialMode = "flashcards" }: CanvasProps) {
  const isMobile = useMobile()
  const [activeMode, setActiveMode] = useState<Mode>(initialMode)

  // Update activeMode when initialMode changes
  useEffect(() => {
    setActiveMode(initialMode)
  }, [initialMode])

  // Notify parent when dock opens/closes
  useEffect(() => {
    onOpenChange?.(open)
  }, [open, onOpenChange])

  const modes = [
    { id: "flashcards" as Mode, icon: RotateCcw, label: "Cards" },
    { id: "whiteboard" as Mode, icon: PenTool, label: "Board" },
    { id: "graph" as Mode, icon: BarChart3, label: "Graph" },
    { id: "quiz" as Mode, icon: HelpCircle, label: "Quiz" },
  ]

  const renderContent = () => {
    switch (activeMode) {
      case "flashcards":
        return <FlashcardViewer chatId={chatId} />
      case "whiteboard":
        return <WhiteboardViewer />
      case "graph":
        return <GraphViewer />
      case "quiz":
        return <QuizPrompter chatId={chatId} />
      default:
        return null
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Mobile backdrop */}
          {isMobile && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            />
          )}

          {/* Dock panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
            }}
            className={
              isMobile
                ? "fixed right-0 top-0 w-full h-full z-50 bg-background shadow-xl"
                : "fixed right-0 top-0 h-screen z-40 bg-background border-l shadow-xl"
            }
            style={isMobile ? {} : { width: DOCK_WIDTH }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b bg-muted/30">
              <div className="flex items-center gap-1">
                {modes.map((mode) => {
                  const Icon = mode.icon
                  const isActive = activeMode === mode.id
                  return (
                    <Button
                      key={mode.id}
                      variant={isActive ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setActiveMode(mode.id)}
                      className="relative"
                    >
                      <Icon className="h-4 w-4" />
                      {isActive && (
                        <motion.div
                          layoutId="activeMode"
                          className="absolute inset-0 bg-primary rounded-md -z-10"
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                      )}
                    </Button>
                  )
                })}
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Content */}
            <div className="h-[calc(100%-64px)] overflow-y-auto overflow-x-hidden">
              <div className="p-4 h-full">
                <AnimatePresence mode="wait">
                  <motion.div
                    className="h-full"
                    key={activeMode}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {children || renderContent()}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// Export the dock width so parent components can use it
export { DOCK_WIDTH }
