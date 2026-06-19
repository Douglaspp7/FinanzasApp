// ===== CONFIGURACIÓN DE SEGURIDAD (HOTMART + FIREBASE) =====

// 1. URL do seu Cloudflare Worker (recebe webhooks da Hotmart e consulta o KV)
window.WORKER_URL = "https://sindeudas-auth.douglaspp7.workers.dev";

// 2. Chaves do seu projeto Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBAsIzvGrG6ytzrqjGEhbeV_BE3p23-ahE",
  authDomain: "sindeudas-app.firebaseapp.com",
  projectId: "sindeudas-app",
  storageBucket: "sindeudas-app.firebasestorage.app",
  messagingSenderId: "513655060373",
  appId: "1:513655060373:web:7507090c61f10a9d95689c",
  measurementId: "G-F783LJ8E13"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// Mantém a sessão entre aberturas do app (login persistente)
try { auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL); } catch (e) {}

const OWNER_EMAIL = "douglaspp7@gmail.com";
let authMode = 'login'; // 'login' | 'register'

// ===== Inicio: mantém logado ou mostra tela de login =====
document.addEventListener("DOMContentLoaded", () => {
  auth.onAuthStateChanged(user => {
    if (user) {
      activarYEntrar(user.email);
    } else {
      document.getElementById('auth-screen').classList.remove('hidden');
      document.getElementById('app').classList.add('hidden');
      document.getElementById('screen-onboarding').classList.add('hidden');
    }
  });
});

// ===== Verifica a compra na Hotmart via Cloudflare Worker =====
async function verificarCompra(email) {
  // Dono sempre passa
  if (email === OWNER_EMAIL) return true;
  // Modo teste se o Worker não estiver configurado
  if (!window.WORKER_URL || window.WORKER_URL.includes("SEU-USUARIO")) {
    console.warn("Worker URL não configurada. Liberando acesso (modo teste).");
    return true;
  }
  const req = await fetch(`${window.WORKER_URL}/activate?email=${encodeURIComponent(email)}`);
  const res = await req.json();
  return !!res.active;
}

// ===== Alterna entre Entrar e Crear cuenta =====
function setAuthMode(m) {
  authMode = m;
  const btn = document.getElementById('btn-login');
  const toggle = document.getElementById('auth-toggle');
  if (m === 'register') {
    if (btn)    btn.textContent    = tT('login_btn_register', 'Crear mi cuenta');
    if (toggle) toggle.textContent = tT('login_toggle_login', 'Ya tengo cuenta · Entrar');
  } else {
    if (btn)    btn.textContent    = tT('login_btn', 'Entrar');
    if (toggle) toggle.textContent = tT('login_toggle_register', '¿Primera vez? Crear mi contraseña');
  }
}
function toggleAuthMode() { setAuthMode(authMode === 'login' ? 'register' : 'login'); }

// helper i18n seguro (cae al texto por defecto si no existe T)
function tT(k, fb) { return (typeof T === 'function' && T(k) !== k) ? T(k) : fb; }

function resetBtn() {
  const btn = document.getElementById('btn-login');
  if (btn) { btn.disabled = false; }
  setAuthMode(authMode);
}

// ===== Login / Registro com e-mail e senha =====
async function doAuth() {
  const email = (document.getElementById('login-email').value || '').trim().toLowerCase();
  const password = document.getElementById('login-password').value || '';
  const btn = document.getElementById('btn-login');

  if (!/^\S+@\S+\.\S+$/.test(email)) { alert("Escribe un correo válido."); return; }
  if (password.length < 6) { alert("La contraseña debe tener al menos 6 caracteres."); return; }

  btn.disabled = true;
  btn.textContent = "Verificando tu compra...";

  try {
    // 1) Só compradores entram (Worker/Hotmart). Dono e modo teste passam.
    let comprou;
    try {
      comprou = await verificarCompra(email);
    } catch (e) {
      alert("No pudimos verificar tu compra ahora (conexión). Intenta de nuevo en unos segundos.");
      resetBtn(); return;
    }
    if (!comprou) {
      alert("No encontramos este correo en la lista de compradores. Si acabas de comprar, espera unos minutos y usa el MISMO correo de tu compra.");
      resetBtn(); return;
    }

    // 2) Entrar ou criar conta (modo explícito)
    btn.textContent = (authMode === 'register') ? "Creando tu cuenta..." : "Entrando...";

    if (authMode === 'register') {
      try {
        await auth.createUserWithEmailAndPassword(email, password);
        // onAuthStateChanged entra automaticamente
      } catch (e) {
        if (e.code === 'auth/email-already-in-use') {
          alert("Ya tienes una cuenta con este correo. Entra con tu contraseña (o usa '¿Olvidaste tu contraseña?').");
          setAuthMode('login'); resetBtn(); return;
        }
        if (e.code === 'auth/weak-password') { alert("La contraseña es muy débil. Usa al menos 6 caracteres."); resetBtn(); return; }
        throw e;
      }
    } else {
      try {
        await auth.signInWithEmailAndPassword(email, password);
        // onAuthStateChanged entra automaticamente
      } catch (e) {
        if (e.code === 'auth/wrong-password' || e.code === 'auth/user-not-found' || e.code === 'auth/invalid-credential') {
          alert("Correo o contraseña incorrectos. ¿Es tu primera vez? Toca '¿Primera vez? Crear mi contraseña'.");
          resetBtn(); return;
        }
        if (e.code === 'auth/too-many-requests') { alert("Demasiados intentos. Espera un momento e intenta de nuevo."); resetBtn(); return; }
        throw e;
      }
    }
  } catch (error) {
    alert("Error al entrar: " + (error.message || error));
    resetBtn();
  }
}

// ===== Redefinição de senha =====
async function resetPassword() {
  const email = (document.getElementById('login-email').value || '').trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) { alert("Escribe tu correo arriba y luego toca '¿Olvidaste tu contraseña?'."); return; }
  try {
    await auth.sendPasswordResetEmail(email);
    alert("Te enviamos un correo para restablecer tu contraseña. Revisa tu bandeja de entrada (y spam).");
  } catch (e) {
    if (e.code === 'auth/user-not-found') {
      alert("No hay ninguna cuenta con ese correo todavía. Si es tu primera vez, crea tu contraseña con '¿Primera vez? Crear mi contraseña'.");
    } else {
      alert("No pudimos enviar el correo: " + (e.message || e));
    }
  }
}

function activarYEntrar(email) {
  try { localStorage.setItem('user_email', email); } catch (e) {}
  document.getElementById('auth-screen').classList.add('hidden');
  // Dispara o evento para o app.js inicializar o app ou o onboarding
  window.dispatchEvent(new CustomEvent('auth-success'));
}

async function logout() {
  try { await auth.signOut(); } catch (e) {}
  location.reload();
}

// Expor globalmente
window.doAuth = doAuth;
window.toggleAuthMode = toggleAuthMode;
window.resetPassword = resetPassword;
window.logout = logout;
window.auth = auth;
