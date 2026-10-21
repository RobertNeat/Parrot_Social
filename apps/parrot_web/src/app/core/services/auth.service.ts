import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type { AuthResponseDto, CurrentUserDto } from '@parrot-social/shared-dto';
import { environment } from '../../../environments/environment';
import { UserProfile } from '../models/user.model';
import { AuthTokenStore } from './auth-token.store';

const FALLBACK_AVATAR = 'resources/person/men_1.png';

/** Maps the real session DTO to the local UserProfile shape still used by pages/mock-data that
 * aren't wired to the backend yet (Feed, Profile, Settings/Onboarding forms). Each page switches
 * to CurrentUserDto directly once its own slice lands; until then this keeps them compiling and
 * rendering against a real logged-in user instead of the old CURRENT_USER mock constant. */
function toLocalProfile(dto: CurrentUserDto): UserProfile {
  return {
    id: dto.id,
    username: dto.username,
    email: dto.email,
    firstName: dto.firstName,
    lastName: dto.lastName,
    avatarUrl: dto.avatar?.url ?? FALLBACK_AVATAR,
    coverUrl: dto.cover?.url ?? FALLBACK_AVATAR,
    bio: dto.bio ?? '',
    work: dto.work,
    education: dto.education,
    relationship: dto.relationship,
    inhabitance: dto.inhabitance,
    provenance: dto.provenance,
    memberSince: new Date(dto.createdAt).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
  };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/auth`;

  private readonly user = signal<UserProfile | null>(null);

  readonly currentUser = computed(() => this.user());
  readonly isAuthenticated = computed(() => this.user() !== null);
  /** Resolves once the startup `/auth/me` restore attempt (if any) has settled. Guards await this
   * so a page reload with a valid token doesn't flash /login before the session is restored. */
  readonly whenReady: Promise<void>;

  constructor() {
    this.whenReady = this.restoreSession();
  }

  private async restoreSession(): Promise<void> {
    const token = AuthTokenStore.get();
    if (!token) {
      return;
    }
    try {
      const dto = await firstValueFrom(this.http.get<CurrentUserDto>(`${this.baseUrl}/me`));
      this.user.set(toLocalProfile(dto));
    } catch (error) {
      // Only an explicit auth rejection means the token is actually invalid; a network/server
      // error (API unreachable, 5xx) must not log the user out from under them.
      if (error instanceof HttpErrorResponse && error.status === 401) {
        AuthTokenStore.clear();
        this.user.set(null);
      }
    }
  }

  async login(identifier: string, password: string): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.http.post<AuthResponseDto>(`${this.baseUrl}/login`, {
          identifier,
          password,
        }),
      );
      this.applySession(response);
      return true;
    } catch {
      return false;
    }
  }

  async register(username: string, email: string, password: string): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.http.post<AuthResponseDto>(`${this.baseUrl}/register`, {
          username,
          email,
          password,
        }),
      );
      this.applySession(response);
      return true;
    } catch {
      return false;
    }
  }

  /** Local-only until the PATCH /users/me endpoint exists (Settings/Onboarding slice). */
  updateProfile(partial: Partial<UserProfile>): void {
    const updated = { ...this.user(), ...partial } as UserProfile;
    this.user.set(updated);
  }

  logout(): void {
    AuthTokenStore.clear();
    this.user.set(null);
  }

  private applySession(response: AuthResponseDto): void {
    AuthTokenStore.set(response.accessToken);
    this.user.set(toLocalProfile(response.user));
  }
}
