import { DOCUMENT } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthApiService } from '../../../core/auth-api.service';
import { AuthStore } from '../../../core/auth.store';
import { FeedbackBanner } from '../../../shared/feedback-banner/feedback-banner';

@Component({
  selector: 'app-admin-security',
  imports: [ReactiveFormsModule, FeedbackBanner],
  templateUrl: './admin-security.html',
  styleUrl: './admin-security.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminSecurityPage {
  private readonly document = inject(DOCUMENT);
  private readonly formBuilder = inject(FormBuilder);
  private readonly api = inject(AuthApiService);
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);

  readonly submitting = signal(false);
  readonly loggingOutAll = signal(false);
  readonly error = signal<string | null>(null);
  readonly passwordVisible = signal(false);
  readonly form = this.formBuilder.nonNullable.group({
    password: ['', [Validators.required, Validators.maxLength(100)]],
    code: ['', [Validators.required, Validators.maxLength(100)]],
  });

  resetMfa(): void {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }
    const confirmed = this.document.defaultView?.confirm(
      'Reset MFA sẽ đăng xuất tất cả phiên và yêu cầu thiết lập Authenticator lại. Tiếp tục?',
    );
    if (!confirmed) return;

    const { password, code } = this.form.getRawValue();
    this.submitting.set(true);
    this.error.set(null);
    this.api
      .resetMfa(password, code.trim())
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () => this.finishSession('MFA đã được reset. Hãy đăng nhập để thiết lập lại.'),
        error: (error: HttpErrorResponse) =>
          this.error.set(
            error.status === 401
              ? 'Mật khẩu hoặc mã xác thực không đúng/đã được sử dụng.'
              : (error.error?.message ?? 'Chưa thể reset MFA.'),
          ),
      });
  }

  logoutAll(): void {
    if (this.loggingOutAll()) return;
    const confirmed = this.document.defaultView?.confirm(
      'Bạn sẽ đăng xuất khỏi tất cả thiết bị. Tiếp tục?',
    );
    if (!confirmed) return;

    this.loggingOutAll.set(true);
    this.error.set(null);
    this.api
      .logoutAll()
      .pipe(finalize(() => this.loggingOutAll.set(false)))
      .subscribe({
        next: () => this.finishSession('Đã đăng xuất khỏi tất cả thiết bị.'),
        error: (error: HttpErrorResponse) =>
          this.error.set(error.error?.message ?? 'Chưa thể đăng xuất tất cả phiên.'),
      });
  }

  togglePassword(): void {
    this.passwordVisible.update((visible) => !visible);
  }

  private finishSession(notice: string): void {
    this.authStore.clearLocalSession();
    void this.router.navigateByUrl('/login', { state: { notice } });
  }
}
