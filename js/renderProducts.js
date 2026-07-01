/* renderProducts.js */

// -- CART STATE --
let cart = JSON.parse(localStorage.getItem('cart')) || [];

function saveCart() {
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartUI();
}

function renderProducts(containerId, productList) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  container.innerHTML = '';
  
  productList.forEach(product => {
    let badgeHtml = '';
    if (product.badge) {
      badgeHtml = `<div class="pcard-badge ${product.badgeClass}">${product.badge}</div>`;
    }
    
    const basePrice = product.price;
    const fmt = n => n.toLocaleString('en-PK');
    const priceText = `PKR ${fmt(basePrice)}`;
    
    let oldPriceHtml = '';
    if (product.oldPrice) {
      oldPriceHtml = `<span class="qty-total-old">PKR ${fmt(product.oldPrice)}</span>`;
    }
    
    const cardHtml = `
      <div class="pcard" data-id="${product.id}" data-baseprice="${basePrice}">
        <div class="pcard-img">
          <img src="${product.image}" alt="${product.name}" loading="lazy">
          ${badgeHtml}
          <button class="pcard-qv" onclick="openProductModal('${product.id}')">Quick View</button>
        </div>
        
        <div class="pcard-body">
          <div class="pcard-cat">${product.category}</div>
          <h3>${product.name}</h3>
          <div class="pcard-stars">
            <div class="stars">★★★★★</div>
            <span>(${product.reviews} reviews)</span>
          </div>
          
          <div class="variant-wrapper">
            <div class="variant-label">Select Size</div>
            <div class="variant-row">
              <div class="variant-selector">
                <button class="var-btn active" data-size="3ml" onclick="changeVariant(this, 0)">3ml</button>
                <button class="var-btn" data-size="6ml" onclick="changeVariant(this, 300)">6ml</button>
                <button class="var-btn" data-size="12ml"onclick="changeVariant(this, 600)">12ml</button>
              </div>
              <span class="variant-price">${priceText} ${oldPriceHtml}</span>
            </div>
          </div>
          
          <button class="pcard-btn" onclick="addToCart(this, '${product.image}')"><i class="fas fa-shopping-cart"></i> Add to Cart</button>
        </div>
      </div>
    `;
    
    container.innerHTML += cardHtml;
  });
}

function changeVariant(btn, extraPrice) {
  const selector = btn.closest('.variant-selector');
  const buttons = selector.querySelectorAll('.var-btn');
  buttons.forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  
  const pcard = btn.closest('.pcard') || btn.closest('.modal-info');
  const basePrice = parseInt(pcard.dataset.baseprice);
  const newPrice = basePrice + extraPrice;
  
  const priceContainer = pcard.querySelector('.variant-price') || pcard.querySelector('.modal-price');
  
  const fmt = n => n.toLocaleString('en-PK');
  if(priceContainer.classList.contains('modal-price')) {
      priceContainer.textContent = `PKR ${fmt(newPrice)}`;
  } else {
      const oldPriceSpan = priceContainer.querySelector('.qty-total-old');
      let oldHtml = '';
      if(oldPriceSpan) {
          const originalOldPriceStr = oldPriceSpan.textContent.replace(/[^0-9]/g, '');
          if(originalOldPriceStr) {
             const originalOld = parseInt(originalOldPriceStr);
             oldHtml = `<span class="qty-total-old">PKR ${fmt(originalOld + extraPrice)}</span>`;
          }
      }
      priceContainer.innerHTML = `PKR ${fmt(newPrice)} ${oldHtml}`;
  }
}

function openProductModal(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return;
  
  document.getElementById("modalTitle").textContent  = product.name;
  document.getElementById("modalBadge").textContent  = product.modalBadge || '';
  
  const fmt = n => n.toLocaleString('en-PK');
  document.getElementById("modalPrice").textContent  = `PKR ${fmt(product.price)}`;
  document.getElementById("modalImg").src            = product.image;
  document.getElementById("modalImg").alt            = product.name;
  document.getElementById("modalDesc").textContent   = product.shortDesc;
  document.getElementById("mTop").textContent        = product.topNotes;
  document.getElementById("mHeart").textContent      = product.heartNotes;
  document.getElementById("mBase").textContent       = product.baseNotes;
  document.getElementById("mProjection").style.width = product.projection + "%";
  document.getElementById("mProjectionLabel").textContent = Math.round(product.projection/10) + "–" + (Math.round(product.projection/10)+2) + " hours projection";
  
  const modalInfo = document.querySelector('.modal-info');
  modalInfo.dataset.baseprice = product.price;
  
  const btn = modalInfo.querySelector('.modal-btn');
  btn.setAttribute('onclick', `addToCart(this, '${product.image}')`);
  btn.innerHTML = `<i class="fas fa-shopping-cart"></i> Add to Cart`;

  const varBtns = modalInfo.querySelectorAll('.var-btn');
  if(varBtns.length > 0) {
      varBtns.forEach(b => b.classList.remove('active'));
      varBtns[0].classList.add('active');
  }
  
  const modalOverlay = document.getElementById("modalOverlay");
  modalOverlay.classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  const modalOverlay = document.getElementById("modalOverlay");
  if(modalOverlay) {
      modalOverlay.classList.remove("open");
  }
  document.body.style.overflow = "";
}

function closeModalOutside(e) { 
  if(e.target === document.getElementById("modalOverlay")) closeModal(); 
}

document.addEventListener("keydown", e => { 
  if(e.key === "Escape") closeModal(); 
});


// -- DYNAMIC CART UI INJECTION --
const cartCss = `
<style>
.cart-sidebar {
  position: fixed;
  top: 0; right: -400px;
  width: 100%; max-width: 400px; height: 100vh;
  background: #0d0d0d; border-left: 1px solid rgba(212,175,55,0.2);
  z-index: 3000; transition: right 0.4s ease;
  display: flex; flex-direction: column;
  box-shadow: -10px 0 30px rgba(0,0,0,0.8);
}
.cart-sidebar.open { right: 0; }
.cart-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.7);
  z-index: 2999; display: none; backdrop-filter: blur(5px);
}
.cart-overlay.open { display: block; }
.cart-header {
  padding: 20px; border-bottom: 1px solid rgba(212,175,55,0.2);
  display: flex; justify-content: space-between; align-items: center;
}
.cart-header h2 { font-family: 'Cinzel', serif; color: var(--gold,#d4af37); margin:0; font-size: 22px; }
.cart-close { background: none; border: none; color: #fff; font-size: 24px; cursor: pointer; transition: 0.3s; }
.cart-close:hover { color: var(--gold,#d4af37); }
.cart-body { flex: 1; overflow-y: auto; padding: 20px; }
.cart-item {
  display: flex; gap: 15px; margin-bottom: 20px;
  padding-bottom: 20px; border-bottom: 1px dashed rgba(255,255,255,0.1);
}
.cart-item-img { width: 70px; height: 70px; border-radius: 10px; object-fit: cover; border: 1px solid rgba(212,175,55,0.3); }
.cart-item-info { flex: 1; }
.cart-item-title { font-family: 'Cinzel', serif; font-size: 14px; margin-bottom: 4px; color: #fff; }
.cart-item-variant { font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
.cart-item-price { font-weight: bold; color: var(--gold,#d4af37); font-size: 14px; }
.cart-qty-ctrl {
  display: flex; align-items: center; gap: 10px; margin-top: 8px;
  background: rgba(255,255,255,0.05); width: fit-content; border-radius: 20px; padding: 2px 8px;
}
.cart-qty-btn { background: none; border: none; color: var(--gold,#d4af37); font-size: 14px; cursor: pointer; }
.cart-qty-num { font-size: 12px; font-weight: bold; color: #fff; min-width: 16px; text-align: center; }
.cart-remove { background: none; border: none; color: #c0392b; cursor: pointer; font-size: 12px; margin-left: auto; display: block; margin-top: -20px; }
.cart-footer { padding: 20px; border-top: 1px solid rgba(212,175,55,0.2); background: #050505; }
.cart-total { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; font-size: 18px; font-weight: bold; color: #fff; }
.cart-total span:last-child { color: var(--gold,#d4af37); }
.btn-checkout {
  width: 100%; padding: 14px; border: none; border-radius: 40px;
  background: var(--gold,#d4af37); color: #000; font-weight: bold; cursor: pointer;
  text-transform: uppercase; letter-spacing: 1px; transition: 0.3s;
  display: flex; align-items: center; justify-content: center; gap: 8px;
}
.btn-checkout:hover { background: #fff; }
.empty-cart { text-align: center; color: #666; margin-top: 50px; font-style: italic; }
</style>
`;

const cartHtml = `
<div class="cart-overlay" id="cartOverlay" onclick="toggleCart()"></div>
<div class="cart-sidebar" id="cartSidebar">
  <div class="cart-header">
    <h2>Your Cart</h2>
    <button class="cart-close" onclick="toggleCart()"><i class="fas fa-xmark"></i></button>
  </div>
  <div class="cart-body" id="cartBody">
    <!-- Cart Items Here -->
  </div>
  <div class="cart-footer">
    <div class="cart-total">
      <span>Total:</span>
      <span id="cartTotalVal">PKR 0</span>
    </div>
    <button class="btn-checkout" onclick="window.location.href='cart.html'"><i class="fas fa-shopping-cart"></i> View Cart & Checkout</button>
  </div>
</div>
`;

// Inject on load
document.addEventListener("DOMContentLoaded", () => {
  document.head.insertAdjacentHTML("beforeend", cartCss);
  document.body.insertAdjacentHTML("beforeend", cartHtml);
  updateCartUI();
});

function toggleCart() {
  document.getElementById('cartSidebar').classList.toggle('open');
  document.getElementById('cartOverlay').classList.toggle('open');
}

function addToCart(btn, image) {
  const pcard = btn.closest('.pcard') || btn.closest('.modal-info');
  let productName = "";
  let selectedSize = "3ml";
  
  if(pcard.classList.contains('pcard')) {
      productName = pcard.querySelector('h3').textContent;
      const activeBtn = pcard.querySelector('.var-btn.active');
      if(activeBtn) selectedSize = activeBtn.dataset.size;
  } else {
      productName = document.getElementById("modalTitle").textContent;
      const activeBtn = document.querySelector('.modal-info .var-btn.active');
      if(activeBtn) selectedSize = activeBtn.dataset.size;
      
      // Attempt to get image if not passed in modal context
      if(!image || image === 'undefined') {
         image = document.getElementById('modalImg').src;
      }
  }
  
  let basePrice = parseInt(pcard.dataset.baseprice);
  let price = basePrice;
  if(selectedSize === '6ml') price += 300;
  if(selectedSize === '12ml') price += 600;

  const existing = cart.find(item => item.name === productName && item.size === selectedSize);
  if(existing) {
      existing.quantity += 1;
  } else {
      cart.push({
          name: productName,
          size: selectedSize,
          price: price,
          quantity: 1,
          image: image
      });
  }
  
  saveCart();
  
  const orig = btn.innerHTML;
  btn.innerHTML = "✓ Added!"; 
  btn.style.background = "#fff";
  
  setTimeout(() => { 
      btn.innerHTML = orig; 
      btn.style.background = ""; 
      toggleCart();
      if (document.getElementById("modalOverlay").classList.contains("open")) {
          closeModal();
      }
  }, 800);
}

function updateQuantity(index, delta) {
  cart[index].quantity += delta;
  if(cart[index].quantity <= 0) {
      cart.splice(index, 1);
  }
  saveCart();
}

function removeFromCart(index) {
  cart.splice(index, 1);
  saveCart();
}

function updateCartUI() {
  const body = document.getElementById('cartBody');
  const badge = document.getElementById('cartBadge');
  const totalVal = document.getElementById('cartTotalVal');
  
  if(!body || !totalVal) return; // Might be called before DOM is ready
  
  let count = 0;
  let total = 0;
  const fmt = n => n.toLocaleString('en-PK');
  
  if(cart.length === 0) {
      body.innerHTML = '<div class="empty-cart">Your cart is empty.</div>';
  } else {
      body.innerHTML = '';
      cart.forEach((item, index) => {
          count += item.quantity;
          total += item.price * item.quantity;
          
          body.innerHTML += `
            <div class="cart-item">
              <img src="${item.image}" alt="${item.name}" class="cart-item-img">
              <div class="cart-item-info">
                <div class="cart-item-title">${item.name}</div>
                <div class="cart-item-variant">${item.size}</div>
                <div class="cart-item-price">PKR ${fmt(item.price)}</div>
                <div class="cart-qty-ctrl">
                  <button class="cart-qty-btn" onclick="updateQuantity(${index}, -1)">-</button>
                  <span class="cart-qty-num">${item.quantity}</span>
                  <button class="cart-qty-btn" onclick="updateQuantity(${index}, 1)">+</button>
                </div>
              </div>
              <button class="cart-remove" onclick="removeFromCart(${index})"><i class="fas fa-trash"></i></button>
            </div>
          `;
      });
  }
  
  if(badge) {
      badge.textContent = count;
      badge.classList.remove("pop"); 
      void badge.offsetWidth; 
      badge.classList.add("pop");
  }
  
  totalVal.textContent = `PKR ${fmt(total)}`;
}

function checkoutViaWhatsApp() {
  if(cart.length === 0) return;
  
  let msg = "Hello A&T Royal, I would like to place an order:\\n\\n";
  let total = 0;
  const fmt = n => n.toLocaleString('en-PK');
  
  cart.forEach(item => {
      const itemTotal = item.price * item.quantity;
      total += itemTotal;
      msg += `${item.quantity}x ${item.name} (${item.size}) - PKR ${fmt(itemTotal)}\\n`;
  });
  
  msg += `\\n*Total: PKR ${fmt(total)}*`;
  
  window.open(`https://wa.me/923257553992?text=${encodeURIComponent(msg)}`, "_blank");
}

/* ── GLOBAL NAVBAR SCROLL ── */
window.addEventListener("scroll", () => {
    const nav = document.getElementById("navbar");
    if (nav) {
        nav.classList.toggle("scrolled", window.scrollY > 80);
    }
});

/* ── GLOBAL HAMBURGER MENU ── */
window.toggleMenu = function() {
    const hamburger = document.getElementById("hamburger");
    const mobileMenu = document.getElementById("mobileMenu");
    if (hamburger && mobileMenu) {
        hamburger.classList.toggle("open");
        mobileMenu.classList.toggle("open");
        document.body.style.overflow = mobileMenu.classList.contains("open") ? "hidden" : "";
    }
};

/* ── GLOBAL SEARCH TOGGLE ── */
window.toggleSearch = function() { 
    window.location.href = "collection.html"; 
};
