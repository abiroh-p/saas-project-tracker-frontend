import { FormControl } from '@angular/forms';
import { PROJECT_KEY_PATTERN, projectKeyValidator, suggestProjectKey } from './project-key';

describe('suggestProjectKey', () => {
  it.each([
    ['Website Redesign', 'WR'],
    ['Mobile App', 'MA'],
    ['Mobile', 'MOBI'],
    ['api', 'API'],
    ['Customer Support Portal Rewrite Phase Two', 'CSPRP'],
    ['  data   platform  ', 'DP'],
    ['Q4 Roadmap', 'QR'],
    ['E-commerce Platform', 'ECP'],
    ['2026 Planning', 'PLAN'], // words that start with a digit are skipped
    ['x', ''],
    ['', ''],
    ['!!!', ''],
    ['2026', ''],
  ])('%j → %j', (name, expected) => {
    expect(suggestProjectKey(name)).toBe(expected);
  });

  it('always produces a valid key or an empty string', () => {
    for (const name of ['Website Redesign', 'Mobile', 'A B C D E F G', 'Zed 9', 'ünïcode names']) {
      const key = suggestProjectKey(name);
      expect(key === '' || PROJECT_KEY_PATTERN.test(key)).toBe(true);
    }
  });
});

describe('projectKeyValidator', () => {
  const check = (value: string) => projectKeyValidator(new FormControl(value));

  it.each(['WR', 'wr', 'DEMO', 'A1', 'ABCDEFGHIJ'])('accepts %s', (value) => {
    expect(check(value)).toBeNull();
  });

  it.each(['A', '1AB', 'AB CD', 'AB-CD', 'ABCDEFGHIJK', 'a_b'])(
    'rejects %s with a message',
    (value) => {
      expect(check(value)).toEqual({
        message: 'Use 2 to 10 letters or digits, starting with a letter.',
      });
    },
  );

  it('leaves emptiness to the required validator', () => {
    expect(check('')).toBeNull();
  });
});
