"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, CheckCircle, XCircle, RotateCcw, Trophy, ChevronLeft, ChevronRight, Lightbulb, Target, AlertTriangle, BookOpen, Brain, PartyPopper } from "lucide-react"
import { Button } from "@avenire/ui/components/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@avenire/ui/components/select"
import { Badge } from "@avenire/ui/components/badge"
import { Card, CardContent } from "@avenire/ui/components/card"
import { getQuizzesForChat } from "../../../actions/actions"
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
  const [score, setScore] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const [answered, setAnswered] = useState(false)
  const [skippedQuestions, setSkippedQuestions] = useState<number[]>([])
  const [selectedType, setSelectedType] = useState("All")
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showConfetti, setShowConfetti] = useState(false)
  const [answerResult, setAnswerResult] = useState<"correct" | "incorrect" | null>(null)
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

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner": return "bg-primary/10 text-primary border-primary/20"
      case "intermediate": return "bg-orange-500/10 text-orange-600 border-orange-500/20"
      case "advanced": return "bg-destructive/10 text-destructive border-destructive/20"
      default: return "bg-muted text-muted-foreground border-border"
    }
  }

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
        </div>

        {/* Answer Result Banner */}
        <AnimatePresence>
          {answerResult && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className={`p-4 rounded-lg border-2 ${answerResult === "correct"
                ? "bg-green-500/10 border-green-500/20 text-green-700"
                : "bg-destructive/10 border-destructive/20 text-destructive"
                }`}
            >
              <div className="flex items-center gap-3">
                {answerResult === "correct" ? (
                  <>
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ duration: 0.5, type: "spring" }}
                    >
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </motion.div>
                    <div>
                      <h4 className="font-semibold text-green-700">Correct! 🎉</h4>
                      <p className="text-sm text-green-600">Great job! You got this question right.</p>
                    </div>
                  </>
                ) : (
                  <>
                    <motion.div
                      initial={{ scale: 0, rotate: 180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ duration: 0.5, type: "spring" }}
                    >
                      <XCircle className="h-6 w-6 text-destructive" />
                    </motion.div>
                    <div>
                      <h4 className="font-semibold text-destructive">Incorrect</h4>
                      <p className="text-sm text-destructive/80">Don't worry! Check the explanation below to learn from this.</p>
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
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded flex items-center justify-center">
                    <span className="text-xs font-bold text-primary"><Sparkles className="w-6 h-6" /></span>
                  </div>
                  <span className="text-sm font-medium">Problem {question.id}</span>
                </div>
                <Badge variant="secondary">{question.type}</Badge>
                <Badge className={getDifficultyColor(question.difficulty)}>
                  {question.difficulty}
                </Badge>
              </div>

              {/* Learning Objectives Preview */}
              {question.learningObjectives.length > 0 && (
                <Card className="bg-blue-500/10 border-blue-500/20">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="h-4 w-4 text-blue-600" />
                      <h5 className="font-medium text-blue-700">Learning Objectives</h5>
                    </div>
                    <div className="text-sm text-blue-600">
                      <ul className="list-disc list-inside space-y-1">
                        {question.learningObjectives.slice(0, 2).map((objective, index) => (
                          <li key={index}>
                            <Markdown content={objective} id={`quiz-objective-preview-${question.id}-${index}`} />
                          </li>
                        ))}
                        {question.learningObjectives.length > 2 && (
                          <li className="text-blue-500 italic">+{question.learningObjectives.length - 2} more objectives</li>
                        )}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              )}

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
                            ? "bg-green-500/10 border-2 border-green-500/20 shadow-sm"
                            : isSelected
                              ? "bg-destructive/10 border-2 border-destructive/20 shadow-sm"
                              : "bg-muted/50 border border-border"
                          : isSelected
                            ? "bg-accent border-2 border-primary/20"
                            : "hover:bg-accent/50 border border-transparent"
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
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            ) : isSelected ? (
                              <XCircle className="h-5 w-5 text-destructive" />
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
                    <Card className="bg-green-500/10 border-green-500/20">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Brain className="h-4 w-4 text-green-600" />
                          <h5 className="font-medium text-green-700">Step-by-Step Solution</h5>
                        </div>
                        <div className="text-sm text-green-600 leading-relaxed">
                          <Markdown content={question.stepByStepSolution} id={`quiz-solution-${question.id}`} />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Common Mistakes */}
                    {question.commonMistakes.length > 0 && (
                      <Card className="bg-orange-500/10 border-orange-500/20">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <AlertTriangle className="h-4 w-4 text-orange-600" />
                            <h5 className="font-medium text-orange-700">Common Mistakes to Avoid</h5>
                          </div>
                          <ul className="list-disc list-inside space-y-2">
                            {question.commonMistakes.map((mistake, index) => (
                              <li key={index} className="text-sm text-orange-600">
                                <Markdown content={mistake} id={`quiz-mistake-${question.id}-${index}`} />
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}

                    {/* Learning Objectives */}
                    {question.learningObjectives.length > 0 && (
                      <Card className="bg-blue-500/10 border-blue-500/20">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <Target className="h-4 w-4 text-blue-600" />
                            <h5 className="font-medium text-blue-700">Learning Objectives</h5>
                          </div>
                          <ul className="list-disc list-inside space-y-2">
                            {question.learningObjectives.map((objective, index) => (
                              <li key={index} className="text-sm text-blue-600">
                                <Markdown content={objective} id={`quiz-objective-${question.id}-${index}`} />
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}

                    {/* Follow-up Questions */}
                    {question.followUpQuestions && question.followUpQuestions.length > 0 && (
                      <Card className="bg-purple-500/10 border-purple-500/20">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <BookOpen className="h-4 w-4 text-purple-600" />
                            <h5 className="font-medium text-purple-700">Related Questions to Explore</h5>
                          </div>
                          <ul className="list-disc list-inside space-y-2">
                            {question.followUpQuestions.map((followUp, index) => (
                              <li key={index} className="text-sm text-purple-600">
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

        {/* Hint button and card */}
        <div className="space-y-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowHint(!showHint)}
            disabled={answered}
            className="flex items-center gap-2"
          >
            <Lightbulb className="h-4 w-4" />
            {showHint ? "Hide Hint" : "Show Hint"}
          </Button>

          <AnimatePresence>
            {showHint && (
              <motion.div
                initial={{ height: 0, opacity: 0, y: -10 }}
                animate={{ height: "auto", opacity: 1, y: 0 }}
                exit={{ height: 0, opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <Card className="bg-warning/50 border-warning/20">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb className="h-4 w-4 text-warning-600" />
                      <h5 className="font-medium text-warning-800">Hint</h5>
                    </div>
                    <div className="text-sm text-warning-700 leading-relaxed">
                      <Markdown content={question.hint} id={`quiz-hint-${question.id}`} />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

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
