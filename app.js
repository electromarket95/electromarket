const WHATSAPP_NUMBER = "79298881157";

const CATEGORIES = [
  "Все товары", "Смартфоны и телефоны", "Аксессуары",
  "Планшеты и компьютеры", "Электроинструменты", "Бытовая техника",
  "Роутеры и связь", "Кондиционеры и отопление", "Смарт-гаджеты и сеть",
  "Автотовары и электроника", "Машинки для стрижки", "Прочее"
];

let activeCategory = "Все товары";
let searchTerm = "";
let sortMode = "featured";
let cart = {};
let toastTimer;

let galleryProduct = null;
let galleryIndex = 0;
let galleryTouchX = 0;

const $ = id => document.getElementById(id);

const money = n => new Intl.NumberFormat("ru-RU", {
  maximumFractionDigits: 0
}).format(n) + " ₽";

const safe = value => String(value ?? "").replace(/[&<>"']/g, ch => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;"
}[ch]));

function getProducts() {
  return Array.isArray(window.PRODUCTS) ? window.PRODUCTS : [];
}

function productById(id) {
  return getProducts().find(p => String(p.id) === String(id));
}

/* Поддерживает старое поле image и массив images */
function getProductImages(product) {
  if (!product) return [];

  const extra = Array.isArray(product.images) ? product.images : [];

  return [...new Set(
    [product.image, ...extra].filter(
      value => typeof value === "string" && value.trim()
    )
  )];
}

function renderCategories() {
  const container = $("categories");
  if (!container) return;

  container.innerHTML = CATEGORIES.map(category =>
    `<button class="category-chip ${category === activeCategory ? "active" : ""}"
      data-category="${safe(category)}" type="button">${safe(category)}</button>`
  ).join("");
}

function filteredProducts() {
  let products = getProducts().filter(p => {
    const categoryMatch =
      activeCategory === "Все товары" || p.category === activeCategory;

    const haystack =
      `${p.name || ""} ${p.brand || ""} ${p.category || ""} ${p.description || ""}`
        .toLocaleLowerCase("ru");

    return categoryMatch &&
      haystack.includes(searchTerm.toLocaleLowerCase("ru"));
  });

  if (sortMode === "price-asc") {
    products.sort((a, b) => Number(a.price) - Number(b.price));
  }

  if (sortMode === "price-desc") {
    products.sort((a, b) => Number(b.price) - Number(a.price));
  }

  if (sortMode === "name") {
    products.sort((a, b) =>
      String(a.name || "").localeCompare(String(b.name || ""), "ru")
    );
  }

  return products;
}

/* Полноэкранная галерея фотографий */
function initGallery() {
  if ($("product-gallery")) return;

  const style = document.createElement("style");
  style.id = "product-gallery-styles";

  style.textContent = `
    #product-gallery {
      position: fixed;
      inset: 0;
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 18px;
      background: rgba(0,0,0,.94);
      overscroll-behavior: contain;
    }

    #product-gallery[hidden] {
      display: none !important;
    }

    #gallery-wrap {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      min-width: 0;
      min-height: 0;
    }

    #gallery-image {
      display: block;
      max-width: 100%;
      max-height: 100%;
      width: auto;
      height: auto;
      object-fit: contain;
      object-position: center;
      user-select: none;
      -webkit-user-drag: none;
    }

    .gallery-close,
    .gallery-arrow {
      position: absolute;
      z-index: 2;
      display: grid;
      place-items: center;
      border: 1px solid rgba(255,255,255,.35);
      background: rgba(15,27,43,.92);
      color: #fff;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
    }

    .gallery-close {
      top: 10px;
      right: 10px;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      font-size: 28px;
      line-height: 1;
    }

    .gallery-arrow {
      top: 50%;
      transform: translateY(-50%);
      width: 44px;
      height: 56px;
      border-radius: 12px;
      font-size: 32px;
      line-height: 1;
    }

    #gallery-prev { left: 8px; }
    #gallery-next { right: 8px; }

    #gallery-count {
      position: absolute;
      bottom: 12px;
      left: 50%;
      transform: translateX(-50%);
      padding: 7px 13px;
      border-radius: 20px;
      background: rgba(15,27,43,.92);
      color: #fff;
      font: 14px Arial, sans-serif;
      white-space: nowrap;
    }

    .product-visual img[data-gallery] {
      cursor: zoom-in;
    }

    .product-photo-count {
      position: absolute;
      right: 9px;
      bottom: 9px;
      z-index: 3;
      padding: 5px 8px;
      border-radius: 8px;
      background: rgba(4,12,22,.82);
      color: #fff;
      font-size: 11px;
      pointer-events: none;
    }

    @media(max-width:600px) {
      #product-gallery { padding: 8px; }

      .gallery-close {
        top: 8px;
        right: 8px;
      }

      .gallery-arrow {
        width: 36px;
        height: 46px;
        font-size: 26px;
      }

      #gallery-prev { left: 3px; }
      #gallery-next { right: 3px; }

      #gallery-count {
        bottom: 8px;
        font-size: 12px;
      }
    }
  `;

  document.head.appendChild(style);

  const modal = document.createElement("div");
  modal.id = "product-gallery";
  modal.hidden = true;
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-label", "Фотографии товара");

  modal.innerHTML = `
    <button class="gallery-close" id="gallery-close"
      type="button" aria-label="Закрыть просмотр">×</button>

    <div id="gallery-wrap">
      <button class="gallery-arrow" id="gallery-prev"
        type="button" aria-label="Предыдущее фото">‹</button>

      <img id="gallery-image" alt="">

      <button class="gallery-arrow" id="gallery-next"
        type="button" aria-label="Следующее фото">›</button>

      <div id="gallery-count" aria-live="polite"></div>
    </div>
  `;

  document.body.appendChild(modal);

  $("gallery-close").addEventListener("click", closeGallery);

  $("gallery-prev").addEventListener("click", () => {
    changeGallery(-1);
  });

  $("gallery-next").addEventListener("click", () => {
    changeGallery(1);
  });

  modal.addEventListener("click", e => {
    if (e.target === modal) closeGallery();
  });

  const wrap = $("gallery-wrap");

  wrap.addEventListener("touchstart", e => {
    if (e.changedTouches.length) {
      galleryTouchX = e.changedTouches[0].clientX;
    }
  }, { passive: true });

  wrap.addEventListener("touchend", e => {
    if (!e.changedTouches.length) return;

    const delta = e.changedTouches[0].clientX - galleryTouchX;

    if (Math.abs(delta) > 45) {
      changeGallery(delta < 0 ? 1 : -1);
    }
  }, { passive: true });

  document.addEventListener("keydown", e => {
    if (!$("product-gallery") || $("product-gallery").hidden) return;

    if (e.key === "Escape") closeGallery();
    if (e.key === "ArrowLeft") changeGallery(-1);
    if (e.key === "ArrowRight") changeGallery(1);
  });
}

function openGallery(productId, startIndex = 0) {
  const product = productById(productId);
  if (!product) return;

  const images = getProductImages(product);

  if (!images.length) {
    showToast("У этого товара пока нет фотографий");
    return;
  }

  initGallery();

  galleryProduct = product;
  galleryIndex = Math.max(0, Math.min(startIndex, images.length - 1));

  $("product-gallery").hidden = false;
  document.body.style.overflow = "hidden";

  showGalleryImage();
}

function showGalleryImage() {
  if (!galleryProduct) return;

  const images = getProductImages(galleryProduct);
  if (!images.length) return;

  galleryIndex = (galleryIndex + images.length) % images.length;

  $("gallery-image").src = images[galleryIndex];

  $("gallery-image").alt =
    `${galleryProduct.name || "Товар"} — фото ${galleryIndex + 1}`;

  const multiple = images.length > 1;

  $("gallery-count").textContent =
    `${galleryIndex + 1} / ${images.length}`;

  $("gallery-prev").hidden = !multiple;
  $("gallery-next").hidden = !multiple;
  $("gallery-count").hidden = !multiple;
}

function changeGallery(direction) {
  if (!galleryProduct) return;

  galleryIndex += direction;
  showGalleryImage();
}

function closeGallery() {
  const modal = $("product-gallery");
  if (!modal) return;

  modal.hidden = true;
  document.body.style.overflow = "";
  galleryProduct = null;
}
function renderProducts() {
  const container = $("product-grid");
  if (!container) return;

  const products = filteredProducts();

  if (!products.length) {
    container.innerHTML = `
      <div class="empty-state">
        <h3>Товары не найдены</h3>
        <p>Попробуйте изменить запрос или выбрать другую категорию.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = products.map(p => {
    const images = getProductImages(p);
    const image = images[0] || "";
    const photoCount = images.length;

    return `
      <article class="product-card">
        <div class="product-visual" style="position:relative">
          ${
            image
              ? `<img src="${safe(image)}"
                   alt="${safe(p.name)}"
                   data-gallery="${safe(p.id)}"
                   loading="lazy">`
              : `<div class="product-emoji">${safe(p.emoji || "📦")}</div>`
          }

          ${
            photoCount > 1
              ? `<span class="product-photo-count">▧ ${photoCount} фото</span>`
              : ""
          }
        </div>

        <div class="product-info">
          ${p.brand ? `<div class="product-brand">${safe(p.brand)}</div>` : ""}
          <h3 class="product-title">${safe(p.name || "Товар")}</h3>

          ${
            p.description
              ? `<p class="product-description">${safe(p.description)}</p>`
              : ""
          }

          <div class="product-prices">
            <strong class="product-price">${money(Number(p.price) || 0)}</strong>
            ${
              Number(p.oldPrice) > Number(p.price)
                ? `<del class="product-old-price">${money(Number(p.oldPrice))}</del>`
                : ""
            }
          </div>

          ${
            p.badge
              ? `<div class="product-badge">${safe(p.badge)}</div>`
              : ""
          }

          <button class="btn btn-primary add-to-cart"
            type="button" data-add="${safe(p.id)}">
            В корзину
          </button>
        </div>
      </article>
    `;
  }).join("");
}

function showToast(message) {
  let toast = $("em-toast");

  if (!toast) {
    toast = document.createElement("div");
    toast.id = "em-toast";

    toast.style.cssText = `
      position:fixed;
      bottom:22px;
      left:50%;
      transform:translateX(-50%);
      z-index:10000;
      max-width:90%;
      padding:12px 18px;
      border-radius:12px;
      background:#172033;
      color:white;
      font:14px Arial,sans-serif;
      text-align:center;
      box-shadow:0 5px 24px rgba(0,0,0,.25);
    `;

    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.hidden = false;

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    toast.hidden = true;
  }, 2200);
}

function updateCart() {
  const count = Object.values(cart).reduce((sum, qty) => sum + qty, 0);

  const countElement = $("cart-count");
  if (countElement) countElement.textContent = count;

  const total = Object.entries(cart).reduce((sum, [id, qty]) => {
    const product = productById(id);
    return sum + (product ? Number(product.price || 0) * qty : 0);
  }, 0);

  const totalElement = $("cart-total");
  if (totalElement) totalElement.textContent = money(total);

  const itemsElement = $("cart-items");

  if (itemsElement) {
    const entries = Object.entries(cart).filter(([, qty]) => qty > 0);

    itemsElement.innerHTML = entries.length
      ? entries.map(([id, qty]) => {
          const p = productById(id);
          if (!p) return "";

          return `
            <div class="cart-item">
              <div class="cart-item-info">
                <strong>${safe(p.name)}</strong>
                <div>${money(Number(p.price) || 0)} × ${qty}</div>
              </div>

              <div class="cart-item-actions">
                <button type="button" data-cart-minus="${safe(id)}">−</button>
                <span>${qty}</span>
                <button type="button" data-cart-plus="${safe(id)}">+</button>
                <button type="button" data-cart-remove="${safe(id)}"
                  aria-label="Удалить товар">×</button>
              </div>
            </div>
          `;
        }).join("")
      : `<p class="cart-empty">Корзина пуста</p>`;
  }
}

function addToCart(id) {
  const product = productById(id);

  if (!product) {
    showToast("Товар не найден");
    return;
  }

  cart[id] = (cart[id] || 0) + 1;

  updateCart();
  showToast("Добавлено в корзину");
}

function changeCart(id, delta) {
  if (!cart[id]) return;

  cart[id] += delta;

  if (cart[id] <= 0) delete cart[id];

  updateCart();
}

function removeFromCart(id) {
  delete cart[id];
  updateCart();
}

function checkoutWhatsApp() {
  const entries = Object.entries(cart).filter(([, qty]) => qty > 0);

  if (!entries.length) {
    showToast("Сначала добавьте товары в корзину");
    return;
  }

  let total = 0;

  const lines = entries.map(([id, qty]) => {
    const p = productById(id);
    if (!p) return "";

    const price = Number(p.price) || 0;
    total += price * qty;

    return `${p.name} — ${qty} шт. × ${money(price)} = ${money(price * qty)}`;
  }).filter(Boolean);

  const message = [
    "Здравствуйте! Хочу оформить заказ:",
    "",
    ...lines,
    "",
    `Итого: ${money(total)}`
  ].join("\n");

  const url =
    `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

  window.open(url, "_blank");
}
function bindEvents() {
  document.addEventListener("click", event => {
    const target = event.target.closest("button, [data-gallery]");

    if (!target) return;

    if (target.matches("[data-gallery]")) {
      event.preventDefault();
      openGallery(target.dataset.gallery);
      return;
    }

    if (target.dataset.category) {
      activeCategory = target.dataset.category;
      renderCategories();
      renderProducts();
      return;
    }

    if (target.dataset.add) {
      addToCart(target.dataset.add);
      return;
    }

    if (target.dataset.cartPlus) {
      changeCart(target.dataset.cartPlus, 1);
      return;
    }

    if (target.dataset.cartMinus) {
      changeCart(target.dataset.cartMinus, -1);
      return;
    }

    if (target.dataset.cartRemove) {
      removeFromCart(target.dataset.cartRemove);
      return;
    }

    if (target.id === "checkout-button" ||
        target.id === "checkout" ||
        target.id === "checkout-btn") {
      checkoutWhatsApp();
      return;
    }

    if (target.id === "cart-button" ||
        target.id === "open-cart") {
      const cartElement = $("cart");
      if (cartElement) cartElement.classList.toggle("open");
      return;
    }

    if (target.id === "cart-close" ||
        target.id === "close-cart") {
      const cartElement = $("cart");
      if (cartElement) cartElement.classList.remove("open");
    }
  });

  const search = $("search-input") || $("search");

  if (search) {
    search.addEventListener("input", event => {
      searchTerm = event.target.value || "";
      renderProducts();
    });
  }

  const sort = $("sort-select") || $("sort");

  if (sort) {
    sort.addEventListener("change", event => {
      sortMode = event.target.value || "featured";
      renderProducts();
    });
  }
}

function init() {
  renderCategories();
  renderProducts();
  updateCart();
  initGallery();
  bindEvents();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
