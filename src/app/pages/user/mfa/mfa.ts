import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthStore } from '../../../core/auth.store';
import { CartStore } from '../../../core/cart.store';
import { FeedbackBanner } from '../../../shared/feedback-banner/feedback-banner';

@Component({
  selector: 'app-mfa',
  imports: [ReactiveFormsModule, RouterLink, FeedbackBanner],
  templateUrl: './mfa.html',
  styleUrls: ['../auth-flow.scss', '../login/login.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MfaPage implements OnInit {
  private readonly document = inject(DOCUMENT);
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly cartStore = inject(CartStore);
  readonly authStore = inject(AuthStore);
  readonly form = this.formBuilder.nonNullable.group({
    code: ['', [Validators.required, Validators.maxLength(100)]],
  });
  private returnUrl: string | null = null;

  ngOnInit(): void {
    this.authStore.clearError();
    const candidate = this.document.defaultView?.history.state?.returnUrl;
    this.returnUrl = this.safeReturnUrl(typeof candidate === 'string' ? candidate : null);
  }

  submit(): void {
    if (this.form.invalid || this.authStore.submitting()) {
      this.form.markAllAsTouched();
      return;
    }
    this.authStore.verifyMfa(this.form.controls.code.value.trim()).subscribe({
      next: (user) => {
        this.cartStore.load();
        void this.router.navigateByUrl(this.returnUrl ?? (this.isAdmin(user.role) ? '/admin' : '/'));
      },
      error: () => undefined,
    });
  }

  private safeReturnUrl(value: string | null): string | null {
    return value?.startsWith('/') && !value.startsWith('//') ? value : null;
  }

  private isAdmin(role: string): boolean {
    return role.toUpperCase().replace('ROLE_', '') === 'ADMIN';
  }
}
