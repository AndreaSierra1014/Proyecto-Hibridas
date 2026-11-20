export type Role = 'cliente' | 'admin';
export interface User { id: number; name: string; email: string; role: Role; }

export interface Product {
  id: number; name: string; brand: string; model: string; reference: string;
  category: string; price: number; stock: number; image: string; description: string;
}
export interface CartItem { productId: number; name: string; unitPrice: number; quantity: number; }

export type OrderStatus = 'recibido' | 'en preparación' | 'en distribución' | 'entregado' | 'cancelado';
export const ORDER_STATES: OrderStatus[] = ['recibido', 'en preparación', 'en distribución', 'entregado', 'cancelado'];

export interface OrderLine { productId: number; name: string; quantity: number; unitPrice: number; }
export interface Order {
  id: string; userId: number; customer: string; items: OrderLine[]; total: number;
  delivery: 'domicilio' | 'recogida'; address: string; status: OrderStatus;
  deliveryDate: string | null; createdAt: string;
  history: { status: string; at: string; by: string }[];
}
export interface NewOrder {
  items: { productId: number; quantity: number }[];
  delivery: 'domicilio' | 'recogida'; address: string; clientOpId: string;
}
