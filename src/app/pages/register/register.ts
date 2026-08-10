import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize, switchMap } from 'rxjs';
import { AuthApiService } from '../../core/auth-api.service';
import { AuthStore } from '../../core/auth.store';
import { CartStore } from '../../core/cart.store';
import { FeedbackBanner } from '../../shared/feedback-banner/feedback-banner';

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
  private readonly authStore = inject(AuthStore);
  private readonly cartStore = inject(CartStore);
  private readonly router = inject(Router);

  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);
  readonly passwordVisible = signal(false);
  readonly registerForm = this.formBuilder.nonNullable.group({
    displayName: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(100)]],
    confirmPassword: ['', Validators.required],
  });

  submit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }
    const { displayName, email, password, confirmPassword } = this.registerForm.getRawValue();
    if (password !== confirmPassword) {
      this.error.set('Mật khẩu xác nhận chưa khớp.');
      this.registerForm.controls.confirmPassword.setErrors({ mismatch: true });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    this.submitting.set(true);
    this.error.set(null);
    this.api
      .register({ displayName: displayName.trim(), email: normalizedEmail, password })
      .pipe(
        switchMap(() => this.authStore.login(normalizedEmail, password)),
        finalize(() => this.submitting.set(false)),
      )
      .subscribe({
        next: () => {
          this.cartStore.load();
          void this.router.navigateByUrl('/orders');
        },
        error: (error: HttpErrorResponse) =>
          this.error.set(error.error?.message ?? 'Chưa thể tạo tài khoản. Vui lòng thử lại.'),
      });
  }

  togglePassword(): void {
    this.passwordVisible.update((visible) => !visible);
  }
}
