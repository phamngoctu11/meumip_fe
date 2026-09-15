import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AuthApiService } from '../../../core/auth-api.service';
import { MfaEnrollmentPage } from './mfa-enrollment';

describe('MfaEnrollmentPage', () => {
  let api: jasmine.SpyObj<AuthApiService>;

  beforeEach(async () => {
    api = jasmine.createSpyObj<AuthApiService>('AuthApiService', [
      'requestMfaEnrollmentEmail',
      'setupMfa',
      'confirmMfa',
    ]);
    api.requestMfaEnrollmentEmail.and.returnValue(of('Sent'));
    api.setupMfa.and.returnValue(of({ secret: 'SECRET', otpAuthUri: 'otpauth://totp/test' }));
    api.confirmMfa.and.returnValue(of(['recovery-code']));
    await TestBed.configureTestingModule({
      imports: [MfaEnrollmentPage],
      providers: [{ provide: AuthApiService, useValue: api }, provideRouter([])],
    }).compileComponents();
  });

  afterEach(() => window.history.replaceState({}, '', '/'));

  it('removes the fragment and waits for a user action before consuming the token', () => {
    window.history.replaceState({}, '', '/auth/mfa-enrollment#token=mfa-email-token');
    const fixture = TestBed.createComponent(MfaEnrollmentPage);
    fixture.detectChanges();

    expect(window.location.hash).toBe('');
    expect(fixture.componentInstance.stage()).toBe('token');
    expect(api.setupMfa).not.toHaveBeenCalled();

    fixture.componentInstance.setup();
    expect(api.setupMfa).toHaveBeenCalledOnceWith('mfa-email-token');
    expect(fixture.componentInstance.stage()).toBe('setup');
  });
});
