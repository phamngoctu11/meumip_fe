import { DOCUMENT } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthStore } from '../../../core/auth.store';
import { CartStore } from '../../../core/cart.store';
import { FeedbackBanner } from '../../../shared/feedback-banner/feedback-banner';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, FeedbackBanner],
  templateUrl: './login.html',
  styleUrl: './login.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPage implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly cartStore = inject(CartStore);
  private readonly document = inject(DOCUMENT);
  readonly authStore = inject(AuthStore);
  readonly passwordVisible = signal(false);
  readonly notice = signal<string | null>(null);

  readonly loginForm = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  ngOnInit(): void {
    this.authStore.clearError();
    const notice = this.document.defaultView?.history.state?.notice;
    if (typeof notice === 'string') this.notice.set(notice);
    const currentUser = this.authStore.user();
    if (currentUser) {
      void this.router.navigateByUrl(this.destinationFor(currentUser.role));
    }
  }

  submit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const { email, password } = this.loginForm.getRawValue();
    this.notice.set(null);
    this.authStore.login(email.trim(), password).subscribe({
      next: (user) => {
        if ('nextStep' in user) {
          const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
          const state = { returnUrl: this.safeReturnUrl(returnUrl) };
          void this.router.navigateByUrl(
            user.nextStep === 'MFA_ENROLLMENT_REQUIRED'
              ? '/auth/mfa-enrollment'
              : '/auth/mfa',
            { state },
          );
          return;
        }
        this.cartStore.load();
        void this.router.navigateByUrl(this.destinationFor(user.role));
      },
      error: (error: HttpErrorResponse) => {
        if (error.status === 403 && error.error?.message === 'EMAIL_VERIFICATION_REQUIRED') {
          void this.router.navigateByUrl('/auth/verify-email', {
            state: { email: email.trim().toLowerCase() },
          });
        }
      },
    });
  }

  togglePassword(): void {
    this.passwordVisible.update((visible) => !visible);
  }

  private destinationFor(role: string): string {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    const safeReturnUrl = this.safeReturnUrl(returnUrl);
    if (safeReturnUrl) return safeReturnUrl;
    return role?.toUpperCase().replace('ROLE_', '') === 'ADMIN' ? '/admin' : '/';
  }

  private safeReturnUrl(returnUrl: string | null): string | null {
    return returnUrl?.startsWith('/') && !returnUrl.startsWith('//') ? returnUrl : null;
  }
}
