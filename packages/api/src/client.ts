import ky, { type KyInstance } from 'ky';

// Building ky lazily — and proxying access — sidesteps the captured-prefix-URL
// trap. The old shape built ky at module load time, before configureApiClient
// ever ran, so the prefix was frozen to undefined and every request fell back
// to window.location.origin. Now: createApiClient builds the real instance,
// configureApiClient installs it, and the exported apiClient is a Proxy whose
// every property access forwards to the singleton.
//
// TaxLens v1 is stateless and has no accounts, so there is no auth header and
// no token-refresh interceptor — just a configured base URL.

let _client: KyInstance | null = null;
let _baseUrl: string | null = null;

export function createApiClient(baseUrl: string): KyInstance {
  if (!baseUrl) {
    throw new Error('createApiClient: baseUrl is required');
  }
  const prefixUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;

  return ky.create({
    prefixUrl,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function configureApiClient(baseUrl: string): void {
  _baseUrl = baseUrl;
  _client = createApiClient(baseUrl);
}

export const apiClient: KyInstance = new Proxy({} as KyInstance, {
  get(_target, prop) {
    if (!_client) {
      throw new Error(
        'apiClient used before configureApiClient was called. Call configureApiClient(baseUrl) at app boot.',
      );
    }
    return Reflect.get(_client, prop, _client);
  },
});

export function _currentApiBaseUrl(): string | null {
  return _baseUrl;
}
