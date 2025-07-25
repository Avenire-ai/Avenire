import { notFound } from 'next/navigation';
import { Metadata, ResolvingMetadata } from 'next';

import { Attachment, UIMessage } from '@avenire/ai';
import { getChatById, getMessagesByChatId } from '@avenire/database/queries';
import { Message } from '@avenire/database/schema';
import { Chat } from '../../../../components/chat/chat';

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

  function convertToUIMessages(messages: Array<Message>): Array<UIMessage> {
    return messages.map((message) => ({
      id: message.id,
      parts: message.parts as UIMessage['parts'],
      role: message.role as UIMessage['role'],
      // Note: content will soon be deprecated in @ai-sdk/react
      content: '',
      createdAt: message.createdAt,
      experimental_attachments:
        (message.attachments as Array<Attachment>) ?? [],
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
