import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export const MAX_PASSWORD_BYTES = 72;
export const MIN_PASSWORD_LENGTH = 12;

export const utf8MaxBytes = (maximum: number): ValidatorFn =>
  (control: AbstractControl<string>): ValidationErrors | null => {
    const value = control.value ?? '';
    return new TextEncoder().encode(value).length <= maximum
      ? null
      : { utf8MaxBytes: { maximum } };
  };

export const fieldsMatch = (firstName: string, secondName: string): ValidatorFn =>
  (control: AbstractControl): ValidationErrors | null =>
    control.get(firstName)?.value === control.get(secondName)?.value
      ? null
      : { fieldsMismatch: true };
