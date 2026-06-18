// ===== SinDeudas/SemDívidas app.js — Modo prueba (sin auth) =====

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
  reto52: { activo: false, montoSemanal: 50, semanas: [] },
  streaks: { count: 0, lastActiveDate: null }
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

const MESES_PT = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
const DIAS_PT  = ['domingo','segunda-feira','terça-feira','quarta-feira','quinta-feira','sexta-feira','sábado'];

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
  return sym + num.toLocaleString(window.appLang === 'pt' ? 'pt-BR' : 'es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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

  // Sobres
  const sobresContainer = document.getElementById('dash-sobres-container');
  sobresContainer.innerHTML = '';
  const sobres = data.config.sobres;
  const tienePresupuesto = Object.values(sobres).some(v => v > 0);
  if (!tienePresupuesto) {
    sobresContainer.innerHTML = `<p style="font-size:13px;color:var(--text-muted);font-weight:600;">${window.appLang === 'pt' ? 'Configure seus envelopes no <b>Perfil</b>.' : 'Configura tus sobres en <b>Perfil</b>.'}</p>`;
  } else {
    Object.entries(sobres).forEach(([nombre, presupuesto]) => {
      if (!presupuesto) return;
      const emoji = nombre.split(' ')[0];
      const cleanNombre = nombre.replace(/^[^\wÀ-ž]*/, '').trim();
      const nombreTrad = emoji + ' ' + T('cat_' + cleanNombre);
      const keyword = cleanNombre.toLowerCase();
      const gastadoSobre = txs
        .filter(t => t.tipo === 'g' && t.categoria && t.categoria.toLowerCase().includes(keyword))
        .reduce((s,t) => s + t.monto, 0);
      const pct  = Math.min((gastadoSobre / presupuesto) * 100, 100);
      const over = gastadoSobre > presupuesto;
      const item = document.createElement('div');
      item.className = 'sobre-item';
      item.innerHTML = `
        <div class="sobre-header">
          <span class="sobre-nombre">${nombreTrad}</span>
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
  const dateStr = window.appLang === 'pt'
    ? d.getDate() + ' de ' + MESES_PT[d.getMonth()]
    : d.getDate() + ' de ' + MESES_ES[d.getMonth()];
  const sign    = tx.tipo === 'i' ? '+' : '-';
  const color   = tx.tipo === 'i' ? 'var(--ok)' : 'var(--danger)';
  const cleanCat = (tx.categoria || '').replace(/^[^\wÀ-ž]*/, '').trim();
  const catTrad  = T('cat_' + cleanCat);
  const nomeTrad = tx.descripcion || catTrad || (tx.tipo==='i' ? T('reg_ingreso') : T('reg_gasto'));
  row.innerHTML = `
    <div class="mov-emoji">${icon}</div>
    <div class="mov-info">
      <div class="mov-nome">${nomeTrad}</div>
      <div class="mov-data">${catTrad} · ${dateStr}</div>
    </div>
    <div class="mov-monto" style="color:${color}">${sign}${fmt(tx.monto)}</div>
    ${showDelete ? `<button class="mov-del" onclick="eliminarMovimiento('${tx.id}')">✕</button>` : ''}`;
  return row;
}

window.eliminarMovimiento = function(id) {
  if (confirm(window.appLang === 'pt' ? 'Excluir esta movimentação?' : '¿Eliminar este movimiento?')) {
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
  document.getElementById('deudas-titulo').textContent  = '💳 ' + T('deudas_titulo');
  document.getElementById('btn-nueva-deuda').textContent = T('deudas_btn_nueva');

  const heroWrap  = document.getElementById('libertad-hero-wrap');
  const listEl    = document.getElementById('deudas-list');
  const extraWrap = document.getElementById('deudas-extra-wrap');
  heroWrap.innerHTML  = '';
  listEl.innerHTML    = '';
  extraWrap.innerHTML = '';

  if (!data.deudas.length) {
    listEl.innerHTML = `<div class="card" style="text-align:center;padding:32px 20px;"><div style="font-size:40px;margin-bottom:10px;">🎉</div><p style="font-weight:800;font-size:17px;">${T('deudas_sin')}</p><p style="font-size:13px;color:var(--text-muted);margin-top:8px;">${window.appLang === 'pt' ? 'Adicione suas dívidas para calcular seu Plano Sem Dívidas.' : 'Agrega tus deudas para calcular tu Plan Snowball.'}</p></div>`;
    return;
  }

  const sb = calcularSnowball();

  // Hero Fecha de Libertad
  if (sb.fechaLibertad) {
    const f = sb.fechaLibertad;
    const mesLibre = window.appLang === 'pt' ? MESES_PT[f.getMonth()] : MESES_ES[f.getMonth()];
    const mesesLabel = window.appLang === 'pt' ? 'meses' : 'meses';
    const deudaTotalLabel = window.appLang === 'pt' ? 'dívida total' : 'deuda total';
    heroWrap.innerHTML = `
      <div class="libertad-hero">
        <div class="libertad-sub">🗓️ ${T('deudas_libertad')}</div>
        <div class="libertad-fecha">${mesLibre.charAt(0).toUpperCase()+mesLibre.slice(1)} ${f.getFullYear()}</div>
        <div class="libertad-sub">${window.appLang === 'pt' ? 'em' : 'en'} ${sb.mesesTotales} ${mesesLabel} · ${fmt(data.deudas.reduce((s,d)=>s+d.saldoActual,0))} ${deudaTotalLabel}</div>
      </div>`;
  }

  // Tarjetas de deuda
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
      const mesLibre = window.appLang === 'pt' ? MESES_PT[f.getMonth()] : MESES_ES[f.getMonth()];
      libreStr = `${window.appLang === 'pt' ? 'Livre em' : 'Libre en'} ${d.mesLibre} ${window.appLang === 'pt' ? 'meses' : 'meses'} · ${mesLibre} ${f.getFullYear()}`;
    }
    
    item.innerHTML = `
      <div class="deuda-timeline-node"></div>
      <div class="deuda-card${isFoco ? ' foco' : ''}">
        ${isFoco ? '<div class="deuda-foco-badge">' + T('deudas_foco') + '</div>' : ''}
        ${isPagada ? '<div class="deuda-foco-badge" style="background:#10b981;">' + T('deudas_pagada') + '</div>' : ''}
        <div class="deuda-nombre">${d.nombre}</div>
        <div class="deuda-saldo">${fmt(d.saldoActual)}</div>
        <div class="deuda-meta-row">
          <span>${window.appLang === 'pt' ? 'Mín/mês' : 'Mín/mes'}: ${fmt(d.pagoMinimo)}</span>
          ${d.tasaInteres ? '<span>'+d.tasaInteres+ (window.appLang === 'pt' ? '% mensal' : '% mensual') + '</span>' : ''}
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
        <div style="font-weight:800;font-size:14px;">${window.appLang === 'pt' ? 'Extra disponível para dívidas' : 'Extra disponible para deudas'}</div>
        <div style="font-size:18px;font-weight:800;color:var(--primary);">${fmt(sb.extraMensual)}/${window.appLang === 'pt' ? 'mês' : 'mes'}</div>
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
      
      let medsHtml = `<div style="font-weight:800;font-size:14px;margin-bottom:12px;color:var(--accent-gold);text-transform:uppercase;letter-spacing:1px;">🏅 ${window.appLang === 'pt' ? 'Medalhas Conquistadas' : 'Medallas Conquistadas'}</div>`;
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
      nombre: window.appLang === 'pt' ? 'Iniciante 🎖️' : 'Iniciante 🎖️',
      desc: window.appLang === 'pt' ? 'Pagou 25% da dívida inicial' : 'Pagaste 25% de tu deuda inicial'
    });
  }
  if (pctPagado >= 50) {
    medallas.push({
      id: 'm_50',
      nombre: window.appLang === 'pt' ? 'Metade 🛡️' : 'Mitad 🛡️',
      desc: window.appLang === 'pt' ? 'Pagou 50% da dívida inicial' : 'Pagaste 50% de tu deuda inicial'
    });
  }
  if (pctPagado >= 75) {
    medallas.push({
      id: 'm_75',
      nombre: window.appLang === 'pt' ? 'Quase Livre 🚀' : 'Casi Libre 🚀',
      desc: window.appLang === 'pt' ? 'Pagou 75% da dívida inicial' : 'Pagaste 75% de tu deuda inicial'
    });
  }
  if (pctPagado >= 100) {
    medallas.push({
      id: 'm_100',
      nombre: window.appLang === 'pt' ? '100% Livre! 🎉' : '100% Libre! 🎉',
      desc: window.appLang === 'pt' ? 'Quitou todas as suas dívidas' : 'Liquidaste todas tus deudas'
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
    chip.className = 'chip' + (cat === selectedCat ? ' active' : '');
    const cleanCat = cat.replace(/^[^\wÀ-ž]*/, '').trim();
    chip.textContent = cat.split(' ')[0] + ' ' + T('cat_' + cleanCat);
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
        <button class="btn btn-secondary" style="margin-top:12px;min-height:38px;font-size:13px;" data-abono-meta="${meta.id}">💰 ${window.appLang === 'pt' ? 'Abonar' : 'Abonar'}</button>`;
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
        <span style="font-size:13px;font-weight:700;color:var(--text-muted);">${completadas}/52 ${window.appLang === 'pt' ? 'semanas concluídas' : 'semanas completadas'}</span>
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
        data.reto52.semanas[i] = !data.reto52.semanas[i];
        saveData();
        renderReto52();
      });
      grid.appendChild(cell);
    });
    document.getElementById('btn-reiniciar-reto').addEventListener('click', () => {
      if (confirm(window.appLang === 'pt' ? 'Reiniciar o desafio? O progresso será perdido.' : '¿Reiniciar el reto? Se perderá el progreso.')) {
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
  sel.value = data.config.moneda || '$';

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
  if (!nombre || isNaN(saldo)) { toast(window.appLang === 'pt' ? 'Preencha o nome e o saldo 🙂' : 'Completa nombre y saldo 🙂'); return; }
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
  data.transacciones.push({
    id: uid(), tipo: 'g', monto,
    descripcion: (window.appLang === 'pt' ? 'Abono: ' : 'Abono: ') + d.nombre,
    categoria: '💳 Deudas',
    fecha: new Date().toISOString()
  });
  saveData(); closeModal('modal-abono'); toast(T('modal_abono_toast')); renderDeudas(); renderDashboard();
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
  m.ahorrado = (m.ahorrado || 0) + monto;
  data.transacciones.push({
    id: uid(), tipo: 'g', monto,
    descripcion: (window.appLang === 'pt' ? 'Abono meta: ' : 'Abono meta: ') + m.nombre,
    categoria: 'Otros',
    fecha: new Date().toISOString()
  });
  saveData(); closeModal('modal-abono-meta'); toast(T('metas_abonar_toast')); renderMetas(); renderDashboard();
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
    level = window.appLang === 'pt' ? 'Excelente 💚' : 'Excelente 💚';
    color = 'var(--ok)';
  } else if (score >= 60) {
    level = window.appLang === 'pt' ? 'Bom 👍' : 'Estable 👍';
    color = '#10B981';
  } else if (score >= 40) {
    level = window.appLang === 'pt' ? 'Atenção ⚠️' : 'Atención ⚠️';
    color = 'var(--accent-gold)';
  } else {
    level = window.appLang === 'pt' ? 'Crítico 🚨' : 'Crítico 🚨';
    color = 'var(--danger)';
  }
  
  return { score, level, color };
}

function getMotivationalMessage(score) {
  const messages = {
    es: {
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
    },
    pt: {
      high: [
        "Excelente controle! Continue assim, sua liberdade financeira está cada vez mais perto. 🚀",
        "Você está no caminho certo. Sua disciplina financeira é admirável. 💪",
        "Que paz dá ter o controle! Seu eu do futuro agradecerá. 🎯"
      ],
      medium: [
        "Bom progresso. Revise seus envelopes para cortar gastos e acelerar sua Bola de Neve. ❄️",
        "Você está estável. Que tal aumentar um pouco o pagamento da sua dívida foco este mês? 🔥",
        "Cada pequeno ajuste conta. Continue consistente nos seus lançamentos. 📊"
      ],
      low: [
        "Passo a passo. Sua prioridade é reduzir despesas variáveis para criar seu primeiro fundo de emergência. 🛡️",
        "Não desanime. Foque hoje em pagar o mínimo das suas dívidas e atacar a menor. 🎯",
        "É hora de ajustar os envelopes. Todo esforço de hoje será liberdade amanhã. 🌱"
      ]
    }
  };
  
  const lang = window.appLang === 'pt' ? 'pt' : 'es';
  const pool = score >= 80 ? messages[lang].high : score >= 40 ? messages[lang].medium : messages[lang].low;
  
  const dayIndex = new Date().getDate() % pool.length;
  return pool[dayIndex];
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
  const streakText = streakCount > 0 ? ` 🔥 ${streakCount} ${window.appLang === 'pt' ? 'dias' : 'días'}` : '';
  
  document.getElementById('header-saludo').textContent = greeting + streakText;
  
  const now = new Date();
  const dateStr = window.appLang === 'pt'
    ? DIAS_PT[now.getDay()] + ', ' + now.getDate() + ' de ' + MESES_PT[now.getMonth()]
    : DIAS_ES[now.getDay()] + ', ' + now.getDate() + ' de ' + MESES_ES[now.getMonth()];
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
  updateStreaks();
  applyLang();

  // Flag emoji update on button
  const btnLang = document.getElementById('btn-lang');
  if (btnLang) {
    btnLang.textContent = window.appLang === 'es' ? '🇪🇸' : '🇧🇷';
    btnLang.addEventListener('click', () => {
      const nextLang = window.appLang === 'es' ? 'pt' : 'es';
      localStorage.setItem('sd_lang', nextLang);
      window.location.reload();
    });
  }

  // Set initial labels for types toggle
  document.getElementById('tipo-ingreso').textContent = '💚 ' + T('reg_ingreso');
  document.getElementById('tipo-gasto').textContent = '🔴 ' + T('reg_gasto');

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
    if (!monto || monto <= 0) { toast(T('reg_err')); return; }
    const desc = document.getElementById('reg-desc').value.trim();
    data.transacciones.push({
      id: uid(), tipo: selectedTipo, monto,
      descripcion: desc, categoria: selectedCat,
      fecha: new Date().toISOString()
    });
    saveData();
    toast(selectedTipo === 'i' ? T('reg_toast_ingreso') : T('reg_toast_gasto'));
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
    if (confirm(window.appLang === 'pt' ? 'Excluir todos os dados de teste?' : '¿Borrar todos los datos de prueba?')) {
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
    if (!nombre || isNaN(saldo)) { toast(window.appLang === 'pt' ? 'Preencha o nome e o saldo 🙂' : 'Completa nombre y saldo 🙂'); return; }
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
