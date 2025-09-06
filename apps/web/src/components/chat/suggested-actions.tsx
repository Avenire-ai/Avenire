'use client';

import { motion } from 'motion/react';
import { Button } from '@avenire/ui/components/button';
import { memo } from 'react';
import { UIMessage, UseChatHelpers } from '@ai-sdk/react';
import { ToolType, UIDataTypes } from '@avenire/ai/tools/tools.types';
import { nanoid } from 'nanoid';

interface SuggestedActionsProps {
  chatId: string;
  append: (message: UIMessage<unknown, UIDataTypes, ToolType>) => void;
}

function PureSuggestedActions({ chatId, append }: SuggestedActionsProps) {
  const suggestedActions = [
    {
      title: 'Explain the twin paradox',
      label: 'with a visual analogy',
      action: 'Explain the twin paradox with a visual analogy',
    },
    {
      title: 'Summarize the French Revolution',
      label: 'like a high school teacher would',
      action: 'Summarize the French Revolution like a high school teacher would',
    },
    {
      title: 'Generate 5 quiz questions',
      label: 'about Newton’s three laws',
      action: 'Generate 5 quiz questions about Newton’s three laws',
    },
    {
      title: 'Compare reinforcement learning',
      label: 'to how humans form habits',
      action: 'Compare reinforcement learning to how humans form habits',
    },
  ];

  return (
    <div
      data-testid="suggested-actions"
      className="flex flex-wrap justify-center gap-2 w-full max-w-3xl mx-auto mb-2"
    >
      {suggestedActions.map((suggestedAction, index) => (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ delay: 0.05 * index }}
          key={`suggested-action-${suggestedAction.title}-${index}`}
          className="w-full sm:w-[calc(50%-0.5rem)]"
        >
          <Button
            variant="ghost"
            onClick={() => {
              window.history.replaceState({}, '/chat', `/chat/${chatId}`);

              append({
                role: 'user',
                id: nanoid(),
                parts: [{ type: "text", text: suggestedAction.action }],
              });
            }}
            className="text-left border rounded-xl px-4 py-3.5 text-sm flex-1 gap-1 sm:flex-col w-full h-auto justify-start items-start"
          >
            <span className="font-medium">{suggestedAction.title}</span>
            <span className="text-muted-foreground truncate">
              {suggestedAction.label}
            </span>
          </Button>
        </motion.div>
      ))}
    </div>
  );
}

export const SuggestedActions = memo(PureSuggestedActions, () => true);
