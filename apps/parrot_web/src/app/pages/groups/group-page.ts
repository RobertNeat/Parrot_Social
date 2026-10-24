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
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { GroupsService } from '../../core/services/groups.service';
import { FeedService } from '../../core/services/feed.service';
import { Group } from '../../core/models/group.model';
import { Post } from '../../core/models/post.model';
import { PostCard } from '../../shared/components/post-card/post-card';
import {
  distributeRoundRobin,
  watchColumnCount,
} from '../../shared/components/masonry-columns/masonry-columns';

@Component({
  selector: 'app-group-page',
  imports: [RouterLink, PostCard],
  templateUrl: './group-page.html',
  styleUrl: './group-page.css',
})
export class GroupPage {
  readonly groupsService = inject(GroupsService);
  private readonly feed = inject(FeedService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  // Optional (not .required): the element lives inside an `@if (group(); as group)` block,
  // so it doesn't exist in the DOM until the async group load resolves.
  readonly postsGrid = viewChild<ElementRef<HTMLElement>>('postsGrid');
  private readonly columnCount = signal(1);

  readonly group = signal<Group | undefined>(undefined);
  private loadingId: string | null = null;

  constructor() {
    // effect (not afterNextRender) - the grid can mount, unmount (group not found) and remount
    // (later navigation) across this component's lifetime, so watch for the element becoming
    // available rather than assuming a single render.
    effect((onCleanup) => {
      const grid = this.postsGrid();
      if (!grid) return;
      onCleanup(watchColumnCount(grid, this.columnCount, this.destroyRef, 260, 20));
    });

    // Angular reuses this component instance across /groups/x -> /groups/y navigations, so
    // reload whenever the route id changes rather than once at construction time.
    effect(() => {
      const id = this.groupId();
      void this.doLoad(id);
    });
  }

  private readonly groupId = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('id') ?? '')),
    {
      initialValue: '',
    },
  );

  readonly postColumns = computed(() =>
    distributeRoundRobin(this.groupsService.groupPosts(), this.columnCount()),
  );

  private async doLoad(id: string): Promise<void> {
    if (!id || id === this.loadingId) return;
    this.loadingId = id;
    this.groupsService.groupPosts.set([]);
    const group = await this.groupsService.loadGroup(id);
    if (this.loadingId !== id) return; // stale response - a newer navigation already started
    this.group.set(group ?? undefined);
    if (group) {
      await this.groupsService.loadGroupPosts(id);
    }
  }

  toggleMembership(): void {
    const group = this.group();
    if (group) {
      void this.groupsService.toggleMembership(group.id).then(() => {
        this.group.set(this.groupsService.getGroup(group.id));
      });
    }
  }

  like(postId: string): void {
    const post = this.groupsService.groupPosts().find((p) => p.id === postId);
    if (!post) return;
    void this.feed.toggleLike(postId, post.liked).then((updated) => this.applyPost(updated));
  }

  upvote(postId: string): void {
    const post = this.groupsService.groupPosts().find((p) => p.id === postId);
    if (!post) return;
    void this.feed.toggleUpvote(postId, post.upvoted).then((updated) => this.applyPost(updated));
  }

  comment(event: { postId: string; text: string }): void {
    void this.feed.addComment(event.postId, event.text).then((updated) => {
      if (updated) this.applyPost(updated);
    });
  }

  private applyPost(post: Post): void {
    this.groupsService.groupPosts.update((posts) =>
      posts.map((p) => (p.id === post.id ? post : p)),
    );
  }
}
