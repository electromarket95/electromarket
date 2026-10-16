
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
  "Телевизоры", 
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
let detailProductId = null;

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

// ==================================================
// КОРЗИНА: СОХРАНЕНИЕ
// ==================================================

function loadCart() {
  try {
    const saved = JSON.parse(
      localStorage.getItem(CART_STORAGE_KEY) || "{}"
    );

    return saved && typeof saved === "object" &&
      !Array.isArray(saved) ? saved : {};
  } catch (error) {
    console.error("Ошибка загрузки корзины:", error);
    return {};
  }
}

let cart = loadCart();

function saveCart() {
  try {
    localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify(cart)
    );
  } catch (error) {
    console.error("Ошибка сохранения корзины:", error);
    showToast("Не удалось сохранить корзину");
  }
}

// ==================================================
// ТОВАРЫ
// ==================================================

function getProducts() {
  return Array.isArray(window.PRODUCTS)
    ? window.PRODUCTS
    : [];
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

function productSpecs(product) {
  const raw = product.specs || product.features || [];

  if (Array.isArray(raw)) {
    return raw.map(item => {
      if (typeof item === "string") return item;

      if (item && typeof item === "object") {
        return [
          item.name || item.title || "",
          item.value || item.description || ""
        ].filter(Boolean).join(": ");
      }

      return "";
    }).filter(Boolean);
  }

  if (raw && typeof raw === "object") {
    return Object.entries(raw).map(([key, value]) =>
      `${key}: ${value}`
    );
  }

  return typeof raw === "string" && raw.trim()
    ? raw.split(/\n|;/).map(s => s.trim()).filter(Boolean)
    : [];
}

// ==================================================
// ДОПОЛНИТЕЛЬНЫЕ СТИЛИ
// ==================================================

function installStoreStyles() {
  if ($("electromarket-extra-styles")) return;

  const style = document.createElement("style");
  style.id = "electromarket-extra-styles";

  style.textContent = `
    /* Карточки товаров */
    #product-grid.product-grid {
      display: grid !important;
      grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
      gap: 12px !important;
      align-items: stretch;
    }

    .product-card {
      min-width: 0;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      background: #151515 !important;
      border: 1px solid #303030 !important;
      border-radius: 18px !important;
      box-shadow: none !important;
      transform: none !important;
    }

    .product-visual {
      position: relative;
      height: 190px !important;
      min-height: 190px !important;
      flex: 0 0 190px !important;
      overflow: hidden;
      display: grid;
      place-items: center;
      background: #151515 !important;
    }

    .product-visual img {
      width: 100%;
      height: 100%;
      padding: 8px !important;
      object-fit: contain !important;
      cursor: pointer;
    }

    .product-placeholder {
      cursor: pointer;
    }

    .product-badge {
      z-index: 3;
    }

    .product-status-badge {
      position: absolute;
      z-index: 4;
      left: 8px;
      bottom: 8px;
      max-width: calc(100% - 16px);
      padding: 5px 8px;
      border-radius: 8px;
      color: #fff;
      background: #4b5563;
      font-size: 11px;
      font-weight: 800;
      overflow-wrap: anywhere;
    }
    .status-coming_soon { background: #a16207; }
    .status-preorder { background: #075985; }
    .status-out_of_stock { background: #991b1b; }
    .buy-now-button.is-unavailable,
    .add-button.is-unavailable {
      opacity: .55 !important;
      cursor: not-allowed !important;
    }

    .product-info {
      min-width: 0;
      flex: 1;
      display: flex;
      flex-direction: column;
      padding: 12px !important;
    }

    .product-category {
      color: #078cff !important;
      font-size: 10px !important;
      line-height: 1.4;
      overflow-wrap: anywhere;
    }

    .product-title-link {
      margin: 8px 0 16px !important;
      color: #f5f5f5;
      font-size: 15px !important;
      line-height: 1.35 !important;
      overflow-wrap: anywhere;
      cursor: pointer;
    }

    .product-title-link:hover {
      color: #56b5ff;
    }

    .product-desc {
      display: none !important;
    }

    .product-bottom {
      margin-top: auto !important;
      padding-top: 8px;
      display: flex;
      align-items: center;
    }

    .product-price {
      color: #f7f7f7 !important;
      font-size: 21px !important;
      line-height: 1.3;
      font-weight: 800 !important;
      white-space: nowrap;
    }

    .product-old-price {
      color: #999;
      font-size: 12px;
    }

    /* Кнопки каталога: заказ + круглая корзина */
    .product-actions {
      display: grid !important;
      grid-template-columns: minmax(0, 1fr) 48px !important;
      align-items: center !important;
      gap: 8px !important;
      width: 100% !important;
      margin-top: 16px !important;
    }

    .product-actions .buy-now-button {
      grid-column: 1;
      grid-row: 1;
      width: 100% !important;
      min-width: 0 !important;
      min-height: 46px !important;
      padding: 8px 5px !important;
      border: 0 !important;
      border-radius: 28px !important;
      background: #078cff !important;
      color: #17130b !important;
      font-size: 14px !important;
      font-weight: 800 !important;
      line-height: 1.25;
      white-space: normal;
    }

    .product-actions .add-button {
      grid-column: 2;
      grid-row: 1;
      display: grid !important;
      place-items: center !important;
      width: 48px !important;
      height: 48px !important;
      min-width: 48px !important;
      min-height: 48px !important;
      padding: 0 !important;
      border: 2px solid #078cff !important;
      border-radius: 50% !important;
      background: transparent !important;
      color: #078cff !important;
      font-size: 23px !important;
      line-height: 1;
      box-shadow: none !important;
    }

    .product-actions button:active {
      transform: scale(.97);
    }

    /* Окно подробностей товара */
    #product-details[hidden],
    #product-gallery[hidden] {
      display: none !important;
    }

    #product-details {
      position: fixed;
      inset: 0;
      z-index: 100000;
      display: flex;
      align-items: flex-start;
      justify-content: center;
      overflow-y: auto;
      padding: 16px 10px;
      background: rgba(0, 0, 0, .88);
      overscroll-behavior: contain;
    }

    .product-details-panel {
      position: relative;
      width: min(680px, 100%);
      margin: auto;
      overflow: hidden;
      border: 1px solid #303030;
      border-radius: 22px;
      background: #171717;
      color: #f5f5f5;
    }

    .details-close {
      position: absolute;
      z-index: 5;
      top: 12px;
      right: 12px;
      width: 42px;
      height: 42px;
      border: 0;
      border-radius: 50%;
      background: rgba(0, 0, 0, .72);
      color: white;
      font-size: 30px;
    }

    .details-image-wrap {
      width: 100%;
      height: 340px;
      display: grid;
      place-items: center;
      overflow: hidden;
      background: #111;
      cursor: zoom-in;
    }

    .details-image {
      display: block;
      width: 100%;
      height: 100%;
      padding: 8px;
      object-fit: contain;
    }

    .details-image[hidden] {
      display: none !important;
    }

    .details-content {
      padding: 22px;
    }

    .details-category {
      margin-bottom: 10px;
      color: #078cff;
      font-size: 14px;
    }

    .details-title {
      margin: 0 0 18px;
      font-size: clamp(24px, 5vw, 36px);
      line-height: 1.25;
      overflow-wrap: anywhere;
    }

    .details-price {
      margin-bottom: 16px;
      font-size: 34px;
      font-weight: 800;
    }

    .details-old-price {
      margin-top: -8px;
      margin-bottom: 16px;
      color: #999;
      font-size: 14px;
      text-decoration: line-through;
    }

    .details-description {
      color: #c1c1c1;
      font-size: 15px;
      line-height: 1.65;
      white-space: pre-line;
      overflow-wrap: anywhere;
    }

    .details-specs-heading {
      margin: 24px 0 8px;
      color: #aaa;
      font-size: 18px;
    }

    .details-spec {
      padding: 12px 0;
      border-top: 1px solid #343434;
      font-size: 15px;
      line-height: 1.5;
      overflow-wrap: anywhere;
    }

    .details-actions {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) 48px;
      gap: 8px;
      margin-top: 25px;
    }

    .details-actions button,
    .details-phone {
      min-width: 0;
      min-height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 28px;
      font-size: 14px;
      font-weight: 800;
      text-decoration: none;
      cursor: pointer;
    }

    .details-order {
      border: 0;
      background: #16c96b;
      color: #fff;
    }

    .details-cart {
      border: 1px solid #078cff;
      background: transparent;
      color: #078cff;
    }

    .details-phone {
      border: 1px solid #078cff;
      border-radius: 50%;
      background: transparent;
      color: #078cff;
      font-size: 22px;
    }

    /* Полноэкранная галерея */
    #product-gallery {
      position: fixed;
      inset: 0;
      z-index: 100010;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 8px;
      background: rgba(0, 0, 0, .97);
      overscroll-behavior: contain;
    }

    #gallery-wrap {
      position: relative;
      width: 100%;
      height: 100%;
      min-width: 0;
      min-height: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    #gallery-image {
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
      background: rgba(25, 25, 25, .94);
      border: 1px solid rgba(255, 255, 255, .35);
      border-radius: 50%;
      font-size: 30px;
      cursor: pointer;
    }

    #gallery-close {
      top: 8px;
      right: 8px;
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
      background: rgba(25, 25, 25, .94);
      border-radius: 20px;
      font-size: 14px;
      white-space: nowrap;
    }

    @media (max-width: 600px) {
      #product-grid.product-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        gap: 9px !important;
      }

      .product-visual {
        height: 145px !important;
        min-height: 145px !important;
        flex-basis: 145px !important;
      }

      .product-info {
        padding: 9px !important;
      }

      .product-title-link {
        font-size: 13px !important;
        margin: 7px 0 13px !important;
      }

      .product-price {
        font-size: 17px !important;
      }

      .product-actions {
        grid-template-columns: minmax(0, 1fr) 42px !important;
        gap: 6px !important;
      }

      .product-actions .buy-now-button {
        min-height: 43px !important;
        font-size: 12px !important;
      }

      .product-actions .add-button {
        width: 42px !important;
        height: 42px !important;
        min-width: 42px !important;
        min-height: 42px !important;
        font-size: 21px !important;
      }

      #product-details {
        padding: 8px 0;
      }

      .product-details-panel {
        border-radius: 18px;
      }

      .details-image-wrap {
        height: 280px;
      }

      .details-content {
        padding: 18px 16px;
      }

      .details-price {
        font-size: 30px;
      }

      .details-actions {
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) 42px;
        gap: 6px;
      }

      .details-actions button,
      .details-phone {
        min-height: 44px;
        font-size: 12px;
      }

      .details-phone {
        font-size: 20px;
      }
    }
  `;

  document.head.appendChild(style);
}

// ==================================================
// КАТЕГОРИИ И ПОИСК
// ==================================================

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

function productStatus(product) {
  const allowed = ["available", "coming_soon", "preorder", "out_of_stock", "inactive"];
  return allowed.includes(product?.status) ? product.status : "available";
}

function productStatusLabel(product) {
  return ({
    available: "В наличии",
    coming_soon: "Скоро ожидается",
    preorder: "Предзаказ",
    out_of_stock: "Нет в наличии",
    inactive: "Неактивный"
  })[productStatus(product)];
}

function canOrderProduct(product) {
  return ["available", "preorder"].includes(productStatus(product));
}

function filteredProducts() {
  let products = getProducts().filter(product => {
    if (productStatus(product) === "inactive") return false;
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
    products.sort((a, b) =>
      Number(a.price) - Number(b.price)
    );
  }

  if (sortMode === "price-desc") {
    products.sort((a, b) =>
      Number(b.price) - Number(a.price)
    );
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

// ==================================================
// КАРТОЧКИ КАТАЛОГА
// ==================================================

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
          data-product-open="${safe(product.id)}"
          onerror="this.style.display='none'"
        >`
      : `<span
          class="product-placeholder"
          data-product-open="${safe(product.id)}"
        >${safe(product.emoji || "📦")}</span>`;

    return `
      <article class="product-card">
        <div class="product-visual">
          ${product.badge
            ? `<span class="product-badge">${safe(product.badge)}</span>`
            : ""}
          ${productStatus(product) !== "available"
            ? `<span class="product-status-badge status-${safe(productStatus(product))}">${safe(productStatusLabel(product))}</span>`
            : ""}
          ${visual}
          ${images.length > 1
            ? `<span class="product-photo-count">${images.length} фото</span>`
            : ""}
        </div>

        <div class="product-info">
          <span class="product-category">
            ${safe(product.category || "")}
            ${product.brand ? " · " + safe(product.brand) : ""}
          </span>

          <h3
            class="product-title-link"
            data-product-open="${safe(product.id)}"
            role="button"
            tabindex="0"
          >${safe(product.name || "Товар")}</h3>

          <div class="product-bottom">
            <div>
              <div class="product-price">${money(product.price)}</div>
              ${Number(product.oldPrice) > Number(product.price)
                ? `<small class="product-old-price">${money(product.oldPrice)}</small>`
                : ""}
            </div>
          </div>

          <div class="product-actions">
            <button
              type="button"
              class="buy-now-button ${canOrderProduct(product) ? "" : "is-unavailable"}"
              data-buy-now="${safe(product.id)}"
              ${canOrderProduct(product) ? "" : "disabled"}
            >${productStatus(product) === "preorder" ? "Предзаказ" : productStatus(product) === "coming_soon" ? "Скоро" : productStatus(product) === "out_of_stock" ? "Нет в наличии" : "Заказать"}</button>

            <button
              type="button"
              class="add-button ${canOrderProduct(product) ? "" : "is-unavailable"}"
              data-add="${safe(product.id)}"
              aria-label="Добавить в корзину"
              title="Добавить в корзину"
              ${canOrderProduct(product) ? "" : "disabled"}
            >🛒</button>
          </div>
        </div>
      </article>
    `;
  }).join("");

  const empty = $("empty-state");
  if (empty) empty.hidden = products.length > 0;
}

// ==================================================
// ОКНО ПОДРОБНОСТЕЙ ТОВАРА
// ==================================================

function initProductDetails() {
  if ($("product-details")) return;

  const modal = document.createElement("div");
  modal.id = "product-details";
  modal.hidden = true;
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-label", "Подробности товара");

  modal.innerHTML = `
    <div class="product-details-panel">
      <button
        type="button"
        class="details-close"
        aria-label="Закрыть"
      >×</button>

      <div class="details-image-wrap">
        <img class="details-image" alt="">
      </div>

      <div class="details-content">
        <div class="details-category"></div>
        <h2 class="details-title"></h2>
        <div class="details-price"></div>
        <div class="details-old-price" hidden></div>
        <div class="details-description"></div>

        <h3 class="details-specs-heading">Характеристики</h3>
        <div class="details-specs"></div>

        <div class="details-actions">
          <button type="button" class="details-order">Заказать</button>
          <button type="button" class="details-cart">В корзину</button>
          <a
            class="details-phone"
            href="tel:+79298881157"
            aria-label="Позвонить"
          >☎</a>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelector(".details-close").addEventListener(
    "click", closeProductDetails
  );

  modal.addEventListener("click", event => {
    if (event.target === modal) closeProductDetails();
  });

  modal.querySelector(".details-order").addEventListener(
    "click", () => {
      if (detailProductId !== null) {
        buyNow(detailProductId);
      }
    }
  );

  modal.querySelector(".details-cart").addEventListener(
    "click", () => {
      if (detailProductId === null) return;

      addToCart(detailProductId);
      closeProductDetails();
    }
  );

  modal.querySelector(".details-image").addEventListener(
    "click", () => {
      if (detailProductId === null) return;

      const id = detailProductId;
      closeProductDetails();
      openGallery(id);
    }
  );
}

function openProductDetails(id) {
  const product = productById(id);
  if (!product) return;

  initProductDetails();
  detailProductId = product.id;

  const modal = $("product-details");
  const images = getProductImages(product);
  const image = modal.querySelector(".details-image");

  if (images.length) {
    image.src = images[0];
    image.alt = product.name || "Товар";
    image.hidden = false;
  } else {
    image.removeAttribute("src");
    image.hidden = true;
  }

  modal.querySelector(".details-category").textContent =
    [product.brand, product.category].filter(Boolean).join(" · ");

  modal.querySelector(".details-title").textContent =
    product.name || "Товар";

  modal.querySelector(".details-price").textContent =
    money(product.price);

  let statusLine = modal.querySelector(".details-status");
  if (!statusLine) {
    statusLine = document.createElement("div");
    statusLine.className = "details-status";
    modal.querySelector(".details-price").after(statusLine);
  }
  const currentStatus = productStatus(product);
  statusLine.textContent = currentStatus === "available" ? "В наличии" : productStatusLabel(product);
  statusLine.hidden = currentStatus === "available";
  statusLine.style.cssText = "margin:-8px 0 16px;color:#8ecbff;font-weight:700";
  const orderButton = modal.querySelector(".details-order");
  const cartButton = modal.querySelector(".details-cart");
  orderButton.textContent = currentStatus === "preorder" ? "Оформить предзаказ" : "Заказать";
  orderButton.disabled = !canOrderProduct(product);
  cartButton.disabled = !canOrderProduct(product);
  orderButton.style.opacity = cartButton.style.opacity = canOrderProduct(product) ? "1" : ".45";
  orderButton.title = cartButton.title = canOrderProduct(product) ? "" : "Товар временно недоступен для заказа";

  const oldPrice = modal.querySelector(".details-old-price");
  if (Number(product.oldPrice) > Number(product.price)) {
    oldPrice.textContent = money(product.oldPrice);
    oldPrice.hidden = false;
  } else {
    oldPrice.textContent = "";
    oldPrice.hidden = true;
  }

  modal.querySelector(".details-description").textContent =
    product.description || "";

  const specs = productSpecs(product);
  const specsContainer = modal.querySelector(".details-specs");
  const heading = modal.querySelector(".details-specs-heading");

  specsContainer.replaceChildren();

  if (specs.length) {
    specs.forEach(spec => {
      const row = document.createElement("div");
      row.className = "details-spec";
      row.textContent = spec;
      specsContainer.appendChild(row);
    });
    heading.hidden = false;
  } else {
    heading.hidden = true;
  }

  modal.hidden = false;
  document.body.style.overflow = "hidden";
}

function closeProductDetails() {
  const modal = $("product-details");
  if (modal) modal.hidden = true;

  detailProductId = null;

  if (
    (!$("cart-drawer") || $("cart-drawer").hidden) &&
    (!$("product-gallery") || $("product-gallery").hidden)
  ) {
    document.body.style.overflow = "";
  }
}

// ==================================================
// ПОЛНОЭКРАННАЯ ГАЛЕРЕЯ ФОТО
// ==================================================

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
  $("gallery-prev").addEventListener(
    "click", () => changeGallery(-1)
  );
  $("gallery-next").addEventListener(
    "click", () => changeGallery(1)
  );

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

  galleryProduct = null;

  if (
    (!$("cart-drawer") || $("cart-drawer").hidden) &&
    (!$("product-details") || $("product-details").hidden)
  ) {
    document.body.style.overflow = "";
  }
}

// ==================================================
// КОРЗИНА
// ==================================================

function cartItems() {
  return Object.entries(cart)
    .map(([id, qty]) => ({
      product: productById(id),
      qty: Number(qty)
    }))
    .filter(item =>
      item.product &&
      canOrderProduct(item.product) &&
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

  if ($("cart-count")) {
    $("cart-count").textContent = count;
  }

  if ($("cart-count-display")) {
    $("cart-count-display").textContent = count;
  }

  if ($("cart-total")) {
    $("cart-total").textContent = money(total);
  }

  if ($("cart-empty")) {
    $("cart-empty").hidden = items.length > 0;
  }

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
  const product = productById(id);
  if (!product) return;
  if (!canOrderProduct(product)) {
    showToast(productStatus(product) === "coming_soon" ? "Товар скоро появится" : "Товар сейчас недоступен");
    return;
  }

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

  if (
    (!$("product-details") || $("product-details").hidden) &&
    (!$("product-gallery") || $("product-gallery").hidden)
  ) {
    document.body.style.overflow = "";
  }
}

// ==================================================
// ЗАКАЗ WHATSAPP
// ==================================================

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
    items.some(item => productStatus(item.product) === "preorder")
      ? "Здравствуйте! Хочу оформить предзаказ в ЭлектроМаркет."
      : "Здравствуйте! Хочу оформить заказ в ЭлектроМаркет.",
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
  if (!canOrderProduct(product)) {
    showToast(productStatus(product) === "coming_soon" ? "Товар скоро появится" : "Товар сейчас недоступен");
    return;
  }

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

// ==================================================
// УВЕДОМЛЕНИЯ
// ==================================================

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

// ==================================================
// ОБРАБОТЧИКИ
// ==================================================

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

    const openButton = event.target.closest("[data-product-open]");
    if (openButton) {
      openProductDetails(openButton.dataset.productOpen);
    }
  });

  $("product-grid")?.addEventListener("keydown", event => {
    if (event.key !== "Enter" && event.key !== " ") return;

    const title = event.target.closest(".product-title-link");
    if (!title) return;

    event.preventDefault();
    openProductDetails(title.dataset.productOpen);
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
        (Number(cart[id]) || 0) +
        Number(qtyButton.dataset.delta);

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
      } else if (
        $("product-details") && !$("product-details").hidden
      ) {
        closeProductDetails();
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

// ==================================================
// ЗАПУСК МАГАЗИНА
// ==================================================

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