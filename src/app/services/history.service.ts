import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

import { HistoryEntry, RiskLevel } from '../models/triage.models';

const STORAGE_KEY = 'medflow-ai-history';
const STORAGE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

interface HistoryStoragePayload {
  version: 1;
  savedAt: string;
  entries: HistoryEntry[];
}

@Injectable({ providedIn: 'root' })
export class HistoryService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly entriesSignal = signal<HistoryEntry[]>([]);

  readonly entries = computed(() => this.entriesSignal());
  readonly total = computed(() => this.entriesSignal().length);

  constructor() {
    this.load();
  }

  private load(): void {
    if (!this.isBrowser) {
      return;
    }

    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      this.entriesSignal.set([]);
      return;
    }

    try {
      const parsed = JSON.parse(raw) as HistoryEntry[] | HistoryStoragePayload;
      const entries = this.normalizeEntries(parsed);
      this.persist(entries);
    } catch {
      this.entriesSignal.set([]);
    }
  }

  private persist(entries: HistoryEntry[]): void {
    this.entriesSignal.set(entries);
    if (this.isBrowser) {
      const payload: HistoryStoragePayload = {
        version: 1,
        savedAt: new Date().toISOString(),
        entries
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    }
  }

  private normalizeEntries(payload: HistoryEntry[] | HistoryStoragePayload): HistoryEntry[] {
    const rawEntries = Array.isArray(payload) ? payload : payload.entries;
    const now = Date.now();

    return rawEntries.filter((entry) => {
      const createdAt = new Date(entry.createdAt).getTime();
      return Number.isFinite(createdAt) && now - createdAt <= STORAGE_TTL_MS;
    });
  }

  save(entry: HistoryEntry): void {
    const next = [entry, ...this.entriesSignal()].slice(0, 30);
    this.persist(next);
  }

  clear(): void {
    this.persist([]);
  }

  latest(): HistoryEntry | null {
    return this.entriesSignal()[0] ?? null;
  }

  filterByRisk(level: RiskLevel | 'TODOS'): HistoryEntry[] {
    if (level === 'TODOS') {
      return this.entriesSignal();
    }

    return this.entriesSignal().filter((entry) => entry.result.level === level);
  }
}
