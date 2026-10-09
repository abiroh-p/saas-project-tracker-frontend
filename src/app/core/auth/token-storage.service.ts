import { Injectable } from '@angular/core';
import type { AuthTokens } from '../api/models';

const ACCESS_KEY = 'pt.access';
const REFRESH_KEY = 'pt.refresh';

/**
 * Stores the JWT pair.
 *
 * "Remember me" keeps the session in `localStorage`; otherwise it lives in `sessionStorage` and is
 * dropped when the browser tab closes. Storage access is wrapped because it can throw
 * (private mode, blocked cookies) and we fall back to memory in that case.
 */
@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  private readonly local = safeStorage(() => window.localStorage);
  private readonly session = safeStorage(() => window.sessionStorage);

  get accessToken(): string | null {
    return this.holder()?.getItem(ACCESS_KEY) ?? null;
  }

  get refreshToken(): string | null {
    return this.holder()?.getItem(REFRESH_KEY) ?? null;
  }

  hasSession(): boolean {
    return this.refreshToken !== null || this.accessToken !== null;
  }

  /** Persists a new session. `remember` decides which storage is used. */
  save(tokens: AuthTokens, remember: boolean): void {
    this.clear();
    const target = remember ? this.local : this.session;
    target.setItem(ACCESS_KEY, tokens.access);
    target.setItem(REFRESH_KEY, tokens.refresh);
  }

  /** Updates tokens after a refresh, keeping them in whichever storage already holds the session. */
  update(tokens: { access: string; refresh?: string }): void {
    const target = this.holder() ?? this.session;
    target.setItem(ACCESS_KEY, tokens.access);
    if (tokens.refresh) {
      target.setItem(REFRESH_KEY, tokens.refresh);
    }
  }

  clear(): void {
    for (const storage of [this.local, this.session]) {
      storage.removeItem(ACCESS_KEY);
      storage.removeItem(REFRESH_KEY);
    }
  }

  private holder(): Storage | MemoryStorage | null {
    if (this.local.getItem(REFRESH_KEY) !== null || this.local.getItem(ACCESS_KEY) !== null) {
      return this.local;
    }
    if (this.session.getItem(REFRESH_KEY) !== null || this.session.getItem(ACCESS_KEY) !== null) {
      return this.session;
    }
    return null;
  }
}

class MemoryStorage {
  private readonly data = new Map<string, string>();
  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }
  removeItem(key: string): void {
    this.data.delete(key);
  }
}

function safeStorage(factory: () => Storage): Storage | MemoryStorage {
  try {
    const storage = factory();
    const probe = '__pt_probe__';
    storage.setItem(probe, '1');
    storage.removeItem(probe);
    return storage;
  } catch {
    return new MemoryStorage();
  }
}
