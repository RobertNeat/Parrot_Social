import { MediaRefDto } from '../media/media.dto.js';

export class ChatMessageDto {
  id!: string;
  conversationId!: string;
  senderId!: string;
  /** Viewer-relative: whether the requesting user is the sender. */
  fromMe!: boolean;
  text!: string;
  image?: MediaRefDto;
  createdAt!: string;
}

export class SendMessageRequestDto {
  text!: string;
  /** MediaDto.attachHandle from a prior upload. */
  imageAttachHandle?: string;
}
