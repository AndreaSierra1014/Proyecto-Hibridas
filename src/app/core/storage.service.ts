import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

/** Almacenamiento local clave-valor (RF-12). Usa Preferences de Capacitor. */
@Injectable({ providedIn: 'root' })
export class StorageService {
  async get<T>(key: string, fallback: T): Promise<T> {
    const { value } = await Preferences.get({ key });
    if (value === null) return fallback;
    try { return JSON.parse(value) as T; } catch { return fallback; }
  }
  async set(key: string, value: unknown): Promise<void> {
    await Preferences.set({ key, value: JSON.stringify(value) });
  }
  async remove(key: string): Promise<void> { await Preferences.remove({ key }); }
}
