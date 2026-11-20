import { Injectable, signal } from '@angular/core';
import { Network } from '@capacitor/network';

@Injectable({ providedIn: 'root' })
export class NetworkService {
  readonly online = signal(true);
  private listeners: Array<() => void> = [];

  constructor() {
    Network.getStatus().then((s) => this.online.set(s.connected));
    Network.addListener('networkStatusChange', (s) => {
      const was = this.online();
      this.online.set(s.connected);
      if (!was && s.connected) this.listeners.forEach((fn) => fn());
    });
  }
  /** Registra una función que se ejecuta cuando vuelve la conexión. */
  onReconnect(fn: () => void) { this.listeners.push(fn); }
}
