import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ViewWillEnter } from '@ionic/angular';
import { IonButton, IonButtons, IonChip, IonContent, IonHeader, IonIcon, IonLabel, IonRefresher, IonRefresherContent,
  IonSearchbar, IonTitle, IonToolbar, ToastController } from '@ionic/angular/standalone';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { CartService } from '../core/cart.service';
import { NetworkService } from '../core/network.service';
import { Product } from '../core/models';
import { fmt } from '../core/format';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon, IonContent, IonSearchbar, IonChip, IonLabel, IonRefresher, IonRefresherContent],
  template: `
  <ion-header>
    <ion-toolbar>
      <ion-title>Catálogo</ion-title>
      <ion-buttons slot="end"><ion-button (click)="logout()"><ion-icon slot="icon-only" name="log-out-outline"></ion-icon></ion-button></ion-buttons>
    </ion-toolbar>
    <ion-toolbar><ion-searchbar placeholder="Nombre, marca o referencia" debounce="250" (ionInput)="query.set(($any($event.target).value ?? '').toString())"></ion-searchbar></ion-toolbar>
  </ion-header>
  <ion-content>
    <ion-refresher slot="fixed" (ionRefresh)="refresh($event)"><ion-refresher-content></ion-refresher-content></ion-refresher>
    @if (!net.online() || fromCache()) { <div class="offline-banner">Sin conexión: se muestra la última información guardada</div> }

    <div class="chips">
      @for (c of categories(); track c) {
        <ion-chip [outline]="category() !== c" color="primary" (click)="category.set(category() === c ? '' : c)"><ion-label>{{ c }}</ion-label></ion-chip>
      }
      <ion-chip [outline]="!onlyAvailable()" color="success" (click)="onlyAvailable.set(!onlyAvailable())"><ion-label>Disponibles</ion-label></ion-chip>
    </div>

    @if (filtered().length === 0) {
      <div class="empty">{{ loaded() ? 'No hay productos con esos filtros.' : 'Cargando catálogo…' }}</div>
    }
    <div class="grid">
      @for (p of filtered(); track p.id) {
        <div class="card" (click)="open(p)">
          <div class="img">@if (p.image) { <img [src]="p.image" [alt]="p.name" /> } @else { <ion-icon name="phone-portrait-outline"></ion-icon> }</div>
          <div class="body">
            <div class="brand">{{ p.brand }} · {{ p.reference }}</div>
            <div class="name">{{ p.name }}</div>
            <div class="price">{{ fmt(p.price) }}</div>
            <div class="stock" [class.out]="p.stock === 0">{{ p.stock > 0 ? p.stock + ' disponibles' : 'Agotado' }}</div>
            @if (!auth.isAdmin()) {
              <ion-button size="small" expand="block" [disabled]="p.stock === 0" (click)="add(p, $event)">Agregar</ion-button>
            }
          </div>
        </div>
      }
    </div>
  </ion-content>`,
  styles: [`
    .chips { padding: 8px 12px 0; display: flex; flex-wrap: wrap; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px; padding: 12px; }
    .card { background: var(--ion-card-background, #fff); border: 1px solid var(--ion-color-light-shade, #ddd); border-radius: 12px; overflow: hidden; }
    .img { height: 110px; display: flex; align-items: center; justify-content: center; background: var(--ion-color-light); }
    .img img { width: 100%; height: 100%; object-fit: cover; }
    .img ion-icon { font-size: 44px; color: var(--ion-color-medium); }
    .body { padding: 10px; }
    .brand { font-size: 12px; color: var(--ion-color-medium); }
    .name { font-weight: 600; margin: 2px 0 4px; }
    .stock { font-size: 12px; color: var(--ion-color-success-shade); margin: 2px 0 8px; }
    .stock.out { color: var(--ion-color-danger); }
  `]
})
export class CatalogPage implements ViewWillEnter {
  private api = inject(ApiService);
  private router = inject(Router);
  private toast = inject(ToastController);
  auth = inject(AuthService);
  net = inject(NetworkService);
  cart = inject(CartService);
  fmt = fmt;

  products = signal<Product[]>([]);
  loaded = signal(false);
  fromCache = signal(false);
  query = signal('');
  category = signal('');
  onlyAvailable = signal(false);

  categories = computed(() => [...new Set(this.products().map((p) => p.category))]);
  filtered = computed(() => {
    const q = this.query().toLowerCase().trim();
    return this.products().filter((p) =>
      (!q || [p.name, p.brand, p.reference].some((x) => x.toLowerCase().includes(q))) &&
      (!this.category() || p.category === this.category()) &&
      (!this.onlyAvailable() || p.stock > 0));
  });

  ionViewWillEnter() { this.load(); }

  async load() {
    try {
      const r = await this.api.products();
      this.products.set(r.data); this.fromCache.set(r.fromCache);
    } catch { /* el interceptor maneja la sesión vencida */ }
    this.loaded.set(true);
  }
  async refresh(ev: any) { await this.load(); ev.target.complete(); }
  open(p: Product) { this.router.navigate(['/product', p.id]); }
  async add(p: Product, ev: Event) {
    ev.stopPropagation();
    this.cart.add(p);
    (await this.toast.create({ message: `${p.name} agregado al carrito`, duration: 1200, position: 'top' })).present();
  }
  async logout() { await this.auth.logout(); this.router.navigateByUrl('/login', { replaceUrl: true }); }
}
