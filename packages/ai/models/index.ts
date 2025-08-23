import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { createGroq, groq } from '@ai-sdk/groq';
import { customProvider, wrapLanguageModel, extractReasoningMiddleware } from "ai"


const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY
})

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});


export const fermion = customProvider({
  languageModels: {
    "fermion-sprint": google("gemma-3-27b-it"),
    "fermion-core": google("gemini-2.5-flash"),
    "fermion-apex": google("gemini-2.5-pro"),
    "fermion-thinking": google("gemini-2.5-pro"),
    "fermion-reasoning-lite": openrouter.languageModel("deepseek/deepseek-r1:free", {
      reasoning: {
        exclude: false,
        effort: "medium",
      },
    }),
  },
  fallbackProvider: google,
});
