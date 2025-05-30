"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle, XCircle, RotateCcw, Trophy, ChevronLeft, ChevronRight, Lightbulb } from "lucide-react"
import { Button } from "@avenire/ui/components/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@avenire/ui/components/select"
import { Badge } from "@avenire/ui/components/badge"
import { Card, CardContent } from "@avenire/ui/components/card"

const quizQuestions = [
  {
    id: 1,
    type: "MCQ",
    question: "What does JSX stand for?",
    options: ["JavaScript XML", "Java Syntax Extension", "JavaScript Extension", "Java XML"],
    correct: 0,
    explanation: "JSX stands for JavaScript XML. It allows you to write HTML-like syntax in JavaScript files.",
    hint: "Think about what JSX allows you to write in JavaScript files - it's related to markup language.",
    difficulty: "beginner",
  },
  {
    id: 2,
    type: "MCQ",
    question: "Which hook is used for side effects in React?",
    options: ["useState", "useEffect", "useContext", "useReducer"],
    correct: 1,
    explanation: "useEffect is used for side effects like API calls, subscriptions, and DOM manipulation.",
    hint: "This hook is commonly used for API calls and cleanup operations.",
    difficulty: "intermediate",
  },
  {
    id: 3,
    type: "True/False",
    question: "React components must always return JSX.",
    options: ["True", "False"],
    correct: 1,
    explanation:
      "React components can return JSX, strings, numbers, arrays, or null. They don't always have to return JSX.",
    hint: "Consider what else React components can return besides JSX elements.",
    difficulty: "intermediate",
  },
  {
    id: 4,
    type: "MCQ",
    question: "What is the virtual DOM?",
    options: ["A copy of the real DOM", "A JavaScript representation of the DOM", "A faster version of the DOM"],
    correct: 3,
    explanation:
      "The virtual DOM is a JavaScript representation of the real DOM that React uses for efficient updates.",
    hint: "It's a concept that helps React optimize rendering performance.",
    difficulty: "advanced",
  },
  {
    id: 5,
    type: "Image-based",
    question: "What React pattern is shown in this code structure?",
    options: ["Higher-Order Component", "Render Props", "Custom Hook", "Context Provider"],
    correct: 2,
    explanation: "This shows a custom hook pattern, which allows you to reuse stateful logic between components.",
    hint: "Look at the naming convention and how the logic is extracted.",
    difficulty: "advanced",
  },
]

const questionTypes = ["All", "MCQ", "True/False", "Image-based"]

export function QuizPrompter() {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showExplanation, setShowExplanation] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [score, setScore] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const [answered, setAnswered] = useState(false)
  const [skippedQuestions, setSkippedQuestions] = useState<number[]>([])
  const [selectedType, setSelectedType] = useState("All")

  // Filter questions based on selected type
  const filteredQuestions = quizQuestions.filter((q) => selectedType === "All" || q.type === selectedType)

  const question = filteredQuestions[currentQuestion]
  const totalQuestions = filteredQuestions.length

  const handleAnswerSelect = (answerIndex: number) => {
    if (answered) return

    setSelectedAnswer(answerIndex)
    setAnswered(true)
    setShowExplanation(true)

    if (answerIndex === question.correct) {
      setScore(score + 1)
    }
  }

  const nextQuestion = () => {
    if (currentQuestion < filteredQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
      setSelectedAnswer(null)
      setShowExplanation(false)
      setShowHint(false)
      setAnswered(false)
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
    }
  }

  const skipQuestion = () => {
    setSkippedQuestions([...skippedQuestions, question.id])
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
  }

  const getScoreMessage = () => {
    const percentage = (score / totalQuestions) * 100
    if (percentage >= 80) return "Excellent! 🎉"
    if (percentage >= 60) return "Good job! 👍"
    if (percentage >= 40) return "Not bad! 📚"
    return "Keep studying! 💪"
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
                <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
                  <span className="text-xs font-bold text-primary-foreground">{currentQuestion + 1}</span>
                </div>
                <span className="text-sm font-medium">Problem {question.id}</span>
              </div>
              <Badge variant="secondary">{question.type}</Badge>
            </div>

            {/* Question Text */}
            <div className="space-y-6">
              <h4 className="text-lg font-medium leading-relaxed">{question.question}</h4>

              {/* Options */}
              <div className="space-y-3">
                {question.options.map((option, index) => {
                  const isSelected = selectedAnswer === index
                  const isCorrect = index === question.correct
                  const showResult = answered

                  return (
                    <motion.label
                      key={index}
                      className={`flex items-center space-x-3 p-4 rounded-lg cursor-pointer transition-all ${
                        showResult
                          ? isCorrect
                            ? "bg-primary/10 border border-primary/20"
                            : isSelected
                              ? "bg-destructive/10 border border-destructive/20"
                              : "bg-muted/50"
                          : isSelected
                            ? "bg-accent"
                            : "hover:bg-accent/50"
                      }`}
                      whileHover={!answered ? { scale: 1.01 } : {}}
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
                      <span className="flex-1">{option}</span>
                      {showResult && isCorrect && <CheckCircle className="h-5 w-5 text-primary" />}
                      {showResult && isSelected && !isCorrect && <XCircle className="h-5 w-5 text-destructive" />}
                    </motion.label>
                  )
                })}
              </div>

              {/* Submit button */}
              {!answered && selectedAnswer !== null && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="pt-2">
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
                  className="overflow-hidden border-t pt-6"
                >
                  <div className="space-y-3">
                    <h5 className="font-medium text-primary">Explanation</h5>
                    <p className="text-sm text-muted-foreground leading-relaxed">{question.explanation}</p>
                  </div>
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
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <h5 className="font-medium text-primary">Hint</h5>
                    <p className="text-sm text-muted-foreground leading-relaxed">{question.hint}</p>
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
  )
}
