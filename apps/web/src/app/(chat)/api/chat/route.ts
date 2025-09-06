import { smoothStream, streamText, fermion, graphTool, FERMION_PROMPT, createUIMessageStream, createUIMessageStreamResponse, LanguageModel, flashcardGeneratorTool, quizGeneratorTool, plotTool, stepCountIs, UIMessage, convertToModelMessages } from "@avenire/ai"
import { auth } from "@avenire/auth/server";
import { deleteChatById, getChatById, getChatsByUserId, getMessagesByChatId, saveChat, saveMessages } from "@avenire/database/queries"
import { generateTitleFromUserMessage } from "../../../../actions/actions"
import { NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { type CanvasData } from "../../../../lib/canvas_types";
import { log } from "@avenire/logger/server";

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
      canvasData,
    }: {
      messages: UIMessage[];
      chatId: string;
      selectedModel: "fermion-sprint" | "fermion-core" | "fermion-apex";
      selectedReasoningModel: "fermion-reasoning" | "fermion-reasoning-lite";
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
          attachments: userMessage.parts.filter((part) => part.type === 'file') ?? [],
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
    const activeTools: Array<"graphTool" | "flashcardGeneratorTool" | "quizGeneratorTool" | "plotTool"> = ["graphTool", "flashcardGeneratorTool", "quizGeneratorTool", "plotTool"]

    const instructions = FERMION_PROMPT(
      session.user.name,
      Array.isArray(canvasData)
        ? canvasData.map(formatCanvasData).join('\n')
        : canvasData
          ? formatCanvasData(canvasData)
          : ""
    );


    const stream = createUIMessageStream({
      execute: ({ writer }) => {
        const result = streamText({
          model: model,
          system: instructions,
          messages: convertToModelMessages(messages),
          providerOptions: {
            google: {
              thinkingConfig: {
                reasoningBudget: 1024,
                includeThoughts: true
              },
            }
          },
          tools: {
            graphTool,
            quizGeneratorTool: quizGeneratorTool(
              session.user.id,
              chatId
            ),
            flashcardGeneratorTool: flashcardGeneratorTool(
              session.user.id,
              chatId
            ),
            plotTool,
          },
          stopWhen: stepCountIs(5),
          experimental_activeTools: selectedModel === 'fermion-sprint' ? [] : activeTools,
          experimental_transform: smoothStream({ chunking: 'word' }),

        })

        result.consumeStream();

        writer.merge(result.toUIMessageStream({
          sendReasoning: true,
          sendSources: true,
        }))

      },
      generateId: uuid,
      onFinish: async ({ messages }) => {
        await saveMessages({
          messages: messages.map((message) => ({
            id: message.id,
            role: message.role,
            parts: message.parts,
            createdAt: new Date(),
            attachments: [],
            chatId,
          })),
        });
      },
      onError: (error) => {
        log.error('Error in UIMessageStream', { error });
        return 'Oops, an error occured!';
      },
    })

    return createUIMessageStreamResponse({ stream })
  } catch (error) {
    log.error('Error in chat POST handler', { error });
    return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 });
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
    log.error('Error in chat DELETE handler', { error, chatId: id });
    return new Response('An error occurred while processing your request',
      { status: 500 });
  }
}
