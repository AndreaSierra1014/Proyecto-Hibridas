// API REST de Magic Cell. Autenticación con JWT, contraseñas con bcrypt (RNF04),
// validación de inventario al confirmar pedidos (RF-05, RF-09) e idempotencia
// mediante clientOpId para no duplicar operaciones sincronizadas (RF-12, RNF11).
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const SECRET = process.env.JWT_SECRET || 'cambiar-este-secreto-en-produccion';
const DB_FILE = path.join(__dirname, 'db.json');

const seed = () => ({
  users: [
    { id: 1, name: 'Administrador', email: 'admin@magiccell.com', role: 'admin',
      passwordHash: bcrypt.hashSync('Admin123', 10) }
  ],
  products: [
    { id: 1, name: 'Galaxy A55', brand: 'Samsung', model: 'A55', reference: 'SM-A556', category: 'Celulares', price: 1499000, stock: 12, image: '', description: '128 GB, 8 GB RAM, pantalla AMOLED de 6,6 pulgadas.' },
    { id: 2, name: 'iPhone 13', brand: 'Apple', model: '13', reference: 'MLPF3', category: 'Celulares', price: 2899000, stock: 5, image: '', description: '128 GB, chip A15 Bionic, cámara dual de 12 MP.' },
    { id: 3, name: 'Redmi Note 13', brand: 'Xiaomi', model: 'Note 13', reference: '2312DRA50G', category: 'Celulares', price: 799000, stock: 20, image: '', description: '256 GB, 8 GB RAM, cámara de 108 MP.' },
    { id: 4, name: 'Cargador rápido 25 W', brand: 'Samsung', model: 'EP-T2510', reference: 'EP-T2510NBE', category: 'Accesorios', price: 69000, stock: 40, image: '', description: 'Cargador USB-C de carga rápida.' },
    { id: 5, name: 'Audífonos Bluetooth', brand: 'JBL', model: 'Tune 520BT', reference: 'JBLT520BT', category: 'Accesorios', price: 189000, stock: 0, image: '', description: 'Hasta 57 horas de batería.' },
    { id: 6, name: 'Pantalla Galaxy A55', brand: 'Samsung', model: 'A55', reference: 'GH82-A55', category: 'Componentes', price: 320000, stock: 3, image: '', description: 'Repuesto de pantalla original.' }
  ],
  orders: [],
  seq: { user: 2, product: 7, order: 1 }
});

let db = fs.existsSync(DB_FILE) ? JSON.parse(fs.readFileSync(DB_FILE, 'utf8')) : seed();
const save = () => fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
save();

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' })); // fotos de producto en base64

const sign = (u) => jwt.sign({ sub: u.id, role: u.role, name: u.name, email: u.email }, SECRET, { expiresIn: '8h' });
const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email, role: u.role });

function auth(req, res, next) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Falta el token de autenticación.' });
  try { req.user = jwt.verify(token, SECRET); next(); }
  catch { res.status(401).json({ message: 'Token inválido o vencido.' }); }
}
const adminOnly = (req, res, next) =>
  req.user.role === 'admin' ? next() : res.status(403).json({ message: 'Acceso restringido a administradores.' });

// ---- Autenticación (RF-01)
app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password || password.length < 6)
    return res.status(400).json({ message: 'Nombre, correo y contraseña de al menos 6 caracteres son obligatorios.' });
  if (db.users.some((u) => u.email.toLowerCase() === email.toLowerCase()))
    return res.status(409).json({ message: 'Ya existe una cuenta con ese correo.' });
  const user = { id: db.seq.user++, name, email, role: 'cliente', passwordHash: bcrypt.hashSync(password, 10) };
  db.users.push(user); save();
  res.status(201).json({ token: sign(user), user: publicUser(user) });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  const user = db.users.find((u) => u.email.toLowerCase() === String(email || '').toLowerCase());
  if (!user || !bcrypt.compareSync(String(password || ''), user.passwordHash))
    return res.status(401).json({ message: 'Correo o contraseña incorrectos.' });
  res.json({ token: sign(user), user: publicUser(user) });
});

// ---- Catálogo (RF-02, RF-03)
app.get('/api/products', auth, (req, res) => {
  const { q, category, available } = req.query;
  let list = db.products;
  if (q) {
    const t = String(q).toLowerCase();
    list = list.filter((p) => [p.name, p.brand, p.reference].some((x) => x.toLowerCase().includes(t)));
  }
  if (category) list = list.filter((p) => p.category === category);
  if (available === 'true') list = list.filter((p) => p.stock > 0);
  res.json(list);
});
app.get('/api/products/:id', auth, (req, res) => {
  const p = db.products.find((x) => x.id === +req.params.id);
  p ? res.json(p) : res.status(404).json({ message: 'Producto no encontrado.' });
});

// ---- Inventario (RF-09)
app.post('/api/products', auth, adminOnly, (req, res) => {
  const { name, brand, model, reference, category, price, stock, description, image } = req.body || {};
  if (!name || !brand || !reference || !(price >= 0) || !(stock >= 0))
    return res.status(400).json({ message: 'Nombre, marca, referencia, precio y cantidad son obligatorios.' });
  const p = { id: db.seq.product++, name, brand, model: model || '', reference, category: category || 'Accesorios',
    price: +price, stock: +stock, description: description || '', image: image || '' };
  db.products.push(p); save(); res.status(201).json(p);
});
app.put('/api/products/:id', auth, adminOnly, (req, res) => {
  const p = db.products.find((x) => x.id === +req.params.id);
  if (!p) return res.status(404).json({ message: 'Producto no encontrado.' });
  Object.assign(p, req.body, { id: p.id });
  save(); res.json(p);
});

// ---- Pedidos (RF-05, RF-06, RF-07, RF-08, RF-11)
app.post('/api/orders', auth, (req, res) => {
  const { items, delivery, address, clientOpId } = req.body || {};
  if (clientOpId) {
    const dup = db.orders.find((o) => o.clientOpId === clientOpId && o.userId === req.user.sub);
    if (dup) return res.status(200).json(dup); // reintento: no se duplica
  }
  if (!Array.isArray(items) || !items.length) return res.status(400).json({ message: 'El pedido no tiene productos.' });
  if (!['domicilio', 'recogida'].includes(delivery)) return res.status(400).json({ message: 'Método de entrega no válido.' });
  if (delivery === 'domicilio' && !address) return res.status(400).json({ message: 'La dirección de entrega es obligatoria.' });

  const lines = [];
  for (const it of items) {
    const p = db.products.find((x) => x.id === it.productId);
    if (!p) return res.status(400).json({ message: `Producto ${it.productId} no existe.` });
    if (it.quantity < 1 || p.stock < it.quantity)
      return res.status(409).json({ message: `Inventario insuficiente para ${p.name}. Disponibles: ${p.stock}.` });
    lines.push({ productId: p.id, name: p.name, quantity: it.quantity, unitPrice: p.price });
  }
  lines.forEach((l) => { db.products.find((x) => x.id === l.productId).stock -= l.quantity; });
  const now = new Date().toISOString();
  const order = {
    id: 'MC-' + String(db.seq.order++).padStart(5, '0'), userId: req.user.sub, customer: req.user.name,
    items: lines, total: lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0),
    delivery, address: address || '', status: 'recibido', deliveryDate: null, createdAt: now,
    clientOpId: clientOpId || null, history: [{ status: 'recibido', at: now, by: req.user.email }]
  };
  db.orders.push(order); save(); res.status(201).json(order);
});

app.get('/api/orders', auth, (req, res) => {
  const list = req.user.role === 'admin' ? db.orders : db.orders.filter((o) => o.userId === req.user.sub);
  res.json([...list].reverse());
});
app.get('/api/orders/:id', auth, (req, res) => {
  const o = db.orders.find((x) => x.id === req.params.id);
  if (!o || (req.user.role !== 'admin' && o.userId !== req.user.sub))
    return res.status(404).json({ message: 'Pedido no encontrado.' });
  res.json(o);
});
const STATES = ['recibido', 'en preparación', 'en distribución', 'entregado', 'cancelado'];
app.patch('/api/orders/:id', auth, adminOnly, (req, res) => {
  const o = db.orders.find((x) => x.id === req.params.id);
  if (!o) return res.status(404).json({ message: 'Pedido no encontrado.' });
  const { status, deliveryDate } = req.body || {};
  if (status) {
    if (!STATES.includes(status)) return res.status(400).json({ message: 'Estado no válido.' });
    if (status === 'cancelado' && o.status !== 'cancelado')
      o.items.forEach((l) => { const p = db.products.find((x) => x.id === l.productId); if (p) p.stock += l.quantity; });
    o.status = status;
    o.history.push({ status, at: new Date().toISOString(), by: req.user.email });
  }
  if (deliveryDate !== undefined) {
    o.deliveryDate = deliveryDate;
    o.history.push({ status: `fecha de entrega: ${deliveryDate}`, at: new Date().toISOString(), by: req.user.email });
  }
  save(); res.json(o);
});

app.listen(PORT, () => console.log(`API Magic Cell en http://localhost:${PORT}`));
