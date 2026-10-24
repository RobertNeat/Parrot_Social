import { Component, EventEmitter, Output, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Post } from '../../../core/models/post.model';

@Component({
  selector: 'app-post-card',
  imports: [FormsModule, RouterLink],
  templateUrl: './post-card.html',
  styleUrl: './post-card.css',
})
export class PostCard {
  readonly post = input.required<Post>();
  readonly ownPost = input(false);

  @Output() like = new EventEmitter<string>();
  @Output() upvote = new EventEmitter<string>();
  @Output() comment = new EventEmitter<{ postId: string; text: string }>();
  @Output() remove = new EventEmitter<string>();

  readonly menuOpen = signal(false);
  readonly commentText = signal('');
  readonly commentsOpen = signal(false);

  toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  toggleComments(): void {
    this.commentsOpen.update((open) => !open);
  }

  submitComment(): void {
    const text = this.commentText().trim();
    if (!text) {
      return;
    }
    this.comment.emit({ postId: this.post().id, text });
    this.commentText.set('');
  }

  onDelete(): void {
    this.menuOpen.set(false);
    this.remove.emit(this.post().id);
  }
}
