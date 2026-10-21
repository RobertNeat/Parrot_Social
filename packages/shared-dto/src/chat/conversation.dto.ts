import { ChatMessageDto } from './chat-message.dto.js';
import { MediaRefDto } from '../media/media.dto.js';

export class ConversationDto {
  id!: string;
  /** The other participant from the requesting user's point of view. */
  contactId!: string;
  contactName!: string;
  contactAvatar?: MediaRefDto;
  messages!: ChatMessageDto[];
}
