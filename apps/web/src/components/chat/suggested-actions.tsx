'use client';

import { motion } from 'motion/react';
import { Button } from '@avenire/ui/components/button';
import { memo } from 'react';
import { UseChatHelpers } from '@ai-sdk/react';

interface SuggestedActionsProps {
  chatId: string;
  append: UseChatHelpers['append'];
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
      className="grid sm:grid-cols-2 gap-2 max-w-3xl mx-auto w-full mb-2"
    >
      {suggestedActions.map((suggestedAction, index) => (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ delay: 0.05 * index }}
          key={`suggested-action-${suggestedAction.title}-${index}`}
          className={index > 1 ? 'hidden sm:block' : 'block'}
        >
          <Button
            variant="ghost"
            onClick={() => {
              window.history.replaceState({}, '/chat', `/chat/${chatId}`);

              append({
                role: 'user',
                content: suggestedAction.action,
              });
            }}
            className="text-left border rounded-xl px-4 py-3.5 text-sm flex-1 gap-1 sm:flex-col w-full h-auto justify-start items-start"
          >
            <span className="font-medium">{suggestedAction.title}</span>
            <span className="text-muted-foreground">
              {suggestedAction.label}
            </span>
          </Button>
        </motion.div>
      ))}
    </div>
  );
}

export const SuggestedActions = memo(PureSuggestedActions, () => true);
