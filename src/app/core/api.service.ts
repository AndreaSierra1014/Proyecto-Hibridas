import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { API_URL } from './config';
import { StorageService } from './storage.service';
import { NewOrder, Order, OrderStatus, Product } from './models';

export interface Cached<T> { data: T; fromCache: boolean; }

/** Acceso a la API REST. Las consultas guardan una copia local para uso sin conexión (RF-12). */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private storage = inject(StorageService);

  async products(): Promise<Cached<Product[]>> {
    try {
      const data = await firstValueFrom(this.http.get<Product[]>(`${API_URL}/products`));
      await this.storage.set('cache:products', data);
      return { data, fromCache: false };
    } catch (e: any) {
      if (e.status !== 0) throw e; // error real del servidor, no de conexión
      return { data: await this.storage.get<Product[]>('cache:products', []), fromCache: true };
    }
  }
  async product(id: number): Promise<Product | undefined> {
    return (await this.products()).data.find((p) => p.id === id);
  }

  async orders(): Promise<Cached<Order[]>> {
    try {
      const data = await firstValueFrom(this.http.get<Order[]>(`${API_URL}/orders`));
      await this.storage.set('cache:orders', data);
      return { data, fromCache: false };
    } catch (e: any) {
      if (e.status !== 0) throw e;
      return { data: await this.storage.get<Order[]>('cache:orders', []), fromCache: true };
    }
  }
  async order(id: string): Promise<Order | undefined> {
    return (await this.orders()).data.find((o) => o.id === id);
  }
  createOrder(o: NewOrder) { return firstValueFrom(this.http.post<Order>(`${API_URL}/orders`, o)); }
  updateOrder(id: string, patch: { status?: OrderStatus; deliveryDate?: string }) {
    return firstValueFrom(this.http.patch<Order>(`${API_URL}/orders/${id}`, patch));
  }

  createProduct(p: Partial<Product>) { return firstValueFrom(this.http.post<Product>(`${API_URL}/products`, p)); }
  updateProduct(id: number, p: Partial<Product>) { return firstValueFrom(this.http.put<Product>(`${API_URL}/products/${id}`, p)); }
}
