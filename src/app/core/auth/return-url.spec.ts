import { safeReturnUrl } from './return-url';

describe('safeReturnUrl', () => {
  it('accepts internal paths', () => {
    expect(safeReturnUrl('/projects/12?tab=issues')).toBe('/projects/12?tab=issues');
  });

  it.each([
    'https://evil.example',
    '//evil.example',
    'javascript:alert(1)',
    '/\\evil.example',
    '',
    undefined,
    null,
    42,
  ])('rejects %s', (value) => {
    expect(safeReturnUrl(value)).toBe('/dashboard');
  });

  it('uses a custom fallback', () => {
    expect(safeReturnUrl('//x', '/home')).toBe('/home');
  });
});
