"use client"

import { useState } from "react"
import { Card, CardContent } from "@avenire/ui/components/card"
import { Button } from "@avenire/ui/components/button"
import { Target, Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import { useUserStore } from "../../../stores/userStore"
import { StudyRecommendations } from "./recommendations"
import { StudyModal } from "./study-modal"

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
  priority: number
  fsrsState?: {
    stability: number
    difficulty: number
    state: number
    reps: number
    lapses: number
  }
  masteryLevel: number
  lastStudied?: Date
}

type StudyMode = "flashcards" | "quiz" | "study-list"

interface FlashcardItem {
  id: string
  flashcardId: string
  cardIndex: number
  question: string
  answer: string
  topic: string
  difficulty: string
  progress?: any
}

interface QuizItem {
  id: string
  quizId: string
  questionIndex: number
  question: string
  options: string[]
  correct: number
  explanation: string
  progress?: any
}

export default function StudyPage() {
  const router = useRouter()
  const { user } = useUserStore()
  const [selectedRecommendation, setSelectedRecommendation] = useState<StudyRecommendation | null>(null)


  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Please log in to study</p>
      </div>
    )
  }

  return (
    <div className="flex h-screen">
      <main className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Study Recommendations</h1>
              <p className="text-muted-foreground">
                Items recommended by FSRS algorithm for optimal learning
              </p>
            </div>
            <Button onClick={() => router.push("/library/create-flashcard")}>
              <Plus className="h-4 w-4 mr-2" />
              Create Flashcard
            </Button>
          </div>

          <Card className="border bg-muted/30">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Target className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">How it works</h3>
                  <p className="text-sm text-muted-foreground">
                    Click on any recommendation below to study it. The FSRS (Free Spaced Repetition Scheduler) algorithm
                    recommends items based on optimal review timing for memory retention. Items are prioritized by:
                  </p>
                  <ul className="text-sm text-muted-foreground mt-2 list-disc list-inside space-y-1">
                    <li>Items that are overdue or due soon</li>
                    <li>Memory stability and difficulty scores</li>
                    <li>Your past performance and mastery level</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <StudyRecommendations
            onSelect={(rec) => setSelectedRecommendation(rec)}
          />

          {selectedRecommendation && (
            <StudyModal
              open={!!selectedRecommendation}
              onClose={() => setSelectedRecommendation(null)}
              recommendation={selectedRecommendation}
            />
          )}
        </div>
      </main>
    </div>
  )
}

