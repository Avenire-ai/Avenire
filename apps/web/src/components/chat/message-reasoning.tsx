'use client';

import { useState } from 'react';
import { ChevronDownIcon, LoaderIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Markdown } from '../markdown';
import { v4 as uuid } from "uuid";
import { cn } from '@avenire/ui/utils';

// Animation variants
const variants = {
  collapsed: {
    height: 0,
    opacity: 0,
    marginTop: 0,
    marginBottom: 0,
  },
  expanded: {
    height: 'auto',
    opacity: 1,
    marginTop: '1rem',
    marginBottom: '0.5rem',
  },
};

interface MessageReasoningProps {
  isLoading: boolean;
  reasoning: string;
}

export function MessageReasoning({
  isLoading,
  reasoning,
}: MessageReasoningProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="flex flex-col">
      {isLoading ? (
        <div className="flex flex-row gap-2 items-center">
          <div className="font-medium text-foreground">Reasoning</div>
          <div className="animate-spin">
            <LoaderIcon className="h-4 w-4" />
          </div>
        </div>
      ) : (
        <div className="flex flex-row gap-2 items-center">
          <div className="font-medium text-foreground">Reasoned for a few seconds</div>
          <button
            data-testid="message-reasoning-toggle"
            type="button"
            className={cn(
              "transition-transform cursor-pointer hover:text-primary",
              isExpanded ? "-rotate-90" : "rotate-none"
            )}
            onClick={() => setIsExpanded(!isExpanded)}
            aria-label={isExpanded ? "Collapse reasoning" : "Expand reasoning"}
          >
            <ChevronDownIcon className="h-4 w-4" />
          </button>
        </div>
      )}

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            data-testid="message-reasoning"
            key="content"
            initial="collapsed"
            animate="expanded"
            exit="collapsed"
            variants={variants}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
            className="pl-4 text-text/80 border-l flex flex-col gap-4"
          >
            <Markdown id={uuid()} content={reasoning} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}