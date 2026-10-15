const WHATSAPP_NUMBER = "79298881157";
const CATEGORIES = ["Все товары","Смартфоны","Аксессуары","Планшеты и компьютеры","Электроинструменты","Бытовая техника","Кондиционеры","Смарт-гаджеты и сеть"];
let activeCategory = "Все товары";
let searchTerm = "";
let sortMode = "featured";
let cart = {};
let toastTimer;

const $ = (id) => document.getElementById(id);
const money = (n) => new Intl.NumberFormat("ru-RU", {maximumFractionDigits:0}).format(n) + " ₽";
const safe = (value) => String(value ?? "").replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
const productById = (id) => window.PRODUCTS.find(p => p.id === id);

function renderCategories(){
  $("categories").innerHTML = CATEGORIES.map(category =>
    `<button class="category-chip ${category === activeCategory ? "active" : ""}" data-category="${safe(category)}" type="button">${safe(category)}</button>`
  ).join("");
}
function filteredProducts(){
  let products = window.PRODUCTS.filter(p => {
    const categoryMatch = activeCategory === "Все товары" || p.category === activeCategory;
    const haystack = `${p.name} ${p.brand} ${p.category} ${p.description}`.toLocaleLowerCase("ru");
    return categoryMatch && haystack.includes(searchTerm.toLocaleLowerCase("ru"));
  });
  if(sortMode === "price-asc") products.sort((a,b) => a.price-b.price);
  if(sortMode === "price-desc") products.sort((a,b) => b.price-a.price);
  if(sortMode === "name") products.sort((a,b) => a.name.localeCompare(b.name,"ru"));
  return products;
}
function renderProducts(){
  const products = filteredProducts();
  $("product-grid").innerHTML = products.map(p => {
    const visual = p.image
      ? `<img src="${safe(p.image)}" alt="${safe(p.name)}" loading="lazy" onerror="this.remove()">`
      : `<span class="product-placeholder" aria-hidden="true">${safe(p.emoji || "📦")}</span>`;
    return `<article class="product-card">
      <div class="product-visual">${p.badge ? `<span class="product-badge">${safe(p.badge)}</span>` : ""}${visual}</div>
      <div class="product-info"><span class="product-category">${safe(p.category)} · ${safe(p.brand)}</span>
        <h3>${safe(p.name)}</h3><p class="product-desc">${safe(p.description || "")}</p>
        <div class="product-bottom"><div><div class="product-price">${money(p.price)}</div>${p.oldPrice > p.price ? `<small style="color:#8a929e;text-decoration:line-through;font-size:10px">${money(p.oldPrice)}</small>` : ""}</div>
        <button class="add-button" data-add="${safe(p.id)}" aria-label="Добавить ${safe(p.name)} в корзину" title="Добавить в корзину">+</button></div>
      </div></article>`;
  }).join("");
  $("empty-state").hidden = products.length > 0;
}
function cartItems(){
  return Object.entries(cart).map(([id,qty]) => ({product:productById(id),qty})).filter(item => item.product && item.qty > 0);
}
function renderCart(){
  const items = cartItems();
  const count = items.reduce((sum,item) => sum + item.qty,0);
  const total = items.reduce((sum,item) => sum + item.product.price*item.qty,0);
  $("cart-count").textContent = count;
  $("cart-total").textContent = money(total);
  $("cart-empty").hidden = items.length > 0;
  $("cart-items").innerHTML = items.map(({product:p,qty}) => `<div class="cart-row">
    <div><h3>${safe(p.name)}</h3><small>${money(p.price)} за шт.</small>
      <div class="quantity"><button data-qty="${safe(p.id)}" data-delta="-1" aria-label="Уменьшить количество">−</button><span>${qty}</span><button data-qty="${safe(p.id)}" data-delta="1" aria-label="Увеличить количество">+</button></div></div>
    <div class="cart-row-price">${money(p.price*qty)}<br><button class="remove-item" data-remove="${safe(p.id)}">Удалить</button></div>
  </div>`).join("");
  $("checkout").disabled = items.length === 0;
  $("checkout").style.opacity = items.length === 0 ? ".5" : "1";
}
function showToast(message){
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
}
function openCart(){
  $("cart-drawer").hidden = false;
  document.body.style.overflow = "hidden";
  $("cart-close").focus();
}
function closeCart(){
  $("cart-drawer").hidden = true;
  document.body.style.overflow = "";
  $("cart-open").focus();
}
function addToCart(id){
  if(!productById(id)) return;
  cart[id] = (cart[id] || 0) + 1;
  renderCart();
  showToast("Добавлено в корзину");
}
function checkout(){
  const items = cartItems();
  if(!items.length){showToast("Сначала добавьте товары в корзину");return;}
  const name = $("customer-name").value.trim();
  const note = $("customer-note").value.trim();
  const total = items.reduce((sum,item) => sum + item.product.price*item.qty,0);
  const lines = items.map(({product:p,qty},i) => `${i+1}. ${p.name} — ${qty} шт. × ${money(p.price)} = ${money(p.price*qty)}`);
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
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}
$("categories").addEventListener("click", e => {
  const button = e.target.closest("[data-category]");
  if(!button) return;
  activeCategory = button.dataset.category;
  renderCategories(); renderProducts();
});
$("product-grid").addEventListener("click", e => {
  const button = e.target.closest("[data-add]");
  if(button) addToCart(button.dataset.add);
});
$("search").addEventListener("input", e => {searchTerm=e.target.value.trim();renderProducts();});
$("sort").addEventListener("change", e => {sortMode=e.target.value;renderProducts();});
$("cart-open").addEventListener("click", openCart);
$("cart-close").addEventListener("click", closeCart);
$("cart-drawer").addEventListener("click", e => {if(e.target === $("cart-drawer")) closeCart();});
$("cart-items").addEventListener("click", e => {
  const qtyButton = e.target.closest("[data-qty]");
  const removeButton = e.target.closest("[data-remove]");
  if(qtyButton){
    const id=qtyButton.dataset.qty; cart[id]=(cart[id]||0)+Number(qtyButton.dataset.delta);
    if(cart[id]<=0) delete cart[id];
    renderCart();
  }
  if(removeButton){delete cart[removeButton.dataset.remove];renderCart();}
});
$("checkout").addEventListener("click", checkout);
document.addEventListener("keydown", e => {if(e.key==="Escape" && !$("cart-drawer").hidden) closeCart();});
$("year").textContent = new Date().getFullYear();
renderCategories(); renderProducts(); renderCart();
