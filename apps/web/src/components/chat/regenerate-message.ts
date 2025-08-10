import { deleteTrailingMessages } from '../../actions/actions';
import type { UIMessage } from 'ai';
import { UseChatHelpers } from 'ai/react';

export async function regenerateMessage({
  message,
  setMessages,
  reload,
}: {
  message: UIMessage;
  setMessages: UseChatHelpers['setMessages'];
  reload: UseChatHelpers['reload']
}) {
  // Delete trailing messages (including the current assistant message and any after it)
  await deleteTrailingMessages({ id: message.id });
  setMessages((messages) => {
    const index = messages.findIndex((m) => m.id === message.id);
    if (index !== -1) {
      // Keep only messages before the assistant message
      return messages.slice(0, index);
    }
    return messages;
  });
  reload();
}