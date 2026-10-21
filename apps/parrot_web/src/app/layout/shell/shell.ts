import { Component, DestroyRef, inject, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { NotificationsService } from '../../core/services/notifications.service';
import { ProfileService } from '../../core/services/profile.service';
import { UserProfile } from '../../core/models/user.model';

const SEARCH_DEBOUNCE_MS = 300;
const SEARCH_MIN_LENGTH = 2;

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, FormsModule],
  templateUrl: './shell.html',
  styleUrl: './shell.css',
})
export class Shell {
  readonly mobileNavOpen = signal(false);
  readonly searchTerm = signal('');
  readonly friends = signal<UserProfile[]>([]);
  private readonly profileService = inject(ProfileService);

  constructor(
    readonly auth: AuthService,
    readonly notifications: NotificationsService,
    private readonly router: Router,
  ) {
    void this.profileService.loadFriends().then((friends) => this.friends.set(friends));
    // Eager-load so the unread badge (shell.html) is correct immediately on login, not only
    // after the user visits /notifications.
    void this.notifications.load();

    const destroyRef = inject(DestroyRef);
    const subscription = toObservable(this.searchTerm)
      .pipe(debounceTime(SEARCH_DEBOUNCE_MS), distinctUntilChanged())
      .subscribe((term) => {
        const trimmed = term.trim();
        if (trimmed.length >= SEARCH_MIN_LENGTH) {
          void this.router.navigate(['/search'], { queryParams: { q: trimmed } });
        }
      });
    destroyRef.onDestroy(() => subscription.unsubscribe());
  }

  toggleMobileNav(): void {
    this.mobileNavOpen.update((open) => !open);
  }

  closeMobileNav(): void {
    this.mobileNavOpen.set(false);
  }

  logout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }
}
