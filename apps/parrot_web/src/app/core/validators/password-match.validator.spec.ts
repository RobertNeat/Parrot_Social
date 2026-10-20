import { FormBuilder } from '@angular/forms';
import { passwordMatchValidator } from './password-match.validator';

describe('passwordMatchValidator', () => {
  const fb = new FormBuilder();

  it('returns no error when passwords match', () => {
    const group = fb.group(
      { password: ['secret'], confirmPassword: ['secret'] },
      { validators: passwordMatchValidator('password', 'confirmPassword') },
    );
    expect(group.errors).toBeNull();
  });

  it('flags a mismatch', () => {
    const group = fb.group(
      { password: ['secret'], confirmPassword: ['other'] },
      { validators: passwordMatchValidator('password', 'confirmPassword') },
    );
    expect(group.errors).toEqual({ passwordMismatch: true });
  });

  it('does not flag while either field is empty', () => {
    const group = fb.group(
      { password: ['secret'], confirmPassword: [''] },
      { validators: passwordMatchValidator('password', 'confirmPassword') },
    );
    expect(group.errors).toBeNull();
  });
});
