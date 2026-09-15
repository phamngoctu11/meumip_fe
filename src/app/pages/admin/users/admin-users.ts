import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AdminApiService } from '../../../core/admin-api.service';
import { AuthStore } from '../../../core/auth.store';
import { UserAccessRequest, UserRole, UserStatus } from '../../../core/models';
import { FeedbackBanner } from '../../../shared/feedback-banner/feedback-banner';

@Component({
  selector: 'app-admin-users',
  imports: [ReactiveFormsModule, FeedbackBanner],
  templateUrl: './admin-users.html',
  styleUrl: './admin-users.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminUsersPage {
  private readonly formBuilder = inject(FormBuilder);
  private readonly api = inject(AdminApiService);
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);

  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);
  readonly success = signal<string | null>(null);
  readonly form = this.formBuilder.nonNullable.group({
    userId: [1, [Validators.required, Validators.min(1), Validators.pattern(/^\d+$/)]],
    role: ['' as UserRole | ''],
    status: ['' as UserStatus | ''],
  });

  submit(): void {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }
    const { userId, role, status } = this.form.getRawValue();
    const request: UserAccessRequest = {};
    if (role) request.role = role;
    if (status) request.status = status;
    if (!request.role && !request.status) {
      this.error.set('Hãy chọn ít nhất một thay đổi về quyền hoặc trạng thái.');
      return;
    }

    this.submitting.set(true);
    this.error.set(null);
    this.success.set(null);
    this.api
      .updateUserAccess(userId, request)
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () => {
          if (this.authStore.user()?.id === userId) {
            this.authStore.clearLocalSession();
            void this.router.navigateByUrl('/login', {
              state: { notice: 'Quyền tài khoản hiện tại đã thay đổi. Vui lòng đăng nhập lại.' },
            });
            return;
          }
          this.success.set(`Đã cập nhật tài khoản #${userId}; các phiên cũ đã bị thu hồi.`);
        },
        error: (error: HttpErrorResponse) =>
          this.error.set(
            error.status === 409
              ? 'Tài khoản vừa được cập nhật ở nơi khác. Hãy đăng nhập lại và thử lại.'
              : (error.error?.message ?? 'Chưa thể cập nhật tài khoản.'),
          ),
      });
  }
}
