let adminId = null;

async function adminLogin() {
  const username = document.getElementById('adminUsername').value;
  const password = document.getElementById('adminPassword').value;
  const res = await apiPost('/api/admin/login', { username, password });
  if (res.ok) {
    adminId = res.adminId;
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    loadAdminData();
  } else alert(res.error);
}

async function loadAdminData() {
  const res = await apiGet('/api/admin/data');
  const branchSelect = document.getElementById('branchSelect');
  const orderBranch = document.getElementById('orderBranch');
  branchSelect.innerHTML = '';
  orderBranch.innerHTML = '';
  res.branches.forEach(b => {
    branchSelect.innerHTML += `<option value="${b.id}">${b.name}</option>`;
    orderBranch.innerHTML += `<option value="${b.id}">${b.name}</option>`;
  });

  const itemsList = document.getElementById('itemsList');
  itemsList.innerHTML = '';
  res.items.forEach(i => {
    itemsList.innerHTML += `<li>${i.name} (${i.unit}) <button onclick="deleteItem('${i.id}')">Delete</button></li>`;
  });
}

async function createUser() {
  const username = document.getElementById('newUser').value;
  const password = document.getElementById('newPass').value;
  const branchId = document.getElementById('branchSelect').value;
  const res = await apiPost('/api/admin/users', { username, password, branchId });
  if (res.ok) alert('User created');
  else alert(res.error);
}

async function addItem() {
  const name = document.getElementById('itemName').value;
  const unit = document.getElementById('itemUnit').value;
  const res = await apiPost('/api/admin/items', { name, unit });
  if (res.ok) loadAdminData();
}

async function deleteItem(id) {
  await apiDelete('/api/admin/items/' + id);
  loadAdminData();
}

async function loadOrders() {
  const branchId = document.getElementById('orderBranch').value;
  const month = document.getElementById('orderMonth').value;
  const res = await apiGet(`/api/admin/orders?branchId=${branchId}&month=${month}`);
  const div = document.getElementById('ordersTable');
  div.innerHTML = res.orders.map(o => `<div>
    User: ${o.user.username} | Date: ${o.date} | Status: ${o.status}
    <button onclick="editOrder('${o.id}')">Edit</button>
  </div>`).join('');
}

async function editOrder(orderId) {
  const newStatus = prompt('Enter new status (resent/received/sent):');
  if (!newStatus) return;
  await apiPut('/api/admin/orders/' + orderId, { status: newStatus });
  loadOrders();
}