import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IonBackButton, IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonTitle, IonToolbar, ToastController } from '@ionic/angular/standalone';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { CartService } from '../core/cart.service';
import { Product } from '../core/models';
import { fmt } from '../core/format';

@Component({
  selector: 'app-product',
  standalone: true,
  imports: [IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle, IonContent, IonButton, IonIcon],
  template: `
  <ion-header><ion-toolbar>
    <ion-buttons slot="start"><ion-back-button defaultHref="/catalog" text="Atrás"></ion-back-button></ion-buttons>
    <ion-title>Producto</ion-title>
  </ion-toolbar></ion-header>
  <ion-content>
    @if (p(); as p) {
      <div class="img">@if (p.image) { <img [src]="p.image" [alt]="p.name" /> } @else { <ion-icon name="phone-portrait-outline"></ion-icon> }</div>
      <div class="info">
        <div class="brand">{{ p.brand }} · {{ p.model }} · Ref. {{ p.reference }}</div>
        <h2>{{ p.name }}</h2>
        <div class="price big">{{ fmt(p.price) }}</div>
        <p>{{ p.description }}</p>
        <p class="stock" [class.out]="p.stock === 0">{{ p.stock > 0 ? p.stock + ' unidades disponibles' : 'Producto agotado' }}</p>
        @if (!auth.isAdmin()) {
          <ion-button expand="block" [disabled]="p.stock === 0" (click)="add(p)">Agregar al carrito</ion-button>
        }
      </div>
    } @else { <div class="empty">Producto no encontrado.</div> }
  </ion-content>`,
  styles: [`
    .img { height: 240px; display: flex; align-items: center; justify-content: center; background: var(--ion-color-light); }
    .img img { width: 100%; height: 100%; object-fit: cover; }
    .img ion-icon { font-size: 80px; color: var(--ion-color-medium); }
    .info { padding: 16px; }
    .brand { color: var(--ion-color-medium); font-size: 13px; }
    h2 { margin: 4px 0; }
    .big { font-size: 24px; margin-bottom: 8px; }
    .stock { color: var(--ion-color-success-shade); } .stock.out { color: var(--ion-color-danger); }
  `]
})
export class ProductPage {
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);
  private cart = inject(CartService);
  private toast = inject(ToastController);
  private router = inject(Router);
  auth = inject(AuthService);
  fmt = fmt;
  p = signal<Product | undefined>(undefined);

  constructor() { this.api.product(+this.route.snapshot.paramMap.get('id')!).then((x) => this.p.set(x)); }

  async add(p: Product) {
    this.cart.add(p);
    (await this.toast.create({ message: 'Agregado al carrito', duration: 1200, position: 'top' })).present();
    this.router.navigateByUrl('/cart');
  }
}
