import { OrderStatus } from '../core/models';
export const statusColor = (s: OrderStatus | string): string =>
  ({ recibido: 'medium', 'en preparación': 'warning', 'en distribución': 'primary', entregado: 'success', cancelado: 'danger' } as Record<string, string>)[s] ?? 'medium';
