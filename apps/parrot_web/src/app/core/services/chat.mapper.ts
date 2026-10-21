import type { ChatMessageDto, ConversationDto } from '@parrot-social/shared-dto';
import { ChatMessage, Conversation } from '../models/chat.model';

// Same fallback-asset convention as post.mapper.ts/user.mapper.ts FALLBACK_AVATAR.
const FALLBACK_AVATAR = 'resources/person/men_1.png';

export function toLocalChatMessage(dto: ChatMessageDto): ChatMessage {
  return {
    id: dto.id,
    fromMe: dto.fromMe,
    text: dto.text,
  };
}

export function toLocalConversation(dto: ConversationDto): Conversation {
  return {
    id: dto.id,
    contactName: dto.contactName,
    contactAvatarUrl: dto.contactAvatar?.url ?? FALLBACK_AVATAR,
    messages: dto.messages.map(toLocalChatMessage),
  };
}
