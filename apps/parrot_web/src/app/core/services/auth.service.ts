import { Injectable, computed, signal } from '@angular/core';
import { UserProfile } from '../models/user.model';
import { CURRENT_USER } from '../mock/mock-data';

const SESSION_KEY = 'parrot.session';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly user = signal<UserProfile | null>(this.restoreSession());

  readonly currentUser = computed(() => this.user());
  readonly isAuthenticated = computed(() => this.user() !== null);

  private restoreSession(): UserProfile | null {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as UserProfile) : null;
  }

  private persist(user: UserProfile | null): void {
    if (user) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
  }

  login(identifier: string, _password: string): boolean {
    if (!identifier.trim() || !_password.trim()) {
      return false;
    }
    this.user.set(CURRENT_USER);
    this.persist(CURRENT_USER);
    return true;
  }

  register(username: string, email: string): boolean {
    if (!username.trim() || !email.trim()) {
      return false;
    }
    const newUser: UserProfile = {
      ...CURRENT_USER,
      id: 'u-' + username.toLowerCase(),
      username,
      email,
      firstName: username,
      lastName: '',
    };
    this.user.set(newUser);
    this.persist(newUser);
    return true;
  }

  updateProfile(partial: Partial<UserProfile>): void {
    const updated = { ...this.user(), ...partial } as UserProfile;
    this.user.set(updated);
    this.persist(updated);
  }

  logout(): void {
    this.user.set(null);
    this.persist(null);
  }
}
