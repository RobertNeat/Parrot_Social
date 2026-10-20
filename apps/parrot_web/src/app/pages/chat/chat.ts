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

  readonly activeConversationId = signal(this.chat.conversations()[0]?.id ?? '');
  readonly messageText = signal('');

  select(id: string): void {
    this.activeConversationId.set(id);
  }

  activeConversation() {
    return this.chat.conversations().find((c) => c.id === this.activeConversationId());
  }

  send(): void {
    const text = this.messageText().trim();
    if (!text) {
      return;
    }
    this.chat.sendMessage(this.activeConversationId(), text);
    this.messageText.set('');
  }
}
