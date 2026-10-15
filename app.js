/* ELECTROMARKET — DARK GRAPHITE / ELECTRIC BLUE THEME
   Add this entire file to the VERY END of styles.css. Do not replace existing styles. */
:root {
  color-scheme: dark;
  --ink: #f3f6fc;
  --muted: #a5afc1;
  --line: #293346;
  --paper: #0b0f17;
  --white: #121926;
  --blue: #28a9f5;
  --blue-dark: #0879c9;
  --green: #25d366;
  --radius: 22px;
  --shadow: 0 14px 42px rgba(0,0,0,.28);
}
html { background:#0b0f17 !important; color-scheme:dark; }
body { background:#0b0f17 !important; color:#f3f6fc !important; }
body, main, section, header, footer, nav, article, aside,
.container, .wrap, .page, .content, .hero, .catalog, .products-section {
  color:inherit;
}
header, .header, .site-header, .topbar, .navbar, nav {
  background:rgba(13,18,29,.96) !important;
  color:#f3f6fc !important;
  border-color:#293346 !important;
}
header *, .header *, .site-header *, .topbar *, .navbar *, nav * { color:inherit; }
main, section, .section, .catalog, .products-section, .categories-section {
  background-color:transparent;
}
.hero, .hero-section, .hero-content, .banner, .promo, .benefit, .benefits,
.feature, .feature-card, .info-card, .contact-card, .social-block {
  color:#f3f6fc !important;
}
.hero, .hero-section, .banner, .promo {
  background:radial-gradient(ellipse at 85% 15%,rgba(28,153,230,.18),transparent 48%),linear-gradient(135deg,#101827,#0b0f17 70%) !important;
}
h1,h2,h3,h4,h5,h6,p,label,small,li,dt,dd { color:inherit; }
body p, .muted, .subtitle, .description, .product-description { color:#a5afc1; }
.card, .product-card, .product, .category-card, .benefit-card, .feature-card,
.info-card, .cart, .cart-panel, .modal, .dialog, .dropdown-menu, .search-box,
input, textarea, select {
  background:#121926 !important;
  color:#f3f6fc !important;
  border-color:#293346 !important;
}
.product-card, .product, .card, .category-card, .benefit-card, .feature-card {
  box-shadow:0 10px 28px rgba(0,0,0,.22) !important;
}
input::placeholder, textarea::placeholder { color:#8793a8 !important; }
button, .button, .btn, a.button, a.btn, .primary-button, .checkout-button {
  background:#087fce !important;
  color:#fff !important;
  border-color:#168fdf !important;
}
button:hover, .button:hover, .btn:hover, a.button:hover, a.btn:hover {
  background:#1298ed !important;
}
a { color:#55bdff; }
a:hover { color:#8bd3ff; }
.price, .product-price, .current-price, .sale-price { color:#62c4ff !important; }
.badge, .tag, .label, .discount, .sale-badge {
  border-color:rgba(40,169,245,.35) !important;
}
hr, .divider, .separator { border-color:#293346 !important; }
footer, .footer, .site-footer {
  background:#080b11 !important;
  color:#a5afc1 !important;
  border-color:#293346 !important;
}
footer *, .footer *, .site-footer * { color:inherit; }
img { color:#a5afc1; }
::selection { background:#087fce; color:#fff; }
@media (prefers-reduced-motion: no-preference) {
  .product-card, .product, .card, button, .btn, .button { transition:background-color .18s ease,border-color .18s ease,transform .18s ease; }
  .product-card:hover, .product:hover { transform:translateY(-2px); }
}