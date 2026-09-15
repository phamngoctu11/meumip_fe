import { FormControl, FormGroup } from '@angular/forms';
import { fieldsMatch, utf8MaxBytes } from './password.validators';

describe('password validators', () => {
  it('counts UTF-8 bytes instead of JavaScript characters', () => {
    const control = new FormControl('á'.repeat(37), { validators: utf8MaxBytes(72) });
    expect(control.hasError('utf8MaxBytes')).toBeTrue();
    control.setValue('a'.repeat(72));
    expect(control.valid).toBeTrue();
  });

  it('requires confirmation to match the password', () => {
    const form = new FormGroup(
      { password: new FormControl('first'), confirmation: new FormControl('second') },
      { validators: fieldsMatch('password', 'confirmation') },
    );
    expect(form.hasError('fieldsMismatch')).toBeTrue();
    form.controls.confirmation.setValue('first');
    expect(form.valid).toBeTrue();
  });
});
