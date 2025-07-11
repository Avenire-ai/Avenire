import { UseChatHelpers } from 'ai/react';
import { deleteTrailingMessages } from '../../actions/actions';
import type { UIMessage } from 'ai';

export async function regenerateMessage({
  message,
  setMessages,
  reload,
  draftContent,
}: {
  message: UIMessage;
  setMessages: UseChatHelpers['setMessages'];
  reload: UseChatHelpers['reload'];
  draftContent?: string;
}) {
  await deleteTrailingMessages({ id: message.id });

  if (draftContent) {
    setMessages((messages) => {
      const lastUserMessageIndex = messages.findIndex(m => m.role === 'user');
      if (lastUserMessageIndex !== -1) {
        const updatedMessages = [...messages];
        updatedMessages[lastUserMessageIndex] = {
          ...updatedMessages[lastUserMessageIndex],
          content: draftContent,
        };
        return updatedMessages;
      }
      return messages;
    });
  }

  reload();
}