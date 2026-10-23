export interface ChatMessage {
  id: string;
  fromMe: boolean;
  text: string;
  imageUrl?: string;
}

export interface Conversation {
  id: string;
  contactId: string;
  contactName: string;
  contactAvatarUrl: string;
  messages: ChatMessage[];
}
