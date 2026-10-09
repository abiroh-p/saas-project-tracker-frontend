import { InjectionToken } from '@angular/core';
import { environment } from '../../../environments/environment';

/** Base URL of the REST API, e.g. `/api/v1`. Override in tests via `{ provide: API_BASE_URL, ... }`. */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: () => environment.apiUrl,
});
