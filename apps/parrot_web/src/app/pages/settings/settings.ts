import { Component, effect, signal } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { ProfileService } from '../../core/services/profile.service';
import { UserProfile } from '../../core/models/user.model';
import {
  PersonalInfoForm,
  PersonalInfoValue,
} from '../../shared/components/personal-info-form/personal-info-form';

@Component({
  selector: 'app-settings',
  imports: [PersonalInfoForm],
  templateUrl: './settings.html',
  styleUrl: './settings.css',
})
export class Settings {
  readonly saved = signal(false);
  readonly error = signal(false);

  // Own snapshot (not auth.currentUser() directly): avatarUrl/coverUrl are single-use,
  // short-lived media tokens, so this component needs its own freshly-minted pair instead of
  // reusing whatever the shell navbar or another page already fetched (and possibly consumed).
  readonly formUser = signal<UserProfile | null>(null);

  private loadedId: string | null = null;

  constructor(
    readonly auth: AuthService,
    private readonly profileService: ProfileService,
  ) {
    // React to currentUser() rather than reading it once: on a hard reload the startup
    // /auth/me restore (see AuthService.restoreSession) may still be pending at construction.
    effect(() => {
      const ownId = this.auth.currentUser()?.id ?? null;
      if (!ownId || ownId === this.loadedId) return;
      this.loadedId = ownId;
      void this.profileService.loadProfile(ownId).then((profile) => this.formUser.set(profile));
    });
  }

  async save(value: PersonalInfoValue): Promise<void> {
    const ok = await this.auth.updateProfile(value);
    this.saved.set(ok);
    this.error.set(!ok);
    if (ok) {
      this.formUser.set(this.auth.currentUser());
    }
  }
}
