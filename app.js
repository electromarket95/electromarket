
const WHATSAPP_NUMBER = "79298881157";

const CATEGORIES = [
  "Все товары",
  "Смартфоны",
  "Аксессуары",
  "Планшеты и компьютеры",
  "Электроинструменты",
  "Бытовая техника",
  "Кондиционеры",
  "Смарт-гаджеты и сеть"
];

let activeCategory = "Все товары";
let searchTerm = "";
let sortMode = "featured";
let cart = {};
let toastTimer;

const $ = id => document.getElementById(id);
const money = n =>
  new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(n) + " ₽";

const safe = value =>
  String(value ?? "").replace(/[&<>"']/g, ch => ({
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

    return categoryMatch && haystack.includes(searchTerm.toLocaleLowerCase("ru"));
  });

  if (sortMode === "price-asc") {
    products.sort((a, b) => Number(a.price) - Number(b.price));
  }

  if (sortMode === "price-desc") {
    products.sort((a, b) => Number(b.price) - Number(a.price));
  }

  if (sortMode === "name") {
    products.sort((a, b) => (a.name || "").localeCompare(b.name || "", "ru"));
  }

  return products;
}

function renderProducts() {
  const grid = $("product-grid");
  if (!grid) return;

  const products = filteredProducts();

  grid.innerHTML = products.map(p => {
    const visual = p.image
      ? `<img src="${safe(p.image)}" alt="${safe(p.name)}" loading="lazy"
          onerror="this.remove()">`
      : `<span class="product-placeholder">${safe(p.emoji || "📦")}</span>`;

    return `
      <article class="product-card">
        <div class="product-visual">
          ${p.badge ? `<span class="product-badge">${safe(p.badge)}</span>` : ""}
          ${visual}
        </div>
        <div class="product-info">
          <span class="product-category">${safe(p.category || "")} · ${safe(p.brand || "")}</span>
          <h3>${safe(p.name || "Товар")}</h3>
          <p class="product-desc">${safe(p.description || "")}</p>
          <div class="product-bottom">
            <div>
              <div class="product-price">${money(Number(p.price) || 0)}</div>
              ${Number(p.oldPrice) > Number(p.price)
                ? `<small style="text-decoration:line-through">${money(Number(p.oldPrice))}</small>`
                : ""}
            </div>
            <button class="add-button" data-add="${safe(p.id)}"
              type="button" aria-label="Добавить в корзину">+</button>
          </div>
        </div>
      </article>`;
  }).join("");

  const empty = $("empty-state");
  if (empty) empty.hidden = products.length > 0;
}

function cartItems() {
  return Object.entries(cart)
    .map(([id, qty]) => ({ product: productById(id), qty }))
    .filter(item => item.product && item.qty > 0);
}

function renderCart() {
  const items = cartItems();
  const count = items.reduce((sum, item) => sum + item.qty, 0);
  const total = items.reduce(
    (sum, item) => sum + Number(item.product.price) * item.qty, 0
  );

  if ($("cart-count")) $("cart-count").textContent = count;
  if ($("cart-count-display")) $("cart-count-display").textContent = count;
  if ($("cart-total")) $("cart-total").textContent = money(total);
  if ($("cart-empty")) $("cart-empty").hidden = items.length > 0;

  if ($("cart-items")) {
    $("cart-items").innerHTML = items.map(({ product: p, qty }) => `
      <div class="cart-row">
        <div>
          <h3>${safe(p.name)}</h3>
          <small>${money(Number(p.price))} за шт.</small>
          <div class="quantity">
            <button type="button" data-qty="${safe(p.id)}" data-delta="-1">−</button>
            <span>${qty}</span>
            <button type="button" data-qty="${safe(p.id)}" data-delta="1">+</button>
          </div>
        </div>
        <div class="cart-row-price">
          ${money(Number(p.price) * qty)}
          <br>
          <button type="button" class="remove-item" data-remove="${safe(p.id)}">Удалить</button>
        </div>
      </div>`).join("");
  }

  if ($("checkout")) $("checkout").disabled = items.length === 0;
}

function showToast(message) {
  const toast = $("toast");
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
}

function openCart() {
  const drawer = $("cart-drawer");
  if (!drawer) {
    showToast("Не найдена панель корзины");
    return;
  }

  drawer.hidden = false;
  drawer.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeCart() {
  const drawer = $("cart-drawer");
  if (!drawer) return;

  drawer.hidden = true;
  drawer.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

function addToCart(id) {
  if (!productById(id)) {
    showToast("Не удалось найти товар");
    return;
  }

  cart[id] = (cart[id] || 0) + 1;
  renderCart();
  showToast("Добавлено в корзину");
}

function checkout() {
  const items = cartItems();

  if (!items.length) {
    showToast("Сначала добавьте товары в корзину");
    return;
  }

  const name = $("customer-name")?.value.trim() || "";
  const note = $("customer-note")?.value.trim() || "";

  const total = items.reduce(
    (sum, item) => sum + Number(item.product.price) * item.qty, 0
  );

  const lines = items.map(({ product: p, qty }, i) =>
    `${i + 1}. ${p.name} — ${qty} шт. × ${money(Number(p.price))} = ${money(Number(p.price) * qty)}`
  );

  const message = [
    "Здравствуйте! Хочу оформить заказ в ЭлектроМаркет.",
    "",
    ...lines,
    "",
    `Итого: ${money(total)}`,
    name ? `Имя: ${name}` : "",
    note ? `Комментарий: ${note}` : "",
    "",
    "Пожалуйста, уточните наличие и условия получения."
  ].filter(Boolean).join("\n");

  window.open(
    `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`,
    "_blank"
  );
}

function bindEvents() {
  $("categories")?.addEventListener("click", event => {
    const button = event.target.closest("[data-category]");
    if (!button) return;

    activeCategory = button.dataset.category;
    renderCategories();
    renderProducts();
  });

  $("product-grid")?.addEventListener("click", event => {
    const button = event.target.closest("[data-add]");
    if (button) addToCart(button.dataset.add);
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
      cart[id] = (cart[id] || 0) + Number(qtyButton.dataset.delta);

      if (cart[id] <= 0) delete cart[id];
      renderCart();
    }

    if (removeButton) {
      delete cart[removeButton.dataset.remove];
      renderCart();
    }
  });

  $("checkout")?.addEventListener("click", checkout);

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeCart();
  });

  $("year") && ($("year").textContent = new Date().getFullYear());
}

function initStore() {
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
