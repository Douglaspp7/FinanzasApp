'use strict';

const STORAGE_KEY = 'sd_data';
const DEFAULT_DATA = {
  version: 2,
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
  streak: { count: 0, best: 0, lastDate: null },
  achievements: []
};

const ACHIEVEMENTS = [
  { id: 'first_tx',   emoji: '📝', name: 'Primer paso',    desc: 'Registra tu primera transacción' },
  { id: 'first_debt', emoji: '💳', name: 'Cara a cara',    desc: 'Agrega tu primera deuda' },
  { id: 'first_pay',  emoji: '💸', name: 'Primer abono',   desc: 'Realiza tu primer abono' },
  { id: 'streak3',    emoji: '🔥', name: '3 días',         desc: 'Racha de 3 días' },
  { id: 'streak7',    emoji: '🌟', name: 'Una semana',     desc: 'Racha de 7 días' },
  { id: 'streak30',   emoji: '🏆', name: 'Un mes',         desc: 'Racha de 30 días' },
  { id: 'debt_half',  emoji: '⚽', name: '50% pagado',    desc: 'Paga el 50% de una deuda' },
  { id: 'debt_done',  emoji: '🎉', name: 'Deuda libre',    desc: 'Elimina una deuda completamente' },
  { id: 'meta_done',  emoji: '🎯', name: 'Meta lograda',   desc: 'Completa una meta de ahorro' },
  { id: 'reto_start', emoji: '💪', name: 'Reto iniciado',  desc: 'Activa el reto 52 semanas' },
  { id: 'reto_half',  emoji: '🏃', name: 'Mitad del reto', desc: 'Completa 26 semanas del reto' },
  { id: 'score_80',   emoji: '📊', name: 'Salud 80+',      desc: 'Obtén puntaje de salud 80 o más' },
  { id: 'all_done',   emoji: '🚀', name 'Libertad',       desc: 'Paga todas tus deudas' }
];

const INSIGHTS = [
  { id: 'snowball', icon: '❄️', fn: d => {
    const sb = calcularSnowball(d);
    if (!sb || sb.meses === Infinity) return null;
    return `Con el método snowball puedes liquidar tus deudas en ${sb.meses} meses.`;
  }},
  { id: 'sobres', icon: '📊', fn: d => {
    const txs = getTxsMes(d);
    const spent = {};
    txs.filter(t=>t.tipo==='gasto').forEach(t=>{ const k=t.categoria; spent[k]=(spent[k]||0)+t.monto; });
    const over = Object.entries(d.config.sobres).filter(([k,v])=>v>0 && (spent[k]||0)>v);
    if (!over.length) return null;
    return `Superaste el presupuesto en: ${over.map(([k])=>k).join(', ')}.`;
  }},
  { id: 'foco', icon: '🎯', fn: d => {
    const deudas = d.deudas.filter(x=>x.saldo>0);
    if (!deudas.length) return null;
    const foco = [...deudas].sort((a,b)=>a.saldo-b.saldo)[0];
    return `Deuda FOCO: ${foco.nombre}. Saldo: ${fmt(foco.saldo, d.config.moneda)}. ¡Concentócentrate en ella!`;
  }},
  { id: 'ahorro', icon: '💰', fn: d => {
    const disp = d.config.ingresoMensual - d.config.gastosFijos;
    if (disp <= 0) return null;
    const rec = Math.round(disp * 0.2);
    return `Ahorrar el 20% de tu disponible (${fmt(rec, d.config.moneda)}) puede cambiar tu futuro.`;
  }}
];

let data = null;
let currentTipo = 'gasto';
let currentCategory = '';
let deferredInstall = null;
let _deudaEditId = null;
let _metaEditId = null;

// ---- Data ----
function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      data = Object.assign({}, DEFAULT_DATA, JSON.parse(raw));
      if (!data.streak) data.streak = { count: 0, best: 0, lastDate: null };
      if (!data.achievements) data.achievements = [];
    } else {
      data = JSON.parse(JSON.stringify(DEFAULT_DATA));
    }
  } catch(e) {
    data = JSON.parse(JSON.stringify(DEFAULT_DATA));
  }
}
function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// ---- Utils ----
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2,6); }
function fmt(n, sym) {
  const s = sym || (data && data.config.moneda) || '$';
  return s + Number(n||0).toLocaleString('es-MX', { minimumFractionDigits:2, maximumFractionDigits:2 });
}
function today() {
  return new Date().toISOString().slice(0,10);
}
function getMesActual() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
}
function getTxsMes(d) {
  const mes = getMesActual();
  return (d.transacciones||[]).filter(t => t.fecha && t.fecha.startsWith(mes));
}

// ---- Toast ----
function toast(msg, type='success') {
  const icons = { success:'✓', error:'✗', info:'ℹ', warning:'⚠️' };
  const c = document.getElementById('toast-container');
  if (!c) return;
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = (icons[type]||'') + ' ' + msg;
  c.appendChild(el);
  setTimeout(() => el.remove(), 3100);
}

function showAchievementToast(ach) {
  const c = document.getElementById('toast-container');
  if (!c) return;
  const el = document.createElement('div');
  el.className = 'ach-toast';
  el.innerHTML = `<span class="ach-toast-icon">${ach.emoji}</span><div><div style="font-weight:700">¡Logro desbloqueado!</div><div style="font-size:.8125rem;opacity:.85">${ach.name}</div></div>`;
  c.appendChild(el);
  confetti();
  setTimeout(() => el.remove(), 4100);
}

// ---- Ripple ----
function initRipples() {
  document.addEventListener('click', e => {
    const btn = e.target.closest('.btn');
    if (!btn) return;
    const r = document.createElement('span');
    r.className = 'ripple';
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    r.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX-rect.left-size/2}px;top:${e.clientY-rect.top-size/2}px`;
    btn.appendChild(r);
    setTimeout(() => r.remove(), 600);
  });
}

// ---- Confetti ----
function confetti() {
  const colors = ['#10b981','#34d399','#f59e0b','#3b82f6','#ef4444','#8b5cf6'];
  const c = document.createElement('div');
  c.className = 'confetti-container';
  document.body.appendChild(c);
  for (let i=0; i<40; i++) {
    const p = document.createElement('div');
    p.className = 'confetti-piece';
    p.style.cssText = `left:${Math.random()*100}vw;background:${colors[i%colors.length]};animation-delay:${Math.random()*0.5}s;animation-duration:${1.5+Math.random()}s;border-radius:${Math.random()>0.5?'50%':'2px'}`;
    c.appendChild(p);
  }
  setTimeout(() => c.remove(), 2500);
}

// ---- Navigation ----
function navTo(viewId) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  const view = document.getElementById(viewId);
  if (view) view.classList.add('active');
  const navId = 'nav-' + viewId.replace('v-','');
  const navBtn = document.getElementById(navId);
  if (navBtn) navBtn.classList.add('active');
  const renders = {
    'v-dashboard': renderDashboard,
    'v-deudas': renderDeudas,
    'v-registro': renderRegistro,
    'v-metas': renderMetas,
    'v-perfil': renderPerfil
  };
  if (renders[viewId]) renders[viewId]();
}

// ---- Modals ----
function openModal(id) {
  document.getElementById(id).classList.add('open');
}
function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-backdrop')) {
    e.target.classList.remove('open');
  }
});

// ---- Streak ----
function updateStreak() {
  if (!data.streak) data.streak = { count: 0, best: 0, lastDate: null };
  const t = today();
  const last = data.streak.lastDate;
  if (last === t) return;
  if (last) {
    const diff = (new Date(t) - new Date(last)) / 86400000;
    if (diff === 1) {
      data.streak.count++;
    } else if (diff > 1) {
      data.streak.count = 1;
    }
  } else {
    data.streak.count = 1;
  }
  data.streak.lastDate = t;
  if (data.streak.count > data.streak.best) data.streak.best = data.streak.count;
  saveData();
}

function renderStreak() {
  const s = data.streak || { count:0, best:0 };
  const sec = document.getElementById('streak-section');
  if (!sec) return;
  if (s.count >= 2) {
    sec.style.display = '';
    document.getElementById('streak-num').textContent = s.count;
    document.getElementById('streak-best').textContent = 'Récord: ' + s.best;
  } else {
    sec.style.display = 'none';
  }
}

// ---- Achievements ----
function checkAchievements() {
  const earned = data.achievements || [];
  const unlock = id => {
    if (!earned.includes(id)) {
      earned.push(id);
      data.achievements = earned;
      saveData();
      const ach = ACHIEVEMENTS.find(a=>a.id===id);
      if (ach) showAchievementToast(ach);
    }
  };
  if (data.transacciones.length >= 1) unlock('first_tx');
  if (data.deudas.length >= 1) unlock('first_debt');
  if (data.pagosDeuda.length >= 1) unlock('first_pay');
  const streak = (data.streak||{}).count || 0;
  if (streak >= 3) unlock('streak3');
  if (streak >= 7) unlock('streak7');
  if (streak >= 30) unlock('streak30');
  if (data.reto52.activo) unlock('reto_start');
  if ((data.reto52.semanas||[]).filter(Boolean).length >= 26) unlock('reto_half');
  data.deudas.forEach(d => {
    const pagos = (data.pagosDeuda||[]).filter(p=>p.deudaId===d.id).reduce((s,p)=>s+p.monto,0);
    if (pagos >= d.saldoInicial*0.5) unlock('debt_half');
  });
  const deudaPagada = data.deudas.some(d=>d.saldo<=0 && d.saldoInicial>0);
  if (deudaPagada) unlock('debt_done');
  const allPaid = data.deudas.length>0 && data.deudas.every(d=>d.saldo<=0);
  if (allPaid) unlock('all_done');
  data.metas.forEach(m => {
    if (m.actual >= m.target) unlock('meta_done');
  });
  const hs = calcularHealthScore();
  if (hs >= 80) unlock('score_80');
}

function renderAchievements() {
  const grid = document.getElementById('achievements-grid');
  if (!grid) return;
  const earned = data.achievements || [];
  grid.innerHTML = ACHIEVEMENTS.map(a => `
    <div class="achievement-badge ${earned.includes(a.id)?'unlocked':'locked'}" title="${a.desc}">
      <div class="ach-emoji">${a.emoji}</div>
      <div class="ach-name">${a.name}</div>
    </div>
  `).join('');
}

// ---- Health Score ----
function calcularHealthScore() {
  let score = 0;
  const txs = getTxsMes(data);
  const ingresos = txs.filter(t=>t.tipo==='ingreso').reduce((s,t)=>s+t.monto,0);
  const gastos = txs.filter(t=>t.tipo==='gasto').reduce((s,t)=>s+t.monto,0);
  const ingreso = data.config.ingresoMensual || 1;

  // 1. Ratio gastos/ingresos (0-25)
  const ratio = ingreso > 0 ? gastos/ingreso : 1;
  score += Math.max(0, 25 * (1 - ratio));

  // 2. Deuda total vs ingreso anual (0-25)
  const totalDeuda = data.deudas.reduce((s,d)=>s+(d.saldo||0),0);
  const dti = totalDeuda / (ingreso * 12);
  score += Math.max(0, 25 * (1 - Math.min(dti, 1)));

  // 3. Progreso de metas (0-20)
  if (data.metas.length > 0) {
    const avgProg = data.metas.reduce((s,m)=>s+(m.actual/(m.target||1)),0)/data.metas.length;
    score += Math.min(20, 20 * avgProg);
  } else {
    score += 10;
  }

  // 4. Streak (0-15)
  const streak = (data.streak||{}).count || 0;
  score += Math.min(15, streak * 0.5);

  // 5. Deudas con progreso (0-15)
  const debtsWithPay = data.deudas.filter(d=>d.saldo < (d.saldoInicial||d.saldo));
  if (data.deudas.length > 0) {
    score += 15 * (debtsWithPay.length / data.deudas.length);
  } else {
    score += 15;
  }

  return Math.min(100, Math.round(score));
}

function animateRing(score) {
  const bar = document.getElementById('health-ring-bar');
  const num = document.getElementById('health-score-num');
  const label = document.getElementById('health-label');
  const tip = document.getElementById('health-tip');
  if (!bar || !num) return;
  const circumference = 201;
  const offset = circumference - (score/100)*circumference;
  const color = score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';
  bar.style.stroke = color;
  bar.style.strokeDashoffset = offset;
  // Count-up
  let current = 0;
  const step = Math.ceil(score/40);
  const interval = setInterval(() => {
    current = Math.min(current+step, score);
    num.textContent = current;
    if (current >= score) clearInterval(interval);
  }, 30);
  num.style.color = color;
  if (label) {
    label.textContent = score >= 75 ? '💪 Salud financiera buena' :
                        score >= 50 ? '⚡ En progreso' : '\ud83d� Necesita atención';
  }
  if (tip) {
    tip.textContent = score >= 75 ? 'Sígue así, vas por buen camino.' :
                      score >= 50 ? 'Reduce gastos y sigue abonando.' :
                      'Registra movimientos y abona a tus deudas.';
  }
}

// ---- Snowball ----
function calcularSnowball(d) {
  const deudas = JSON.parse(JSON.stringify(d.deudas.filter(x => x.saldo > 0)));
  if (!deudas.length) return null;
  const ingresoDisponible = Math.max(0, d.config.ingresoMensual - d.config.gastosFijos);
  const minimos = deudas.reduce((s, x) => s+x.pagominimo, 0);
  if (minimos <= 0 || ingresoDisponible <= 0) return { meses: Infinity };
  let extraPool = Math.max(0, ingresoDisponible - minimos);
  let sorted = [...deudas].sort((a,b) => a.saldo-b.saldo);
  let mes = 0;
  const MAX_MES = 600;
  while (sorted.some(x=>x.saldo>0) && mes < MAX_MES) {
    mes++;
    // Interest
    sorted.forEach(x => { if(x.saldo>0) x.saldo += x.saldo*(x.tasa/100); });
    // Pay minimums
    sorted.forEach(x => { if(x.saldo>0){ const p=Math.min(x.pagominimo,x.saldo); x.saldo-=p; } });
    // Apply extra to FOCO
    let extra = extraPool;
    for (let i=0; i<sorted.length && extra>0; i++) {
      if (sorted[i].saldo > 0) {
        const p = Math.min(extra, sorted[i].saldo);
        sorted[i].saldo -= p;
        extra -= p;
      }
    }
    // Roll freed minimums into extra
    const freed = sorted.filter(x=>x.saldo<=0).reduce((s,x)=>s+x.pagominimo,0);
    extraPool += freed;
    sorted = sorted.filter(x=>x.saldo>0).concat(sorted.filter(x=>x.saldo<=0));
  }
  return { meses: mes === MAX_MES ? Infinity : mes };
}

// ---- Projections ----
function buildProjections() {
  const sec = document.getElementById('proj-section');
  const grid = document.getElementById('proj-grid');
  if (!sec || !grid) return;
  const deudas = data.deudas.filter(x=>x.saldo>0);
  if (!deudas.length) { sec.style.display='none'; return; }
  sec.style.display = '';
  const sb = calcularSnowball(data);
  const libre = sb && sb.meses !== Infinity
    ? (() => { const d=new Date(); d.setMonth(d.getMonth()+sb.meses); return d.toLocaleDateString('es-MX',{month:'short',year:'numeric'}); })()
    : 'N/D';
  const disp = Math.max(0, data.config.ingresoMensual - data.config.gastosFijos);
  const ahorro6m = fmt(disp * 6 * 0.2);
  const fondo = fmt(data.config.gastosFijos * 3);
  grid.innerHTML = `
    <div class="proj-card">
      <div class="proj-icon">🏁</div>
      <div class="proj-val">${libre}</div>
      <div class="proj-lbl">Libre de deudas</div>
    </div>
    <div class="proj-card">
      <div class="proj-icon">💰</div>
      <div class="proj-val">${ahorro6m}</div>
      <div class="proj-lbl">Ahorro potencial 6m</div>
    </div>
    <div class="proj-card">
      <div class="proj-icon">\ud83c�</div>
      <div class="proj-val">${fondo}</div>
      <div class="proj-lbl">Fondo emergencia</div>
    </div>
  `;
}

// ---- Insight ----
function getDailyInsight() {
  const dayIdx = new Date().getDate() % INSIGHTS.length;
  for (let i=0; i<INSIGHTS.length; i++) {
    const ins = INSIGHTS[(dayIdx+i)%INSIGHTS.length];
    const text = ins.fn(data);
    if (text) return { icon: ins.icon, text };
  }
  return { icon: '💡', text: 'Agrega tus deudas y el método snowball calculará tu fecha de libertad.' };
}

function renderInsight() {
  const sec = document.getElementById('insight-section');
  if (!sec) return;
  const ins = getDailyInsight();
  const iconEl = document.getElementById('insight-icon');
  const textEl = document.getElementById('insight-text');
  if (iconEl) iconEl.textContent = ins.icon;
  if (textEl) textEl.textContent = ins.text;
}

// ---- Empty state ----
function renderEmptyState(key, label, desc, ctaLabel, ctaFn) {
  const emojis = { deudas:'💳', metas:'\ud83c�', txs:'\ud83d�', reto:'\ud83d�' };
  return `<div class="empty-state">
    <div class="empty-icon">${emojis[key]||'\ud83d�'}</div>
    <div class="empty-title">${label}</div>
    <div class="empty-desc">${desc}</div>
    ${ctaLabel ? `<button class="btn btn-primary" onclick="${ctaFn}">${ctaLabel}</button>` : ''}
  </div>`;
}

// ---- Dashboard ----
function renderDashboard() {
  const txs = getTxsMes(data);
  const ingresos = txs.filter(t=>t.tipo==='ingreso').reduce((s,t)=>s+t.monto,0);
  const gastos = txs.filter(t=>t.tipo==='gasto').reduce((s,t)=>s+t.monto,0);
  const saldo = data.config.ingresoMensual + ingresos - gastos;

  const saldoEl = document.getElementById('dash-saldo');
  if (saldoEl) { saldoEl.textContent = fmt(saldo); saldoEl.className = 'balance-amount' + (saldo<0?' negative':''); }
  const ingEl = document.getElementById('dash-ingresos');
  if (ingEl) ingEl.textContent = fmt(data.config.ingresoMensual + ingresos);
  const gasEl = document.getElementById('dash-gastos');
  if (gasEl) gasEl.textContent = fmt(gastos);

  // Health score
  const score = calcularHealthScore();
  setTimeout(() => animateRing(score), 100);

  renderStreak();
  renderInsight();
  buildProjections();

  // Sobres
  const spent = {};
  txs.filter(t=>t.tipo==='gasto').forEach(t=>{ const k=t.categoria; spent[k]=(spent[k]||0)+t.monto; });
  const grid = document.getElementById('sobre-grid');
  if (grid) {
    const entries = Object.entries(data.config.sobres).filter(([,v])=>v>0);
    if (!entries.length) {
      grid.innerHTML = renderEmptyState('txs','Sin presupuesto','Configura tus sobres en Perfil.','Configurar',"navTo('v-perfil')");
    } else {
      grid.innerHTML = entries.map(([k,bud])=>{
        const sp = Object.entries(spent).filter(([cat])=>cat.toLowerCase().includes(k.toLowerCase().replace(/^[\ud800-\udfff\u{1F000}-\u{1FFFF}☀-⛿✀-➿]\s*/u,''))).reduce((s,[,v])=>s+v,0);
        const pct = bud>0 ? Math.min(100,Math.round(sp/bud*100)) : 0;
        const cls = pct>=100?'over':pct>=80?'warn':'';
        return `<div class="sobre-item">
          <div class="sobre-emoji">${k.match(/^[\ud800-\udfff]|[\u{1F000}-\u{1FFFF}☀-⛿✀-➿]/u)?.[0]||'\ud83d�'}</div>
          <div class="sobre-info">
            <div class="sobre-name">${k}</div>
            <div class="sobre-vals">
              <span class="sobre-spent">${fmt(sp)}</span>
              <span class="sobre-budget">de ${fmt(bud)}</span>
            </div>
            <div class="sobre-track"><div class="sobre-bar ${cls}" style="width:${pct}%"></div></div>
          </div>
          <div class="sobre-pct">${pct}%</div>
        </div>`;
      }).join('');
    }
  }

  // Recent txs
  const txEl = document.getElementById('dash-txs');
  if (txEl) {
    const recent = [...data.transacciones].sort((a,b)=>b.fecha.localeCompare(a.fecha)).slice(0,8);
    if (!recent.length) {
      txEl.innerHTML = renderEmptyState('txs','Sin movimientos','Registra tu primer gasto o ingreso.','Registrar',"navTo('v-registro')");
    } else {
      txEl.innerHTML = '<div class="tx-list">' + recent.map(t=>`
        <div class="tx-item">
          <div class="tx-emoji">${getCategoryEmoji(t.categoria)}</div>
          <div class="tx-info">
            <div class="tx-desc">${t.descripcion||t.categoria}</div>
            <div class="tx-cat">${t.categoria} &middot; ${t.fecha}</div>
          </div>
          <div class="tx-amount ${t.tipo}">${t.tipo==='ingreso'?'+':'-'}${fmt(t.monto)}</div>
        </div>
      `).join('') + '</div>';
    }
  }

  updateHeader();
}

// ---- Deudas ----
function renderDeudas() {
  const deudas = data.deudas;
  const sorted = [...deudas].sort((a,b)=>a.saldo-b.saldo);
  const listEl = document.getElementById('deuda-list');
  const libEl = document.getElementById('deudas-libertad');
  const sbSec = document.getElementById('snowball-section');
  const sbTrack = document.getElementById('snowball-track');
  const sub = document.getElementById('deudas-subtitle');

  if (sub) {
    const totalDeuda = deudas.reduce((s,d)=>s+d.saldo,0);
    sub.textContent = totalDeuda>0 ? `Total: ${fmt(totalDeuda)}` : 'Sin deudas activas';
  }

  if (!deudas.length) {
    if (listEl) listEl.innerHTML = renderEmptyState('deudas','Sin deudas registradas','¡Agrega tu primera deuda y el método snowball la ordenará por ti!','+ Agregar deuda',"openDeudaModal()");
    if (libEl) libEl.style.display='none';
    if (sbSec) sbSec.style.display='none';
    return;
  }

  // Libertad hero
  const allPaid = deudas.every(d=>d.saldo<=0);
  if (allPaid) {
    if (libEl) { libEl.style.display=''; libEl.innerHTML = `<div class="libertad-hero"><div class="icon">🎉</div><h2>¡Libre de deudas!</h2><p>Lograste salir de todas tus deudas. ¡Increíble!</p></div>`; }
    if (sbSec) sbSec.style.display='none';
    if (listEl) listEl.innerHTML = '';
    return;
  }
  if (libEl) libEl.style.display='none';

  const sb = calcularSnowball(data);
  if (sbSec && sbTrack && sorted.filter(x=>x.saldo>0).length > 1) {
    sbSec.style.display='';
    const active = sorted.filter(x=>x.saldo>0);
    sbTrack.innerHTML = active.map((d,i) => {
      const eta = sb && sb.meses !== Infinity ? '' : '';
      return `<div class="snowball-item${i===0?' foco':''}">
        <div class="snowball-rank">${i+1}</div>
        <div class="snowball-info">
          <div class="snowball-name">${d.nombre}</div>
          <div class="snowball-bal">${fmt(d.saldo)}</div>
        </div>
        ${i===0 ? '<span class="badge badge-foco">FOCO</span>' : ''}
      </div>`;
    }).join('');
  } else if (sbSec) {
    sbSec.style.display='none';
  }

  if (listEl) {
    listEl.innerHTML = '<div class="deuda-list">' + sorted.filter(x=>x.saldo>0).map((d,i) => {
      const pagos = (data.pagosDeuda||[]).filter(p=>p.deudaId===d.id).reduce((s,p)=>s+p.monto,0);
      const total = d.saldoInicial || d.saldo;
      const pct = total>0 ? Math.min(100, Math.round(pagos/total*100)) : 0;
      const tipoEmoji = {tarjeta:'💳',prestamo:'🏦',hipoteca:'🏠',auto:'🚗',otro:'📋'}[d.tipo]||'📋';
      return `<div class="deuda-card ${i===0?'foco':''}">
        <div class="deuda-header">
          <div>
            <div class="deuda-name">${d.nombre}</div>
            <div class="deuda-badges">
              ${i===0?'<span class="badge badge-foco">★ FOCO</span>':''}
              <span class="badge badge-tipo">${tipoEmoji} ${d.tipo}</span>
              ${d.tasa>5?'<span class="badge badge-alerta">🔥 Alta tasa</span>':''}
            </div>
          </div>
          <div class="deuda-amount">${fmt(d.saldo)}</div>
        </div>
        <div class="deuda-progress"><div class="deuda-bar" style="width:${pct}%"></div></div>
        <div class="deuda-meta">
          <span>${pct}% pagado</span>
          <span>Mín: ${fmt(d.pagominimo)}/mes &middot; ${d.tasa}% mensual</span>
        </div>
        <div class="deuda-actions">
          <button class="btn btn-primary btn-sm" onclick="openAbonoModal('${d.id}')">💸 Abonar</button>
          <button class="btn btn-ghost btn-sm" onclick="openDeudaModal('${d.id}')">Editar</button>
        </div>
      </div>`;
    }).join('') + '</div>';
  }
}

// ---- Registro ----
const CATEGORIES = [
  { label:'🍎 Alimentación', keywords:['aliment','super','comid','restaur','caf'] },
  { label:'🏠 Vivienda',        keywords:['viviend','alquil','rent','hipot','mantenimiento'] },
  { label:'🚗 Transporte',       keywords:['transport','gasoling','bus','uber','taxi','estacion'] },
  { label:'💊 Salud',            keywords:['salud','medic','farmac','doctor','consul'] },
  { label:'🎬 Ocio',             keywords:['ocio','entret','cine','netflix','suscripc'] },
  { label:'💡 Servicios',        keywords:['servic','luz','agua','internet','teléfono','gas'] },
  { label:'📦 Otros',            keywords:[] }
];

function getCategoryEmoji(cat) {
  if (!cat) return '📦';
  const found = CATEGORIES.find(c => c.label.toLowerCase() === cat.toLowerCase());
  if (found) return found.label.match(/^[\ud800-\udfff]|[\u{1F000}-\u{1FFFF}☀-⛿]/u)?.[0]||'📦';
  return cat.match(/^[\ud800-\udfff]|[\u{1F000}-\u{1FFFF}☀-⛿]/u)?.[0]||'📦';
}

function setTipo(tipo) {
  currentTipo = tipo;
  document.getElementById('tipo-gasto').className = 'tipo-btn' + (tipo==='gasto'?' active gasto':'');
  document.getElementById('tipo-ingreso').className = 'tipo-btn' + (tipo==='ingreso'?' active ingreso':'');
  renderCategoryChips();
}

function renderCategoryChips() {
  const el = document.getElementById('category-chips');
  if (!el) return;
  if (currentTipo === 'ingreso') {
    el.innerHTML = ['💼 Salario','💰 Freelance','\ud83d� Inversión','🎁 Extra'].map(c=>
      `<div class="chip${currentCategory===c?' active':''}" onclick="selectCat('${c}')">${c}</div>`
    ).join('');
  } else {
    el.innerHTML = CATEGORIES.map(c=>
      `<div class="chip${currentCategory===c.label?' active':''}" onclick="selectCat('${c.label}')">${c.label}</div>`
    ).join('');
  }
}

function selectCat(cat) {
  currentCategory = cat;
  renderCategoryChips();
  const desc = document.getElementById('reg-desc');
  if (desc && !desc.value) desc.value = cat;
}

function renderRegistro() {
  const fechaEl = document.getElementById('reg-fecha');
  if (fechaEl && !fechaEl.value) fechaEl.value = today();
  renderCategoryChips();
  renderHistorialMes();
}

function renderHistorialMes() {
  const el = document.getElementById('historial-mes');
  if (!el) return;
  const txs = [...getTxsMes(data)].sort((a,b)=>b.fecha.localeCompare(a.fecha));
  if (!txs.length) {
    el.innerHTML = renderEmptyState('txs','Sin movimientos este mes','Registra tu primer gasto o ingreso.','','');
    return;
  }
  el.innerHTML = '<div class="tx-list">' + txs.map(t=>`
    <div class="tx-item">
      <div class="tx-emoji">${getCategoryEmoji(t.categoria)}</div>
      <div class="tx-info">
        <div class="tx-desc">${t.descripcion||t.categoria}</div>
        <div class="tx-cat">${t.categoria} &middot; ${t.fecha}</div>
      </div>
      <div class="tx-amount ${t.tipo}">${t.tipo==='ingreso'?'+':'-'}${fmt(t.monto)}</div>
    </div>
  `).join('') + '</div>';
}

function saveRegistro() {
  const monto = parseFloat(document.getElementById('reg-monto').value);
  const desc = document.getElementById('reg-desc').value.trim();
  const fecha = document.getElementById('reg-fecha').value || today();
  if (!monto || monto <= 0) { toast('Ingresa un monto válido', 'error'); return; }
  if (!currentCategory) { toast('Selecciona una categoría', 'warning'); return; }
  data.transacciones.push({ id:uid(), tipo:currentTipo, monto, descripcion:desc, categoria:currentCategory, fecha });
  updateStreak();
  saveData();
  checkAchievements();
  toast(currentTipo==='ingreso'?'✓ Ingreso registrado':'✓ Gasto registrado');
  document.getElementById('reg-monto').value = '';
  document.getElementById('reg-desc').value = '';
  currentCategory = '';
  renderRegistro();
}

// ---- Metas ----
function renderMetas() {
  const el = document.getElementById('metas-list');
  if (el) {
    if (!data.metas.length) {
      el.innerHTML = renderEmptyState('metas','Sin metas','Crea tu primera meta de ahorro y comienza a progresar.','+ Nueva meta',"openMetaModal()");
    } else {
      el.innerHTML = data.metas.map(m => {
        const pct = m.target>0?Math.min(100,Math.round(m.actual/m.target*100)):0;
        return `<div class="meta-card">
          <div class="meta-header">
            <span class="meta-emoji">${m.emoji||'\ud83c�'}</span>
            <span class="meta-name">${m.nombre}</span>
            <button class="btn btn-ghost btn-sm" onclick="openMetaModal('${m.id}')">⋮</button>
          </div>
          <div class="meta-progress"><div class="meta-bar" style="width:${pct}%"></div></div>
          <div class="meta-vals">
            <span class="meta-current">${fmt(m.actual)}</span>
            <span class="meta-target">${fmt(m.target)}</span>
          </div>
          <div class="meta-actions">
            <button class="btn btn-primary btn-sm" onclick="openAbonoMetaModal('${m.id}')">+ Abonar</button>
            <span style="font-size:.75rem;color:var(--text-muted)">${pct}% completado</span>
          </div>
        </div>`;
      }).join('');
    }
  }
  renderReto52();
  renderAchievements();
}

function renderReto52() {
  const el = document.getElementById('reto-section');
  const btn = document.getElementById('reto-toggle-btn');
  if (!el) return;
  const r = data.reto52;
  if (!r.activo) {
    btn.textContent='Activar';
    el.innerHTML = `<div class="card" style="text-align:center;padding:20px">
      <div style="font-size:2rem">💪</div>
      <div class="text-headline" style="margin:8px 0">Reto 52 semanas</div>
      <div class="text-small text-secondary">Ahorra pequeñas cantidades semanales y acumula grandes resultados.</div>
    </div>`;
    return;
  }
  btn.textContent='Detener';
  const semanas = r.semanas || [];
  const done = semanas.filter(Boolean).length;
  const total = semanas.reduce((s,_,i)=>s+(semanas[i]?r.montoSemanal*(i+1):0),0);
  el.innerHTML = `
    <div class="card-accent" style="margin-bottom:8px">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div><div class="text-headline">${done}/52 semanas</div><div class="text-small text-secondary">Acumulado: ${fmt(total)}</div></div>
        <div style="font-size:2rem">\ud83c�</div>
      </div>
    </div>
    <div class="reto-grid">${Array.from({length:52},(_,i)=>{
      const done=semanas[i]||false;
      return `<div class="reto-semana${done?' done':''}" onclick="toggleSemana(${i})" title="Semana ${i+1}">${i+1}</div>`;
    }).join('')}</div>
  `;
}

function toggleReto() {
  data.reto52.activo = !data.reto52.activo;
  if (data.reto52.activo) {
    data.reto52.semanas = Array(52).fill(false);
    checkAchievements();
    toast('💪 ¡Reto activado! Suma semana a semana.');
  } else {
    toast('Reto detenido', 'info');
  }
  saveData();
  renderReto52();
}

function toggleSemana(idx) {
  data.reto52.semanas[idx] = !data.reto52.semanas[idx];
  saveData();
  checkAchievements();
  if (data.reto52.semanas[idx]) toast(`✓ Semana ${idx+1} completada`);
  renderReto52();
}

// ---- Perfil ----
function renderPerfil() {
  const name = document.getElementById('perfil-name');
  const stats = document.getElementById('perfil-stats');
  if (name) name.textContent = 'Mi Perfil';
  if (stats) {
    const totalDeuda = data.deudas.reduce((s,d)=>s+(d.saldo||0),0);
    const txCount = data.transacciones.length;
    stats.textContent = `${txCount} movimientos · ${fmt(totalDeuda)} en deudas · ${data.metas.length} metas`;
  }
}

// ---- Modal: Deuda ----
function openDeudaModal(id) {
  _deudaEditId = id || null;
  const editing = !!id;
  document.getElementById('modal-deuda-title').textContent = editing?'Editar deuda':'Nueva deuda';
  document.getElementById('btn-eliminar-deuda').style.display = editing?'':'none';
  if (editing) {
    const d = data.deudas.find(x=>x.id===id);
    if (d) {
      document.getElementById('deuda-nombre').value = d.nombre;
      document.getElementById('deuda-saldo').value = d.saldo;
      document.getElementById('deuda-tasa').value = d.tasa;
      document.getElementById('deuda-minimo').value = d.pagominimo;
      document.getElementById('deuda-tipo').value = d.tipo||'tarjeta';
    }
  } else {
    document.getElementById('deuda-nombre').value='';
    document.getElementById('deuda-saldo').value='';
    document.getElementById('deuda-tasa').value='';
    document.getElementById('deuda-minimo').value='';
    document.getElementById('deuda-tipo').value='tarjeta';
  }
  openModal('modal-deuda');
}

function saveDeuda() {
  const nombre = document.getElementById('deuda-nombre').value.trim();
  const saldo = parseFloat(document.getElementById('deuda-saldo').value);
  const tasa = parseFloat(document.getElementById('deuda-tasa').value)||0;
  const pagominimo = parseFloat(document.getElementById('deuda-minimo').value)||0;
  const tipo = document.getElementById('deuda-tipo').value;
  if (!nombre || !saldo) { toast('Completa nombre y saldo', 'error'); return; }
  if (_deudaEditId) {
    const d = data.deudas.find(x=>x.id===_deudaEditId);
    if (d) Object.assign(d, {nombre,saldo,tasa,pagominimo,tipo});
  } else {
    data.deudas.push({id:uid(),nombre,saldo,saldoInicial:saldo,tasa,pagominimo,tipo,fechaCreacion:today()});
  }
  saveData();
  checkAchievements();
  closeModal('modal-deuda');
  toast('✓ Deuda guardada');
  renderDeudas();
}

function eliminarDeudaActual() {
  if (!_deudaEditId) return;
  if (!confirm('¿Eliminar esta deuda?')) return;
  data.deudas = data.deudas.filter(x=>x.id!==_deudaEditId);
  data.pagosDeuda = (data.pagosDeuda||[]).filter(x=>x.deudaId!==_deudaEditId);
  saveData();
  closeModal('modal-deuda');
  toast('Deuda eliminada','info');
  renderDeudas();
}

// ---- Modal: Abono ----
function openAbonoModal(deudaId) {
  document.getElementById('abono-deuda-id').value = deudaId;
  const d = data.deudas.find(x=>x.id===deudaId);
  document.getElementById('modal-abono-title').textContent = 'Abonar a: ' + (d?d.nombre:'');
  document.getElementById('abono-monto').value='';
  document.getElementById('abono-fecha').value=today();
  openModal('modal-abono');
}

function saveAbono() {
  const deudaId = document.getElementById('abono-deuda-id').value;
  const monto = parseFloat(document.getElementById('abono-monto').value);
  const fecha = document.getElementById('abono-fecha').value||today();
  if (!monto||monto<=0) { toast('Ingresa un monto válido','error'); return; }
  const d = data.deudas.find(x=>x.id===deudaId);
  if (!d) return;
  d.saldo = Math.max(0, d.saldo-monto);
  if (!data.pagosDeuda) data.pagosDeuda=[];
  data.pagosDeuda.push({id:uid(),deudaId,monto,fecha});
  updateStreak();
  saveData();
  checkAchievements();
  closeModal('modal-abono');
  toast('✓ Abono registrado');
  if (d.saldo===0) { confetti(); toast('🎉 ¡Deuda pagada completamente!','success'); }
  renderDeudas();
}

// ---- Modal: Meta ----
function openMetaModal(id) {
  _metaEditId = id||null;
  const editing = !!id;
  document.getElementById('modal-meta-title').textContent = editing?'Editar meta':'Nueva meta';
  document.getElementById('btn-eliminar-meta').style.display = editing?'':'none';
  if (editing) {
    const m = data.metas.find(x=>x.id===id);
    if (m) {
      document.getElementById('meta-nombre').value=m.nombre;
      document.getElementById('meta-emoji').value=m.emoji||'\ud83c�';
      document.getElementById('meta-target').value=m.target;
    }
  } else {
    document.getElementById('meta-nombre').value='';
    document.getElementById('meta-emoji').value='\ud83c�';
    document.getElementById('meta-target').value='';
  }
  openModal('modal-meta');
}

function saveMeta() {
  const nombre = document.getElementById('meta-nombre').value.trim();
  const emoji = document.getElementById('meta-emoji').value||'\ud83c�';
  const target = parseFloat(document.getElementById('meta-target').value);
  if (!nombre||!target) { toast('Completa nombre y meta','error'); return; }
  if (_metaEditId) {
    const m = data.metas.find(x=>x.id===_metaEditId);
    if (m) Object.assign(m, {nombre,emoji,target});
  } else {
    data.metas.push({id:uid(),nombre,emoji,target,actual:0,fechaCreacion:today()});
  }
  saveData();
  closeModal('modal-meta');
  toast('✓ Meta guardada');
  renderMetas();
}

function eliminarMetaActual() {
  if (!_metaEditId) return;
  if (!confirm('¿Eliminar esta meta?')) return;
  data.metas = data.metas.filter(x=>x.id!==_metaEditId);
  saveData();
  closeModal('modal-meta');
  toast('Meta eliminada','info');
  renderMetas();
}

// ---- Modal: Abono meta ----
function openAbonoMetaModal(metaId) {
  document.getElementById('abono-meta-id').value=metaId;
  document.getElementById('abono-meta-monto').value='';
  openModal('modal-abono-meta');
}

function saveAbonoMeta() {
  const metaId = document.getElementById('abono-meta-id').value;
  const monto = parseFloat(document.getElementById('abono-meta-monto').value);
  if (!monto||monto<=0) { toast('Ingresa un monto válido','error'); return; }
  const m = data.metas.find(x=>x.id===metaId);
  if (!m) return;
  m.actual = (m.actual||0)+monto;
  updateStreak();
  saveData();
  checkAchievements();
  closeModal('modal-abono-meta');
  toast('✓ Abono a meta registrado');
  if (m.actual>=m.target) { confetti(); toast('🎉 ¡Meta lograda!','success'); }
  renderMetas();
}

// ---- Export / Import ----
function exportarDatos() {
  const blob = new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href=url; a.download='sindeudas-backup.json'; a.click();
  URL.revokeObjectURL(url);
  toast('✓ Datos exportados');
}

function importarDatos() {
  const inp = document.createElement('input');
  inp.type='file'; inp.accept='.json';
  inp.onchange = e => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const imported = JSON.parse(ev.target.result);
        data = imported;
        saveData();
        toast('✓ Datos importados');
        renderDashboard();
      } catch { toast('Error al importar','error'); }
    };
    reader.readAsText(file);
  };
  inp.click();
}

function resetData() {
  localStorage.removeItem(STORAGE_KEY);
  location.reload();
}

function editarPerfil() {
  navTo('v-registro');
  toast('Ir a Perfil > editar configuración', 'info');
}

// ---- Onboarding ----
const OB_SOBRES = [
  '🍎 Alimentación',
  '🏠 Vivienda',
  '🚗 Transporte',
  '💊 Salud',
  '🎬 Ocio',
  '💡 Servicios',
  '📦 Otros'
];

function showOnboarding() {
  document.getElementById('app').style.display='none';
  const ob = document.getElementById('onboarding');
  ob.style.display='';
  const sobresEl = document.getElementById('ob-sobres');
  if (sobresEl) {
    sobresEl.innerHTML = OB_SOBRES.map(k=>`
      <div class="sobre-config-item">
        <span class="sobre-config-label">${k}</span>
        <input class="input sobre-config-input" type="number" data-sobre="${k}" placeholder="0" inputmode="decimal">
      </div>
    `).join('');
  }
}

function obNext() {
  const ingreso = parseFloat(document.getElementById('ob-ingreso').value)||0;
  const gastos = parseFloat(document.getElementById('ob-gastos').value)||0;
  const moneda = document.getElementById('ob-moneda').value;
  data.config.ingresoMensual = ingreso;
  data.config.gastosFijos = gastos;
  data.config.moneda = moneda;
  document.querySelectorAll('[data-sobre]').forEach(inp=>{
    const key = inp.getAttribute('data-sobre');
    const val = parseFloat(inp.value)||0;
    if (val>0) data.config.sobres[key]=val;
  });
  document.getElementById('ob-step1').classList.remove('active');
  document.getElementById('ob-step2').classList.add('active');
}

let _obDeudas = [];
function obAddDeuda() {
  const id = uid();
  _obDeudas.push({ id, nombre:'', saldo:0, tasa:0, pagominimo:0, tipo:'tarjeta', saldoInicial:0, fechaCreacion:today() });
  renderObDeudas();
}
function renderObDeudas() {
  const el = document.getElementById('ob-deudas-list');
  if (!el) return;
  el.innerHTML = _obDeudas.map((d,i)=>`
    <div class="card" style="margin-bottom:8px">
      <div class="input-group"><label class="input-label">Nombre</label>
        <input class="input" value="${d.nombre}" onchange="_obDeudas[${i}].nombre=this.value" placeholder="Tarjeta Visa">
      </div>
      <div class="input-group"><label class="input-label">Saldo</label>
        <input class="input" type="number" value="${d.saldo||''}" onchange="_obDeudas[${i}].saldo=+this.value;_obDeudas[${i}].saldoInicial=+this.value" placeholder="0.00" inputmode="decimal">
      </div>
      <div style="display:flex;gap:8px">
        <div class="input-group" style="flex:1"><label class="input-label">Tasa %/mes</label>
          <input class="input" type="number" value="${d.tasa||''}" onchange="_obDeudas[${i}].tasa=+this.value" placeholder="2.5" inputmode="decimal">
        </div>
        <div class="input-group" style="flex:1"><label class="input-label">Mín/mes</label>
          <input class="input" type="number" value="${d.pagominimo||''}" onchange="_obDeudas[${i}].pagominimo=+this.value" placeholder="50" inputmode="decimal">
        </div>
      </div>
    </div>
  `).join('');
}

function finishOnboarding() {
  _obDeudas.filter(d=>d.nombre&&d.saldo>0).forEach(d=>data.deudas.push(d));
  data.config.onboardingDone = true;
  saveData();
  document.getElementById('onboarding').style.display='none';
  document.getElementById('app').style.display='';
  navTo('v-dashboard');
  toast('\ud83d� ¡Bienvenido a SinDeudas!');
}

// ---- Header ----
function updateHeader() {
  const sub = document.getElementById('hdr-subtitle');
  if (sub) {
    const now = new Date();
    sub.textContent = now.toLocaleDateString('es-MX',{weekday:'long',day:'numeric',month:'long'});
  }
}

// ---- PWA ----
function initPWA() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(()=>{});
  }
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferredInstall = e;
    const btn = document.getElementById('install-btn');
    if (btn) btn.style.display='';
  });
}

function installPWA() {
  if (deferredInstall) {
    deferredInstall.prompt();
    deferredInstall.userChoice.then(()=>{ deferredInstall=null; });
  }
}

// ---- Boot ----
document.addEventListener('DOMContentLoaded', () => {
  loadData();
  initPWA();
  initRipples();
  if (!data.config.onboardingDone) {
    showOnboarding();
  } else {
    document.getElementById('app').style.display='';
    navTo('v-dashboard');
  }
});
