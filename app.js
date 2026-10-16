
"use strict";

const WHATSAPP_NUMBER = "79298881157";
const CART_STORAGE_KEY = "electromarket-cart-v1";

const CATEGORIES = [
  "Все товары",
  "Смартфоны и телефоны",
  "Аксессуары",
  "Планшеты и компьютеры",
  "Электроинструменты",
  "Бытовая техника",
  "Роутеры и связь",
  "Кондиционеры и отопление",
  "Смарт-гаджеты и сеть",
  "Автотовары и электроника",
  "Машинки для стрижки",
  "Прочее"
];

let activeCategory = "Все товары";
let searchTerm = "";
let sortMode = "featured";
let toastTimer;

let galleryProduct = null;
let galleryIndex = 0;
let galleryTouchX = 0;

const $ = id => document.getElementById(id);

const money = value =>
  new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: 0
  }).format(Number(value) || 0) + " ₽";

const safe = value =>
  String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[char]));

// ---------- СОХРАНЕНИЕ КОРЗИНЫ ----------

function loadCart() {
  try {
    const saved = JSON.parse(
      localStorage.getItem(CART_STORAGE_KEY) || "{}"
    );

    return saved && typeof saved === "object" && !Array.isArray(saved)
      ? saved
      : {};
  } catch (error) {
    console.error("Ошибка загрузки корзины:", error);
    return {};
  }
}

let cart = loadCart();

function saveCart() {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  } catch (error) {
    console.error("Ошибка сохранения корзины:", error);
    showToast("Не удалось сохранить корзину браузера");
  }
}

// ---------- ТОВАРЫ ----------

function getProducts() {
  return Array.isArray(window.PRODUCTS) ? window.PRODUCTS : [];
}

function productById(id) {
  return getProducts().find(
    product => String(product.id) === String(id)
  );
}

function getProductImages(product) {
  if (!product) return [];

  const extra = Array.isArray(product.images)
    ? product.images
    : [];

  return [...new Set(
    [product.image, ...extra].filter(
      image => typeof image === "string" && image.trim()
    )
  )];
}

// ---------- СТИЛИ КНОПОК И ФОТОГАЛЕРЕИ ----------

function installStoreStyles() {
  if ($("electromarket-extra-styles")) return;

  const style = document.createElement("style");
  style.id = "electromarket-extra-styles";

  style.textContent = `
    .product-actions {
      display: grid;
      grid-template-columns: 1fr;
      gap: 8px;
      margin-top: 12px;
    }

    .product-actions button {
      width: 100%;
      min-height: 43px;
      border: 0;
      border-radius: 11px;
      padding: 10px 12px;
      font-weight: 700;
      font-size: 14px;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
    }

    .product-actions .add-button {
      background: #20b85a !important;
      color: #fff !important;
      border: 1px solid #20b85a !important;
      opacity: 1 !important;
    }

    .product-actions .buy-now-button {
      background: #0879c9;
      color: #fff;
    }

    .product-actions button:active {
      transform: scale(.98);
    }

    .product-visual img[data-gallery] {
      cursor: zoom-in;
    }

    #product-gallery[hidden] {
      display: none !important;
    }

    #product-gallery {
      position: fixed;
      inset: 0;
      z-index: 99999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 12px;
      background: rgba(0,0,0,.96);
      overscroll-behavior: contain;
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
      user-select: none;
      -webkit-user-drag: none;
    }

    .gallery-control {
      position: absolute;
      z-index: 2;
      display: grid;
      place-items: center;
      min-width: 44px;
      min-height: 44px;
      padding: 4px 12px;
      color: #fff;
      background: rgba(15,27,43,.94);
      border: 1px solid rgba(255,255,255,.35);
      border-radius: 12px;
      font-size: 30px;
      cursor: pointer;
    }

    #gallery-close {
      top: 8px;
      right: 8px;
      border-radius: 50%;
    }

    #gallery-prev {
      left: 4px;
      top: 50%;
      transform: translateY(-50%);
    }

    #gallery-next {
      right: 4px;
      top: 50%;
      transform: translateY(-50%);
    }

    #gallery-count {
      position: absolute;
      bottom: 8px;
      left: 50%;
      transform: translateX(-50%);
      padding: 7px 13px;
      color: white;
      background: rgba(15,27,43,.94);
      border-radius: 20px;
      font-size: 14px;
      white-space: nowrap;
    }

    @media(max-width:600px) {
      .product-actions button {
        min-height: 46px;
        font-size: 14px;
      }

      #product-gallery {
        padding: 5px;
      }

      .gallery-control {
        min-width: 38px;
        min-height: 44px;
        padding: 4px 8px;
      }
    }
  `;

  document.head.appendChild(style);
}

// ---------- КАТЕГОРИИ И ПОИСК ----------

function renderCategories() {
  const container = $("categories");
  if (!container) return;

  container.innerHTML = CATEGORIES.map(category => `
    <button
      class="category-chip ${category === activeCategory ? "active" : ""}"
      data-category="${safe(category)}"
      type="button"
    >${safe(category)}</button>
  `).join("");
}

function filteredProducts() {
  let products = getProducts().filter(product => {
    const categoryMatch =
      activeCategory === "Все товары" ||
      product.category === activeCategory;

    const haystack = [
      product.name,
      product.brand,
      product.category,
      product.description
    ].join(" ").toLocaleLowerCase("ru");

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
      String(a.name || "").localeCompare(
        String(b.name || ""), "ru"
      )
    );
  }

  return products;
}

// ---------- КАРТОЧКИ ТОВАРОВ ----------

function renderProducts() {
  const grid = $("product-grid");
  if (!grid) return;

  const products = filteredProducts();

  grid.innerHTML = products.map(product => {
    const images = getProductImages(product);

    const visual = product.image
      ? `<img
          src="${safe(product.image)}"
          alt="${safe(product.name)}"
          loading="lazy"
          data-gallery="${safe(product.id)}"
          onerror="this.style.display='none'"
        >`
      : `<span class="product-placeholder">${
          safe(product.emoji || "📦")
        }</span>`;

    return `
      <article class="product-card">
        <div class="product-visual">
          ${product.badge
            ? `<span class="product-badge">${
                safe(product.badge)
              }</span>`
            : ""}
          ${visual}
          ${images.length > 1
            ? `<span class="product-photo-count">${
                images.length
              } фото</span>`
            : ""}
        </div>

        <div class="product-info">
          <span class="product-category">
            ${safe(product.category || "")}
            ${product.brand ? " · " + safe(product.brand) : ""}
          </span>

          <h3>${safe(product.name || "Товар")}</h3>

          <p class="product-desc">${
            safe(product.description || "")
          }</p>

          <div class="product-bottom">
            <div>
              <div class="product-price">
                ${money(product.price)}
              </div>
              ${Number(product.oldPrice) > Number(product.price)
                ? `<small style="text-decoration:line-through">
                    ${money(product.oldPrice)}
                  </small>`
                : ""}
            </div>
          </div>

          <div class="product-actions">
            <button
              type="button"
              class="add-button"
              data-add="${safe(product.id)}"
            >＋ В корзину</button>

            <button
              type="button"
              class="buy-now-button"
              data-buy-now="${safe(product.id)}"
            >Заказать сейчас</button>
          </div>
        </div>
      </article>
    `;
  }).join("");

  const empty = $("empty-state");
  if (empty) empty.hidden = products.length > 0;
}

// ---------- ПОЛНОЭКРАННЫЕ ФОТО ----------

function initGallery() {
  if ($("product-gallery")) return;

  const modal = document.createElement("div");
  modal.id = "product-gallery";
  modal.hidden = true;
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-label", "Фотографии товара");

  modal.innerHTML = `
    <div id="gallery-wrap">
      <button
        id="gallery-close"
        class="gallery-control"
        type="button"
        aria-label="Закрыть"
      >×</button>

      <button
        id="gallery-prev"
        class="gallery-control"
        type="button"
        aria-label="Предыдущее фото"
      >‹</button>

      <img id="gallery-image" alt="">

      <button
        id="gallery-next"
        class="gallery-control"
        type="button"
        aria-label="Следующее фото"
      >›</button>

      <div id="gallery-count"></div>
    </div>
  `;

  document.body.appendChild(modal);

  $("gallery-close").addEventListener("click", closeGallery);
  $("gallery-prev").addEventListener("click", () => changeGallery(-1));
  $("gallery-next").addEventListener("click", () => changeGallery(1));

  modal.addEventListener("click", event => {
    if (event.target === modal) closeGallery();
  });

  const wrap = $("gallery-wrap");

  wrap.addEventListener("touchstart", event => {
    if (event.changedTouches.length) {
      galleryTouchX = event.changedTouches[0].clientX;
    }
  }, { passive: true });

  wrap.addEventListener("touchend", event => {
    if (!event.changedTouches.length) return;

    const delta =
      event.changedTouches[0].clientX - galleryTouchX;

    if (Math.abs(delta) > 45) {
      changeGallery(delta < 0 ? 1 : -1);
    }
  }, { passive: true });
}

function openGallery(productId) {
  const product = productById(productId);
  if (!product) return;

  const images = getProductImages(product);
  if (!images.length) {
    showToast("У этого товара нет фотографии");
    return;
  }

  initGallery();
  galleryProduct = product;
  galleryIndex = 0;

  $("product-gallery").hidden = false;
  document.body.style.overflow = "hidden";

  showGalleryImage();
}

function showGalleryImage() {
  if (!galleryProduct) return;

  const images = getProductImages(galleryProduct);
  if (!images.length) return;

  galleryIndex =
    (galleryIndex + images.length) % images.length;

  $("gallery-image").src = images[galleryIndex];
  $("gallery-image").alt =
    `${galleryProduct.name || "Товар"} — фото ${galleryIndex + 1}`;

  $("gallery-count").textContent =
    `${galleryIndex + 1} / ${images.length}`;

  $("gallery-prev").hidden = images.length < 2;
  $("gallery-next").hidden = images.length < 2;
  $("gallery-count").hidden = images.length < 2;
}

function changeGallery(direction) {
  if (!galleryProduct) return;

  galleryIndex += direction;
  showGalleryImage();
}

function closeGallery() {
  const modal = $("product-gallery");
  if (modal) modal.hidden = true;

  document.body.style.overflow = "";
  galleryProduct = null;
}

// ---------- КОРЗИНА ----------

function cartItems() {
  return Object.entries(cart)
    .map(([id, qty]) => ({
      product: productById(id),
      qty: Number(qty)
    }))
    .filter(item =>
      item.product &&
      Number.isFinite(item.qty) &&
      item.qty > 0
    );
}

function renderCart() {
  const items = cartItems();

  const count = items.reduce(
    (sum, item) => sum + item.qty, 0
  );

  const total = items.reduce(
    (sum, item) =>
      sum + Number(item.product.price || 0) * item.qty,
    0
  );

  if ($("cart-count")) $("cart-count").textContent = count;
  if ($("cart-count-display")) {
    $("cart-count-display").textContent = count;
  }
  if ($("cart-total")) $("cart-total").textContent = money(total);
  if ($("cart-empty")) $("cart-empty").hidden = items.length > 0;

  if ($("cart-items")) {
    $("cart-items").innerHTML = items.map(({ product, qty }) => `
      <div class="cart-row">
        <div>
          <h3>${safe(product.name)}</h3>
          <small>${money(product.price)} за шт.</small>

          <div class="quantity">
            <button
              type="button"
              data-qty="${safe(product.id)}"
              data-delta="-1"
              aria-label="Уменьшить количество"
            >−</button>

            <span>${qty}</span>

            <button
              type="button"
              data-qty="${safe(product.id)}"
              data-delta="1"
              aria-label="Увеличить количество"
            >+</button>
          </div>
        </div>

        <div class="cart-row-price">
          ${money(Number(product.price) * qty)}
          <br>
          <button
            type="button"
            class="remove-item"
            data-remove="${safe(product.id)}"
          >Удалить</button>
        </div>
      </div>
    `).join("");
  }

  if ($("checkout")) {
    $("checkout").disabled = items.length === 0;
    $("checkout").style.opacity =
      items.length === 0 ? ".5" : "1";
  }
}

function addToCart(id) {
  if (!productById(id)) return;

  cart[id] = (Number(cart[id]) || 0) + 1;

  saveCart();
  renderCart();
  showToast("Товар добавлен в корзину");
}

function openCart() {
  if (!$("cart-drawer")) return;

  $("cart-drawer").hidden = false;
  document.body.style.overflow = "hidden";
}

function closeCart() {
  if (!$("cart-drawer")) return;

  $("cart-drawer").hidden = true;
  document.body.style.overflow = "";
}

// ---------- ЗАКАЗ В WHATSAPP ----------

function sendWhatsAppOrder(items, customerName = "", note = "") {
  if (!items.length) {
    showToast("Нет товаров для заказа");
    return;
  }

  const total = items.reduce(
    (sum, item) =>
      sum + Number(item.product.price || 0) * item.qty,
    0
  );

  const lines = items.map(({ product, qty }, index) =>
    `${index + 1}. ${product.name} — ${qty} шт. × ${money(product.price)} = ${money(Number(product.price) * qty)}`
  );

  const message = [
    "Здравствуйте! Хочу оформить заказ в ЭлектроМаркет.",
    "",
    ...lines,
    "",
    `Итого: ${money(total)}`,
    customerName ? `Имя: ${customerName}` : "",
    note ? `Комментарий: ${note}` : "",
    "",
    "Пожалуйста, уточните наличие и условия получения."
  ].filter(Boolean).join("\n");

  const url =
    `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

  window.open(url, "_blank");
}

function buyNow(id) {
  const product = productById(id);
  if (!product) return;

  sendWhatsAppOrder([{ product, qty: 1 }]);
}

function checkout() {
  const items = cartItems();
  if (!items.length) {
    showToast("Сначала добавьте товары в корзину");
    return;
  }

  const name = $("customer-name")?.value.trim() || "";
  const note = $("customer-note")?.value.trim() || "";

  sendWhatsAppOrder(items, name, note);
}

// ---------- УВЕДОМЛЕНИЯ ----------

function showToast(message) {
  const toast = $("toast");
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2200);
}

// ---------- ОБРАБОТЧИКИ ----------

function bindEvents() {
  $("categories")?.addEventListener("click", event => {
    const button = event.target.closest("[data-category]");
    if (!button) return;

    activeCategory = button.dataset.category;
    renderCategories();
    renderProducts();
  });

  $("product-grid")?.addEventListener("click", event => {
    const addButton = event.target.closest("[data-add]");
    if (addButton) {
      addToCart(addButton.dataset.add);
      return;
    }

    const buyButton = event.target.closest("[data-buy-now]");
    if (buyButton) {
      buyNow(buyButton.dataset.buyNow);
      return;
    }

    const image = event.target.closest("[data-gallery]");
    if (image) openGallery(image.dataset.gallery);
  });

  $("search")?.addEventListener("input", event => {
    searchTerm = event.target.value.trim();
    renderProducts();
  });

  $("sort")?.addEventListener("change", event => {
    sortMode = event.target.value;
    renderProducts();
  });

  $("cart-open")?.addEventListener("click", openCart);
  $("cart-close")?.addEventListener("click", closeCart);

  $("cart-drawer")?.addEventListener("click", event => {
    if (event.target === $("cart-drawer")) closeCart();
  });

  $("cart-items")?.addEventListener("click", event => {
    const qtyButton = event.target.closest("[data-qty]");
    const removeButton = event.target.closest("[data-remove]");

    if (qtyButton) {
      const id = qtyButton.dataset.qty;

      cart[id] =
        (Number(cart[id]) || 0) + Number(qtyButton.dataset.delta);

      if (cart[id] <= 0) delete cart[id];

      saveCart();
      renderCart();
      return;
    }

    if (removeButton) {
      delete cart[removeButton.dataset.remove];

      saveCart();
      renderCart();
    }
  });

  $("checkout")?.addEventListener("click", checkout);

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      if ($("product-gallery") && !$("product-gallery").hidden) {
        closeGallery();
      } else {
        closeCart();
      }
    }

    if ($("product-gallery") && !$("product-gallery").hidden) {
      if (event.key === "ArrowLeft") changeGallery(-1);
      if (event.key === "ArrowRight") changeGallery(1);
    }
  });

  if ($("year")) {
    $("year").textContent = new Date().getFullYear();
  }
}

// ---------- ЗАПУСК ----------

function initStore() {
  installStoreStyles();
  bindEvents();
  renderCategories();
  renderProducts();
  renderCart();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initStore);
} else {
  initStore();
}
