import type { InferUITools, UIDataTypes as InternalDataTypes } from "ai"
import type { flashcardGeneratorTool } from "./flashcard-generator"
import type { graphTool } from "./graph"
import type { plotTool } from "./plotTool"
import type { quizGeneratorTool } from "./quiz-generator"

// Define the tools object type using the imported types
type ToolsObject = {
  graphTool: typeof graphTool
  quizGeneratorTool: ReturnType<typeof quizGeneratorTool>
  flashcardGeneratorTool: ReturnType<typeof flashcardGeneratorTool>
  plotTool: typeof plotTool
}


export type ToolType = InferUITools<ToolsObject>

export type { UIDataTypes, UIMessage, ModelMessage, UIMessagePart } from "ai"
