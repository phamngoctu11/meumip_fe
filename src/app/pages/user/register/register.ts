import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthApiService } from '../../../core/auth-api.service';
import { FeedbackBanner } from '../../../shared/feedback-banner/feedback-banner';
import {
  fieldsMatch,
  MAX_PASSWORD_BYTES,
  MIN_PASSWORD_LENGTH,
  utf8MaxBytes,
} from '../../../core/password.validators';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink, FeedbackBanner],
  templateUrl: './register.html',
  styleUrl: '../login/login.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterPage {
  private readonly formBuilder = inject(FormBuilder);
  private readonly api = inject(AuthApiService);
  private readonly router = inject(Router);

  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);
  readonly passwordVisible = signal(false);
  readonly registerForm = this.formBuilder.nonNullable.group(
    {
      displayName: ['', [Validators.required, Validators.maxLength(100)]],
      email: ['', [Validators.required, Validators.email]],
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(MIN_PASSWORD_LENGTH),
          utf8MaxBytes(MAX_PASSWORD_BYTES),
        ],
      ],
      confirmPassword: ['', Validators.required],
    },
    { validators: fieldsMatch('password', 'confirmPassword') },
  );

  submit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }
    const { displayName, email, password, confirmPassword } = this.registerForm.getRawValue();
    if (password !== confirmPassword) {
      this.error.set('Mật khẩu xác nhận chưa khớp.');
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    this.submitting.set(true);
    this.error.set(null);
    this.api
      .register({ displayName: displayName.trim(), email: normalizedEmail, password })
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () => {
          void this.router.navigateByUrl('/auth/verify-email', {
            state: { email: normalizedEmail, verificationEmailSent: true },
          });
        },
        error: (error: HttpErrorResponse) =>
          this.error.set(error.error?.message ?? 'Chưa thể tạo tài khoản. Vui lòng thử lại.'),
      });
  }

  togglePassword(): void {
    this.passwordVisible.update((visible) => !visible);
  }
}
