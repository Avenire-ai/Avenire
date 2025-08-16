import { InferUITools } from "ai"
import { deepResearch } from "./deepResearch"
import { flashcardGeneratorTool } from "./flashcard-generator"
import { graphTool } from "./graph"
import { plotTool } from "./plotTool"
import { quizGeneratorTool } from "./quiz-generator"

export * from "./graph"
export * from "./search"
export * from "./deepResearch"
export * from "./flashcard-generator"
export * from "./quiz-generator"
export * from "./plotTool";

const TOOLS = {
  graphTool,
  quizGeneratorTool: quizGeneratorTool(),
  flashcardGeneratorTool: flashcardGeneratorTool(),
  deepResearch: deepResearch(),
  plotTool,
} as const

export type OutlineAssistantUITools = InferUITools<typeof TOOLS>;