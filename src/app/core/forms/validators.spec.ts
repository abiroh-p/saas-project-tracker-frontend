import { FormControl } from '@angular/forms';
import { notBlank } from './validators';

describe('notBlank', () => {
  it('flags empty and whitespace-only strings as required', () => {
    expect(notBlank(new FormControl(''))).toEqual({ required: true });
    expect(notBlank(new FormControl('   '))).toEqual({ required: true });
  });

  it('accepts text with surrounding whitespace', () => {
    expect(notBlank(new FormControl(' Jane Doe '))).toBeNull();
  });
});
