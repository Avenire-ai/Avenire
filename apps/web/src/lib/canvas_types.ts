// Flashcard types
export interface Flashcard {
  id: string
  question: string
  answer: string
  topic: string
  difficulty: string
  createdAt: Date
}

// Quiz types
export interface Quiz {
  id: string
  type: "MCQ" | "True/False" | "Image-based" | "Interactive" | "Problem-solving"
  question: string
  options: string[]
  correct: number
  explanation: string
  hint: string
  difficulty: "beginner" | "intermediate" | "advanced"
  stepByStepSolution: string
  commonMistakes: string[]
  learningObjectives: string[]
  followUpQuestions?: string[]
  createdAt: Date
}


// Canvas data types
export type CanvasData = {
    type: 'quiz'
    question: Quiz
  } | {
    type: 'flashcard'
    flashcard: Flashcard
  } | {
    type: 'graph'
    expressions: string[]
  }

