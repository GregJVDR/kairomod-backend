/* ============================================================
   KAÏROMOD — auth.js
   Supabase Auth (email + password)
   ⚠️  Remplacez SUPABASE_URL et SUPABASE_ANON_KEY par vos valeurs
   ============================================================ */

// ── 1. CONFIG ─────────────────────────────────────────────────
const SUPABASE_URL      = 'https://bpkbxgwzlsbfpclxmjee.supabase.co';   // ex: https://xyzxyz.supabase.co
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwa2J4Z3d6bHNiZnBjbHhtamVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxODkzMjIsImV4cCI6MjA4OTc2NTMyMn0.FbjmTtgEQONltjf4FsxHPhetbce9vCoJS-RNUIYkgAU'; // clé publique "anon"

// ── 2. INIT CLIENT ────────────────────────────────────────────
const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── 3. ÉTAT COURANT ───────────────────────────────────────────
let currentUser = null;

// ── 4. INIT AU CHARGEMENT ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  // Récupère la session active (si déjà connecté)
  const { data: { session } } = await sb.auth.getSession();
  if (session?.user) {
    currentUser = session.user;
    onUserLoggedIn(session.user);
  }

  // Écoute les changements d'état (connexion / déconnexion)
  sb.auth.onAuthStateChange((_event, session) => {
    if (session?.user) {
      currentUser = session.user;
      onUserLoggedIn(session.user);
    } else {
      currentUser = null;
      onUserLoggedOut();
    }
  });

  // Ferme le menu user en cliquant ailleurs
  document.addEventListener('click', (e) => {
    const menu = document.getElementById('userMenu');
    const btn  = document.getElementById('authNavBtn');
    if (menu && !menu.contains(e.target) && btn && !btn.contains(e.target)) {
      menu.style.display = 'none';
    }
  });
});

// ── 5. CONNEXION ──────────────────────────────────────────────
async function doLogin() {
  const email    = document.getElementById('loginEmail')?.value.trim();
  const password = document.getElementById('loginPassword')?.value;
  const errEl    = document.getElementById('loginError');

  if (!email || !password) {
    showAuthError(errEl, 'Veuillez remplir tous les champs.');
    return;
  }

  const btn = document.querySelector('#loginForm .km-auth-submit');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connexion...';

  const { data, error } = await sb.auth.signInWithPassword({ email, password });

  btn.disabled = false;
  btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Se connecter';

  if (error) {
    showAuthError(errEl, traductionErreur(error.message));
    return;
  }

  if (errEl) errEl.style.display = 'none';
  closeModal('authModal');
  showToast('✅ Connecté avec succès !');
}

// ── 6. INSCRIPTION ────────────────────────────────────────────
async function doRegister() {
  const name     = document.getElementById('registerName')?.value.trim();
  const email    = document.getElementById('registerEmail')?.value.trim();
  const password = document.getElementById('registerPassword')?.value;
  const errEl    = document.getElementById('registerError');

  if (!name || !email || !password) {
    showAuthError(errEl, 'Veuillez remplir tous les champs.');
    return;
  }
  if (password.length < 8) {
    showAuthError(errEl, 'Le mot de passe doit faire au moins 8 caractères.');
    return;
  }

  const btn = document.querySelector('#registerForm .km-auth-submit');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Création...';

  const { data, error } = await sb.auth.signUp({
    email,
    password,
    options: { data: { full_name: name } }
  });

  btn.disabled = false;
  btn.innerHTML = '<i class="fas fa-user-plus"></i> Créer mon compte';

  if (error) {
    showAuthError(errEl, traductionErreur(error.message));
    return;
  }

  if (errEl) errEl.style.display = 'none';
  closeModal('authModal');
  showToast('✅ Compte créé ! Vérifiez vos emails pour confirmer.');
}

// ── 7. DÉCONNEXION ────────────────────────────────────────────
async function doLogout() {
  await sb.auth.signOut();
  document.getElementById('userMenu').style.display = 'none';
  showToast('Déconnecté.');
}

// ── 8. CALLBACKS UI ───────────────────────────────────────────
function onUserLoggedIn(user) {
  const name  = user.user_metadata?.full_name || user.email.split('@')[0];
  const email = user.email;

  // Met à jour le bouton navbar
  const navBtn   = document.getElementById('authNavBtn');
  const navLabel = document.getElementById('authNavLabel');
  const navIcon  = document.getElementById('authNavIcon');
  if (navBtn)   navBtn.classList.add('logged-in');
  if (navLabel) navLabel.textContent = name.split(' ')[0];
  if (navIcon)  navIcon.className = 'fas fa-user-check';

  // Met à jour le menu déroulant
  const dispName  = document.getElementById('userDisplayName');
  const dispEmail = document.getElementById('userDisplayEmail');
  if (dispName)  dispName.textContent  = name;
  if (dispEmail) dispEmail.textContent = email;
}

function onUserLoggedOut() {
  const navBtn   = document.getElementById('authNavBtn');
  const navLabel = document.getElementById('authNavLabel');
  const navIcon  = document.getElementById('authNavIcon');
  if (navBtn)   navBtn.classList.remove('logged-in');
  if (navLabel) navLabel.textContent = 'Connexion';
  if (navIcon)  navIcon.className = 'fas fa-user-circle';
}

// ── 9. TOGGLE MENU / MODAL ────────────────────────────────────
function toggleAuthNav() {
  if (currentUser) {
    // Affiche/masque le menu déroulant
    const menu = document.getElementById('userMenu');
    if (menu) menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
  } else {
    openModal('authModal');
  }
}

function switchAuthTab(tab) {
  const loginForm    = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const loginTab     = document.getElementById('loginTab');
  const registerTab  = document.getElementById('registerTab');

  if (tab === 'login') {
    loginForm.style.display    = 'flex';
    registerForm.style.display = 'none';
    loginTab.classList.add('active');
    registerTab.classList.remove('active');
  } else {
    loginForm.style.display    = 'none';
    registerForm.style.display = 'flex';
    registerTab.classList.add('active');
    loginTab.classList.remove('active');
  }
}

// ── 10. HELPERS ───────────────────────────────────────────────
function showAuthError(el, msg) {
  if (!el) return;
  el.textContent  = msg;
  el.style.display = 'block';
}

function traductionErreur(msg) {
  if (msg.includes('Invalid login'))    return '❌ Email ou mot de passe incorrect.';
  if (msg.includes('Email not confirmed')) return '⚠️ Confirmez d\'abord votre email.';
  if (msg.includes('already registered')) return '⚠️ Cet email est déjà utilisé.';
  if (msg.includes('Password should'))  return '❌ Mot de passe trop court (8 caractères min).';
  if (msg.includes('rate limit'))       return '⏳ Trop de tentatives. Réessayez dans quelques minutes.';
  return '❌ ' + msg;
}

// ── 11. EXPORT (accessible depuis script.js) ──────────────────
window.getCurrentUser  = () => currentUser;
window.getSupabaseClient = () => sb;
