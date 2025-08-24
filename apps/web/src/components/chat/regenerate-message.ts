import { deleteTrailingMessages } from '../../actions/actions';
import { UseChatHelpers } from '@ai-sdk/react';
import { ToolType, UIMessage, UIDataTypes } from '@avenire/ai/tools/tools.types';

export async function regenerateMessage({
  message,
  setMessages,
  reload,
}: {
  message: UIMessage<unknown, UIDataTypes, ToolType>;
  setMessages: UseChatHelpers<UIMessage<unknown, UIDataTypes, ToolType>>['setMessages'];
  reload: UseChatHelpers<UIMessage<unknown, UIDataTypes, ToolType>>['regenerate'];
}) {
  // Delete trailing messages (including the current assistant message and any after it)
  await deleteTrailingMessages({ id: message.id });
  // setMessages((messages: Array<UIMessage<unknown, UIDataTypes, ToolType>>) => {
  //   const index = messages.findIndex((m) => m.id === message.id);
  //   if (index !== -1) {
  //     // Keep only messages before the assistant message
  //     return messages.slice(0, index);
  //   }
  //   return messages;
  // });
  reload();
}