import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class StorefrontUiStore {
  readonly voucherOpen = signal(false);
  readonly columns = signal<2 | 3>(this.readColumns());

  setColumns(columns: 2 | 3): void {
    this.columns.set(columns);
    try { localStorage.setItem('meumip-grid-columns', String(columns)); } catch { /* Storage is optional. */ }
  }

  private readColumns(): 2 | 3 {
    try { return localStorage.getItem('meumip-grid-columns') === '3' ? 3 : 2; } catch { return 2; }
  }
}
