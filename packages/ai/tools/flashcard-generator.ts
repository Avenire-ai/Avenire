import { fermion } from "../models"
import { v4 as uuid } from "uuid"
import { generateObject, tool } from "ai"
import { z } from "zod"
import { saveFlashcard } from "@avenire/database/queries"

const flashcardContentSchema = z.object({
  cards: z.array(z.object({
    id: z.number().describe("Unique identifier for the flashcard"),
    topic: z.string().describe("The topic this flashcard belongs to"),
    question: z.string().describe("The question text"),
    answer: z.string().describe("The answer text"),
    tags: z.array(z.string()).describe("Relevant tags for categorization"),
    difficulty: z.enum(["beginner", "intermediate", "advanced"]).describe("Difficulty level of the flashcard")
  }))
})

const flashcardGeneratorSchema = z.object({
  topic: z.string().describe("This should be the topic on which the flashcards must be generated. It should be a maximum of 1-2 sentences."),
  difficulty: z.string().describe("This is the difficulty of the flashcards to be framed. You can chose from \"Beginner\", \"Intermediate\" or \"Advanced\""),
  numCards: z.number().describe("This is the number of flashcards that must be generated."),
});

export const flashcardGeneratorTool = ({ userId, chatId }: { userId: string, chatId: string }) => tool({
  description: "A tool call to generate flashcards related to a particular topic.",
  parameters: flashcardGeneratorSchema,
  execute: async ({ topic, numCards, difficulty }) => {
    const model = fermion.languageModel("fermion-core")
    const { object: content } = await generateObject({
      model,
      schema: flashcardContentSchema,
      prompt: `Generate ${numCards} flashcards about ${topic} at ${difficulty} difficulty level.

Guidelines:
- Questions should be clear and focused
- Answers should be concise but comprehensive
- Tags should be relevant and helpful for categorization
- Content should be at the specified difficulty level
- Each card should cover a distinct concept`
    })

    const id = uuid()

    const data = await saveFlashcard({
      id,
      content,
      topic,
      userId,
      chatId
    })

    return {
      id,
      topic,
      count: numCards
    }
  }
}); 