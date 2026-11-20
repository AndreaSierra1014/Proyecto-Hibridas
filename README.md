# Magic Cell – app móvil híbrida (Ionic + Angular + Capacitor)

Aplicación de la tienda Magic Cell: catálogo, carrito, pedidos con seguimiento, notificaciones,
administración de inventario y sincronización sin conexión. Incluye la galería de fotos de la
actividad Ionic/Angular de almacenamiento de datos.

## Estructura
- `src/app/core/` servicios: autenticación JWT, API REST, carrito, almacenamiento local, red, sincronización, notificaciones, fotos.
- `src/app/pages/` pantallas (login, catálogo, producto, carrito, pedidos, detalle, gestión, fotos).
- `backend/` API REST (Node + Express + JWT + bcrypt) que atiende la app.
- `android/` proyecto nativo generado por Capacitor.

## Cobertura de requerimientos
| Requerimiento | Dónde está |
|---|---|
| RF-01 Registro e inicio de sesión, roles | `auth.service.ts`, `jwt.interceptor.ts`, `guards.ts`, `login.page.ts` |
| RF-02, RF-03 Catálogo, búsqueda y filtros | `catalog.page.ts`, `product.page.ts` |
| RF-04 Carrito | `cart.service.ts`, `cart.page.ts` |
| RF-05, RF-06 Confirmación y entrega | `cart.page.ts`, `POST /api/orders` (valida inventario) |
| RF-07, RF-11 Seguimiento e historial | `orders.page.ts`, `order.page.ts` |
| RF-08 Administración de pedidos | `admin.page.ts`, `PATCH /api/orders/:id` (guarda historial de cambios) |
| RF-09 Inventario | `admin.page.ts`, `POST/PUT /api/products` |
| RF-10, RNF09 Notificaciones | `notification.service.ts` (consulta cada 20 s; en producción usar push con Firebase) |
| RF-12, RNF11 Local y sincronización | `storage.service.ts`, `sync.service.ts`, `clientOpId` en el servidor |
| RNF04 Seguridad | JWT, bcrypt, rutas de administrador por rol. Falta HTTPS: se activa al desplegar el servidor |
| RNF07 Mantenibilidad | servicios y pantallas separados por módulo |
| RNF01, RNF10 Multiplataforma | Ionic + Capacitor (Android e iOS) |

## Ejecutar en desarrollo
```bash
# Terminal 1: API
cd backend && npm install && npm start        # http://localhost:3000

# Terminal 2: app
npm install
npx ionic serve                               # o: npx ng serve
```
Cuenta de administrador: `admin@magiccell.com` / `Admin123`. Los clientes se registran desde la app.

## Ejecutar en Android (emulador o celular)
```bash
npx ng build
npx cap sync android
npx cap open android      # abre Android Studio; botón Run
```
- Emulador: la app usa `http://10.0.2.2:3000/api` (ver `src/app/core/config.ts`).
- Celular físico: cambiar esa URL por la IP del computador (ej. `http://192.168.1.20:3000/api`); ambos en la misma red Wi-Fi.
- Solo desarrollo: `capacitor.config.ts` permite HTTP (`cleartext`). Quitar `server` al publicar y usar HTTPS.

## iOS
Requiere un Mac con Xcode: `npx cap add ios && npx cap sync ios && npx cap open ios`. En Info.plist agregar
`NSCameraUsageDescription` y `NSPhotoLibraryUsageDescription`. Para la tienda se necesita Apple Developer Program.


