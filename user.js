let currentUser = null;

async function userLogin() {
  const username = document.getElementById('userUsername').value;
  const password = document.getElementById('userPassword').value;
  const res = await apiPost('/api/user/login', { username, password });
  if (res.ok) {
    currentUser = res.user;
    document.getElementById('userLogin').style.display = 'none';
    document.getElementById('userDashboard').style.display = 'block';
    loadItems();
    loadReceivedOrders();
  } else alert(res.error);
}

async function loadItems() {
  const res = await apiGet('/api/items');
  const form = document.getElementById('orderForm');
  form.innerHTML = res.items.map(i => `
    <label>${i.name} (${i.unit})</label>
    <input type="number" id="item-${i.id}" min="0" value="0"><br>
  `).join('');
}

async function createOrder() {
  const resItems = await apiGet('/api/items');
  const items = resItems.items.map(i => ({ itemId: i.id, qty: Number(document.getElementById('item-' + i.id).value) }))
    .filter(it => it.qty > 0);
  if (!items.length) return alert('Select at least one item');

  const res = await apiPost('/api/orders', { userId: currentUser.id, branchId: currentUser.branchId, items });
  if (res.ok) alert('Order created');
  else alert(res.error);
}

async function loadPastOrders() {
  const months = document.getElementById('monthsSelect').value;
  const res = await apiGet(`/api/user/${currentUser.id}/orders?months=${months}`);
  const div = document.getElementById('pastOrders');
  div.innerHTML = res.orders.map(o => `<div>${o.date} | Status: ${o.status}</div>`).join('');
}

async function loadReceivedOrders() {
  const res = await apiGet(`/api/user/${currentUser.id}/orders?months=1`);
  const div = document.getElementById('receivedOrders');
  div.innerHTML = res.orders.filter(o => o.status !== 'received').map(o => `
    <div>${o.date} | Status: ${o.status}
      <button onclick="markReceived('${o.id}')">Confirm Received</button>
    </div>`).join('');
}

async function markReceived(orderId) {
  await apiPost('/api/orders/' + orderId + '/received', {});
  loadReceivedOrders();
}