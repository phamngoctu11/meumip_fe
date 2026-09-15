import { DOCUMENT } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthApiService } from '../../../core/auth-api.service';
import { AuthStore } from '../../../core/auth.store';
import {
  fieldsMatch,
  MAX_PASSWORD_BYTES,
  MIN_PASSWORD_LENGTH,
  utf8MaxBytes,
} from '../../../core/password.validators';
import { FeedbackBanner } from '../../../shared/feedback-banner/feedback-banner';

@Component({
  selector: 'app-reset-password',
  imports: [ReactiveFormsModule, RouterLink, FeedbackBanner],
  templateUrl: './reset-password.html',
  styleUrls: ['../auth-flow.scss', '../login/login.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResetPasswordPage implements OnInit {
  private readonly document = inject(DOCUMENT);
  private readonly formBuilder = inject(FormBuilder);
  private readonly api = inject(AuthApiService);
  private readonly authStore = inject(AuthStore);

  readonly hasToken = signal(false);
  readonly completed = signal(false);
  readonly submitting = signal(false);
  readonly passwordVisible = signal(false);
  readonly error = signal<string | null>(null);
  readonly form = this.formBuilder.nonNullable.group(
    {
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
  private token: string | null = null;

  ngOnInit(): void {
    const window = this.document.defaultView;
    if (!window) return;
    this.token = new URLSearchParams(window.location.hash.slice(1)).get('token');
    this.hasToken.set(Boolean(this.token));
    if (window.location.hash) {
      window.history.replaceState(window.history.state, '', `${window.location.pathname}${window.location.search}`);
    }
  }

  submit(): void {
    if (!this.token || this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }
    const { password, confirmPassword } = this.form.getRawValue();
    if (password !== confirmPassword) return;

    this.submitting.set(true);
    this.error.set(null);
    this.api
      .resetPassword(this.token, password)
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () => {
          this.token = null;
          this.authStore.clearLocalSession();
          this.completed.set(true);
        },
        error: (error: HttpErrorResponse) =>
          this.error.set(
            error.status === 400
              ? 'Liên kết không hợp lệ, đã hết hạn hoặc đã được sử dụng.'
              : (error.error?.message ?? 'Chưa thể đổi mật khẩu. Vui lòng thử lại.'),
          ),
      });
  }

  togglePassword(): void {
    this.passwordVisible.update((visible) => !visible);
  }
}
