const API_BASE = '';

async function apiCall(endpoint, method = 'GET', body = null) {
    const token = localStorage.getItem('token');
    const opts = {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
    };
    if (body) opts.body = JSON.stringify(body);
    try {
        const r = await fetch(`/api${endpoint}`, opts);
        if (r.status === 401 && !window.location.pathname.includes('login.html')) {
            localStorage.clear();
            window.location.href = '/desktop/pages/login.html';
            return null;
        }
        const data = await r.json();
        return { ok: r.ok, data, status: r.status };
    } catch(e) {
        console.error('API Error:', e);
        return null;
    }
}

function getUser() {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
}

function getToken() {
    return localStorage.getItem('token');
}

function logout() {
    localStorage.clear();
    window.location.href = '/desktop/pages/login.html';
}

function formatCurrency(value) {
    return 'R$ ' + Number(value || 0).toFixed(2).replace('.', ',');
}

function formatDateTime(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
}

function formatDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
}

function showNotification(title, message, type = 'info') {
    const colors = { success: '#22c55e', error: '#ef4444', warning: '#f59e0b', info: '#3b82f6' };
    const notif = document.createElement('div');
    notif.style.cssText = `position:fixed;top:20px;right:20px;z-index:9999;background:#1e1e2e;border-left:4px solid ${colors[type]};color:#fff;padding:14px 20px;border-radius:10px;box-shadow:0 4px 20px rgba(0,0,0,0.3);min-width:280px;font-family:'DM Sans',sans-serif;`;
    notif.innerHTML = `<div style="font-weight:700;margin-bottom:4px;">${title}</div><div style="font-size:13px;opacity:0.8;">${message}</div>`;
    document.body.appendChild(notif);
    setTimeout(() => notif.remove(), 3500);
}

function showToast(msg, type = 'success') {
    showNotification(type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️', msg, type);
}

// Badge delivery sidebar
async function atualizarBadgeDelivery() {
  const r = await apiCall('/delivery/pedidos/aguardando/count');
  const total = r?.data?.count || 0;
  const link = Array.from(document.querySelectorAll('a.nav-item')).find(a => a.href.includes('delivery-painel'));
  if (!link) return;
  let badge = link.querySelector('.badge-delivery');
  if (total > 0) {
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'badge-delivery';
      badge.style.cssText = 'margin-left:auto;background:#f59e0b;color:#000;border-radius:20px;padding:1px 7px;font-size:11px;font-weight:800;';
      link.style.justifyContent = 'flex-start';
      link.appendChild(badge);
    }
    badge.textContent = total;
  } else {
    if (badge) badge.remove();
  }
}
// Verificar autenticação
const user = getUser();
const token = getToken();
if (!user || !token) {
    if (!window.location.pathname.includes('login.html')) {
        window.location.href = '/desktop/pages/login.html';
    }
}
document.addEventListener('DOMContentLoaded', () => {
  if (user && token) {
    atualizarBadgeDelivery();
    setInterval(atualizarBadgeDelivery, 10000);
  }
});