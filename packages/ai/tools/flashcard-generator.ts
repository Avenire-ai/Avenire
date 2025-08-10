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
    difficulty: z.enum(["beginner", "intermediate", "advanced"]).describe("Difficulty level of the flashcard"),
    mnemonic: z.string().optional().describe("A short memory aid or mnemonic device"),
    keyPoint: z.string().optional().describe("The most important takeaway from this card")
  }))
})

const flashcardGeneratorSchema = z.object({
  topic: z.string().describe("This should be the topic on which the flashcards must be generated. It should be a maximum of 1-2 sentences."),
  difficulty: z.string().describe("This is the difficulty of the flashcards to be framed. You can chose from \"Beginner\", \"Intermediate\" or \"Advanced\""),
  numCards: z.number().describe("This is the number of flashcards that must be generated."),
  context: z.string().optional().describe("Additional context about the user's current learning progress or specific areas of interest")
});

export const flashcardGeneratorTool = ({ userId, chatId }: { userId: string, chatId: string }) => tool({
  description: "Generate concise flashcards. WHEN TO USE: call when the user asks for flashcards, bite-sized study aids, or when summarizing into key points for spaced repetition. CONTENT: short Q/A with optional mnemonic and key takeaway. DO NOT narrate tool usage—just call.",
  parameters: flashcardGeneratorSchema,
  execute: async ({ topic, numCards, difficulty, context }) => {
    const model = fermion.languageModel("fermion-sprint")
    const { object: content } = await generateObject({
      model,
      schema: flashcardContentSchema,
      prompt: `Generate ${numCards} concise flashcards about ${topic} at ${difficulty} difficulty level.

Guidelines:
- Keep questions and answers brief but clear (max 2-3 sentences each)
- Focus on one key concept per card
- Use simple, direct language
- Include a mnemonic or memory aid when helpful
- Highlight the most important takeaway
- Consider the user's context: ${context || "general learning"}

For each card:
1. Write a clear, focused question
2. Provide a concise, direct answer
3. Add a short mnemonic if it helps memory
4. Include one key takeaway point
5. Use relevant tags for organization

Remember:
- Quality over quantity
- Clarity over complexity
- Focus on essential information
- Make it easy to remember`
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