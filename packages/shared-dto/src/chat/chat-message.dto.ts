export class ChatMessageDto {
  id!: string;
  conversationId!: string;
  senderId!: string;
  /** Viewer-relative: whether the requesting user is the sender. */
  fromMe!: boolean;
  text!: string;
  imageUrl?: string;
  createdAt!: string;
}

export class SendMessageRequestDto {
  text!: string;
  /** References a previously uploaded MediaDto.id. */
  imageMediaId?: string;
}
