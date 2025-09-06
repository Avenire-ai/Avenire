import { index, uniqueIndex } from 'drizzle-orm/pg-core';
import { user, account, verification, passkey } from './auth-schema';
import { chat, message } from './chat-schema';
import { flashcards } from './flashcard-schema';
import { quizzes } from './quiz-schema';

// User table indexes
export const userEmailIndex = uniqueIndex('user_email_idx').on(user.email);
export const userUsernameIndex = uniqueIndex('user_username_idx').on(user.username);
export const userCreatedAtIndex = index('user_created_at_idx').on(user.createdAt);

// Account table indexes
export const accountUserIdIndex = index('account_user_id_idx').on(account.userId);
export const accountProviderIndex = index('account_provider_idx').on(account.providerId, account.accountId);

// Verification table indexes
export const verificationIdentifierIndex = index('verification_identifier_idx').on(verification.identifier);
export const verificationExpiresAtIndex = index('verification_expires_at_idx').on(verification.expiresAt);

// Passkey table indexes
export const passkeyUserIdIndex = index('passkey_user_id_idx').on(passkey.userId);
export const passkeyCredentialIdIndex = uniqueIndex('passkey_credential_id_idx').on(passkey.credentialID);

// Chat table indexes
export const chatUserIdIndex = index('chat_user_id_idx').on(chat.userId);
export const chatCreatedAtIndex = index('chat_created_at_idx').on(chat.createdAt);
export const chatUserIdCreatedAtIndex = index('chat_user_id_created_at_idx').on(chat.userId, chat.createdAt);
export const chatVisibilityIndex = index('chat_visibility_idx').on(chat.visibility);

// Message table indexes
export const messageChatIdIndex = index('message_chat_id_idx').on(message.chatId);
export const messageCreatedAtIndex = index('message_created_at_idx').on(message.createdAt);
export const messageChatIdCreatedAtIndex = index('message_chat_id_created_at_idx').on(message.chatId, message.createdAt);
export const messageRoleIndex = index('message_role_idx').on(message.role);

// Flashcard table indexes
export const flashcardUserIdIndex = index('flashcard_user_id_idx').on(flashcards.userId);
export const flashcardChatIdIndex = index('flashcard_chat_id_idx').on(flashcards.chatId);
export const flashcardCreatedAtIndex = index('flashcard_created_at_idx').on(flashcards.createdAt);
export const flashcardUserIdCreatedAtIndex = index('flashcard_user_id_created_at_idx').on(flashcards.userId, flashcards.createdAt);
export const flashcardTopicIndex = index('flashcard_topic_idx').on(flashcards.topic);

// Quiz table indexes
export const quizUserIdIndex = index('quiz_user_id_idx').on(quizzes.userId);
export const quizChatIdIndex = index('quiz_chat_id_idx').on(quizzes.chatId);
export const quizCreatedAtIndex = index('quiz_created_at_idx').on(quizzes.createdAt);
export const quizUserIdCreatedAtIndex = index('quiz_user_id_created_at_idx').on(quizzes.userId, quizzes.createdAt);
export const quizTopicIndex = index('quiz_topic_idx').on(quizzes.topic);

// Composite indexes for common query patterns
export const chatUserVisibilityIndex = index('chat_user_visibility_idx').on(chat.userId, chat.visibility, chat.createdAt);
export const messageChatRoleIndex = index('message_chat_role_idx').on(message.chatId, message.role, message.createdAt);
