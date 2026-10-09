import { Injectable, computed, signal } from '@angular/core';
import type { User } from '../api/models';

/** Holds the signed-in user. Pure state: no HTTP, so interceptors and guards can depend on it freely. */
@Injectable({ providedIn: 'root' })
export class SessionStore {
  private readonly _user = signal<User | null>(null);

  readonly user = this._user.asReadonly();
  readonly isAuthenticated = computed(() => this._user() !== null);
  /** Full name, falling back to the username for accounts that have none. */
  readonly displayName = computed(() => {
    const user = this._user();
    return user ? user.full_name.trim() || user.username : '';
  });

  setUser(user: User): void {
    this._user.set(user);
  }

  clear(): void {
    this._user.set(null);
  }
}
