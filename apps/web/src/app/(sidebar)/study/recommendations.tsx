"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent } from "@avenire/ui/components/card"
import { Button } from "@avenire/ui/components/button"
import { Badge } from "@avenire/ui/components/badge"
import { Calendar, TrendingUp, RotateCcw, HelpCircle, Clock, Target } from "lucide-react"
import { getDueFlashcardsAction, getDueQuizQuestionsAction } from "../../../actions/actions"
import { useUserStore } from "../../../stores/userStore"
import { formatDistanceToNow } from "date-fns"
import { getFSRSStateLabel, getStabilityDescription, formatInterval } from "../../../lib/spaced-repetition-utils"

interface StudyRecommendation {
  id: string
  type: "flashcard" | "quiz"
  flashcardId?: string
  quizId?: string
  cardIndex?: number
  questionIndex?: number
  title?: string
  topic: string
  dueDate: Date
  priority: number // Higher = more urgent
  fsrsState?: {
    stability: number
    difficulty: number
    state: number
    reps: number
    lapses: number
  }
  masteryLevel: number
  lastStudied?: Date
  // Content data (available from recommendations)
  question?: string
  answer?: string
  difficulty?: string
  options?: string[]
  correct?: number
  explanation?: string
}

export function StudyRecommendations({ onSelect }: { onSelect: (rec: StudyRecommendation) => void }) {
  const { user } = useUserStore()
  const [recommendations, setRecommendations] = useState<StudyRecommendation[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadRecommendations = async () => {
      if (!user) return
      setIsLoading(true)

      try {
        const [flashcardsResult, quizzesResult] = await Promise.all([
          getDueFlashcardsAction({ limit: 50 }),
          getDueQuizQuestionsAction({ limit: 50 }),
        ])

        const allRecommendations: StudyRecommendation[] = []

        // Process flashcards
        flashcardsResult.flashcards?.forEach((fp: any) => {
          const daysUntilDue = Math.floor(
            (new Date(fp.dueDate || new Date()).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
          )
          const priority = daysUntilDue <= 0
            ? 100 + Math.abs(daysUntilDue) * 10
            : 50 - daysUntilDue

          allRecommendations.push({
            id: `${fp.flashcardId}-${fp.cardIndex}`,
            type: "flashcard",
            flashcardId: fp.flashcardId,
            cardIndex: fp.cardIndex,
            title: fp.title || fp.topic,
            topic: fp.topic,
            dueDate: new Date(fp.dueDate || new Date()),
            priority,
            fsrsState: fp.fsrsState,
            masteryLevel: fp.masteryLevel || 0,
            lastStudied: fp.lastStudied ? new Date(fp.lastStudied) : undefined,
            question: fp.question,
            answer: fp.answer,
            difficulty: fp.difficulty,
          })
        })

        // Process quizzes
        quizzesResult.questions?.forEach((qp: any) => {
          const daysUntilDue = Math.floor(
            (new Date(qp.dueDate || new Date()).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
          )
          const priority = daysUntilDue <= 0
            ? 100 + Math.abs(daysUntilDue) * 10
            : 50 - daysUntilDue

          allRecommendations.push({
            id: `${qp.quizId}-${qp.questionIndex}`,
            type: "quiz",
            quizId: qp.quizId,
            questionIndex: qp.questionIndex,
            title: qp.title || qp.topic,
            topic: qp.topic,
            dueDate: new Date(qp.dueDate || new Date()),
            priority,
            fsrsState: qp.fsrsState,
            masteryLevel: qp.masteryLevel || 0,
            lastStudied: qp.lastStudied ? new Date(qp.lastStudied) : undefined,
            question: qp.question,
            options: qp.options,
            correct: qp.correct,
            explanation: qp.explanation,
          })
        })

        // Sort by priority (highest first)
        allRecommendations.sort((a, b) => b.priority - a.priority)

        setRecommendations(allRecommendations)
      } catch (error) {
        console.error("Failed to load recommendations", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadRecommendations()
  }, [user])

  const groupedByUrgency = useMemo(() => {
    const overdue = recommendations.filter(r => r.dueDate <= new Date())
    const dueToday = recommendations.filter(r => {
      const diff = r.dueDate.getTime() - new Date().getTime()
      return diff > 0 && diff < 24 * 60 * 60 * 1000
    })
    const upcoming = recommendations.filter(r => {
      const diff = r.dueDate.getTime() - new Date().getTime()
      return diff >= 24 * 60 * 60 * 1000
    })

    return { overdue, dueToday, upcoming }
  }, [recommendations])

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="h-24 animate-pulse bg-muted" />
        ))}
      </div>
    )
  }

  if (recommendations.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-12 text-center">
          <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg font-medium mb-2">All caught up!</p>
          <p className="text-sm text-muted-foreground">
            No items due for review. Great job!
          </p>
        </CardContent>
      </Card>
    )
  }

  const renderRecommendation = (rec: StudyRecommendation) => (
    <Card
      key={rec.id}
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onSelect(rec)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            {rec.type === "flashcard" ? (
              <RotateCcw className="h-4 w-4 text-muted-foreground" />
            ) : (
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
            )}
            <Badge variant="secondary">{rec.type === "flashcard" ? "Flashcard" : "Quiz"}</Badge>
          </div>
          <Badge variant={rec.dueDate <= new Date() ? "destructive" : "outline"}>
            {rec.dueDate <= new Date() ? "Overdue" : "Due"}
          </Badge>
        </div>
        <h4 className="font-medium mb-2">{rec.title || rec.topic}</h4>
        <div className="space-y-2 text-sm text-muted-foreground">
          {rec.fsrsState && (
            <>
              <div className="flex items-center justify-between">
                <span>FSRS State</span>
                <Badge variant="outline" className="text-xs">
                  {getFSRSStateLabel(rec.fsrsState.state)}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Stability</span>
                <span className="font-medium">
                  {rec.fsrsState.stability.toFixed(1)} days
                  <span className="text-xs text-muted-foreground ml-1">
                    ({getStabilityDescription(rec.fsrsState.stability)})
                  </span>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Difficulty</span>
                <span className="font-medium">
                  {(rec.fsrsState.difficulty * 100).toFixed(0)}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Reviews</span>
                <span className="font-medium">
                  {rec.fsrsState.reps} reps, {rec.fsrsState.lapses} lapses
                </span>
              </div>
            </>
          )}
          <div className="flex items-center justify-between">
            <span>Mastery</span>
            <span className="font-medium">{Math.round(rec.masteryLevel * 100)}%</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Due</span>
            <span className="font-medium">
              {rec.dueDate <= new Date()
                ? "Overdue"
                : formatDistanceToNow(rec.dueDate, { addSuffix: true })}
            </span>
          </div>
          {rec.lastStudied && (
            <div className="flex items-center justify-between">
              <span>Last Studied</span>
              <span className="font-medium">
                {formatDistanceToNow(rec.lastStudied, { addSuffix: true })}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      {groupedByUrgency.overdue.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-5 w-5 text-destructive" />
            <h3 className="text-lg font-semibold">Overdue ({groupedByUrgency.overdue.length})</h3>
          </div>
          <div className="space-y-3">
            {groupedByUrgency.overdue.map(renderRecommendation)}
          </div>
        </div>
      )}

      {groupedByUrgency.dueToday.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-orange-500" />
            <h3 className="text-lg font-semibold">Due Today ({groupedByUrgency.dueToday.length})</h3>
          </div>
          <div className="space-y-3">
            {groupedByUrgency.dueToday.map(renderRecommendation)}
          </div>
        </div>
      )}

      {groupedByUrgency.upcoming.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold">Upcoming ({groupedByUrgency.upcoming.length})</h3>
          </div>
          <div className="space-y-3">
            {groupedByUrgency.upcoming.slice(0, 10).map(renderRecommendation)}
          </div>
        </div>
      )}
    </div>
  )
}


