import { initialsOf } from './initials';

describe('initialsOf', () => {
  it.each([
    ['John Doe', 'JD'],
    ['sam', 'S'],
    ['  anna   maria   lopez  ', 'AL'],
    ['élodie dupont', 'ÉD'],
    ['', '?'],
    ['   ', '?'],
  ])('%j → %s', (name, expected) => {
    expect(initialsOf(name)).toBe(expected);
  });
});
