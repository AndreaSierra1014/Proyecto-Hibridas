import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ViewWillEnter } from '@ionic/angular';
import { ActionSheetController, AlertController, IonBadge, IonButton, IonContent, IonHeader, IonIcon, IonItem, IonLabel, IonList,
  IonSegment, IonSegmentButton, IonTitle, IonToolbar, ToastController, IonButtons } from '@ionic/angular/standalone';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { PhotoService } from '../core/photo.service';
import { ORDER_STATES, Order, OrderStatus, Product } from '../core/models';
import { fmt, fmtDate } from '../core/format';
import { statusColor } from './status';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon, IonContent, IonSegment, IonSegmentButton, IonLabel, IonList, IonItem, IonBadge],
  template: `
  <ion-header>
    <ion-toolbar>
      <ion-title>Gestión</ion-title>
      <ion-buttons slot="end"><ion-button (click)="logout()"><ion-icon slot="icon-only" name="log-out-outline"></ion-icon></ion-button></ion-buttons>
    </ion-toolbar>
    <ion-toolbar>
      <ion-segment [value]="tab()" (ionChange)="tab.set($any($event.detail.value))">
        <ion-segment-button value="orders"><ion-label>Pedidos</ion-label></ion-segment-button>
        <ion-segment-button value="inventory"><ion-label>Inventario</ion-label></ion-segment-button>
      </ion-segment>
    </ion-toolbar>
  </ion-header>
  <ion-content>
    @if (tab() === 'orders') {
      @if (orders().length === 0) { <div class="empty">No hay pedidos registrados.</div> }
      <ion-list>
        @for (o of orders(); track o.id) {
          <ion-item button (click)="manage(o)">
            <ion-label>
              <h3>{{ o.id }} · {{ o.customer }}</h3>
              <p>{{ fmt(o.total) }} · entrega: {{ fmtDate(o.deliveryDate) }}</p>
            </ion-label>
            <ion-badge slot="end" [color]="color(o.status)">{{ o.status }}</ion-badge>
          </ion-item>
        }
      </ion-list>
    } @else {
      <div class="bar"><ion-button size="small" (click)="editProduct()"><ion-icon slot="start" name="add-circle-outline"></ion-icon>Nuevo producto</ion-button></div>
      <ion-list>
        @for (p of products(); track p.id) {
          <ion-item>
            <ion-label>
              <h3>{{ p.name }}</h3>
              <p>{{ p.brand }} · {{ p.reference }} · {{ fmt(p.price) }} · stock {{ p.stock }}</p>
            </ion-label>
            <ion-button fill="clear" (click)="photo(p)" aria-label="Foto"><ion-icon slot="icon-only" name="camera"></ion-icon></ion-button>
            <ion-button fill="clear" (click)="editProduct(p)" aria-label="Editar"><ion-icon slot="icon-only" name="create-outline"></ion-icon></ion-button>
          </ion-item>
        }
      </ion-list>
    }
  </ion-content>`,
  styles: [`.bar { padding: 8px 12px 0; }`]
})
export class AdminPage implements ViewWillEnter {
  private api = inject(ApiService);
  private sheet = inject(ActionSheetController);
  private alert = inject(AlertController);
  private toast = inject(ToastController);
  private photos = inject(PhotoService);
  private auth = inject(AuthService);
  private router = inject(Router);
  fmt = fmt; fmtDate = fmtDate; color = statusColor;
  tab = signal<'orders' | 'inventory'>('orders');
  orders = signal<Order[]>([]);
  products = signal<Product[]>([]);

  ionViewWillEnter() { this.load(); }
  async load() {
    try {
      this.orders.set((await this.api.orders()).data);
      this.products.set((await this.api.products()).data);
    } catch { /* sesión vencida */ }
  }

  async manage(o: Order) {
    const buttons = ORDER_STATES.filter((s) => s !== o.status).map((s) => ({ text: `Pasar a: ${s}`, handler: () => this.setStatus(o, s) }));
    const sheet = await this.sheet.create({
      header: `Pedido ${o.id}`,
      buttons: [...buttons, { text: 'Asignar fecha de entrega', handler: () => this.setDate(o) }, { text: 'Cerrar', role: 'cancel' }]
    });
    sheet.present();
  }
  private async setStatus(o: Order, status: OrderStatus) {
    try { await this.api.updateOrder(o.id, { status }); await this.load(); this.say(`Estado actualizado: ${status}`); }
    catch (e: any) { this.say(e.error?.message ?? 'No se pudo actualizar (¿sin conexión?)'); }
  }
  private async setDate(o: Order) {
    const a = await this.alert.create({
      header: 'Fecha de entrega',
      inputs: [{ name: 'date', type: 'date', value: o.deliveryDate ?? '' }],
      buttons: ['Cancelar', { text: 'Guardar', handler: async (v) => {
        if (!v.date) return;
        try { await this.api.updateOrder(o.id, { deliveryDate: v.date }); await this.load(); this.say('Fecha asignada'); }
        catch (e: any) { this.say(e.error?.message ?? 'No se pudo guardar'); }
      } }]
    });
    a.present();
  }

  async editProduct(p?: Product) {
    const a = await this.alert.create({
      header: p ? 'Editar producto' : 'Nuevo producto',
      inputs: [
        { name: 'name', placeholder: 'Nombre', value: p?.name },
        { name: 'brand', placeholder: 'Marca', value: p?.brand },
        { name: 'reference', placeholder: 'Referencia', value: p?.reference },
        { name: 'price', type: 'number', placeholder: 'Precio (COP)', value: p?.price },
        { name: 'stock', type: 'number', placeholder: 'Cantidad disponible', value: p?.stock }
      ],
      buttons: ['Cancelar', { text: 'Guardar', handler: async (v) => {
        const data = { name: v.name, brand: v.brand, reference: v.reference, price: +v.price, stock: +v.stock };
        try {
          if (p) await this.api.updateProduct(p.id, data); else await this.api.createProduct({ ...data, category: 'Accesorios' });
          await this.load(); this.say('Inventario actualizado');
        } catch (e: any) { this.say(e.error?.message ?? 'No se pudo guardar'); }
      } }]
    });
    a.present();
  }
  async photo(p: Product) {
    try {
      const image = await this.photos.takeProductPhoto();
      if (!image) return;
      await this.api.updateProduct(p.id, { image }); await this.load(); this.say('Foto actualizada');
    } catch { /* el usuario canceló la cámara */ }
  }
  async logout() { await this.auth.logout(); this.router.navigateByUrl('/login', { replaceUrl: true }); }
  private async say(message: string) { (await this.toast.create({ message, duration: 1800, position: 'top' })).present(); }
}
