"use client"

import dynamic from "next/dynamic"
import { motion } from "framer-motion"

const GraphComp = dynamic(
  () => import("../../graph/desmos").then((mod) => mod.GraphComp),
  {
    ssr: false,
  }
)

export function GraphViewer() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="w-full h-full rounded-lg overflow-hidden"
    >
      <GraphComp />
    </motion.div>
  )
}
