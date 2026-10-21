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
import { ContactsService } from '../../core/services/contacts.service';
import { Post } from '../../core/models/post.model';
import { PostCard } from '../../shared/components/post-card/post-card';
import type { UserSummaryDto } from '@parrot-social/shared-dto';
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
  private readonly contactsService = inject(ContactsService);
  private readonly destroyRef = inject(DestroyRef);

  readonly postsGrid = viewChild.required<ElementRef<HTMLElement>>('postsGrid');
  private readonly columnCount = signal(1);
  readonly postColumns = computed(() =>
    distributeRoundRobin(this.feed.posts(), this.columnCount()),
  );

  constructor() {
    void this.feed.load();
    void this.contactsService.loadContacts().then((contacts) => this.contacts.set(contacts));
    afterNextRender(() => {
      watchColumnCount(this.postsGrid(), this.columnCount, this.destroyRef, 280, 20);
    });
  }

  readonly contacts = signal<UserSummaryDto[]>([]);
  readonly newPostText = signal('');
  readonly activeConversationId = signal(this.chat.conversations()[0]?.id ?? '');
  readonly messageText = signal('');

  selectConversation(id: string): void {
    this.activeConversationId.set(id);
  }

  activeConversation() {
    return this.chat.conversations().find((c) => c.id === this.activeConversationId());
  }

  async share(): Promise<void> {
    const text = this.newPostText().trim();
    if (!text) {
      return;
    }
    const ok = await this.feed.addPost(text);
    if (ok) {
      this.newPostText.set('');
    }
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
    const post = this.feed.posts().find((p) => p.id === postId);
    if (!post) return;
    void this.feed.toggleLike(postId, post.liked).then((updated) => this.applyPost(updated));
  }

  upvote(postId: string): void {
    const post = this.feed.posts().find((p) => p.id === postId);
    if (!post) return;
    void this.feed.toggleUpvote(postId, post.upvoted).then((updated) => this.applyPost(updated));
  }

  comment(event: { postId: string; text: string }): void {
    void this.feed.addComment(event.postId, event.text).then((updated) => {
      if (updated) this.applyPost(updated);
    });
  }

  remove(postId: string): void {
    void this.feed.deletePost(postId);
  }

  private applyPost(post: Post): void {
    this.feed.posts.update((posts) => posts.map((p) => (p.id === post.id ? post : p)));
  }
}
