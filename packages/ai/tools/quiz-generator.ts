import { fermion } from "../models"
import { v4 as uuid } from "uuid"
import { generateObject, tool } from "ai"
import { z } from "zod"
import { saveQuiz } from "@avenire/database/queries"

const quizContentSchema = z.object({
  questions: z.array(z.object({
    id: z.number().describe("Unique identifier for the question"),
    type: z.enum(["MCQ", "True/False", "Image-based"]).describe("Type of question"),
    question: z.string().describe("The question text"),
    options: z.array(z.string()).describe("Array of possible answers"),
    correct: z.number().describe("Index of the correct answer in the options array"),
    explanation: z.string().describe("Detailed explanation of the correct answer"),
    hint: z.string().describe("Helpful hint that doesn't give away the answer"),
    difficulty: z.enum(["beginner", "intermediate", "advanced"]).describe("Difficulty level of the question")
  }))
})

const quizGeneratorSchema = z.object({
  topic: z.string().describe("This should be the topic on which the quiz must be generated. It should be a maximum of 1-2 sentences."),
  difficulty: z.string().describe("This is the difficulty of the questions to be framed. You can chose from \"Beginner\", \"Intermediate\" or \"Advanced\""),
  numQuestions: z.number().describe("This is the number of questions that must be there in the quiz."),
});

export const quizGeneratorTool = ({userId, chatId}: {userId: string, chatId: string}) => tool({
  description: "A tool call to generate quizzes related to a particular topic.",
  parameters: quizGeneratorSchema,
  execute: async ({ topic, numQuestions, difficulty }) => {
    const model = fermion.languageModel("fermion-core")
    const { object: content } = await generateObject({
      model,
      schema: quizContentSchema,
      prompt: `Generate a quiz about ${topic} with ${numQuestions} questions at ${difficulty} difficulty level.

    Guidelines:
    - Questions should be clear and concise
    - Options should be distinct and plausible
    - Explanations should be educational and detailed
    - Hints should be helpful but not give away the answer
    - Mix different question types appropriately
    - Ensure questions are at the specified difficulty level`
    })

    const id = uuid()

    const data = await saveQuiz({
      id,
      content,
      topic,
      userId,
      chatId
    })


    return {
      id,
      topic,
      count: numQuestions
    }

  }
});