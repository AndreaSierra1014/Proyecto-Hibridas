import { Component, inject } from '@angular/core';
import { IonBadge, IonIcon, IonLabel, IonTabBar, IonTabButton, IonTabs } from '@ionic/angular/standalone';
import { AuthService } from '../core/auth.service';
import { CartService } from '../core/cart.service';

@Component({
  selector: 'app-tabs',
  standalone: true,
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, IonBadge],
  template: `
  <ion-tabs>
    <ion-tab-bar slot="bottom">
      <ion-tab-button tab="catalog"><ion-icon name="storefront-outline"></ion-icon><ion-label>Catálogo</ion-label></ion-tab-button>
      @if (!auth.isAdmin()) {
        <ion-tab-button tab="cart">
          <ion-icon name="cart-outline"></ion-icon><ion-label>Carrito</ion-label>
          @if (cart.count() > 0) { <ion-badge color="danger">{{ cart.count() }}</ion-badge> }
        </ion-tab-button>
      }
      <ion-tab-button tab="orders"><ion-icon name="bag-check-outline"></ion-icon><ion-label>Pedidos</ion-label></ion-tab-button>
      @if (auth.isAdmin()) {
        <ion-tab-button tab="admin"><ion-icon name="build-outline"></ion-icon><ion-label>Gestión</ion-label></ion-tab-button>
      }
      <ion-tab-button tab="photos"><ion-icon name="images-outline"></ion-icon><ion-label>Fotos</ion-label></ion-tab-button>
    </ion-tab-bar>
  </ion-tabs>`
})
export class TabsPage {
  auth = inject(AuthService);
  cart = inject(CartService);
}
