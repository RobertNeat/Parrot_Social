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
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { FeedService } from '../../core/services/feed.service';
import { FRIENDS } from '../../core/mock/mock-data';
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
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  readonly postsGrid = viewChild.required<ElementRef<HTMLElement>>('postsGrid');
  private readonly columnCount = signal(1);

  constructor() {
    void this.feed.load();
    afterNextRender(() => {
      watchColumnCount(this.postsGrid(), this.columnCount, this.destroyRef, 280, 20);
    });
  }

  private readonly routeId = toSignal(this.route.paramMap.pipe(map((params) => params.get('id'))), {
    initialValue: null,
  });

  readonly profile = computed<UserProfile | null>(() => {
    const id = this.routeId();
    if (!id || id === this.auth.currentUser()?.id) {
      return this.auth.currentUser();
    }
    return FRIENDS.find((friend) => friend.id === id) ?? null;
  });

  readonly isOwnProfile = computed(() => this.profile()?.id === this.auth.currentUser()?.id);

  readonly posts = computed(() => {
    const profile = this.profile();
    if (!profile) {
      return [];
    }
    return this.isOwnProfile()
      ? this.feed.posts()
      : this.feed.posts().filter((p) => p.authorId === profile.id);
  });

  readonly postColumns = computed(() => distributeRoundRobin(this.posts(), this.columnCount()));

  like(postId: string): void {
    void this.feed.toggleLike(postId);
  }

  upvote(postId: string): void {
    void this.feed.toggleUpvote(postId);
  }

  comment(event: { postId: string; text: string }): void {
    void this.feed.addComment(event.postId, event.text);
  }

  remove(postId: string): void {
    void this.feed.deletePost(postId);
  }
}
