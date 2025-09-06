import { cookies } from 'next/headers';
import { v4 as uuid } from 'uuid';
import { Metadata } from 'next';
import { Chat } from '../../../components/chat/chat';

export const metadata: Metadata = {
  title: 'New Chat | Avenire',
  description: 'Start a new conversation with Fermion, your AI assistant',
};

export default async function Page() {
  const id = uuid();

  const cookieStore = await cookies();
  const modelIdFromCookie = cookieStore.get('chat-model');

  return (
    <>
      <Chat
        key={id}
        id={id}
        selectedModel='fermion-core'
        selectedReasoningModel='fermion-reasoning'
        initialMessages={[]}
        isReadonly={false}
      />
    </>
  );
}
