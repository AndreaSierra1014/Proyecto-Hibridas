import { Injectable, computed, inject, signal } from '@angular/core';
import { StorageService } from './storage.service';
import { CartItem, Product } from './models';

/** Carrito persistente en almacenamiento local (RF-04, RF-12). */
@Injectable({ providedIn: 'root' })
export class CartService {
  private storage = inject(StorageService);
  readonly items = signal<CartItem[]>([]);
  readonly count = computed(() => this.items().reduce((s, i) => s + i.quantity, 0));
  readonly total = computed(() => this.items().reduce((s, i) => s + i.quantity * i.unitPrice, 0));

  constructor() { this.storage.get<CartItem[]>('cart', []).then((c) => this.items.set(c)); }

  add(p: Product, qty = 1) {
    this.items.update((list) => {
      const found = list.find((i) => i.productId === p.id);
      if (found) return list.map((i) => (i.productId === p.id ? { ...i, quantity: Math.min(i.quantity + qty, p.stock) } : i));
      return [...list, { productId: p.id, name: p.name, unitPrice: p.price, quantity: Math.min(qty, p.stock) }];
    });
    this.persist();
  }
  setQty(productId: number, quantity: number) {
    this.items.update((l) => l.map((i) => (i.productId === productId ? { ...i, quantity: Math.max(1, quantity) } : i)));
    this.persist();
  }
  remove(productId: number) { this.items.update((l) => l.filter((i) => i.productId !== productId)); this.persist(); }
  clear() { this.items.set([]); this.persist(); }
  private persist() { this.storage.set('cart', this.items()); }
}
