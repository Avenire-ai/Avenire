"use client"

import { useState, useEffect } from "react"
import { motion, useMotionValue, useTransform, useDragControls, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight, Check, ChevronsUpDown } from "lucide-react"
import { Button } from "@avenire/ui/components/button"
import { Popover, PopoverContent, PopoverTrigger } from "@avenire/ui/components/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@avenire/ui/components/command"
import { Badge } from "@avenire/ui/components/badge"
import { useIsMobile as useMobile } from "@avenire/ui/src/hooks/use-mobile"
import { Card, CardContent } from "@avenire/ui/components/card"
import { getFlashcardsForChat } from "../../../actions/actions"
import { Markdown } from "../../markdown"
import { type Flashcard } from "../../../lib/canvas_types"
import { useCanvasStore } from "../../../stores/canvasStore"


interface FlashcardViewerProps {
  chatId: string
}

export function FlashcardViewer({ chatId }: FlashcardViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [direction, setDirection] = useState(0)
  const [selectedTopic, setSelectedTopic] = useState<string>("")
  const [topicOpen, setTopicOpen] = useState(false)
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const isMobile = useMobile()
  const { setCurrentFlashcard: setCurrentFlashcardStore } = useCanvasStore()

  const x = useMotionValue(0)
  const rotateY = useTransform(x, [-200, 0, 200], [-10, 0, 10])
  const dragControls = useDragControls()

  useEffect(() => {
    const fetchFlashcards = async () => {
      setIsLoading(true)
      const { flashcards, error } = await getFlashcardsForChat({ chatId })
      if (!error && flashcards) {
        // Transform the flashcards to match the Flashcard interface
        const transformedFlashcards = flashcards.flatMap(flashcard => {
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
            id: `${flashcard.id}-${card.id}`, // Create a unique ID combining parent and card ID
            question: card.question,
            answer: card.answer,
            topic: card.topic,
            difficulty: card.difficulty,
            createdAt: flashcard.createdAt
          }))
        })
        setFlashcards(transformedFlashcards)
      }
      setIsLoading(false)
    }

    fetchFlashcards()
  }, [chatId])

  // Filter flashcards based on selected filters
  const filteredCards = flashcards.filter((card) => {
    const topicMatch = !selectedTopic || card.topic === selectedTopic
    return topicMatch
  })

  // Reset current index if it's out of bounds after filtering
  const safeCurrentIndex = Math.min(currentIndex, filteredCards.length - 1)
  const currentCard = filteredCards[safeCurrentIndex]

  const allTopics = Array.from(new Set(flashcards.map((card) => card.topic)))

  const nextCard = () => {
    if (safeCurrentIndex < filteredCards.length - 1) {
      setDirection(1)
      setCurrentIndex(safeCurrentIndex + 1)
      setIsFlipped(false)
      setCurrentFlashcardStore(filteredCards[safeCurrentIndex + 1])
    }
  }

  const prevCard = () => {
    if (safeCurrentIndex > 0) {
      setDirection(-1)
      setCurrentIndex(safeCurrentIndex - 1)
      setIsFlipped(false)
      setCurrentFlashcardStore(filteredCards[safeCurrentIndex - 1])
    }
  }

  const handleDragEnd = (event: unknown, info: { offset: { x: number; y: number } }) => {
    const threshold = 100
    if (info.offset.x > threshold && safeCurrentIndex > 0) {
      prevCard()
    } else if (info.offset.x < -threshold && safeCurrentIndex < filteredCards.length - 1) {
      nextCard()
    }
  }

  const clearFilters = () => {
    setSelectedTopic("")
    setCurrentIndex(0)
  }

  const cardVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
      rotateY: direction > 0 ? 45 : -45,
    }),
    center: {
      x: 0,
      opacity: 1,
      rotateY: 0,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
      rotateY: direction < 0 ? 45 : -45,
    }),
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-2">
          <p className="text-muted-foreground">Loading flashcards...</p>
        </div>
      </div>
    )
  }

  if (filteredCards.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Flashcards</h3>
          <Button variant="outline" size="sm" onClick={clearFilters}>
            Clear Filters
          </Button>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-2">
            <p className="text-muted-foreground">No flashcards available</p>
            <Button variant="outline" onClick={clearFilters}>
              Reset Filters
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Flashcards</h3>
          <span className="text-sm text-muted-foreground">
            {safeCurrentIndex + 1}/{filteredCards.length}
          </span>
        </div>

        {/* Single Topic Combobox */}
        <Popover open={topicOpen} onOpenChange={setTopicOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              {selectedTopic || "Select topic..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0">
            <Command>
              <CommandInput placeholder="Search topics..." />
              <CommandList>
                <CommandEmpty>No topics found.</CommandEmpty>
                <CommandGroup>
                  <CommandItem
                    onSelect={() => {
                      setSelectedTopic("")
                      setTopicOpen(false)
                    }}
                  >
                    <Check className={`mr-2 h-4 w-4 ${!selectedTopic ? "opacity-100" : "opacity-0"}`} />
                    All Topics
                  </CommandItem>
                  {allTopics.map((topic) => (
                    <CommandItem
                      key={topic}
                      onSelect={() => {
                        setSelectedTopic(topic)
                        setTopicOpen(false)
                      }}
                    >
                      <Check className={`mr-2 h-4 w-4 ${selectedTopic === topic ? "opacity-100" : "opacity-0"}`} />
                      {topic}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Card container */}
      <div className="flex items-center justify-center py-8">
        <div className="relative w-full max-w-sm h-64">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={`${safeCurrentIndex}-${currentCard.id}`}
              custom={direction}
              variants={cardVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
              }}
              drag={isMobile ? "x" : false}
              dragControls={dragControls}
              dragConstraints={{ left: 0, right: 0 }}
              onDragEnd={handleDragEnd}
              style={{
                x: isMobile ? x : 0,
                rotateY: !isMobile ? rotateY : 0,
                transformStyle: "preserve-3d",
              }}
              whileHover={
                !isMobile
                  ? {
                    scale: 1.02,
                    rotateX: 5,
                    transition: { duration: 0.2 },
                  }
                  : {}
              }
              className="absolute inset-0 cursor-pointer"
              onClick={() => setIsFlipped(!isFlipped)}
            >
              <motion.div
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.6, type: "spring" }}
                className="relative w-full h-full"
                style={{ transformStyle: "preserve-3d" }}
              >
                {/* Front of card */}
                <div
                  className="absolute inset-0 bg-card rounded-xl p-6 flex flex-col justify-between text-card-foreground shadow-lg border"
                  style={{ backfaceVisibility: "hidden" }}
                >
                  <div className="text-center font-medium flex-1 flex items-center justify-center text-lg">
                    <Markdown content={currentCard.question} id={`flashcard-question-${currentCard.id}`} />
                  </div>
                  <p className="text-xs text-center text-muted-foreground">{currentCard.topic}</p>
                </div>

                {/* Back of card */}
                <div
                  className="absolute inset-0 bg-muted rounded-xl p-6 flex items-center justify-center text-muted-foreground shadow-lg border"
                  style={{
                    backfaceVisibility: "hidden",
                    transform: "rotateY(180deg)",
                  }}
                >
                  <div className="text-center text-sm leading-relaxed">
                    <Markdown content={currentCard.answer} id={`flashcard-answer-${currentCard.id}`} />
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={prevCard}
          disabled={safeCurrentIndex === 0}
          className="flex items-center gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>

        <Button variant="ghost" size="sm" onClick={() => setIsFlipped(!isFlipped)} className="text-muted-foreground">
          {isFlipped ? "Show Question" : "Show Answer"}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={nextCard}
          disabled={safeCurrentIndex === filteredCards.length - 1}
          className="flex items-center gap-2"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Mobile swipe hint */}
      {isMobile && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs text-center text-muted-foreground"
        >
          Swipe left/right to navigate • Tap to flip
        </motion.p>
      )}

      {/* Flashcard Preview - integrated into main scroll */}
      <div className="space-y-4 border-t pt-6">
        <h4 className="text-sm font-medium">All Flashcards</h4>
        <div className="space-y-3">
          {filteredCards.map((card, index) => (
            <Card
              key={card.id}
              className={`cursor-pointer transition-colors hover:bg-accent ${index === safeCurrentIndex ? "bg-accent" : ""
                }`}
              onClick={() => {
                setCurrentIndex(index)
                setIsFlipped(false)
              }}
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-medium text-sm">
                    {index + 1}) <Markdown content={card.question} id={`preview-question-${card.id}`} />
                  </div>
                </div>
                <div className="text-xs text-muted-foreground leading-relaxed">
                  <Markdown content={card.answer} id={`preview-answer-${card.id}`} />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">{card.topic}</span>
                  <Badge variant="outline" className="text-xs">
                    {card.difficulty}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
