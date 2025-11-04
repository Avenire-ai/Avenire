import { log, captureException } from "@avenire/logger/server"
import {
  flashcardProgress,
  quizProgress,
  studySessions,
  flashcards,
  quizzes,
  type NewFlashcardProgress,
  type NewQuizProgress,
  type NewStudySession,
} from "@avenire/database/schema"
import { eq, and, lte, gte, desc, asc, sql, or, inArray } from "drizzle-orm"
import { database } from ".."
import type { FlashcardProgress } from "../schema/flashcard-progress-schema"
import type { QuizProgress } from "../schema/quiz-progress-schema"
import type { StudySession } from "../schema/study-session-schema"

// ========== Flashcard Progress Queries ==========

export async function saveFlashcardProgress(progress: NewFlashcardProgress) {
  try {
    return await database.insert(flashcardProgress).values(progress)
  } catch (error) {
    log.error("Failed to save flashcard progress", { error })
    captureException(error, log)
    throw error
  }
}

export async function getFlashcardProgressById({ id }: { id: string }) {
  try {
    const [progress] = await database
      .select()
      .from(flashcardProgress)
      .where(eq(flashcardProgress.id, id))
    return progress
  } catch (error) {
    log.error("Failed to get flashcard progress by id", { error })
    captureException(error, log)
    return null
  }
}

export async function getFlashcardProgressByFlashcardId({
  flashcardId,
  cardIndex,
  userId,
}: {
  flashcardId: string
  cardIndex: number
  userId: string
}) {
  try {
    const [progress] = await database
      .select()
      .from(flashcardProgress)
      .where(
        and(
          eq(flashcardProgress.flashcardId, flashcardId),
          eq(flashcardProgress.cardIndex, cardIndex),
          eq(flashcardProgress.userId, userId)
        )
      )
    return progress
  } catch (error) {
    log.error("Failed to get flashcard progress by flashcard id", { error })
    captureException(error, log)
    return null
  }
}

export async function updateFlashcardProgress(
  id: string,
  updates: Partial<FlashcardProgress>
) {
  try {
    return await database
      .update(flashcardProgress)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(flashcardProgress.id, id))
  } catch (error) {
    log.error("Failed to update flashcard progress", { error })
    captureException(error, log)
    throw error
  }
}

export async function getDueFlashcards({
  userId,
  limit,
}: {
  userId: string
  limit?: number
}) {
  try {
    const now = new Date()
    // Get flashcards with progress that are due
    const dueWithProgress = await database
      .select()
      .from(flashcardProgress)
      .where(
        and(
          eq(flashcardProgress.userId, userId),
          lte(flashcardProgress.dueDate, now)
        )
      )
      .orderBy(asc(flashcardProgress.dueDate))
      .limit(limit || 100)

    // Get all user's flashcards
    const allFlashcards = await database
      .select()
      .from(flashcards)
      .where(eq(flashcards.userId, userId))

    // Create a set of flashcard IDs + card indices that already have progress
    const hasProgress = new Set(
      dueWithProgress.map(
        (fp) => `${fp.flashcardId}-${fp.cardIndex}`
      )
    )

    // For each flashcard, get cards that don't have progress entries yet
    const newCards: Array<{
      flashcardId: string
      cardIndex: number
      userId: string
      isNew: true
    }> = []

    allFlashcards.forEach((flashcard) => {
      if (flashcard.content && typeof flashcard.content === 'object' && 'cards' in flashcard.content) {
        const content = flashcard.content as { cards: Array<any> }
        content.cards.forEach((card, index) => {
          const key = `${flashcard.id}-${index}`
          if (!hasProgress.has(key)) {
            newCards.push({
              flashcardId: flashcard.id,
              cardIndex: index,
              userId: userId,
              isNew: true,
            })
          }
        })
      }
    })

    // Combine due items with progress and new items without progress
    const allDue = [
      ...dueWithProgress.map((fp) => ({ ...fp, isNew: false })),
      ...newCards,
    ]

    // Sort: new items first, then by due date
    allDue.sort((a, b) => {
      if (a.isNew && !b.isNew) return -1
      if (!a.isNew && b.isNew) return 1
      if (!a.isNew && !b.isNew && 'dueDate' in a && 'dueDate' in b) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      }
      return 0
    })

    return limit ? allDue.slice(0, limit) : allDue
  } catch (error) {
    log.error("Failed to get due flashcards", { error })
    captureException(error, log)
    return []
  }
}

export async function getFlashcardProgressByUserId({ userId }: { userId: string }) {
  try {
    return await database
      .select()
      .from(flashcardProgress)
      .where(eq(flashcardProgress.userId, userId))
      .orderBy(desc(flashcardProgress.updatedAt))
  } catch (error) {
    log.error("Failed to get flashcard progress by user id", { error })
    captureException(error, log)
    return []
  }
}

// ========== Quiz Progress Queries ==========

export async function saveQuizProgress(progress: NewQuizProgress) {
  try {
    return await database.insert(quizProgress).values(progress)
  } catch (error) {
    log.error("Failed to save quiz progress", { error })
    captureException(error, log)
    throw error
  }
}

export async function getQuizProgressById({ id }: { id: string }) {
  try {
    const [progress] = await database
      .select()
      .from(quizProgress)
      .where(eq(quizProgress.id, id))
    return progress
  } catch (error) {
    log.error("Failed to get quiz progress by id", { error })
    captureException(error, log)
    return null
  }
}

export async function getQuizProgressByQuizId({
  quizId,
  questionIndex,
  userId,
}: {
  quizId: string
  questionIndex: number
  userId: string
}) {
  try {
    const [progress] = await database
      .select()
      .from(quizProgress)
      .where(
        and(
          eq(quizProgress.quizId, quizId),
          eq(quizProgress.questionIndex, questionIndex),
          eq(quizProgress.userId, userId)
        )
      )
    return progress
  } catch (error) {
    log.error("Failed to get quiz progress by quiz id", { error })
    captureException(error, log)
    return null
  }
}

export async function updateQuizProgress(
  id: string,
  updates: Partial<QuizProgress>
) {
  try {
    return await database
      .update(quizProgress)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(quizProgress.id, id))
  } catch (error) {
    log.error("Failed to update quiz progress", { error })
    captureException(error, log)
    throw error
  }
}

export async function getDueQuizQuestions({
  userId,
  limit,
}: {
  userId: string
  limit?: number
}) {
  try {
    const now = new Date()
    // Get quiz questions with progress that are due
    const dueWithProgress = await database
      .select()
      .from(quizProgress)
      .where(
        and(
          eq(quizProgress.userId, userId),
          lte(quizProgress.dueDate, now)
        )
      )
      .orderBy(asc(quizProgress.dueDate))
      .limit(limit || 100)

    // Get all user's quizzes
    const allQuizzes = await database
      .select()
      .from(quizzes)
      .where(eq(quizzes.userId, userId))

    // Create a set of quiz IDs + question indices that already have progress
    const hasProgress = new Set(
      dueWithProgress.map(
        (qp) => `${qp.quizId}-${qp.questionIndex}`
      )
    )

    // For each quiz, get questions that don't have progress entries yet
    const newQuestions: Array<{
      quizId: string
      questionIndex: number
      userId: string
      isNew: true
    }> = []

    allQuizzes.forEach((quiz) => {
      if (quiz.content && typeof quiz.content === 'object' && 'questions' in quiz.content) {
        const content = quiz.content as { questions: Array<any> }
        content.questions.forEach((question, index) => {
          const key = `${quiz.id}-${index}`
          if (!hasProgress.has(key)) {
            newQuestions.push({
              quizId: quiz.id,
              questionIndex: index,
              userId: userId,
              isNew: true,
            })
          }
        })
      }
    })

    // Combine due items with progress and new items without progress
    const allDue = [
      ...dueWithProgress.map((qp) => ({ ...qp, isNew: false })),
      ...newQuestions,
    ]

    // Sort: new items first, then by due date
    allDue.sort((a, b) => {
      if (a.isNew && !b.isNew) return -1
      if (!a.isNew && b.isNew) return 1
      if (!a.isNew && !b.isNew && 'dueDate' in a && 'dueDate' in b) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      }
      return 0
    })

    return limit ? allDue.slice(0, limit) : allDue
  } catch (error) {
    log.error("Failed to get due quiz questions", { error })
    captureException(error, log)
    return []
  }
}

export async function getQuizProgressByUserId({ userId }: { userId: string }) {
  try {
    return await database
      .select()
      .from(quizProgress)
      .where(eq(quizProgress.userId, userId))
      .orderBy(desc(quizProgress.updatedAt))
  } catch (error) {
    log.error("Failed to get quiz progress by user id", { error })
    captureException(error, log)
    return []
  }
}

// ========== Study Session Queries ==========

export async function saveStudySession(session: NewStudySession) {
  try {
    return await database.insert(studySessions).values(session)
  } catch (error) {
    log.error("Failed to save study session", { error })
    captureException(error, log)
    throw error
  }
}

export async function getStudySessionById({ id }: { id: string }) {
  try {
    const [session] = await database
      .select()
      .from(studySessions)
      .where(eq(studySessions.id, id))
    return session
  } catch (error) {
    log.error("Failed to get study session by id", { error })
    captureException(error, log)
    return null
  }
}

export async function updateStudySession(
  id: string,
  updates: Partial<StudySession>
) {
  try {
    return await database
      .update(studySessions)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(studySessions.id, id))
  } catch (error) {
    log.error("Failed to update study session", { error })
    captureException(error, log)
    throw error
  }
}

export async function getStudySessionsByUserId({
  userId,
  limit,
}: {
  userId: string
  limit?: number
}) {
  try {
    let query = database
      .select()
      .from(studySessions)
      .where(eq(studySessions.userId, userId))
      .orderBy(desc(studySessions.createdAt))

    if (limit) {
      query = query.limit(limit) as typeof query
    }

    return await query
  } catch (error) {
    log.error("Failed to get study sessions by user id", { error })
    captureException(error, log)
    return []
  }
}

// ========== Library Filtering & Sorting ==========

export interface LibraryFilters {
  userId: string
  type?: "flashcard" | "quiz" | "all"
  topic?: string
  difficulty?: "beginner" | "intermediate" | "advanced"
  masteryLevel?: { min: number; max: number }
  dueDate?: "due" | "not_due" | "all"
  searchQuery?: string
}

export interface LibrarySortOptions {
  field: "createdAt" | "dueDate" | "eloRating" | "lastStudied" | "masteryLevel"
  order: "asc" | "desc"
}

export async function getLibraryItems({
  filters,
  sort,
  page = 1,
  pageSize = 20,
}: {
  filters: LibraryFilters
  sort?: LibrarySortOptions
  page?: number
  pageSize?: number
}) {
  try {
    // Get all flashcards with progress
    const allFlashcardProgress = await database
      .select()
      .from(flashcardProgress)
      .where(eq(flashcardProgress.userId, filters.userId))

    // Get all flashcards
    const allFlashcards = await database
      .select()
      .from(flashcards)
      .where(eq(flashcards.userId, filters.userId))

    // Create a map of flashcard ID + card index to progress
    const progressMap = new Map(
      allFlashcardProgress.map((fp) => [`${fp.flashcardId}-${fp.cardIndex}`, fp])
    )

    // Build library items from all flashcards (with or without progress)
    const flashcardItems: Array<any> = []
    allFlashcards.forEach((flashcard) => {
      if (flashcard.content && typeof flashcard.content === 'object' && 'cards' in flashcard.content) {
        const content = flashcard.content as { cards: Array<any> }
        content.cards.forEach((card, index) => {
          const key = `${flashcard.id}-${index}`
          const progress = progressMap.get(key)
          flashcardItems.push({
            flashcardId: flashcard.id,
            cardIndex: index,
            ...progress,
            isNew: !progress,
            // Add flashcard metadata
            topic: flashcard.topic,
            createdAt: flashcard.createdAt,
            // Default values if no progress
            dueDate: progress?.dueDate || new Date(),
            masteryLevel: progress?.masteryLevel || 0,
            eloRating: progress?.eloRating || 1500,
            lastStudied: progress?.lastStudied || null,
          })
        })
      }
    })

    // Get all quiz progress
    const allQuizProgress = await database
      .select()
      .from(quizProgress)
      .where(eq(quizProgress.userId, filters.userId))

    // Get all quizzes
    const allQuizzes = await database
      .select()
      .from(quizzes)
      .where(eq(quizzes.userId, filters.userId))

    // Create a map of quiz ID + question index to progress
    const quizProgressMap = new Map(
      allQuizProgress.map((qp) => [`${qp.quizId}-${qp.questionIndex}`, qp])
    )

    // Build library items from all quizzes (with or without progress)
    const quizItems: Array<any> = []
    allQuizzes.forEach((quiz) => {
      if (quiz.content && typeof quiz.content === 'object' && 'questions' in quiz.content) {
        const content = quiz.content as { questions: Array<any> }
        content.questions.forEach((question, index) => {
          const key = `${quiz.id}-${index}`
          const progress = quizProgressMap.get(key)
          quizItems.push({
            quizId: quiz.id,
            questionIndex: index,
            ...progress,
            isNew: !progress,
            // Add quiz metadata
            topic: quiz.topic,
            createdAt: quiz.createdAt,
            // Default values if no progress
            dueDate: progress?.dueDate || new Date(),
            masteryLevel: progress?.masteryLevel || 0,
            eloRating: progress?.eloRating || 1500,
            lastStudied: progress?.lastStudied || null,
          })
        })
      }
    })

    // Apply filters
    let filteredFlashcards = flashcardItems
    let filteredQuizzes = quizItems

    if (filters.type && filters.type !== "all") {
      if (filters.type === "flashcard") {
        filteredQuizzes = []
      } else {
        filteredFlashcards = []
      }
    }

    // Combine and sort
    let allItems = [...filteredFlashcards, ...filteredQuizzes]

    if (sort) {
      allItems.sort((a, b) => {
        let aVal: any
        let bVal: any

        switch (sort.field) {
          case "createdAt":
            aVal = a.createdAt
            bVal = b.createdAt
            break
          case "dueDate":
            aVal = a.dueDate
            bVal = b.dueDate
            break
          case "eloRating":
            aVal = a.eloRating
            bVal = b.eloRating
            break
          case "masteryLevel":
            aVal = a.masteryLevel
            bVal = b.masteryLevel
            break
          case "lastStudied":
            aVal = a.lastStudied || new Date(0)
            bVal = b.lastStudied || new Date(0)
            break
          default:
            return 0
        }

        if (aVal < bVal) return sort.order === "asc" ? -1 : 1
        if (aVal > bVal) return sort.order === "asc" ? 1 : -1
        return 0
      })
    }

    // Paginate
    const offset = (page - 1) * pageSize
    const paginatedItems = allItems.slice(offset, offset + pageSize)

    // Split back into flashcards and quizzes
    const flashcardResults = paginatedItems.filter((item) => "flashcardId" in item)
    const quizResults = paginatedItems.filter((item) => "quizId" in item)

    return {
      flashcards: flashcardResults,
      quizzes: quizResults,
      total: allItems.length,
    }
  } catch (error) {
    log.error("Failed to get library items", { error })
    captureException(error, log)
    return {
      flashcards: [],
      quizzes: [],
      total: 0,
    }
  }
}

