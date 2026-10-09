/**
 * Runtime configuration.
 *
 * `apiUrl` is a same-origin path. In development `ng serve` proxies `/api` to the Django
 * backend (see proxy.conf.json), so no CORS configuration is needed. In production serve the
 * built app and the API from the same origin (reverse proxy), or change this value.
 */
export const environment = {
  apiUrl: '/api/v1',
};
