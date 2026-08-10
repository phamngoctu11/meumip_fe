import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthStore } from '../../core/auth.store';
import { CartStore } from '../../core/cart.store';
import { FeedbackBanner } from '../../shared/feedback-banner/feedback-banner';

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
  readonly authStore = inject(AuthStore);
  readonly passwordVisible = signal(false);

  readonly loginForm = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  ngOnInit(): void {
    this.authStore.clearError();
    if (this.authStore.user()) {
      void this.router.navigateByUrl('/');
    }
  }

  submit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const { email, password } = this.loginForm.getRawValue();
    this.authStore.login(email.trim(), password).subscribe({
      next: () => {
        this.cartStore.load();
        void this.router.navigateByUrl(this.safeReturnUrl());
      },
      error: () => undefined,
    });
  }

  togglePassword(): void {
    this.passwordVisible.update((visible) => !visible);
  }

  private safeReturnUrl(): string {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    return returnUrl?.startsWith('/') && !returnUrl.startsWith('//') ? returnUrl : '/';
  }
}
