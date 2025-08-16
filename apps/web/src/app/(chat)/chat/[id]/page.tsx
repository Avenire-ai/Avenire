import { notFound } from 'next/navigation';
import { Metadata, ResolvingMetadata } from 'next';

import { OutlineAssistantUITools, UIDataTypes, UIMessage, UIMessagePart } from '@avenire/ai';
import { getChatById, getMessagesByChatId } from '@avenire/database/queries';
import { Message } from '@avenire/database/schema';
import { Chat } from '../../../../components/chat/chat';
import { formatISO } from 'date-fns';

type Props = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}


export async function generateMetadata(
  { params, searchParams }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { id } = await params
  const chat = await getChatById({ id });

  if (!chat) {
    return {
      title: 'Chat Not Found | Avenire'
    };
  }

  return {
    title: `${chat.title} | Avenire`
  }
}

export default async function Page({ params, searchParams }: Props) {
  const { id } = await params;
  const chat = await getChatById({ id });

  if (!chat) {
    notFound();
  }

  const messagesFromDb = await getMessagesByChatId({
    id,
  });

  function convertToUIMessages(messages: Message[]): UIMessage<unknown, UIDataTypes, OutlineAssistantUITools>[] {
    return messages.map((message) => ({
      id: message.id,
      role: message.role as 'user' | 'assistant' | 'system',
      parts: message.parts as UIMessagePart<UIDataTypes, OutlineAssistantUITools>[],
      metadata: {
        createdAt: formatISO(message.createdAt),
      },
    }));
  }

  return (
    <>
      <Chat
        id={chat.id}
        selectedModel='fermion-core'
        selectedReasoningModel='fermion-reasoning'
        initialMessages={convertToUIMessages(messagesFromDb)}
        isReadonly={false}
      />
    </>
  );
}
