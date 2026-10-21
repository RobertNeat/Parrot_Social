const TOKEN_KEY = 'parrot.accessToken';

/** Plain localStorage wrapper so AuthService and the HTTP interceptor share one storage key
 * without importing each other (interceptor must not depend on AuthService to avoid a DI cycle). */
export const AuthTokenStore = {
  get(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },
  set(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  },
  clear(): void {
    localStorage.removeItem(TOKEN_KEY);
  },
};
