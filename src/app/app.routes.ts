import { Routes } from '@angular/router';
import { adminGuard, authGuard } from './core/guards';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./pages/login.page').then((m) => m.LoginPage) },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/tabs.page').then((m) => m.TabsPage),
    children: [
      { path: 'catalog', loadComponent: () => import('./pages/catalog.page').then((m) => m.CatalogPage) },
      { path: 'cart', loadComponent: () => import('./pages/cart.page').then((m) => m.CartPage) },
      { path: 'orders', loadComponent: () => import('./pages/orders.page').then((m) => m.OrdersPage) },
      { path: 'photos', loadComponent: () => import('./pages/photos.page').then((m) => m.PhotosPage) },
      { path: 'admin', canActivate: [adminGuard], loadComponent: () => import('./pages/admin.page').then((m) => m.AdminPage) },
      { path: '', redirectTo: 'catalog', pathMatch: 'full' }
    ]
  },
  { path: 'product/:id', canActivate: [authGuard], loadComponent: () => import('./pages/product.page').then((m) => m.ProductPage) },
  { path: 'order/:id', canActivate: [authGuard], loadComponent: () => import('./pages/order.page').then((m) => m.OrderPage) },
  { path: '**', redirectTo: '' }
];
