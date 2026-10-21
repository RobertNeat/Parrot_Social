import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NotificationsService } from '../../core/services/notifications.service';
import { ProfileService } from '../../core/services/profile.service';
import { UserProfile } from '../../core/models/user.model';

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
