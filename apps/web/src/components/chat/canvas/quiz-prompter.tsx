"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, CheckCircle, XCircle, RotateCcw, Trophy, ChevronLeft, ChevronRight, Lightbulb, Target, AlertTriangle, BookOpen, Brain, PartyPopper, Copy } from "lucide-react"
import { Button } from "@avenire/ui/components/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@avenire/ui/components/select"
import { Badge } from "@avenire/ui/components/badge"
import { Card, CardContent } from "@avenire/ui/components/card"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@avenire/ui/components/sheet"
import { getQuizzesForChat, convertQuizToFlashcard } from "../../../actions/actions"
import { Markdown } from "../../markdown"
import { type Quiz } from "../../../lib/canvas_types"
import { useCanvasStore } from "../../../stores/canvasStore"

interface QuizPrompterProps {
  chatId: string
}

// Confetti component
function Confetti({ isVisible }: { isVisible: boolean }) {
  if (!isVisible) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {Array.from({ length: 50 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full"
          initial={{
            x: Math.random() * window.innerWidth,
            y: -10,
            rotate: 0,
            scale: 0,
          }}
          animate={{
            y: window.innerHeight + 10,
            rotate: 360,
            scale: [0, 1, 0],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            delay: Math.random() * 0.5,
            ease: "easeOut",
          }}
          style={{
            left: `${Math.random() * 100}%`,
          }}
        />
      ))}
      {Array.from({ length: 30 }).map((_, i) => (
        <motion.div
          key={`star-${i}`}
          className="absolute w-1 h-1 bg-blue-400 rounded-full"
          initial={{
            x: Math.random() * window.innerWidth,
            y: -10,
            rotate: 0,
            scale: 0,
          }}
          animate={{
            y: window.innerHeight + 10,
            rotate: 720,
            scale: [0, 1, 0],
          }}
          transition={{
            duration: 2.5 + Math.random() * 1.5,
            delay: Math.random() * 0.3,
            ease: "easeOut",
          }}
          style={{
            left: `${Math.random() * 100}%`,
          }}
        />
      ))}
    </div>
  )
}

export function QuizPrompter({ chatId }: QuizPrompterProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showExplanation, setShowExplanation] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [showQuestionInfo, setShowQuestionInfo] = useState(false)
  const [score, setScore] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const [answered, setAnswered] = useState(false)
  const [skippedQuestions, setSkippedQuestions] = useState<number[]>([])
  const [selectedType, setSelectedType] = useState("All")
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showConfetti, setShowConfetti] = useState(false)
  const [answerResult, setAnswerResult] = useState<"correct" | "incorrect" | null>(null)
  const [isConverting, setIsConverting] = useState(false)
  const { setCurrentQuestion: setCurrentQuestionStore } = useCanvasStore()

  useEffect(() => {
    const fetchQuizzes = async () => {
      setIsLoading(true)
      const { quizzes, error } = await getQuizzesForChat({ chatId })
      if (!error && quizzes) {
        // Transform the quizzes to match the Quiz interface
        const transformedQuizzes: Quiz[] = quizzes.flatMap(quiz => {
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
            id: `${quiz.id}-${question.id}`, // Create a unique ID combining parent and question ID
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
      setIsLoading(false)
    }

    fetchQuizzes()
  }, [chatId])

  // Filter questions based on selected type
  const filteredQuestions = quizzes.filter((q) => selectedType === "All" || q.type === selectedType)

  const question = filteredQuestions[currentQuestion]
  const totalQuestions = filteredQuestions.length

  const questionTypes = ["All", ...Array.from(new Set(quizzes.map((q) => q.type)))]

  const handleAnswerSelect = (answerIndex: number) => {
    if (answered) return

    setSelectedAnswer(answerIndex)
    setAnswered(true)
    setShowExplanation(true)

    const isCorrect = answerIndex === question.correct
    setAnswerResult(isCorrect ? "correct" : "incorrect")

    if (isCorrect) {
      setScore(score + 1)
      setShowConfetti(true)
      // Hide confetti after 3 seconds
      setTimeout(() => setShowConfetti(false), 3000)
    }
  }

  const nextQuestion = () => {
    if (currentQuestion < filteredQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
      setSelectedAnswer(null)
      setShowExplanation(false)
      setShowHint(false)
      setAnswered(false)
      setAnswerResult(null)
      setCurrentQuestionStore(quizzes[currentQuestion + 1])
    } else {
      setIsComplete(true)
    }
  }

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
      setSelectedAnswer(null)
      setShowExplanation(false)
      setShowHint(false)
      setAnswered(false)
      setAnswerResult(null)
      setCurrentQuestionStore(quizzes[currentQuestion - 1])
    }
  }

  const skipQuestion = () => {
    setSkippedQuestions([...skippedQuestions, Number(question.id)])
    nextQuestion()
  }

  const resetQuiz = () => {
    setCurrentQuestion(0)
    setSelectedAnswer(null)
    setShowExplanation(false)
    setShowHint(false)
    setScore(0)
    setIsComplete(false)
    setAnswered(false)
    setSkippedQuestions([])
    setAnswerResult(null)
  }

  const getScoreMessage = () => {
    const percentage = (score / totalQuestions) * 100
    if (percentage >= 80) return "Excellent! 🎉"
    if (percentage >= 60) return "Good job! 👍"
    if (percentage >= 40) return "Not bad! 📚"
    return "Keep studying! 💪"
  }

  // Removed getDifficultyColor - using minimal badges only

  const handleConvertToFlashcard = async () => {
    if (!question) return;
    
    setIsConverting(true);
    try {
      // Extract quiz ID from question ID (format: quizId-questionId)
      const quizId = question.id.split('-').slice(0, -1).join('-');
      const questionIndex = parseInt(question.id.split('-').pop() || '0');
      
      const result = await convertQuizToFlashcard({ 
        quizId, 
        questionIndex 
      });
      
      if (result.success) {
        // Could show a toast notification here
        console.log('Flashcard created successfully');
      }
    } catch (error) {
      console.error('Failed to convert to flashcard', error);
    } finally {
      setIsConverting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-2">
          <p className="text-muted-foreground">Loading quiz...</p>
        </div>
      </div>
    )
  }

  if (filteredQuestions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4 text-center">
        <p className="text-muted-foreground">No questions available for the selected type.</p>
        <Button variant="outline" onClick={() => setSelectedType("All")}>
          Show All Questions
        </Button>
      </div>
    )
  }

  if (isComplete) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center h-full space-y-6 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        >
          <Trophy className="h-16 w-16 text-primary mx-auto" />
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="space-y-2"
        >
          <h3 className="text-2xl font-bold">Quiz Complete!</h3>
          <p className="text-lg text-muted-foreground">{getScoreMessage()}</p>
        </motion.div>

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.6, type: "spring" }}
          className="space-y-2"
        >
          <div className="text-4xl font-bold">
            {score}/{totalQuestions}
          </div>
          {skippedQuestions.length > 0 && (
            <p className="text-sm text-muted-foreground">{skippedQuestions.length} question(s) skipped</p>
          )}
        </motion.div>

        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.8 }}>
          <Button onClick={resetQuiz} className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4" />
            Try Again
          </Button>
        </motion.div>
      </motion.div>
    )
  }

  return (
    <>
      <Confetti isVisible={showConfetti} />
      <div className="space-y-6">
        {/* Header with filter */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Quiz</h3>
            <div className="flex items-center gap-2">
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-32 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {questionTypes.map((type) => (
                    <SelectItem key={type} value={type} className="text-xs">
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">
                {currentQuestion + 1}/{totalQuestions}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handleConvertToFlashcard}
              disabled={isConverting}
              className="flex items-center gap-2"
            >
              <Copy className="h-4 w-4" />
              {isConverting ? "Converting..." : "Convert to Flashcard"}
            </Button>
          </div>
        </div>

        {/* Answer Result Banner - Minimal Design */}
        <AnimatePresence>
          {answerResult && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="p-4 rounded-lg border bg-muted"
            >
              <div className="flex items-center gap-3">
                {answerResult === "correct" ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-foreground" />
                    <div>
                      <h4 className="font-semibold text-foreground">Correct</h4>
                      <p className="text-sm text-muted-foreground">Great job!</p>
                    </div>
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-foreground" />
                    <div>
                      <h4 className="font-semibold text-foreground">Incorrect</h4>
                      <p className="text-sm text-muted-foreground">Check the explanation below.</p>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Question */}
        <div className="space-y-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${currentQuestion}-${question.id}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Question Header */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Problem {question.id}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{question.type}</Badge>
                  <Badge variant="secondary">{question.difficulty}</Badge>
                  <Sheet open={showQuestionInfo} onOpenChange={setShowQuestionInfo}>
                    <SheetTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <BookOpen className="h-4 w-4" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-full sm:max-w-md">
                      <SheetHeader>
                        <SheetTitle>Question Information</SheetTitle>
                        <SheetDescription>
                          Additional details about this question
                        </SheetDescription>
                      </SheetHeader>
                      <div className="mt-6 space-y-6">
                        {question.learningObjectives.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-3">
                              <Target className="h-4 w-4 text-muted-foreground" />
                              <h5 className="font-medium">Learning Objectives</h5>
                            </div>
                            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                              {question.learningObjectives.map((objective, index) => (
                                <li key={index}>
                                  <Markdown content={objective} id={`quiz-objective-sheet-${question.id}-${index}`} />
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                            <h5 className="font-medium">Difficulty</h5>
                          </div>
                          <Badge variant="secondary">{question.difficulty}</Badge>
                        </div>
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>
              </div>

              {/* Question Text */}
              <div className="space-y-6">
                <div className="text-lg font-medium leading-relaxed">
                  <Markdown content={question.question} id={`quiz-question-${question.id}`} />
                </div>

                {/* Options */}
                <div className="space-y-3">
                  {question.options.map((option, index) => {
                    const isSelected = selectedAnswer === index
                    const isCorrect = index === question.correct
                    const showResult = answered

                    return (
                      <motion.label
                        key={index}
                        className={`flex items-center space-x-3 p-4 rounded-lg cursor-pointer transition-all ${showResult
                          ? isCorrect
                            ? "bg-muted border-2 border-border"
                            : isSelected
                              ? "bg-muted border-2 border-border"
                              : "bg-muted/50 border border-border"
                          : isSelected
                            ? "bg-accent border border-border"
                            : "hover:bg-accent/50 border border-border"
                          }`}
                        whileHover={!answered ? { scale: 1.01 } : {}}
                        whileTap={!answered ? { scale: 0.98 } : {}}
                      >
                        <input
                          type="radio"
                          name="answer"
                          value={index}
                          checked={isSelected}
                          onChange={() => setSelectedAnswer(index)}
                          disabled={answered}
                          className="w-4 h-4"
                        />
                        <div className="flex-1">
                          <Markdown content={option} id={`quiz-option-${question.id}-${index}`} />
                        </div>
                        {showResult && (
                          <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ duration: 0.3, type: "spring" }}
                          >
                            {isCorrect ? (
                              <CheckCircle className="h-5 w-5 text-foreground" />
                            ) : isSelected ? (
                              <XCircle className="h-5 w-5 text-foreground" />
                            ) : null}
                          </motion.div>
                        )}
                      </motion.label>
                    )
                  })}
                </div>

                {/* Submit button */}
                {!answered && selectedAnswer !== null && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="pt-2"
                  >
                    <Button
                      onClick={() => handleAnswerSelect(selectedAnswer)}
                      className="w-full py-3 text-base font-medium"
                      size="lg"
                    >
                      Submit Answer
                    </Button>
                  </motion.div>
                )}
              </div>

              {/* Explanation */}
              <AnimatePresence>
                {showExplanation && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.4, ease: "easeInOut" }}
                    className="overflow-hidden border-t pt-6 space-y-6"
                  >
                    {/* Step by Step Solution */}
                    <Card className="bg-muted border-border">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Brain className="h-4 w-4 text-muted-foreground" />
                          <h5 className="font-medium">Step-by-Step Solution</h5>
                        </div>
                        <div className="text-sm text-muted-foreground leading-relaxed">
                          <Markdown content={question.stepByStepSolution} id={`quiz-solution-${question.id}`} />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Common Mistakes */}
                    {question.commonMistakes.length > 0 && (
                      <Card className="bg-muted border-border">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                            <h5 className="font-medium">Common Mistakes to Avoid</h5>
                          </div>
                          <ul className="list-disc list-inside space-y-2">
                            {question.commonMistakes.map((mistake, index) => (
                              <li key={index} className="text-sm text-muted-foreground">
                                <Markdown content={mistake} id={`quiz-mistake-${question.id}-${index}`} />
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}

                    {/* Follow-up Questions */}
                    {question.followUpQuestions && question.followUpQuestions.length > 0 && (
                      <Card className="bg-muted border-border">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                            <h5 className="font-medium">Related Questions to Explore</h5>
                          </div>
                          <ul className="list-disc list-inside space-y-2">
                            {question.followUpQuestions.map((followUp, index) => (
                              <li key={index} className="text-sm text-muted-foreground">
                                <Markdown content={followUp} id={`quiz-followup-${question.id}-${index}`} />
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}

                    {/* Original Explanation */}
                    <Card className="bg-muted/50 border-border">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Lightbulb className="h-4 w-4 text-muted-foreground" />
                          <h5 className="font-medium text-foreground">Explanation</h5>
                        </div>
                        <div className="text-sm text-muted-foreground leading-relaxed">
                          <Markdown content={question.explanation} id={`quiz-explanation-${question.id}`} />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Hint button with Sheet */}
        <Sheet open={showHint} onOpenChange={setShowHint}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              disabled={answered}
              className="flex items-center gap-2"
            >
              <Lightbulb className="h-4 w-4" />
              Show Hint
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:max-w-md">
            <SheetHeader>
              <SheetTitle>Hint</SheetTitle>
              <SheetDescription>
                A hint to help you with this question
              </SheetDescription>
            </SheetHeader>
            <div className="mt-6">
              <div className="text-sm text-muted-foreground leading-relaxed">
                <Markdown content={question.hint} id={`quiz-hint-${question.id}`} />
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between gap-2 pt-4 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={prevQuestion}
            disabled={currentQuestion === 0}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={skipQuestion}
            disabled={answered && currentQuestion === filteredQuestions.length - 1}
            className="flex items-center gap-2"
          >
            Skip
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={nextQuestion}
            disabled={currentQuestion === filteredQuestions.length - 1}
            className="flex items-center gap-2"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </>
  )
}
