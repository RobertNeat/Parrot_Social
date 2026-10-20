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
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { GroupsService } from '../../core/services/groups.service';
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
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  readonly postsGrid = viewChild.required<ElementRef<HTMLElement>>('postsGrid');
  private readonly columnCount = signal(1);

  constructor() {
    afterNextRender(() => {
      watchColumnCount(this.postsGrid(), this.columnCount, this.destroyRef, 260, 20);
    });
  }

  private readonly groupId = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('id') ?? '')),
    {
      initialValue: '',
    },
  );

  readonly group = computed(() => this.groupsService.getGroup(this.groupId()));
  readonly postColumns = computed(() =>
    distributeRoundRobin(this.groupsService.groupPosts(), this.columnCount()),
  );

  toggleMembership(): void {
    const group = this.group();
    if (group) {
      this.groupsService.toggleMembership(group.id);
    }
  }

  like(postId: string): void {
    this.groupsService.groupPosts.update((posts) =>
      posts.map((post) =>
        post.id === postId
          ? { ...post, liked: !post.liked, likeCount: post.likeCount + (post.liked ? -1 : 1) }
          : post,
      ),
    );
  }

  upvote(postId: string): void {
    this.groupsService.groupPosts.update((posts) =>
      posts.map((post) =>
        post.id === postId
          ? {
              ...post,
              upvoted: !post.upvoted,
              upvoteCount: post.upvoteCount + (post.upvoted ? -1 : 1),
            }
          : post,
      ),
    );
  }

  comment(event: { postId: string; text: string }): void {
    if (!event.text.trim()) {
      return;
    }
    this.groupsService.groupPosts.update((posts) =>
      posts.map((post) =>
        post.id === event.postId
          ? {
              ...post,
              comments: [
                ...post.comments,
                {
                  id: 'c-' + crypto.randomUUID(),
                  authorName: 'You',
                  authorAvatarUrl: '',
                  text: event.text,
                },
              ],
            }
          : post,
      ),
    );
  }
}
