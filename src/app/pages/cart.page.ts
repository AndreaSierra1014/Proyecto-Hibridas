import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AlertController, IonButton, IonContent, IonHeader, IonIcon, IonInput, IonItem, IonLabel, IonList, IonRadio, IonRadioGroup,
  IonTitle, IonToolbar, ToastController } from '@ionic/angular/standalone';
import { ApiService } from '../core/api.service';
import { CartService } from '../core/cart.service';
import { NetworkService } from '../core/network.service';
import { SyncService } from '../core/sync.service';
import { NewOrder } from '../core/models';
import { fmt, uid } from '../core/format';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [FormsModule, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonButton, IonIcon, IonInput, IonRadioGroup, IonRadio],
  template: `
  <ion-header><ion-toolbar><ion-title>Carrito</ion-title></ion-toolbar></ion-header>
  <ion-content>
    @if (!net.online()) { <div class="offline-banner">Sin conexión: puedes editar el carrito, pero confirmar requiere internet</div> }
    @if (cart.items().length === 0) {
      <div class="empty">Tu carrito está vacío.<br />Agrega productos desde el catálogo.</div>
    } @else {
      <ion-list>
        @for (i of cart.items(); track i.productId) {
          <ion-item>
            <ion-label>
              <h3>{{ i.name }}</h3>
              <p>{{ fmt(i.unitPrice) }} c/u · subtotal {{ fmt(i.unitPrice * i.quantity) }}</p>
            </ion-label>
            <ion-button fill="clear" (click)="cart.setQty(i.productId, i.quantity - 1)" aria-label="Quitar una unidad"><ion-icon slot="icon-only" name="remove-circle-outline"></ion-icon></ion-button>
            <span class="qty">{{ i.quantity }}</span>
            <ion-button fill="clear" (click)="cart.setQty(i.productId, i.quantity + 1)" aria-label="Agregar una unidad"><ion-icon slot="icon-only" name="add-circle-outline"></ion-icon></ion-button>
            <ion-button fill="clear" color="danger" (click)="cart.remove(i.productId)" aria-label="Eliminar"><ion-icon slot="icon-only" name="trash-outline"></ion-icon></ion-button>
          </ion-item>
        }
      </ion-list>

      <div class="box">
        <h3>Entrega</h3>
        <ion-radio-group [(ngModel)]="delivery">
          <ion-item><ion-radio value="domicilio">Entrega a domicilio</ion-radio></ion-item>
          <ion-item><ion-radio value="recogida">Recoger en la tienda</ion-radio></ion-item>
        </ion-radio-group>
        @if (delivery === 'domicilio') {
          <ion-item><ion-input label="Dirección de entrega" labelPlacement="floating" [(ngModel)]="address" autocomplete="street-address"></ion-input></ion-item>
        }
        <div class="total"><span>Total</span><span class="price">{{ fmt(cart.total()) }}</span></div>
        <ion-button expand="block" [disabled]="busy()" (click)="confirm()">Confirmar pedido</ion-button>
      </div>
    }
  </ion-content>`,
  styles: [`
    .qty { min-width: 24px; text-align: center; font-weight: 600; }
    .box { padding: 16px; } .box h3 { margin: 8px 0; }
    .total { display: flex; justify-content: space-between; font-size: 18px; margin: 16px 4px; }
  `]
})
export class CartPage {
  private api = inject(ApiService);
  private sync = inject(SyncService);
  private router = inject(Router);
  private alert = inject(AlertController);
  private toast = inject(ToastController);
  cart = inject(CartService);
  net = inject(NetworkService);
  fmt = fmt;
  delivery: 'domicilio' | 'recogida' = 'domicilio';
  address = '';
  busy = signal(false);

  async confirm() {
    if (!this.net.online()) return this.say('Sin conexión', 'La compra se confirma con el servidor. Conéctate a internet e inténtalo de nuevo; tu carrito se conserva.');
    if (this.delivery === 'domicilio' && !this.address.trim()) return this.say('Falta la dirección', 'Escribe la dirección de entrega.');

    const order: NewOrder = {
      items: this.cart.items().map((i) => ({ productId: i.productId, quantity: i.quantity })),
      delivery: this.delivery, address: this.address.trim(), clientOpId: uid()
    };
    this.busy.set(true);
    try {
      const o = await this.api.createOrder(order);
      this.cart.clear();
      (await this.toast.create({ message: `Pedido ${o.id} confirmado`, duration: 2000, position: 'top', color: 'success' })).present();
      this.router.navigateByUrl('/orders');
    } catch (e: any) {
      if (e.status === 0) {
        // La conexión se cayó durante el envío: se guarda y se reintenta sin duplicar (RNF11).
        await this.sync.enqueue(order);
        this.cart.clear();
        await this.say('Pedido en espera', 'Se perdió la conexión. El pedido quedó guardado y se enviará automáticamente cuando vuelva internet.');
        this.router.navigateByUrl('/orders');
      } else {
        await this.say('No se pudo confirmar', e.error?.message ?? 'Intenta de nuevo.');
      }
    } finally { this.busy.set(false); }
  }

  private async say(header: string, message: string) {
    (await this.alert.create({ header, message, buttons: ['Entendido'] })).present();
  }
}
