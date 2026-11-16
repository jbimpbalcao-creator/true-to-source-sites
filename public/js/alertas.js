// Sistema de Alertas Global — Sabor na Brasa
let _wsAlertas = null;
let _somAtivado = false;
let _pedidosNovos = [];

function iniciarAlertas() {
  _conectarWS();
  _criarBotaoSom();
  _criarPainelAlertas();
  setInterval(_conectarWS, 10000);
}

function _conectarWS() {
  if (_wsAlertas && _wsAlertas.readyState === WebSocket.OPEN) return;
  const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
  _wsAlertas = new WebSocket(`${proto}//${location.hostname}`);
  _wsAlertas.onmessage = (e) => {
    try {
      const msg = JSON.parse(e.data);
      if (msg.type === 'novo_pedido_delivery') {
        // Não mostrar alerta de delivery no app garçom
        if (window.location.pathname.includes('app-garcom')) return;
        const order = msg.data.order;
        _pedidosNovos.push(order);
        _tocarSom();
        _mostrarAlerta(order);
      }
      if (msg.type === 'pedido_aguardando_aprovacao') {
        const order = msg.data.order;
        _tocarSom();
        _mostrarAlertaQR(order);
      }
    } catch(e) {}
  };
  _wsAlertas.onclose = () => setTimeout(_conectarWS, 3000);
}

function _tocarSom() {
  if (!_somAtivado) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [880,1100,880,1100].forEach((freq,i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.4, ctx.currentTime + i*0.18);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i*0.18 + 0.15);
      osc.start(ctx.currentTime + i*0.18);
      osc.stop(ctx.currentTime + i*0.18 + 0.15);
    });
  } catch(e) {}
}

function _criarBotaoSom() {
  const btn = document.createElement('button');
  btn.id = 'btnSomGlobal';
  btn.innerHTML = '🔇';
  btn.title = 'Clique para ativar alertas sonoros';
  btn.style.cssText = `
    position:fixed;bottom:20px;right:20px;z-index:9998;
    width:44px;height:44px;border-radius:50%;
    background:#f59e0b;border:none;font-size:20px;
    cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,0.3);
    transition:all .2s;
  `;
  btn.onclick = () => {
    _somAtivado = !_somAtivado;
    btn.innerHTML = _somAtivado ? '🔔' : '🔇';
    btn.style.background = _somAtivado ? '#22c55e' : '#f59e0b';
    if (_somAtivado) _tocarSom();
    localStorage.setItem('somAtivado', _somAtivado ? '1' : '0');
  };
  document.body.appendChild(btn);
  // Restaurar preferência
  if (localStorage.getItem('somAtivado') === '1') {
    _somAtivado = true;
    btn.innerHTML = '🔔';
    btn.style.background = '#22c55e';
  }
}

function _criarPainelAlertas() {
  const painel = document.createElement('div');
  painel.id = 'painelAlertas';
  painel.style.cssText = `
    position:fixed;top:20px;right:20px;z-index:9999;
    display:flex;flex-direction:column;gap:10px;
    max-width:320px;
  `;
  document.body.appendChild(painel);
}

async function aceitarDelivery(orderId, card) {
  try {
    const token = localStorage.getItem('token') || localStorage.getItem('garcom_token');
    const r = await fetch(`/api/delivery/pedido/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'PREPARING' })
    });
    if (r.ok) {
      if (card) {
        card.style.borderColor = '#22c55e';
        card.querySelector('.alerta-actions').innerHTML = '<div style="color:#22c55e;font-weight:700;font-size:13px;text-align:center;">✅ Aceito! Em preparo...</div>';
        setTimeout(() => { if (card.parentElement) card.remove(); }, 2000);
      }
    }
  } catch(e) {}
}

function _mostrarAlerta(order) {
  const painel = document.getElementById('painelAlertas');
  if (!painel) return;
  const card = document.createElement('div');
  card.id = 'alerta-del-' + order.id;
  card.style.cssText = `
    background:#1a1a2e;border:2px solid #ff6b35;border-radius:14px;
    padding:16px;box-shadow:0 8px 32px rgba(255,107,53,0.4);
    animation:slideIn .3s ease;
  `;
  const tipo = order.tipoEntrega === 'retirada' ? '🏃 Retirada' : '🛵 Delivery';
  const cliente = order.clienteNome || order.customerName || 'Cliente';
  const total = 'R$ ' + Number(order.total||0).toFixed(2).replace('.',',');
  card.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">
      <div style="font-family:'Syne',sans-serif;font-size:14px;font-weight:800;color:#fff;">🛵 Novo Pedido!</div>
      <button onclick="this.parentElement.parentElement.remove()" style="background:none;border:none;color:rgba(255,255,255,0.4);font-size:18px;cursor:pointer;line-height:1;">✕</button>
    </div>
    <div style="font-size:13px;color:rgba(255,255,255,0.8);margin-bottom:4px;">${tipo} — ${cliente}</div>
    <div style="font-size:16px;font-weight:800;color:#ff6b35;margin-bottom:10px;">${total}</div>
    <div style="display:flex;gap:6px;">
      ${!window.location.pathname.includes('app-garcom') ? `<a href="/desktop/pages/delivery-painel.html" style="flex:1;padding:10px;background:var(--surface2,#22223a);border:1px solid rgba(255,255,255,0.1);border-radius:9px;color:#fff;font-weight:700;font-size:13px;text-align:center;text-decoration:none;display:flex;align-items:center;justify-content:center;">👁 Ver Pedido</a>` : ''}
      <button onclick="aceitarDelivery('${order.id}',this.closest('[id^=alerta-del]'))" style="flex:1;padding:10px;background:linear-gradient(135deg,#ff4500,#ff6b35);border:none;border-radius:9px;color:#fff;font-weight:700;font-size:13px;cursor:pointer;">✅ Aceitar</button>
    </div>
  `;
  painel.appendChild(card);
  // Auto remover após 30 segundos
  setTimeout(() => { if (card.parentElement) card.remove(); }, 30000);
  // Piscar título
  let blink = true;
  const origTitle = document.title;
  const blinkInterval = setInterval(() => {
    document.title = blink ? '🔴 NOVO PEDIDO!' : origTitle;
    blink = !blink;
  }, 800);
  setTimeout(() => { clearInterval(blinkInterval); document.title = origTitle; }, 15000);
}

async function _aprovarPedidoAlerta(orderId, card) {
  try {
    const token = localStorage.getItem('token');
    const r = await fetch(`/api/cardapio/pedidos/${orderId}/aprovar`, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' }
    });
    const data = await r.json();
    if (r.ok) {
      if (typeof loadTables === 'function') loadTables();
      if (card.parentElement) card.remove();
    } else {
      card.querySelector('.alerta-actions').innerHTML = `<div style="color:#ef4444;font-size:12px;">${data.error||'Erro ao aprovar'}</div>`;
    }
  } catch(e) {
    console.error('Erro ao aprovar:', e);
  }
}

function _mostrarAlertaQR(order) {
  const painel = document.getElementById('painelAlertas');
  if (!painel) return;
  // Verificar se já existe alerta para este pedido
  if (document.getElementById('alerta-'+order.id)) return;
  const card = document.createElement('div');
  card.id = 'alerta-' + order.id;
  card.style.cssText = `
    background:#1a1a2e;border:2px solid #22c55e;border-radius:14px;
    padding:16px;box-shadow:0 8px 32px rgba(34,197,94,0.3);
    animation:slideIn .3s ease;
  `;
  const mesa = order.table?.number || order.tableNumber || '?';
  const cliente = order.clienteNome || order.customerName || '?';
  const itens = (order.items||[]).map(i=>`${i.quantity}× ${i.product?.name||'Item'}`).join(', ');
  card.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">
      <div style="font-family:'Syne',sans-serif;font-size:14px;font-weight:800;color:#fff;">📱 Pedido QR Code!</div>
      <button onclick="this.parentElement.parentElement.remove()" style="background:none;border:none;color:rgba(255,255,255,0.4);font-size:18px;cursor:pointer;line-height:1;">✕</button>
    </div>
    <div style="font-size:13px;color:rgba(255,255,255,0.8);margin-bottom:4px;font-weight:700;">Mesa ${mesa} — ${cliente}</div>
    <div style="font-size:11px;color:rgba(255,255,255,0.5);margin-bottom:10px;">${itens}</div>
    <div class="alerta-actions" style="display:flex;gap:6px;">
      <button onclick="_aprovarPedidoAlerta('${order.id}',this.closest('[id^=alerta]'))" style="flex:1;padding:10px;background:linear-gradient(135deg,#16a34a,#22c55e);border:none;border-radius:9px;color:#fff;font-weight:700;font-size:13px;cursor:pointer;">✅ Aprovar</button>
      <a href="/desktop/pages/tables.html" style="flex:1;padding:10px;background:rgba(255,255,255,0.08);border:none;border-radius:9px;color:#fff;font-weight:700;font-size:13px;text-align:center;text-decoration:none;display:flex;align-items:center;justify-content:center;">Ver Mesa</a>
    </div>
  `;
  painel.appendChild(card);
  setTimeout(() => { if (card.parentElement) card.remove(); }, 60000);
  // Piscar título
  let blink = true;
  const origTitle = document.title;
  const blinkInterval = setInterval(() => {
    document.title = blink ? '📱 PEDIDO QR CODE!' : origTitle;
    blink = !blink;
  }, 800);
  setTimeout(() => { clearInterval(blinkInterval); document.title = origTitle; }, 15000);
}

// CSS animação
const style = document.createElement('style');
style.textContent = `@keyframes slideIn{from{transform:translateX(100%);opacity:0;}to{transform:translateX(0);opacity:1;}}`;
document.head.appendChild(style);

// Iniciar quando DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', iniciarAlertas);
} else {
  iniciarAlertas();
}
