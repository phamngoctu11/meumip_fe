import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AuthStore } from './auth.store';
import { ShopUser } from './models';
import { ThemeStore } from './theme.store';

describe('ThemeStore', () => {
  let authStore: AuthStore;
  let themeStore: ThemeStore;

  const user: ShopUser = {
    id: 42,
    email: 'member@example.com',
    displayName: 'Member',
    avatarUrl: null,
    role: 'CUSTOMER',
  };

  beforeEach(() => {
    localStorage.removeItem('meumip:theme:guest');
    localStorage.removeItem('meumip:theme:user:42');
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    authStore = TestBed.inject(AuthStore);
    themeStore = TestBed.inject(ThemeStore);
    authStore.checkingSession.set(false);
    TestBed.flushEffects();
  });

  afterEach(() => {
    localStorage.removeItem('meumip:theme:guest');
    localStorage.removeItem('meumip:theme:user:42');
    document.documentElement.removeAttribute('data-theme');
  });

  it('previews a color without saving it and restores the committed color on cancel', () => {
    themeStore.openPicker();
    themeStore.preview('sage');
    TestBed.flushEffects();

    expect(themeStore.displayedTheme()).toBe('sage');
    expect(document.documentElement.dataset['theme']).toBe('sage');
    expect(localStorage.getItem('meumip:theme:guest')).toBeNull();

    themeStore.cancel();
    TestBed.flushEffects();

    expect(themeStore.displayedTheme()).toBe('rose');
    expect(document.documentElement.dataset['theme']).toBe('rose');
  });

  it('persists only the confirmed color for the current owner', () => {
    themeStore.openPicker();
    themeStore.select('lavender');
    themeStore.confirm();

    expect(localStorage.getItem('meumip:theme:guest')).toBe('lavender');

    authStore.user.set(user);
    TestBed.flushEffects();
    expect(themeStore.displayedTheme()).toBe('rose');

    themeStore.openPicker();
    themeStore.select('sage');
    themeStore.confirm();
    expect(localStorage.getItem('meumip:theme:user:42')).toBe('sage');
    expect(localStorage.getItem('meumip:theme:guest')).toBe('lavender');

    authStore.user.set(null);
    TestBed.flushEffects();
    expect(themeStore.displayedTheme()).toBe('lavender');
  });
});
