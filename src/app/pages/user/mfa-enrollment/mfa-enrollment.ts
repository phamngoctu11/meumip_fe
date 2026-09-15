import { DOCUMENT } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { renderSVG } from 'uqr';
import { AuthApiService } from '../../../core/auth-api.service';
import { MfaEnrollment } from '../../../core/models';
import { FeedbackBanner } from '../../../shared/feedback-banner/feedback-banner';

type EnrollmentStage = 'email' | 'token' | 'setup' | 'recovery';

@Component({
  selector: 'app-mfa-enrollment',
  imports: [ReactiveFormsModule, RouterLink, FeedbackBanner],
  templateUrl: './mfa-enrollment.html',
  styleUrls: ['../auth-flow.scss', '../login/login.scss', './mfa-enrollment.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MfaEnrollmentPage implements OnInit {
  private readonly document = inject(DOCUMENT);
  private readonly formBuilder = inject(FormBuilder);
  private readonly api = inject(AuthApiService);
  private readonly sanitizer = inject(DomSanitizer);

  readonly stage = signal<EnrollmentStage>('email');
  readonly enrollment = signal<MfaEnrollment | null>(null);
  readonly qrDataUrl = signal<SafeUrl | null>(null);
  readonly recoveryCodes = signal<string[]>([]);
  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);
  readonly success = signal<string | null>(null);
  readonly codeForm = this.formBuilder.nonNullable.group({
    code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
  });
  private token: string | null = null;

  ngOnInit(): void {
    const window = this.document.defaultView;
    if (!window) return;
    this.token = new URLSearchParams(window.location.hash.slice(1)).get('token');
    if (this.token) this.stage.set('token');
    if (window.location.hash) {
      window.history.replaceState(window.history.state, '', `${window.location.pathname}${window.location.search}`);
    }
  }

  requestEnrollmentEmail(): void {
    if (this.submitting()) return;
    this.startRequest();
    this.api
      .requestMfaEnrollmentEmail()
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () =>
          this.success.set(
            'Email thiết lập MFA đã được gửi. Hãy mở liên kết trên chính trình duyệt này trong vòng 5 phút.',
          ),
        error: (error: HttpErrorResponse) => this.error.set(this.errorMessage(error)),
      });
  }

  setup(): void {
    if (!this.token || this.submitting()) return;
    this.startRequest();
    this.api
      .setupMfa(this.token)
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: (enrollment) => {
          this.token = null;
          this.enrollment.set(enrollment);
          this.stage.set('setup');
          this.createQr(enrollment.otpAuthUri);
        },
        error: (error: HttpErrorResponse) => this.error.set(this.errorMessage(error)),
      });
  }

  confirm(): void {
    if (this.codeForm.invalid || this.submitting()) {
      this.codeForm.markAllAsTouched();
      return;
    }
    this.startRequest();
    this.api
      .confirmMfa(this.codeForm.controls.code.value)
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: (codes) => {
          this.enrollment.set(null);
          this.qrDataUrl.set(null);
          this.recoveryCodes.set(codes);
          this.stage.set('recovery');
        },
        error: (error: HttpErrorResponse) => this.error.set(this.errorMessage(error)),
      });
  }

  async copySecret(): Promise<void> {
    const secret = this.enrollment()?.secret;
    if (!secret) return;
    await this.copyText(secret, 'Đã sao chép secret.');
  }

  async copyRecoveryCodes(): Promise<void> {
    await this.copyText(this.recoveryCodes().join('\n'), 'Đã sao chép recovery codes.');
  }

  downloadRecoveryCodes(): void {
    const window = this.document.defaultView;
    if (!window || !this.recoveryCodes().length) return;
    const blob = new Blob([this.recoveryCodes().join('\n') + '\n'], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const anchor = this.document.createElement('a');
    anchor.href = url;
    anchor.download = 'meumip-recovery-codes.txt';
    anchor.click();
    window.URL.revokeObjectURL(url);
  }

  private startRequest(): void {
    this.submitting.set(true);
    this.error.set(null);
    this.success.set(null);
  }

  private createQr(uri: string): void {
    try {
      this.qrDataUrl.set(
        this.sanitizer.bypassSecurityTrustUrl(
          `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(renderSVG(uri, { ecc: 'M', border: 2 }))}`,
        ),
      );
    } catch {
      this.qrDataUrl.set(null);
    }
  }

  private async copyText(value: string, message: string): Promise<void> {
    try {
      const clipboard = this.document.defaultView?.navigator.clipboard;
      if (!clipboard) throw new Error('Clipboard unavailable');
      await clipboard.writeText(value);
      this.error.set(null);
      this.success.set(message);
    } catch {
      this.error.set('Trình duyệt không cho phép sao chép tự động. Vui lòng sao chép thủ công.');
    }
  }

  private errorMessage(error: HttpErrorResponse): string {
    if (error.status === 401) return 'Challenge đã hết hạn. Vui lòng đăng nhập lại.';
    if (error.status === 429) return 'Bạn đã thử quá nhiều lần. Vui lòng chờ rồi thử lại.';
    if (error.status === 503) return 'Backend chưa cấu hình khóa mã hóa MFA.';
    if (error.status === 400) return error.error?.message ?? 'Token hoặc mã xác thực không hợp lệ.';
    return error.error?.message ?? 'Chưa thể hoàn tất thiết lập MFA.';
  }
}
