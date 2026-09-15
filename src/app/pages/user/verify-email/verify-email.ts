import { DOCUMENT } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthApiService } from '../../../core/auth-api.service';
import { FeedbackBanner } from '../../../shared/feedback-banner/feedback-banner';

type VerificationState = 'request' | 'ready' | 'verified';

@Component({
  selector: 'app-verify-email',
  imports: [ReactiveFormsModule, RouterLink, FeedbackBanner],
  templateUrl: './verify-email.html',
  styleUrls: ['../auth-flow.scss', '../login/login.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VerifyEmailPage implements OnInit {
  private readonly document = inject(DOCUMENT);
  private readonly formBuilder = inject(FormBuilder);
  private readonly api = inject(AuthApiService);

  readonly state = signal<VerificationState>('request');
  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);
  readonly success = signal<string | null>(null);
  readonly emailForm = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  private token: string | null = null;

  ngOnInit(): void {
    const window = this.document.defaultView;
    if (!window) return;

    const navigationState = window.history.state as {
      email?: unknown;
      verificationEmailSent?: unknown;
    };
    const email = typeof navigationState?.email === 'string' ? navigationState.email : '';
    this.emailForm.controls.email.setValue(email);
    if (navigationState?.verificationEmailSent === true) {
      this.success.set('Email xác thực đã được gửi. Vui lòng kiểm tra hộp thư của bạn.');
    }

    const fragment = new URLSearchParams(window.location.hash.slice(1));
    this.token = fragment.get('token');
    if (this.token) {
      this.state.set('ready');
      this.success.set(null);
    }

    if (window.location.hash) {
      window.history.replaceState(
        window.history.state,
        '',
        `${window.location.pathname}${window.location.search}`,
      );
    }
  }

  confirmVerification(): void {
    if (!this.token || this.submitting()) return;

    this.submitting.set(true);
    this.error.set(null);
    this.api
      .verifyEmail(this.token)
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () => {
          this.token = null;
          this.state.set('verified');
          this.success.set('Email đã được xác thực. Bạn có thể đăng nhập lại ngay bây giờ.');
        },
        error: (error: HttpErrorResponse) => this.error.set(this.errorMessage(error)),
      });
  }

  requestEmail(): void {
    if (this.emailForm.invalid || this.submitting()) {
      this.emailForm.markAllAsTouched();
      return;
    }

    const email = this.emailForm.controls.email.value.trim().toLowerCase();
    this.submitting.set(true);
    this.error.set(null);
    this.success.set(null);
    this.api
      .requestVerificationEmail(email)
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () =>
          this.success.set(
            'Nếu tài khoản cần xác thực, email hướng dẫn sẽ được gửi. Vui lòng kiểm tra cả thư rác.',
          ),
        error: (error: HttpErrorResponse) => this.error.set(this.errorMessage(error)),
      });
  }

  showRequestForm(): void {
    this.token = null;
    this.state.set('request');
    this.error.set(null);
    this.success.set(null);
  }

  private errorMessage(error: HttpErrorResponse): string {
    if (error.status === 400) return 'Liên kết không hợp lệ, đã hết hạn hoặc đã được sử dụng.';
    if (error.status === 429) return 'Bạn đã thử quá nhiều lần. Vui lòng chờ một lúc rồi thử lại.';
    return error.error?.message ?? 'Chưa thể xác thực email. Vui lòng thử lại.';
  }
}
