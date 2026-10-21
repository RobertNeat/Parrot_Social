import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type { ChatMessageDto, ConversationDto } from '@parrot-social/shared-dto';
import { environment } from '../../../environments/environment';
import { Conversation } from '../models/chat.model';
import { toLocalChatMessage, toLocalConversation } from './chat.mapper';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/chat`;

  readonly conversations = signal<Conversation[]>([]);

  async load(): Promise<void> {
    const dtos = await firstValueFrom(
      this.http.get<ConversationDto[]>(`${this.baseUrl}/conversations`),
    );
    this.conversations.set(dtos.map(toLocalConversation));
  }

  async sendMessage(conversationId: string, text: string): Promise<boolean> {
    const trimmed = text.trim();
    if (!trimmed || !conversationId) {
      return false;
    }
    try {
      const dto = await firstValueFrom(
        this.http.post<ChatMessageDto>(`${this.baseUrl}/conversations/${conversationId}/messages`, {
          text: trimmed,
        }),
      );
      this.conversations.update((conversations) =>
        conversations.map((conversation) =>
          conversation.id === conversationId
            ? {
                ...conversation,
                messages: [...conversation.messages, toLocalChatMessage(dto)],
              }
            : conversation,
        ),
      );
      return true;
    } catch {
      return false;
    }
  }
}
