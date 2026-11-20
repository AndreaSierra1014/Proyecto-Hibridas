import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { API_URL } from './config';
import { StorageService } from './storage.service';
import { User } from './models';

interface AuthResponse { token: string; user: User; }

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private storage = inject(StorageService);

  readonly user = signal<User | null>(null);
  readonly isAdmin = computed(() => this.user()?.role === 'admin');
  token: string | null = null;
  /** Se resuelve cuando se terminó de leer la sesión guardada. */
  readonly ready: Promise<void>;

  constructor() { this.ready = this.restore(); }

  private async restore() {
    const s = await this.storage.get<AuthResponse | null>('session', null);
    if (s && !this.expired(s.token)) { this.token = s.token; this.user.set(s.user); }
    else await this.storage.remove('session');
  }

  /** Lee el campo exp del JWT sin verificar la firma (la verifica el servidor). */
  private expired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      return payload.exp * 1000 < Date.now();
    } catch { return true; }
  }

  async login(email: string, password: string) {
    await this.apply(await firstValueFrom(this.http.post<AuthResponse>(`${API_URL}/auth/login`, { email, password })));
  }
  async register(name: string, email: string, password: string) {
    await this.apply(await firstValueFrom(this.http.post<AuthResponse>(`${API_URL}/auth/register`, { name, email, password })));
  }
  private async apply(r: AuthResponse) {
    this.token = r.token; this.user.set(r.user);
    await this.storage.set('session', r);
  }
  async logout() {
    this.token = null; this.user.set(null);
    await this.storage.remove('session');
  }
}
