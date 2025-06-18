import { fermion } from "../models"
import { v4 as uuid } from "uuid"
import { generateObject, tool } from "ai"
import { z } from "zod"
import { saveQuiz } from "@avenire/database/queries"

const quizContentSchema = z.object({
  questions: z.array(z.object({
    id: z.number().describe("Unique identifier for the question"),
    type: z.enum(["MCQ", "True/False", "Image-based", "Interactive", "Problem-solving"]).describe("Type of question"),
    question: z.string().describe("The question text"),
    options: z.array(z.string()).describe("Array of possible answers"),
    correct: z.number().describe("Index of the correct answer in the options array"),
    explanation: z.string().describe("Detailed explanation of the correct answer"),
    hint: z.string().describe("Helpful hint that doesn't give away the answer"),
    difficulty: z.enum(["beginner", "intermediate", "advanced"]).describe("Difficulty level of the question"),
    stepByStepSolution: z.string().describe("Detailed step-by-step solution process"),
    commonMistakes: z.array(z.string()).describe("Common mistakes students make with this type of question"),
    learningObjectives: z.array(z.string()).describe("Specific learning objectives this question addresses"),
    followUpQuestions: z.array(z.string()).optional().describe("Related questions to explore the concept further")
  }))
})

const quizGeneratorSchema = z.object({
  topic: z.string().describe("This should be the topic on which the quiz must be generated. It should be a maximum of 1-2 sentences."),
  difficulty: z.string().describe("This is the difficulty of the questions to be framed. You can chose from \"Beginner\", \"Intermediate\" or \"Advanced\""),
  numQuestions: z.number().describe("This is the number of questions that must be there in the quiz."),
  context: z.string().optional().describe("Additional context about the user's current learning progress or specific areas of interest")
});

export const quizGeneratorTool = ({ userId, chatId }: { userId: string, chatId: string }) => tool({
  description: "A tool call to generate comprehensive quizzes related to a particular topic. Always use this tool proactively when testing understanding or reinforcing concepts.",
  parameters: quizGeneratorSchema,
  execute: async ({ topic, numQuestions, difficulty, context }) => {
    const model = fermion.languageModel("fermion-core")
    const { object: content } = await generateObject({
      model,
      schema: quizContentSchema,
      prompt: `Generate a comprehensive quiz about ${topic} with ${numQuestions} questions at ${difficulty} difficulty level.

Guidelines:
- Questions should be clear, engaging, and test deep understanding
- Include a mix of question types to assess different aspects of knowledge
- Provide detailed explanations that help users learn from their mistakes
- Include step-by-step solutions for problem-solving questions
- Add visual aids where they would enhance understanding
- Use an encouraging and supportive tone in feedback
- Include hints that guide users toward the solution
- Consider the user's context: ${context || "general learning"}

For each question:
1. Start with a clear, focused question
2. Provide well-thought-out options
3. Include a detailed explanation
4. Add step-by-step solution
5. List common mistakes
6. Specify learning objectives
7. Suggest visual aids if helpful
8. Include follow-up questions to explore the concept further`
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