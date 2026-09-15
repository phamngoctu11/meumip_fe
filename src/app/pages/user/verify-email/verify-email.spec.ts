import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AuthApiService } from '../../../core/auth-api.service';
import { VerifyEmailPage } from './verify-email';

describe('VerifyEmailPage', () => {
  let api: jasmine.SpyObj<AuthApiService>;

  beforeEach(async () => {
    api = jasmine.createSpyObj<AuthApiService>('AuthApiService', [
      'verifyEmail',
      'requestVerificationEmail',
    ]);
    api.verifyEmail.and.returnValue(of('Email verified'));
    api.requestVerificationEmail.and.returnValue(of('Email sent'));

    await TestBed.configureTestingModule({
      imports: [VerifyEmailPage],
      providers: [{ provide: AuthApiService, useValue: api }, provideRouter([])],
    }).compileComponents();
  });

  afterEach(() => window.history.replaceState({}, '', '/'));

  it('keeps the fragment token in memory and waits for confirmation before using it', () => {
    window.history.replaceState({}, '', '/auth/verify-email#token=one-time-token');

    const fixture = TestBed.createComponent(VerifyEmailPage);
    fixture.detectChanges();

    expect(window.location.hash).toBe('');
    expect(fixture.componentInstance.state()).toBe('ready');
    expect(api.verifyEmail).not.toHaveBeenCalled();

    fixture.componentInstance.confirmVerification();

    expect(api.verifyEmail).toHaveBeenCalledOnceWith('one-time-token');
    expect(fixture.componentInstance.state()).toBe('verified');
  });
});
