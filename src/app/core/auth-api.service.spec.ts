import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AuthApiService } from './auth-api.service';
import { API_BASE_URL } from './api.config';
import { csrfInterceptor } from './csrf.interceptor';

describe('AuthApiService', () => {
  let service: AuthApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AuthApiService,
        provideHttpClient(withInterceptors([csrfInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(AuthApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('gets a fresh CSRF token before confirming an email token', () => {
    let result = '';
    service.verifyEmail('email-token').subscribe((message) => (result = message));

    const csrfRequest = http.expectOne(`${API_BASE_URL}/auth/csrf`);
    expect(csrfRequest.request.method).toBe('GET');
    expect(csrfRequest.request.withCredentials).toBeTrue();
    csrfRequest.flush({
      success: true,
      status: 200,
      message: 'OK',
      data: { headerName: 'X-CSRF-TOKEN', token: 'csrf-token' },
    });

    const verifyRequest = http.expectOne(`${API_BASE_URL}/auth/verify-email`);
    expect(verifyRequest.request.method).toBe('POST');
    expect(verifyRequest.request.withCredentials).toBeTrue();
    expect(verifyRequest.request.headers.get('X-CSRF-TOKEN')).toBe('csrf-token');
    expect(verifyRequest.request.body).toEqual({ token: 'email-token' });
    verifyRequest.flush({
      success: true,
      status: 200,
      message: 'Email verified. Please sign in.',
      data: null,
    });

    expect(result).toBe('Email verified. Please sign in.');
  });

  it('reuses the CSRF token for writes that do not rotate the session', () => {
    service.requestVerificationEmail('admin@example.com').subscribe();
    http.expectOne(`${API_BASE_URL}/auth/csrf`).flush({
      success: true,
      status: 200,
      message: 'OK',
      data: { headerName: 'X-CSRF-TOKEN', token: 'session-token' },
    });
    const verificationEmail = http.expectOne(`${API_BASE_URL}/auth/verification-email`);
    expect(verificationEmail.request.headers.get('X-CSRF-TOKEN')).toBe('session-token');
    verificationEmail.flush({ success: true, status: 200, message: 'Sent', data: null });

    service.requestPasswordReset('admin@example.com').subscribe();
    http.expectNone(`${API_BASE_URL}/auth/csrf`);
    const passwordEmail = http.expectOne(`${API_BASE_URL}/auth/forgot-password`);
    expect(passwordEmail.request.headers.get('X-CSRF-TOKEN')).toBe('session-token');
    passwordEmail.flush({ success: true, status: 200, message: 'Sent', data: null });
  });

  it('invalidates the cached CSRF token after the password login step', () => {
    service.login({ email: 'admin@example.com', password: 'strong-password' }).subscribe();
    http.expectOne(`${API_BASE_URL}/auth/csrf`).flush({
      success: true,
      status: 200,
      message: 'OK',
      data: { headerName: 'X-CSRF-TOKEN', token: 'before-login' },
    });
    const login = http.expectOne(`${API_BASE_URL}/auth/login`);
    expect(login.request.headers.get('X-CSRF-TOKEN')).toBe('before-login');
    login.flush({
      success: true,
      status: 200,
      message: 'OK',
      data: { nextStep: 'MFA_ENROLLMENT_REQUIRED' },
    });

    service.requestMfaEnrollmentEmail().subscribe();
    const refreshedCsrf = http.expectOne(`${API_BASE_URL}/auth/csrf`);
    refreshedCsrf.flush({
      success: true,
      status: 200,
      message: 'OK',
      data: { headerName: 'X-CSRF-TOKEN', token: 'after-login' },
    });
    const enrollmentEmail = http.expectOne(`${API_BASE_URL}/auth/mfa/enrollment-email`);
    expect(enrollmentEmail.request.headers.get('X-CSRF-TOKEN')).toBe('after-login');
    enrollmentEmail.flush({ success: true, status: 200, message: 'Sent', data: null });
  });
});
