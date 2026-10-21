import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../core/services/chat.service';

@Component({
  selector: 'app-chat',
  imports: [FormsModule],
  templateUrl: './chat.html',
  styleUrl: './chat.css',
})
export class Chat {
  readonly chat = inject(ChatService);

  readonly activeConversationId = signal('');
  readonly messageText = signal('');

  constructor() {
    void this.chat.load().then(() => {
      if (!this.activeConversationId()) {
        this.activeConversationId.set(this.chat.conversations()[0]?.id ?? '');
      }
    });
  }

  select(id: string): void {
    this.activeConversationId.set(id);
  }

  activeConversation() {
    return this.chat.conversations().find((c) => c.id === this.activeConversationId());
  }

  async send(): Promise<void> {
    const text = this.messageText().trim();
    const conversationId = this.activeConversationId();
    if (!text || !conversationId) {
      return;
    }
    const ok = await this.chat.sendMessage(conversationId, text);
    if (ok) {
      this.messageText.set('');
    }
  }
}
