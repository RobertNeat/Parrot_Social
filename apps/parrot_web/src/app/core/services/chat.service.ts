import { Injectable, signal } from '@angular/core';
import { Conversation } from '../models/chat.model';
import { CONVERSATIONS } from '../mock/mock-data';

@Injectable({ providedIn: 'root' })
export class ChatService {
  readonly conversations = signal<Conversation[]>(
    CONVERSATIONS.map((conversation) => ({
      ...conversation,
      messages: [...conversation.messages],
    })),
  );

  sendMessage(conversationId: string, text: string): void {
    if (!text.trim()) {
      return;
    }
    this.conversations.update((conversations) =>
      conversations.map((conversation) =>
        conversation.id === conversationId
          ? {
              ...conversation,
              messages: [
                ...conversation.messages,
                { id: 'm-' + crypto.randomUUID(), fromMe: true, text },
              ],
            }
          : conversation,
      ),
    );
  }
}
