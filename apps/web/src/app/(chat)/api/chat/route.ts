import { Message, smoothStream, streamText, fermion, graphTool, ATLAS_PROMPT, createDataStreamResponse, deepResearch, LanguageModel, appendResponseMessages, DEEP_RESEARCH_PROMPT } from "@avenire/ai"
import { getTrailingMessageId, sanitizeResponseMessages } from "@avenire/ai/utils"
import { auth } from "@avenire/auth/server";
import { deleteChatById, getChatById, getChatsByUserId, getMessagesByChatId, saveChat, saveMessages } from "@avenire/database/queries"
import { generateTitleFromUserMessage } from "../../../../actions/actions"
import { NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { quizGeneratorTool } from "@avenire/ai/tools/quiz-generator"
import { flashcardGeneratorTool } from "@avenire/ai/tools/flashcard-generator"
import { mermaidTool } from "@avenire/ai/tools/mermaid"
import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";
import { LibSQLStore } from "@mastra/libsql";
import { type CanvasData } from "../../../../lib/canvas_types";

function formatCanvasData(data: CanvasData,
): string {
  const formatDate = (d: Date) => new Date(d).toISOString();

  if (data.type === 'flashcard') {
    return [
      'The user is currently viewing the following flashcard.',
      'If the user refers to "this flashcard" or "the current flashcard", they mean the one described below.',
      `Topic: ${data.flashcard.topic}`,
      `Difficulty: ${data.flashcard.difficulty}`,
      `Created At: ${formatDate(data.flashcard.createdAt)}`,
      `Question: ${data.flashcard.question}`,
      `Answer: ${data.flashcard.answer}`
    ].join('\n');
  }

  if (data.type === 'quiz') {
    return [
      'The user is currently viewing a quiz question.',
      'If the user says "this question" or "current question", they are referring to the one shown below.',
      `Type: ${data.question.type}`,
      `Difficulty: ${data.question.difficulty}`,
      `Created At: ${formatDate(data.question.createdAt)}`,
      `Question: ${data.question.question}`,
      `Options:\n${data.question.options.map((opt, i) => `${i}: ${opt}`).join('\n')}`,
      `Correct Option Index: ${data.question.correct}`,
      `Hint: ${data.question.hint}`,
      `Explanation: ${data.question.explanation}`,
      `Step-by-Step Solution: ${data.question.stepByStepSolution}`,
      `Common Mistakes:\n${data.question.commonMistakes.join('\n')}`,
      `Learning Objectives:\n${data.question.learningObjectives.join('\n')}`,
      data.question.followUpQuestions?.length
        ? `Follow-Up Questions:\n${data.question.followUpQuestions.join('\n')}`
        : ''
    ].join('\n');
  }

  if (data.type === 'graph' && data.expressions.length > 0) {
    return [
      'The user is currently viewing a graph canvas.',
      'If they mention "the current graph", "these graphs", or similar, they are referring to the following expressions:',
      data.expressions.map(expr => `- ${expr}`).join('\n')
    ].join('\n');
  }

  return '';
}


export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const {
      messages,
      chatId,
      selectedModel,
      selectedReasoningModel,
      thinkingEnabled,
      deepResearchEnabled,
      canvasData,
    }: {
      messages: Message[];
      chatId: string;
      selectedModel: "fermion-sprint" | "fermion-core" | "fermion-apex";
      selectedReasoningModel: "fermion-reasoning" | "fermion-reasoning-lite";
      thinkingEnabled: false;
      deepResearchEnabled: false;
      canvasData?: CanvasData[];
    } = await req.json()
    const session = await auth.api.getSession({
      headers: req.headers
    })

    if (!session || !session.user || !session.user.id) {
      return new Response("Unauthorized", { status: 401, statusText: "Unauthorized" });
    }

    const userMessage = messages.filter((message) => message.role === 'user').at(-1);

    if (!userMessage) {
      return new Response('No user message found', { status: 400 });
    }

    const chat = await getChatById({ id: chatId });
    if (!chat) {
      const title = await generateTitleFromUserMessage({
        message: userMessage,
      });

      await saveChat({ id: chatId, userId: session.user.id, title });
    } else if (chat.userId !== session.user.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    await saveMessages({
      messages: [
        {
          chatId,
          id: userMessage.id,
          role: 'user',
          parts: userMessage.parts,
          attachments: userMessage.experimental_attachments ?? [],
          createdAt: new Date(),
        },
      ],
    });
    let model: LanguageModel
    let reasoningModel: LanguageModel

    try {
      model = fermion.languageModel(selectedModel);
      reasoningModel = fermion.languageModel(selectedReasoningModel);
    } catch (error) {
      model = fermion.languageModel("fermion-apex")
      reasoningModel = fermion.languageModel("fermion-reasoning")
    }
    const activeTools: Array<"graphTool" | "deepResearch" | "flashcardGeneratorTool" | "quizGeneratorTool" | "mermaidTool"> = deepResearchEnabled ? ["deepResearch"] : ["graphTool", "flashcardGeneratorTool", "quizGeneratorTool", "mermaidTool"]


    const instructions = deepResearchEnabled
      ? DEEP_RESEARCH_PROMPT(session.user.name)
      : ATLAS_PROMPT(
        session.user.name,
        Array.isArray(canvasData)
          ? canvasData.map(formatCanvasData).join('\n')
          : canvasData
            ? formatCanvasData(canvasData)
            : ""
      );


    return createDataStreamResponse({
      execute: async (dataStream) => {
        const chatAgent = new Agent({
          name: "Fermion",
          instructions,
          model: thinkingEnabled ? reasoningModel : model,
          tools: {
            graphTool,
            quizGeneratorTool: quizGeneratorTool({
              userId: session.user.id,
              chatId
            }),
            flashcardGeneratorTool: flashcardGeneratorTool({
              userId: session.user.id,
              chatId
            }),
            deepResearch: deepResearch({
              dataStream,
              model: reasoningModel
            }),
            mermaidTool,
          },
          memory: new Memory({
            storage: new LibSQLStore({
              url: "file:../mastra.db", // Or your database URL
            }),
          })
        })

        const agentStream = await chatAgent.stream(messages.at(-1)?.content || "", {
          threadId: chatId,
          resourceId: session.user.id,
          maxSteps: 5,
          experimental_activeTools: selectedModel === 'fermion-sprint' || thinkingEnabled ? [] : activeTools,
          experimental_transform: smoothStream({ chunking: 'word' }),
          experimental_generateMessageId: uuid,
          onFinish: async ({ response }) => {
            if (session.user?.id) {
              try {
                const assistantId = getTrailingMessageId({
                  messages: response.messages.filter(
                    (message) => message.role === 'assistant',
                  ),
                });

                if (!assistantId) {
                  throw new Error('No assistant message found!');
                }

                const [, assistantMessage] = appendResponseMessages({
                  messages: [userMessage],
                  responseMessages: response.messages,
                });
                await saveMessages({
                  messages: [
                    {
                      id: assistantId,
                      chatId,
                      role: assistantMessage.role,
                      parts: assistantMessage.parts,
                      attachments:
                        assistantMessage.experimental_attachments ?? [],
                      createdAt: new Date(),
                    },
                  ],
                });

              } catch (error) {
                console.error('Failed to save chat');
              }
            }
          }
        })

        agentStream.consumeStream();

        agentStream.mergeIntoDataStream(dataStream, {
          sendReasoning: true,
        })

        // result.mergeIntoDataStream(dataStream, {
        //   sendReasoning: true,
        // });
      },
      onError: (error) => {
        console.error(error)
        return 'Oops, an error occured!';
      },
    })

  } catch (error) {
    return NextResponse.json({ error }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return new Response('Not Found', { status: 404 });
  }

  const session = await auth.api.getSession({
    headers: req.headers
  })

  if (!session || !session.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const chat = await getChatById({ id });
    if (!chat) {
      return new Response("There is no chat with given id", { status: 400 })
    }

    if (chat.userId !== session.user.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    await deleteChatById({ id });

    return new Response('Chat deleted', { status: 200 });
  } catch (error) {
    return new Response('An error occurred while processing your request', {
      status: 500,
    });
  }
}
