import type { Response } from 'express';
import type {
  ChatMessageDto,
  ConversationDto,
} from '@parrot-social/shared-dto';
import { MediaRefBuilderService } from '../media/media-ref-builder.service.js';
import type { ChatMessageRow, ConversationRow } from './chat.repository.js';

export async function toChatMessageDto(
  row: ChatMessageRow,
  mediaRefBuilder: MediaRefBuilderService,
  res: Response,
  viewerId: string,
): Promise<ChatMessageDto> {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    fromMe: row.sender_id === viewerId,
    text: row.text,
    image: await mediaRefBuilder.buildRefForMediaId(row.image_media_id, res),
    createdAt: row.created_at.toISOString(),
  };
}

export async function toConversationDto(
  row: ConversationRow,
  messages: ChatMessageRow[],
  mediaRefBuilder: MediaRefBuilderService,
  res: Response,
  viewerId: string,
): Promise<ConversationDto> {
  return {
    id: row.id,
    contactId: row.contact_id,
    contactName: `${row.contact_first_name} ${row.contact_last_name}`,
    contactAvatar: await mediaRefBuilder.buildRefForMediaId(
      row.contact_avatar_media_id,
      res,
    ),
    messages: await Promise.all(
      messages.map((message) =>
        toChatMessageDto(message, mediaRefBuilder, res, viewerId),
      ),
    ),
  };
}
