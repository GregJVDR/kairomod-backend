/* ================================================================
   KAÏROMOD — script.js — 2025
   CORRECTIONS :
   ✅ URL Stripe corrigée (chemin complet /api/create-checkout-session)
   ✅ Badge panier : display flex corrigé
   ✅ Progress indicator
   ✅ Anti-spam localStorage nettoyé
   ================================================================ */

/* ── CONFIG EMAILJS ─────────────────────────────────────────── */
const EMAILJS_CONFIG = {
  service_id:  'service_0d32xia',
  template_id: 'template_kg3nlue',
  user_id:     '8i4pazbrex7-Ut2e2'
};

/* ── BACKEND URL (CORRIGÉE) ─────────────────────────────────── */
// ✅ FIX: ajout du chemin /api/create-checkout-session
const STRIPE_API = 'https://kairomod-backend-iqq5.vercel.app/api/create-checkout-session';

/* ── PANIER ─────────────────────────────────────────────────── */
let cart = [];
try { cart = JSON.parse(localStorage.getItem('cartItems') || '[]'); } catch { cart = []; }

function saveCart() {
  localStorage.setItem('cartItems', JSON.stringify(cart));
}

/* ── BADGE PANIER ───────────────────────────────────────────── */
function updateCartBadge() {
  const badge = document.getElementById('cartBadge');
  if (!badge) return;
  const n = cart.length;
  badge.textContent = n;
  if (n > 0) {
    badge.classList.add('show');
    badge.style.display = 'flex';
  } else {
    badge.classList.remove('show');
    badge.style.display = 'none';
  }
}

/* ── PROGRESS ───────────────────────────────────────────────── */
function updateProgress() {
  const el = document.getElementById('progressText');
  if (!el || !currentWatchType) return;
  const total   = getRequiredCategories().length;
  const done    = getRequiredCategories().filter(c => selectedOptions[c]).length;
  el.textContent = `${done}/${total}`;
  el.parentElement.style.background = done === total
    ? 'rgba(39,174,96,0.12)' : 'rgba(255,123,0,0.07)';
  el.style.color = done === total ? '#27ae60' : '#ff7b00';
}

/* ── ADD TO CART ────────────────────────────────────────────── */
function addToCart() {
  const required = getRequiredCategories();
  for (const r of required) {
    if (!selectedOptions[r]) {
      showToast('⚠️ Sélectionnez toutes les options avant d\'ajouter.');
      return;
    }
  }

  const item = {
    type:     currentWatchType,
    elements: { ...selectedOptions },
    total:    calculateTotalPrice(),
    image:    document.getElementById('watchImage')?.src || '',
    date:     new Date().toISOString()
  };

  cart.push(item);
  saveCart();
  updateCartBadge();
  flyToCartAnimation();

  // Button feedback
  ['addToCartBtn','addToCartBtnMobile'].forEach(id => {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.classList.add('added');
  });
  ['orderBtnText','orderBtnTextMobile'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = '✓ Montre ajoutée !';
  });

  setTimeout(() => {
    ['addToCartBtn','addToCartBtnMobile'].forEach(id => {
      const btn = document.getElementById(id);
      if (btn) btn.classList.remove('added');
    });
    updateOrderButtonState();
  }, 2000);
}

/* ── FLY ANIMATION ──────────────────────────────────────────── */
function flyToCartAnimation() {
  const cartBtn = document.querySelector('.km-cart-btn');
  const addBtn  = document.getElementById('addToCartBtn') || document.getElementById('addToCartBtnMobile');
  const flyEl   = document.getElementById('cartFlyEl');
  if (!cartBtn || !addBtn || !flyEl) { spawnConfetti(addBtn); return; }

  const bR = addBtn.getBoundingClientRect();
  const cR = cartBtn.getBoundingClientRect();
  const sx = bR.left + bR.width  / 2 - 20;
  const sy = bR.top  + bR.height / 2 - 20;
  const ex = cR.left + cR.width  / 2 - 20;
  const ey = cR.top  + cR.height / 2 - 20;

  flyEl.innerHTML = '<i class="fas fa-shopping-bag"></i>';
  flyEl.style.cssText = `left:${sx}px;top:${sy}px;opacity:1;position:fixed;`;

  const dur = 650;
  const t0  = performance.now();

  function step(now) {
    const t    = Math.min((now - t0) / dur, 1);
    const ease = t < 0.5 ? 2*t*t : -1+(4-2*t)*t;
    const x    = sx + (ex - sx) * ease;
    const y    = sy + (ey - sy) * ease - 110 * Math.sin(Math.PI * t);
    const sc   = 1 - 0.7 * ease;
    const op   = t < 0.85 ? 1 : 1 - (t - 0.85) / 0.15;

    flyEl.style.left      = x + 'px';
    flyEl.style.top       = y + 'px';
    flyEl.style.transform = `scale(${sc})`;
    flyEl.style.opacity   = op;

    if (t < 1) {
      requestAnimationFrame(step);
    } else {
      flyEl.style.opacity = '0';
      // Re-pop badge
      const badge = document.getElementById('cartBadge');
      if (badge) {
        badge.style.animation = 'none';
        void badge.offsetWidth;
        badge.style.animation = 'badgePop 0.35s var(--ease)';
      }
      spawnConfetti(addBtn);
    }
  }
  requestAnimationFrame(step);
}

const CONF_COLORS = ['#ff7b00','#ffd700','#ff4d4d','#27ae60','#3498db','#a855f7'];

function spawnConfetti(anchor) {
  if (!anchor) return;
  const r = anchor.getBoundingClientRect();
  const cx = r.left + r.width  / 2;
  const cy = r.top  + r.height / 2;
  for (let i = 0; i < 14; i++) {
    const d   = document.createElement('div');
    d.className = 'km-confetti';
    const ang = (i / 14) * Math.PI * 2;
    const dist = 42 + Math.random() * 32;
    d.style.cssText = `left:${cx-3.5}px;top:${cy-3.5}px;background:${CONF_COLORS[i%CONF_COLORS.length]};--dx:${Math.cos(ang)*dist}px;--dy:${Math.sin(ang)*dist}px;`;
    document.body.appendChild(d);
    setTimeout(() => d.remove(), 700);
  }
}

/* ── OPEN CART ──────────────────────────────────────────────── */
function openCart() {
  const container = document.getElementById('cartItemsContainer');
  if (!container) return;
  container.innerHTML = '';
  let total = 0;

  if (cart.length === 0) {
    container.innerHTML = `
      <div style="text-align:center;padding:36px 20px;color:#aaa;">
        <i class="fas fa-shopping-bag" style="font-size:3rem;opacity:0.18;display:block;margin-bottom:14px;"></i>
        <p style="font-size:0.95rem;">Votre panier est vide</p>
      </div>`;
  } else {
    cart.forEach((item, idx) => {
      total += item.total;
      const cfg = watchConfigurations[item.type];
      let cfgHtml = '';
      Object.entries(item.elements).forEach(([cat, key]) => {
        const opt = cfg[cat]?.[key];
        if (!opt) return;
        cfgHtml += `<div><strong>${capitalize(cat)} :</strong> ${opt.name} — ${opt.price.toLocaleString('fr-FR')} €</div>`;
      });
      container.innerHTML += `
        <div class="km-cart-item">
          <img src="${item.image}" class="km-cart-item-img" alt="${item.type}"/>
          <div>
            <div class="km-cart-item-title">${item.type.toUpperCase()}</div>
            <div class="km-cart-item-config">${cfgHtml}</div>
            <div class="km-cart-item-price">${item.total.toLocaleString('fr-FR')} €</div>
          </div>
          <button class="km-cart-item-del" onclick="removeCartItem(${idx})" title="Supprimer">
            <i class="fas fa-trash"></i>
          </button>
        </div>`;
    });
  }

  const totalEl = document.getElementById('cartTotal');
  if (totalEl) totalEl.textContent = total.toLocaleString('fr-FR') + ' €';
  openModal('cartModal');
}

function removeCartItem(idx) {
  cart.splice(idx, 1);
  saveCart();
  updateCartBadge();
  openCart();
}

/* ── STRIPE CHECKOUT (URL CORRIGÉE) ────────────────────────── */
async function goToPayment() {
  if (!cart?.length) { showToast('Votre panier est vide.'); return; }

  const user          = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
  const customerEmail = user?.email || null;
  const customerName  = user?.user_metadata?.full_name || null;

  const btn = document.querySelector('.km-checkout-btn');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Redirection…'; }

  try {
    // ✅ FIX: utilise STRIPE_API qui contient l'URL complète
    const res  = await fetch(STRIPE_API, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        cartItems: cart,
        origin:    window.location.origin,
        customerEmail,
        customerName
      })
    });

    // Essaie de parser même en cas d'erreur HTTP
    let data = {};
    try { data = await res.json(); } catch { /* ignore */ }

    if (!res.ok || !data.url) {
      const msg = data.error || `HTTP ${res.status}`;
      showToast(`❌ Erreur paiement : ${msg}`);
      if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-lock"></i> Passer commande'; }
      return;
    }

    window.location.href = data.url;

  } catch (e) {
    console.error('[Stripe]', e);
    showToast('❌ Impossible de contacter le serveur. Vérifiez votre connexion.');
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-lock"></i> Passer commande'; }
  }
}

/* ── ANTI-SPAM ──────────────────────────────────────────────── */
const ORDER_DELAY = 12 * 3600 * 1000;

function getOrderMap() { try { return JSON.parse(localStorage.getItem('orderRateMap') || '{}'); } catch { return {}; } }
function canPlaceOrder(email) { return (Date.now() - (getOrderMap()[email] || 0)) >= ORDER_DELAY; }
function recordOrder(email)   { const m = getOrderMap(); m[email] = Date.now(); localStorage.setItem('orderRateMap', JSON.stringify(m)); }
function remainingDelayMs(email) { return Math.max(0, ORDER_DELAY - (Date.now() - (getOrderMap()[email] || 0))); }

function showOrderWarning(msg) {
  let box = document.getElementById('orderWarning');
  if (!box) { box = document.createElement('div'); box.id = 'orderWarning'; document.body.appendChild(box); }
  box.innerHTML = `
    <div style="position:fixed;inset:0;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;z-index:99999;">
      <div style="background:#fff;padding:28px 32px;border-radius:16px;box-shadow:0 12px 40px rgba(0,0,0,.22);max-width:500px;text-align:center;">
        <div style="font-weight:700;color:#e74c3c;font-size:1.1rem;margin-bottom:10px;">⚠️ Action non autorisée</div>
        <div style="color:#b0352c;font-weight:500;font-size:0.95rem;">${msg}</div>
        <button onclick="this.closest('div').parentElement.parentElement.innerHTML=''" style="margin-top:16px;padding:10px 22px;border:none;border-radius:10px;background:#1a1a1a;color:#fff;font-weight:600;cursor:pointer;">Fermer</button>
      </div>
    </div>`;
}

/* Nettoyage anciennes clés */
localStorage.removeItem('lastOrderEmail');
localStorage.removeItem('lastOrderTime');

/* ── STATE ──────────────────────────────────────────────────── */
let lastWatchImage   = null;
let currentWatchType = null;
let selectedOptions  = { carrure: null, cadran: null, aiguilles: null, bracelet: null, fond: null, remontoir: null };

/* ── DATA ───────────────────────────────────────────────────── */
const watchConfigurations = {
  santos: {
    name: 'Seiko Mod Santos', basePrice: 0,
    mouvementFixe: 'Mouvement Automatique Japonais SEIKO NH35',
    carrure: {
      acier:     { name: 'Argent',                  price: 70, image: './images/santos/carrure-acier.png',      watchImage: './images/santos/montre-acier.png',       braceletMode: 'included' },
      or_jaune:  { name: 'Gold',                    price: 80, image: './images/santos/carrure-or.png',         watchImage: './images/santos/montre-or.png',          braceletMode: 'included' },
      acier_or:  { name: 'Or Rose',                 price: 70, image: './images/santos/carrure-rose.png',       watchImage: './images/santos/montre-rose.png',        braceletMode: 'included' },
      or_rose:   { name: 'Black',                   price: 70, image: './images/santos/carrure-noir.png',       watchImage: './images/santos/montre-noir.png',        braceletMode: 'included' },
      or_bleu:   { name: 'Bleu',                    price: 80, image: './images/santos/carrure-bleu.png',       watchImage: './images/santos/montre-bleu.png',        braceletMode: 'included' },
      mi_bleu:   { name: 'Mi-Bleu',                 price: 80, image: './images/santos/mi-bleu.png',            watchImage: './images/santos/mi-bleu-montre.png',     braceletMode: 'included' },
      mi_noir:   { name: 'Mi-Noir',                 price: 80, image: './images/santos/mi-noir.png',            watchImage: './images/santos/mi-noir-montre.png',     braceletMode: 'included' },
      mi_rose:   { name: 'Mi-Rose',                 price: 80, image: './images/santos/mi-rose.png',            watchImage: './images/santos/mi-rose-montre.png',     braceletMode: 'included' },
      mi_or:     { name: 'Mi-Or',                   price: 80, image: './images/santos/mi-or.png',              watchImage: './images/santos/mi-or-montre.png',       braceletMode: 'included' },
      acierno1:  { name: 'Argent Sans Bracelet',    price: 60, image: './images/santos/carrure-acier-no1.png',  watchImage: './images/santos/carrure-acier-no1.png',  braceletMode: 'free' },
      acierno2:  { name: 'Noir Sans Bracelet',      price: 60, image: './images/santos/carrure-acier-no2.png',  watchImage: './images/santos/carrure-acier-no2.png',  braceletMode: 'free' },
      acierno20: { name: 'Noir Sans Bracelet #2',   price: 60, image: './images/santos/carrure-acier-no20.png', watchImage: './images/santos/carrure-acier-no20.png', braceletMode: 'free' },
      acierno3:  { name: 'Or Sans Bracelet',        price: 60, image: './images/santos/carrure-acier-no3.png',  watchImage: './images/santos/carrure-acier-no3.png',  braceletMode: 'free' },
      acierno4:  { name: 'Or Sans Bracelet #2',     price: 60, image: './images/santos/carrure-acier-no4.png',  watchImage: './images/santos/carrure-acier-no4.png',  braceletMode: 'free' },
      acierno5:  { name: 'Or Sans Bracelet #3',     price: 60, image: './images/santos/carrure-acier-no5.png',  watchImage: './images/santos/carrure-acier-no5.png',  braceletMode: 'free' },
      acierno6:  { name: 'Or Sans Bracelet #4',     price: 60, image: './images/santos/carrure-acier-no6.png',  watchImage: './images/santos/carrure-acier-no6.png',  braceletMode: 'free' },
      acierno7:  { name: 'Or Sans Bracelet #5',     price: 60, image: './images/santos/carrure-acier-no7.png',  watchImage: './images/santos/carrure-acier-no7.png',  braceletMode: 'free' },
      acierno8:  { name: 'Or Sans Bracelet #6',     price: 60, image: './images/santos/carrure-acier-no8.png',  watchImage: './images/santos/carrure-acier-no8.png',  braceletMode: 'free' },
    },
    cadran: {
      blanc_romain:  { name: 'Blanc Chiffres Romains',  price: 25, image: './images/santos/cadran-blanc-romain.png'  },
      noir_romain:   { name: 'Noir Chiffres Romains',   price: 30, image: './images/santos/cadran-noir-romain.png'   },
      bleu_romain:   { name: 'Bleu Chiffres Romains',   price: 30, image: './images/santos/cadran-bleu-romain.png'   },
      marron_romain: { name: 'Marron Chiffres Romains', price: 30, image: './images/santos/cadran-marron-romain.png' },
      vert_romain:   { name: 'Vert Chiffres Romains',   price: 30, image: './images/santos/cadran-vert-romain.png'   },
      time_is_money: { name: 'Time Is Money',           price: 30, image: './images/santos/money.png'                },
    },
    aiguilles: {
      baton_luminova:           { name: 'Noir Phospho.',      price: 10,  image: './images/nautilus/aiguilles1.png' },
      baton_or_rose:            { name: 'Argenté Phospho.',   price: 10,  image: './images/nautilus/aiguilles2.png' },
      baton_or_blanc:           { name: 'Gold Phospho.',      price: 10,  image: './images/nautilus/aiguilles3.png' },
      baton_platine:            { name: 'Or Rose Phospho.',   price: 10,  image: './images/nautilus/aiguilles4.png' },
      argent_phosphorescente:   { name: 'Argent Phospho.',    price: 150, image: './images/santos/aiguilles-argent-phosphorescente.png'   },
      gold_phosphorescente:     { name: 'Gold Phospho.',      price: 150, image: './images/santos/aiguilles-gold-phosphorescente.png'     },
      rouge_phosphorescente:    { name: 'Rouge Phospho.',     price: 300, image: './images/santos/aiguilles-rouge-phosphorescente.png'    },
      violette_phosphorescente: { name: 'Violette Phospho.',  price: 250, image: './images/santos/aiguilles-violette-phosphorescente.png' },
    },
    bracelet: {
      integrate_acier:   { name: 'Déjà Inclus',               price: 0,  image: './images/santos/inclus.png'               },
      bracelet_plastique:  { name: 'Plastique Bleu',          price: 25, image: './images/santos/bracelet1.png'             },
      bracelet_plastique2: { name: 'Plastique Noir',          price: 25, image: './images/santos/bracelet2.png'             },
      bracelet_cuire01:  { name: 'Cuir Marron Boucle Arg.',   price: 25, image: './images/santos/bracelet01.png'            },
      bracelet_cuire02:  { name: 'Cuir Marron Boucle Arg. 2', price: 25, image: './images/santos/bracelet02.png'            },
      bracelet_cuire03:  { name: 'Cuir Marron Boucle Arg. 3', price: 25, image: './images/santos/bracelet03.png'            },
      bracelet_cuire04:  { name: 'Cuir Marron Boucle Arg. 4', price: 25, image: './images/santos/bracelet04.png'            },
      bracelet_cuire1:   { name: 'Cuir Marron Boucle Arg. 5', price: 25, image: './images/santos/bracelet-cuire1.png'       },
      bracelet_cuire100: { name: 'Cuir Marron Boucle Doré',   price: 25, image: './images/santos/bracelet-cuire100.png'     },
      bracelet_cuire101: { name: 'Cuir Marron Boucle Noir',   price: 25, image: './images/santos/bracelet-cuire101.png'     },
      bracelet_cuire2:   { name: 'Cuir Noir Boucle Arg.',     price: 25, image: './images/santos/bracelet-cuire2.png'       },
      bracelet_cuire3:   { name: 'Cuir Noir Boucle Doré',     price: 25, image: './images/santos/bracelet-cuire3.png'       },
      bracelet_cuire4:   { name: 'Cuir Noir Boucle Noir',     price: 25, image: './images/santos/bracelet-cuire4.png'       },
      bracelet_cuire5:   { name: 'Cuir Brun Foncé Boucle Arg.', price: 25, image: './images/santos/bracelet-cuire5.png'    },
      bracelet_cuire6:   { name: 'Cuir Brun Foncé Boucle Doré', price: 25, image: './images/santos/bracelet-cuire6.png'    },
      bracelet_cuire7:   { name: 'Cuir Brun Foncé Boucle Noir', price: 25, image: './images/santos/bracelet-cuire7.png'    },
    },
    fond: {
      plein_cannele: { name: 'Classique',             price: 0,  image: './images/datejust/classique_rotor.png' },
      rotor1:        { name: 'Texturé Argent',         price: 25, image: './images/nautilus/rotor1.png'          },
      rotor2:        { name: 'Texturé Gold',           price: 25, image: './images/nautilus/rotor2.png'          },
      rotor3:        { name: 'Texturé Fade',           price: 25, image: './images/nautilus/rotor3.png'          },
      rotor5:        { name: 'Dragon Japonais Argent', price: 25, image: './images/nautilus/rotor5.png'          },
      rotor6:        { name: 'Dragon Japonais Gold',   price: 25, image: './images/nautilus/rotor6.png'          },
      rotor7:        { name: 'Dragon Japonais Bleu',   price: 25, image: './images/nautilus/rotor7.png'          },
      rotor4:        { name: 'Or Rose',                price: 25, image: './images/nautilus/rotor4.png'          },
      rotor8:        { name: 'Rotor Fade',             price: 25, image: './images/nautilus/rotor8.png'          },
      rotor9:        { name: 'Rotor Gold',             price: 25, image: './images/nautilus/rotor9.png'          },
    },
    remontoir: {
      non_selectionner: { name: 'Manuel Classique',     price: 0,  image: './images/santos/inclus.png'      },
      automatique:      { name: 'Automatique SEIKO',    price: 80, image: './images/santos/remontoir1.png'  },
    }
  },

  datejust: {
    name: 'Datejust 41', basePrice: 0,
    mouvementFixe: 'Mouvement Automatique Calibre NH35',
    carrure: {
      carrure1:          { name: 'Acier Oyster',       price: 69.99, image: './images/datejust/carrure1.png',          watchImage: './images/datejust/carrure1.png',          braceletMode: 'free'     },
      carrure2:          { name: 'Acier Oyster #2',    price: 69.99, image: './images/datejust/carrure2.png',          watchImage: './images/datejust/carrure2.png',          braceletMode: 'free'     },
      carrure3:          { name: 'Acier Oyster #3',    price: 69.99, image: './images/datejust/carrure3.png',          watchImage: './images/datejust/carrure3.png',          braceletMode: 'free'     },
      carrure4:          { name: 'Acier Oyster #4',    price: 69.99, image: './images/datejust/carrure4.png',          watchImage: './images/datejust/carrure4.png',          braceletMode: 'free'     },
      carrure5:          { name: 'Acier Oyster #5',    price: 69.99, image: './images/datejust/carrure5.png',          watchImage: './images/datejust/carrure5.png',          braceletMode: 'free'     },
      carrure6:          { name: 'Acier Oyster #6',    price: 69.99, image: './images/datejust/carrure6.png',          watchImage: './images/datejust/carrure6.png',          braceletMode: 'free'     },
      carrure7:          { name: 'Acier Oyster #7',    price: 69.99, image: './images/datejust/carrure7.png',          watchImage: './images/datejust/carrure7.png',          braceletMode: 'free'     },
      carrure8:          { name: 'Acier Oyster #8',    price: 69.99, image: './images/datejust/carrure8.png',          watchImage: './images/datejust/carrure8.png',          braceletMode: 'free'     },
      carrure9:          { name: 'Acier Oyster #9',    price: 69.99, image: './images/datejust/carrure9.png',          watchImage: './images/datejust/carrure9.png',          braceletMode: 'free'     },
      carrure_complete1: { name: 'Acier Oyster Complet', price: 69.99, image: './images/datejust/carrure-complete1.png', watchImage: './images/datejust/carrure-complete1.png', braceletMode: 'included' },
    },
    cadran: {
      dial1:  { name: 'Nacre Diamants #1',  price: 29.99, image: './images/datejust/dial1.png'  },
      dial2:  { name: 'Nacre Diamants #2',  price: 29.99, image: './images/datejust/dial2.png'  },
      dial3:  { name: 'Nacre Diamants #3',  price: 29.99, image: './images/datejust/dial3.png'  },
      dial4:  { name: 'Nacre Diamants #4',  price: 29.99, image: './images/datejust/dial4.png'  },
      dial5:  { name: 'Nacre Diamants #5',  price: 29.99, image: './images/datejust/dial5.png'  },
      dial6:  { name: 'Nacre Diamants #6',  price: 29.99, image: './images/datejust/dial6.png'  },
      dial7:  { name: 'Nacre Diamants #7',  price: 29.99, image: './images/datejust/dial7.png'  },
      dial8:  { name: 'Nacre Diamants #8',  price: 29.99, image: './images/datejust/dial8.png'  },
      dial9:  { name: 'Nacre Diamants #9',  price: 29.99, image: './images/datejust/dial9.png'  },
      dial10: { name: 'Nacre Diamants #10', price: 29.99, image: './images/datejust/dial10.png' },
      dial11: { name: 'Nacre Diamants #11', price: 29.99, image: './images/datejust/dial11.png' },
      dial12: { name: 'Nacre Diamants #12', price: 29.99, image: './images/datejust/dial12.png' },
    },
    aiguilles: {
      baton_luminova:           { name: 'Noir Phospho.',    price: 14.99, image: './images/nautilus/aiguilles1.png' },
      baton_or_rose:            { name: 'Argenté Phospho.', price: 14.99, image: './images/nautilus/aiguilles2.png' },
      baton_or_blanc:           { name: 'Gold Phospho.',    price: 14.99, image: './images/nautilus/aiguilles3.png' },
      baton_platine:            { name: 'Or Rose Phospho.', price: 14.99, image: './images/nautilus/aiguilles4.png' },
      argent_phosphorescente:   { name: 'Argent Phospho.',  price: 14.99, image: './images/santos/aiguilles-argent-phosphorescente.png'   },
      gold_phosphorescente:     { name: 'Gold Phospho.',    price: 14.99, image: './images/santos/aiguilles-gold-phosphorescente.png'     },
      rouge_phosphorescente:    { name: 'Rouge Phospho.',   price: 14.99, image: './images/santos/aiguilles-rouge-phosphorescente.png'    },
      violette_phosphorescente: { name: 'Violette Phospho.', price: 14.99, image: './images/santos/aiguilles-violette-phosphorescente.png' },
    },
    bracelet: {
      integrate_acier:      { name: 'Déjà Inclus',         price: 0,  image: './images/santos/inclus.png'                        },
      oyster_argent:        { name: 'Oyster Argent',        price: 50, image: './images/datejust/bracelet-argent-datejust.png'    },
      oyster_gold:          { name: 'Oyster Gold',          price: 50, image: './images/datejust/bracelet-gold-datejust.png'      },
      oyster_argent_rose:   { name: 'Oyster Argent & Rose', price: 50, image: './images/datejust/bracelet-argent-rose.png'        },
      oyster_gold_argent:   { name: 'Oyster Gold & Argent', price: 50, image: './images/datejust/bracelet-gold-silver.png'        },
      oyster_rose:          { name: 'Oyster Rose',          price: 50, image: './images/datejust/bracelet-rose.png'               },
      oyster_noir:          { name: 'Black',                price: 50, image: './images/datejust/bracelet-noir.png'               },
    },
    fond: {
      plein_cannele: { name: 'Classique',             price: 0,  image: './images/datejust/classique_rotor.png' },
      rotor1:        { name: 'Texturé Argent',         price: 25, image: './images/nautilus/rotor1.png'          },
      rotor2:        { name: 'Texturé Gold',           price: 25, image: './images/nautilus/rotor2.png'          },
      rotor3:        { name: 'Texturé Fade',           price: 25, image: './images/nautilus/rotor3.png'          },
      rotor4:        { name: 'Or Rose',                price: 25, image: './images/nautilus/rotor4.png'          },
      rotor5:        { name: 'Dragon Japonais Argent', price: 25, image: './images/nautilus/rotor5.png'          },
      rotor6:        { name: 'Dragon Japonais Gold',   price: 25, image: './images/nautilus/rotor6.png'          },
      rotor7:        { name: 'Dragon Japonais Bleu',   price: 25, image: './images/nautilus/rotor7.png'          },
      rotor8:        { name: 'Rotor Fade',             price: 25, image: './images/nautilus/rotor8.png'          },
      rotor9:        { name: 'Rotor Gold',             price: 25, image: './images/nautilus/rotor9.png'          },
    },
    remontoir: {
      non_selectionner: { name: 'Manuel Classique',  price: 0,  image: './images/santos/inclus.png'     },
      automatique:      { name: 'Automatique SEIKO', price: 80, image: './images/santos/remontoir1.png' },
    }
  },

  nautilus: {
    name: 'Nautilus Seiko Mod', basePrice: 0,
    mouvementFixe: 'Mouvement Automatique Japonais NH35',
    carrure: {
      acier: { name: 'Acier Inoxydable', price: 69.99, image: './images/nautilus/carrure-acier.png', watchImage: './images/nautilus/carrure-acier.png' },
      or:    { name: 'Gold',             price: 69.99, image: './images/nautilus/carrure-gold.png',  watchImage: './images/nautilus/carrure-gold.png'  },
      rose:  { name: 'Rose',             price: 69.99, image: './images/nautilus/carrure-rose.png',  watchImage: './images/nautilus/carrure-rose.png'  },
      noir:  { name: 'Black',            price: 69.99, image: './images/nautilus/carrure-noir.png',  watchImage: './images/nautilus/carrure-noir.png'  },
    },
    cadran: {
      candran1: { name: 'Blanc Nacré — Argent',   price: 40, image: './images/nautilus/cadran2.png' },
      blanc:    { name: 'Blanc Nacré — Or Rose',  price: 40, image: './images/nautilus/cadran1.png' },
      rose:     { name: 'Rose Y2K',               price: 40, image: './images/nautilus/cadran3.png' },
      fade:     { name: 'Pink Blue Fade',          price: 40, image: './images/nautilus/cadran4.png' },
      vert:     { name: 'Vert Fade',              price: 40, image: './images/nautilus/cadran5.png' },
      noir:     { name: 'Noir Sombre',            price: 40, image: './images/nautilus/cadran6.png' },
      tropical: { name: 'Bleu Tropical',          price: 40, image: './images/nautilus/cadran7.png' },
      rouge:    { name: 'Rouge & Noir Fade',      price: 40, image: './images/nautilus/cadran8.png' },
      Bleu:     { name: 'Bleu Marine',            price: 40, image: './images/nautilus/cadran9.png' },
    },
    aiguilles: {
      baton_luminova: { name: 'Noir Phospho.',      price: 14.99, image: './images/nautilus/aiguilles1.png' },
      baton_or_rose:  { name: 'Argenté Phospho.',   price: 14.99, image: './images/nautilus/aiguilles2.png' },
      baton_or_blanc: { name: 'Gold Phospho.',      price: 14.99, image: './images/nautilus/aiguilles3.png' },
      baton_platine:  { name: 'Or Rose Phospho.',   price: 14.99, image: './images/nautilus/aiguilles4.png' },
      aiguilles:      { name: 'Argent Phospho.',    price: 14.99, image: './images/nautilus/aiguilles5.png' },
      aiguilles6:     { name: 'Gold Phospho. #2',   price: 14.99, image: './images/nautilus/aiguilles6.png' },
      aiguilles7:     { name: 'Violette Phospho.',  price: 14.99, image: './images/nautilus/aiguilles7.png' },
      aiguilles8:     { name: 'Rouge Phospho.',     price: 14.99, image: './images/nautilus/aiguilles8.png' },
    },
    bracelet: {
      integrate_acier: { name: 'Déjà Inclus', price: 0, image: './images/nautilus/inclus.png' },
    },
    fond: {
      saphir_pp: { name: 'Rotor de base',          price: 0,  image: './images/nautilus/classique_rotor.png' },
      rotor1:    { name: 'Texturé Argent',          price: 25, image: './images/nautilus/rotor1.png'          },
      rotor2:    { name: 'Texturé Gold',            price: 25, image: './images/nautilus/rotor2.png'          },
      rotor3:    { name: 'Texturé Fade',            price: 25, image: './images/nautilus/rotor3.png'          },
      rotor4:    { name: 'Or Rose',                 price: 25, image: './images/nautilus/rotor4.png'          },
      rotor5:    { name: 'Dragon Japonais Argent',  price: 25, image: './images/nautilus/rotor5.png'          },
      rotor6:    { name: 'Dragon Japonais Gold',    price: 25, image: './images/nautilus/rotor6.png'          },
      rotor7:    { name: 'Dragon Japonais Bleu',    price: 25, image: './images/nautilus/rotor7.png'          },
      rotor8:    { name: 'Rotor Fade',              price: 25, image: './images/nautilus/rotor8.png'          },
      rotor9:    { name: 'Rotor Gold',              price: 25, image: './images/nautilus/rotor9.png'          },
    },
    remontoir: {
      non_selectionner: { name: 'Manuel Classique',  price: 0,  image: './images/santos/inclus.png'     },
      automatique:      { name: 'Automatique SEIKO', price: 80, image: './images/santos/remontoir1.png' },
    }
  }
};

/* ── BOOTSTRAP ──────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  currentWatchType = null;
  const grid = document.getElementById('mainGrid');
  if (grid) { grid.style.opacity = '0'; grid.style.pointerEvents = 'none'; }
  document.querySelectorAll('.km-tab').forEach(b => b.classList.remove('active'));

  updateCartBadge();

  // Navbar scroll
  const nav = document.getElementById('mainNav');
  if (nav) window.addEventListener('scroll', () => nav.classList.toggle('scrolled', window.scrollY > 20));

  // ESC close modals
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') document.querySelectorAll('.km-modal.show').forEach(m => m.classList.remove('show'));
  });

  // Backdrop close
  document.querySelectorAll('.km-modal').forEach(m => {
    m.addEventListener('click', e => { if (e.target === m) m.classList.remove('show'); });
  });

  // Page transitions
  document.querySelectorAll('a').forEach(link => {
    const href = link.getAttribute('href');
    if (href && !href.startsWith('#') && !link.hasAttribute('onclick')) {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        document.body.classList.add('fade-out');
        setTimeout(() => { window.location = this.href; }, 360);
      });
    }
  });
});

window.addEventListener('pageshow', e => { if (e.persisted) window.location.reload(); });

/* ── CATEGORIES ─────────────────────────────────────────────── */
const ALL_CATS = ['carrure','cadran','aiguilles','bracelet','fond','remontoir'];

function getRequiredCategories() {
  const cfg = watchConfigurations[currentWatchType];
  return ALL_CATS.filter(cat => cfg[cat] && Object.keys(cfg[cat]).length > 0);
}

function toggleGroupsVisibility() {
  const cfg = watchConfigurations[currentWatchType];
  ALL_CATS.forEach(cat => {
    const g = document.getElementById(`group-${cat}`);
    if (!g) return;
    g.classList.toggle('hidden', !(cfg[cat] && Object.keys(cfg[cat]).length > 0));
  });
}

/* ── SWITCH MODEL ───────────────────────────────────────────── */
function switchWatchType(type) {
  if (!watchConfigurations[type]) return;
  currentWatchType = type;

  document.querySelectorAll('.km-tab').forEach(b => b.classList.toggle('active', b.dataset.watch === type));
  const hint = document.getElementById('chooseModelHint');
  if (hint) hint.style.display = 'none';

  const grid = document.getElementById('mainGrid');
  if (grid) { grid.style.opacity = '0'; grid.style.pointerEvents = 'none'; setTimeout(() => { grid.style.opacity = '1'; grid.style.pointerEvents = 'auto'; }, 80); }

  updateConfigurationOptions(type);
  updateOrderButtonState();

  const img = document.getElementById('watchImage');
  if (img) { img.classList.remove('show'); img.src = ''; }
  const ph = document.getElementById('placeholderText');
  if (ph) ph.style.display = 'flex';
  lastWatchImage = null;
}

/* ── BUILD OPTIONS ──────────────────────────────────────────── */
function updateConfigurationOptions(type) {
  currentWatchType = type;
  const cfg = watchConfigurations[type];
  selectedOptions = { carrure: null, cadran: null, aiguilles: null, bracelet: null, fond: null, remontoir: null };

  ALL_CATS.forEach(cat => {
    const nEl = document.getElementById(`${cat}Name`);
    const pEl = document.getElementById(`${cat}Price`);
    if (nEl) nEl.textContent = '—';
    if (pEl) pEl.textContent = '0 €';
  });

  generateVisualOptions('carrure',   cfg.carrure);
  generateVisualOptions('cadran',    cfg.cadran);
  generateVisualOptions('aiguilles', cfg.aiguilles);
  generateVisualOptions('bracelet',  cfg.bracelet);
  generateVisualOptions('fond',      cfg.fond);
  generateVisualOptions('remontoir', cfg.remontoir);
  toggleGroupsVisibility();
  updateTotalPriceDisplay();
  updateProgress();

  const preview = document.getElementById('selectedComponentsPreview');
  if (preview) preview.innerHTML = '';

  // Scroll config back to top
  const scroll = document.getElementById('configScroll');
  if (scroll) scroll.scrollTop = 0;
}

function generateVisualOptions(category, options) {
  const cont = document.getElementById(`${category}Options`);
  if (!cont) return;
  cont.innerHTML = '';
  if (!options || !Object.keys(options).length) return;

  let delay = 0;
  Object.keys(options).forEach(key => {
    const opt = options[key];
    const div = document.createElement('div');
    div.className = 'km-opt';
    div.dataset.category = category; div.dataset.key = key;
    div.style.animationDelay = `${delay}ms`; delay += 25;

    const fb = encodeURIComponent((opt.name || '').slice(0,3));
    div.innerHTML = `
      <img class="km-opt-img" src="${opt.image}" alt="${opt.name}"
        onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Crect fill=%22%23f0f0f0%22 width=%22100%22 height=%22100%22/%3E%3Ctext x=%2250%25%22 y=%2255%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22%23bbb%22 font-size=%2218%22 font-family=%22Arial%22%3E${fb}%3C/text%3E%3C/svg%3E'"/>
      <div class="km-opt-name">${opt.name}</div>
      <div class="km-opt-price">${opt.price.toLocaleString('fr-FR')} €</div>`;

    div.addEventListener('click', () => selectOption(category, key));
    cont.appendChild(div);
  });
}

/* ── SELECT OPTION ──────────────────────────────────────────── */
function selectOption(category, key) {
  selectedOptions[category] = key;
  if (category === 'carrure') applyBraceletRulesFromCarrure();

  const cont = document.getElementById(`${category}Options`);
  if (cont) cont.querySelectorAll('.km-opt').forEach(o => o.classList.toggle('active', o.dataset.key === key));

  const opt  = watchConfigurations[currentWatchType][category][key];
  const nEl  = document.getElementById(`${category}Name`);
  const pEl  = document.getElementById(`${category}Price`);
  if (nEl) nEl.textContent = opt.name;
  if (pEl) pEl.textContent = `${opt.price.toLocaleString('fr-FR')} €`;

  updateWatch();
  updateSelectedComponentsDisplay();
  updateOrderButtonState();
  updateProgress();
  saveConfiguration();
  updateTotalPriceDisplay();
}

/* ── WATCH IMAGE ────────────────────────────────────────────── */
function updateWatch() {
  const cfg = watchConfigurations[currentWatchType];
  const img = document.getElementById('watchImage');
  const ph  = document.getElementById('placeholderText');

  if (!selectedOptions.carrure) {
    img.classList.remove('show'); img.style.display = 'none';
    ph.style.display = 'flex'; lastWatchImage = null; return;
  }

  const src = cfg.carrure[selectedOptions.carrure].watchImage;
  if (src === lastWatchImage) { img.src = src; return; }
  lastWatchImage = src;
  img.classList.remove('show');
  setTimeout(() => {
    img.src = src; img.style.display = 'block'; ph.style.display = 'none';
    setTimeout(() => img.classList.add('show'), 20);
  }, 130);

  updateTotalPriceDisplay();
}

/* ── PRICE ──────────────────────────────────────────────────── */
function calculateTotalPrice() {
  if (!currentWatchType) return 0;
  const cfg = watchConfigurations[currentWatchType];
  let total = 0;
  for (const cat in selectedOptions) {
    const key = selectedOptions[cat];
    if (!key) continue;
    const opt = cfg[cat]?.[key];
    if (opt?.price) total += opt.price;
  }
  return total;
}

function updateTotalPriceDisplay() {
  const el = document.getElementById('totalPrice');
  if (el) el.textContent = calculateTotalPrice().toLocaleString('fr-FR') + ' €';
}

/* ── COMPONENTS PREVIEW ─────────────────────────────────────── */
function updateSelectedComponentsDisplay() {
  const preview = document.getElementById('selectedComponentsPreview');
  if (!preview) return;
  preview.innerHTML = '';
  const cfg = watchConfigurations[currentWatchType];

  getRequiredCategories().forEach(cat => {
    const key = selectedOptions[cat];
    if (!key) return;
    const data = cfg[cat][key];
    const item = document.createElement('div');
    item.className = 'km-preview-item';
    item.innerHTML = `<img src="${data.image}" alt="${data.name}"/><span>${capitalize(cat)}</span>`;
    item.addEventListener('click', () => {
      document.getElementById('modalImage').src             = data.image;
      document.getElementById('modalName').textContent      = data.name;
      document.getElementById('modalPrice').textContent     = `${data.price.toLocaleString('fr-FR')} €`;
      openModal('imageModal');
    });
    preview.appendChild(item);
  });
}

/* ── BRACELET RULES ─────────────────────────────────────────── */
function applyBraceletRulesFromCarrure() {
  const cfg = watchConfigurations[currentWatchType];
  if (!cfg?.carrure || !cfg?.bracelet) return;
  const carrureKey = selectedOptions.carrure;
  if (!carrureKey) return;
  const carrure = cfg.carrure[carrureKey];
  const INC_KEY = 'integrate_acier';

  if (carrure.braceletMode === 'free') {
    const filtered = {};
    for (const k in cfg.bracelet) { if (k !== INC_KEY) filtered[k] = cfg.bracelet[k]; }
    generateVisualOptions('bracelet', filtered);
    selectedOptions.bracelet = null;
    return;
  }

  generateVisualOptions('bracelet', cfg.bracelet);
  const cont = document.getElementById('braceletOptions');
  if (cont) cont.querySelectorAll('.km-opt').forEach(o => { if (o.dataset.key !== INC_KEY) o.classList.add('disabled'); });
  selectOption('bracelet', INC_KEY);
}

/* ── ORDER BUTTON STATE ─────────────────────────────────────── */
function countMissing() { return getRequiredCategories().filter(c => !selectedOptions[c]).length; }

function updateOrderButtonState() {
  const missing = countMissing();
  ['addToCartBtn','addToCartBtnMobile'].forEach((id, i) => {
    const btn  = document.getElementById(id);
    const text = document.getElementById(i === 0 ? 'orderBtnText' : 'orderBtnTextMobile');
    if (!btn) return;
    btn.disabled  = missing > 0;
    if (text) text.textContent = missing === 0
      ? 'Ajouter au panier'
      : `${missing} élément${missing > 1 ? 's' : ''} à choisir`;
  });
}

/* ── STORAGE ────────────────────────────────────────────────── */
function saveConfiguration() {
  localStorage.setItem('lastWatchConfig', JSON.stringify({ type: currentWatchType, options: selectedOptions }));
}

/* ── MODALS ─────────────────────────────────────────────────── */
function openModal(id) {
  const m = document.getElementById(id);
  if (!m) return;
  m.classList.add('show');
  m.setAttribute('aria-hidden', 'false');
}

function closeModal(id) {
  const m = document.getElementById(id);
  if (!m) return;
  m.classList.remove('show');
  m.setAttribute('aria-hidden', 'true');
}

/* ── TOAST ──────────────────────────────────────────────────── */
function showToast(msg, dur = 3200) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), dur);
}

/* ── UTILS ──────────────────────────────────────────────────── */
function capitalize(s) { return (s || '').charAt(0).toUpperCase() + (s || '').slice(1); }
