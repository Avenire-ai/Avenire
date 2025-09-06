import type { UIMessage } from 'ai';
import { useCopyToClipboard } from 'usehooks-ts';
import { UseChatHelpers } from "@ai-sdk/react"
import { log, captureException } from "@avenire/logger/client"
import { CopyIcon, RotateCcw } from 'lucide-react';
import { Button } from '@avenire/ui/components/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@avenire/ui/components/tooltip';
import { memo } from 'react';
import { toast } from 'sonner';
import { cn } from '@avenire/ui/utils';

interface MessageActionsProps {
  message: UIMessage;
  reload: () => void;
  isLoading: boolean;
  error: boolean;
  onDeleteTrailing?: () => Promise<void>;
}

export function PureMessageActions({
  message,
  isLoading,
  reload,
  error,
  onDeleteTrailing
}: MessageActionsProps) {
  const [_, copyToClipboard] = useCopyToClipboard();

  if (isLoading) { return null };
  if (message.role === 'user') { return null };

  const handleCopy = async () => {
    const textFromParts = message.parts
      ?.filter((part) => part.type === 'text')
      .map((part) => part.text)
      .join('\n')
      .trim();

    if (!textFromParts) {
      toast.error("There's no text to copy!");
      return;
    }

    await copyToClipboard(textFromParts);
    toast.success('Copied to clipboard!');
  };

  const handleRegenerate = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (onDeleteTrailing) {
      try {
        await onDeleteTrailing();
      } catch (error) {
        log.error('Failed to delete trailing messages:', { error });
        captureException(error);
      }
    }
  };

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex flex-row gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className={cn("py-1 px-1 h-fit text-muted-foreground hover:text-foreground transition-colors", "hover:bg-muted")}
              variant="outline"
              size="icon"
              onClick={handleCopy}
              aria-label="Copy message"
            >
              <CopyIcon className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Copy</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className={cn("py-1 px-1 h-fit text-muted-foreground hover:text-foreground transition-colors", "hover:bg-muted")}
              variant="outline"
              size="icon"
              onClick={handleRegenerate}
              aria-label="Regenerate message"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Regenerate</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}

export const MessageActions = memo(
  PureMessageActions,
  (prevProps, nextProps) => {
    if (prevProps.isLoading !== nextProps.isLoading) { return false };
    return true;
  },
);
