// ===== SinDeudas app.js — Modo prueba (sin auth) =====

const DEFAULT_DATA = {
  version: 1,
  config: {
    ingresoMensual: 0,
    gastosFijos: 0,
    moneda: '$',
    onboardingDone: false,
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
  reto52: { activo: false, montoSemanal: 50, semanas: [] }
};

let data = JSON.parse(JSON.stringify(DEFAULT_DATA));
let selectedTipo = 'i';
let selectedCat = '';
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
    }
  } catch(e) {
    data = JSON.parse(JSON.stringify(DEFAULT_DATA));
  }
}
function saveData() {
  localStorage.setItem('sd_data', JSON.stringify(data));
}

// ===== UTILS =====
function uid() {
  return (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);
}
function fmt(n) {
  const sym = (data.config && data.config.moneda) ? data.config.moneda : '$';
  const num = Number(n) || 0;
  return sym + num.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function toast(msg, duration) {
  duration = duration || 2800;
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), duration);
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
  if (viewId === 'v-dashboard') renderDashboard();
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
  } else {
    btnG.className = 'tipo-btn active-g';
    btnI.className = 'tipo-btn';
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

  document.getElementById('dash-saldo-label').textContent = '💰 Dinero disponible este mes';
  const saldoEl = document.getElementById('dash-saldo-valor');
  saldoEl.textContent = fmt(saldo);
  saldoEl.style.color = saldo >= 0 ? '#fff' : '#fca5a5';
  document.getElementById('dash-ingresos').textContent = fmt(ingresos);
  document.getElementById('dash-gastos').textContent   = fmt(gastos);
  document.getElementById('dash-sobres-titulo').textContent = '📊 Mis Sobres';
  document.getElementById('dash-mov-titulo').textContent    = '🕐 Últimos movimientos';

  // Sobres
  const sobresContainer = document.getElementById('dash-sobres-container');
  sobresContainer.innerHTML = '';
  const sobres = data.config.sobres;
  const tienePresupuesto = Object.values(sobres).some(v => v > 0);
  if (!tienePresupuesto) {
    sobresContainer.innerHTML = '<p style="font-size:13px;color:var(--text-muted);font-weight:600;">Configura tus sobres en <b>Perfil</b>.</p>';
  } else {
    Object.entries(sobres).forEach(([nombre, presupuesto]) => {
      if (!presupuesto) return;
      const keyword = nombre.replace(/^[^\wÀ-ž]*/, '').split(' ')[0].toLowerCase();
      const gastadoSobre = txs
        .filter(t => t.tipo === 'g' && t.categoria && t.categoria.toLowerCase().includes(keyword))
        .reduce((s,t) => s + t.monto, 0);
      const pct  = Math.min((gastadoSobre / presupuesto) * 100, 100);
      const over = gastadoSobre > presupuesto;
      const item = document.createElement('div');
      item.className = 'sobre-item';
      item.innerHTML = `
        <div class="sobre-header">
          <span class="sobre-nombre">${nombre}</span>
          <span class="sobre-valores">${fmt(gastadoSobre)} / ${fmt(presupuesto)}</span>
        </div>
        <div class="sobre-bar-wrap">
          <div class="sobre-bar${over?' over':''}" style="width:${pct}%"></div>
        </div>`;
      sobresContainer.appendChild(item);
    });
  }

  // Últimos 8 movimientos
  const movContainer = document.getElementById('dash-movimientos');
  movContainer.innerHTML = '';
  const last8 = [...data.transacciones].sort((a,b) => new Date(b.fecha)-new Date(a.fecha)).slice(0,8);
  if (!last8.length) {
    movContainer.innerHTML = '<p style="font-size:13px;color:var(--text-muted);font-weight:600;">Sin movimientos este mes.</p>';
  } else {
    last8.forEach(tx => movContainer.appendChild(buildMovRow(tx, false)));
  }
}

function buildMovRow(tx, showDelete) {
  const row  = document.createElement('div');
  row.className = 'mov-row';
  const icon    = tx.tipo === 'i' ? '💚' : (tx.categoria ? tx.categoria.split(' ')[0] : '📊');
  const d       = new Date(tx.fecha);
  const dateStr = d.getDate() + ' ' + MESES_ES[d.getMonth()];
  const sign    = tx.tipo === 'i' ? '+' : '-';
  const color   = tx.tipo === 'i' ? 'var(--ok)' : 'var(--danger)';
  row.innerHTML = `
    <div class="mov-emoji">${icon}</div>
    <div class="mov-info">
      <div class="mov-nome">${tx.descripcion || tx.categoria || (tx.tipo==='i'?'Ingreso':'Gasto')}</div>
      <div class="mov-data">${tx.categoria || ''} · ${dateStr}</div>
    </div>
    <div class="mov-valor" style="color:${color}">${sign}${fmt(tx.monto)}</div>`;
  if (showDelete) {
    const btn = document.createElement('button');
    btn.style.cssText = 'background:none;border:none;cursor:pointer;font-size:16px;padding:6px;min-width:36px;min-height:36px;color:var(--text-muted);';
    btn.textContent = '🗑️';
    btn.addEventListener('click', () => {
      data.transacciones = data.transacciones.filter(t => t.id !== tx.id);
      saveData();
      toast('Movimiento eliminado');
      renderHistorialMes();
      renderDashboard();
    });
    row.appendChild(btn);
  }
  return row;
}

// ===== SNOWBALL =====
function calcularSnowball() {
  const deudas = data.deudas;
  if (!deudas.length) return { deudas: [], fechaLibertad: null, extraMensual: 0 };

  const totalMinimos  = deudas.reduce((s,d) => s + (d.pagoMinimo || 0), 0);
  const extraMensual  = Math.max(0, (data.config.ingresoMensual || 0) - (data.config.gastosFijos || 0) - totalMinimos);

  const hoy    = new Date();
  const saldos = deudas.map(d => ({
    ...d,
    saldo:     d.saldoActual,
    mesLibre:  null,
    fechaLibre: null
  })).sort((a,b) => a.saldoActual - b.saldoActual);

  let extraPool = extraMensual;

  for (let mes = 1; mes <= 600; mes++) {
    const activos = saldos.filter(d => d.saldo > 0.01);
    if (!activos.length) break;
    const focus = activos[0];

    for (const d of activos) {
      const interes = d.saldo * ((d.tasaInteres || 0) / 100);
      d.saldo += interes;
      let pago = d.pagoMinimo || 0;
      if (d.id === focus.id) pago += extraPool;
      pago = Math.min(pago, d.saldo);
      d.saldo -= pago;
      if (d.saldo <= 0.01 && d.mesLibre === null) {
        d.saldo = 0;
        d.mesLibre = mes;
        const f = new Date(hoy);
        f.setMonth(f.getMonth() + mes);
        d.fechaLibre = f;
        extraPool += (d.pagoMinimo || 0);
      }
    }
  }

  const pagadas   = saldos.filter(d => d.fechaLibre);
  const ultimaDeu = pagadas.sort((a,b) => b.mesLibre - a.mesLibre)[0];

  return {
    deudas:        saldos,
    fechaLibertad: ultimaDeu ? ultimaDeu.fechaLibre : null,
    mesesTotales:  ultimaDeu ? ultimaDeu.mesLibre   : null,
    extraMensual
  };
}

// ===== RENDER DEUDAS =====
function renderDeudas() {
  document.getElementById('deudas-titulo').textContent  = '💳 Plan Sal de Deudas';
  document.getElementById('btn-nueva-deuda').textContent = '➕ Nueva Deuda';

  const heroWrap  = document.getElementById('libertad-hero-wrap');
  const listEl    = document.getElementById('deudas-list');
  const extraWrap = document.getElementById('deudas-extra-wrap');
  heroWrap.innerHTML  = '';
  listEl.innerHTML    = '';
  extraWrap.innerHTML = '';

  if (!data.deudas.length) {
    listEl.innerHTML = '<div class="card" style="text-align:center;padding:32px 20px;"><div style="font-size:40px;margin-bottom:10px;">🎉</div><p style="font-weight:800;font-size:17px;">¡Sin deudas registradas!</p><p style="font-size:13px;color:var(--text-muted);margin-top:8px;">Agrega tus deudas para calcular tu Plan Snowball.</p></div>';
    return;
  }

  const sb = calcularSnowball();

  // Hero Fecha de Libertad
  if (sb.fechaLibertad) {
    const f = sb.fechaLibertad;
    const mesLibre = MESES_ES[f.getMonth()];
    heroWrap.innerHTML = `
      <div class="libertad-hero">
        <div class="libertad-sub">🗓️ Tu Fecha de Libertad</div>
        <div class="libertad-fecha">${mesLibre.charAt(0).toUpperCase()+mesLibre.slice(1)} ${f.getFullYear()}</div>
        <div class="libertad-sub">en ${sb.mesesTotales} meses · ${fmt(data.deudas.reduce((s,d)=>s+d.saldoActual,0))} deuda total</div>
      </div>`;
  }

  // Tarjetas de deuda
  sb.deudas.forEach((d, idx) => {
    const isFoco       = idx === 0 && d.saldo > 0.01;
    const saldoInicial = d.saldoInicial || d.saldoActual;
    const pagado       = Math.max(0, saldoInicial - d.saldoActual);
    const pct          = saldoInicial > 0 ? Math.min((pagado / saldoInicial) * 100, 100) : 0;
    const card         = document.createElement('div');
    card.className     = 'deuda-card' + (isFoco ? ' foco' : '');
    let libreStr = '';
    if (d.fechaLibre) {
      const f = d.fechaLibre;
      libreStr = `Libre en ${d.mesLibre} meses · ${MESES_ES[f.getMonth()]} ${f.getFullYear()}`;
    }
    card.innerHTML = `
      ${isFoco ? '<div class="deuda-foco-badge">FOCO 🔥</div>' : ''}
      <div class="deuda-nombre">${d.nombre}</div>
      <div class="deuda-saldo">${fmt(d.saldoActual)}</div>
      <div class="deuda-meta-row">
        <span>Mín/mes: ${fmt(d.pagoMinimo)}</span>
        ${d.tasaInteres ? '<span>'+d.tasaInteres+'% mensual</span>' : ''}
      </div>
      <div class="deuda-progress-wrap">
        <div class="deuda-progress-bar${pct>=100?' pagada':''}" style="width:${pct}%"></div>
      </div>
      ${libreStr ? '<div class="deuda-libre-en">📅 '+libreStr+'</div>' : ''}
      <div style="display:flex;gap:8px;margin-top:2px;">
        <button class="btn btn-primary" style="font-size:13px;min-height:40px;" data-abono="${d.id}">💰 Registrar Abono</button>
        <button class="btn btn-secondary" style="font-size:13px;min-height:40px;width:42px;padding:0;" data-edit-deuda="${d.id}">✏️</button>
      </div>`;
    listEl.appendChild(card);
  });

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
    extraWrap.innerHTML = '<div class="card"><p style="font-size:13px;font-weight:700;color:var(--danger);">⚠️ Sin margen extra. Revisa tus gastos en Perfil.</p></div>';
  }
}

// ===== RENDER REGISTRO =====
function renderCategoryChips() {
  const container = document.getElementById('reg-categorias');
  container.innerHTML = '';
  const cats = selectedTipo === 'i' ? CATS_INGRESO : CATS_GASTO;
  if (!selectedCat || !cats.includes(selectedCat)) selectedCat = cats[0];
  cats.forEach(cat => {
    const chip = document.createElement('div');
    chip.className = 'chip' + (cat === selectedCat ? ' active' : '');
    chip.textContent = cat;
    chip.addEventListener('click', () => { selectedCat = cat; renderCategoryChips(); });
    container.appendChild(chip);
  });
}
function renderRegistro() {
  document.getElementById('reg-titulo').textContent    = '⚡ Registro Rápido';
  document.getElementById('reg-monto-lbl').textContent  = 'Monto';
  document.getElementById('reg-desc-lbl').textContent   = 'Descripción (opcional)';
  document.getElementById('reg-cat-lbl').textContent    = 'Categoría';
  document.getElementById('btn-registrar').textContent  = 'Registrar';
  renderCategoryChips();
  renderHistorialMes();
}
function renderHistorialMes() {
  const container = document.getElementById('historial-mes');
  container.innerHTML = '';
  const txs = getTxsMes().sort((a,b) => new Date(b.fecha)-new Date(a.fecha));
  if (!txs.length) {
    container.innerHTML = '<p style="font-size:13px;color:var(--text-muted);font-weight:600;">Sin movimientos este mes.</p>';
    return;
  }
  txs.forEach(tx => container.appendChild(buildMovRow(tx, true)));
}

// ===== RENDER METAS =====
function renderMetas() {
  document.getElementById('metas-titulo').textContent = '🎯 Metas de Ahorro';
  document.getElementById('reto52-titulo').textContent = 'Reto 52 Semanas 💪';
  document.getElementById('reto52-sub').textContent    = 'Ahorra una cantidad cada semana y completa el año.';

  const listEl = document.getElementById('metas-list');
  listEl.innerHTML = '';
  if (!data.metas.length) {
    listEl.innerHTML = '<p style="font-size:13px;color:var(--text-muted);font-weight:600;margin-bottom:14px;">Agrega tu primera meta de ahorro.</p>';
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
        ${lograda ? '<div style="font-size:12px;font-weight:800;color:var(--primary);margin-bottom:4px;">¡Meta lograda! 🎉</div>' : ''}
        <div class="meta-valores">
          <span>Ahorrado: ${fmt(meta.ahorrado)}</span>
          <span>Falta: ${fmt(Math.max(0, meta.montoObjetivo - meta.ahorrado))}</span>
        </div>
        <div class="meta-progress-wrap">
          <div class="meta-progress-bar${lograda?' lograda':''}" style="width:${pct}%"></div>
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
}

function renderReto52() {
  const container = document.getElementById('reto52-container');
  container.innerHTML = '';
  const r = data.reto52;
  if (!r.activo) {
    container.innerHTML = `
      <div class="input-group">
        <label>¿Cuánto ahorrar por semana? ($)</label>
        <input type="number" id="reto-monto-inicial" inputmode="decimal" placeholder="50" value="${r.montoSemanal || 50}">
      </div>
      <button class="btn btn-primary" id="btn-iniciar-reto">🚀 Iniciar Reto</button>`;
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
        <span style="font-size:13px;font-weight:700;color:var(--text-muted);">${completadas}/52 semanas</span>
        <span style="font-size:13px;font-weight:800;color:var(--primary);">Total: ${fmt(total)}</span>
      </div>
      ${allDone ? '<div style="text-align:center;font-size:18px;font-weight:800;color:var(--primary);margin-bottom:12px;">🏆 ¡Reto completado!</div>' : ''}
      <div class="reto-grid" id="reto-grid"></div>
      <button class="btn btn-secondary" id="btn-reiniciar-reto" style="margin-top:12px;min-height:40px;font-size:13px;">🔄 Reiniciar reto</button>`;
    const grid = document.getElementById('reto-grid');
    r.semanas.forEach((done, i) => {
      const cell = document.createElement('div');
      cell.className = 'reto-semana' + (done ? ' done' : '');
      cell.textContent = i + 1;
      cell.addEventListener('click', () => {
        data.reto52.semanas[i] = !data.reto52.semanas[i];
        saveData();
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
  document.getElementById('perfil-titulo').textContent          = 'Perfil';
  document.getElementById('perfil-config-titulo').textContent   = '⚙️ Configuración';
  document.getElementById('perfil-ingreso-lbl').textContent     = 'Ingreso mensual ($)';
  document.getElementById('perfil-gastosfijos-lbl').textContent = 'Gastos fijos mensuales ($)';
  document.getElementById('perfil-moneda-lbl').textContent      = 'Moneda';
  document.getElementById('perfil-sobres-titulo').textContent   = '💰 Mis Sobres Mensuales';
  document.getElementById('perfil-backup-titulo').textContent   = '💾 Respaldo de Datos';

  document.getElementById('cfg-ingreso').value     = data.config.ingresoMensual || '';
  document.getElementById('cfg-gastos-fijos').value = data.config.gastosFijos || '';
  const sel = document.getElementById('cfg-moneda');
  sel.value = data.config.moneda || '$';

  // Sobres config
  const sobresContainer = document.getElementById('sobres-config-container');
  sobresContainer.innerHTML = '';
  Object.entries(data.config.sobres).forEach(([nombre, valor]) => {
    const item = document.createElement('div');
    item.className = 'sobre-config-item';
    item.innerHTML = `<label>${nombre}</label><input type="number" inputmode="decimal" data-sobre="${nombre}" value="${valor || ''}" placeholder="0">`;
    sobresContainer.appendChild(item);
  });
}

// ===== MODALS: DEUDA =====
function openDeudaModal(id) {
  modalDeudaEditId = id || null;
  const ed = id ? data.deudas.find(d => d.id === id) : null;
  document.getElementById('md-titulo').textContent     = ed ? '✏️ Editar Deuda' : '➕ Nueva Deuda';
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
  saveData(); closeModal('modal-deuda'); toast('Deuda guardada ✓'); renderDeudas();
}
function eliminarDeuda() {
  if (!modalDeudaEditId) return;
  if (confirm('¿Eliminar esta deuda?')) {
    data.deudas = data.deudas.filter(d => d.id !== modalDeudaEditId);
    saveData(); closeModal('modal-deuda'); toast('Deuda eliminada 🗑️'); renderDeudas();
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
  if (!monto || monto <= 0) { toast('Escribe el monto del abono 🙂'); return; }
  const d = data.deudas.find(d => d.id === abonoDeudaId);
  if (!d) return;
  d.saldoActual = Math.max(0, d.saldoActual - monto);
  data.pagosDeuda.push({ id: uid(), deudaId: abonoDeudaId, fecha: new Date().toISOString(), monto });
  saveData(); closeModal('modal-abono'); toast('¡Abono registrado! 💚'); renderDeudas();
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
  if (!nombre || isNaN(monto)) { toast('Completa nombre y monto 🙂'); return; }
  if (modalMetaEditId) {
    const m = data.metas.find(m => m.id === modalMetaEditId);
    if (m) { m.nombre = nombre; m.montoObjetivo = monto; m.emoji = emoji; }
  } else {
    data.metas.push({ id: uid(), nombre, montoObjetivo: monto, ahorrado: 0, emoji, fechaCreacion: new Date().toISOString() });
  }
  saveData(); closeModal('modal-meta'); toast('Meta guardada 🎯'); renderMetas();
}
function eliminarMeta() {
  if (!modalMetaEditId) return;
  if (confirm('¿Eliminar esta meta?')) {
    data.metas = data.metas.filter(m => m.id !== modalMetaEditId);
    saveData(); closeModal('modal-meta'); toast('Meta eliminada 🗑️'); renderMetas();
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
  if (!monto || monto <= 0) { toast('Escribe el monto 🙂'); return; }
  const m = data.metas.find(m => m.id === abonoMetaId);
  if (!m) return;
  m.ahorrado = (m.ahorrado || 0) + monto;
  saveData(); closeModal('modal-abono-meta'); toast('¡Abono registrado! 💚'); renderMetas();
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
      toast('✅ Datos restaurados. Recargando...');
      setTimeout(() => location.reload(), 1200);
    } catch { toast('❌ Archivo inválido'); }
  };
  reader.readAsText(file);
}

// ===== HEADER =====
function updateHeader() {
  const h = new Date().getHours();
  const greeting = h < 12 ? 'Buenos días ☀️' : h < 19 ? 'Buenas tardes 👋' : 'Buenas noches 🌙';
  document.getElementById('header-saludo').textContent = greeting;
  const now = new Date();
  const dateStr = DIAS_ES[now.getDay()] + ', ' + now.getDate() + ' de ' + MESES_ES[now.getMonth()];
  document.getElementById('header-fecha').textContent = dateStr;
}

// ===== ONBOARDING =====
function showOnboarding() {
  document.getElementById('screen-onboarding').classList.remove('hidden');
  document.getElementById('onb-step1-titulo').textContent    = '¿Cuánto ganas al mes?';
  document.getElementById('onb-step1-sub').textContent      = 'Incluye todos tus ingresos regulares: sueldo, freelance, rentas...';
  document.getElementById('onb-step2-label-inline').textContent = '¿Cuánto suman tus gastos fijos? ($)';
  document.getElementById('onb-step3-titulo').textContent   = '¿Tienes deudas?';
  document.getElementById('onb-step3-sub').textContent      = 'Agrégalas ahora para calcular tu Plan Snowball y tu Fecha de Libertad.';
  document.getElementById('btn-onb-finalizar').textContent  = '¡Empezar mi Plan!';
  document.getElementById('btn-onb-saltar').textContent     = 'Saltar por ahora';
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
  document.getElementById('screen-onboarding').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  updateHeader();
  navTo('v-dashboard');
}

// ===== PWA =====
function initPWA() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
}

// ===== DOM READY =====
document.addEventListener('DOMContentLoaded', () => {

  loadData();

  // Ir directo al app (sin auth)
  if (!data.config.onboardingDone) {
    showOnboarding();
  } else {
    document.getElementById('app').classList.remove('hidden');
    updateHeader();
    navTo('v-dashboard');
  }

  // Navegación
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

  // Registrar transacción
  document.getElementById('btn-registrar').addEventListener('click', () => {
    const monto = parseFloat(document.getElementById('reg-monto').value);
    if (!monto || monto <= 0) { toast('Escribe el monto 🙂'); return; }
    const desc = document.getElementById('reg-desc').value.trim();
    data.transacciones.push({
      id: uid(), tipo: selectedTipo, monto,
      descripcion: desc, categoria: selectedCat,
      fecha: new Date().toISOString()
    });
    saveData();
    toast(selectedTipo === 'i' ? '¡Ingreso registrado 💚' : 'Gasto registrado 📊');
    document.getElementById('reg-monto').value = '';
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
    data.config.moneda         = document.getElementById('cfg-moneda').value || '$';
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
