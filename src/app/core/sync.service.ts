import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from './api.service';
import { NetworkService } from './network.service';
import { StorageService } from './storage.service';
import { NewOrder } from './models';

/**
 * Cola de pedidos pendientes (RF-12, RNF11).
 * Si la conexión se cae mientras se envía un pedido, la operación queda guardada con su
 * clientOpId y se reintenta al volver internet. El servidor reconoce el identificador y no
 * crea el pedido dos veces.
 */
@Injectable({ providedIn: 'root' })
export class SyncService {
  private api = inject(ApiService);
  private storage = inject(StorageService);
  private net = inject(NetworkService);
  readonly pending = signal<NewOrder[]>([]);
  private running = false;

  constructor() {
    this.storage.get<NewOrder[]>('pending:orders', []).then((p) => { this.pending.set(p); this.flush(); });
    this.net.onReconnect(() => this.flush());
  }

  async enqueue(o: NewOrder) {
    this.pending.update((p) => [...p, o]);
    await this.storage.set('pending:orders', this.pending());
  }

  async flush() {
    if (this.running || !this.net.online()) return;
    this.running = true;
    try {
      for (const op of [...this.pending()]) {
        try { await this.api.createOrder(op); }
        catch (e: any) { if (e.status === 0) break; /* sin red: se reintenta luego */ }
        // éxito o rechazo definitivo del servidor (ej. sin inventario): se saca de la cola
        this.pending.update((p) => p.filter((x) => x.clientOpId !== op.clientOpId));
        await this.storage.set('pending:orders', this.pending());
      }
    } finally { this.running = false; }
  }
}
