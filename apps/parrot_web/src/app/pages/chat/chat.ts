import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../core/services/chat.service';
import { MediaUploadService } from '../../core/services/media-upload.service';

@Component({
  selector: 'app-chat',
  imports: [FormsModule],
  templateUrl: './chat.html',
  styleUrl: './chat.css',
})
export class Chat {
  readonly chat = inject(ChatService);
  private readonly mediaUpload = inject(MediaUploadService);

  readonly activeConversationId = signal('');
  readonly messageText = signal('');
  readonly attachedImagePreviewUrl = signal<string | null>(null);
  readonly attaching = signal(false);
  private attachedImageAttachHandle: string | undefined;
  private attachedObjectUrl: string | null = null;

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

  async onImageSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    this.clearAttachedImage();
    const objectUrl = URL.createObjectURL(file);
    this.attachedObjectUrl = objectUrl;
    this.attachedImagePreviewUrl.set(objectUrl);
    this.attaching.set(true);
    try {
      const media = await this.mediaUpload.upload(file);
      this.attachedImageAttachHandle = media.attachHandle;
    } catch {
      this.clearAttachedImage();
    } finally {
      this.attaching.set(false);
    }
  }

  clearAttachedImage(): void {
    if (this.attachedObjectUrl) {
      URL.revokeObjectURL(this.attachedObjectUrl);
      this.attachedObjectUrl = null;
    }
    this.attachedImagePreviewUrl.set(null);
    this.attachedImageAttachHandle = undefined;
  }

  async send(): Promise<void> {
    const text = this.messageText().trim();
    const conversationId = this.activeConversationId();
    const imageAttachHandle = this.attachedImageAttachHandle;
    if ((!text && !imageAttachHandle) || !conversationId || this.attaching()) {
      return;
    }
    const ok = await this.chat.sendMessage(conversationId, text, imageAttachHandle);
    if (ok) {
      this.messageText.set('');
      this.clearAttachedImage();
    }
  }
}
