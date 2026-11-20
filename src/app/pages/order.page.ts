import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IonBackButton, IonButtons, IonContent, IonHeader, IonIcon, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { ApiService } from '../core/api.service';
import { Order } from '../core/models';
import { fmt, fmtDate } from '../core/format';

@Component({
  selector: 'app-order',
  standalone: true,
  imports: [IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle, IonContent, IonIcon],
  template: `
  <ion-header><ion-toolbar>
    <ion-buttons slot="start"><ion-back-button defaultHref="/orders" text="Atrás"></ion-back-button></ion-buttons>
    <ion-title>Pedido</ion-title>
  </ion-toolbar></ion-header>
  <ion-content>
    @if (o(); as o) {
      <div class="pad">
        <h2>{{ o.id }}</h2>
        <p class="muted">Creado el {{ fmtDate(o.createdAt) }}</p>

        @if (o.status === 'cancelado') {
          <div class="step done cancel"><ion-icon name="close-circle"></ion-icon><span>Pedido cancelado</span></div>
        } @else {
          @for (s of steps; track s; let i = $index) {
            <div class="step" [class.done]="i <= index(o)">
              <ion-icon [name]="i <= index(o) ? 'checkmark-circle' : 'time-outline'"></ion-icon><span>{{ s }}</span>
            </div>
          }
        }

        <h3>Entrega</h3>
        <p>{{ o.delivery === 'domicilio' ? 'A domicilio · ' + o.address : 'Recogida en la tienda' }}<br />Fecha estimada: {{ fmtDate(o.deliveryDate) }}</p>

        <h3>Productos</h3>
        @for (l of o.items; track l.productId) {
          <div class="line"><span>{{ l.quantity }} × {{ l.name }}</span><span>{{ fmt(l.quantity * l.unitPrice) }}</span></div>
        }
        <div class="line total"><span>Total</span><span class="price">{{ fmt(o.total) }}</span></div>

        <h3>Registro de cambios</h3>
        @for (h of o.history; track h.at) { <p class="muted">{{ fmtDate(h.at) }} · {{ h.status }} · {{ h.by }}</p> }
      </div>
    } @else { <div class="empty">Pedido no encontrado.</div> }
  </ion-content>`,
  styles: [`
    .pad { padding: 16px; } .muted { color: var(--ion-color-medium); font-size: 13px; margin: 2px 0; }
    .step { display: flex; align-items: center; gap: 10px; padding: 8px 0; color: var(--ion-color-medium); text-transform: capitalize; }
    .step ion-icon { font-size: 22px; } .step.done { color: var(--ion-color-success-shade); font-weight: 600; } .step.cancel { color: var(--ion-color-danger); }
    .line { display: flex; justify-content: space-between; padding: 4px 0; } .total { font-weight: 700; border-top: 1px solid var(--ion-color-light-shade); margin-top: 6px; padding-top: 8px; }
  `]
})
export class OrderPage {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  fmt = fmt; fmtDate = fmtDate;
  steps = ['recibido', 'en preparación', 'en distribución', 'entregado'];
  o = signal<Order | undefined>(undefined);
  constructor() { this.api.order(this.route.snapshot.paramMap.get('id')!).then((x) => this.o.set(x)); }
  index(o: Order) { return this.steps.indexOf(o.status); }
}
