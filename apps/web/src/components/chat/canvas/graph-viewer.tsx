"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { useGraphStore } from "../../../stores/graphStore";
import { LineChart } from "lucide-react";

const GraphComp = dynamic(
  () => import("../../graph/desmos").then((mod) => mod.GraphComp),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center">
        <p>Loading Graph...</p>
      </div>
    ),
  }
);

export function GraphViewer() {
  const { expressions } = useGraphStore();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="w-full h-full rounded-lg overflow-hidden"
    >
        <GraphComp />
    </motion.div>
  );
}
