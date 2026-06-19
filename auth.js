// ===== CONFIGURACIÓN DE SEGURIDAD (HOTMART + FIREBASE) =====

// 1. URL do seu Cloudflare Worker (que recebe os webhooks da Hotmart e consulta o KV)
window.WORKER_URL = "https://sindeudas-auth.douglaspp7.workers.dev";

// 2. Chaves do seu projeto Firebase (Crie em console.firebase.google.com)
const firebaseConfig = {
  apiKey: "AIzaSyBAsIzvGrG6ytzrqjGEhbeV_BE3p23-ahE",
  authDomain: "sindeudas-app.firebaseapp.com",
  projectId: "sindeudas-app",
  storageBucket: "sindeudas-app.firebasestorage.app",
  messagingSenderId: "513655060373",
  appId: "1:513655060373:web:7507090c61f10a9d95689c",
  measurementId: "G-F783LJ8E13"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// Extrai o e-mail embutido no link mágico (param ?email= ou dentro de continueUrl)
function getEmailFromUrl() {
  try {
    const sp = new URLSearchParams(window.location.search);
    if (sp.get('email')) return sp.get('email');
    const cont = sp.get('continueUrl');
    if (cont) {
      const inner = new URLSearchParams(new URL(cont).search).get('email');
      if (inner) return inner;
    }
  } catch (e) {}
  return null;
}

document.addEventListener("DOMContentLoaded", async () => {
  // Verifica se o usuário clicou no Link Mágico no email
  if (auth.isSignInWithEmailLink(window.location.href)) {
    // 1) tenta o localStorage (mesmo navegador); 2) tenta o e-mail embutido no
    // link (funciona mesmo abrindo em outro navegador/webview); 3) só então pergunta
    let email = window.localStorage.getItem('emailForSignIn') || getEmailFromUrl();
    if (!email) {
      email = window.prompt('Por favor, confirma tu correo electrónico para verificar el enlace.');
    }
    
    const btn = document.getElementById('btn-login');
    if(btn) {
      btn.textContent = "Verificando tu compra...";
      btn.disabled = true;
    }

    try {
      await auth.signInWithEmailLink(email, window.location.href);
      window.localStorage.removeItem('emailForSignIn');
      
      // Consultar Cloudflare Worker (para ver se ele comprou na Hotmart e está no KV)
      if (!window.WORKER_URL || window.WORKER_URL.includes("SEU-USUARIO")) {
        console.warn("Worker URL não configurada. Liberando acesso modo Teste.");
        activarYEntrar(email);
        return;
      }

      // Bypass de dono/admin (seu email sempre passa)
      if (email.toLowerCase() === "douglaspp7@gmail.com") {
        activarYEntrar(email);
        return;
      }
      
      const req = await fetch(`${window.WORKER_URL}/activate?email=${encodeURIComponent(email)}`);
      const res = await req.json();
      
      if (res.active) {
        activarYEntrar(email);
      } else {
        alert("Lo sentimos, no encontramos tu correo en la lista de compradores. Si acabas de comprar, espera unos minutos y vuelve a intentarlo.");
        await auth.signOut();
        if(btn) { btn.textContent = "Recibir Enlace Mágico ✨"; btn.disabled = false; }
      }
    } catch (error) {
      alert("Error verificando enlace: " + error.message);
      if(btn) { btn.textContent = "Recibir Enlace Mágico ✨"; btn.disabled = false; }
    }
  } else {
    // Acesso normal - verificar se já está logado
    auth.onAuthStateChanged(user => {
      if (user) {
        // Logado
        activarYEntrar(user.email);
      } else {
        // Deslogado - mostra tela de login e esconde app
        document.getElementById('auth-screen').classList.remove('hidden');
        document.getElementById('app').classList.add('hidden');
        document.getElementById('screen-onboarding').classList.add('hidden');
      }
    });
  }
});

// Função chamada pelo botão da tela de Login
async function forceLogin() {
  const email = document.getElementById('login-email').value.trim();
  const btn = document.getElementById('btn-login');
  
  if (!email) {
    alert("Por favor, ingresa tu correo de compra.");
    return;
  }

  btn.textContent = "Enviando enlace...";
  btn.disabled = true;

  const actionCodeSettings = {
    // Redireciona para a própria URL atual após clicar no email, embutindo o
    // e-mail para conseguir entrar direto mesmo em outro navegador/webview
    url: window.location.href.split('?')[0] + '?email=' + encodeURIComponent(email),
    handleCodeInApp: true,
  };

  try {
    await auth.sendSignInLinkToEmail(email, actionCodeSettings);
    window.localStorage.setItem('emailForSignIn', email);
    
    document.getElementById('login-input-area').style.display = 'none';
    document.getElementById('login-message').style.display = 'block';
    btn.style.display = 'none';
  } catch (error) {
    alert("Error enviando enlace: " + error.message);
    btn.textContent = "Recibir Enlace Mágico ✨";
    btn.disabled = false;
  }
}

function activarYEntrar(email) {
  try { localStorage.setItem('user_email', email); } catch(e){}

  // Limpa os parâmetros do link mágico da URL para que um refresh não reprocesse
  try { history.replaceState(null, '', window.location.pathname); } catch(e){}

  document.getElementById('auth-screen').classList.add('hidden');
  
  // Dispara o evento para o app.js inicializar o app ou o onboarding
  window.dispatchEvent(new CustomEvent('auth-success'));
}

// Para expor globalmente
window.forceLogin = forceLogin;
window.auth = auth;
