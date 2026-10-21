import { ChatMessageDto } from './chat-message.dto.js';

export class ConversationDto {
  id!: string;
  /** The other participant from the requesting user's point of view. */
  contactId!: string;
  contactName!: string;
  contactAvatarUrl?: string;
  messages!: ChatMessageDto[];
}
