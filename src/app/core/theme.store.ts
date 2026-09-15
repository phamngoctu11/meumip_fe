import { DOCUMENT } from '@angular/common';
import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { AuthStore } from './auth.store';

export type ThemeId = 'rose' | 'sage' | 'sky' | 'lavender' | 'peach';

export interface ThemeOption {
  id: ThemeId;
  label: string;
  description: string;
  swatches: readonly [string, string, string];
}

const DEFAULT_THEME: ThemeId = 'rose';
const GUEST_THEME_KEY = 'meumip:theme:guest';

export const THEME_OPTIONS: readonly ThemeOption[] = [
  {
    id: 'rose',
    label: 'Hồng dâu',
    description: 'Ấm áp và ngọt ngào',
    swatches: ['#fffaf6', '#fbe7f0', '#df78aa'],
  },
  {
    id: 'sage',
    label: 'Xanh lá',
    description: 'Dịu mắt và tự nhiên',
    swatches: ['#f8fbf5', '#e5f2e7', '#6c9f78'],
  },
  {
    id: 'sky',
    label: 'Xanh trời',
    description: 'Trong trẻo và nhẹ nhàng',
    swatches: ['#f6fbfe', '#e3f3fc', '#579dca'],
  },
  {
    id: 'lavender',
    label: 'Tím lavender',
    description: 'Mơ màng và thư thái',
    swatches: ['#fbf9fd', '#f0eafa', '#9272b5'],
  },
  {
    id: 'peach',
    label: 'Cam đào',
    description: 'Tươi sáng và ấm áp',
    swatches: ['#fffaf5', '#ffecdf', '#db8a5b'],
  },
] as const;

const THEME_IDS = new Set<ThemeId>(THEME_OPTIONS.map((theme) => theme.id));

@Injectable({ providedIn: 'root' })
export class ThemeStore {
  private readonly document = inject(DOCUMENT);
  private readonly authStore = inject(AuthStore);
  private readonly committedTheme = signal<ThemeId>(DEFAULT_THEME);
  private readonly draftTheme = signal<ThemeId | null>(null);
  private readonly hoveredTheme = signal<ThemeId | null>(null);
  private storageKey = GUEST_THEME_KEY;
  private activeOwnerKey: string | null = null;

  readonly options = THEME_OPTIONS;
  readonly pickerOpen = signal(false);
  readonly selectedTheme = computed(() => this.draftTheme() ?? this.committedTheme());
  readonly displayedTheme = computed(
    () => this.hoveredTheme() ?? this.draftTheme() ?? this.committedTheme(),
  );

  constructor() {
    effect(() => {
      if (this.authStore.checkingSession()) return;
      const userId = this.authStore.user()?.id ?? null;
      this.useOwner(userId);
    });

    effect(() => {
      this.document.documentElement.dataset['theme'] = this.displayedTheme();
    });
  }

  openPicker(): void {
    this.draftTheme.set(this.committedTheme());
    this.hoveredTheme.set(null);
    this.pickerOpen.set(true);
  }

  preview(theme: ThemeId): void {
    if (THEME_IDS.has(theme)) this.hoveredTheme.set(theme);
  }

  clearPreview(): void {
    this.hoveredTheme.set(null);
  }

  select(theme: ThemeId): void {
    if (!THEME_IDS.has(theme)) return;
    this.draftTheme.set(theme);
    this.hoveredTheme.set(null);
  }

  cancel(): void {
    this.draftTheme.set(null);
    this.hoveredTheme.set(null);
    this.pickerOpen.set(false);
  }

  confirm(): void {
    const theme = this.draftTheme() ?? this.committedTheme();
    this.committedTheme.set(theme);
    this.writeStoredTheme(theme);
    this.draftTheme.set(null);
    this.hoveredTheme.set(null);
    this.pickerOpen.set(false);
  }

  private useOwner(userId: number | null): void {
    const nextKey = userId === null ? GUEST_THEME_KEY : `meumip:theme:user:${userId}`;
    if (this.activeOwnerKey === nextKey) return;
    this.activeOwnerKey = nextKey;
    this.storageKey = nextKey;
    this.committedTheme.set(this.readStoredTheme(nextKey));
    this.draftTheme.set(null);
    this.hoveredTheme.set(null);
    this.pickerOpen.set(false);
  }

  private readStoredTheme(key: string): ThemeId {
    try {
      const value = this.document.defaultView?.localStorage.getItem(key);
      return value && THEME_IDS.has(value as ThemeId) ? (value as ThemeId) : DEFAULT_THEME;
    } catch {
      return DEFAULT_THEME;
    }
  }

  private writeStoredTheme(theme: ThemeId): void {
    try {
      this.document.defaultView?.localStorage.setItem(this.storageKey, theme);
    } catch {
      // The confirmed theme still applies for this tab when browser storage is unavailable.
    }
  }
}
