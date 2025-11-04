'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RotateCcw,
  BarChart3,
  HelpCircle,
  LineChart,
  ChevronDown,
  X
} from 'lucide-react';
import { Button } from '@avenire/ui/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@avenire/ui/components/card';
import { Badge } from '@avenire/ui/components/badge';
import { cn } from '@avenire/ui/utils';
import { ToolType, UIMessagePart, UIDataTypes, UIMessage } from '@avenire/ai/tools/tools.types';
import { getFlashcardsForChat, getQuizzesForChat } from '../../actions/actions';
import { type Flashcard, type Quiz } from '../../lib/canvas_types';
import { type Mode } from './canvas/canvas';
import { useUploadThing } from '../../lib/uploadClient';
import { useTheme } from 'next-themes';
import { renderPlotOrchestrator } from '../../lib/plot-render-orchestrator';

interface DynamicIslandProps {
  chatId: string;
  chatTitle: string;
  messages: Array<UIMessage<unknown, UIDataTypes, ToolType>>;
  onOpenCanvas: (mode?: Mode) => void;
  isCanvasOpen: boolean;
  canvasMode?: Mode;
}

interface FeatureIndicator {
  type: 'flashcard' | 'quiz' | 'graph' | 'plot';
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  count: number;
  lastUsed?: Date;
  preview?: string;
  lastContent?: string;
  lastQuestion?: string;
  color?: string;
  previewImage?: string;
  previewText?: string;
}

export function DynamicIsland({
  chatId,
  chatTitle,
  messages,
  onOpenCanvas,
  isCanvasOpen,
  canvasMode
}: DynamicIslandProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hoveredFeature, setHoveredFeature] = useState<FeatureIndicator | null>(null);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [plotPreviews, setPlotPreviews] = useState<Record<string, string>>({});
  const { theme } = useTheme();
  const { startUpload } = useUploadThing("chatAttachments", {
    onUploadError: (error) => {
      console.error(error)
    },
  });

  const uploadFn = useCallback(async (file: File) => {
    if (!startUpload) {
      throw new Error("Upload thing not ready");
    }
    const uploadResponse = await startUpload([file]);
    if (!uploadResponse || !uploadResponse[0]?.url) {
      throw new Error("Upload failed");
    }
    return uploadResponse[0].url;
  }, [startUpload]);

  useEffect(() => {
    if (!startUpload) return;

    messages.forEach((message) => {
      message.parts.forEach((part, partIndex) => {
        if (part.type === 'tool-plotTool' && part.state === 'output-available') {
          const code = part.output as string;
          const key = `${message.id}-${partIndex}`;
          
          if (!plotPreviews[key] && code) {
            renderPlotOrchestrator({ code, uploadFn, theme: theme as 'light' | 'dark' })
              .then(result => {
                if ('url' in result) {
                  setPlotPreviews(prev => ({ ...prev, [key]: result.url }));
                }
              })
              .catch(err => {
                console.error("Failed to render plot preview:", err);
              });
          }
        }
      });
    });
  }, [messages, uploadFn, theme, startUpload, plotPreviews]);

  useEffect(() => {
    const hasFlashcardTool = messages.some(m => m.parts.some(p => p.type === 'tool-flashcardGeneratorTool'));
    if (hasFlashcardTool) {
      const fetchFlashcards = async () => {
        const { flashcards: fetchedFlashcards, error } = await getFlashcardsForChat({ chatId });
        if (!error && fetchedFlashcards) {
          const transformedFlashcards = fetchedFlashcards.flatMap(flashcard => {
            const content = flashcard.content as {
              cards: Array<{
                id: number;
                tags: string[];
                topic: string;
                answer: string;
                question: string;
                difficulty: string;
              }>
            }
            return content.cards.map(card => ({
              id: `${flashcard.id}-${card.id}`,
              question: card.question,
              answer: card.answer,
              topic: card.topic,
              difficulty: card.difficulty,
              createdAt: flashcard.createdAt
            }))
          })
          setFlashcards(transformedFlashcards);
        }
      };
      fetchFlashcards();
    }

    const hasQuizTool = messages.some(m => m.parts.some(p => p.type === 'tool-quizGeneratorTool'));
    if (hasQuizTool) {
      const fetchQuizzes = async () => {
        const { quizzes: fetchedQuizzes, error } = await getQuizzesForChat({ chatId });
        if (!error && fetchedQuizzes) {
          const transformedQuizzes: Quiz[] = fetchedQuizzes.flatMap(quiz => {
            const content = quiz.content as {
              questions: Array<{
                id: number;
                hint: string;
                type: string;
                correct: number;
                options: string[];
                question: string;
                difficulty: string;
                explanation: string;
                stepByStepSolution: string;
                commonMistakes: string[];
                learningObjectives: string[];
                followUpQuestions?: string[];
              }>
            }

            return content.questions.map(question => ({
              id: `${quiz.id}-${question.id}`,
              type: question.type as "MCQ" | "True/False" | "Image-based" | "Interactive" | "Problem-solving",
              question: question.question,
              options: question.options,
              correct: question.correct,
              explanation: question.explanation,
              hint: question.hint,
              difficulty: question.difficulty as "beginner" | "intermediate" | "advanced",
              stepByStepSolution: question.stepByStepSolution,
              commonMistakes: question.commonMistakes,
              learningObjectives: question.learningObjectives,
              followUpQuestions: question.followUpQuestions,
              createdAt: quiz.createdAt
            }))
          })
          setQuizzes(transformedQuizzes)
        }
      };
      fetchQuizzes();
    }
  }, [messages, chatId]);

  // Extract feature indicators from messages
  const featureIndicators = useMemo((): FeatureIndicator[] => {
    const features: Record<string, FeatureIndicator> = {};
    let lastUsedTool: string | null = null;

    messages.forEach(message => {
      const userQuestion = message.role === 'user' ? message.parts.find(p => p.type === 'text')?.text : '';

      message.parts.forEach((part, index) => {
        switch (part.type) {
          case 'tool-graphTool':
            if (!features.graph) {
              features.graph = {
                type: 'graph',
                icon: BarChart3,
                label: 'Graph',
                count: 0,
                preview: 'Interactive mathematical graphs',
                color: '#10b981' // Emerald
              };
            }
            features.graph.count++;
            features.graph.lastUsed = new Date();
            lastUsedTool = 'graph';

            if (userQuestion) {
              features.graph.lastQuestion = userQuestion.slice(0, 100) + (userQuestion.length > 100 ? '...' : '');
            }
            break;

          case 'tool-plotTool':
            if (!features.plot) {
              features.plot = {
                type: 'plot',
                icon: LineChart,
                label: 'Plot',
                count: 0,
                preview: 'Advanced data visualizations',
                color: '#f59e0b' // Amber
              };
            }
            features.plot.count++;
            features.plot.lastUsed = new Date();
            lastUsedTool = 'plot';

            const key = `${message.id}-${index}`;
            if (plotPreviews[key]) {
              features.plot.previewImage = plotPreviews[key];
            }

            if (userQuestion) {
              features.plot.lastQuestion = userQuestion.slice(0, 100) + (userQuestion.length > 100 ? '...' : '');
            }
            break;
        }
      });
    });

    if (flashcards.length > 0) {
      features.flashcard = {
        type: 'flashcard',
        icon: RotateCcw,
        label: 'Flashcards',
        count: flashcards.length,
        preview: 'Study cards for spaced repetition',
        color: '#8b5cf6' // Purple
      };
      const firstQuestion = flashcards[0].question;
      features.flashcard.lastQuestion = firstQuestion.slice(0, 100) + (firstQuestion.length > 100 ? '...' : '');
      features.flashcard.previewText = firstQuestion.slice(0, 30) + (firstQuestion.length > 30 ? '...' : '');
    }

    if (quizzes.length > 0) {
      features.quiz = {
        type: 'quiz',
        icon: HelpCircle,
        label: 'Quiz',
        count: quizzes.length,
        preview: 'Interactive questions and assessments',
        color: '#06b6d4' // Cyan
      };
      const firstQuestion = quizzes[0].question;
      features.quiz.lastQuestion = firstQuestion.slice(0, 100) + (firstQuestion.length > 100 ? '...' : '');
      features.quiz.previewText = firstQuestion.slice(0, 30) + (firstQuestion.length > 30 ? '...' : '');
    }

    // Mark the last used tool for glow effect
    if (lastUsedTool && features[lastUsedTool]) {
      features[lastUsedTool].color = features[lastUsedTool].color + '80'; // Add opacity for glow
    }

    return Object.values(features);
  }, [messages, flashcards, quizzes, plotPreviews]);

  const handleFeatureClick = (feature: FeatureIndicator) => {
    if (feature.type === 'flashcard') {
      onOpenCanvas('flashcards');
    } else if (feature.type === 'quiz') {
      onOpenCanvas('quiz');
    } else if (feature.type === 'graph') {
      onOpenCanvas('graph');
    }
    setIsExpanded(false);
  };

  const handleIslandClick = () => {
    if (!isExpanded) {
      setIsExpanded(true);
    }
  };

  const getFeatureMode = (feature: FeatureIndicator): Mode | undefined => {
    switch (feature.type) {
      case 'flashcard': return 'flashcards';
      case 'quiz': return 'quiz';
      case 'graph': return 'graph';
      default: return undefined;
    }
  };

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
      <motion.div
        className={cn(
          "bg-background/95 backdrop-blur-md border border-border/50 rounded-xl shadow-lg transition-all duration-300 cursor-pointer",
          isExpanded ? "w-80" : "w-auto"
        )}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{
          scale: 1,
          opacity: 1,
          width: isExpanded ? 320 : 'auto'
        }}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 20,
          bounce: 0.6
        }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        onClick={handleIslandClick}
      >
        {/* Main Island Content */}
        <div className="flex items-center gap-2 px-3 py-2">
          {/* Chat Title */}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-xs truncate">{chatTitle}</h3>
          </div>

          {/* Feature Indicators */}
          <div className="flex items-center gap-1">
            {featureIndicators.slice(0, isExpanded ? featureIndicators.length : 3).map((feature) => {
              const Icon = feature.icon;
              const isActive = canvasMode === getFeatureMode(feature) && isCanvasOpen;
              const hasGlow = feature.color?.includes('80');

              return (
                <motion.div
                  key={feature.type}
                  className="relative"
                  onHoverStart={() => setHoveredFeature(feature)}
                  onHoverEnd={() => setHoveredFeature(null)}
                >
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 3 }}
                    whileTap={{ scale: 0.9 }}
                    transition={{
                      type: "spring",
                      stiffness: 500,
                      damping: 15,
                      bounce: 0.8
                    }}
                    className={cn(
                      "rounded-md p-0.5",
                      hasGlow && "shadow-md",
                      hasGlow && `shadow-[${feature.color?.replace('80', '40')}]`
                    )}
                    style={{
                      boxShadow: hasGlow ? `0 0 15px ${feature.color?.replace('80', '40')}` : undefined
                    }}
                  >
                    <Button
                      variant={isActive ? "default" : "ghost"}
                      size="sm"
                      className={cn(
                        "h-6 w-6 p-0 relative transition-all duration-200",
                        isActive && "bg-primary text-primary-foreground"
                      )}
                      onClick={() => handleFeatureClick(feature)}
                    >
                      <Icon className="h-3 w-3" />
                      {feature.previewText && (
                        <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-background/90 backdrop-blur-sm border border-border/50 rounded px-1 py-0.5 text-[8px] text-muted-foreground whitespace-nowrap max-w-20 truncate">
                          {feature.previewText}
                        </div>
                      )}
                    </Button>
                  </motion.div>
                </motion.div>
              );
            })}

            {featureIndicators.length > 3 && !isExpanded && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setIsExpanded(true)}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Expand/Collapse Button */}
          {isExpanded && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setIsExpanded(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Expanded Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 border-t border-border/50">
                <div className="grid grid-cols-2 gap-3 mt-3">
                  {featureIndicators.map((feature, index) => {
                    const Icon = feature.icon;
                    const isActive = canvasMode === getFeatureMode(feature) && isCanvasOpen;
                    const hasGlow = feature.color?.includes('80');

                    return (
                      <motion.div
                        key={feature.type}
                        initial={{ opacity: 0, y: 30, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{
                          delay: index * 0.1,
                          type: "spring",
                          stiffness: 400,
                          damping: 20,
                          bounce: 0.6
                        }}
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        className={cn(
                          "rounded-lg",
                          hasGlow && "shadow-lg",
                          hasGlow && `shadow-[${feature.color?.replace('80', '40')}]`
                        )}
                        style={{
                          boxShadow: hasGlow ? `0 0 15px ${feature.color?.replace('80', '40')}` : undefined
                        }}
                      >
                        <Button
                          variant={isActive ? "default" : "outline"}
                          className={cn(
                            "h-auto p-4 flex flex-col items-center gap-3 text-xs transition-all duration-200 w-full",
                            isActive && "bg-primary text-primary-foreground"
                          )}
                          onClick={() => handleFeatureClick(feature)}
                        >
                          {feature.previewImage ? (
                            <img src={feature.previewImage} alt={feature.label} className="h-12 w-auto rounded-md object-contain" />
                          ) : (
                            <Icon className="h-6 w-6" />
                          )}
                          <div className="text-center">
                            <div className="font-medium">{feature.label}</div>
                            {feature.previewText && (
                              <div className="text-muted-foreground text-[10px] mt-1 line-clamp-2">
                                {feature.previewText}
                              </div>
                            )}
                          </div>
                        </Button>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hover Preview Card */}
        <AnimatePresence>
          {isHovered && hoveredFeature && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.8 }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 20,
                bounce: 0.6
              }}
              className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 z-10"
            >
              <Card className="w-80 shadow-lg border border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <hoveredFeature.icon className="h-4 w-4" />
                    {hoveredFeature.label}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {hoveredFeature.previewImage && (
                    <div className="mb-2 overflow-hidden rounded-md border border-border/50">
                      <img src={hoveredFeature.previewImage} alt={hoveredFeature.label} className="w-full h-auto object-contain" />
                    </div>
                  )}
                  {hoveredFeature.lastQuestion ? (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-foreground">Last Question:</p>
                      <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded-md">
                        "{hoveredFeature.lastQuestion}"
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      {hoveredFeature.preview}
                    </p>
                  )}
                  {hoveredFeature.count > 0 && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      {hoveredFeature.count} {hoveredFeature.count === 1 ? 'item' : 'items'} created
                    </div>
                  )}
                  <div className="mt-2 text-xs text-muted-foreground">
                    Click to open {hoveredFeature.label.toLowerCase()}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
