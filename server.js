const express = require("express");
const app = express();
const path = require("path");

const PORT = process.env.PORT || 10000;

// Serve frontend
app.use(express.static(path.join(__dirname, "frontend")));

// API routes
app.get("/api/test", (req, res) => {
  res.json({ message: "Server running fine 🚀" });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
// LowDB setup
const file = path.join(__dirname, 'db.json');
const adapter = new JSONFile(file);
const db = new Low(adapter);

async function initDB() {
  await db.read();
  db.data = db.data || {
    admins: [
      { id: 'admin-cheesy', username: 'Cheesyorder', password: 'Chessy$2023' }
    ],
    branches: [
      { id: 'b-cheesy', name: 'Cheesy' },
      { id: 'b-burrata', name: 'Burrata' },
      { id: 'b-koubkarak', name: 'Koubkarak' }
    ],
    users: [],
    items: [],
    orders: []
  };
  await db.write();
}

initDB();

// --- Auth endpoints (very simple) ---
app.post('/api/admin/login', async (req, res) => {
  const { username, password } = req.body;
  await db.read();
  const admin = (db.data.admins || []).find(a => a.username === username && a.password === password);
  if (!admin) return res.status(401).json({ error: 'Invalid credentials' });
  res.json({ ok: true, adminId: admin.id });
});

app.post('/api/user/login', async (req, res) => {
  const { username, password } = req.body;
  await db.read();
  const user = (db.data.users || []).find(u => u.username === username && u.password === password);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  res.json({ ok: true, user });
});

// Admin creates user
app.post('/api/admin/users', async (req, res) => {
  const { username, password, branchId } = req.body;
  await db.read();
  const exists = db.data.users.find(u => u.username === username);
  if (exists) return res.status(400).json({ error: 'Username exists' });
  const user = { id: nanoid(), username, password, branchId };
  db.data.users.push(user);
  await db.write();
  res.json({ ok: true, user });
});

// Admin: add item
app.post('/api/admin/items', async (req, res) => {
  const { name, unit } = req.body;
  await db.read();
  const item = { id: nanoid(), name, unit };
  db.data.items.push(item);
  await db.write();
  res.json({ ok: true, item });
});

// Admin: delete item
app.delete('/api/admin/items/:id', async (req, res) => {
  await db.read();
  db.data.items = db.data.items.filter(i => i.id !== req.params.id);
  await db.write();
  res.json({ ok: true });
});

// Admin: list users, items, branches
app.get('/api/admin/data', async (req, res) => {
  await db.read();
  res.json({ users: db.data.users, items: db.data.items, branches: db.data.branches });
});

// Order endpoints
// Create order (user)
app.post('/api/orders', async (req, res) => {
  const { userId, branchId, items } = req.body; // items: [{ itemId, qty }]
  await db.read();

  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  // Check if user already made order for today
  const existing = db.data.orders.find(o => o.userId === userId && o.date === today);
  if (existing) return res.status(400).json({ error: 'Order already exists for this date' });

  const order = { id: nanoid(), userId, branchId, items, status: 'sent', date: today, createdAt: new Date().toISOString() };
  db.data.orders.push(order);
  await db.write();
  res.json({ ok: true, order });
});

// Admin: get orders filtered by branch/month
app.get('/api/admin/orders', async (req, res) => {
  await db.read();
  const { branchId, month } = req.query; // month in YYYY-MM format
  let orders = db.data.orders || [];
  if (branchId) orders = orders.filter(o => o.branchId === branchId);
  if (month) orders = orders.filter(o => o.date.startsWith(month));
  // attach user info
  orders = orders.map(o => ({ ...o, user: db.data.users.find(u => u.id === o.userId) }));
  res.json({ orders });
});

// Admin: edit order and resend to user (change status to 'resent')
app.put('/api/admin/orders/:id', async (req, res) => {
  const { items, status } = req.body;
  await db.read();
  const order = db.data.orders.find(o => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: 'Not found' });
  if (items) order.items = items;
  if (status) order.status = status;
  await db.write();
  res.json({ ok: true, order });
});

// User: mark order as received
app.post('/api/orders/:id/received', async (req, res) => {
  await db.read();
  const order = db.data.orders.find(o => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: 'Not found' });
  order.status = 'received';
  await db.write();
  res.json({ ok: true, order });
});

// User: get their past orders (1 month default)
app.get('/api/user/:userId/orders', async (req, res) => {
  await db.read();
  const { userId } = req.params;
  const { months = 1 } = req.query; // months back
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - Number(months));
  const cutoffStr = cutoff.toISOString().slice(0,10);
  const orders = db.data.orders.filter(o => o.userId === userId && o.date >= cutoffStr);
  res.json({ orders });
});

// Search helper: get items list
app.get('/api/items', async (req, res) => {
  await db.read();
  res.json({ items: db.data.items });
});

// Fallback to index
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server running on', PORT));
