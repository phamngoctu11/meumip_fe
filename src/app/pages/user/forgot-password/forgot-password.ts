import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthApiService } from '../../../core/auth-api.service';
import { FeedbackBanner } from '../../../shared/feedback-banner/feedback-banner';

@Component({
  selector: 'app-forgot-password',
  imports: [ReactiveFormsModule, RouterLink, FeedbackBanner],
  templateUrl: './forgot-password.html',
  styleUrls: ['../auth-flow.scss', '../login/login.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForgotPasswordPage {
  private readonly formBuilder = inject(FormBuilder);
  private readonly api = inject(AuthApiService);

  readonly submitting = signal(false);
  readonly sent = signal(false);
  readonly error = signal<string | null>(null);
  readonly form = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  submit(): void {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.error.set(null);
    this.api
      .requestPasswordReset(this.form.controls.email.value.trim().toLowerCase())
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () => this.sent.set(true),
        error: (error: HttpErrorResponse) =>
          this.error.set(
            error.status === 429
              ? 'Bạn đã yêu cầu quá nhiều lần. Vui lòng chờ rồi thử lại.'
              : (error.error?.message ?? 'Chưa thể gửi email. Vui lòng thử lại.'),
          ),
      });
  }
}
