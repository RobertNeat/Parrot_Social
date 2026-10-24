import {
  Component,
  DestroyRef,
  ElementRef,
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
import { FriendshipService } from '../../core/services/friendship.service';
import { MediaUploadService } from '../../core/services/media-upload.service';
import { ProfileService } from '../../core/services/profile.service';
import { Post } from '../../core/models/post.model';
import { UserProfile } from '../../core/models/user.model';
import type { FriendshipStatus } from '@parrot-social/shared-dto';
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
  private readonly mediaUpload = inject(MediaUploadService);
  private readonly profileService = inject(ProfileService);
  private readonly friendshipService = inject(FriendshipService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  // Optional (not .required): the element lives inside an `@if (profile(); as profile)` block,
  // so it doesn't exist in the DOM until the async profile load resolves.
  readonly postsGrid = viewChild<ElementRef<HTMLElement>>('postsGrid');
  private readonly columnCount = signal(1);

  readonly profile = signal<UserProfile | null>(null);
  readonly posts = signal<Post[]>([]);
  readonly avatarUploading = signal(false);
  readonly coverUploading = signal(false);
  readonly friendshipStatus = signal<FriendshipStatus | null>(null);
  readonly friendshipRequestId = signal<string | undefined>(undefined);
  readonly friendshipActionPending = signal(false);

  private readonly routeId = toSignal(this.route.paramMap.pipe(map((params) => params.get('id'))), {
    initialValue: null,
  });

  readonly isOwnProfile = computed(() => this.profile()?.id === this.auth.currentUser()?.id);

  readonly postColumns = computed(() => distributeRoundRobin(this.posts(), this.columnCount()));

  /** Guards against a stale async response winning a race after a newer navigation started. */
  private loadingId: string | null = null;

  constructor() {
    // effect (not afterNextRender) - the grid can mount, unmount (profile not found) and
    // remount (later navigation) across this component's lifetime, so watch for the element
    // becoming available rather than assuming a single render.
    effect((onCleanup) => {
      const grid = this.postsGrid();
      if (!grid) return;
      onCleanup(watchColumnCount(grid, this.columnCount, this.destroyRef, 280, 20));
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
    // Always re-fetch rather than reusing auth.currentUser(): its avatarUrl/coverUrl are
    // single-use, short-lived media tokens that may already be spent (e.g. the shell navbar
    // rendered the same avatar) or expired by the time this page mounts.
    const profile = await this.profileService.loadProfile(targetId);
    if (this.loadingId !== targetId) return; // stale response - a newer navigation already started
    this.profile.set(profile);
    this.friendshipStatus.set(null);
    this.friendshipRequestId.set(undefined);
    if (!profile) {
      this.posts.set([]);
      return;
    }
    const posts = await this.profileService.loadPostsByAuthor(profile.id);
    if (this.loadingId !== targetId) return;
    this.posts.set(posts);

    if (profile.id !== this.auth.currentUser()?.id) {
      const status = await this.friendshipService.getStatus(profile.id);
      if (this.loadingId !== targetId) return;
      this.friendshipStatus.set(status.status);
      this.friendshipRequestId.set(status.requestId);
    }
  }

  async sendFriendRequest(): Promise<void> {
    const profile = this.profile();
    if (!profile || this.friendshipActionPending()) return;
    this.friendshipActionPending.set(true);
    try {
      const result = await this.friendshipService.sendRequest(profile.id);
      if (result) {
        this.friendshipStatus.set('pending_sent');
        this.friendshipRequestId.set(result.id);
      }
    } finally {
      this.friendshipActionPending.set(false);
    }
  }

  async acceptFriendRequest(): Promise<void> {
    const requestId = this.friendshipRequestId();
    if (!requestId || this.friendshipActionPending()) return;
    this.friendshipActionPending.set(true);
    try {
      const result = await this.friendshipService.accept(requestId);
      if (result) {
        this.friendshipStatus.set('friends');
      }
    } finally {
      this.friendshipActionPending.set(false);
    }
  }

  async declineFriendRequest(): Promise<void> {
    const requestId = this.friendshipRequestId();
    if (!requestId || this.friendshipActionPending()) return;
    this.friendshipActionPending.set(true);
    try {
      const ok = await this.friendshipService.decline(requestId);
      if (ok) {
        this.friendshipStatus.set('none');
        this.friendshipRequestId.set(undefined);
      }
    } finally {
      this.friendshipActionPending.set(false);
    }
  }

  async unfriend(): Promise<void> {
    const profile = this.profile();
    if (!profile || this.friendshipActionPending()) return;
    this.friendshipActionPending.set(true);
    try {
      const ok = await this.friendshipService.unfriend(profile.id);
      if (ok) {
        this.friendshipStatus.set('none');
        this.friendshipRequestId.set(undefined);
      }
    } finally {
      this.friendshipActionPending.set(false);
    }
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

  async onAvatarSelected(event: Event): Promise<void> {
    await this.uploadProfileImage(event, 'avatar');
  }

  async onCoverSelected(event: Event): Promise<void> {
    await this.uploadProfileImage(event, 'cover');
  }

  private async uploadProfileImage(event: Event, slot: 'avatar' | 'cover'): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file || !this.isOwnProfile()) return;

    const uploadingSignal = slot === 'avatar' ? this.avatarUploading : this.coverUploading;
    uploadingSignal.set(true);
    try {
      const media = await this.mediaUpload.upload(file);
      await this.auth.updateProfile(
        slot === 'avatar'
          ? { avatarAttachHandle: media.attachHandle }
          : { coverAttachHandle: media.attachHandle },
      );
      this.profile.set(this.auth.currentUser());
    } finally {
      uploadingSignal.set(false);
    }
  }
}
