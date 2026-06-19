// ===== SinDeudas/SemDívidas app.js — Modo prueba (sin auth) =====

const DEFAULT_DATA = {
  version: 1,
  config: {
    ingresoMensual: 0,
    gastosFijos: 0,
    moneda: '$',
    divisa: 'MXN',
    recordatorios: false,
    lastReminder: '',
    onboardingDone: false,
    syncKey: '',
    syncEnabled: false,
    syncLastTime: '',
    sobres: {
      '🍎 Alimentación': 0,
      '🏠 Vivienda': 0,
      '🚗 Transporte': 0,
      '💊 Salud': 0,
      '🎬 Ocio': 0,
      '💡 Servicios': 0,
      '📦 Otros': 0
    }
  },
  transacciones: [],
  deudas: [],
  pagosDeuda: [],
  metas: [],
  reto52: { activo: false, montoSemanal: 50, semanas: [] },
  streaks: { count: 0, lastActiveDate: null },
  suenos: []
};

let data = JSON.parse(JSON.stringify(DEFAULT_DATA));
let selectedTipo = 'i';
let selectedCat = '';
let selectedOwner = 'conjunta';
const OWNERS = {
  conjunta: '🤝 Conjunta',
  eu: '👤 Yo',
  parceiro: '👤 Pareja',
  filho: '👶 Hijo(a)'
};
let modalDeudaEditId = null;
let modalMetaEditId = null;
let abonoDeudaId = null;
let abonoMetaId = null;
let deferredInstallPrompt = null;

const CATS_GASTO  = ['🍎 Alimentación','🏠 Vivienda','🚗 Transporte','💊 Salud','🎬 Ocio','💡 Servicios','📚 Educación','📦 Otros'];
const CATS_INGRESO = ['💼 Sueldo','💻 Freelance','🎁 Regalo','📈 Extra','📦 Otros'];

const MESES_ES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
const DIAS_ES  = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];

// ===== STORAGE =====
function loadData() {
  try {
    const raw = localStorage.getItem('sd_data');
    if (raw) {
      const parsed = JSON.parse(raw);
      data = Object.assign({}, DEFAULT_DATA, parsed);
      data.config = Object.assign({}, DEFAULT_DATA.config, parsed.config || {});
      data.config.sobres = Object.assign({}, DEFAULT_DATA.config.sobres, (parsed.config || {}).sobres || {});
      data.reto52 = Object.assign({}, DEFAULT_DATA.reto52, parsed.reto52 || {});
      data.streaks = Object.assign({}, DEFAULT_DATA.streaks, parsed.streaks || {});
      data.suenos = parsed.suenos || [];
    }
  } catch(e) {
    data = JSON.parse(JSON.stringify(DEFAULT_DATA));
  }
}
function saveData() {
  localStorage.setItem('sd_data', JSON.stringify(data));
  if (data.config && data.config.syncEnabled) {
    setTimeout(() => {
      // Background sync, suppress full toasts to keep background flow quiet
      const key = data.config.syncKey;
      let remoteDb = localStorage.getItem('sd_cloud_db_' + key);
      if (remoteDb) remoteDb = JSON.parse(remoteDb);
      const merged = mergeData(data, remoteDb);
      data = merged;
      localStorage.setItem('sd_data', JSON.stringify(data));
      localStorage.setItem('sd_cloud_db_' + key, JSON.stringify(data));
      data.config.syncLastTime = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
      localStorage.setItem('sd_data', JSON.stringify(data));
      const statusEl = document.getElementById('lbl-sync-status');
      if (statusEl) statusEl.textContent = 'Estado: Sincronizado ' + data.config.syncLastTime;
    }, 10);
  }
}

// ===== UTILS =====
function uid() {
  return (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);
}
const DIVISAS = {
  MXN: { sym: '$',   loc: 'es-MX', dec: 2, nombre: 'Peso mexicano' },
  COP: { sym: '$',   loc: 'es-CO', dec: 0, nombre: 'Peso colombiano' },
  CLP: { sym: '$',   loc: 'es-CL', dec: 0, nombre: 'Peso chileno' },
  ARS: { sym: '$',   loc: 'es-AR', dec: 2, nombre: 'Peso argentino' },
  PEN: { sym: 'S/',  loc: 'es-PE', dec: 2, nombre: 'Sol peruano' },
  USD: { sym: '$',   loc: 'en-US', dec: 2, nombre: 'Dólar (USD)' },
  UYU: { sym: '$U',  loc: 'es-UY', dec: 2, nombre: 'Peso uruguayo' },
  PYG: { sym: '₲',   loc: 'es-PY', dec: 0, nombre: 'Guaraní' },
  BOB: { sym: 'Bs',  loc: 'es-BO', dec: 2, nombre: 'Boliviano' },
  VES: { sym: 'Bs.', loc: 'es-VE', dec: 2, nombre: 'Bolívar' },
  GTQ: { sym: 'Q',   loc: 'es-GT', dec: 2, nombre: 'Quetzal' },
  CRC: { sym: '₡',   loc: 'es-CR', dec: 0, nombre: 'Colón' },
  DOP: { sym: 'RD$', loc: 'es-DO', dec: 2, nombre: 'Peso dominicano' },
  HNL: { sym: 'L',   loc: 'es-HN', dec: 2, nombre: 'Lempira' },
  NIO: { sym: 'C$',  loc: 'es-NI', dec: 2, nombre: 'Córdoba' },
  EUR: { sym: '€',   loc: 'es-ES', dec: 2, nombre: 'Euro' }
};
function getDivisa() {
  const cfg = data.config || {};
  if (cfg.divisa && DIVISAS[cfg.divisa]) return DIVISAS[cfg.divisa];
  const symMap = { '$':'MXN', 'S/':'PEN', 'Q':'GTQ', '₡':'CRC', 'Bs.':'VES', 'Bs':'BOB', '€':'EUR', '₲':'PYG', 'RD$':'DOP', 'L':'HNL', 'C$':'NIO', '$U':'UYU' };
  return DIVISAS[symMap[cfg.moneda] || 'MXN'];
}
function fmt(n) {
  const c = getDivisa();
  const num = Number(n) || 0;
  return c.sym + num.toLocaleString(c.loc, { minimumFractionDigits: c.dec, maximumFractionDigits: c.dec });
}
function gastosPorResponsable() {
  const tot = {};
  (data.transacciones || []).forEach(t => {
    if (t.tipo !== 'g') return;
    const o = t.responsable || 'conjunta';
    tot[o] = (tot[o] || 0) + (parseFloat(t.monto) || 0);
  });
  return Object.keys(tot)
    .map(o => ({ owner: o, label: OWNERS[o] || o, total: tot[o] }))
    .sort((a, b) => b.total - a.total);
}
function toast(msg, duration) {
  duration = duration || 2800;
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), duration);
}
function triggerConfetti() {
  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '9999';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const width = window.innerWidth;
  const height = window.innerHeight;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.scale(dpr, dpr);

  const particles = [];
  const colors = ['#10b981', '#34d399', '#0ea5e9', '#38bdf8', '#f59e0b', '#fbbf24', '#8b5cf6', '#a78bfa', '#ec4899'];

  for (let i = 0; i < 120; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * -height - 20,
      size: Math.random() * 6 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      speedX: Math.random() * 4 - 2,
      speedY: Math.random() * 5 + 3,
      rotation: Math.random() * 360,
      rotationSpeed: Math.random() * 10 - 5
    });
  }

  let startTime = Date.now();

  function animate() {
    ctx.clearRect(0, 0, width, height);

    let active = false;
    particles.forEach(p => {
      p.y += p.speedY;
      p.x += p.speedX;
      p.rotation += p.rotationSpeed;

      if (p.y < height) {
        active = true;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation * Math.PI / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      }
    });

    if (active && Date.now() - startTime < 3000) {
      requestAnimationFrame(animate);
    } else {
      canvas.remove();
    }
  }

  animate();
}
function openModal(id) {
  document.getElementById(id).classList.add('open');
}
function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}
function navTo(viewId, el) {
  document.querySelectorAll('.vista').forEach(v => v.classList.remove('active'));
  const view = document.getElementById(viewId);
  if (view) view.classList.add('active');
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  if (el) {
    el.classList.add('active');
  } else {
    const btn = document.querySelector('.nav-item[data-view="' + viewId + '"]');
    if (btn) btn.classList.add('active');
  }

  // Lógica da seta de voltar
  const btnBack = document.getElementById('btn-back');
  const headerLeft = document.querySelector('.header-left');
  if (viewId === 'v-dashboard') {
    if (btnBack) btnBack.classList.add('hidden');
    if (headerLeft) headerLeft.style.display = 'block';
    renderDashboard();
  } else {
    if (btnBack) btnBack.classList.remove('hidden');
    if (headerLeft) headerLeft.style.display = 'none';
  }

  if (viewId === 'v-deudas')    renderDeudas();
  if (viewId === 'v-registro')  renderRegistro();
  if (viewId === 'v-metas')     renderMetas();
  if (viewId === 'v-perfil')    renderPerfil();
}
function setTipo(tipo) {
  selectedTipo = tipo;
  const btnI = document.getElementById('tipo-ingreso');
  const btnG = document.getElementById('tipo-gasto');
  if (tipo === 'i') {
    btnI.className = 'tipo-btn active-i';
    btnG.className = 'tipo-btn';
    btnI.textContent = '💚 ' + T('reg_ingreso');
    btnG.textContent = '🔴 ' + T('reg_gasto');
  } else {
    btnG.className = 'tipo-btn active-g';
    btnI.className = 'tipo-btn';
    btnI.textContent = '💚 ' + T('reg_ingreso');
    btnG.textContent = '🔴 ' + T('reg_gasto');
  }
  renderCategoryChips();
}

// ===== MONTH HELPERS =====
function getMesActual() {
  const now = new Date();
  const inicio = new Date(now.getFullYear(), now.getMonth(), 1);
  const fin    = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  return { inicio, fin };
}
function getTxsMes() {
  const { inicio, fin } = getMesActual();
  return data.transacciones.filter(t => {
    const d = new Date(t.fecha);
    return d >= inicio && d <= fin;
  });
}

// ===== RENDER DASHBOARD =====
function renderDashboard() {
  const txs      = getTxsMes();
  const ingresos = txs.filter(t => t.tipo === 'i').reduce((s,t) => s + t.monto, 0);
  const gastos   = txs.filter(t => t.tipo === 'g').reduce((s,t) => s + t.monto, 0);
  const saldo    = ingresos - gastos;

  // Libertad de Deudas Widget
  const totalInicialDeuda = data.deudas.reduce((sum, d) => sum + (parseFloat(d.saldoInicial) || parseFloat(d.saldoActual) || 0), 0);
  const totalActualDeuda = data.deudas.reduce((sum, d) => sum + (parseFloat(d.saldoActual) || 0), 0);
  const deudasPagadas = Math.max(0, totalInicialDeuda - totalActualDeuda);
  const pctLibertad = totalInicialDeuda > 0 ? Math.round((deudasPagadas / totalInicialDeuda) * 100) : 100;
  const pctLibertadClamped = Math.min(100, Math.max(0, pctLibertad));

  const libPctEl = document.getElementById('widget-libertad-pct');
  const libBarEl = document.getElementById('widget-libertad-bar');
  const libDescEl = document.getElementById('widget-libertad-desc');

  if (libPctEl && libBarEl && libDescEl) {
    libPctEl.textContent = `${pctLibertadClamped}%`;
    libBarEl.style.width = `${pctLibertadClamped}%`;
    if (totalActualDeuda === 0) {
      libDescEl.textContent = '🎉 ¡Estás libre de deudas!';
    } else {
      libDescEl.textContent = `Faltan ${fmt(totalActualDeuda)} por pagar`;
    }
  }

  // Progreso de Ahorros Widget
  const totalMetaObjetivo = data.metas.reduce((sum, m) => sum + (parseFloat(m.montoObjetivo) || 0), 0);
  const totalMetaAhorrado = data.metas.reduce((sum, m) => sum + (parseFloat(m.ahorrado) || 0), 0);
  const pctAhorros = totalMetaObjetivo > 0 ? Math.round((totalMetaAhorrado / totalMetaObjetivo) * 100) : 0;
  const pctAhorrosClamped = Math.min(100, Math.max(0, pctAhorros));

  const savePctEl = document.getElementById('widget-ahorros-pct');
  const saveBarEl = document.getElementById('widget-ahorros-bar');
  const saveDescEl = document.getElementById('widget-ahorros-desc');

  if (savePctEl && saveBarEl && saveDescEl) {
    savePctEl.textContent = `${pctAhorrosClamped}%`;
    saveBarEl.style.width = `${pctAhorrosClamped}%`;
    if (totalMetaObjetivo === 0) {
      saveDescEl.textContent = 'Crea tu primera meta';
    } else {
      saveDescEl.textContent = `${fmt(totalMetaAhorrado)} ahorrados de ${fmt(totalMetaObjetivo)}`;
    }
  }

  // Draw Cash Flow Chart
  drawCashFlowChart();

  document.getElementById('dash-saldo-label').textContent = '💰 ' + T('dash_saldo');
  const saldoEl = document.getElementById('dash-saldo-valor');
  saldoEl.textContent = fmt(saldo);
  saldoEl.style.color = saldo >= 0 ? '#fff' : '#fca5a5';
  document.getElementById('dash-ingresos').textContent = fmt(ingresos);
  document.getElementById('dash-gastos').textContent   = fmt(gastos);
  document.getElementById('dash-sobres-titulo').textContent = '📊 ' + T('dash_sobres_titulo');
  document.getElementById('dash-mov-titulo').textContent    = '🕐 ' + T('dash_movimientos');

  // Score de Salud Financiera
  const hs = calcularHealthScore();
  const scoreNumberEl = document.getElementById('score-number');
  const scoreLabelEl = document.getElementById('score-label');
  const scoreRingEl = document.getElementById('score-ring-progress');
  const scoreMotivationalEl = document.getElementById('dash-motivational-msg');
  
  if (scoreNumberEl && scoreLabelEl && scoreRingEl && scoreMotivationalEl) {
    scoreNumberEl.textContent = hs.score;
    scoreLabelEl.textContent = hs.level;
    scoreLabelEl.style.color = hs.color;
    scoreRingEl.setAttribute('stroke', hs.color);
    scoreRingEl.setAttribute('stroke-dasharray', `${hs.score}, 100`);
    scoreMotivationalEl.textContent = getMotivationalMessage(hs.score);
  }

  // Racha activa (Streak)
  const streakBadgeEl = document.getElementById('dash-streak-badge');
  if (streakBadgeEl) {
    const streakCount = (data.streaks && data.streaks.count) ? data.streaks.count : 0;
    streakBadgeEl.textContent = `🔥 ${streakCount} ${streakCount === 1 ? 'día' : 'días'}`;
  }

  // Insight Financiero
  const insightContentEl = document.getElementById('dash-insight-content');
  if (insightContentEl) {
    insightContentEl.textContent = calcularInsights();
  }

  // Sobres
  const sobresContainer = document.getElementById('dash-sobres-container');
  sobresContainer.innerHTML = '';
  const sobres = data.config.sobres;
  const tienePresupuesto = Object.values(sobres).some(v => v > 0);
  if (!tienePresupuesto) {
    sobresContainer.innerHTML = `<p style="font-size:13px;color:var(--text-muted);font-weight:600;">Configura tus sobres en <b>Perfil</b>.</p>`;
  } else {
    const grid = document.createElement('div');
    grid.className = 'sobres-grid';
    
    Object.entries(sobres).forEach(([nombre, presupuesto]) => {
      if (!presupuesto) return;
      const emoji = nombre.split(' ')[0];
      const cleanNombre = nombre.replace(/^[^\wÀ-ž]*/, '').trim();
      const nombreTrad = T('cat_' + cleanNombre);
      const keyword = cleanNombre.toLowerCase();
      const gastadoSobre = txs
        .filter(t => t.tipo === 'g' && t.categoria && t.categoria.toLowerCase().includes(keyword))
        .reduce((s,t) => s + t.monto, 0);
      const pct  = Math.round((gastadoSobre / presupuesto) * 100);
      const pctWidth = Math.min(pct, 100);
      const over = gastadoSobre > presupuesto;
      const restante = Math.max(0, presupuesto - gastadoSobre);
      
      const item = document.createElement('div');
      item.className = 'sobre-card';
      item.innerHTML = `
        <div class="sobre-card-header">
          <div class="sobre-card-icon-title">
            <span class="sobre-card-emoji">${emoji}</span>
            <span class="sobre-card-title">${nombreTrad}</span>
          </div>
          <span class="sobre-card-pct${over?' over':''}">${pct}%</span>
        </div>
        <div class="sobre-bar-wrap">
          <div class="sobre-bar${over?' over':''}" style="width:${pctWidth}%"></div>
        </div>
        <div class="sobre-card-amounts">
          <div>
            <div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;font-weight:700;">Disponible</div>
            <div class="sobre-card-leftover">${fmt(restante)}</div>
          </div>
          <span class="sobre-card-total">de ${fmt(presupuesto)}</span>
        </div>`;
      grid.appendChild(item);
    });
    sobresContainer.appendChild(grid);
  }

  // Próximos Pagos Widget
  const upcomingCard = document.getElementById('upcoming-payments-card');
  const upcomingList = document.getElementById('upcoming-payments-list');
  if (upcomingCard && upcomingList) {
    const activeDeudas = data.deudas.filter(d => d.saldoActual > 0.01);
    if (activeDeudas.length === 0) {
      upcomingCard.style.display = 'none';
    } else {
      upcomingCard.style.display = 'block';
      upcomingList.innerHTML = '';
      
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      activeDeudas.forEach(d => {
        const pagadoEsteMes = data.pagosDeuda.some(p => {
          if (p.deudaId !== d.id) return false;
          const pDate = new Date(p.fecha);
          return pDate.getMonth() === currentMonth && pDate.getFullYear() === currentYear;
        });
        
        const row = document.createElement('div');
        row.style.cssText = 'display:flex; justify-content:space-between; align-items:center; padding:10px 12px; background:var(--bg-2); border:1px solid var(--border); border-radius:10px;';
        
        if (pagadoEsteMes) {
          row.innerHTML = `
            <div>
              <div style="font-size:13.5px; font-weight:800; color:var(--text-muted); text-decoration:line-through;">${d.nombre}</div>
              <div style="font-size:11px; color:#10b981; font-weight:700; margin-top:2px;">✅ Pagado este mes</div>
            </div>
            <div style="font-size:13.5px; font-weight:800; color:var(--text-muted); text-decoration:line-through;">${fmt(d.pagoMinimo)}</div>
          `;
        } else {
          row.innerHTML = `
            <div>
              <div style="font-size:13.5px; font-weight:800; color:var(--text-main);">${d.nombre}</div>
              <div style="font-size:11px; color:var(--warning); font-weight:700; margin-top:2px;">⏳ Pago mínimo pendiente</div>
            </div>
            <div style="display:flex; align-items:center; gap:10px;">
              <span style="font-size:13.5px; font-weight:800; color:var(--text-main);">${fmt(d.pagoMinimo)}</span>
              <button class="btn btn-primary" style="min-height:30px; padding:6px 12px; font-size:11.5px; width:auto; border-radius:6px;" data-pay-deuda="${d.id}">Pagar</button>
            </div>
          `;
          const btn = row.querySelector('[data-pay-deuda]');
          btn.addEventListener('click', () => openAbonoModal(d.id));
        }
        upcomingList.appendChild(row);
      });
    }
  }

  // Últimos 8 movimientos
  const movContainer = document.getElementById('dash-movimientos');
  movContainer.innerHTML = '';
  const last8 = [...data.transacciones].sort((a,b) => new Date(b.fecha)-new Date(a.fecha)).slice(0,8);
  if (!last8.length) {
    movContainer.innerHTML = `<p style="font-size:13px;color:var(--text-muted);font-weight:600;">${T('dash_sin_mov')}</p>`;
  } else {
    last8.forEach(tx => movContainer.appendChild(buildMovRow(tx, false)));
  }
}

function buildMovRow(tx, showDelete) {
  const row  = document.createElement('div');
  row.className = 'mov-row';
  const icon    = tx.tipo === 'i' ? '💚' : (tx.categoria ? tx.categoria.split(' ')[0] : '📊');
  const d       = new Date(tx.fecha);
  const dateStr = d.getDate() + ' de ' + MESES_ES[d.getMonth()];
  const sign    = tx.tipo === 'i' ? '+' : '-';
  const color   = tx.tipo === 'i' ? 'var(--ok)' : 'var(--danger)';
  const cleanCat = (tx.categoria || '').replace(/^[^\wÀ-ž]*/, '').trim();
  const catTrad  = T('cat_' + cleanCat);
  const nomeTrad = tx.descripcion || catTrad || (tx.tipo==='i' ? T('reg_ingreso') : T('reg_gasto'));
  const ownerLbl = (tx.responsable && OWNERS[tx.responsable]) ? ' · ' + OWNERS[tx.responsable] : '';
  row.innerHTML = `
    <div class="mov-emoji">${icon}</div>
    <div class="mov-info">
      <div class="mov-nome">${nomeTrad}</div>
      <div class="mov-data">${catTrad} · ${dateStr}${ownerLbl}</div>
    </div>
    <div class="mov-monto" style="color:${color}">${sign}${fmt(tx.monto)}</div>
    ${showDelete ? `<button class="mov-del" onclick="eliminarMovimiento('${tx.id}')">✕</button>` : ''}`;
  return row;
}

window.eliminarMovimiento = function(id) {
  if (confirm('¿Eliminar este movimiento?')) {
    data.transacciones = data.transacciones.filter(t => t.id !== id);
    saveData();
    toast(T('reg_eliminar_toast'));
    if (document.getElementById('v-dashboard').classList.contains('active')) renderDashboard();
    if (document.getElementById('v-registro').classList.contains('active')) {
      renderHistorialMes();
      renderDashboard();
    }
  }
}

// ===== SNOWBALL METHOD =====
function calcularSnowball() {
  const deudas = data.deudas;
  if (!deudas.length) return { deudas: [], fechaLibertad: null, extraMensual: 0, interesAhorrado: 0, mesesAhorrados: 0 };

  const totalMinimos  = deudas.reduce((s,d) => s + (parseFloat(d.pagoMinimo) || 0), 0);
  const extraMensual  = Math.max(0, (parseFloat(data.config.ingresoMensual) || 0) - (parseFloat(data.config.gastosFijos) || 0) - totalMinimos);

  const hoy = new Date();
  
  // 1. Simulación Snowball (acumulando interés pagado)
  const saldos = deudas.map(d => ({
    ...d,
    saldo:     parseFloat(d.saldoActual) || 0,
    mesLibre:  null,
    fechaLibre: null
  })).sort((a,b) => a.saldoActual - b.saldoActual);

  let extraPool = extraMensual;
  let interesTotalSnowball = 0;

  for (let mes = 1; mes <= 600; mes++) {
    const activos = saldos.filter(d => d.saldo > 0.01);
    if (!activos.length) break;
    const focus = activos[0];

    for (const d of activos) {
      const interes = d.saldo * ((parseFloat(d.tasaInteres) || 0) / 100);
      interesTotalSnowball += interes;
      d.saldo += interes;
      let pago = parseFloat(d.pagoMinimo) || 0;
      if (d.id === focus.id) pago += extraPool;
      pago = Math.min(pago, d.saldo);
      d.saldo -= pago;
      if (d.saldo <= 0.01 && d.mesLibre === null) {
        d.saldo = 0;
        d.mesLibre = mes;
        const f = new Date(hoy);
        f.setMonth(f.getMonth() + mes);
        d.fechaLibre = f;
        extraPool += (parseFloat(d.pagoMinimo) || 0);
      }
    }
  }

  const pagadas   = saldos.filter(d => d.fechaLibre);
  const ultimaDeu = pagadas.sort((a,b) => b.mesLibre - a.mesLibre)[0];
  const mesesTotales = ultimaDeu ? ultimaDeu.mesLibre : 0;

  // 2. Simulación Solo Mínimos (para calcular el ahorro)
  const saldosMinimos = deudas.map(d => ({
    ...d,
    saldo: parseFloat(d.saldoActual) || 0
  }));
  let interesTotalMinimos = 0;
  let mesesMinimos = 0;
  for (let mes = 1; mes <= 600; mes++) {
    const activos = saldosMinimos.filter(d => d.saldo > 0.01);
    if (!activos.length) {
      mesesMinimos = mes - 1;
      break;
    }
    for (const d of activos) {
      const interes = d.saldo * ((parseFloat(d.tasaInteres) || 0) / 100);
      interesTotalMinimos += interes;
      d.saldo += interes;
      let pago = parseFloat(d.pagoMinimo) || 0;
      pago = Math.min(pago, d.saldo);
      d.saldo -= pago;
    }
    if (mes === 600) {
      mesesMinimos = 600;
    }
  }

  const interesAhorrado = Math.max(0, interesTotalMinimos - interesTotalSnowball);
  const mesesAhorrados = Math.max(0, mesesMinimos - mesesTotales);

  return {
    deudas:        saldos,
    fechaLibertad: ultimaDeu ? ultimaDeu.fechaLibre : null,
    mesesTotales:  ultimaDeu ? ultimaDeu.mesLibre   : null,
    extraMensual,
    interesAhorrado,
    mesesAhorrados
  };
}

// ===== RENDER DEUDAS =====
function renderDeudas() {
  document.getElementById('deudas-titulo').textContent  = '💳 ' + T('deudas_titulo');
  document.getElementById('btn-nueva-deuda').textContent = T('deudas_btn_nueva');

  const heroWrap  = document.getElementById('libertad-hero-wrap');
  const listEl    = document.getElementById('deudas-list');
  const extraWrap = document.getElementById('deudas-extra-wrap');
  heroWrap.innerHTML  = '';
  listEl.innerHTML    = '';
  extraWrap.innerHTML = '';

  if (!data.deudas.length) {
    listEl.innerHTML = `<div class="card" style="text-align:center;padding:32px 20px;"><div style="font-size:40px;margin-bottom:10px;">🎉</div><p style="font-weight:800;font-size:17px;">${T('deudas_sin')}</p><p style="font-size:13px;color:var(--text-muted);margin-top:8px;">Agrega tus deudas para calcular tu Plan Snowball.</p></div>`;
    return;
  }

  const sb = calcularSnowball();

  // Hero Fecha de Libertad
  if (sb.fechaLibertad) {
    const f = sb.fechaLibertad;
    const mesLibre = MESES_ES[f.getMonth()];
    const totalDeuda = data.deudas.reduce((s,d) => s + (parseFloat(d.saldoActual) || 0), 0);
    heroWrap.innerHTML = `
      <div class="libertad-hero">
        <div class="libertad-sub" style="font-size:11px;font-weight:700;color:rgba(255,255,255,0.7);text-transform:uppercase;letter-spacing:1px;">🗓️ ${T('deudas_libertad')}</div>
        <div class="libertad-fecha" style="font-size:30px;font-weight:800;color:#fff;margin:4px 0 8px 0;">${mesLibre.charAt(0).toUpperCase()+mesLibre.slice(1)} ${f.getFullYear()}</div>
        <div class="libertad-sub" style="font-size:12.5px;color:rgba(255,255,255,0.85);font-weight:600;">en ${sb.mesesTotales} meses · Deuda total: ${fmt(totalDeuda)}</div>
        
        <div class="grid-2" style="margin-top:16px; width:100%; border-top:1px solid rgba(255,255,255,0.1); padding-top:12px; gap:12px;">
          <div>
            <div style="font-size:10px;font-weight:700;color:rgba(255,255,255,0.6);text-transform:uppercase;letter-spacing:0.5px;">Interés Ahorrado</div>
            <div style="font-size:15px;font-weight:800;color:#34d399;">${fmt(sb.interesAhorrado)}</div>
          </div>
          <div>
            <div style="font-size:10px;font-weight:700;color:rgba(255,255,255,0.6);text-transform:uppercase;letter-spacing:0.5px;">Meses Ahorrados</div>
            <div style="font-size:15px;font-weight:800;color:#34d399;">${sb.mesesAhorrados} meses</div>
          </div>
        </div>
      </div>`;
  }

  // Tarjetas de deuda (Snowball timeline)
  const timelineDiv = document.createElement('div');
  timelineDiv.className = 'deuda-timeline';
  
  sb.deudas.forEach((d, idx) => {
    const isFoco       = idx === 0 && d.saldoActual > 0.01;
    const isPagada     = d.saldoActual <= 0.01;
    const saldoInicial = d.saldoInicial || d.saldoActual;
    const pagado       = Math.max(0, saldoInicial - d.saldoActual);
    const pct          = saldoInicial > 0 ? Math.min((pagado / saldoInicial) * 100, 100) : 0;
    
    const item = document.createElement('div');
    item.className = 'deuda-timeline-item' + (isFoco ? ' foco' : '') + (isPagada ? ' pagada' : '');
    
    let libreStr = '';
    if (d.fechaLibre) {
      const f = d.fechaLibre;
      const mesLibre = MESES_ES[f.getMonth()];
      libreStr = `Libre en ${d.mesLibre} meses · ${mesLibre} ${f.getFullYear()}`;
    }
    
    item.innerHTML = `
      <div class="deuda-timeline-node"></div>
      <div class="deuda-card${isFoco ? ' foco' : ''}">
        ${isFoco ? '<div class="deuda-foco-badge">' + T('deudas_foco') + '</div>' : ''}
        ${isPagada ? '<div class="deuda-foco-badge" style="background:#10b981;">' + T('deudas_pagada') + '</div>' : ''}
        <div class="deuda-nombre">${d.nombre}</div>
        <div class="deuda-saldo">${fmt(d.saldoActual)}</div>
        <div class="deuda-meta-row">
          <span>Mín/mes: ${fmt(d.pagoMinimo)}</span>
          ${d.tasaInteres ? '<span>'+d.tasaInteres+'% mensual</span>' : ''}
        </div>
        <div class="deuda-progress-wrap">
          <div class="deuda-progress-bar${isPagada?' pagada':''}" style="width:${pct}%"></div>
        </div>
        ${libreStr && !isPagada ? '<div class="deuda-libre-en">📅 '+libreStr+'</div>' : ''}
        <div style="display:flex;gap:8px;margin-top:2px;">
          ${!isPagada ? `<button class="btn btn-primary" style="font-size:13px;min-height:40px;" data-abono="${d.id}">${T('deudas_btn_abono')}</button>` : ''}
          <button class="btn btn-secondary" style="font-size:13px;min-height:40px;width:42px;padding:0;" data-edit-deuda="${d.id}">✏️</button>
        </div>
      </div>`;
      
    timelineDiv.appendChild(item);
  });
  listEl.appendChild(timelineDiv);

  listEl.querySelectorAll('[data-abono]').forEach(btn =>
    btn.addEventListener('click', () => openAbonoModal(btn.getAttribute('data-abono')))
  );
  listEl.querySelectorAll('[data-edit-deuda]').forEach(btn =>
    btn.addEventListener('click', () => openDeudaModal(btn.getAttribute('data-edit-deuda')))
  );

  if (sb.extraMensual > 0) {
    extraWrap.innerHTML = `<div class="card" style="display:flex;align-items:center;gap:12px;">
      <span style="font-size:24px;">💡</span>
      <div>
        <div style="font-weight:800;font-size:14px;">Extra disponible para deudas</div>
        <div style="font-size:18px;font-weight:800;color:var(--primary);">${fmt(sb.extraMensual)}/mes</div>
      </div>
    </div>`;
  } else if (data.config.ingresoMensual > 0) {
    extraWrap.innerHTML = `<div class="card"><p style="font-size:13px;font-weight:700;color:var(--danger);">${T('deudas_sin_extra')}</p></div>`;
  }

  // Medallas
  const medallasWrap = document.getElementById('deudas-medallas-wrap');
  if (medallasWrap) {
    medallasWrap.innerHTML = '';
    const meds = calcularMedallas();
    if (meds.length > 0) {
      const card = document.createElement('div');
      card.className = 'card';
      card.style.padding = '16px';
      
      let medsHtml = `<div style="font-weight:800;font-size:14px;margin-bottom:12px;color:var(--accent-gold);text-transform:uppercase;letter-spacing:1px;">🏅 Medallas Conquistadas</div>`;
      medsHtml += `<div style="display:flex;gap:12px;flex-wrap:wrap;">`;
      meds.forEach(m => {
        medsHtml += `
          <div style="background:var(--bg-color);padding:8px 12px;border-radius:10px;border:1px solid var(--border);display:flex;align-items:center;gap:8px;" title="${m.desc}">
            <span style="font-size:14px;font-weight:800;color:var(--text-main);">${m.nombre}</span>
          </div>`;
      });
      medsHtml += `</div>`;
      card.innerHTML = medsHtml;
      medallasWrap.appendChild(card);
    }
  }
}

// ===== FINANCIAL MEDALS =====
function calcularMedallas() {
  const deudas = data.deudas || [];
  if (!deudas.length) return [];
  
  const deudasInicial = deudas.reduce((s,d) => s + (d.saldoInicial || d.saldoActual), 0);
  const deudasActual = deudas.reduce((s,d) => s + d.saldoActual, 0);
  
  if (deudasInicial === 0) return [];
  
  const pctPagado = ((deudasInicial - deudasActual) / deudasInicial) * 100;
  const medallas = [];
  
  if (pctPagado >= 25) {
    medallas.push({
      id: 'm_25',
      nombre: 'Principiante 🎖️',
      desc: 'Pagaste 25% de tu deuda inicial'
    });
  }
  if (pctPagado >= 50) {
    medallas.push({
      id: 'm_50',
      nombre: 'Mitad del Camino 🛡️',
      desc: 'Pagaste 50% de tu deuda inicial'
    });
  }
  if (pctPagado >= 75) {
    medallas.push({
      id: 'm_75',
      nombre: 'Casi Libre 🚀',
      desc: 'Pagaste 75% de tu deuda inicial'
    });
  }
  if (pctPagado >= 100) {
    medallas.push({
      id: 'm_100',
      nombre: '100% Libre! 🎉',
      desc: 'Liquidaste todas tus deudas'
    });
  }
  
  return medallas;
}

// ===== RENDER REGISTRO =====
function renderCategoryChips() {
  const container = document.getElementById('reg-categorias');
  container.innerHTML = '';
  const cats = selectedTipo === 'i' ? CATS_INGRESO : CATS_GASTO;
  if (!selectedCat || !cats.includes(selectedCat)) selectedCat = cats[0];
  cats.forEach(cat => {
    const chip = document.createElement('div');
    chip.className = 'chip' + (cat === selectedCat ? ' selected' : '');
    const cleanCat = cat.replace(/^[^\wÀ-ž]*/, '').trim();
    const label = T('cat_' + cleanCat);
    chip.textContent = (label === 'cat_' + cleanCat) ? cat : label;
    chip.addEventListener('click', () => { selectedCat = cat; renderCategoryChips(); });
    container.appendChild(chip);
  });
}
function renderRegistro() {
  document.getElementById('reg-titulo').textContent    = '⚡ ' + T('reg_titulo');
  document.getElementById('reg-monto-lbl').textContent  = T('reg_monto');
  document.getElementById('reg-desc-lbl').textContent   = T('reg_desc');
  document.getElementById('reg-cat-lbl').textContent    = T('reg_cat');
  document.getElementById('btn-registrar').textContent  = T('reg_btn');
  
  // Set currency symbol in keypad
  const monedaEl = document.getElementById('calc-moneda');
  if (monedaEl) {
    monedaEl.textContent = data.config.moneda || '$';
  }
  
  // Reset calculator input
  window.calcInput = '0';
  const calcValEl = document.getElementById('calc-valor');
  if (calcValEl) {
    calcValEl.textContent = '0';
  }
  document.getElementById('reg-monto').value = '';

  renderCategoryChips();
  renderHistorialMes();
}
function renderHistorialMes() {
  const container = document.getElementById('historial-mes');
  container.innerHTML = '';
  const txs = getTxsMes().sort((a,b) => new Date(b.fecha)-new Date(a.fecha));
  if (!txs.length) {
    container.innerHTML = `<p style="font-size:13px;color:var(--text-muted);font-weight:600;">${T('dash_sin_mov')}</p>`;
    return;
  }
  txs.forEach(tx => container.appendChild(buildMovRow(tx, true)));
}

// ===== RENDER METAS =====
function renderMetas() {
  document.getElementById('metas-titulo').textContent = '🎯 ' + T('metas_titulo');
  document.getElementById('reto52-titulo').textContent = T('reto52_titulo');
  document.getElementById('reto52-sub').textContent    = T('reto52_sub');

  const listEl = document.getElementById('metas-list');
  listEl.innerHTML = '';
  if (!data.metas.length) {
    listEl.innerHTML = `<p style="font-size:13px;color:var(--text-muted);font-weight:600;margin-bottom:14px;">${T('metas_sin')}</p>`;
  } else {
    data.metas.forEach(meta => {
      const pct    = meta.montoObjetivo > 0 ? Math.min((meta.ahorrado / meta.montoObjetivo) * 100, 100) : 0;
      const lograda = pct >= 100;
      const card   = document.createElement('div');
      card.className = 'card meta-card';
      card.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div class="meta-nombre">${meta.emoji || '🎯'} ${meta.nombre}</div>
          <button style="background:none;border:none;cursor:pointer;font-size:16px;min-width:36px;min-height:36px;" data-edit-meta="${meta.id}">✏️</button>
        </div>
        ${lograda ? `<div style="font-size:12px;font-weight:800;color:var(--primary);margin-bottom:4px;">${T('metas_lograda')}</div>` : ''}
        <div class="meta-valores">
          <span>${T('metas_ahorrado')}: ${fmt(meta.ahorrado)}</span>
          <span>${T('metas_falta')}: ${fmt(Math.max(0, meta.montoObjetivo - meta.ahorrado))}</span>
        </div>
        <div class="meta-progress-wrap">
          <div class="meta-progress-bar${lograda?' lograda':''}" style="width:${pct}%"></div>
        </div>
        <div style="font-size:11.5px;font-weight:700;color:var(--text-muted);margin-top:8px;">
          ${(() => {
            const totalMinimos  = data.deudas.reduce((s,d) => s + (parseFloat(d.pagoMinimo) || 0), 0);
            const surplus = Math.max(0, (parseFloat(data.config.ingresoMensual) || 0) - (parseFloat(data.config.gastosFijos) || 0) - totalMinimos);
            if (lograda) return '';
            if (surplus > 0) {
              const falta = Math.max(0, meta.montoObjetivo - meta.ahorrado);
              const meses = falta / surplus;
              const hoy = new Date();
              hoy.setMonth(hoy.getMonth() + Math.ceil(meses));
              const mesNom = MESES_ES[hoy.getMonth()];
              return `📅 Completado estimado: ${mesNom.charAt(0).toUpperCase() + mesNom.slice(1)} ${hoy.getFullYear()} (en ${Math.ceil(meses)} mes${Math.ceil(meses) > 1 ? 'es' : ''})`;
            } else {
              return `💡 Define margen en Perfil para planificar logro`;
            }
          })()}
        </div>
        <button class="btn btn-secondary" style="margin-top:12px;min-height:38px;font-size:13px;" data-abono-meta="${meta.id}">💰 Abonar</button>`;
      listEl.appendChild(card);
    });
    listEl.querySelectorAll('[data-edit-meta]').forEach(btn =>
      btn.addEventListener('click', () => openMetaModal(btn.getAttribute('data-edit-meta')))
    );
    listEl.querySelectorAll('[data-abono-meta]').forEach(btn =>
      btn.addEventListener('click', () => openAbonoMetaModal(btn.getAttribute('data-abono-meta')))
    );
  }
  renderReto52();
  renderDreamsBoard();
}

function renderReto52() {
  const container = document.getElementById('reto52-container');
  container.innerHTML = '';
  const r = data.reto52;
  if (!r.activo) {
    container.innerHTML = `
      <div class="input-group">
        <label>${T('reto52_monto_lbl')} (${data.config.moneda || '$'})</label>
        <input type="number" id="reto-monto-inicial" inputmode="decimal" placeholder="50" value="${r.montoSemanal || 50}">
      </div>
      <button class="btn btn-primary" id="btn-iniciar-reto">🚀 ${T('reto52_iniciar')}</button>`;
    document.getElementById('btn-iniciar-reto').addEventListener('click', () => {
      const m = parseFloat(document.getElementById('reto-monto-inicial').value) || 50;
      data.reto52 = { activo: true, montoSemanal: m, semanas: Array(52).fill(false) };
      saveData();
      renderReto52();
    });
  } else {
    const completadas = r.semanas.filter(Boolean).length;
    const total       = completadas * r.montoSemanal;
    const allDone     = completadas === 52;
    container.innerHTML = `
      <div style="display:flex;justify-content:space-between;margin-bottom:10px;">
        <span style="font-size:13px;font-weight:700;color:var(--text-muted);">${completadas}/52 semanas completadas</span>
        <span style="font-size:13px;font-weight:800;color:var(--primary);">Total: ${fmt(total)}</span>
      </div>
      ${allDone ? `<div style="text-align:center;font-size:18px;font-weight:800;color:var(--primary);margin-bottom:12px;">🏆 ${T('reto52_feliz')}</div>` : ''}
      <div class="reto-grid" id="reto-grid"></div>
      <button class="btn btn-secondary" id="btn-reiniciar-reto" style="margin-top:12px;min-height:40px;font-size:13px;">🔄 ${T('reto52_reiniciar')}</button>`;
    const grid = document.getElementById('reto-grid');
    r.semanas.forEach((done, i) => {
      const cell = document.createElement('div');
      cell.className = 'reto-semana' + (done ? ' done' : '');
      cell.textContent = i + 1;
      cell.addEventListener('click', () => {
        const wasDone = data.reto52.semanas[i];
        data.reto52.semanas[i] = !data.reto52.semanas[i];
        saveData();

        if (!wasDone && data.reto52.semanas[i]) {
          const comp = data.reto52.semanas.filter(Boolean).length;
          if (comp === 52) {
            triggerConfetti();
          } else {
            toast(`💪 ¡Semana ${i + 1} completada! Sigue así.`);
          }
        }
        renderReto52();
      });
      grid.appendChild(cell);
    });
    document.getElementById('btn-reiniciar-reto').addEventListener('click', () => {
      if (confirm('¿Reiniciar el reto? Se perderá el progreso.')) {
        data.reto52 = { activo: false, montoSemanal: r.montoSemanal, semanas: [] };
        saveData();
        renderReto52();
      }
    });
  }
}

// ===== RENDER PERFIL =====
function renderPerfil() {
  document.getElementById('perfil-titulo').textContent          = T('perfil_titulo');
  document.getElementById('perfil-config-titulo').textContent   = '⚙️ ' + T('perfil_config_titulo');
  document.getElementById('perfil-ingreso-lbl').textContent     = T('perfil_ingreso_lbl');
  document.getElementById('perfil-gastosfijos-lbl').textContent = T('perfil_gastos_fijos_lbl');
  document.getElementById('perfil-moneda-lbl').textContent      = T('perfil_moneda_lbl');
  document.getElementById('perfil-sobres-titulo').textContent   = '💰 ' + T('perfil_sobres_titulo');
  document.getElementById('perfil-backup-titulo').textContent   = '💾 ' + T('perfil_backup_titulo');

  document.getElementById('cfg-ingreso').value     = data.config.ingresoMensual || '';
  document.getElementById('cfg-gastos-fijos').value = data.config.gastosFijos || '';
  const sel = document.getElementById('cfg-moneda');
  const divisaActual = (data.config.divisa && DIVISAS[data.config.divisa]) ? data.config.divisa
    : ({ '$':'MXN','S/':'PEN','Q':'GTQ','₡':'CRC','Bs.':'VES','Bs':'BOB','€':'EUR','₲':'PYG','RD$':'DOP','L':'HNL','C$':'NIO','$U':'UYU' }[data.config.moneda] || 'MXN');
  sel.value = divisaActual;

  const btnRec = document.getElementById('btn-recordatorios');
  if (btnRec) {
    const on = !!data.config.recordatorios;
    btnRec.textContent = on ? 'ON' : 'OFF';
    btnRec.style.background = on ? 'var(--primary)' : '';
    btnRec.style.color = on ? '#fff' : '';
  }

  // Sobres config
  const sobresContainer = document.getElementById('sobres-config-container');
  sobresContainer.innerHTML = '';
  Object.entries(data.config.sobres).forEach(([nombre, valor]) => {
    const item = document.createElement('div');
    item.className = 'sobre-config-item';
    const cleanNombre = nombre.replace(/^[^\wÀ-ž]*/, '').trim();
    const nombreTrad = T('cat_' + cleanNombre);
    const emoji = nombre.split(' ')[0];
    item.innerHTML = `<label>${emoji} ${nombreTrad}</label><input type="number" inputmode="decimal" data-sobre="${nombre}" value="${valor || ''}" placeholder="0">`;
    sobresContainer.appendChild(item);
  });

  // AI keys config
  document.getElementById('cfg-key-openai').value = localStorage.getItem('key-openai') || '';
  document.getElementById('cfg-key-gemini').value = localStorage.getItem('key-gemini') || '';

  // Cloud sync config
  if (!data.config.syncKey) initSync();
  document.getElementById('cfg-sync-key').value = data.config.syncKey || '';
  
  const statusEl = document.getElementById('lbl-sync-status');
  if (statusEl) {
    if (data.config.syncEnabled && data.config.syncLastTime) {
      statusEl.textContent = 'Estado: Sincronizado ' + data.config.syncLastTime;
    } else if (data.config.syncEnabled) {
      statusEl.textContent = 'Estado: Sincronizado';
    } else {
      statusEl.textContent = 'Estado: No sincronizado';
    }
  }
  
  const autoBtn = document.getElementById('btn-sync-auto-toggle');
  if (autoBtn) {
    autoBtn.textContent = 'Sync Auto: ' + (data.config.syncEnabled ? 'ON' : 'OFF');
    autoBtn.style.background = data.config.syncEnabled ? 'var(--primary-light)' : '';
    autoBtn.style.color = data.config.syncEnabled ? 'var(--primary)' : '';
    autoBtn.style.borderColor = data.config.syncEnabled ? 'var(--primary)' : '';
  }
}

// ===== MODALS: DEUDA =====
function openDeudaModal(id) {
  modalDeudaEditId = id || null;
  const ed = id ? data.deudas.find(d => d.id === id) : null;
  document.getElementById('md-titulo').textContent     = ed ? T('modal_deuda_editar') : T('modal_nueva_deuda');
  document.getElementById('md-nombre').value           = ed ? ed.nombre : '';
  document.getElementById('md-saldo').value            = ed ? ed.saldoActual : '';
  document.getElementById('md-saldo-inicial').value    = ed ? (ed.saldoInicial || ed.saldoActual) : '';
  document.getElementById('md-tasa').value             = ed ? ed.tasaInteres : '';
  document.getElementById('md-minimo').value           = ed ? ed.pagoMinimo : '';
  document.getElementById('md-btn-eliminar').style.display = ed ? 'block' : 'none';
  openModal('modal-deuda');
}
function saveDeuda() {
  const nombre  = document.getElementById('md-nombre').value.trim();
  const saldo   = parseFloat(document.getElementById('md-saldo').value);
  const saldoIni = parseFloat(document.getElementById('md-saldo-inicial').value) || saldo;
  const tasa    = parseFloat(document.getElementById('md-tasa').value) || 0;
  const minimo  = parseFloat(document.getElementById('md-minimo').value) || 0;
  if (!nombre || isNaN(saldo)) { toast('Completa nombre y saldo 🙂'); return; }
  if (modalDeudaEditId) {
    const d = data.deudas.find(d => d.id === modalDeudaEditId);
    if (d) { d.nombre = nombre; d.saldoActual = saldo; d.saldoInicial = saldoIni; d.tasaInteres = tasa; d.pagoMinimo = minimo; }
  } else {
    data.deudas.push({ id: uid(), nombre, saldoActual: saldo, saldoInicial: saldoIni, tasaInteres: tasa, pagoMinimo: minimo, fechaCreacion: new Date().toISOString() });
  }
  saveData(); closeModal('modal-deuda'); toast(T('modal_deuda_toast')); renderDeudas();
}
function eliminarDeuda() {
  if (!modalDeudaEditId) return;
  if (confirm(T('modal_deuda_eliminar_confirm'))) {
    data.deudas = data.deudas.filter(d => d.id !== modalDeudaEditId);
    saveData(); closeModal('modal-deuda'); toast(T('modal_deuda_eliminar_toast')); renderDeudas();
  }
}

// ===== MODALS: ABONO =====
function openAbonoModal(deudaId) {
  abonoDeudaId = deudaId;
  const d = data.deudas.find(d => d.id === deudaId);
  document.getElementById('ma-deuda-nombre').textContent = d ? d.nombre : '';
  document.getElementById('ma-monto').value = '';
  openModal('modal-abono');
}
function saveAbono() {
  const monto = parseFloat(document.getElementById('ma-monto').value);
  if (!monto || monto <= 0) { toast(T('modal_abono_err')); return; }
  const d = data.deudas.find(d => d.id === abonoDeudaId);
  if (!d) return;

  const deudasInicial = data.deudas.reduce((s,x) => s + (x.saldoInicial || x.saldoActual || 0), 0);
  const deudasActualAntes = data.deudas.reduce((s,x) => s + (x.saldoActual || 0), 0);
  const pctAntes = deudasInicial > 0 ? ((deudasInicial - deudasActualAntes) / deudasInicial) * 100 : 0;

  const wasPagada = d.saldoActual > 0.01;
  d.saldoActual = Math.max(0, d.saldoActual - monto);
  const isPagada = d.saldoActual <= 0.01;

  const deudasActualDespues = data.deudas.reduce((s,x) => s + (x.saldoActual || 0), 0);
  const pctDespues = deudasInicial > 0 ? ((deudasInicial - deudasActualDespues) / deudasInicial) * 100 : 0;

  data.pagosDeuda.push({ id: uid(), deudaId: abonoDeudaId, fecha: new Date().toISOString(), monto });
  data.transacciones.push({
    id: uid(), tipo: 'g', monto,
    descripcion: 'Abono: ' + d.nombre,
    categoria: '💳 Deudas',
    fecha: new Date().toISOString()
  });

  saveData();
  closeModal('modal-abono');

  if (wasPagada && isPagada) {
    triggerConfetti();
    toast('🎉 ¡FELICIDADES! Deuda liquidada.');
  } else {
    toast(T('modal_abono_toast'));
  }

  // Detectar y celebrar nuevas medallas conquistadas
  const thresholds = [25, 50, 75, 100];
  const medalNames = {
    25: 'Principiante 🎖️',
    50: 'Mitad del Camino 🛡️',
    75: 'Casi Libre 🚀',
    100: '100% Libre! 🎉'
  };
  for (const t of thresholds) {
    if (pctAntes < t && pctDespues >= t) {
      setTimeout(() => {
        triggerConfetti();
        toast(`🏅 ¡LOGRO CONQUISTADO: ${medalNames[t]}!`);
      }, 1200);
    }
  }

  renderDeudas();
  renderDashboard();
}

// ===== MODALS: META =====
function openMetaModal(id) {
  modalMetaEditId = id || null;
  const em = id ? data.metas.find(m => m.id === id) : null;
  document.getElementById('mm-titulo').textContent       = em ? '✏️ Editar Meta' : '🎯 Nueva Meta';
  document.getElementById('mm-nombre').value             = em ? em.nombre : '';
  document.getElementById('mm-monto').value              = em ? em.montoObjetivo : '';
  document.getElementById('mm-emoji').value              = em ? (em.emoji || '') : '';
  document.getElementById('mm-btn-eliminar').style.display = em ? 'block' : 'none';
  openModal('modal-meta');
}
function saveMeta() {
  const nombre = document.getElementById('mm-nombre').value.trim();
  const monto  = parseFloat(document.getElementById('mm-monto').value);
  const emoji  = document.getElementById('mm-emoji').value.trim() || '🎯';
  if (!nombre || isNaN(monto)) { toast(T('metas_err')); return; }
  if (modalMetaEditId) {
    const m = data.metas.find(m => m.id === modalMetaEditId);
    if (m) { m.nombre = nombre; m.montoObjetivo = monto; m.emoji = emoji; }
  } else {
    data.metas.push({ id: uid(), nombre, montoObjetivo: monto, ahorrado: 0, emoji, fechaCreacion: new Date().toISOString() });
  }
  saveData(); closeModal('modal-meta'); toast(T('metas_toast')); renderMetas();
}
function eliminarMeta() {
  if (!modalMetaEditId) return;
  if (confirm(T('metas_eliminar_confirm'))) {
    data.metas = data.metas.filter(m => m.id !== modalMetaEditId);
    saveData(); closeModal('modal-meta'); toast(T('metas_eliminar_toast')); renderMetas();
  }
}

// ===== MODALS: ABONO META =====
function openAbonoMetaModal(metaId) {
  abonoMetaId = metaId;
  const m = data.metas.find(m => m.id === metaId);
  document.getElementById('mam-nombre').textContent = m ? m.emoji + ' ' + m.nombre : '';
  document.getElementById('mam-monto').value = '';
  openModal('modal-abono-meta');
}
function saveAbonoMeta() {
  const monto = parseFloat(document.getElementById('mam-monto').value);
  if (!monto || monto <= 0) { toast(T('reg_err')); return; }
  const m = data.metas.find(m => m.id === abonoMetaId);
  if (!m) return;

  const wasLograda = (m.ahorrado || 0) >= m.montoObjetivo;
  m.ahorrado = (m.ahorrado || 0) + monto;
  const isLograda = m.ahorrado >= m.montoObjetivo;

  data.transacciones.push({
    id: uid(), tipo: 'g', monto,
    descripcion: 'Abono meta: ' + m.nombre,
    categoria: 'Otros',
    fecha: new Date().toISOString()
  });

  saveData();
  closeModal('modal-abono-meta');

  if (!wasLograda && isLograda) {
    triggerConfetti();
    toast(`🎉 ¡FELICIDADES! Lograste tu meta: ${m.nombre}`);
  } else {
    toast(T('metas_abonar_toast'));
  }

  renderMetas();
  renderDashboard();
}

// ===== FINANCIAL HEALTH SCORE & MOTIVATION =====
function calcularHealthScore() {
  if (!data.config.onboardingDone) return { score: 0, level: 'Calculando...', color: 'var(--text-muted)' };
  
  let score = 0;
  const ingreso = data.config.ingresoMensual || 0;
  const gastosFijos = data.config.gastosFijos || 0;
  const deudas = data.deudas || [];
  const totalMinimos = deudas.reduce((s,d) => s + (d.pagoMinimo || 0), 0);
  const deudaTotal = deudas.reduce((s,d) => s + d.saldoActual, 0);
  
  if (ingreso <= 0) return { score: 0, level: 'Revisa tu Perfil', color: 'var(--danger)' };

  // 1. Margen de Ahorro (Max 40)
  const gastosTotales = gastosFijos + totalMinimos;
  const ratioGastos = gastosTotales / ingreso;
  if (ratioGastos <= 0.4) score += 40;
  else if (ratioGastos <= 0.6) score += 30;
  else if (ratioGastos <= 0.8) score += 20;
  else if (ratioGastos <= 1.0) score += 10;
  
  // 2. Carga de Deuda (Max 40)
  if (deudaTotal === 0) {
    score += 40;
  } else {
    const ratioDeuda = deudaTotal / ingreso;
    if (ratioDeuda <= 1.0) score += 30;
    else if (ratioDeuda <= 3.0) score += 20;
    else if (ratioDeuda <= 6.0) score += 10;
    else score += 5;
  }
  
  // 3. Control de Envelopes (Max 10)
  const tieneSobres = Object.values(data.config.sobres || {}).some(v => v > 0);
  if (tieneSobres) score += 10;
  
  // 4. Plan de Ahorro (Max 10)
  if (data.metas && data.metas.length > 0) score += 10;
  
  // Nivel y color
  let level = '';
  let color = '';
  if (score >= 80) {
    level = 'Excelente 💚';
    color = 'var(--ok)';
  } else if (score >= 60) {
    level = 'Estable 👍';
    color = '#10B981';
  } else if (score >= 40) {
    level = 'Atención ⚠️';
    color = 'var(--accent-gold)';
  } else {
    level = 'Crítico 🚨';
    color = 'var(--danger)';
  }
  
  return { score, level, color };
}

function getMotivationalMessage(score) {
  const messages = {
    high: [
      "¡Excelente control! Sigue así, tu libertad financiera está cada vez más cerca. 🚀",
      "Estás en el camino correcto. Tu disciplina financiera es admirable. 💪",
      "¡Qué paz da tener el control! Tu futuro yo te lo agradecerá. 🎯"
    ],
    medium: [
      "Buen progreso. Revisa tus sobres para recortar gastos y acelerar tu Bola de Nieve. ❄️",
      "Vas estable. ¿Y si aumentas un poco el abono a tu deuda foco este mes? 🔥",
      "Cada pequeño ajuste cuenta. Sigue consistente en tus registros. 📊"
    ],
    low: [
      "Paso a paso. Tu prioridad es reducir gastos variables para crear tu primer fondo de emergencia. 🛡️",
      "No te desanimes. Enfócate hoy en pagar el mínimo de tus deudas y atacar la más pequeña. 🎯",
      "Es momento de ajustar los sobres. Todo esfuerzo de hoy será libertad mañana. 🌱"
    ]
  };
  
  const pool = score >= 80 ? messages.high : score >= 40 ? messages.medium : messages.low;
  const dayIndex = new Date().getDate() % pool.length;
  return pool[dayIndex];
}

function calcularInsights() {
  const txs = getTxsMes();
  const ingresos = txs.filter(t => t.tipo === 'i').reduce((s,t) => s + t.monto, 0);
  const gastos = txs.filter(t => t.tipo === 'g').reduce((s,t) => s + t.monto, 0);
  
  const ingresoMensual = data.config.ingresoMensual || 0;
  const gastosFijos = data.config.gastosFijos || 0;
  
  const insights = [
    "Registrar tus gastos todos los días reduce el gasto impulsivo en un 15%. ¡Sigue consistente! 📊",
    "Tu meta de ahorro está bien encaminada. Automatiza un abono hoy para acelerar. 🎯"
  ];
  
  // Custom Dynamic Insights based on actual data
  if (ingresoMensual > 0) {
    const disponible = ingresoMensual - (gastos + gastosFijos);
    if (disponible > 0) {
      const p = Math.round((disponible / ingresoMensual) * 100);
      insights.unshift(`Tienes el ${p}% de tu ingreso mensual libre. ¿Qué tal si abonas un extra a tu deudor foco hoy? 💰`);
    }
  }
  
  if (data.deudas && data.deudas.length > 0) {
    const sb = calcularSnowball();
    if (sb.mesesTotales) {
      insights.unshift(`¡Tu plan Bola de Nieve calcula que estarás libre de deudas en ${sb.mesesTotales} meses! 🚀`);
    }
  }
  
  const dayIndex = new Date().getDate() % insights.length;
  return insights[dayIndex];
}

// ===== BACKUP / RESTORE =====
function exportarDatos() {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = 'sindeudas-backup-' + new Date().toISOString().slice(0,10) + '.json';
  a.click();
  URL.revokeObjectURL(url);
}
function importarDatos(file) {
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const parsed = JSON.parse(e.target.result);
      if (!parsed.version) throw new Error('invalid');
      localStorage.setItem('sd_data', JSON.stringify(parsed));
      toast(T('import_ok'));
      setTimeout(() => location.reload(), 1200);
    } catch { toast(T('import_err')); }
  };
  reader.readAsText(file);
}

// ===== CLOUD SYNC OPTIONAL (OFFLINE-FIRST SIMULATION) =====
function initSync() {
  if (!data.config.syncKey) {
    data.config.syncKey = Math.random().toString(36).substring(2, 8).toUpperCase() + 
                          Math.random().toString(36).substring(2, 8).toUpperCase();
    saveData();
  }
}

function sincronizarCloud(forzar = false) {
  if (!data.config.syncKey) initSync();
  
  const statusEl = document.getElementById('lbl-sync-status');
  
  if (!forzar && !data.config.syncEnabled) {
    if (statusEl) statusEl.textContent = 'Estado: Sync desactivada';
    return;
  }
  
  if (statusEl) statusEl.textContent = 'Estado: Sincronizando...';
  
  setTimeout(() => {
    try {
      const key = data.config.syncKey;
      
      let remoteDb = localStorage.getItem('sd_cloud_db_' + key);
      if (remoteDb) {
        remoteDb = JSON.parse(remoteDb);
      }
      
      const merged = mergeData(data, remoteDb);
      
      data = merged;
      saveData();
      
      localStorage.setItem('sd_cloud_db_' + key, JSON.stringify(data));
      
      data.config.syncLastTime = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
      saveData();
      
      if (statusEl) {
        statusEl.textContent = 'Estado: Sincronizado ' + data.config.syncLastTime;
      }
      
      toast('☁️ Sincronización exitosa');
      renderDashboard();
      
      const syncInput = document.getElementById('cfg-sync-key');
      if (syncInput) syncInput.value = data.config.syncKey;
      
    } catch (e) {
      if (statusEl) statusEl.textContent = 'Estado: Error al sincronizar';
      toast('❌ Error en sincronización');
    }
  }, 800);
}

function vincularCloud(targetKey) {
  if (!targetKey || targetKey.trim().length < 6) {
    toast('❌ Código de vinculación no válido');
    return;
  }
  
  const key = targetKey.trim().toUpperCase();
  const statusEl = document.getElementById('lbl-sync-status');
  if (statusEl) statusEl.textContent = 'Estado: Vinculando cuenta...';
  
  setTimeout(() => {
    try {
      let remoteDb = localStorage.getItem('sd_cloud_db_' + key);
      if (!remoteDb) {
        localStorage.setItem('sd_cloud_db_' + key, JSON.stringify(data));
        remoteDb = JSON.stringify(data);
      }
      
      const parsedRemote = JSON.parse(remoteDb);
      const merged = mergeData(data, parsedRemote);
      
      data = merged;
      data.config.syncKey = key;
      data.config.syncEnabled = true;
      data.config.syncLastTime = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
      saveData();
      
      localStorage.setItem('sd_cloud_db_' + key, JSON.stringify(data));
      
      toast('🔗 ¡Dispositivo vinculado correctamente!');
      location.reload();
    } catch (e) {
      if (statusEl) statusEl.textContent = 'Estado: Error al vincular';
      toast('❌ Falló la vinculación');
    }
  }, 1000);
}

function mergeData(local, remote) {
  if (!remote) return local;
  
  const merged = JSON.parse(JSON.stringify(local));
  
  const txMap = new Map();
  (remote.transacciones || []).forEach(t => txMap.set(t.id, t));
  (local.transacciones || []).forEach(t => {
    if (txMap.has(t.id)) {
      const remoteTx = txMap.get(t.id);
      if (new Date(t.fecha) > new Date(remoteTx.fecha)) {
        txMap.set(t.id, t);
      }
    } else {
      txMap.set(t.id, t);
    }
  });
  merged.transacciones = Array.from(txMap.values());
  
  const deudasMap = new Map();
  (remote.deudas || []).forEach(d => deudasMap.set(d.id, d));
  (local.deudas || []).forEach(d => {
    deudasMap.set(d.id, d);
  });
  merged.deudas = Array.from(deudasMap.values());
  
  const metasMap = new Map();
  (remote.metas || []).forEach(m => metasMap.set(m.id, m));
  (local.metas || []).forEach(m => {
    metasMap.set(m.id, m);
  });
  merged.metas = Array.from(metasMap.values());
  
  const localDone = (local.reto52 && local.reto52.semanas) ? local.reto52.semanas.filter(Boolean).length : 0;
  const remoteDone = (remote.reto52 && remote.reto52.semanas) ? remote.reto52.semanas.filter(Boolean).length : 0;
  if (remoteDone > localDone) {
    merged.reto52 = remote.reto52;
  }
  
  merged.config = Object.assign({}, remote.config || {}, local.config || {});
  
  return merged;
}

// ===== DAILY STREAKS =====
function updateStreaks() {
  if (!data.streaks) {
    data.streaks = { count: 0, lastActiveDate: null };
  }
  
  const todayStr = new Date().toISOString().slice(0, 10);
  const lastDate = data.streaks.lastActiveDate;
  
  if (!lastDate) {
    data.streaks.count = 1;
    data.streaks.lastActiveDate = todayStr;
  } else if (lastDate === todayStr) {
    // Already checked in today, do nothing
  } else {
    const lastActive = new Date(lastDate);
    const today = new Date(todayStr);
    const diffTime = Math.abs(today - lastActive);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      // Consecutive day!
      data.streaks.count += 1;
      data.streaks.lastActiveDate = todayStr;
      window.streakIncreased = data.streaks.count;
    } else if (diffDays > 1) {
      // Streak broken!
      data.streaks.count = 1;
      data.streaks.lastActiveDate = todayStr;
    }
  }
  saveData();
}

// ===== HEADER =====
function updateHeader() {
  const h = new Date().getHours();
  const greeting = h < 12 ? T('greeting_morning') : h < 19 ? T('greeting_afternoon') : T('greeting_evening');
  
  const streakCount = (data.streaks && data.streaks.count) ? data.streaks.count : 0;
  const streakText = streakCount > 0 ? ` 🔥 ${streakCount} días` : '';
  
  document.getElementById('header-saludo').textContent = greeting + streakText;
  
  const now = new Date();
  const dateStr = DIAS_ES[now.getDay()] + ', ' + now.getDate() + ' de ' + MESES_ES[now.getMonth()];
  document.getElementById('header-fecha').textContent = dateStr;
}

// ===== ONBOARDING =====
function showOnboarding() {
  document.getElementById('screen-onboarding').classList.remove('hidden');
  document.getElementById('onb-step1-titulo').textContent    = T('onb_step1_titulo');
  document.getElementById('onb-step1-sub').textContent      = T('onb_step1_sub');
  document.getElementById('onb-step2-label-inline').textContent = T('onb_step2_titulo') + ' (' + (data.config.moneda || '$') + ')';
  document.getElementById('onb-step3-titulo').textContent   = T('onb_step3_titulo');
  document.getElementById('onb-step3-sub').textContent      = T('onb_step3_sub');
  document.getElementById('btn-onb-finalizar').textContent  = T('onb_btn_finalizar');
  document.getElementById('btn-onb-saltar').textContent     = T('onb_btn_saltar');
}

let onbTempDeudas = [];
function refreshOnbDeudas() {
  const el = document.getElementById('onb-deudas-list');
  el.innerHTML = '';
  onbTempDeudas.forEach(d => {
    const item = document.createElement('div');
    item.className = 'card';
    item.style.cssText = 'padding:10px 14px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;';
    item.innerHTML = `<span style="font-weight:700;">${d.nombre}</span><span style="font-size:13px;color:var(--primary);font-weight:800;">${fmt(d.saldoActual)}</span>`;
    el.appendChild(item);
  });
}

function finishOnboarding() {
  data.config.onboardingDone = true;
  onbTempDeudas.forEach(d => data.deudas.push(d));
  saveData();
  showOnboardingResult();
}

// Cierra el resultado y entra al dashboard
function entrarDesdeResultado() {
  const ov = document.getElementById('onb-result');
  if (ov) ov.remove();
  document.getElementById('screen-onboarding').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  updateHeader();
  navTo('v-dashboard');
}
window.entrarDesdeResultado = entrarDesdeResultado;

// Pantalla "tu plan está listo" tras el quiz: cierra el ciclo con el aha moment
function showOnboardingResult() {
  const ingreso = parseFloat(data.config.ingresoMensual) || 0;
  const gastosFijos = parseFloat(data.config.gastosFijos) || 0;
  const disponible = Math.max(0, ingreso - gastosFijos);
  const sb = calcularSnowball();
  const score = calcularHealthScore();

  let foco = '';
  if (sb.fechaLibertad) {
    const f = sb.fechaLibertad;
    const mes = MESES_ES[f.getMonth()];
    const mesCap = mes.charAt(0).toUpperCase() + mes.slice(1);
    foco = `
      <div style="background:linear-gradient(135deg,var(--primary,#10b981) 0%,#047857 100%);border-radius:18px;padding:18px;margin-bottom:14px;color:#fff;">
        <div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1px;opacity:.85;">🗓️ Tu fecha de libertad</div>
        <div style="font-size:30px;font-weight:900;margin:4px 0 6px;">${mesCap} ${f.getFullYear()}</div>
        <div style="font-size:13px;font-weight:700;opacity:.92;">Libre en ${sb.mesesTotales} meses siguiendo tu plan</div>
        ${sb.interesAhorrado > 0 ? `<div style="font-size:12.5px;font-weight:700;margin-top:8px;color:#d1fae5;">💸 Te ahorras ${fmt(sb.interesAhorrado)} en intereses</div>` : ''}
      </div>`;
  } else if (data.deudas.length) {
    foco = `
      <div style="background:rgba(248,113,113,.1);border:1px solid rgba(248,113,113,.35);border-radius:16px;padding:16px;margin-bottom:14px;">
        <div style="font-size:14px;font-weight:800;color:var(--danger,#f87171);">⚠️ Tu margen no alcanza para bajar las deudas</div>
        <div style="font-size:12.5px;font-weight:600;color:var(--text-muted,#93b3a4);margin-top:4px;">En el Plan Sal de Deudas te mostramos qué ajustar para liberar dinero.</div>
      </div>`;
  } else {
    foco = `
      <div style="background:rgba(16,185,129,.1);border:1px solid rgba(16,185,129,.3);border-radius:16px;padding:16px;margin-bottom:14px;">
        <div style="font-size:15px;font-weight:800;color:var(--primary,#10b981);">🎉 ¡Sin deudas!</div>
        <div style="font-size:12.5px;font-weight:600;color:var(--text-muted,#93b3a4);margin-top:4px;">Ahora vamos a construir tus metas de ahorro.</div>
      </div>`;
  }

  const ov = document.createElement('div');
  ov.id = 'onb-result';
  ov.style.cssText = 'position:fixed;inset:0;z-index:10000;background:var(--bg-color,#07120d);display:flex;flex-direction:column;justify-content:center;align-items:center;padding:28px 22px;overflow-y:auto;text-align:center;';
  ov.innerHTML = `
    <div style="width:100%;max-width:420px;">
      <div style="font-size:52px;margin-bottom:6px;">🚀</div>
      <h2 style="font-size:24px;font-weight:900;color:var(--text-main,#eafaf2);margin-bottom:6px;">¡Tu plan está listo!</h2>
      <p style="font-size:14px;color:var(--text-muted,#93b3a4);font-weight:600;margin-bottom:22px;">Esto es lo que calculamos con tus datos:</p>
      ${foco}
      <div class="grid-2" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px;">
        <div style="background:var(--card-bg,#10231a);border:1px solid var(--border,rgba(255,255,255,.1));border-radius:16px;padding:14px;">
          <div style="font-size:10.5px;font-weight:800;color:var(--text-muted,#93b3a4);text-transform:uppercase;letter-spacing:.5px;">Disponible al mes</div>
          <div style="font-size:22px;font-weight:900;color:var(--primary,#10b981);margin-top:4px;">${fmt(disponible)}</div>
        </div>
        <div style="background:var(--card-bg,#10231a);border:1px solid var(--border,rgba(255,255,255,.1));border-radius:16px;padding:14px;">
          <div style="font-size:10.5px;font-weight:800;color:var(--text-muted,#93b3a4);text-transform:uppercase;letter-spacing:.5px;">Salud financiera</div>
          <div style="font-size:22px;font-weight:900;color:${score.color};margin-top:4px;">${score.score}<span style="font-size:13px;opacity:.7;">/100</span></div>
        </div>
      </div>
      <button class="btn btn-primary" onclick="entrarDesdeResultado()" style="width:100%;margin-top:8px;">Empezar mi plan 🚀</button>
    </div>`;
  document.body.appendChild(ov);
}

// ===== PWA =====
function initPWA() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').then(reg => {
      // Si hay una nueva versión esperando, actívala de inmediato
      if (reg.waiting) reg.waiting.postMessage('SKIP_WAITING');
      reg.addEventListener('updatefound', () => {
        const nw = reg.installing;
        if (!nw) return;
        nw.addEventListener('statechange', () => {
          if (nw.state === 'installed' && navigator.serviceWorker.controller) {
            nw.postMessage('SKIP_WAITING');
          }
        });
      });
    }).catch(() => {});
    // Cuando el nuevo SW toma control, recarga una vez para mostrar la versión nueva
    let refreshed = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshed) return;
      refreshed = true;
      window.location.reload();
    });
  }
}

// ===== DOM READY =====
document.addEventListener('DOMContentLoaded', () => {

  loadData();
  initSync();
  sincronizarCloud();
  updateStreaks();
  applyLang();

  if (window.streakIncreased) {
    setTimeout(() => {
      toast(`🔥 ¡Racha de ${window.streakIncreased} días activos! Sigue así.`);
    }, 1500);
  }



  // Set initial labels for types toggle
  document.getElementById('tipo-ingreso').textContent = '💚 ' + T('reg_ingreso');
  document.getElementById('tipo-gasto').textContent = '🔴 ' + T('reg_gasto');

  // Aguarda a autorização do Firebase para mostrar as telas
  window.addEventListener('auth-success', () => {
    if (!data.config.onboardingDone) {
      showOnboarding();
    } else {
      document.getElementById('app').classList.remove('hidden');
      updateHeader();
      navTo('v-dashboard');
    }
  });

  // Navegación
  const btnBackBtn = document.getElementById('btn-back');
  if (btnBackBtn) {
    btnBackBtn.addEventListener('click', () => navTo('v-dashboard'));
  }

  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => navTo(btn.getAttribute('data-view'), btn));
  });

  // Theme toggle
  document.getElementById('btn-tema').addEventListener('click', () => {
    const html = document.documentElement;
    html.setAttribute('data-theme', html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  });

  // Tipo toggle (registro)
  document.getElementById('tipo-ingreso').addEventListener('click', () => setTipo('i'));
  document.getElementById('tipo-gasto').addEventListener('click',   () => setTipo('g'));

  // Responsable (miembro de la familia) — selección
  (function setupOwnerChips() {
    const cont = document.getElementById('reg-owner');
    if (!cont) return;
    const chips = cont.querySelectorAll('.chip');
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        selectedOwner = chip.getAttribute('data-owner') || 'conjunta';
        chips.forEach(c => c.classList.toggle('selected', c === chip));
      });
    });
  })();

  // Registrar transacción
  document.getElementById('btn-registrar').addEventListener('click', () => {
    const monto = parseFloat(document.getElementById('reg-monto').value);
    if (!monto || monto <= 0) { toast(T('reg_err')); return; }
    const desc = document.getElementById('reg-desc').value.trim();
    data.transacciones.push({
      id: uid(), tipo: selectedTipo, monto,
      descripcion: desc, categoria: selectedCat,
      responsable: selectedOwner,
      fecha: new Date().toISOString()
    });
    saveData();
    toast(selectedTipo === 'i' ? T('reg_toast_ingreso') : T('reg_toast_gasto'));
    
    // Reset keypad and amount input
    document.getElementById('reg-monto').value = '';
    window.calcInput = '0';
    const calcValEl = document.getElementById('calc-valor');
    if (calcValEl) {
      calcValEl.textContent = '0';
    }
    
    document.getElementById('reg-desc').value  = '';
    renderHistorialMes();
    renderDashboard();
  });

  // Deudas
  document.getElementById('btn-nueva-deuda').addEventListener('click', () => openDeudaModal(null));
  document.getElementById('md-btn-guardar').addEventListener('click',   saveDeuda);
  document.getElementById('md-btn-eliminar').addEventListener('click',  eliminarDeuda);
  document.getElementById('md-btn-cancelar').addEventListener('click',  () => closeModal('modal-deuda'));

  // Abono deuda
  document.getElementById('ma-btn-guardar').addEventListener('click', saveAbono);
  document.getElementById('ma-btn-cancelar').addEventListener('click', () => closeModal('modal-abono'));

  // Metas
  document.getElementById('btn-nueva-meta').addEventListener('click',  () => openMetaModal(null));
  document.getElementById('mm-btn-guardar').addEventListener('click',   saveMeta);
  document.getElementById('mm-btn-eliminar').addEventListener('click',  eliminarMeta);
  document.getElementById('mm-btn-cancelar').addEventListener('click',  () => closeModal('modal-meta'));

  // Abono meta
  document.getElementById('mam-btn-guardar').addEventListener('click', saveAbonoMeta);
  document.getElementById('mam-btn-cancelar').addEventListener('click', () => closeModal('modal-abono-meta'));

  // Guardar config
  document.getElementById('btn-save-config').addEventListener('click', () => {
    data.config.ingresoMensual = parseFloat(document.getElementById('cfg-ingreso').value)      || 0;
    data.config.gastosFijos    = parseFloat(document.getElementById('cfg-gastos-fijos').value) || 0;
    const divisaSel            = document.getElementById('cfg-moneda').value || 'MXN';
    data.config.divisa         = DIVISAS[divisaSel] ? divisaSel : 'MXN';
    data.config.moneda         = DIVISAS[data.config.divisa].sym;
    document.querySelectorAll('#sobres-config-container [data-sobre]').forEach(inp => {
      data.config.sobres[inp.getAttribute('data-sobre')] = parseFloat(inp.value) || 0;
    });
    saveData();
    toast('✅ Configuración guardada');
    renderDashboard();
  });

  // Reset test
  document.getElementById('btn-reset-app').addEventListener('click', () => {
    if (confirm('¿Borrar todos los datos de prueba?')) {
      localStorage.removeItem('sd_data');
      location.reload();
    }
  });

  // Backup
  document.getElementById('btn-backup').addEventListener('click', exportarDatos);
  document.getElementById('btn-restore').addEventListener('click', () => document.getElementById('input-restore').click());
  document.getElementById('input-restore').addEventListener('change', e => {
    if (e.target.files[0]) importarDatos(e.target.files[0]);
  });

  // Cloud Sync click listeners
  const btnCopySync = document.getElementById('btn-copy-sync-key');
  if (btnCopySync) {
    btnCopySync.addEventListener('click', () => {
      const keyInput = document.getElementById('cfg-sync-key');
      if (keyInput && keyInput.value) {
        navigator.clipboard.writeText(keyInput.value).then(() => {
          toast('📋 Código copiado al portapapeles');
        }).catch(() => {
          toast('❌ Error al copiar');
        });
      }
    });
  }
  
  const btnSyncNow = document.getElementById('btn-sync-now');
  if (btnSyncNow) {
    btnSyncNow.addEventListener('click', () => sincronizarCloud(true));
  }
  
  const btnSyncJoin = document.getElementById('btn-sync-join');
  if (btnSyncJoin) {
    btnSyncJoin.addEventListener('click', () => {
      const codeInput = document.getElementById('cfg-sync-join-key');
      if (codeInput) {
        vincularCloud(codeInput.value);
      }
    });
  }
  
  const btnSyncAutoToggle = document.getElementById('btn-sync-auto-toggle');
  if (btnSyncAutoToggle) {
    btnSyncAutoToggle.addEventListener('click', () => {
      data.config.syncEnabled = !data.config.syncEnabled;
      saveData();
      sincronizarCloud();
      renderPerfil();
    });
  }

  // Custom Executive Reports Click Listeners
  const btnExcel = document.getElementById('btn-export-excel');
  if (btnExcel) btnExcel.addEventListener('click', exportarExcelPremium);
  
  const btnPdf = document.getElementById('btn-export-pdf');
  if (btnPdf) btnPdf.addEventListener('click', generarReportePDF);

  // Onboarding paso 1
  document.getElementById('btn-onb-1').addEventListener('click', () => {
    const ingreso = parseFloat(document.getElementById('onb-ingreso').value) || 0;
    const gastos  = parseFloat(document.getElementById('onb-gastos-fijos').value) || 0;
    data.config.ingresoMensual = ingreso;
    data.config.gastosFijos    = gastos;
    saveData();
    document.getElementById('onb-step-1').classList.add('hidden');
    document.getElementById('onb-step-2').classList.remove('hidden');
  });

  // Onboarding agregar deuda
  document.getElementById('btn-onb-add-deuda').addEventListener('click', () => {
    const nombre = document.getElementById('onb-d-nombre').value.trim();
    const saldo  = parseFloat(document.getElementById('onb-d-saldo').value);
    const tasa   = parseFloat(document.getElementById('onb-d-tasa').value) || 0;
    const minimo = parseFloat(document.getElementById('onb-d-minimo').value) || 0;
    if (!nombre || isNaN(saldo)) { toast('Completa nombre y saldo 🙂'); return; }
    onbTempDeudas.push({ id: uid(), nombre, saldoActual: saldo, saldoInicial: saldo, tasaInteres: tasa, pagoMinimo: minimo, fechaCreacion: new Date().toISOString() });
    document.getElementById('onb-d-nombre').value = '';
    document.getElementById('onb-d-saldo').value  = '';
    document.getElementById('onb-d-tasa').value   = '';
    document.getElementById('onb-d-minimo').value = '';
    refreshOnbDeudas();
  });

  document.getElementById('btn-onb-finalizar').addEventListener('click', finishOnboarding);
  document.getElementById('btn-onb-saltar').addEventListener('click', () => {
    data.config.onboardingDone = true;
    saveData();
    document.getElementById('screen-onboarding').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');
    updateHeader();
    navTo('v-dashboard');
  });

  // Modal backdrop
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) overlay.classList.remove('open');
    });
  });

  initPWA();
});

// ===== MURAL DE SUEÑOS IA =====
function switchMetasTab(tab) {
  const btnObj = document.getElementById('tab-metas-objetivos');
  const btnMural = document.getElementById('tab-metas-mural');
  const secObj = document.getElementById('section-metas-objetivos');
  const secMural = document.getElementById('section-metas-mural');
  
  if (tab === 'objetivos') {
    btnObj.classList.add('active');
    btnMural.classList.remove('active');
    secObj.classList.remove('hidden');
    secMural.classList.add('hidden');
  } else {
    btnObj.classList.remove('active');
    btnMural.classList.add('active');
    secObj.classList.add('hidden');
    secMural.classList.remove('hidden');
    checkDreamKeysStatus();
    renderDreamsBoard();
  }
}

function checkDreamKeysStatus() {
  const warningBox = document.getElementById('dream-keys-warning');
  const generatorBox = document.getElementById('dream-generator-box');
  if (!warningBox || !generatorBox) return; // Mural de Sueños removido de la UI
  const hasOpenAI = !!localStorage.getItem('key-openai');
  const hasGemini = !!localStorage.getItem('key-gemini');

  if (!hasOpenAI && !hasGemini) {
    warningBox.style.display = 'flex';
    generatorBox.style.display = 'none';
    document.getElementById('dream-key-openai').value = localStorage.getItem('key-openai') || '';
    document.getElementById('dream-key-gemini').value = localStorage.getItem('key-gemini') || '';
  } else {
    warningBox.style.display = 'none';
    generatorBox.style.display = 'block';
  }
}

function saveDreamKeysInline() {
  const openai = document.getElementById('dream-key-openai').value.trim();
  const gemini = document.getElementById('dream-key-gemini').value.trim();
  localStorage.setItem('key-openai', openai);
  localStorage.setItem('key-gemini', gemini);
  toast('¡Llaves guardadas! ✓');
  checkDreamKeysStatus();
}

function saveProfileKeys() {
  const openai = document.getElementById('cfg-key-openai').value.trim();
  const gemini = document.getElementById('cfg-key-gemini').value.trim();
  localStorage.setItem('key-openai', openai);
  localStorage.setItem('key-gemini', gemini);
  toast('¡Llaves de IA guardadas! ✓');
}

function setDreamPreset(preset) {
  document.getElementById('dream-prompt').value = preset;
}

// Client-side image compression to fit local storage limit (~15-25KB per dream)
function compressAndSaveDream(promptText, imageUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = function() {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const maxDim = 320;
      let width = img.width;
      let height = img.height;
      if (width > height) {
        if (width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        }
      } else {
        if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      try {
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.75);
        resolve(compressedBase64);
      } catch (err) {
        resolve(imageUrl); // Fallback to raw URL
      }
    };
    img.onerror = () => reject(new Error('No se pudo cargar la imagen para compresión'));
    img.src = imageUrl;
  });
}

async function generateDreamImage() {
  const provider = document.getElementById('dream-provider').value;
  const prompt = document.getElementById('dream-prompt').value.trim();
  const errorConsole = document.getElementById('dream-error');
  const loader = document.getElementById('dream-loader');
  const previewContainer = document.getElementById('dream-preview-container');
  const previewImg = document.getElementById('dream-preview-img');
  const btnGenerate = document.getElementById('btn-generate-dream');
  const loaderText = document.getElementById('dream-loader-text');

  errorConsole.style.display = 'none';
  errorConsole.textContent = '';
  previewContainer.style.display = 'none';
  
  if (!prompt) {
    toast('¡Describe tu sueño!');
    return;
  }

  loader.style.display = 'flex';
  btnGenerate.disabled = true;

  try {
    if (provider.startsWith('openai')) {
      const model = provider === 'openai-dalle2' ? 'dalle2' : 'dalle3';
      loaderText.textContent = 'Conectando a DALL-E (OpenAI)...';
      await callDreamOpenAI(prompt, model);
    } else if (provider === 'gemini') {
      loaderText.textContent = 'Generando con Gemini 2.5 Flash...';
      await callDreamGemini(prompt);
    }
  } catch (err) {
    errorConsole.style.display = 'block';
    errorConsole.textContent = 'Error:\n' + err.message;
  } finally {
    loader.style.display = 'none';
    btnGenerate.disabled = false;
  }
}

async function callDreamOpenAI(prompt, model) {
  const key = localStorage.getItem('key-openai');
  if (!key) throw new Error('Llave de OpenAI no configurada.');

  const openAiModel = model === 'dalle2' ? 'dall-e-2' : 'dall-e-3';
  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + key
    },
    body: JSON.stringify({
      model: openAiModel,
      prompt: prompt,
      n: 1,
      size: openAiModel === 'dall-e-3' ? '1024x1024' : '512x512',
      quality: 'standard'
    })
  });

  const dataResponse = await response.json();
  if (!response.ok) {
    throw new Error(dataResponse.error?.message || 'Error en la API de OpenAI.');
  }

  const url = dataResponse.data[0].url;
  displayDreamPreview(url);
}

async function callDreamGemini(prompt) {
  const key = localStorage.getItem('key-gemini');
  if (!key) throw new Error('Llave de Gemini no configurada.');

  const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=' + key, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: {
        parts: [
          { text: prompt }
        ]
      },
      generationConfig: {
        responseModalities: ["IMAGE"]
      }
    })
  });

  const dataResponse = await response.json();
  if (!response.ok) {
    throw new Error(dataResponse.error?.message || 'Error en la API de Gemini.');
  }

  const part = dataResponse.candidates?.[0]?.content?.parts?.[0];
  if (part && part.inlineData && part.inlineData.data) {
    const base64 = part.inlineData.data;
    const mime = part.inlineData.mimeType || 'image/png';
    const url = `data:${mime};base64,${base64}`;
    displayDreamPreview(url);
  } else {
    throw new Error('Ningún dato de imagen devuelto por la API de Gemini.');
  }
}

let tempDreamBase64 = null;
let tempDreamPrompt = "";

function displayDreamPreview(url) {
  const previewContainer = document.getElementById('dream-preview-container');
  const previewImg = document.getElementById('dream-preview-img');
  
  tempDreamPrompt = document.getElementById('dream-prompt').value.trim();
  tempDreamBase64 = null;
  previewImg.src = url;
  previewContainer.style.display = 'flex';
  
  compressAndSaveDream(tempDreamPrompt, url)
    .then(b64 => {
      tempDreamBase64 = b64;
    })
    .catch(() => {
      tempDreamBase64 = url;
    });
}

function saveDreamImageToBoard() {
  if (!tempDreamPrompt) return;
  const imageToSave = tempDreamBase64 || document.getElementById('dream-preview-img').src;
  
  if (!data.suenos) data.suenos = [];
  data.suenos.push({
    id: uid(),
    prompt: tempDreamPrompt,
    image: imageToSave,
    fecha: new Date().toISOString()
  });
  
  saveData();
  toast('¡Sueño guardado en tu Mural! 🔮');
  
  document.getElementById('dream-preview-container').style.display = 'none';
  document.getElementById('dream-prompt').value = '';
  tempDreamPrompt = "";
  tempDreamBase64 = null;
  
  renderDreamsBoard();
}

function renderDreamsBoard() {
  const grid = document.getElementById('dreams-gallery-grid');
  if (!grid) return;
  grid.innerHTML = '';
  
  if (!data.suenos) data.suenos = [];
  
  if (data.suenos.length === 0) {
    grid.innerHTML = `<p style="grid-column: span 2; font-size:13px; color:var(--text-muted); font-weight:600; text-align:center; margin: 20px 0;">Tu Mural de Sueños está vacío. ¡Genera uno arriba!</p>`;
    return;
  }
  
  data.suenos.forEach(dream => {
    const card = document.createElement('div');
    card.className = 'dream-card';
    card.innerHTML = `
      <img src="${dream.image}" alt="Dream Visualized">
      <div class="dream-card-title">${dream.prompt}</div>
      <div class="dream-card-actions">
        <button class="dream-card-btn-delete" data-delete-dream="${dream.id}">Eliminar</button>
      </div>
    `;
    grid.appendChild(card);
  });
  
  grid.querySelectorAll('[data-delete-dream]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-delete-dream');
      deleteDream(id);
    });
  });
}

function deleteDream(id) {
  if (confirm('¿Eliminar este sueño de tu Mural?')) {
    data.suenos = data.suenos.filter(d => d.id !== id);
    saveData();
    renderDreamsBoard();
    toast('Sueño eliminado');
  }
}

// ===== CUSTOM CALCULATOR KEYPAD LOGIC =====
window.calcInput = '0';
function pressKey(key) {
  const displayVal = document.getElementById('calc-valor');
  const inputEl = document.getElementById('reg-monto');
  if (!displayVal || !inputEl) return;

  if (key === 'C') {
    window.calcInput = '0';
  } else if (key === '⌫') {
    window.calcInput = window.calcInput.slice(0, -1);
    if (window.calcInput === '' || window.calcInput === '-') {
      window.calcInput = '0';
    }
  } else if (key === '.') {
    if (!window.calcInput.includes('.')) {
      window.calcInput += '.';
    }
  } else {
    // Digit
    if (window.calcInput === '0') {
      window.calcInput = key;
    } else {
      if (window.calcInput.length < 9) {
        window.calcInput += key;
      }
    }
  }
  displayVal.textContent = window.calcInput;
  inputEl.value = window.calcInput === '0' ? '' : window.calcInput;
}

// ===== CHART.JS ENGINE =====
let myChart = null;

function drawCashFlowChart() {
  const ctx = document.getElementById('gastosChart');
  if (!ctx) return;

  // Filter expenses for current month
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const gastosDelMes = (data.transacciones || []).filter(t => {
    if (!t.fecha) return false;
    const d = new Date(t.fecha);
    return t.tipo === 'g' && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  if (gastosDelMes.length === 0) {
    if (myChart) myChart.destroy();
    ctx.style.display = 'none';
    const container = ctx.parentElement;
    let msg = container.querySelector('.no-data-msg');
    if (!msg) {
      msg = document.createElement('div');
      msg.className = 'no-data-msg';
      msg.style.cssText = 'position:absolute; top:0; left:0; right:0; bottom:0; display:flex; align-items:center; justify-content:center; color:var(--text-muted); font-size:13px; font-weight:600; text-align:center; padding:20px;';
      msg.innerHTML = 'No hay gastos registrados este mes.<br>¡Buen trabajo!';
      container.appendChild(msg);
    }
    msg.style.display = 'flex';
    return;
  }

  // Hide placeholder if exists
  const container = ctx.parentElement;
  const msg = container.querySelector('.no-data-msg');
  if (msg) msg.style.display = 'none';
  ctx.style.display = 'block';

  const catMap = {};
  gastosDelMes.forEach(g => {
    const cat = g.categoria || 'Otros';
    catMap[cat] = (catMap[cat] || 0) + (parseFloat(g.monto) || 0);
  });

  const labels = Object.keys(catMap);
  const chartData = Object.values(catMap);

  const colors = [
    '#10B981', '#F59E0B', '#3B82F6', '#EC4899', '#8B5CF6', '#ef4444', '#14b8a6', '#f97316'
  ];

  if (myChart) myChart.destroy();

  myChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: chartData,
        backgroundColor: colors,
        borderWidth: 0,
        hoverOffset: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '70%',
      plugins: {
        legend: {
          position: 'right',
          labels: {
            color: '#9ca3af',
            font: { size: 11, family: 'Inter, sans-serif', weight: '600' },
            usePointStyle: true,
            boxWidth: 8
          }
        },
        tooltip: {
          backgroundColor: 'rgba(10, 19, 14, 0.9)',
          titleFont: { size: 13, family: 'Inter, sans-serif' },
          bodyFont: { size: 14, weight: 'bold', family: 'Inter, sans-serif' },
          padding: 12,
          cornerRadius: 8,
          callbacks: {
            label: function(context) {
              let label = context.label || '';
              if (label) label += ': ';
              if (context.parsed !== null) {
                label += new Intl.NumberFormat('es-MX', { style: 'currency', currency: data.config?.moneda || 'USD' }).format(context.parsed);
              }
              return label;
            }
          }
        }
      }
    }
  });
}

// ===== EXCEL PREMIUM EXPORT ENGINE =====
function exportarExcelPremium() {
  const hs = calcularHealthScore();
  const sb = calcularSnowball();
  const totalDeuda = data.deudas.reduce((s,d) => s + (parseFloat(d.saldoActual) || 0), 0);
  const totalMinimos = data.deudas.reduce((s,d) => s + (parseFloat(d.pagoMinimo) || 0), 0);
  const deudasPagadas = data.deudas.reduce((s,d) => s + (Math.max(0, (parseFloat(d.saldoInicial) || parseFloat(d.saldoActual) || 0) - (parseFloat(d.saldoActual) || 0))), 0);
  const totalInicial = data.deudas.reduce((s,d) => s + (parseFloat(d.saldoInicial) || parseFloat(d.saldoActual) || 0), 0);
  const pctLibertad = totalInicial > 0 ? (deudasPagadas / totalInicial) : 1;

  const totalMetaObjetivo = data.metas.reduce((sum, m) => sum + (parseFloat(m.montoObjetivo) || 0), 0);
  const totalMetaAhorrado = data.metas.reduce((sum, m) => sum + (parseFloat(m.ahorrado) || 0), 0);
  const pctAhorros = totalMetaObjetivo > 0 ? (totalMetaAhorrado / totalMetaObjetivo) : 0;
  const surplus = Math.max(0, (parseFloat(data.config.ingresoMensual) || 0) - (parseFloat(data.config.gastosFijos) || 0) - totalMinimos);

  const txs = getTxsMes();

  let xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
  <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
    <Author>SinDeudas</Author>
    <Created>${new Date().toISOString()}</Created>
  </DocumentProperties>
  <Styles>
    <Style ss:ID="Default" ss:Name="Normal">
      <Alignment ss:Vertical="Bottom"/>
      <Borders/>
      <Font ss:FontName="Segoe UI" x:Family="Swiss" ss:Size="11" ss:Color="#1E293B"/>
      <Interior/>
      <NumberFormat/>
      <Protection/>
    </Style>
    <Style ss:ID="Header">
      <Font ss:FontName="Segoe UI" x:Family="Swiss" ss:Size="11" ss:Color="#FFFFFF" ss:Bold="1"/>
      <Interior ss:Color="#0F766E" ss:Pattern="Solid"/>
      <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
    </Style>
    <Style ss:ID="Title">
      <Font ss:FontName="Segoe UI" x:Family="Swiss" ss:Size="16" ss:Bold="1" ss:Color="#0F766E"/>
    </Style>
    <Style ss:ID="Label">
      <Font ss:FontName="Segoe UI" x:Family="Swiss" ss:Size="11" ss:Bold="1" ss:Color="#475569"/>
    </Style>
    <Style ss:ID="Number">
      <NumberFormat ss:Format="$#,##0.00"/>
    </Style>
    <Style ss:ID="Percent">
      <NumberFormat ss:Format="0.0%"/>
    </Style>
    <Style ss:ID="Date">
      <NumberFormat ss:Format="YYYY-MM-DD"/>
    </Style>
  </Styles>
  `;

  xml += `
  <Worksheet ss:Name="Resumen Dashboard">
    <Table>
      <Column ss:Width="180"/>
      <Column ss:Width="120"/>
      <Row ss:Height="30">
        <Cell ss:StyleID="Title"><Data ss:Type="String">SinDeudas — Dashboard de Salud Financiera</Data></Cell>
      </Row>
      <Row>
        <Cell ss:StyleID="Label"><Data ss:Type="String">Indicador</Data></Cell>
        <Cell ss:StyleID="Label"><Data ss:Type="String">Valor</Data></Cell>
      </Row>
      <Row>
        <Cell><Data ss:Type="String">Salud Financiera (Score 0-100)</Data></Cell>
        <Cell><Data ss:Type="Number">${hs.score}</Data></Cell>
      </Row>
      <Row>
        <Cell><Data ss:Type="String">Nivel de Salud</Data></Cell>
        <Cell><Data ss:Type="String">${hs.level}</Data></Cell>
      </Row>
      <Row>
        <Cell><Data ss:Type="String">Ingreso Mensual Declarado</Data></Cell>
        <Cell ss:StyleID="Number"><Data ss:Type="Number">${parseFloat(data.config.ingresoMensual) || 0}</Data></Cell>
      </Row>
      <Row>
        <Cell><Data ss:Type="String">Gastos Fijos Declarados</Data></Cell>
        <Cell ss:StyleID="Number"><Data ss:Type="Number">${parseFloat(data.config.gastosFijos) || 0}</Data></Cell>
      </Row>
      <Row>
        <Cell><Data ss:Type="String">Deuda Consolidada Actual</Data></Cell>
        <Cell ss:StyleID="Number"><Data ss:Type="Number">${totalDeuda}</Data></Cell>
      </Row>
      <Row>
        <Cell><Data ss:Type="String">Deudas Pagadas (Monto)</Data></Cell>
        <Cell ss:StyleID="Number"><Data ss:Type="Number">${deudasPagadas}</Data></Cell>
      </Row>
      <Row>
        <Cell><Data ss:Type="String">Libertad de Deudas (%)</Data></Cell>
        <Cell ss:StyleID="Percent"><Data ss:Type="Number">${pctLibertad}</Data></Cell>
      </Row>
      <Row>
        <Cell><Data ss:Type="String">Metas de Ahorro Total</Data></Cell>
        <Cell ss:StyleID="Number"><Data ss:Type="Number">${totalMetaObjetivo}</Data></Cell>
      </Row>
      <Row>
        <Cell><Data ss:Type="String">Ahorrado Consolidado</Data></Cell>
        <Cell ss:StyleID="Number"><Data ss:Type="Number">${totalMetaAhorrado}</Data></Cell>
      </Row>
      <Row>
        <Cell><Data ss:Type="String">Progreso de Ahorros (%)</Data></Cell>
        <Cell ss:StyleID="Percent"><Data ss:Type="Number">${pctAhorros}</Data></Cell>
      </Row>
    </Table>
  </Worksheet>
  `;

  xml += `
  <Worksheet ss:Name="Ingresos">
    <Table>
      <Column ss:Width="100"/>
      <Column ss:Width="150"/>
      <Column ss:Width="120"/>
      <Column ss:Width="100"/>
      <Row ss:Height="24">
        <Cell ss:StyleID="Header"><Data ss:Type="String">Fecha</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">Descripción</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">Categoría</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">Monto</Data></Cell>
      </Row>
  `;
  const ingresosTxs = data.transacciones.filter(t => t.tipo === 'i');
  if (ingresosTxs.length === 0) {
    xml += `
      <Row>
        <Cell colspan="4"><Data ss:Type="String">No hay ingresos registrados en el mes actual.</Data></Cell>
      </Row>
    `;
  } else {
    ingresosTxs.forEach(t => {
      xml += `
        <Row>
          <Cell><Data ss:Type="String">${(t.fecha || '').split('T')[0]}</Data></Cell>
          <Cell><Data ss:Type="String">${escapeXml(t.descripcion || '')}</Data></Cell>
          <Cell><Data ss:Type="String">${escapeXml(T('cat_' + (t.categoria || '').replace(/^[^\wÀ-ž]*/, '').trim()))}</Data></Cell>
          <Cell ss:StyleID="Number"><Data ss:Type="Number">${parseFloat(t.monto) || 0}</Data></Cell>
        </Row>
      `;
    });
  }
  xml += `
    </Table>
  </Worksheet>
  `;

  xml += `
  <Worksheet ss:Name="Gastos">
    <Table>
      <Column ss:Width="100"/>
      <Column ss:Width="150"/>
      <Column ss:Width="120"/>
      <Column ss:Width="110"/>
      <Column ss:Width="100"/>
      <Row ss:Height="24">
        <Cell ss:StyleID="Header"><Data ss:Type="String">Fecha</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">Descripción</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">Categoría</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">Responsable</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">Monto</Data></Cell>
      </Row>
  `;
  const gastosTxs = data.transacciones.filter(t => t.tipo === 'g');
  if (gastosTxs.length === 0) {
    xml += `
      <Row>
        <Cell colspan="5"><Data ss:Type="String">No hay gastos registrados en el mes actual.</Data></Cell>
      </Row>
    `;
  } else {
    gastosTxs.forEach(t => {
      xml += `
        <Row>
          <Cell><Data ss:Type="String">${(t.fecha || '').split('T')[0]}</Data></Cell>
          <Cell><Data ss:Type="String">${escapeXml(t.descripcion || '')}</Data></Cell>
          <Cell><Data ss:Type="String">${escapeXml(T('cat_' + (t.categoria || '').replace(/^[^\wÀ-ž]*/, '').trim()))}</Data></Cell>
          <Cell><Data ss:Type="String">${escapeXml((OWNERS[t.responsable] || 'Conjunta').replace(/^[^\wÀ-ž]*/, '').trim())}</Data></Cell>
          <Cell ss:StyleID="Number"><Data ss:Type="Number">${parseFloat(t.monto) || 0}</Data></Cell>
        </Row>
      `;
    });
  }
  xml += `
    </Table>
  </Worksheet>
  `;

  xml += `
  <Worksheet ss:Name="Plan de Deudas">
    <Table>
      <Column ss:Width="150"/>
      <Column ss:Width="100"/>
      <Column ss:Width="100"/>
      <Column ss:Width="80"/>
      <Column ss:Width="100"/>
      <Column ss:Width="180"/>
      <Row ss:Height="24">
        <Cell ss:StyleID="Header"><Data ss:Type="String">Nombre de Deuda</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">Saldo Inicial</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">Saldo Actual</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">Tasa Interés (%)</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">Pago Mínimo</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">Predicción de Libertad</Data></Cell>
      </Row>
  `;
  if (sb.deudas.length === 0) {
    xml += `
      <Row>
        <Cell colspan="6"><Data ss:Type="String">No hay deudas registradas.</Data></Cell>
      </Row>
    `;
  } else {
    sb.deudas.forEach(d => {
      const isPagada = d.saldoActual <= 0.01;
      let libreStr = 'Pagada';
      if (!isPagada && d.fechaLibre) {
        const f = d.fechaLibre;
        const mesLibre = MESES_ES[f.getMonth()];
        libreStr = `Mes ${d.mesLibre} (${mesLibre} ${f.getFullYear()})`;
      }
      xml += `
        <Row>
          <Cell><Data ss:Type="String">${escapeXml(d.nombre)}</Data></Cell>
          <Cell ss:StyleID="Number"><Data ss:Type="Number">${parseFloat(d.saldoInicial) || parseFloat(d.saldoActual) || 0}</Data></Cell>
          <Cell ss:StyleID="Number"><Data ss:Type="Number">${parseFloat(d.saldoActual) || 0}</Data></Cell>
          <Cell><Data ss:Type="Number">${parseFloat(d.tasaInteres) || 0}</Data></Cell>
          <Cell ss:StyleID="Number"><Data ss:Type="Number">${parseFloat(d.pagoMinimo) || 0}</Data></Cell>
          <Cell><Data ss:Type="String">${libreStr}</Data></Cell>
        </Row>
      `;
    });
  }
  xml += `
    </Table>
  </Worksheet>
  `;

  xml += `
  <Worksheet ss:Name="Metas de Ahorro">
    <Table>
      <Column ss:Width="150"/>
      <Column ss:Width="100"/>
      <Column ss:Width="100"/>
      <Column ss:Width="80"/>
      <Column ss:Width="150"/>
      <Row ss:Height="24">
        <Cell ss:StyleID="Header"><Data ss:Type="String">Meta</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">Objetivo</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">Ahorrado</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">Progreso (%)</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">Fecha Estimada</Data></Cell>
      </Row>
  `;
  if (data.metas.length === 0) {
    xml += `
      <Row>
        <Cell colspan="5"><Data ss:Type="String">No hay metas de ahorro registradas.</Data></Cell>
      </Row>
    `;
  } else {
    data.metas.forEach(m => {
      const pct = m.montoObjetivo > 0 ? (m.ahorrado / m.montoObjetivo) : 0;
      const lograda = pct >= 1;
      let forecastStr = 'Completado';
      if (surplus > 0 && !lograda) {
        const falta = Math.max(0, m.montoObjetivo - m.ahorrado);
        const meses = falta / surplus;
        const hoy = new Date();
        hoy.setMonth(hoy.getMonth() + Math.ceil(meses));
        const mesNom = MESES_ES[hoy.getMonth()];
        forecastStr = `${mesNom} ${hoy.getFullYear()} (en ${Math.ceil(meses)} meses)`;
      } else if (!lograda) {
        forecastStr = 'Sin plan activo';
      }
      xml += `
        <Row>
          <Cell><Data ss:Type="String">${m.emoji || '🎯'} ${escapeXml(m.nombre)}</Data></Cell>
          <Cell ss:StyleID="Number"><Data ss:Type="Number">${parseFloat(m.montoObjetivo) || 0}</Data></Cell>
          <Cell ss:StyleID="Number"><Data ss:Type="Number">${parseFloat(m.ahorrado) || 0}</Data></Cell>
          <Cell ss:StyleID="Percent"><Data ss:Type="Number">${pct}</Data></Cell>
          <Cell><Data ss:Type="String">${forecastStr}</Data></Cell>
        </Row>
      `;
    });
  }
  xml += `
    </Table>
  </Worksheet>
  `;

  xml += `
  <Worksheet ss:Name="Sobres de Presupuesto">
    <Table>
      <Column ss:Width="150"/>
      <Column ss:Width="100"/>
      <Column ss:Width="100"/>
      <Column ss:Width="100"/>
      <Column ss:Width="80"/>
      <Row ss:Height="24">
        <Cell ss:StyleID="Header"><Data ss:Type="String">Sobre (Categoría)</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">Presupuesto</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">Gastado</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">Restante</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">Porcentaje Usado</Data></Cell>
      </Row>
  `;
  const sobresEntries = Object.entries(data.config.sobres).filter(([_, val]) => val > 0);
  if (sobresEntries.length === 0) {
    xml += `
      <Row>
        <Cell colspan="5"><Data ss:Type="String">No hay presupuestos configurados para los sobres.</Data></Cell>
      </Row>
    `;
  } else {
    sobresEntries.forEach(([nombre, presupuesto]) => {
      const cleanNombre = nombre.replace(/^[^\wÀ-ž]*/, '').trim();
      const keyword = cleanNombre.toLowerCase();
      const gastadoSobre = txs
        .filter(t => t.tipo === 'g' && t.categoria && t.categoria.toLowerCase().includes(keyword))
        .reduce((s,t) => s + t.monto, 0);
      const pct = presupuesto > 0 ? (gastadoSobre / presupuesto) : 0;
      const restante = Math.max(0, presupuesto - gastadoSobre);
      xml += `
        <Row>
          <Cell><Data ss:Type="String">${escapeXml(nombre)}</Data></Cell>
          <Cell ss:StyleID="Number"><Data ss:Type="Number">${presupuesto}</Data></Cell>
          <Cell ss:StyleID="Number"><Data ss:Type="Number">${gastadoSobre}</Data></Cell>
          <Cell ss:StyleID="Number"><Data ss:Type="Number">${restante}</Data></Cell>
          <Cell ss:StyleID="Percent"><Data ss:Type="Number">${pct}</Data></Cell>
        </Row>
      `;
    });
  }
  xml += `
    </Table>
  </Worksheet>
  `;

  xml += `</Workbook>`;

  const blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'SinDeudas_Reporte_Premium_' + new Date().toISOString().split('T')[0] + '.xls';
  a.click();
}

function escapeXml(unsafe) {
  return unsafe.replace(/[<>&'"]/g, function (c) {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
    }
  });
}

// ===== PDF EXECUTIVE REPORT GENERATOR =====
function generarReportePDF() {
  const printEl = document.getElementById('print-report-view');
  if (!printEl) return;

  const hs = calcularHealthScore();
  const sb = calcularSnowball();
  const totalDeuda = data.deudas.reduce((s,d) => s + (parseFloat(d.saldoActual) || 0), 0);
  const totalMinimos = data.deudas.reduce((s,d) => s + (parseFloat(d.pagoMinimo) || 0), 0);
  
  const totalMetaObjetivo = data.metas.reduce((sum, m) => sum + (parseFloat(m.montoObjetivo) || 0), 0);
  const totalMetaAhorrado = data.metas.reduce((sum, m) => sum + (parseFloat(m.ahorrado) || 0), 0);
  const surplus = Math.max(0, (parseFloat(data.config.ingresoMensual) || 0) - (parseFloat(data.config.gastosFijos) || 0) - totalMinimos);

  let html = `
    <div style="font-family:'Segoe UI', sans-serif; color:#1E293B; max-width:800px; margin:0 auto; padding:20px;">
      <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:3px solid #0f766e; padding-bottom:14px; margin-bottom:24px;">
        <div>
          <h1 style="margin:0; font-size:26px; color:#0f766e; font-weight:800; letter-spacing:-0.5px;">INFORME DE SALUD FINANCIERA</h1>
          <p style="margin:4px 0 0 0; font-size:12px; color:#64748B; font-weight:600;">Generado por SinDeudas PWA · Plan de Recuperación de Deudas</p>
        </div>
        <div style="text-align:right;">
          <div style="font-size:24px; font-weight:800; margin:0;">💸 <span style="font-size:20px; color:#0f766e;">SinDeudas</span></div>
          <div style="font-size:11px; color:#64748B; font-weight:700; margin-top:4px;">Fecha: ${new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
        </div>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:16px; margin-bottom:24px;">
        <div style="background:#f1f5f9; border:1px solid #e2e8f0; padding:12px; border-radius:8px;">
          <div style="font-size:10px; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:0.5px;">Salud Financiera</div>
          <div style="font-size:20px; font-weight:800; color:${hs.color}; margin-top:4px;">${hs.score} / 100</div>
          <div style="font-size:11px; font-weight:700; color:#475569; margin-top:2px;">${hs.level}</div>
        </div>
        <div style="background:#f1f5f9; border:1px solid #e2e8f0; padding:12px; border-radius:8px;">
          <div style="font-size:10px; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:0.5px;">Deuda Consolidada</div>
          <div style="font-size:20px; font-weight:800; color:#ef4444; margin-top:4px;">${fmt(totalDeuda)}</div>
          <div style="font-size:11px; font-weight:700; color:#475569; margin-top:2px;">Plan: Snowball (Bola de Nieve)</div>
        </div>
        <div style="background:#f1f5f9; border:1px solid #e2e8f0; padding:12px; border-radius:8px;">
          <div style="font-size:10px; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:0.5px;">Surplus Mensual (Ahorro)</div>
          <div style="font-size:20px; font-weight:800; color:#10b981; margin-top:4px;">${fmt(surplus)}</div>
          <div style="font-size:11px; font-weight:700; color:#475569; margin-top:2px;">Capacidad de pago extra</div>
        </div>
      </div>

      <div style="margin-bottom:24px;">
        <h3 style="font-size:14px; border-left:4px solid #0f766e; padding-left:8px; margin:0 0 12px 0; color:#0f766e;">⚙️ Parámetros Mensuales</h3>
        <table style="width:100%; border-collapse:collapse; font-size:12px;">
          <tr>
            <td style="padding:6px; border-bottom:1px solid #e2e8f0; font-weight:700; color:#475569; width:50%;">Ingresos Mensuales Declarados</td>
            <td style="padding:6px; border-bottom:1px solid #e2e8f0; font-weight:800; text-align:right;">${fmt(data.config.ingresoMensual)}</td>
          </tr>
          <tr>
            <td style="padding:6px; border-bottom:1px solid #e2e8f0; font-weight:700; color:#475569;">Gastos Fijos Mensuales</td>
            <td style="padding:6px; border-bottom:1px solid #e2e8f0; font-weight:800; text-align:right; color:#ef4444;">${fmt(data.config.gastosFijos)}</td>
          </tr>
        </table>
      </div>

      ${(() => {
        const gr = gastosPorResponsable();
        if (!gr.length) return '';
        const filas = gr.map(r => `<tr><td style="padding:6px; border-bottom:1px solid #e2e8f0; font-weight:700; color:#475569;">${r.label}</td><td style="padding:6px; border-bottom:1px solid #e2e8f0; font-weight:800; text-align:right; color:#ef4444;">${fmt(r.total)}</td></tr>`).join('');
        return `<div style="margin-bottom:24px;"><h3 style="font-size:14px; border-left:4px solid #0f766e; padding-left:8px; margin:0 0 12px 0; color:#0f766e;">👥 Gastos por responsable (miembro de la familia)</h3><table style="width:100%; border-collapse:collapse; font-size:12px;"><thead><tr style="background:#e2e8f0;"><th style="padding:8px; text-align:left; border-bottom:2px solid #cbd5e1;">Responsable</th><th style="padding:8px; text-align:right; border-bottom:2px solid #cbd5e1;">Total gastado</th></tr></thead><tbody>${filas}</tbody></table></div>`;
      })()}

      <div style="margin-bottom:24px;">
        <h3 style="font-size:14px; border-left:4px solid #0f766e; padding-left:8px; margin:0 0 12px 0; color:#0f766e;">💳 Plan de Libertad de Deudas (Bola de Nieve)</h3>
        <p style="font-size:11px; color:#64748b; margin:-6px 0 12px 0;">El método Snowball prioriza liquidar primero las deudas de menor saldo para ganar motivación rápido.</p>
        
        <table style="width:100%; border-collapse:collapse; font-size:11px;">
          <thead>
            <tr style="background:#e2e8f0;">
              <th style="padding:8px; text-align:left; border-bottom:2px solid #cbd5e1;">Prioridad / Deuda</th>
              <th style="padding:8px; text-align:right; border-bottom:2px solid #cbd5e1;">Saldo Inicial</th>
              <th style="padding:8px; text-align:right; border-bottom:2px solid #cbd5e1;">Saldo Actual</th>
              <th style="padding:8px; text-align:right; border-bottom:2px solid #cbd5e1;">Tasa</th>
              <th style="padding:8px; text-align:right; border-bottom:2px solid #cbd5e1;">Mínimo</th>
              <th style="padding:8px; text-align:right; border-bottom:2px solid #cbd5e1;">Proyección de Pago</th>
            </tr>
          </thead>
          <tbody>
  `;

  if (sb.deudas.length === 0) {
    html += `<tr><td colspan="6" style="padding:12px; text-align:center; color:#64748b;">No hay deudas activas registradas. ¡Felicidades!</td></tr>`;
  } else {
    sb.deudas.forEach((d, idx) => {
      const isPagada = d.saldoActual <= 0.01;
      const saldoInicial = d.saldoInicial || d.saldoActual;
      let libreStr = 'Pagada';
      if (!isPagada && d.fechaLibre) {
        const f = d.fechaLibre;
        const mesLibre = MESES_ES[f.getMonth()];
        libreStr = `${mesLibre.charAt(0).toUpperCase() + mesLibre.slice(1)} ${f.getFullYear()} (en ${d.mesLibre} mes${d.mesLibre > 1 ? 'es' : ''})`;
      }
      html += `
        <tr style="border-bottom:1px solid #e2e8f0; background:${isPagada ? '#f0fdf4' : 'none'};">
          <td style="padding:8px; font-weight:700; color:#334155;">#${idx+1} ${d.nombre} ${isPagada ? '✅' : ''}</td>
          <td style="padding:8px; text-align:right; color:#475569;">${fmt(saldoInicial)}</td>
          <td style="padding:8px; text-align:right; font-weight:700; color:${isPagada ? '#10b981' : '#ef4444'}">${fmt(d.saldoActual)}</td>
          <td style="padding:8px; text-align:right; color:#475569;">${d.tasaInteres || 0}% mes</td>
          <td style="padding:8px; text-align:right; color:#475569;">${fmt(d.pagoMinimo)}</td>
          <td style="padding:8px; text-align:right; font-weight:700; color:#0f766e;">${libreStr}</td>
        </tr>
      `;
    });
  }

  html += `
          </tbody>
        </table>
  `;

  if (sb.fechaLibertad) {
    const f = sb.fechaLibertad;
    const mesLibre = MESES_ES[f.getMonth()];
    html += `
      <div style="background:#ecfdf5; border:1.5px solid #10b981; padding:14px; border-radius:8px; margin-top:14px; display:flex; justify-content:space-between; align-items:center;">
        <div>
          <div style="font-size:10px; font-weight:800; color:#047857; text-transform:uppercase; letter-spacing:0.5px;">Predicción Libre de Deudas</div>
          <div style="font-size:16px; font-weight:800; color:#065f46; margin-top:2px;">${mesLibre.charAt(0).toUpperCase() + mesLibre.slice(1)} ${f.getFullYear()} (en ${sb.mesesTotales} meses)</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:11px; font-weight:700; color:#047857;">Ahorro de Intereses: <span style="font-weight:800;">${fmt(sb.interesAhorrado)}</span></div>
          <div style="font-size:11px; font-weight:700; color:#047857; margin-top:2px;">Meses Ahorrados con Snowball: <span style="font-weight:800;">${sb.mesesAhorrados} meses</span></div>
        </div>
      </div>
    `;
  }

  html += `
      </div>

      <div style="margin-bottom:24px;">
        <h3 style="font-size:14px; border-left:4px solid #0f766e; padding-left:8px; margin:0 0 12px 0; color:#0f766e;">🎯 Metas de Ahorro Colectivas</h3>
        <table style="width:100%; border-collapse:collapse; font-size:11px;">
          <thead>
            <tr style="background:#e2e8f0;">
              <th style="padding:8px; text-align:left; border-bottom:2px solid #cbd5e1;">Meta / Emoji</th>
              <th style="padding:8px; text-align:right; border-bottom:2px solid #cbd5e1;">Monto Objetivo</th>
              <th style="padding:8px; text-align:right; border-bottom:2px solid #cbd5e1;">Monto Ahorrado</th>
              <th style="padding:8px; text-align:right; border-bottom:2px solid #cbd5e1;">Progreso %</th>
              <th style="padding:8px; text-align:right; border-bottom:2px solid #cbd5e1;">Estimado de Logro</th>
            </tr>
          </thead>
          <tbody>
  `;

  if (data.metas.length === 0) {
    html += `<tr><td colspan="5" style="padding:12px; text-align:center; color:#64748b;">No hay metas de ahorro activas.</td></tr>`;
  } else {
    data.metas.forEach(m => {
      const pct = m.montoObjetivo > 0 ? Math.min((m.ahorrado / m.montoObjetivo) * 100, 100) : 0;
      const lograda = pct >= 100;
      let forecastStr = 'Completado';
      if (surplus > 0 && !lograda) {
        const falta = Math.max(0, m.montoObjetivo - m.ahorrado);
        const meses = falta / surplus;
        const hoy = new Date();
        hoy.setMonth(hoy.getMonth() + Math.ceil(meses));
        const mesNom = MESES_ES[hoy.getMonth()];
        forecastStr = `${mesNom} ${hoy.getFullYear()} (en ${Math.ceil(meses)} m)`;
      } else if (!lograda) {
        forecastStr = 'Sin plan activo';
      }
      html += `
        <tr style="border-bottom:1px solid #e2e8f0;">
          <td style="padding:8px; font-weight:700; color:#334155;">${m.emoji || '🎯'} ${escapeXml(m.nombre)}</td>
          <td style="padding:8px; text-align:right; color:#475569;">${fmt(m.montoObjetivo)}</td>
          <td style="padding:8px; text-align:right; font-weight:700; color:#0f766e;">${fmt(m.ahorrado)}</td>
          <td style="padding:8px; text-align:right; color:#475569;">${Math.round(pct)}%</td>
          <td style="padding:8px; text-align:right; font-weight:700; color:#475569;">${forecastStr}</td>
        </tr>
      `;
    });
  }

  html += `
          </tbody>
        </table>
      </div>

      <div style="margin-bottom:24px;">
        <h3 style="font-size:14px; border-left:4px solid #0f766e; padding-left:8px; margin:0 0 12px 0; color:#0f766e;">📊 Sobres de Presupuesto Mensual</h3>
        <table style="width:100%; border-collapse:collapse; font-size:11px;">
          <thead>
            <tr style="background:#e2e8f0;">
              <th style="padding:8px; text-align:left; border-bottom:2px solid #cbd5e1;">Categoría</th>
              <th style="padding:8px; text-align:right; border-bottom:2px solid #cbd5e1;">Presupuesto Asignado</th>
              <th style="padding:8px; text-align:right; border-bottom:2px solid #cbd5e1;">Monto Gastado</th>
              <th style="padding:8px; text-align:right; border-bottom:2px solid #cbd5e1;">Monto Disponible</th>
              <th style="padding:8px; text-align:right; border-bottom:2px solid #cbd5e1;">Límite Usado</th>
            </tr>
          </thead>
          <tbody>
  `;

  const txs = getTxsMes();
  const sobres = data.config.sobres;
  const entries = Object.entries(sobres).filter(([_, val]) => val > 0);

  if (entries.length === 0) {
    html += `<tr><td colspan="5" style="padding:12px; text-align:center; color:#64748b;">No hay presupuestos asignados a sobres.</td></tr>`;
  } else {
    entries.forEach(([nombre, presupuesto]) => {
      const cleanNombre = nombre.replace(/^[^\wÀ-ž]*/, '').trim();
      const nombreTrad = T('cat_' + cleanNombre);
      const keyword = cleanNombre.toLowerCase();
      const gastadoSobre = txs
        .filter(t => t.tipo === 'g' && t.categoria && t.categoria.toLowerCase().includes(keyword))
        .reduce((s,t) => s + t.monto, 0);
      const pct = Math.round((gastadoSobre / presupuesto) * 100);
      const restante = Math.max(0, presupuesto - gastadoSobre);
      const over = gastadoSobre > presupuesto;

      html += `
        <tr style="border-bottom:1px solid #e2e8f0; background:${over ? '#fef2f2' : 'none'};">
          <td style="padding:8px; font-weight:700; color:#334155;">${nombreTrad}</td>
          <td style="padding:8px; text-align:right; color:#475569;">${fmt(presupuesto)}</td>
          <td style="padding:8px; text-align:right; font-weight:700; color:${over ? '#ef4444' : '#334155'}">${fmt(gastadoSobre)}</td>
          <td style="padding:8px; text-align:right; font-weight:700; color:${over ? '#ef4444' : '#10b981'}">${fmt(restante)}</td>
          <td style="padding:8px; text-align:right; font-weight:700; color:${over ? '#ef4444' : '#0f766e'}">${pct}%</td>
        </tr>
      `;
    });
  }

  html += `
          </tbody>
        </table>
      </div>

      <div style="text-align:center; border-top:1px solid #e2e8f0; padding-top:16px; margin-top:36px; font-size:10px; color:#94a3b8; font-weight:600;">
        "Recuperando el control del dinero y construyendo paz financiera."<br>
        SinDeudas PWA — Software de Recuperación Financiera para América Latina.
      </div>
    </div>
  `;

  printEl.innerHTML = html;
  window.print();
}

// ===== PWA INSTALL PROMPT (Android nativo + iOS instrucciones) =====
let deferredPrompt = null;

(function initInstallPrompt(){
  const KEY = 'pwa_prompt_dismissed_at';
  const REMIND_DAYS = 7;

  const isStandalone = () =>
    window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  const isIOS = () =>
    /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); // iPadOS
  const appVisible = () => {
    const app = document.getElementById('app');
    return app && !app.classList.contains('hidden');
  };
  const dismissedRecently = () => {
    const t = parseInt(localStorage.getItem(KEY) || '0', 10);
    return t && (Date.now() - t) < REMIND_DAYS * 86400000;
  };
  function dismiss(){
    try { localStorage.setItem(KEY, String(Date.now())); } catch(e){}
    const el = document.getElementById('pwa-banner');
    if (el) el.remove();
  }
  const tr = (k, fb) => (typeof T === 'function' && T(k) !== k) ? T(k) : fb;

  function ensureStyles(){
    if (document.getElementById('pwa-banner-style')) return;
    const s = document.createElement('style');
    s.id = 'pwa-banner-style';
    s.textContent =
      '#pwa-banner{position:fixed;left:12px;right:12px;bottom:calc(env(safe-area-inset-bottom,0px) + 80px);z-index:9999;background:var(--card-bg,#10231a);border:1px solid var(--border,rgba(255,255,255,.12));border-radius:16px;box-shadow:0 16px 44px rgba(0,0,0,.55);padding:14px;display:flex;gap:12px;align-items:flex-start;animation:pwaUp .3s ease;max-width:520px;margin:0 auto}' +
      '@keyframes pwaUp{from{transform:translateY(24px);opacity:0}to{transform:translateY(0);opacity:1}}' +
      '#pwa-banner .pwa-ico{font-size:26px;line-height:1;flex-shrink:0}' +
      '#pwa-banner .pwa-body{flex:1;min-width:0}' +
      '#pwa-banner .pwa-t{font-weight:800;font-size:14.5px;color:var(--text-main,#eafaf2)}' +
      '#pwa-banner .pwa-s{font-size:12.5px;color:var(--text-muted,#93b3a4);font-weight:600;margin-top:2px}' +
      '#pwa-banner ol{margin:8px 0 0;padding-left:18px;font-size:12.5px;color:var(--text-muted,#93b3a4);font-weight:600;line-height:1.65}' +
      '#pwa-banner .pwa-actions{display:flex;gap:8px;margin-top:10px}' +
      '#pwa-banner button{border:none;border-radius:10px;font-weight:800;font-size:13px;padding:9px 14px;cursor:pointer;font-family:inherit}' +
      '#pwa-banner .pwa-go{background:var(--primary,#10b981);color:#fff}' +
      '#pwa-banner .pwa-no{background:transparent;color:var(--text-muted,#93b3a4)}';
    document.head.appendChild(s);
  }

  function showAndroid(){
    if (document.getElementById('pwa-banner') || !deferredPrompt) return;
    ensureStyles();
    const b = document.createElement('div');
    b.id = 'pwa-banner';
    b.innerHTML =
      '<div class="pwa-ico">📱</div><div class="pwa-body">' +
      '<div class="pwa-t">' + tr('pwa_android_titulo','Instalar SinDeudas') + '</div>' +
      '<div class="pwa-s">' + tr('pwa_android_sub','Accede rápido desde tu pantalla de inicio.') + '</div>' +
      '<div class="pwa-actions"><button class="pwa-go" id="pwa-go">' + tr('pwa_android_btn','Instalar') + '</button>' +
      '<button class="pwa-no" id="pwa-no">' + tr('pwa_android_despues','Ahora no') + '</button></div></div>';
    document.body.appendChild(b);
    document.getElementById('pwa-no').onclick = dismiss;
    document.getElementById('pwa-go').onclick = async () => {
      if (!deferredPrompt) { dismiss(); return; }
      deferredPrompt.prompt();
      try { await deferredPrompt.userChoice; } catch(e){}
      deferredPrompt = null;
      dismiss();
    };
  }

  function showIOS(){
    if (document.getElementById('pwa-banner')) return;
    ensureStyles();
    const b = document.createElement('div');
    b.id = 'pwa-banner';
    b.innerHTML =
      '<div class="pwa-ico">📲</div><div class="pwa-body">' +
      '<div class="pwa-t">' + tr('pwa_ios_titulo','Instalar SinDeudas') + '</div>' +
      '<div class="pwa-s">' + tr('pwa_ios_sub','Agrega SinDeudas a tu pantalla de inicio para acceder sin internet.') + '</div>' +
      '<ol><li>' + tr('pwa_ios_paso1','Toca el botón Compartir (⬆️) en Safari') + '</li>' +
      '<li>' + tr('pwa_ios_paso2','Selecciona "Agregar a pantalla de inicio"') + '</li>' +
      '<li>' + tr('pwa_ios_paso3','Toca "Agregar" para confirmar') + '</li></ol>' +
      '<div class="pwa-actions"><button class="pwa-no" id="pwa-no">' + tr('pwa_ios_btn','¡Entendido!') + '</button></div></div>';
    document.body.appendChild(b);
    document.getElementById('pwa-no').onclick = dismiss;
  }

  function decideAndShow(){
    if (isStandalone() || dismissedRecently()) return;
    if (isIOS()) showIOS();
    else if (deferredPrompt) showAndroid();
  }

  // Muestra el banner cuando el usuario ya está dentro de la app (tras login)
  function maybeShow(){
    if (isStandalone() || dismissedRecently()) return;
    if (appVisible()) setTimeout(decideAndShow, 1500);
    else window.addEventListener('auth-success', () => setTimeout(decideAndShow, 1500), { once: true });
  }

  // Android: captura el prompt nativo
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    // Botón en Perfil (sigue funcionando)
    const btnInstall = document.getElementById('btn-install-pwa');
    if (btnInstall) {
      btnInstall.style.display = 'block';
      btnInstall.onclick = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        try { await deferredPrompt.userChoice; } catch(e){}
        deferredPrompt = null;
        btnInstall.style.display = 'none';
        const el = document.getElementById('pwa-banner'); if (el) el.remove();
      };
    }
    maybeShow();
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    const btnInstall = document.getElementById('btn-install-pwa');
    if (btnInstall) btnInstall.style.display = 'none';
    dismiss();
  });

  // iOS no dispara beforeinstallprompt -> mostramos instrucciones nosotros
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { if (isIOS()) maybeShow(); });
  } else if (isIOS()) {
    maybeShow();
  }
})();

// ===== Recordatorios diarios (opt-in, sin pedir permiso al cargar) =====
function toggleRecordatorios() {
  if (!('Notification' in window)) { toast('Tu navegador no soporta notificaciones'); return; }
  if (data.config.recordatorios) {
    data.config.recordatorios = false;
    saveData();
    renderPerfil();
    toast('Recordatorios desactivados');
    return;
  }
  Notification.requestPermission().then(p => {
    if (p === 'granted') {
      data.config.recordatorios = true;
      saveData();
      renderPerfil();
      toast('¡Recordatorios activados! 🔔');
    } else {
      toast('Activa los permisos de notificación para usar recordatorios');
    }
  });
}
window.toggleRecordatorios = toggleRecordatorios;

function maybeDailyReminder() {
  try {
    if (!data.config || !data.config.recordatorios) return;
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    const hoy = new Date().toISOString().split('T')[0];
    if (data.config.lastReminder === hoy) return;
    data.config.lastReminder = hoy;
    saveData();
    const sb = (typeof calcularSnowball === 'function') ? calcularSnowball() : null;
    const cuerpo = (sb && sb.mesesTotales)
      ? `Sigue tu plan: te faltan ${sb.mesesTotales} meses para ser libre de deudas 💪`
      : 'Registra tus gastos de hoy y mantén el control de tu dinero 💸';
    new Notification('SinDeudas', { body: cuerpo, icon: 'app-icon.png' });
  } catch (e) {}
}
window.addEventListener('auth-success', () => setTimeout(maybeDailyReminder, 4000));

// ===== Compartir mi progreso (viralidad) =====
function compartirProgreso() {
  const score = (typeof calcularHealthScore === 'function') ? calcularHealthScore() : { score: 0 };
  const sb = (typeof calcularSnowball === 'function') ? calcularSnowball() : null;
  let txt = '💸 Estoy organizando mis finanzas con SinDeudas.\n';
  txt += `📊 Mi salud financiera: ${score.score}/100\n`;
  if (sb && sb.fechaLibertad) {
    const f = sb.fechaLibertad;
    const mes = MESES_ES[f.getMonth()];
    txt += `🗓️ Seré libre de deudas en ${mes.charAt(0).toUpperCase() + mes.slice(1)} ${f.getFullYear()} (en ${sb.mesesTotales} meses).\n`;
  }
  txt += '\n¿Quieres salir de deudas tú también? 👉 https://sindeudas.pages.dev';
  if (navigator.share) {
    navigator.share({ title: 'SinDeudas', text: txt }).catch(() => {});
  } else {
    navigator.clipboard?.writeText(txt).then(() => toast('¡Copiado! Pégalo donde quieras 📋')).catch(() => alert(txt));
  }
}
window.compartirProgreso = compartirProgreso;

// ===== Soporte por WhatsApp =====
// Cambia el número (formato internacional, sin + ni espacios) por el tuyo de soporte.
const WHATSAPP_SOPORTE = '5215555555555';
function abrirSoporteWhatsApp() {
  const msg = encodeURIComponent('Hola, necesito ayuda con la app SinDeudas.');
  window.open(`https://wa.me/${WHATSAPP_SOPORTE}?text=${msg}`, '_blank');
}
window.abrirSoporteWhatsApp = abrirSoporteWhatsApp;
