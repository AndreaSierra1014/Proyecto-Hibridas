import { Injectable, inject } from '@angular/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { StorageService } from './storage.service';
import { POLL_MS } from './config';

/**
 * Notifica al cliente los cambios de estado de sus pedidos (RF-10, RNF09).
 * Consulta la API cada POLL_MS segundos y lanza una notificación local cuando un estado cambia.
 * En producción se reemplazaría por notificaciones push (Firebase Cloud Messaging).
 */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private storage = inject(StorageService);
  private timer: ReturnType<typeof setInterval> | null = null;
  private nextId = 1;

  async start() {
    try { await LocalNotifications.requestPermissions(); } catch { /* en navegador puede no estar disponible */ }
    if (this.timer) return;
    this.timer = setInterval(() => this.check(), POLL_MS);
  }

  async check() {
    const u = this.auth.user();
    if (!u || u.role === 'admin') return;
    try {
      const { data, fromCache } = await this.api.orders();
      if (fromCache) return;
      const known = await this.storage.get<Record<string, string>>('order:statuses', {});
      for (const o of data) {
        if (known[o.id] && known[o.id] !== o.status) await this.notify(o.id, o.status);
        known[o.id] = o.status;
      }
      await this.storage.set('order:statuses', known);
    } catch { /* se reintenta en el siguiente ciclo */ }
  }

  private async notify(orderId: string, status: string) {
    const msg: Record<string, string> = {
      'en preparación': 'Tu pedido está en preparación.',
      'en distribución': 'Tu pedido salió a distribución.',
      entregado: 'Tu pedido fue entregado.',
      cancelado: 'Tu pedido fue cancelado.'
    };
    try {
      await LocalNotifications.schedule({
        notifications: [{ id: this.nextId++, title: `Pedido ${orderId}`, body: msg[status] ?? `Nuevo estado: ${status}` }]
      });
    } catch { /* sin permiso de notificaciones */ }
  }
}
