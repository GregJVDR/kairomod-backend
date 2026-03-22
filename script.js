/* ============================================================
   KAÏROMOD — SCRIPT.JS — REDESIGN 2025
   ============================================================ */

/* ============================================================
   EMAILJS CONFIG
   ============================================================ */
const EMAILJS_CONFIG = {
  service_id:  'service_0d32xia',
  template_id: 'template_kg3nlue',
  user_id:     '8i4pazbrex7-Ut2e2'
};

/* ============================================================
   CART — LocalStorage
   ============================================================ */
let cart = JSON.parse(localStorage.getItem('cartItems') || '[]');

function saveCart() {
  localStorage.setItem('cartItems', JSON.stringify(cart));
}

/* ============================================================
   CART BADGE
   ============================================================ */
function updateCartBadge() {
  const badge  = document.getElementById('cartBadge');
  if (!badge) return;
  const count = cart.length;
  badge.textContent = count;
  badge.style.display = count > 0 ? 'flex' : 'none';
}

/* ============================================================
   ADD TO CART + ANIMATION
   ============================================================ */
function addToCart() {
  const required = getRequiredCategories();
  for (let r of required) {
    if (!selectedOptions[r]) {
      showToast('⚠️ Veuillez sélectionner toutes les options.');
      return;
    }
  }

  const selectedConfig = {
    type:     currentWatchType,
    elements: { ...selectedOptions },
    total:    calculateTotalPrice(),
    image:    document.getElementById('watchImage').src,
    date:     new Date().toISOString()
  };

  cart.push(selectedConfig);
  saveCart();
  updateCartBadge();

  // Animation fly-to-cart
  flyToCartAnimation();

  // Button feedback
  const btnDesktop = document.getElementById('addToCartBtn');
  const btnMobile  = document.getElementById('addToCartBtnMobile');
  const textDesktop = document.getElementById('orderBtnText');
  const textMobile  = document.getElementById('orderBtnTextMobile');

  [btnDesktop, btnMobile].forEach(btn => {
    if (!btn) return;
    btn.classList.add('added');
  });

  if (textDesktop) textDesktop.textContent = '✓ Montre ajoutée !';
  if (textMobile)  textMobile.textContent  = '✓ Montre ajoutée !';

  setTimeout(() => {
    [btnDesktop, btnMobile].forEach(btn => {
      if (!btn) return;
      btn.classList.remove('added');
    });
    updateOrderButtonState();
  }, 2000);
}

/* ============================================================
   FLY-TO-CART ANIMATION
   ============================================================ */
function flyToCartAnimation() {
  const cartBtn   = document.querySelector('.km-cart-btn');
  const addBtn    = document.getElementById('addToCartBtn') || document.getElementById('addToCartBtnMobile');
  const flyEl     = document.getElementById('cartFlyEl');

  if (!cartBtn || !addBtn || !flyEl) {
    spawnConfetti(addBtn);
    return;
  }

  const btnRect  = addBtn.getBoundingClientRect();
  const cartRect = cartBtn.getBoundingClientRect();

  // Starting position: center of add button
  const startX = btnRect.left + btnRect.width  / 2 - 22;
  const startY = btnRect.top  + btnRect.height / 2 - 22;

  // Target: cart button
  const endX = cartRect.left + cartRect.width  / 2 - 22;
  const endY = cartRect.top  + cartRect.height / 2 - 22;

  flyEl.innerHTML = '<i class="fas fa-shopping-bag"></i>';
  flyEl.style.cssText = `left:${startX}px; top:${startY}px; opacity:1;`;
  flyEl.classList.remove('flying');

  // Force reflow
  void flyEl.offsetWidth;

  // Use JS animation for precise path
  const duration = 650;
  const startTime = performance.now();

  function animateStep(now) {
    const elapsed = now - startTime;
    const t = Math.min(elapsed / duration, 1);
    const ease = t < 0.5 ? 2*t*t : -1+(4-2*t)*t; // ease-in-out

    const x = startX + (endX - startX) * ease;
    // Arc: parabola offset
    const arc = -120 * Math.sin(Math.PI * t);
    const y = startY + (endY - startY) * ease + arc;
    const scale = 1 - 0.7 * ease;
    const opacity = t < 0.85 ? 1 : 1 - (t - 0.85) / 0.15;

    flyEl.style.left    = x + 'px';
    flyEl.style.top     = y + 'px';
    flyEl.style.transform = `scale(${scale})`;
    flyEl.style.opacity = opacity;

    if (t < 1) {
      requestAnimationFrame(animateStep);
    } else {
      flyEl.style.opacity = '0';
      // Bounce the badge
      const badge = document.getElementById('cartBadge');
      if (badge) {
        badge.style.animation = 'none';
        void badge.offsetWidth;
        badge.style.animation = 'badgePop 0.35s var(--ease)';
      }
      // Confetti burst from add button
      spawnConfetti(addBtn);
    }
  }

  requestAnimationFrame(animateStep);
}

/* ============================================================
   CONFETTI BURST
   ============================================================ */
const CONFETTI_COLORS = ['#ff7b00','#ffd700','#ff4d4d','#27ae60','#3498db'];

function spawnConfetti(anchorEl) {
  if (!anchorEl) return;
  const rect = anchorEl.getBoundingClientRect();
  const cx = rect.left + rect.width  / 2;
  const cy = rect.top  + rect.height / 2;

  for (let i = 0; i < 12; i++) {
    const dot = document.createElement('div');
    dot.className = 'km-confetti';

    const angle  = (i / 12) * Math.PI * 2;
    const dist   = 40 + Math.random() * 30;
    const dx     = Math.cos(angle) * dist;
    const dy     = Math.sin(angle) * dist;
    const color  = CONFETTI_COLORS[i % CONFETTI_COLORS.length];

    dot.style.cssText = `
      left: ${cx - 4}px;
      top:  ${cy - 4}px;
      background: ${color};
      --dx: ${dx}px;
      --dy: ${dy}px;
    `;

    document.body.appendChild(dot);
    setTimeout(() => dot.remove(), 700);
  }
}

/* ============================================================
   OPEN CART
   ============================================================ */
function openCart() {
  const container = document.getElementById('cartItemsContainer');
  if (!container) return;
  container.innerHTML = '';

  let total = 0;

  if (cart.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding:32px; color:#999; font-size:0.95rem;">
        <i class="fas fa-shopping-bag" style="font-size:2.5rem; opacity:0.2; display:block; margin-bottom:12px;"></i>
        Votre panier est vide.
      </div>`;
  } else {
    cart.forEach((item, index) => {
      total += item.total;
      const cfg = watchConfigurations[item.type];
      let configHTML = '';

      Object.entries(item.elements).forEach(([cat, key]) => {
        const opt = cfg[cat]?.[key];
        if (!opt) return;
        configHTML += `<div><strong>${capitalize(cat)} :</strong> ${opt.name} — ${opt.price.toLocaleString('fr-FR')} €</div>`;
      });

      container.innerHTML += `
        <div class="km-cart-item">
          <img src="${item.image}" class="km-cart-item-img" alt="${item.type}"/>
          <div>
            <div class="km-cart-item-title">${item.type.toUpperCase()}</div>
            <div class="km-cart-item-config">${configHTML}</div>
            <div class="km-cart-item-price">${item.total.toLocaleString('fr-FR')} €</div>
          </div>
          <button class="km-cart-item-del" onclick="removeCartItem(${index})" title="Supprimer">
            <i class="fas fa-trash"></i>
          </button>
        </div>`;
    });
  }

  const totalEl = document.getElementById('cartTotal');
  if (totalEl) totalEl.textContent = total.toLocaleString('fr-FR') + ' €';

  openModal('cartModal');
}

function removeCartItem(index) {
  cart.splice(index, 1);
  saveCart();
  updateCartBadge();
  openCart();
}

/* ============================================================
   CHECKOUT — Stripe redirect with customer info
   ============================================================ */
async function goToPayment() {
  if (!cart || cart.length === 0) {
    showToast('Votre panier est vide.');
    return;
  }

  // Get current user from auth.js (if loaded)
  const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
  const customerEmail = user?.email || null;
  const customerName  = user?.user_metadata?.full_name || null;

  const BACKEND_URL = 'https://montres-backend.vercel.app/api/create-checkout-session';
  const origin = window.location.origin;

  const btn = document.querySelector('.km-checkout-btn');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Redirection...'; }

  try {
    const res  = await fetch(BACKEND_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ cartItems: cart, origin, customerEmail, customerName })
    });
    const data = await res.json();
    if (!res.ok || !data.url) {
      showToast('Erreur paiement : ' + (data.error || 'inconnue'));
      if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-lock"></i> Passer commande'; }
      return;
    }
    window.location.href = data.url;
  } catch (e) {
    console.error(e);
    showToast('Impossible de contacter le serveur de paiement.');
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-lock"></i> Passer commande'; }
  }
}

/* ============================================================
   ANTI-SPAM
   ============================================================ */
const ORDER_DELAY_MS = 12 * 60 * 60 * 1000;

function getOrderMap() {
  try { return JSON.parse(localStorage.getItem('orderRateMap') || '{}'); }
  catch { return {}; }
}
function canPlaceOrder(email, delay = ORDER_DELAY_MS) {
  const map  = getOrderMap();
  const last = map[email] || 0;
  return (Date.now() - last) >= delay;
}
function recordOrder(email) {
  const map = getOrderMap();
  map[email] = Date.now();
  localStorage.setItem('orderRateMap', JSON.stringify(map));
}
function remainingDelayMs(email, delay = ORDER_DELAY_MS) {
  const map  = getOrderMap();
  const last = map[email] || 0;
  return Math.max(0, delay - (Date.now() - last));
}

function showOrderWarning(msg) {
  let box = document.getElementById('orderWarning');
  if (!box) { box = document.createElement('div'); box.id = 'orderWarning'; document.body.appendChild(box); }
  box.innerHTML = `
    <div style="position:fixed;inset:0;background:rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;z-index:99999;">
      <div style="background:#fff;padding:28px 32px;border-radius:16px;box-shadow:0 12px 36px rgba(0,0,0,.22);max-width:520px;text-align:center;">
        <div style="font-weight:700;color:#e74c3c;margin-bottom:8px;">⚠️ Action non autorisée</div>
        <div style="color:#b0352c;font-weight:600;">${msg}</div>
        <button id="orderWarningClose" style="margin-top:16px;padding:10px 22px;border:none;border-radius:10px;background:#1a1a1a;color:#fff;font-weight:600;cursor:pointer;">Fermer</button>
      </div>
    </div>`;
  document.getElementById('orderWarningClose').onclick = () => box.innerHTML = '';
}

localStorage.removeItem('lastOrderEmail');
localStorage.removeItem('lastOrderTime');

/* ============================================================
   GLOBAL STATE
   ============================================================ */
let lastWatchImage = null;
let currentWatchType = null;
let selectedOptions = { carrure: null, cadran: null, aiguilles: null, bracelet: null, fond: null, remontoir: null };

/* ============================================================
   WATCH DATA
   ============================================================ */
const watchConfigurations = {
  santos: {
    name: 'Seiko Mod Santos',
    basePrice: 0,
    mouvementFixe: 'Mouvement Automatique Japonais SEIKO NH35',
    carrure: {
      acier:     { name: 'Argent',            price: 70,  image: './images/santos/carrure-acier.png',   watchImage: './images/santos/montre-acier.png',  braceletMode: 'included' },
      or_jaune:  { name: 'Gold',              price: 80,  image: './images/santos/carrure-or.png',      watchImage: './images/santos/montre-or.png',     braceletMode: 'included' },
      acier_or:  { name: 'Or Rose',           price: 70,  image: './images/santos/carrure-rose.png',    watchImage: './images/santos/montre-rose.png',   braceletMode: 'included' },
      or_rose:   { name: 'Black',             price: 70,  image: './images/santos/carrure-noir.png',    watchImage: './images/santos/montre-noir.png',   braceletMode: 'included' },
      or_bleu:   { name: 'Bleu',             price: 80,  image: './images/santos/carrure-bleu.png',    watchImage: './images/santos/montre-bleu.png',   braceletMode: 'included' },
      mi_bleu:   { name: 'Bleu',             price: 80,  image: './images/santos/mi-bleu.png',         watchImage: './images/santos/mi-bleu-montre.png', braceletMode: 'included' },
      mi_noir:   { name: 'Noir',             price: 80,  image: './images/santos/mi-noir.png',         watchImage: './images/santos/mi-noir-montre.png', braceletMode: 'included' },
      mi_rose:   { name: 'Rose',             price: 80,  image: './images/santos/mi-rose.png',         watchImage: './images/santos/mi-rose-montre.png', braceletMode: 'included' },
      mi_or:     { name: 'Or',               price: 80,  image: './images/santos/mi-or.png',           watchImage: './images/santos/mi-or-montre.png',   braceletMode: 'included' },
      acierno1:  { name: 'Argent Sans Bracelet', price: 60, image: './images/santos/carrure-acier-no1.png',  watchImage: './images/santos/carrure-acier-no1.png',  braceletMode: 'free' },
      acierno2:  { name: 'Noir Sans Bracelet',   price: 60, image: './images/santos/carrure-acier-no2.png',  watchImage: './images/santos/carrure-acier-no2.png',  braceletMode: 'free' },
      acierno20: { name: 'Noir Sans Bracelet',   price: 60, image: './images/santos/carrure-acier-no20.png', watchImage: './images/santos/carrure-acier-no20.png', braceletMode: 'free' },
      acierno3:  { name: 'Or Sans Bracelet',     price: 60, image: './images/santos/carrure-acier-no3.png',  watchImage: './images/santos/carrure-acier-no3.png',  braceletMode: 'free' },
      acierno4:  { name: 'Or Sans Bracelet',     price: 60, image: './images/santos/carrure-acier-no4.png',  watchImage: './images/santos/carrure-acier-no4.png',  braceletMode: 'free' },
      acierno5:  { name: 'Or Sans Bracelet',     price: 60, image: './images/santos/carrure-acier-no5.png',  watchImage: './images/santos/carrure-acier-no5.png',  braceletMode: 'free' },
      acierno6:  { name: 'Or Sans Bracelet',     price: 60, image: './images/santos/carrure-acier-no6.png',  watchImage: './images/santos/carrure-acier-no6.png',  braceletMode: 'free' },
      acierno7:  { name: 'Or Sans Bracelet',     price: 60, image: './images/santos/carrure-acier-no7.png',  watchImage: './images/santos/carrure-acier-no7.png',  braceletMode: 'free' },
      acierno8:  { name: 'Or Sans Bracelet',     price: 60, image: './images/santos/carrure-acier-no8.png',  watchImage: './images/santos/carrure-acier-no8.png',  braceletMode: 'free' },
    },
    cadran: {
      blanc_romain:  { name: 'Blanc Argenté Chiffres Romains', price: 25, image: './images/santos/cadran-blanc-romain.png' },
      noir_romain:   { name: 'Noir Laqué Chiffres Romains',    price: 30, image: './images/santos/cadran-noir-romain.png'  },
      bleu_romain:   { name: 'Bleu Chiffres Romains',          price: 30, image: './images/santos/cadran-bleu-romain.png'  },
      marron_romain: { name: 'Marron Chiffres Romains',        price: 30, image: './images/santos/cadran-marron-romain.png'},
      vert_romain:   { name: 'Vert Chiffres Romains',          price: 30, image: './images/santos/cadran-vert-romain.png'  },
      time_is_money: { name: 'Time Is Money',                  price: 30, image: './images/santos/money.png'               }
    },
    aiguilles: {
      baton_luminova:           { name: 'Noir Phosphorescentes',      price: 10,  image: './images/nautilus/aiguilles1.png' },
      baton_or_rose:            { name: 'Argentées Phosphorescentes', price: 10,  image: './images/nautilus/aiguilles2.png' },
      baton_or_blanc:           { name: 'Gold Phosphorescentes',      price: 10,  image: './images/nautilus/aiguilles3.png' },
      baton_platine:            { name: 'Or Rose Phosphorescentes',   price: 10,  image: './images/nautilus/aiguilles4.png' },
      argent_phosphorescente:   { name: 'Argent phosphorescente',     price: 150, image: './images/santos/aiguilles-argent-phosphorescente.png'   },
      gold_phosphorescente:     { name: 'Gold phosphorescente',       price: 150, image: './images/santos/aiguilles-gold-phosphorescente.png'     },
      rouge_phosphorescente:    { name: 'Rouge phosphorescente',      price: 300, image: './images/santos/aiguilles-rouge-phosphorescente.png'    },
      violette_phosphorescente: { name: 'Violette phosphorescente',   price: 250, image: './images/santos/aiguilles-violette-phosphorescente.png' }
    },
    bracelet: {
      integrate_acier:  { name: 'Déjà Inclus',                  price: 0,  image: './images/santos/inclus.png'              },
      bracelet_plastique:  { name: 'Plastique Bleu',            price: 25, image: './images/santos/bracelet1.png'           },
      bracelet_plastique2: { name: 'Plastique Noir',            price: 25, image: './images/santos/bracelet2.png'           },
      bracelet_cuire01: { name: 'Cuir Marron Boucle Argentée',  price: 25, image: './images/santos/bracelet01.png'          },
      bracelet_cuire02: { name: 'Cuir Marron Boucle Argentée',  price: 25, image: './images/santos/bracelet02.png'          },
      bracelet_cuire03: { name: 'Cuir Marron Boucle Argentée',  price: 25, image: './images/santos/bracelet03.png'          },
      bracelet_cuire04: { name: 'Cuir Marron Boucle Argentée',  price: 25, image: './images/santos/bracelet04.png'          },
      bracelet_cuire1:  { name: 'Cuir Marron Boucle Argentée',  price: 25, image: './images/santos/bracelet-cuire1.png'     },
      bracelet_cuire100:{ name: 'Cuir Marron Boucle Doré',      price: 25, image: './images/santos/bracelet-cuire100.png'   },
      bracelet_cuire101:{ name: 'Cuir Marron Boucle Noir',      price: 25, image: './images/santos/bracelet-cuire101.png'   },
      bracelet_cuire2:  { name: 'Cuir Noir Boucle Argentée',    price: 25, image: './images/santos/bracelet-cuire2.png'     },
      bracelet_cuire3:  { name: 'Cuir Noir Boucle Doré',        price: 25, image: './images/santos/bracelet-cuire3.png'     },
      bracelet_cuire4:  { name: 'Cuir Noir Boucle Noir',        price: 25, image: './images/santos/bracelet-cuire4.png'     },
      bracelet_cuire5:  { name: 'Cuir Brun Foncé Boucle Arg.',  price: 25, image: './images/santos/bracelet-cuire5.png'     },
      bracelet_cuire6:  { name: 'Cuir Brun Foncé Boucle Doré',  price: 25, image: './images/santos/bracelet-cuire6.png'     },
      bracelet_cuire7:  { name: 'Cuir Brun Foncé Boucle Noir',  price: 25, image: './images/santos/bracelet-cuire7.png'     },
    },
    fond: {
      plein_cannele: { name: 'Classique',                         price: 0,  image: './images/datejust/classique_rotor.png' },
      rotor1:        { name: 'Texturé Argent',                    price: 25, image: './images/nautilus/rotor1.png'           },
      rotor2:        { name: 'Texturé Gold',                      price: 25, image: './images/nautilus/rotor2.png'           },
      rotor3:        { name: 'Texturé Fade',                      price: 25, image: './images/nautilus/rotor3.png'           },
      rotor5:        { name: 'Dragon Japonais Argent',            price: 25, image: './images/nautilus/rotor5.png'           },
      rotor6:        { name: 'Dragon Japonais Gold',              price: 25, image: './images/nautilus/rotor6.png'           },
      rotor7:        { name: 'Dragon Japonais Bleu',              price: 25, image: './images/nautilus/rotor7.png'           },
      rotor4:        { name: 'Or Rose',                           price: 25, image: './images/nautilus/rotor4.png'           },
      rotor8:        { name: 'Rotor Fade',                        price: 25, image: './images/nautilus/rotor8.png'           },
      rotor9:        { name: 'Rotor Gold',                        price: 25, image: './images/nautilus/rotor9.png'           },
    },
    remontoir: {
      non_selectionner: { name: 'Remontoir Manuel Classique', price: 0,  image: './images/santos/inclus.png'     },
      automatique:      { name: 'Remontoir Automatique SEIKO', price: 80, image: './images/santos/remontoir1.png' }
    }
  },

  datejust: {
    name: 'Datejust 41',
    basePrice: 0,
    mouvementFixe: 'Mouvement Automatique Calibre NH35',
    carrure: {
      carrure1:          { name: 'Acier Oyster',  price: 69.99, image: './images/datejust/carrure1.png',          watchImage: './images/datejust/carrure1.png',          braceletMode: 'free'     },
      carrure2:          { name: 'Acier Oyster',  price: 69.99, image: './images/datejust/carrure2.png',          watchImage: './images/datejust/carrure2.png',          braceletMode: 'free'     },
      carrure3:          { name: 'Acier Oyster',  price: 69.99, image: './images/datejust/carrure3.png',          watchImage: './images/datejust/carrure3.png',          braceletMode: 'free'     },
      carrure4:          { name: 'Acier Oyster',  price: 69.99, image: './images/datejust/carrure4.png',          watchImage: './images/datejust/carrure4.png',          braceletMode: 'free'     },
      carrure5:          { name: 'Acier Oyster',  price: 69.99, image: './images/datejust/carrure5.png',          watchImage: './images/datejust/carrure5.png',          braceletMode: 'free'     },
      carrure6:          { name: 'Acier Oyster',  price: 69.99, image: './images/datejust/carrure6.png',          watchImage: './images/datejust/carrure6.png',          braceletMode: 'free'     },
      carrure7:          { name: 'Acier Oyster',  price: 69.99, image: './images/datejust/carrure7.png',          watchImage: './images/datejust/carrure7.png',          braceletMode: 'free'     },
      carrure8:          { name: 'Acier Oyster',  price: 69.99, image: './images/datejust/carrure8.png',          watchImage: './images/datejust/carrure8.png',          braceletMode: 'free'     },
      carrure9:          { name: 'Acier Oyster',  price: 69.99, image: './images/datejust/carrure9.png',          watchImage: './images/datejust/carrure9.png',          braceletMode: 'free'     },
      carrure_complete1: { name: 'Acier Oyster Complet', price: 69.99, image: './images/datejust/carrure-complete1.png', watchImage: './images/datejust/carrure-complete1.png', braceletMode: 'included' },
    },
    cadran: {
      dial1:  { name: 'Nacre Blanche 10 Diamants', price: 29.99, image: './images/datejust/dial1.png'  },
      dial2:  { name: 'Nacre Blanche 10 Diamants', price: 29.99, image: './images/datejust/dial2.png'  },
      dial3:  { name: 'Nacre Blanche 10 Diamants', price: 29.99, image: './images/datejust/dial3.png'  },
      dial4:  { name: 'Nacre Blanche 10 Diamants', price: 29.99, image: './images/datejust/dial4.png'  },
      dial5:  { name: 'Nacre Blanche 10 Diamants', price: 29.99, image: './images/datejust/dial5.png'  },
      dial6:  { name: 'Nacre Blanche 10 Diamants', price: 29.99, image: './images/datejust/dial6.png'  },
      dial7:  { name: 'Nacre Blanche 10 Diamants', price: 29.99, image: './images/datejust/dial7.png'  },
      dial8:  { name: 'Nacre Blanche 10 Diamants', price: 29.99, image: './images/datejust/dial8.png'  },
      dial9:  { name: 'Nacre Blanche 10 Diamants', price: 29.99, image: './images/datejust/dial9.png'  },
      dial10: { name: 'Nacre Blanche 10 Diamants', price: 29.99, image: './images/datejust/dial10.png' },
      dial11: { name: 'Nacre Blanche 10 Diamants', price: 29.99, image: './images/datejust/dial11.png' },
      dial12: { name: 'Nacre Blanche 10 Diamants', price: 29.99, image: './images/datejust/dial12.png' },
    },
    aiguilles: {
      baton_luminova:           { name: 'Noir Phosphorescentes',      price: 14.99, image: './images/nautilus/aiguilles1.png' },
      baton_or_rose:            { name: 'Argentées Phosphorescentes', price: 14.99, image: './images/nautilus/aiguilles2.png' },
      baton_or_blanc:           { name: 'Gold Phosphorescentes',      price: 14.99, image: './images/nautilus/aiguilles3.png' },
      baton_platine:            { name: 'Or Rose Phosphorescentes',   price: 14.99, image: './images/nautilus/aiguilles4.png' },
      argent_phosphorescente:   { name: 'Argent phosphorescente',     price: 14.99, image: './images/santos/aiguilles-argent-phosphorescente.png'   },
      gold_phosphorescente:     { name: 'Gold phosphorescente',       price: 14.99, image: './images/santos/aiguilles-gold-phosphorescente.png'     },
      rouge_phosphorescente:    { name: 'Rouge phosphorescente',      price: 14.99, image: './images/santos/aiguilles-rouge-phosphorescente.png'    },
      violette_phosphorescente: { name: 'Violette phosphorescente',   price: 14.99, image: './images/santos/aiguilles-violette-phosphorescente.png' }
    },
    bracelet: {
      integrate_acier:      { name: 'Déjà Inclus',           price: 0,  image: './images/santos/inclus.png'                         },
      oyster_argent:        { name: 'Oyster Argent',          price: 50, image: './images/datejust/bracelet-argent-datejust.png'     },
      oyster_gold:          { name: 'Oyster Gold',            price: 50, image: './images/datejust/bracelet-gold-datejust.png'       },
      oyster_argent_rose:   { name: 'Oyster Argent & Rose',   price: 50, image: './images/datejust/bracelet-argent-rose.png'         },
      oyster_gold_argent:   { name: 'Oyster Gold & Argent',   price: 50, image: './images/datejust/bracelet-gold-silver.png'         },
      oyster_rose:          { name: 'Oyster Rose',            price: 50, image: './images/datejust/bracelet-rose.png'                },
      oyster_noir:          { name: 'Black',                  price: 50, image: './images/datejust/bracelet-noir.png'                }
    },
    fond: {
      plein_cannele: { name: 'Classique',              price: 0,  image: './images/datejust/classique_rotor.png' },
      rotor1:        { name: 'Texturé Argent',         price: 25, image: './images/nautilus/rotor1.png'           },
      rotor2:        { name: 'Texturé Gold',           price: 25, image: './images/nautilus/rotor2.png'           },
      rotor3:        { name: 'Texturé Fade',           price: 25, image: './images/nautilus/rotor3.png'           },
      rotor4:        { name: 'Or Rose',                price: 25, image: './images/nautilus/rotor4.png'           },
      rotor5:        { name: 'Dragon Japonais Argent', price: 25, image: './images/nautilus/rotor5.png'           },
      rotor6:        { name: 'Dragon Japonais Gold',   price: 25, image: './images/nautilus/rotor6.png'           },
      rotor7:        { name: 'Dragon Japonais Bleu',   price: 25, image: './images/nautilus/rotor7.png'           },
      rotor8:        { name: 'Rotor Fade',             price: 25, image: './images/nautilus/rotor8.png'           },
      rotor9:        { name: 'Rotor Gold',             price: 25, image: './images/nautilus/rotor9.png'           },
    },
    remontoir: {
      non_selectionner: { name: 'Remontoir Manuel Classique', price: 0,  image: './images/santos/inclus.png'      },
      automatique:      { name: 'Remontoir Automatique SEIKO', price: 80, image: './images/santos/remontoir1.png' }
    }
  },

  nautilus: {
    name: 'Nautilus Seiko Mod',
    basePrice: 0,
    mouvementFixe: 'Mouvement Automatique Japonais NH35',
    carrure: {
      acier: { name: 'Acier Inoxydable Poli/Satiné', price: 69.99, image: './images/nautilus/carrure-acier.png', watchImage: './images/nautilus/carrure-acier.png' },
      or:    { name: 'Gold',                          price: 69.99, image: './images/nautilus/carrure-gold.png',  watchImage: './images/nautilus/carrure-gold.png'  },
      rose:  { name: 'Rose',                          price: 69.99, image: './images/nautilus/carrure-rose.png',  watchImage: './images/nautilus/carrure-rose.png'  },
      noir:  { name: 'Black',                         price: 69.99, image: './images/nautilus/carrure-noir.png',  watchImage: './images/nautilus/carrure-noir.png'  }
    },
    cadran: {
      candran1: { name: 'Blanc nacré – Orné Argent',      price: 40, image: './images/nautilus/cadran2.png' },
      blanc:    { name: 'Blanc nacré – Orné Or Rose',      price: 40, image: './images/nautilus/cadran1.png' },
      rose:     { name: 'Rose Y2K',                        price: 40, image: './images/nautilus/cadran3.png' },
      fade:     { name: 'Dégradé Pink Blue Fade',          price: 40, image: './images/nautilus/cadran4.png' },
      vert:     { name: 'Vert Fade',                       price: 40, image: './images/nautilus/cadran5.png' },
      noir:     { name: 'Noir sombre',                     price: 40, image: './images/nautilus/cadran6.png' },
      tropical: { name: 'Bleu tropical',                   price: 40, image: './images/nautilus/cadran7.png' },
      rouge:    { name: 'Dégradé Rouge & Noir',            price: 40, image: './images/nautilus/cadran8.png' },
      Bleu:     { name: 'Bleu Marine',                     price: 40, image: './images/nautilus/cadran9.png' }
    },
    aiguilles: {
      baton_luminova: { name: 'Noir Phosphorescentes',      price: 14.99, image: './images/nautilus/aiguilles1.png' },
      baton_or_rose:  { name: 'Argentées Phosphorescentes', price: 14.99, image: './images/nautilus/aiguilles2.png' },
      baton_or_blanc: { name: 'Gold Phosphorescentes',      price: 14.99, image: './images/nautilus/aiguilles3.png' },
      baton_platine:  { name: 'Or Rose Phosphorescentes',   price: 14.99, image: './images/nautilus/aiguilles4.png' },
      aiguilles:      { name: 'Argent Phosphorescentes',    price: 14.99, image: './images/nautilus/aiguilles5.png' },
      aiguilles6:     { name: 'Gold Phosphorescentes',      price: 14.99, image: './images/nautilus/aiguilles6.png' },
      aiguilles7:     { name: 'Violette Phosphorescentes',  price: 14.99, image: './images/nautilus/aiguilles7.png' },
      aiguilles8:     { name: 'Rouge Phosphorescentes',     price: 14.99, image: './images/nautilus/aiguilles8.png' },
    },
    bracelet: {
      integrate_acier: { name: 'Déjà Inclus', price: 0, image: './images/nautilus/inclus.png' }
    },
    fond: {
      saphir_pp: { name: 'Rotor de base',              price: 0,  image: './images/nautilus/classique_rotor.png' },
      rotor1:    { name: 'Texturé Argent',             price: 25, image: './images/nautilus/rotor1.png'           },
      rotor2:    { name: 'Texturé Gold',               price: 25, image: './images/nautilus/rotor2.png'           },
      rotor3:    { name: 'Texturé Fade',               price: 25, image: './images/nautilus/rotor3.png'           },
      rotor4:    { name: 'Or Rose',                    price: 25, image: './images/nautilus/rotor4.png'           },
      rotor5:    { name: 'Dragon Japonais Argent',     price: 25, image: './images/nautilus/rotor5.png'           },
      rotor6:    { name: 'Dragon Japonais Gold',       price: 25, image: './images/nautilus/rotor6.png'           },
      rotor7:    { name: 'Dragon Japonais Bleu',       price: 25, image: './images/nautilus/rotor7.png'           },
      rotor8:    { name: 'Rotor Fade',                 price: 25, image: './images/nautilus/rotor8.png'           },
      rotor9:    { name: 'Rotor Gold',                 price: 25, image: './images/nautilus/rotor9.png'           },
    },
    remontoir: {
      non_selectionner: { name: 'Remontoir Manuel Classique', price: 0,  image: './images/santos/inclus.png'      },
      automatique:      { name: 'Remontoir Automatique SEIKO', price: 80, image: './images/santos/remontoir1.png' }
    }
  }
};

/* ============================================================
   DOMContentLoaded BOOTSTRAP
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  currentWatchType = null;
  const grid = document.getElementById('mainGrid');
  if (grid) { grid.style.opacity = '0'; grid.style.pointerEvents = 'none'; }

  document.querySelectorAll('.km-tab').forEach(btn => btn.classList.remove('active'));

  updateCartBadge();

  // Email double-check
  const form = document.getElementById('orderForm');
  const emailInput   = document.getElementById('email');
  const confirmEmail = document.getElementById('confirmEmail');
  const emailError   = document.getElementById('emailError');

  if (form && emailInput && confirmEmail) {
    form.addEventListener('submit', (e) => {
      if (emailInput.value.trim() !== confirmEmail.value.trim()) {
        e.preventDefault();
        if (emailError) emailError.style.display = 'block';
        confirmEmail.style.borderColor = '#e74c3c';
        emailInput.style.borderColor   = '#e74c3c';
        showToast('❌ Les adresses e-mail ne correspondent pas.');
        return false;
      } else {
        if (emailError) emailError.style.display = 'none';
        confirmEmail.style.borderColor = '';
        emailInput.style.borderColor   = '';
      }
    });
  }

  // Navbar scroll effect
  const nav = document.getElementById('mainNav');
  if (nav) {
    window.addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', window.scrollY > 20);
    });
  }

  // ESC close modals
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.km-modal.show').forEach(m => m.classList.remove('show'));
    }
  });

  // Backdrop close
  document.querySelectorAll('.km-modal').forEach(m => {
    m.addEventListener('click', e => { if (e.target === m) m.classList.remove('show'); });
  });
});

/* ============================================================
   CATEGORIES
   ============================================================ */
const ALL_CATEGORIES = ['carrure','cadran','aiguilles','bracelet','fond','remontoir'];

function getRequiredCategories() {
  const cfg = watchConfigurations[currentWatchType];
  return ALL_CATEGORIES.filter(cat => {
    const obj = cfg[cat];
    return obj && Object.keys(obj).length > 0;
  });
}

function toggleGroupsVisibility() {
  const cfg = watchConfigurations[currentWatchType];
  ALL_CATEGORIES.forEach(cat => {
    const group = document.getElementById(`group-${cat}`);
    if (!group) return;
    const exists = cfg[cat] && Object.keys(cfg[cat]).length > 0;
    group.classList.toggle('hidden', !exists);
  });
}

/* ============================================================
   SWITCH WATCH TYPE
   ============================================================ */
function switchWatchType(type) {
  if (!watchConfigurations[type]) return;
  currentWatchType = type;

  // Update tab active state
  document.querySelectorAll('.km-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.watch === type);
  });

  // Show hint → hide
  const hint = document.getElementById('chooseModelHint');
  if (hint) hint.style.display = 'none';

  // Fade-in grid
  const grid = document.getElementById('mainGrid');
  if (grid) {
    grid.style.opacity = '0';
    grid.style.pointerEvents = 'none';
    setTimeout(() => {
      grid.style.opacity = '1';
      grid.style.pointerEvents = 'auto';
    }, 80);
  }

  updateConfigurationOptions(type);
  updateOrderButtonState();

  // Reset watch image
  const img = document.getElementById('watchImage');
  if (img) { img.classList.remove('show'); img.src = ''; }
  const ph = document.getElementById('placeholderText');
  if (ph) ph.style.display = 'flex';
  lastWatchImage = null;
}

/* ============================================================
   BUILD OPTIONS
   ============================================================ */
function updateConfigurationOptions(watchType) {
  currentWatchType = watchType;
  const cfg = watchConfigurations[watchType];

  // Reset
  selectedOptions = { carrure: null, cadran: null, aiguilles: null, bracelet: null, fond: null, remontoir: null };

  // Reset info bars
  ALL_CATEGORIES.forEach(cat => {
    const nameEl  = document.getElementById(`${cat}Name`);
    const priceEl = document.getElementById(`${cat}Price`);
    if (nameEl)  nameEl.textContent  = '—';
    if (priceEl) priceEl.textContent = '0 €';
  });

  generateVisualOptions('remontoir', cfg.remontoir);
  generateVisualOptions('carrure',   cfg.carrure);
  generateVisualOptions('cadran',    cfg.cadran);
  generateVisualOptions('aiguilles', cfg.aiguilles);
  generateVisualOptions('bracelet',  cfg.bracelet);
  generateVisualOptions('fond',      cfg.fond);
  toggleGroupsVisibility();
  updateTotalPriceDisplay();

  // Clear preview
  const preview = document.getElementById('selectedComponentsPreview');
  if (preview) preview.innerHTML = '';
}

function generateVisualOptions(category, options) {
  const container = document.getElementById(`${category}Options`);
  if (!container) return;
  container.innerHTML = '';
  if (!options || Object.keys(options).length === 0) return;

  let delay = 0;
  Object.keys(options).forEach(key => {
    const option = options[key];
    const div = document.createElement('div');
    div.className = 'km-opt';
    div.dataset.category = category;
    div.dataset.key = key;
    div.style.animationDelay = `${delay}ms`;
    delay += 30;

    const fallback = encodeURIComponent((option.name || 'IMG').slice(0, 3));
    div.innerHTML = `
      <img class="km-opt-img" src="${option.image}" alt="${option.name}"
        onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Crect fill=%22%23f0f0f0%22 width=%22100%22 height=%22100%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%23999%22 font-size=%2214%22%3E${fallback}%3C/text%3E%3C/svg%3E'"/>
      <div class="km-opt-name">${option.name}</div>
      <div class="km-opt-price">${option.price.toLocaleString('fr-FR')} €</div>
    `;

    div.addEventListener('click', () => selectOption(category, key));
    container.appendChild(div);
  });
}

/* ============================================================
   SELECT OPTION
   ============================================================ */
function selectOption(category, key) {
  selectedOptions[category] = key;

  if (category === 'carrure') applyBraceletRulesFromCarrure();

  // Update visual active state
  const container = document.getElementById(`${category}Options`);
  if (container) {
    container.querySelectorAll('.km-opt').forEach(o => {
      o.classList.toggle('active', o.dataset.key === key);
    });
  }

  // Update info bar
  const cfg    = watchConfigurations[currentWatchType];
  const option = cfg[category][key];
  const nameEl  = document.getElementById(`${category}Name`);
  const priceEl = document.getElementById(`${category}Price`);
  if (nameEl)  nameEl.textContent  = option.name;
  if (priceEl) priceEl.textContent = `${option.price.toLocaleString('fr-FR')} €`;

  updateWatch();
  updateSelectedComponentsDisplay();
  updateOrderButtonState();
  saveConfiguration();
  updateTotalPriceDisplay();
}

/* ============================================================
   UPDATE WATCH IMAGE
   ============================================================ */
function updateWatch() {
  const cfg       = watchConfigurations[currentWatchType];
  const watchImg  = document.getElementById('watchImage');
  const placeholder = document.getElementById('placeholderText');

  if (!selectedOptions.carrure) {
    watchImg.classList.remove('show');
    watchImg.style.display = 'none';
    placeholder.style.display = 'flex';
    lastWatchImage = null;
    return;
  }

  const carrureData = cfg.carrure[selectedOptions.carrure];
  const newSrc = carrureData.watchImage;

  if (newSrc === lastWatchImage) { watchImg.src = newSrc; return; }

  lastWatchImage = newSrc;
  watchImg.classList.remove('show');

  setTimeout(() => {
    watchImg.src = newSrc;
    watchImg.style.display = 'block';
    placeholder.style.display = 'none';
    setTimeout(() => watchImg.classList.add('show'), 20);
  }, 140);

  updateTotalPriceDisplay();
}

/* ============================================================
   PRICE
   ============================================================ */
function calculateTotalPrice() {
  let total = 0;
  const cfg = watchConfigurations[currentWatchType];
  for (const cat in selectedOptions) {
    const key = selectedOptions[cat];
    if (!key) continue;
    const opt = cfg[cat]?.[key];
    if (opt && opt.price) total += opt.price;
  }
  return total;
}

function updateTotalPriceDisplay() {
  const total = calculateTotalPrice();
  const el = document.getElementById('totalPrice');
  if (el) el.textContent = total.toLocaleString('fr-FR') + ' €';
}

/* ============================================================
   COMPONENTS PREVIEW
   ============================================================ */
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
    item.innerHTML = `
      <img src="${data.image}" alt="${data.name}"/>
      <span>${capitalize(cat)}</span>
    `;

    item.addEventListener('click', () => {
      const modal = document.getElementById('imageModal');
      document.getElementById('modalImage').src   = data.image;
      document.getElementById('modalName').textContent  = data.name;
      document.getElementById('modalPrice').textContent = `${data.price.toLocaleString('fr-FR')} €`;
      openModal('imageModal');
    });

    preview.appendChild(item);
  });
}

/* ============================================================
   BRACELET RULES
   ============================================================ */
function applyBraceletRulesFromCarrure() {
  const cfg = watchConfigurations[currentWatchType];
  if (!cfg?.carrure || !cfg?.bracelet) return;

  const carrureKey = selectedOptions.carrure;
  if (!carrureKey) return;

  const carrure     = cfg.carrure[carrureKey];
  const bracelets   = cfg.bracelet;
  const includedKey = 'integrate_acier';

  if (carrure.braceletMode === 'free') {
    const filtered = {};
    for (const key in bracelets) {
      if (key !== includedKey) filtered[key] = bracelets[key];
    }
    generateVisualOptions('bracelet', filtered);
    selectedOptions.bracelet = null;
    return;
  }

  generateVisualOptions('bracelet', bracelets);
  const container = document.getElementById('braceletOptions');
  if (!container) return;

  container.querySelectorAll('.km-opt').forEach(opt => {
    if (opt.dataset.key !== includedKey) opt.classList.add('disabled');
  });

  selectOption('bracelet', includedKey);
}

/* ============================================================
   ORDER BUTTON STATE
   ============================================================ */
function countMissing() {
  const required = getRequiredCategories();
  return required.filter(c => !selectedOptions[c]).length;
}

function updateOrderButtonState() {
  const btns  = [document.getElementById('addToCartBtn'), document.getElementById('addToCartBtnMobile')];
  const texts = [document.getElementById('orderBtnText'), document.getElementById('orderBtnTextMobile')];
  const missing = countMissing();

  btns.forEach((btn, i) => {
    if (!btn) return;
    if (missing === 0) {
      btn.disabled = false;
      if (texts[i]) texts[i].textContent = 'Ajouter au panier';
    } else {
      btn.disabled = true;
      if (texts[i]) texts[i].textContent = `${missing} élément${missing > 1 ? 's' : ''} à choisir`;
    }
  });
}

/* ============================================================
   ORDER SUBMISSION
   ============================================================ */
function placeOrder() {
  const missing = countMissing();
  if (missing > 0) { showToast(`⚠️ Sélectionnez tous les éléments (${missing} restant${missing > 1 ? 's' : ''})`); return; }
  buildOrderSummary();
  openModal('selectionModal');
}

function buildOrderSummary() {
  const wrap = document.getElementById('orderSummary');
  if (!wrap) return;
  const cfg = watchConfigurations[currentWatchType];
  let total = cfg.basePrice || 0;
  let list  = '';

  getRequiredCategories().forEach(cat => {
    const key = selectedOptions[cat];
    if (!key || !cfg[cat]) return;
    const opt = cfg[cat][key];
    total += (opt?.price || 0);
    list += `<div class="summary-item"><span>${capitalize(cat)}</span><strong>${opt.name} — ${opt.price.toLocaleString('fr-FR')} €</strong></div>`;
  });

  wrap.innerHTML = `
    <div class="summary-item"><span>Modèle</span><strong>${cfg.name}</strong></div>
    <div class="summary-item"><span>Mouvement</span><strong>${cfg.mouvementFixe}</strong></div>
    ${list}
    <div class="summary-item" style="margin-top:8px;border-top:1px solid rgba(0,0,0,0.08);padding-top:8px">
      <span>Total</span><strong class="price-highlight">${total.toLocaleString('fr-FR')} €</strong>
    </div>`;
}

async function submitOrder(e) {
  e.preventDefault();
  const form        = e.target;
  const confirmBtn  = document.getElementById('confirmOrderBtn');
  const email       = form.email.value.trim().toLowerCase();
  const confirmEI   = document.getElementById('confirmEmail');
  const emailError  = document.getElementById('emailError');

  if (confirmEI && email !== confirmEI.value.trim().toLowerCase()) {
    if (emailError) emailError.style.display = 'block';
    form.email.style.borderColor = '#e74c3c';
    if (confirmEI) confirmEI.style.borderColor = '#e74c3c';
    showToast('❌ Les adresses e-mail ne correspondent pas.');
    return;
  }
  if (emailError) emailError.style.display = 'none';

  confirmBtn.disabled = true;
  confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi en cours...';

  try {
    const date  = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const model = watchConfigurations[currentWatchType].name;
    const configuration = Object.entries(selectedOptions)
      .map(([key, value]) => {
        if (!value) return null;
        const opt = watchConfigurations[currentWatchType][key]?.[value];
        return opt ? `• ${key.toUpperCase()} : ${opt.name} (${opt.price} €)` : null;
      })
      .filter(Boolean).join('\n');

    const total_price = document.getElementById('totalPrice')?.textContent || '—';

    if (!canPlaceOrder(email)) {
      const ms = remainingDelayMs(email);
      const h  = Math.ceil(ms / (60 * 60 * 1000));
      showOrderWarning(`Vous avez déjà passé une commande avec cet e-mail. Réessayez dans ${h}h.`);
      confirmBtn.disabled = false;
      confirmBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Envoyer la commande';
      return;
    }

    const params = {
      from_name: form.name.value,
      to_email:  email,
      email,
      model,
      configuration,
      total_price,
      payment:      form.payment.value,
      address:      form.address.value,
      phone:        form.phone.value,
      instructions: form.instructions.value || 'Aucune instruction fournie',
      date
    };

    await Promise.race([
      emailjs.send(EMAILJS_CONFIG.service_id, EMAILJS_CONFIG.template_id, params, EMAILJS_CONFIG.user_id),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout EmailJS')), 20000))
    ]);

    recordOrder(email);
    window.location.href = 'recap.html';

  } catch (err) {
    console.error('Erreur EmailJS :', err);
    showOrderWarning('Une erreur est survenue lors de l\'envoi. Merci de réessayer.');
    confirmBtn.disabled = false;
    confirmBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Envoyer la commande';
  }
}

/* ============================================================
   STORAGE
   ============================================================ */
function saveConfiguration() {
  localStorage.setItem('lastWatchConfig', JSON.stringify({ type: currentWatchType, options: selectedOptions }));
}

/* ============================================================
   MODAL HELPERS
   ============================================================ */
function openModal(id) {
  const m = document.getElementById(id);
  if (!m) return;
  m.classList.add('show');
  m.setAttribute('aria-hidden', 'false');
  if (id === 'selectionModal') buildOrderSummary();
}

function closeModal(id) {
  const m = document.getElementById(id);
  if (!m) return;
  m.classList.remove('show');
  m.setAttribute('aria-hidden', 'true');
}

/* ============================================================
   TOAST
   ============================================================ */
function showToast(message, duration = 3200) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = message;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), duration);
}

/* ============================================================
   UTILS
   ============================================================ */
function capitalize(s) { return (s || '').charAt(0).toUpperCase() + (s || '').slice(1); }

/* ============================================================
   PAGE TRANSITIONS
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('a').forEach(link => {
    const href = link.getAttribute('href');
    if (href && !href.startsWith('#') && !link.hasAttribute('onclick')) {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        document.body.classList.add('fade-out');
        setTimeout(() => { window.location = this.href; }, 380);
      });
    }
  });
});

window.addEventListener('pageshow', e => { if (e.persisted) window.location.reload(); });
