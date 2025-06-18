'use client';

import type { UIMessage } from 'ai';
import { useChat } from '@ai-sdk/react';
import { useState, useCallback, useEffect } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { MultimodalInput } from './multimodal-input';
import { Messages } from './messages';
import { toast } from 'sonner';
import { v4 as generateUUID } from "uuid"
import { SuggestedActions } from './suggested-actions';
import { useScrollToBottom } from './use-scroll-to-bottom';
import { motion, useInView } from 'motion/react';
import { ChevronDown } from 'lucide-react';
import { Button } from '@avenire/ui/components/button';
import { Attachment } from './preview-attachment';
import { Canvas, DOCK_WIDTH, type Mode } from './canvas/canvas';
import { useIsMobile } from '@avenire/ui/src/hooks/use-mobile';
import { getChatTitle } from '../../actions/actions';
import { useCanvasStore } from '../../stores/canvasStore'
import { usePathname } from 'next/navigation'

// Error types for better error handling
type ChatErrorType =
  | 'NETWORK_ERROR'
  | 'MODEL_ERROR'
  | 'VALIDATION_ERROR'
  | 'UNKNOWN_ERROR';

interface ChatError extends Error {
  type?: ChatErrorType;
  details?: unknown;
}

// User-friendly error messages
const ERROR_MESSAGES: Record<ChatErrorType, string> = {
  NETWORK_ERROR: 'Unable to connect to the server. Please check your internet connection and try again.',
  MODEL_ERROR: 'The AI model is currently experiencing issues. Please try again in a few moments.',
  VALIDATION_ERROR: 'There was an issue with your request. Please check your input and try again.',
  UNKNOWN_ERROR: 'Something went wrong. Please try again or contact support if the issue persists.'
};

// Helper function to categorize errors
const categorizeError = (error: Error): ChatErrorType => {
  if (error.name === 'NetworkError' || error.message.includes('network')) {
    return 'NETWORK_ERROR';
  }
  if (error.message.includes('model') || error.message.includes('AI')) {
    return 'MODEL_ERROR';
  }
  if (error.message.includes('validation') || error.message.includes('invalid')) {
    return 'VALIDATION_ERROR';
  }
  return 'UNKNOWN_ERROR';
};

interface ChatProps {
  id: string;
  initialMessages: Array<UIMessage>;
  selectedModel: string;
  selectedReasoningModel: string;
  isReadonly: boolean;
}

export function Chat({
  id,
  initialMessages,
  selectedModel,
  selectedReasoningModel,
  isReadonly
}: ChatProps) {
  const [thinkingEnabled, setThinkingEnabled] = useState<boolean>(false);
  const [deepResearchEnabled, setDeepResearchEnabled] = useState<boolean>(false);
  const [attachments, setAttachments] = useState<Array<Attachment>>([]);
  const [canvasKey, setCanvasKey] = useState(0);
  const pathname = usePathname();

  const { mutate } = useSWRConfig();
  const isMobile = useIsMobile();
  const [messagesContainerRef, messagesEndRef, scroll] = useScrollToBottom<HTMLDivElement>();
  const isInView = useInView(messagesEndRef);

  const { isOpen: isCanvasOpen, mode: canvasMode, openCanvas, closeCanvas, setChatId } = useCanvasStore();

  // Close canvas on page change or refresh
  useEffect(() => {
    closeCanvas();
  }, [pathname, closeCanvas]);

  const handleError = useCallback((error: Error) => {
    // Log the full error for developers
    console.error('Chat error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });

    // Categorize the error
    const errorType = categorizeError(error);
    const userMessage = ERROR_MESSAGES[errorType];

    // Show user-friendly message
    toast.error(userMessage, {
      description: 'If this issue persists, please contact support.',
      duration: 5000
    });
  }, []);

  const handleToolCall = useCallback((toolCall: { name: string }) => {
    if (toolCall.name === 'flashcardGeneratorTool' || toolCall.name === 'quizGeneratorTool') {
      setCanvasKey(prev => prev + 1);
      if (!isCanvasOpen) {
        setChatId(id)
        openCanvas(toolCall.name === 'flashcardGeneratorTool' ? 'flashcards' : 'quiz');
      }
    }
  }, [isCanvasOpen, id, openCanvas]);

  const {
    messages,
    setMessages,
    handleSubmit,
    input,
    setData,
    setInput,
    append,
    status,
    stop,
    reload,
    error
  } = useChat({
    id,
    body: {
      chatId: id,
      selectedModel,
      selectedReasoningModel,
      currentPlots: [],
      thinkingEnabled,
      deepResearchEnabled
    },
    initialMessages,
    experimental_throttle: 100,
    sendExtraMessageFields: true,
    generateId: generateUUID,
    onFinish: async () => {
      mutate('/api/history');
      // Update page title when chat is finished
      if (messages.length < 3) {
        const { title } = await getChatTitle({ chatId: id });
        document.title = `${title} | Avenire`;
      }
      messages.at(-1)?.parts.forEach((part, i) => {
        if (part.type === "tool-invocation") {
          handleToolCall({ name: part.toolInvocation.toolName })
        }
      })
    },
    onError: handleError,
  });

  const toggleResearch = useCallback(() => {
    setDeepResearchEnabled(prev => {
      if (prev) {
        return false;
      }
      setThinkingEnabled(false);
      return true;
    });
  }, []);

  const toggleThinking = useCallback(() => {
    setThinkingEnabled(prev => {
      if (prev) {
        return false;
      }
      setDeepResearchEnabled(false);
      return true;
    });
  }, []);

  return (
    <div className={"flex h-screen w-full"}>
      <div
        className={"transition-all duration-300 flex flex-col min-w-0 h-full bg-background w-full"}
        style={{
          marginRight: isCanvasOpen && !isMobile ? `${DOCK_WIDTH - 20}px` : '0px'
        }}
      >
        <Messages
          error={error}
          chatId={id}
          status={status}
          messages={messages}
          setMessages={setMessages}
          reload={reload}
          openCanvas={openCanvas}
          isReadonly={isReadonly}
          messagesContainerRef={messagesContainerRef}
          messagesEndRef={messagesEndRef}
        />
        {messages.length === 0 && attachments.length === 0 && (
          <SuggestedActions append={append} chatId={id} />
        )}

        <form className={"sticky mx-auto b-0 flex flex-col md:max-w-3xl w-full items-center bg-transparent"}>
          <motion.div
            initial="hidden"
            animate={!isInView ? "visible" : "hidden"}
            variants={{
              visible: { opacity: 1, visibility: "visible" },
              hidden: { opacity: 0, visibility: "hidden" }
            }}
            className={"absolute top-0 z-50 -translate-y-10"}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <Button
              variant="outline"
              className="rounded-full shadow-md hover:shadow-lg transition-shadow"
              size="icon"
              type="button"
              onClick={scroll}
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </motion.div>
          {!isReadonly && (
            <div className={"p-2 pb-0 bg-border/50 border-foreground/70 backdrop-blur-sm rounded-2xl rounded-b-none gap-2 w-full"}>
              <MultimodalInput
                chatId={id}
                input={input}
                setInput={setInput}
                reload={reload}
                researchEnabled={deepResearchEnabled}
                thinkingEnabled={thinkingEnabled}
                toggleResearch={toggleResearch}
                toggleThinking={toggleThinking}
                handleSubmit={handleSubmit}
                setData={setData}
                status={status}
                stop={stop}
                attachments={attachments}
                setAttachments={setAttachments}
                messages={messages}
                setMessages={setMessages}
                append={append}
              />
            </div>
          )}
        </form>
        <Canvas
          key={canvasKey}
          open={isCanvasOpen}
          onClose={closeCanvas}
          chatId={id}
          initialMode={canvasMode}
        />
      </div>
    </div>
  );
}