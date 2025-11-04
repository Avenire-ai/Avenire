"use server";

import { fermion, generateObject } from "@avenire/ai";
import { z } from "zod";
import { headers } from "next/headers";
import { auth } from "@avenire/auth/server";
import { saveFlashcard } from "@avenire/database/queries";
import { log } from "@avenire/logger/server";
import { v4 as uuid } from "uuid";

const flashcardMetadataSchema = z.object({
  title: z.string().describe("A concise, descriptive title for this flashcard (max 60 chars)"),
  tags: z.array(z.string()).describe("3-5 relevant tags for categorization")
});

export async function createFlashcardManually({
  question,
  answer,
  topic,
  difficulty = "intermediate",
  customTitle,
  customTags,
}: {
  question: string;
  answer: string;
  topic: string;
  difficulty?: "beginner" | "intermediate" | "advanced";
  customTitle?: string;
  customTags?: string[];
}) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({
      headers: headersList
    });

    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized", flashcardId: null };
    }

    // Generate title and tags using AI if not provided
    let title = customTitle;
    let tags = customTags || [];

    if (!title || !tags.length) {
      try {
        const { object: metadata } = await generateObject({
          model: fermion.languageModel("fermion-sprint"),
          schema: flashcardMetadataSchema,
          prompt: `Generate a concise title and relevant tags for a flashcard with the following content:
          
Question: ${question}
Answer: ${answer}
Topic: ${topic}
Difficulty: ${difficulty}

Create a short, descriptive title (max 60 characters) and 3-5 relevant tags.`
        });
        title = title || metadata.title;
        tags = tags.length > 0 ? tags : metadata.tags;
      } catch (err) {
        log.error('Failed to generate flashcard metadata', { error: err });
        title = title || `${topic} - Flashcard`;
        tags = tags.length > 0 ? tags : [difficulty, topic];
      }
    }

    const flashcardId = uuid();
    const flashcardContent = {
      cards: [{
        id: 1,
        topic,
        question,
        answer,
        tags: tags.length > 0 ? tags : [difficulty, topic],
        difficulty,
      }]
    };

    await saveFlashcard({
      id: flashcardId,
      content: flashcardContent,
      topic,
      title,
      tags,
      userId: session.user.id,
      chatId: undefined
    });

    return { success: true, error: null, flashcardId };
  } catch (error) {
    log.error('Failed to create flashcard manually', { error });
    return { success: false, error, flashcardId: null };
  }
}



