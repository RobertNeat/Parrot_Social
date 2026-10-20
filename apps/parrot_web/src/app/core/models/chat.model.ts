export interface ChatMessage {
  id: string;
  fromMe: boolean;
  text: string;
}

export interface Conversation {
  id: string;
  contactName: string;
  contactAvatarUrl: string;
  messages: ChatMessage[];
}
