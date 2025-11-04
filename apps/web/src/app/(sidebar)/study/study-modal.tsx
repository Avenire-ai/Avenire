"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@avenire/ui/components/dialog"
import { Button } from "@avenire/ui/components/button"
import { Card, CardContent } from "@avenire/ui/components/card"
import { Badge } from "@avenire/ui/components/badge"
import { RotateCcw, HelpCircle, CheckCircle, XCircle, ChevronLeft, ChevronRight } from "lucide-react"
import { Markdown } from "../../../components/markdown"
import { motion, AnimatePresence } from "framer-motion"
import { updateFlashcardProgressAction, updateQuizProgressAction, getFlashcardContentAction, getQuizContentAction } from "../../../actions/actions"

interface StudyModalProps {
  open: boolean
  onClose: () => void
  recommendation: {
    id: string
    type: "flashcard" | "quiz"
    flashcardId?: string
    quizId?: string
    cardIndex?: number
    questionIndex?: number
    topic: string
    question?: string
    answer?: string
    options?: string[]
    correct?: number
    explanation?: string
  }
}

export function StudyModal({ open, onClose, recommendation }: StudyModalProps) {
  const [question, setQuestion] = useState("")
  const [answer, setAnswer] = useState("")
  const [options, setOptions] = useState<string[]>([])
  const [correctAnswer, setCorrectAnswer] = useState(0)
  const [explanation, setExplanation] = useState("")
  const [isFlipped, setIsFlipped] = useState(false)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)
  const [confidence, setConfidence] = useState(3)
  const [correct, setCorrect] = useState(false)
  const [timeSpent, setTimeSpent] = useState(0)
  const [startTime, setStartTime] = useState(Date.now())
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (open) {
      loadContent()
      setTimeSpent(0)
      setStartTime(Date.now())
    } else {
      setIsFlipped(false)
      setSelectedAnswer(null)
      setShowResult(false)
      setShowFeedback(false)
      setConfidence(3)
    }
  }, [open, recommendation])

  const loadContent = async () => {
    setIsLoading(true)
    try {
      // If content is already available from recommendations, use it
      if (recommendation.type === "flashcard") {
        if (recommendation.question && recommendation.answer) {
          setQuestion(recommendation.question)
          setAnswer(recommendation.answer)
          setIsLoading(false)
          return
        }
        // Otherwise fetch from server
        const result = await getFlashcardContentAction({ flashcardId: recommendation.flashcardId! })
        if (result.content) {
          const content = result.content as { cards: Array<any> }
          const card = content.cards[recommendation.cardIndex!]
          setQuestion(card.question)
          setAnswer(card.answer)
        }
      } else {
        if (recommendation.question && recommendation.options) {
          setQuestion(recommendation.question)
          setOptions(recommendation.options)
          setCorrectAnswer(recommendation.correct ?? 0)
          setExplanation(recommendation.explanation || "")
          setIsLoading(false)
          return
        }
        // Otherwise fetch from server
        const result = await getQuizContentAction({ quizId: recommendation.quizId! })
        if (result.content) {
          const content = result.content as { questions: Array<any> }
          const question = content.questions[recommendation.questionIndex!]
          setQuestion(question.question)
          setOptions(question.options)
          setCorrectAnswer(question.correct)
          setExplanation(question.explanation)
        }
      }
    } catch (error) {
      console.error("Failed to load content", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFlashcardSubmit = () => {
    setShowFeedback(true)
    setTimeSpent(Math.floor((Date.now() - startTime) / 1000))
  }

  const handleQuizSubmit = () => {
    const isCorrect = selectedAnswer === correctAnswer
    setCorrect(isCorrect)
    setShowResult(true)
    setTimeSpent(Math.floor((Date.now() - startTime) / 1000))
  }

  const handleFinish = async () => {
    try {
      if (recommendation.type === "flashcard") {
        await updateFlashcardProgressAction({
          flashcardId: recommendation.flashcardId!,
          cardIndex: recommendation.cardIndex!,
          confidence,
          correct,
          timeSpent,
        })
      } else {
        await updateQuizProgressAction({
          quizId: recommendation.quizId!,
          questionIndex: recommendation.questionIndex!,
          confidence,
          correct,
          timeSpent,
          selectedAnswer: selectedAnswer || undefined,
        })
      }
      onClose()
    } catch (error) {
      console.error("Failed to update progress", error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Study {recommendation.type === "flashcard" ? "Flashcard" : "Quiz Question"}
          </DialogTitle>
          <DialogDescription>{recommendation.topic}</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {recommendation.type === "flashcard" ? (
              <>
                <Card className="min-h-[300px] border">
                  <CardContent className="p-8">
                    <div className="relative w-full h-full min-h-[250px]">
                      <motion.div
                        animate={{ rotateY: isFlipped ? 180 : 0 }}
                        transition={{ duration: 0.6, type: "spring" }}
                        className="relative w-full h-full"
                        style={{ transformStyle: "preserve-3d" }}
                      >
                        <div
                          className="absolute inset-0 bg-card rounded-xl p-6 flex flex-col justify-between text-card-foreground shadow-lg border cursor-pointer"
                          style={{ backfaceVisibility: "hidden" }}
                          onClick={() => setIsFlipped(!isFlipped)}
                        >
                          <div className="text-center font-medium flex-1 flex items-center justify-center text-lg">
                            <Markdown content={question} id="study-modal-question" />
                          </div>
                        </div>
                        <div
                          className="absolute inset-0 bg-muted rounded-xl p-6 flex items-center justify-center text-muted-foreground shadow-lg border cursor-pointer"
                          style={{
                            backfaceVisibility: "hidden",
                            transform: "rotateY(180deg)",
                          }}
                          onClick={() => setIsFlipped(!isFlipped)}
                        >
                          <div className="text-center text-sm leading-relaxed">
                            <Markdown content={answer} id="study-modal-answer" />
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  </CardContent>
                </Card>

                {!showFeedback && isFlipped && (
                  <div className="flex gap-2 justify-center">
                    <Button variant="outline" onClick={() => { setCorrect(false); handleFlashcardSubmit() }}>
                      <XCircle className="h-4 w-4 mr-2" />
                      Incorrect
                    </Button>
                    <Button onClick={() => { setCorrect(true); handleFlashcardSubmit() }}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Correct
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <>
                <Card className="border">
                  <CardContent className="p-6 space-y-6">
                    <div className="text-lg font-medium">
                      <Markdown content={question} id="study-modal-quiz-question" />
                    </div>

                    <div className="space-y-3">
                      {options.map((option, index) => (
                        <button
                          key={index}
                          className={`w-full p-4 rounded-lg border text-left transition-all ${
                            showResult
                              ? index === correctAnswer
                                ? "bg-muted border-border"
                                : selectedAnswer === index
                                ? "bg-muted border-border"
                                : "bg-muted/50 border-border"
                              : selectedAnswer === index
                              ? "bg-accent border-border"
                              : "bg-muted/50 border-border hover:bg-accent/50"
                          } ${showResult ? "cursor-default" : "cursor-pointer"}`}
                          onClick={() => !showResult && setSelectedAnswer(index)}
                          disabled={showResult}
                        >
                          <div className="flex items-start gap-2">
                            <span className="font-medium text-muted-foreground">
                              {String.fromCharCode(65 + index)}.
                            </span>
                            <div className="flex-1">
                              <Markdown content={option} id={`study-modal-option-${index}`} />
                            </div>
                            {showResult && index === correctAnswer && (
                              <CheckCircle className="h-5 w-5 text-foreground flex-shrink-0" />
                            )}
                            {showResult && selectedAnswer === index && index !== correctAnswer && (
                              <XCircle className="h-5 w-5 text-foreground flex-shrink-0" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>

                    {showResult && (
                      <div className="pt-4 border-t">
                        <p className="font-medium mb-2">Explanation:</p>
                        <div className="text-sm text-muted-foreground">
                          <Markdown content={explanation} id="study-modal-explanation" />
                        </div>
                      </div>
                    )}

                    {!showResult && selectedAnswer !== null && (
                      <Button onClick={handleQuizSubmit} className="w-full">
                        Submit Answer
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </>
            )}

            {(showFeedback || showResult) && (
              <Card className="border bg-muted/50">
                <CardContent className="p-6 space-y-4">
                  <h4 className="font-semibold">How did you do?</h4>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Confidence Level (1-5)
                      </label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((level) => (
                          <Button
                            key={level}
                            type="button"
                            variant={confidence === level ? "default" : "outline"}
                            size="sm"
                            onClick={() => setConfidence(level)}
                          >
                            {level}
                          </Button>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        1 = Very unsure, 5 = Completely confident
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Time Spent:</span>
                      <span className="font-medium">{timeSpent} seconds</span>
                    </div>
                  </div>

                  <Button onClick={handleFinish} className="w-full">
                    Save Progress
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

