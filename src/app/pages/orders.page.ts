import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ViewWillEnter } from '@ionic/angular';
import { IonBadge, IonContent, IonHeader, IonItem, IonLabel, IonList, IonRefresher, IonRefresherContent, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { NetworkService } from '../core/network.service';
import { SyncService } from '../core/sync.service';
import { Order } from '../core/models';
import { fmt, fmtDate } from '../core/format';
import { statusColor } from './status';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonBadge, IonRefresher, IonRefresherContent],
  template: `
  <ion-header><ion-toolbar><ion-title>{{ auth.isAdmin() ? 'Todos los pedidos' : 'Mis pedidos' }}</ion-title></ion-toolbar></ion-header>
  <ion-content>
    <ion-refresher slot="fixed" (ionRefresh)="refresh($event)"><ion-refresher-content></ion-refresher-content></ion-refresher>
    @if (!net.online() || fromCache()) { <div class="offline-banner">Sin conexión: historial guardado en el dispositivo</div> }
    @if (sync.pending().length > 0) {
      <div class="offline-banner" style="background:#1d4ed8">{{ sync.pending().length }} pedido(s) esperando conexión para enviarse</div>
    }
    @if (orders().length === 0) { <div class="empty">Aún no hay pedidos.</div> }
    <ion-list>
      @for (o of orders(); track o.id) {
        <ion-item button detail (click)="open(o)">
          <ion-label>
            <h3>{{ o.id }} @if (auth.isAdmin()) { · {{ o.customer }} }</h3>
            <p>{{ fmtDate(o.createdAt) }} · {{ itemCount(o) }} artículo(s) · {{ fmt(o.total) }}</p>
          </ion-label>
          <ion-badge slot="end" [color]="color(o.status)">{{ o.status }}</ion-badge>
        </ion-item>
      }
    </ion-list>
  </ion-content>`
})
export class OrdersPage implements ViewWillEnter {
  private api = inject(ApiService);
  private router = inject(Router);
  auth = inject(AuthService);
  net = inject(NetworkService);
  sync = inject(SyncService);
  fmt = fmt; fmtDate = fmtDate; color = statusColor;
  orders = signal<Order[]>([]);
  fromCache = signal(false);

  ionViewWillEnter() { this.sync.flush().then(() => this.load()); }
  async load() {
    try { const r = await this.api.orders(); this.orders.set(r.data); this.fromCache.set(r.fromCache); } catch { /* sesión vencida */ }
  }
  async refresh(ev: any) { await this.load(); ev.target.complete(); }
  itemCount(o: Order) { return o.items.reduce((s, i) => s + i.quantity, 0); }
  open(o: Order) { this.router.navigate(['/order', o.id]); }
}
