// ===== SinDeudas app.js =====

window.WORKER_URL = 'https://sindeudas-auth.douglaspp7.workers.dev';

const firebaseConfig = {
  apiKey: 'REPLACE_WITH_YOUR_FIREBASE_API_KEY',
  authDomain: 'REPLACE_WITH_YOUR_AUTH_DOMAIN',
  projectId: 'REPLACE_WITH_YOUR_PROJECT_ID',
  storageBucket: 'REPLACE_WITH_YOUR_STORAGE_BUCKET',
  messagingSenderId: 'REPLACE_WITH_SENDER_ID',
  appId: 'REPLACE_WITH_APP_ID'
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// ===== DATA MODEL =====
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

let data = DEFAULT_DATA;
let currentUser = null;
let selectedTipo = 'i';
let selectedCat = '';
let modalDeudaEditId = null;
let modalMetaEditId = null;
let abonoDeudaId = null;
let abonoMetaId = null;
let deferredInstallPrompt = null;

const CATS_GASTO = ['🍎 Alimentación','🏠 Vivienda','🚗 Transporte','💊 Salud','🎬 Ocio','💡 Servicios','📚 Educación','📦 Otros'];
const CATS_INGRESO = ['💼 Sueldo','💻 Freelance','🎁 Regalo','📈 Extra','📦 Otros'];
const MESES_ES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
const DIAS_ES = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];

// ===== STORAGE =====
function loadData() {
  try {
    const raw = localStorage.getItem('sd_data');
    if (raw) {
      const parsed = JSON.parse(raw);
      // Merge with defaults to handle new fields
      data = Object.assign({}, DEFAULT_DATA, parsed);
      data.config = Object.assign({}, DEFAULT_DATA.config, parsed.config || {});
      data.config.sobres = Object.assign({}, DEFAULT_DATA.config.sobres, (parsed.config || {}).sobres || {});
      data.reto52 = Object.assign({}, DEFAULT_DATA.reto52, parsed.reto52 || {});
    }
  } catch(e) { data = JSON.parse(JSON.stringify(DEFAULT_DATA)); }
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
  document.getElementById(viewId).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  if (el) {
    el.classList.add('active');
  } else {
    const btn = document.querySelector('.nav-item[data-view="' + viewId + '"]');
    if (btn) btn.classList.add('active');
  }
  if (viewId === 'v-dashboard') renderDashboard();
  if (viewId === 'v-deudas') renderDeudas();
  if (viewId === 'v-registro') renderRegistro();
  if (viewId === 'v-metas') renderMetas();
  if (viewId === 'v-perfil') renderPerfil();
}
function setTipo(tipo) {
  selectedTipo = tipo;
  const btnI = document.getElementById('tipo-ingreso');
  const btnG = document.getElementById('tipo-gasto');
  if (tipo === 'i') {
    btnI.classList.add('active-i'); btnI.classList.remove('active-g');
    btnG.classList.remove('active-i','active-g');
  } else {
    btnG.classList.add('active-g'); btnG.classList.remove('active-i');
    btnI.classList.remove('active-i','active-g');
  }
  renderCategoryChips();
}

// ===== MONTH HELPERS =====
function getMesActual() {
  const now = new Date();
  const inicio = new Date(now.getFullYear(), now.getMonth(), 1);
  const fin = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
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
  const txs = getTxsMes();
  const ingresos = txs.filter(t => t.tipo === 'i').reduce((s, t) => s + t.monto, 0);
  const gastos = txs.filter(t => t.tipo === 'g').reduce((s, t) => s + t.monto, 0);
  const saldo = ingresos - gastos;

  document.getElementById('dash-saldo-label').textContent = T('dash_saldo');
  const saldoEl = document.getElementById('dash-saldo-valor');
  saldoEl.textContent = fmt(saldo);
  saldoEl.style.color = saldo >= 0 ? '#fff' : '#fca5a5';
  document.getElementById('dash-ingresos').textContent = fmt(ingresos);
  document.getElementById('dash-gastos').textContent = fmt(gastos);
  document.getElementById('dash-sobres-titulo').textContent = T('dash_sobres_titulo');
  document.getElementById('dash-mov-titulo').textContent = T('dash_movimientos');

  // Sobres
  const sobresContainer = document.getElementById('dash-sobres-container');
  sobresContainer.innerHTML = '';
  const sobres = data.config.sobres;
  Object.entries(sobres).forEach(([nombre, presupuesto]) => {
    if (!presupuesto) return;
    const gastadoSobre = txs
      .filter(t => t.tipo === 'g' && t.categoria && t.categoria.includes(nombre.replace(/^[^\w]*/, '').trim().split(' ')[0]))
      .reduce((s, t) => s + t.monto, 0);
    const pct = presupuesto > 0 ? Math.min((gastadoSobre / presupuesto) * 100, 100) : 0;
    const over = gastadoSobre > presupuesto;
    const item = document.createElement('div');
    item.className = 'sobre-item';
    item.innerHTML = `
      <div class="sobre-header">
        <span class="sobre-nombre">${nombre}</span>
        <span class="sobre-valores">${fmt(gastadoSobre)} / ${fmt(presupuesto)}</span>
      </div>
      <div class="sobre-bar-wrap">
        <div class="sobre-bar${over ? ' over' : ''}" style="width:${pct}%"></div>
      </div>`;
    sobresContainer.appendChild(item);
  });
  if (!Object.values(sobres).some(v => v > 0)) {
    sobresContainer.innerHTML = '<p style="font-size:13px;color:var(--text-muted);font-weight:600;">Configura tus sobres en Perfil.</p>';
  }

  // Last 8 transactions
  const movContainer = document.getElementById('dash-movimientos');
  movContainer.innerHTML = '';
  const last8 = [...data.transacciones].sort((a,b) => new Date(b.fecha)-new Date(a.fecha)).slice(0,8);
  if (!last8.length) {
    movContainer.innerHTML = '<p style="font-size:13px;color:var(--text-muted);font-weight:600;">' + T('dash_sin_mov') + '</p>';
  } else {
    last8.forEach(tx => {
      const row = buildMovRow(tx);
      movContainer.appendChild(row);
    });
  }
}

function buildMovRow(tx) {
  const row = document.createElement('div');
  row.className = 'mov-row';
  const icon = tx.tipo === 'i' ? '💚' : (tx.categoria ? tx.categoria.split(' ')[0] : '📊');
  const d = new Date(tx.fecha);
  const dateStr = d.getDate() + ' ' + MESES_ES[d.getMonth()];
  row.innerHTML = `
    <div class="mov-icon">${icon}</div>
    <div class="mov-info">
      <div class="mov-desc">${tx.descripcion || tx.categoria || (tx.tipo==='i'?'Ingreso':'Gasto')}</div>
      <div class="mov-cat">${tx.categoria || ''} · ${dateStr}</div>
    </div>
    <div class="mov-amount ${tx.tipo === 'i' ? 'ingreso' : 'gasto'}">${tx.tipo==='i'?'+':'-'}${fmt(tx.monto)}</div>`;
  return row;
}

// ===== SNOWBALL =====
function calcularSnowball() {
  const pendientes = data.deudas.filter(d => d.saldoActual > 0);
  if (!pendientes.length) return { deudas: [], fechaLibertad: null, extraMensual: 0 };

  const totalMinimos = data.deudas.reduce((s, d) => s + (d.pagoMinimo || 0), 0);
  const extraMensual = Math.max(0, (data.config.ingresoMensual || 0) - (data.config.gastosFijos || 0) - totalMinimos);

  const hoy = new Date();
  let saldos = data.deudas.map(d => ({
    ...d,
    saldo: d.saldoActual,
    mesLibre: null,
    fechaLibre: null
  })).sort((a, b) => a.saldoActual - b.saldoActual);

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

  const pagadas = saldos.filter(d => d.fechaLibre);
  const ultimaDeuda = pagadas.sort((a, b) => b.mesLibre - a.mesLibre)[0];

  return {
    deudas: saldos,
    fechaLibertad: ultimaDeuda ? ultimaDeuda.fechaLibre : null,
    mesesTotales: ultimaDeuda ? ultimaDeuda.mesLibre : null,
    extraMensual
  };
}

// ===== RENDER DEUDAS =====
function renderDeudas() {
  document.getElementById('deudas-titulo').textContent = T('deudas_titulo');
  document.getElementById('btn-nueva-deuda').textContent = T('deudas_btn_nueva');

  const heroWrap = document.getElementById('libertad-hero-wrap');
  const listEl = document.getElementById('deudas-list');
  const extraWrap = document.getElementById('deudas-extra-wrap');
  heroWrap.innerHTML = '';
  listEl.innerHTML = '';
  extraWrap.innerHTML = '';

  if (!data.deudas.length) {
    listEl.innerHTML = '<div class="card" style="text-align:center;padding:32px 20px;"><div style="font-size:40px;margin-bottom:10px;">🎉</div><p style="font-weight:800;font-size:17px;">' + T('deudas_sin') + '</p></div>';
    return;
  }

  const sb = calcularSnowball();

  // Libertad hero
  if (sb.fechaLibertad) {
    const f = sb.fechaLibertad;
    const fechaStr = DIAS_ES[f.getDay()] + ', ' + f.getDate() + ' de ' + MESES_ES[f.getMonth()] + ' ' + f.getFullYear();
    heroWrap.innerHTML = `
      <div class="libertad-hero">
        <div class="libertad-sub">${T('deudas_libertad')}</div>
        <div class="libertad-fecha">${fechaStr}</div>
        <div class="libertad-sub">${sb.mesesTotales} ${T('deudas_meses')} · ${fmt(data.deudas.reduce((s,d)=>s+d.saldoActual,0))} ${T('deudas_total')}</div>
      </div>`;
  }

  // Deuda cards
  sb.deudas.forEach((d, idx) => {
    const isFoco = idx === 0 && d.saldo > 0.01;
    const saldoInicial = d.saldoInicial || d.saldoActual;
    const pagado = Math.max(0, saldoInicial - d.saldoActual);
    const pct = saldoInicial > 0 ? Math.min((pagado / saldoInicial) * 100, 100) : 0;
    const card = document.createElement('div');
    card.className = 'deuda-card' + (isFoco ? ' foco' : '');
    let libreStr = '';
    if (d.fechaLibre) {
      const f = d.fechaLibre;
      libreStr = T('deudas_libre_en') + ' ' + d.mesLibre + ' ' + T('deudas_meses') + ' (' + MESES_ES[f.getMonth()] + ' ' + f.getFullYear() + ')';
    }
    card.innerHTML = `
      ${isFoco ? '<div class="deuda-foco-badge">' + T('deudas_foco') + '</div>' : ''}
      <div class="deuda-nombre">${d.nombre}</div>
      <div class="deuda-saldo">${fmt(d.saldoActual)}</div>
      <div class="deuda-meta-row">
        <span>${T('deudas_min')}: ${fmt(d.pagoMinimo)}</span>
        ${d.tasaInteres ? '<span>' + d.tasaInteres + '% mensual</span>' : ''}
      </div>
      <div class="deuda-progress-wrap">
        <div class="deuda-progress-bar${pct>=100?' pagada':''}" style="width:${pct}%"></div>
      </div>
      ${libreStr ? '<div class="deuda-libre-en">' + libreStr + '</div>' : ''}
      <div style="display:flex;gap:8px;">
        <button class="btn btn-primary" style="font-size:13px;min-height:40px;" data-abono="${d.id}">${T('deudas_btn_abono')}</button>
        <button class="btn btn-secondary" style="font-size:13px;min-height:40px;width:40px;padding:0;" data-edit-deuda="${d.id}">✏️</button>
      </div>`;
    listEl.appendChild(card);
  });

  // Wire abono buttons
  listEl.querySelectorAll('[data-abono]').forEach(btn => {
    btn.addEventListener('click', () => openAbonoModal(btn.getAttribute('data-abono')));
  });
  listEl.querySelectorAll('[data-edit-deuda]').forEach(btn => {
    btn.addEventListener('click', () => openDeudaModal(btn.getAttribute('data-edit-deuda')));
  });

  // Extra disponible
  if (sb.extraMensual > 0) {
    extraWrap.innerHTML = `<div class="card" style="display:flex;align-items:center;gap:12px;">
      <span style="font-size:22px;">💡</span>
      <div><div style="font-weight:800;font-size:14px;">${T('deudas_extra_disponible')}</div>
      <div style="font-size:18px;font-weight:800;color:var(--primary);">${fmt(sb.extraMensual)}/mes</div></div>
    </div>`;
  } else if (data.config.ingresoMensual > 0) {
    extraWrap.innerHTML = `<div class="card"><p style="font-size:13px;font-weight:700;color:var(--danger);">${T('deudas_sin_extra')}</p></div>`;
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
    chip.className = 'chip' + (cat === selectedCat ? ' selected' : '');
    chip.textContent = cat;
    chip.addEventListener('click', () => { selectedCat = cat; renderCategoryChips(); });
    container.appendChild(chip);
  });
}
function renderRegistro() {
  document.getElementById('reg-titulo').textContent = T('reg_titulo');
  document.getElementById('reg-monto-lbl').textContent = T('reg_monto');
  document.getElementById('reg-desc-lbl').textContent = T('reg_desc');
  document.getElementById('reg-cat-lbl').textContent = T('reg_cat');
  document.getElementById('btn-registrar').textContent = T('reg_btn');
  renderCategoryChips();
  renderHistorialMes();
}
function renderHistorialMes() {
  const container = document.getElementById('historial-mes');
  container.innerHTML = '';
  const txs = getTxsMes().sort((a,b) => new Date(b.fecha)-new Date(a.fecha));
  if (!txs.length) {
    container.innerHTML = '<p style="font-size:13px;color:var(--text-muted);font-weight:600;">' + T('dash_sin_mov') + '</p>';
    return;
  }
  txs.forEach(tx => {
    const row = buildMovRow(tx);
    // Add delete button
    const delBtn = document.createElement('button');
    delBtn.style.cssText = 'background:none;border:none;cursor:pointer;font-size:16px;padding:4px;color:var(--text-muted);';
    delBtn.textContent = '🗑️';
    delBtn.addEventListener('click', () => {
      data.transacciones = data.transacciones.filter(t => t.id !== tx.id);
      saveData();
      toast(T('reg_eliminar_toast'));
      renderHistorialMes();
      renderDashboard();
    });
    row.appendChild(delBtn);
    container.appendChild(row);
  });
}

// ===== RENDER METAS =====
function renderMetas() {
  document.getElementById('metas-titulo').textContent = T('metas_titulo');
  document.getElementById('reto52-titulo').textContent = T('reto52_titulo');
  document.getElementById('reto52-sub').textContent = T('reto52_sub');

  const listEl = document.getElementById('metas-list');
  listEl.innerHTML = '';
  if (!data.metas.length) {
    listEl.innerHTML = '<p style="font-size:13px;color:var(--text-muted);font-weight:600;margin-bottom:14px;">' + T('metas_sin') + '</p>';
  } else {
    data.metas.forEach(meta => {
      const pct = meta.montoObjetivo > 0 ? Math.min((meta.ahorrado / meta.montoObjetivo) * 100, 100) : 0;
      const lograda = pct >= 100;
      const card = document.createElement('div');
      card.className = 'card meta-card';
      card.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div class="meta-nombre">${meta.emoji || '🎯'} ${meta.nombre}</div>
          <button style="background:none;border:none;cursor:pointer;font-size:16px;" data-edit-meta="${meta.id}">✏️</button>
        </div>
        ${lograda ? '<div style="font-size:12px;font-weight:800;color:var(--primary);margin-bottom:4px;">' + T('metas_lograda') + '</div>' : ''}
        <div class="meta-valores">
          <span>${T('metas_ahorrado')}: ${fmt(meta.ahorrado)}</span>
          <span>${T('metas_falta')}: ${fmt(Math.max(0, meta.montoObjetivo - meta.ahorrado))}</span>
        </div>
        <div class="meta-progress-wrap">
          <div class="meta-progress-bar${lograda?' lograda':''}" style="width:${pct}%"></div>
        </div>
        <button class="btn btn-secondary" style="margin-top:12px;min-height:38px;font-size:13px;" data-abono-meta="${meta.id}">💰 Abonar</button>`;
      listEl.appendChild(card);
    });
    listEl.querySelectorAll('[data-edit-meta]').forEach(btn => {
      btn.addEventListener('click', () => openMetaModal(btn.getAttribute('data-edit-meta')));
    });
    listEl.querySelectorAll('[data-abono-meta]').forEach(btn => {
      btn.addEventListener('click', () => openAbonoMetaModal(btn.getAttribute('data-abono-meta')));
    });
  }

  // Reto 52
  renderReto52();
}

function renderReto52() {
  const container = document.getElementById('reto52-container');
  container.innerHTML = '';
  const r = data.reto52;
  if (!r.activo) {
    container.innerHTML = `
      <div class="input-group">
        <label>${T('reto52_monto_lbl')}</label>
        <input type="number" id="reto-monto-inicial" inputmode="decimal" placeholder="50" value="${r.montoSemanal || 50}">
      </div>
      <button class="btn btn-primary" id="btn-iniciar-reto">${T('reto52_iniciar')}</button>`;
    document.getElementById('btn-iniciar-reto').addEventListener('click', () => {
      const m = parseFloat(document.getElementById('reto-monto-inicial').value) || 50;
      data.reto52 = { activo: true, montoSemanal: m, semanas: Array(52).fill(false) };
      saveData();
      renderReto52();
    });
  } else {
    const completadas = r.semanas.filter(Boolean).length;
    const total = completadas * r.montoSemanal;
    const allDone = completadas === 52;
    container.innerHTML = `
      <div style="display:flex;justify-content:space-between;margin-bottom:10px;">
        <span style="font-size:13px;font-weight:700;color:var(--text-muted);">${completadas}/52 ${T('reto52_completadas')}</span>
        <span style="font-size:13px;font-weight:800;color:var(--primary);">${T('reto52_total')}: ${fmt(total)}</span>
      </div>
      ${allDone ? '<div style="text-align:center;font-size:18px;font-weight:800;color:var(--primary);margin-bottom:12px;">' + T('reto52_feliz') + '</div>' : ''}
      <div class="reto-grid" id="reto-grid"></div>
      <button class="btn btn-secondary" id="btn-reiniciar-reto" style="margin-top:12px;min-height:40px;font-size:13px;">${T('reto52_reiniciar')}</button>`;
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
      if (confirm(T('reto52_reiniciar') + '?')) {
        data.reto52 = { activo: false, montoSemanal: r.montoSemanal, semanas: [] };
        saveData();
        renderReto52();
      }
    });
  }
}

// ===== RENDER PERFIL =====
function renderPerfil() {
  document.getElementById('perfil-titulo').textContent = T('perfil_titulo');
  document.getElementById('perfil-config-titulo').textContent = T('perfil_config_titulo');
  document.getElementById('perfil-ingreso-lbl').textContent = T('perfil_ingreso_lbl');
  document.getElementById('perfil-gastosfijos-lbl').textContent = T('perfil_gastos_fijos_lbl');
  document.getElementById('perfil-moneda-lbl').textContent = T('perfil_moneda_lbl');
  document.getElementById('perfil-sobres-titulo').textContent = T('perfil_sobres_titulo');
  document.getElementById('perfil-backup-titulo').textContent = T('perfil_backup_titulo');
  document.getElementById('btn-logout').textContent = T('perfil_logout');
  document.getElementById('perfil-licencia').textContent = T('perfil_licencia');
  if (currentUser) document.getElementById('perfil-email-display').textContent = currentUser.email || '—';

  document.getElementById('cfg-ingreso').value = data.config.ingresoMensual || '';
  document.getElementById('cfg-gastos-fijos').value = data.config.gastosFijos || '';
  const monedaSel = document.getElementById('cfg-moneda');
  monedaSel.value = data.config.moneda || '$';

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
  const editDeuda = id ? data.deudas.find(d => d.id === id) : null;
  document.getElementById('md-titulo').textContent = editDeuda ? T('modal_deuda_editar') : T('modal_nueva_deuda');
  document.getElementById('md-nombre').value = editDeuda ? editDeuda.nombre : '';
  document.getElementById('md-saldo').value = editDeuda ? editDeuda.saldoActual : '';
  document.getElementById('md-saldo-inicial').value = editDeuda ? (editDeuda.saldoInicial || editDeuda.saldoActual) : '';
  document.getElementById('md-tasa').value = editDeuda ? editDeuda.tasaInteres : '';
  document.getElementById('md-minimo').value = editDeuda ? editDeuda.pagoMinimo : '';
  const delBtn = document.getElementById('md-btn-eliminar');
  delBtn.style.display = editDeuda ? 'flex' : 'none';
  openModal('modal-deuda');
}
function saveDeuda() {
  const nombre = document.getElementById('md-nombre').value.trim();
  const saldo = parseFloat(document.getElementById('md-saldo').value);
  const saldoIni = parseFloat(document.getElementById('md-saldo-inicial').value) || saldo;
  const tasa = parseFloat(document.getElementById('md-tasa').value) || 0;
  const minimo = parseFloat(document.getElementById('md-minimo').value) || 0;
  if (!nombre || isNaN(saldo)) { toast(T('modal_deuda_err')); return; }
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
  d.saldoActual = Math.max(0, d.saldoActual - monto);
  data.pagosDeuda.push({ id: uid(), deudaId: abonoDeudaId, fecha: new Date().toISOString(), monto });
  saveData(); closeModal('modal-abono'); toast(T('modal_abono_toast')); renderDeudas();
}

// ===== MODALS: META =====
function openMetaModal(id) {
  modalMetaEditId = id || null;
  const editMeta = id ? data.metas.find(m => m.id === id) : null;
  document.getElementById('mm-titulo').textContent = editMeta ? '✏️ Editar Meta' : T('metas_nuevo_titulo');
  document.getElementById('mm-nombre').value = editMeta ? editMeta.nombre : '';
  document.getElementById('mm-monto').value = editMeta ? editMeta.montoObjetivo : '';
  document.getElementById('mm-emoji').value = editMeta ? (editMeta.emoji || '') : '';
  const delBtn = document.getElementById('mm-btn-eliminar');
  delBtn.style.display = editMeta ? 'flex' : 'none';
  openModal('modal-meta');
}
function saveMeta() {
  const nombre = document.getElementById('mm-nombre').value.trim();
  const monto = parseFloat(document.getElementById('mm-monto').value);
  const emoji = document.getElementById('mm-emoji').value.trim() || '🎯';
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
  if (!monto || monto <= 0) { toast(T('metas_err')); return; }
  const m = data.metas.find(m => m.id === abonoMetaId);
  if (!m) return;
  m.ahorrado = (m.ahorrado || 0) + monto;
  saveData(); closeModal('modal-abono-meta'); toast(T('metas_abonar_toast')); renderMetas();
}

// ===== BACKUP / RESTORE =====
function exportarDatos() {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
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

// ===== HEADER =====
function updateHeader() {
  const h = new Date().getHours();
  let greeting = h < 12 ? T('greeting_morning') : h < 19 ? T('greeting_afternoon') : T('greeting_evening');
  document.getElementById('header-saludo').textContent = greeting + ' 👋';
  const now = new Date();
  const dateStr = DIAS_ES[now.getDay()] + ', ' + now.getDate() + ' de ' + MESES_ES[now.getMonth()];
  document.getElementById('header-fecha').textContent = dateStr;
}

// ===== ONBOARDING =====
function showOnboarding() {
  document.getElementById('screen-onboarding').classList.remove('hidden');
  document.getElementById('onb-step1-titulo').textContent = T('onb_step1_titulo');
  document.getElementById('onb-step1-sub').textContent = T('onb_step1_sub');
  document.getElementById('onb-step2-label-inline').textContent = T('onb_step2_titulo');
  document.getElementById('onb-step3-titulo').textContent = T('onb_step3_titulo');
  document.getElementById('onb-step3-sub').textContent = T('onb_step3_sub');
  document.getElementById('btn-onb-finalizar').textContent = T('onb_btn_finalizar');
  document.getElementById('btn-onb-saltar').textContent = T('onb_btn_saltar');
}

let onbTempDeudas = [];
function refreshOnbDeudas() {
  const el = document.getElementById('onb-deudas-list');
  el.innerHTML = '';
  onbTempDeudas.forEach((d, i) => {
    const item = document.createElement('div');
    item.className = 'card';
    item.style.cssText = 'padding:10px 14px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;';
    item.innerHTML = `<span style="font-weight:700;">${d.nombre}</span><span style="font-size:13px;color:var(--primary);font-weight:800;">${fmt(d.saldoActual)}</span>`;
    el.appendChild(item);
  });
}

// ===== AUTH =====
async function verifyWithWorker(email) {
  try {
    const res = await fetch(window.WORKER_URL + '/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const json = await res.json();
    return json.active === true;
  } catch { return false; }
}

function showApp(user) {
  currentUser = user;
  document.getElementById('screen-login').classList.add('hidden');
  loadData();
  if (!data.config.onboardingDone) {
    showOnboarding();
  } else {
    document.getElementById('app').classList.remove('hidden');
    updateHeader();
    navTo('v-dashboard');
  }
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
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferredInstallPrompt = e;
    const banner = document.getElementById('pwa-banner');
    document.getElementById('pwa-titulo').textContent = T('pwa_android_titulo');
    document.getElementById('pwa-sub').textContent = T('pwa_android_sub');
    document.getElementById('pwa-btn-instalar').textContent = T('pwa_android_btn');
    document.getElementById('pwa-btn-despues').textContent = T('pwa_android_despues');
    banner.style.display = 'flex';
  });
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.navigator.standalone;
  if (isIOS) {
    document.getElementById('pwa-ios-titulo').textContent = T('pwa_ios_titulo');
    document.getElementById('pwa-ios-sub').textContent = T('pwa_ios_sub');
    document.getElementById('pwa-ios-paso1').textContent = T('pwa_ios_paso1');
    document.getElementById('pwa-ios-paso2').textContent = T('pwa_ios_paso2');
    document.getElementById('pwa-ios-paso3').textContent = T('pwa_ios_paso3');
    document.getElementById('pwa-ios-btn').textContent = T('pwa_ios_btn');
    setTimeout(() => openModal('modal-ios'), 3000);
  }
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
}

// ===== DOM READY =====
document.addEventListener('DOMContentLoaded', () => {
  // i18n
  document.getElementById('login-subtitle').textContent = T('login_subtitle');
  document.getElementById('login-label').textContent = T('login_label');
  document.getElementById('input-email').placeholder = T('login_placeholder');
  document.getElementById('btn-login').textContent = T('login_btn');

  // Check magic link
  if (auth.isSignInWithEmailLink(window.location.href)) {
    let email = localStorage.getItem('sd_email_login');
    if (!email) email = window.prompt('Confirma tu correo:');
    document.getElementById('login-msg').textContent = T('login_verifying');
    auth.signInWithEmailLink(email, window.location.href)
      .then(async result => {
        const user = result.user;
        const active = await verifyWithWorker(user.email);
        if (active) {
          localStorage.setItem('sd_activated', '1');
          window.history.replaceState({}, document.title, window.location.pathname);
          showApp(user);
        } else {
          document.getElementById('login-msg').textContent = T('login_err_not_found');
          auth.signOut();
        }
      })
      .catch(() => { document.getElementById('login-msg').textContent = T('login_err_conn'); });
    return;
  }

  auth.onAuthStateChanged(async user => {
    if (user) {
      if (localStorage.getItem('sd_activated') === '1') {
        showApp(user);
      } else {
        const active = await verifyWithWorker(user.email);
        if (active) {
          localStorage.setItem('sd_activated', '1');
          showApp(user);
        } else {
          document.getElementById('login-msg').textContent = T('login_err_not_found');
          auth.signOut();
        }
      }
    }
  });

  // Login button
  document.getElementById('btn-login').addEventListener('click', async () => {
    const email = document.getElementById('input-email').value.trim();
    if (!email || !email.includes('@')) { document.getElementById('login-msg').textContent = T('login_err_email'); return; }
    const msgEl = document.getElementById('login-msg');
    msgEl.textContent = T('login_verifying');
    try {
      await auth.sendSignInLinkToEmail(email, {
        url: window.location.href,
        handleCodeInApp: true
      });
      localStorage.setItem('sd_email_login', email);
      msgEl.textContent = T('login_success_msg');
    } catch { msgEl.textContent = T('login_err_conn'); }
  });

  // Nav buttons
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => navTo(btn.getAttribute('data-view'), btn));
  });

  // Theme toggle
  document.getElementById('btn-tema').addEventListener('click', () => {
    const html = document.documentElement;
    html.setAttribute('data-theme', html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  });

  // Registro tipo buttons
  document.getElementById('tipo-ingreso').addEventListener('click', () => setTipo('i'));
  document.getElementById('tipo-gasto').addEventListener('click', () => setTipo('g'));

  // Registrar transaction
  document.getElementById('btn-registrar').addEventListener('click', () => {
    const monto = parseFloat(document.getElementById('reg-monto').value);
    if (!monto || monto <= 0) { toast(T('reg_err')); return; }
    const desc = document.getElementById('reg-desc').value.trim();
    data.transacciones.push({
      id: uid(),
      tipo: selectedTipo,
      monto,
      descripcion: desc,
      categoria: selectedCat,
      fecha: new Date().toISOString()
    });
    saveData();
    toast(selectedTipo === 'i' ? T('reg_toast_ingreso') : T('reg_toast_gasto'));
    document.getElementById('reg-monto').value = '';
    document.getElementById('reg-desc').value = '';
    renderHistorialMes();
    renderDashboard();
  });

  // Nueva deuda
  document.getElementById('btn-nueva-deuda').addEventListener('click', () => openDeudaModal(null));
  document.getElementById('md-btn-guardar').addEventListener('click', saveDeuda);
  document.getElementById('md-btn-eliminar').addEventListener('click', eliminarDeuda);
  document.getElementById('md-btn-cancelar').addEventListener('click', () => closeModal('modal-deuda'));

  // Abono deuda
  document.getElementById('ma-btn-guardar').addEventListener('click', saveAbono);
  document.getElementById('ma-btn-cancelar').addEventListener('click', () => closeModal('modal-abono'));

  // Nueva meta
  document.getElementById('btn-nueva-meta').addEventListener('click', () => openMetaModal(null));
  document.getElementById('mm-btn-guardar').addEventListener('click', saveMeta);
  document.getElementById('mm-btn-eliminar').addEventListener('click', eliminarMeta);
  document.getElementById('mm-btn-cancelar').addEventListener('click', () => closeModal('modal-meta'));

  // Abono meta
  document.getElementById('mam-btn-guardar').addEventListener('click', saveAbonoMeta);
  document.getElementById('mam-btn-cancelar').addEventListener('click', () => closeModal('modal-abono-meta'));

  // Save config
  document.getElementById('btn-save-config').addEventListener('click', () => {
    data.config.ingresoMensual = parseFloat(document.getElementById('cfg-ingreso').value) || 0;
    data.config.gastosFijos = parseFloat(document.getElementById('cfg-gastos-fijos').value) || 0;
    data.config.moneda = document.getElementById('cfg-moneda').value || '$';
    // Sobres
    document.querySelectorAll('#sobres-config-container [data-sobre]').forEach(inp => {
      const nombre = inp.getAttribute('data-sobre');
      data.config.sobres[nombre] = parseFloat(inp.value) || 0;
    });
    saveData();
    toast('✅ Configuración guardada');
    renderDashboard();
  });

  // Logout
  document.getElementById('btn-logout').addEventListener('click', () => {
    auth.signOut().then(() => {
      localStorage.removeItem('sd_activated');
      location.reload();
    });
  });

  // Backup
  document.getElementById('btn-backup').addEventListener('click', exportarDatos);
  document.getElementById('btn-restore').addEventListener('click', () => document.getElementById('input-restore').click());
  document.getElementById('input-restore').addEventListener('change', e => {
    if (e.target.files[0]) importarDatos(e.target.files[0]);
  });

  // Onboarding step 1
  document.getElementById('btn-onb-1').addEventListener('click', () => {
    const ingreso = parseFloat(document.getElementById('onb-ingreso').value) || 0;
    const gastos = parseFloat(document.getElementById('onb-gastos-fijos').value) || 0;
    data.config.ingresoMensual = ingreso;
    data.config.gastosFijos = gastos;
    saveData();
    document.getElementById('onb-step-1').classList.add('hidden');
    document.getElementById('onb-step-2').classList.remove('hidden');
  });

  // Onboarding add deuda
  document.getElementById('btn-onb-add-deuda').addEventListener('click', () => {
    const nombre = document.getElementById('onb-d-nombre').value.trim();
    const saldo = parseFloat(document.getElementById('onb-d-saldo').value);
    const tasa = parseFloat(document.getElementById('onb-d-tasa').value) || 0;
    const minimo = parseFloat(document.getElementById('onb-d-minimo').value) || 0;
    if (!nombre || isNaN(saldo)) { toast('Completa nombre y saldo.'); return; }
    onbTempDeudas.push({ id: uid(), nombre, saldoActual: saldo, saldoInicial: saldo, tasaInteres: tasa, pagoMinimo: minimo, fechaCreacion: new Date().toISOString() });
    document.getElementById('onb-d-nombre').value = '';
    document.getElementById('onb-d-saldo').value = '';
    document.getElementById('onb-d-tasa').value = '';
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

  // PWA install
  document.getElementById('pwa-btn-instalar').addEventListener('click', () => {
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      deferredInstallPrompt.userChoice.then(() => {
        deferredInstallPrompt = null;
        document.getElementById('pwa-banner').style.display = 'none';
      });
    }
  });
  document.getElementById('pwa-btn-despues').addEventListener('click', () => {
    document.getElementById('pwa-banner').style.display = 'none';
  });
  document.getElementById('pwa-ios-btn').addEventListener('click', () => closeModal('modal-ios'));

  // Modal backdrop close
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) overlay.classList.remove('open');
    });
  });

  initPWA();
});
