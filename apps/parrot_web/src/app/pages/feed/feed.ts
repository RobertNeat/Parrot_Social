import {
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { FeedService } from '../../core/services/feed.service';
import { ChatService } from '../../core/services/chat.service';
import { CONTACTS } from '../../core/mock/mock-data';
import { PostCard } from '../../shared/components/post-card/post-card';
import {
  distributeRoundRobin,
  watchColumnCount,
} from '../../shared/components/masonry-columns/masonry-columns';

@Component({
  selector: 'app-feed',
  imports: [FormsModule, PostCard],
  templateUrl: './feed.html',
  styleUrl: './feed.css',
})
export class Feed {
  readonly auth = inject(AuthService);
  readonly feed = inject(FeedService);
  readonly chat = inject(ChatService);
  private readonly destroyRef = inject(DestroyRef);

  readonly postsGrid = viewChild.required<ElementRef<HTMLElement>>('postsGrid');
  private readonly columnCount = signal(1);
  readonly postColumns = computed(() =>
    distributeRoundRobin(this.feed.posts(), this.columnCount()),
  );

  constructor() {
    afterNextRender(() => {
      watchColumnCount(this.postsGrid(), this.columnCount, this.destroyRef, 280, 20);
    });
  }

  readonly contacts = CONTACTS;
  readonly newPostText = signal('');
  readonly activeConversationId = signal(this.chat.conversations()[0]?.id ?? '');
  readonly messageText = signal('');

  selectConversation(id: string): void {
    this.activeConversationId.set(id);
  }

  activeConversation() {
    return this.chat.conversations().find((c) => c.id === this.activeConversationId());
  }

  share(): void {
    const text = this.newPostText().trim();
    if (!text) {
      return;
    }
    const user = this.auth.currentUser();
    if (!user) {
      return;
    }
    this.feed.addPost(text, `${user.firstName} ${user.lastName}`, user.avatarUrl, user.id);
    this.newPostText.set('');
  }

  sendMessage(): void {
    const text = this.messageText().trim();
    if (!text) {
      return;
    }
    this.chat.sendMessage(this.activeConversationId(), text);
    this.messageText.set('');
  }

  like(postId: string): void {
    this.feed.toggleLike(postId);
  }

  upvote(postId: string): void {
    this.feed.toggleUpvote(postId);
  }

  comment(event: { postId: string; text: string }): void {
    const user = this.auth.currentUser();
    if (!user) {
      return;
    }
    this.feed.addComment(
      event.postId,
      event.text,
      `${user.firstName} ${user.lastName}`,
      user.avatarUrl,
    );
  }

  remove(postId: string): void {
    this.feed.deletePost(postId);
  }
}
