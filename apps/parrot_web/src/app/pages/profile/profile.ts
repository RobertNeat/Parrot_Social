import {
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { FeedService } from '../../core/services/feed.service';
import { ProfileService } from '../../core/services/profile.service';
import { Post } from '../../core/models/post.model';
import { UserProfile } from '../../core/models/user.model';
import { PostCard } from '../../shared/components/post-card/post-card';
import {
  distributeRoundRobin,
  watchColumnCount,
} from '../../shared/components/masonry-columns/masonry-columns';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

@Component({
  selector: 'app-profile',
  imports: [FormsModule, PostCard],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile {
  readonly auth = inject(AuthService);
  readonly feed = inject(FeedService);
  private readonly profileService = inject(ProfileService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  readonly postsGrid = viewChild.required<ElementRef<HTMLElement>>('postsGrid');
  private readonly columnCount = signal(1);

  readonly profile = signal<UserProfile | null>(null);
  readonly posts = signal<Post[]>([]);

  private readonly routeId = toSignal(this.route.paramMap.pipe(map((params) => params.get('id'))), {
    initialValue: null,
  });

  readonly isOwnProfile = computed(() => this.profile()?.id === this.auth.currentUser()?.id);

  readonly postColumns = computed(() => distributeRoundRobin(this.posts(), this.columnCount()));

  /** Guards against a stale async response winning a race after a newer navigation started. */
  private loadingId: string | null = null;

  constructor() {
    afterNextRender(() => {
      watchColumnCount(this.postsGrid(), this.columnCount, this.destroyRef, 280, 20);
    });

    // Angular reuses this component instance across /profile/a -> /profile/b navigations, so
    // reload whenever the resolved target id changes rather than once at construction time.
    effect(() => {
      const targetId = this.routeId() ?? this.auth.currentUser()?.id ?? null;
      void this.doLoad(targetId);
    });
  }

  private async doLoad(targetId: string | null): Promise<void> {
    if (!targetId || targetId === this.loadingId) {
      return;
    }
    this.loadingId = targetId;
    const ownId = this.auth.currentUser()?.id;
    const profile =
      targetId === ownId
        ? this.auth.currentUser()
        : await this.profileService.loadProfile(targetId);
    if (this.loadingId !== targetId) return; // stale response - a newer navigation already started
    this.profile.set(profile);
    if (!profile) {
      this.posts.set([]);
      return;
    }
    const posts = await this.profileService.loadPostsByAuthor(profile.id);
    if (this.loadingId !== targetId) return;
    this.posts.set(posts);
  }

  like(postId: string): void {
    const post = this.posts().find((p) => p.id === postId);
    if (!post) return;
    void this.feed.toggleLike(postId, post.liked).then((updated) => this.applyPost(updated));
  }

  upvote(postId: string): void {
    const post = this.posts().find((p) => p.id === postId);
    if (!post) return;
    void this.feed.toggleUpvote(postId, post.upvoted).then((updated) => this.applyPost(updated));
  }

  comment(event: { postId: string; text: string }): void {
    void this.feed.addComment(event.postId, event.text).then((updated) => {
      if (updated) this.applyPost(updated);
    });
  }

  remove(postId: string): void {
    void this.feed.deletePost(postId).then((ok) => {
      if (ok) {
        this.posts.update((posts) => posts.filter((p) => p.id !== postId));
      }
    });
  }

  private applyPost(post: Post): void {
    this.posts.update((posts) => posts.map((p) => (p.id === post.id ? post : p)));
  }
}
