"use client"

import { motion } from "framer-motion"
import { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import dynamic from "next/dynamic";
import "@excalidraw/excalidraw/index.css";
import { useTheme } from "next-themes"

const Excalidraw = dynamic(
  async () => (await import("@excalidraw/excalidraw")).Excalidraw,
  {
    ssr: false,
  },
);


export function WhiteboardViewer() {

  const { theme } = useTheme()

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="w-full h-full rounded-lg overflow-hidden"
    >
      <Excalidraw
        zenModeEnabled
        excalidrawAPI={(api: ExcalidrawImperativeAPI) => {
          return
        }}
        aiEnabled={true}
        theme={theme as "light" | "dark"}
        UIOptions={{
          tools: { image: false },
          canvasActions: {
            export: false,
            loadScene: false,
            saveAsImage: false,
            saveToActiveFile: false,
          },
        }}
      />
    </motion.div>
  )
}
