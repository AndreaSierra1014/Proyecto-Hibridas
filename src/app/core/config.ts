import { Capacitor } from '@capacitor/core';

// En el emulador de Android, localhost apunta al propio emulador;
// 10.0.2.2 es la dirección del computador anfitrión.
// En un dispositivo físico, reemplazar por la IP del computador (ej. http://192.168.1.20:3000/api)
// o por la URL HTTPS del servidor desplegado.
export const API_URL =
  Capacitor.getPlatform() === 'android' ? 'http://10.0.2.2:3000/api' : 'http://localhost:3000/api';

export const POLL_MS = 20000; // revisión de cambios de pedido (RNF09: menos de 30 s)
