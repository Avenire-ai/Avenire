'use client';

import type { UIMessage } from 'ai';
import { AnimatePresence, motion } from 'motion/react';
import { memo, useEffect, useRef, useState } from 'react';
import { Check, SparklesIcon, AlertCircle, BookOpen, HelpCircle, GitBranch } from 'lucide-react';
import { Markdown } from '../markdown';
import { PreviewAttachment } from './preview-attachment';
import equal from 'fast-deep-equal';
import { cn } from '@avenire/ui/utils';
import { MessageReasoning } from './message-reasoning';
import { useChat, UseChatHelpers } from '@ai-sdk/react';
import ResearchProcess from './deepresearch-process';
import ResearchDisplay from './deepresearch-display';
import dynamic from "next/dynamic"
import { Button } from '@avenire/ui/src/components/button';
import { LineChart } from "lucide-react"
import { useGraphStore } from '../../stores/graphStore';
import { MessageActions } from './chat-actions';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@avenire/ui/src/components/card';
import { deleteTrailingMessages } from '../../actions/actions';
import { Canvas, type Mode } from './canvas/canvas';

const GraphImage = dynamic(
  () => import("../graph/desmos").then((mod) => mod.GraphImage),
  {
    ssr: false,
  }
);

const MermaidDiagram = dynamic(
  () => import("../mermaid").then((mod) => mod.MermaidDiagram),
  {
    ssr: false,
  }
);

// Error types for better error handling
type MessageErrorType =
  | 'MODEL_ERROR'
  | 'NETWORK_ERROR'
  | 'VALIDATION_ERROR'
  | 'UNKNOWN_ERROR';

// User-friendly error messages
const ERROR_MESSAGES: Record<MessageErrorType, string> = {
  MODEL_ERROR: 'The AI model encountered an issue while processing your request.',
  NETWORK_ERROR: 'There was a problem connecting to the server.',
  VALIDATION_ERROR: 'There was an issue with the message format.',
  UNKNOWN_ERROR: 'An unexpected error occurred while processing your message.'
};

// Helper function to categorize errors
const categorizeError = (error: Error): MessageErrorType => {
  if (error.message.includes('model') || error.message.includes('AI')) {
    return 'MODEL_ERROR';
  }
  if (error.message.includes('network') || error.message.includes('connection')) {
    return 'NETWORK_ERROR';
  }
  if (error.message.includes('validation') || error.message.includes('format')) {
    return 'VALIDATION_ERROR';
  }
  return 'UNKNOWN_ERROR';
};

const PurePreviewMessage = ({
  chatId,
  message,
  isLoading,
  reload,
  isReadonly,
  error,
  openCanvas
}: {
  chatId: string,
  message: UIMessage;
  isLoading: boolean;
  setMessages: UseChatHelpers['setMessages'];
  error: UseChatHelpers['error'];
  reload: UseChatHelpers['reload'];
  openCanvas: (mode?: Mode) => void
  isReadonly: boolean;
}) => {
  const { data: dataStream, messages } = useChat({
    id: chatId
  });
  const [researchData, setResearchData] = useState<Array<any>>([])
  const { addExpression, clearGraph } = useGraphStore()

  const handleDeleteTrailing = async () => {
    try {
      const result = await deleteTrailingMessages({
        id: messages.at(-2)?.id || message.id,
      });
      if (result.success) {
        reload();
      }
    } catch (error) {
      console.error('Failed to delete trailing messages:', error);
    }
  };

  useEffect(() => {
    if (!dataStream?.length || (messages.at(-1)?.id !== message.id)) { return };
    setResearchData(dataStream)
  }, [dataStream])

  return (
    <AnimatePresence>
      <motion.div
        data-testid={`message-${message.role}`}
        className={cn("w-full mx-auto max-w-3xl px-4 group/message", {
          'justify-self-end': message.role === "user"
        })}
        initial={{ y: 5, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        data-role={message.role}
      >
        <div className="flex gap-4 flex-col w-full group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl">
          {message.role === 'assistant' && (
            <div className="size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border bg-background">
              <div className="translate-y-px">
                <SparklesIcon className="h-4 w-4" />
              </div>
            </div>
          )}

          {error && (
            <Card className="bg-destructive/10 border-destructive/20 text-destructive w-full">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  <CardTitle className="text-base">Message Error</CardTitle>
                </div>
                <CardDescription className="text-destructive/80">
                  {ERROR_MESSAGES[categorizeError(error)]}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-destructive/80">
                <p>Technical details (for support):</p>
                <code className="block mt-1 p-2 bg-destructive/5 rounded text-xs wrap-break-word">
                  {error.name}: {error.message}
                </code>
              </CardContent>
            </Card>
          )}

          <div className={`flex flex-col gap-4 w-full ${message.role === "user" && "items-end"}`}>
            {message.experimental_attachments && (
              <div
                data-testid="message-attachments"
                className="flex flex-row justify-end gap-2"
              >
                {message.experimental_attachments.map((attachment) => (
                  <PreviewAttachment
                    key={attachment.url}
                    attachment={attachment}
                  />
                ))}
              </div>
            )}

            {message.role === "assistant" && researchData.length > 0 && (
              <ResearchProcess data={researchData} />
            )}

            {message.parts?.map((part, index) => {
              const { type } = part;
              const key = `message-${message.id}-part-${index}`;

              if (type === 'reasoning') {
                return (
                  <MessageReasoning
                    key={key}
                    isLoading={isLoading}
                    reasoning={part.reasoning}
                  />
                );
              }

              if (type === 'text') {
                return (
                  <div key={key} className="flex flex-row gap-2 items-start">
                    <div
                      data-testid="message-content"
                      className={cn('flex flex-col gap-4 w-full',
                        message.role === 'user' && 'bg-accent-foreground text-accent px-3 py-2 rounded-xl'
                      )}
                    >
                      {message.role === 'user' ? (
                        <p className="text-sm" key={key}>
                          {part.text}
                        </p>
                      ) : (
                        <Markdown content={part.text} id={key} />
                      )}
                    </div>
                  </div>
                );
              }

              if (type === 'tool-invocation') {
                const { toolInvocation } = part;
                const { toolName, toolCallId, state } = toolInvocation;

                if (state === 'call') {
                  const { args } = toolInvocation;

                  switch (toolName) {
                    case "flashcardGeneratorTool":
                      return (
                        <div key={key} className="flex flex-col items-start gap-2">
                          <Card className="w-full">
                            <CardHeader className="pb-2">
                              <div className="flex items-center gap-2">
                                <BookOpen className="h-4 w-4 text-primary" />
                                <CardTitle className="text-base">Flashcards Generated</CardTitle>
                              </div>
                              <CardDescription>
                                Click to view the flashcards in the canvas
                              </CardDescription>
                            </CardHeader>
                            <CardFooter>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openCanvas("flashcards")}
                                className="w-full transition-colors"
                              >
                                <BookOpen className="h-4 w-4 mr-2" /> View Flashcards
                              </Button>
                            </CardFooter>
                          </Card>
                        </div>
                      );
                    case "quizGeneratorTool":
                      return (
                        <div key={key} className="flex flex-col items-start gap-2">
                          <Card className="w-full">
                            <CardHeader className="pb-2">
                              <div className="flex items-center gap-2">
                                <HelpCircle className="h-4 w-4 text-primary" />
                                <CardTitle className="text-base">Quiz Generated</CardTitle>
                              </div>
                              <CardDescription>
                                Click to take the quiz in the canvas
                              </CardDescription>
                            </CardHeader>
                            <CardFooter>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openCanvas("quiz")}
                                className="w-full transition-colors"
                              >
                                <HelpCircle className="h-4 w-4 mr-2" /> Take Quiz
                              </Button>
                            </CardFooter>
                          </Card>
                        </div>
                      );
                    case "graphTool":
                      return (
                        <div key={key} className="flex flex-col items-start gap-2">
                          <GraphImage expressions={args.expressions} />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              clearGraph()
                              addExpression(args.expressions);
                              openCanvas("graph");
                            }}
                            className="transition-colors"
                          >
                            <LineChart className="h-4 w-4 text-primary" /> Open in Canvas
                          </Button>
                        </div>
                      );
                    case "mermaidTool":
                      return (
                        <div key={key} className="flex flex-col items-start gap-2">
                          <Card className="w-full">
                            <CardHeader className="pb-2">
                              <div className="flex items-center gap-2">
                                <GitBranch className="h-4 w-4 text-primary" />
                                <CardTitle className="text-base">Generating Diagram</CardTitle>
                              </div>
                              <CardDescription>
                                Creating a {args.diagramType} diagram based on your request
                              </CardDescription>
                            </CardHeader>
                          </Card>
                        </div>
                      );
                    default:
                      break;
                  }
                }

                if (state === 'result') {
                  const { result, args } = toolInvocation;

                  switch (toolName) {
                    case "flashcardGeneratorTool":
                      return (
                        <div key={key} className="flex flex-col items-start gap-2">
                          <Card className="w-full">
                            <CardHeader className="pb-2">
                              <div className="flex items-center gap-2">
                                <BookOpen className="h-4 w-4 text-primary" />
                                <CardTitle className="text-base">Flashcards on {result.topic} Ready</CardTitle>
                              </div>
                              <CardDescription>
                                {result.count} flashcards have been generated
                              </CardDescription>
                            </CardHeader>
                            <CardFooter>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openCanvas("flashcards")}
                                className="w-full transition-colors"
                              >
                                <BookOpen className="h-4 w-4 mr-2" /> View Flashcards
                              </Button>
                            </CardFooter>
                          </Card>
                        </div>
                      );
                    case "quizGeneratorTool":
                      return (
                        <div key={key} className="flex flex-col items-start gap-2">
                          <Card className="w-full">
                            <CardHeader className="pb-2">
                              <div className="flex items-center gap-2">
                                <HelpCircle className="h-4 w-4 text-primary" />
                                <CardTitle className="text-base">Quiz on {result.topic} Ready</CardTitle>
                              </div>
                              <CardDescription>
                                {result.count} questions have been generated
                              </CardDescription>
                            </CardHeader>
                            <CardFooter>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openCanvas("quiz")}
                                className="w-full transition-colors"
                              >
                                <HelpCircle className="h-4 w-4 mr-2" /> Take Quiz
                              </Button>
                            </CardFooter>
                          </Card>
                        </div>
                      );
                    case "deepResearch":
                      if (researchData.length <= 0) {
                        return <ResearchDisplay data={result} />;
                      }
                    case "graphTool":
                      return (
                        <div key={key} className="flex flex-col items-start gap-2">
                          <GraphImage expressions={args.expressions} />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              addExpression(args.expressions);
                              openCanvas("graph");
                            }}
                            className="transition-colors"
                          >
                            <LineChart className="h-4 w-4 text-primary" /> Open in Canvas
                          </Button>
                        </div>
                      );
                    case "mermaidTool":
                      return (
                        <div key={key} className="flex flex-col items-start gap-2">
                          <Card className="w-full">
                            <CardHeader className="pb-2">
                              <div className="flex items-center gap-2">
                                <GitBranch className="h-4 w-4 text-primary" />
                                <CardTitle className="text-base">Diagram Generated</CardTitle>
                              </div>
                              <CardDescription>
                                {args.diagramType} diagram based on your request
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <MermaidDiagram
                                chart={result}
                                onRetry={() => reload()}
                              />
                            </CardContent>
                          </Card>
                        </div>
                      );
                    default:
                      break;
                  }
                }
              }
            })}
          </div>

          <MessageActions
            key={`action-${message.id}`}
            error={error !== undefined}
            isLoading={isLoading}
            message={message}
            reload={reload}
            onDeleteTrailing={handleDeleteTrailing}
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export const PreviewMessage = memo(
  PurePreviewMessage,
  (prevProps, nextProps) => {
    if (prevProps.isLoading !== nextProps.isLoading) { return false };
    if (prevProps.message.id !== nextProps.message.id) { return false };
    if (!equal(prevProps.message.parts, nextProps.message.parts)) { return false };

    return true;
  },
);

export const ThinkingMessage = () => {
  const role = 'assistant';

  return (
    <motion.div
      data-testid="message-assistant-loading"
      className="w-full mx-auto max-w-3xl px-4 group/message"
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.2, ease: "easeOut", delay: 1 }}
      data-role={role}
    >
      <div className="flex gap-4 flex-col w-full group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl">
        <div className="size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border bg-background">
          <SparklesIcon className="h-4 w-4" />
        </div>

        <div className="flex flex-col gap-2 w-full">
          <div className="flex flex-col gap-4 text-muted-foreground">
            Hmm...
          </div>
        </div>
      </div>
    </motion.div>
  );
};
