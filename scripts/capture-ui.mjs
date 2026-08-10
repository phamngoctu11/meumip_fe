import { chromium } from 'playwright-core';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const appUrl = 'http://localhost:4200';
const apiUrl = 'http://localhost:8080/api';
const outputRoot = path.resolve('ui-screenshots');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const viewport = { width: 1440, height: 1000 };

const groups = [
  'user-home',
  'user-product',
  'user-cart',
  'user-checkout',
  'user-contact',
  'user-auth',
  'user-orders',
  'admin-dashboard',
  'admin-product',
  'admin-order',
];

for (const group of groups) {
  await mkdir(path.join(outputRoot, group), { recursive: true });
}

const browser = await chromium.launch({
  executablePath: chromePath,
  headless: true,
  args: ['--font-render-hinting=none'],
});

const captured = [];

async function makeContext() {
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: 1,
    locale: 'vi-VN',
    colorScheme: 'light',
    reducedMotion: 'reduce',
  });
  return context;
}

async function waitForUi(page) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(450);
  const publicHeader = page.locator('.site-header:not(.site-header--hidden)');
  if (await publicHeader.isVisible().catch(() => false)) {
    await page
      .locator('.login-link, .account-chip')
      .first()
      .waitFor({ state: 'visible', timeout: 10_000 })
      .catch(() => undefined);
  }
  await page.waitForFunction(
    () =>
      !document.querySelector(
        '.detail-skeleton, .product-skeleton, .cart-loading, .checkout-loading, .orders-loading, .order-loading, .product-loading, .detail-loading, .stats-grid--loading',
      ),
    undefined,
    { timeout: 25_000 },
  ).catch(() => undefined);
  await page.waitForFunction(
    () => Array.from(document.images).every((image) => image.complete),
    undefined,
    { timeout: 25_000 },
  ).catch(() => undefined);
  await page.waitForTimeout(350);
}

async function capture(page, route, group, fileName, readySelector) {
  const response = await page.goto(`${appUrl}${route}`, {
    waitUntil: 'domcontentloaded',
    timeout: 30_000,
  });
  if (response && response.status() >= 400) {
    throw new Error(`${route} returned HTTP ${response.status()}`);
  }
  if (readySelector) {
    await page.locator(readySelector).first().waitFor({ state: 'visible', timeout: 25_000 });
  }
  await waitForUi(page);
  const target = path.join(outputRoot, group, fileName);
  await page.screenshot({ path: target, fullPage: true, animations: 'disabled' });
  captured.push({ route, file: path.relative(process.cwd(), target) });
}

try {
  const guestContext = await makeContext();
  const cartSessionId = 'codex-ui-screenshots';
  await guestContext.addInitScript((sessionId) => {
    localStorage.setItem('meumip_cart_session', sessionId);
  }, cartSessionId);
  const currentCartResponse = await guestContext.request.get(
    `${apiUrl}/cart?sessionId=${encodeURIComponent(cartSessionId)}`,
  );
  const currentCart = await currentCartResponse.json();
  if (!currentCart.data?.itemCount) {
    const cartResponse = await guestContext.request.post(`${apiUrl}/cart/items`, {
      data: { sessionId: cartSessionId, productId: 1, quantity: 1 },
    });
    if (!cartResponse.ok()) {
      throw new Error(`Could not prepare screenshot cart: HTTP ${cartResponse.status()}`);
    }
  }

  const guestPage = await guestContext.newPage();
  await capture(guestPage, '/', 'user-home', 'home.png', '.hero');
  await capture(guestPage, '/products', 'user-product', 'product-list.png', '.products-section');
  await capture(
    guestPage,
    '/products/meumip-01',
    'user-product',
    'product-detail.png',
    '.product-detail',
  );
  await capture(guestPage, '/cart', 'user-cart', 'cart.png', '.cart-layout');
  await capture(guestPage, '/checkout', 'user-checkout', 'checkout.png', '.checkout-layout');
  await capture(guestPage, '/contact', 'user-contact', 'contact.png', '.contact-grid');
  await capture(guestPage, '/login', 'user-auth', 'login.png', '.login-page');
  await capture(guestPage, '/register', 'user-auth', 'register.png', '.login-page');
  await guestContext.close();

  const adminContext = await makeContext();
  const loginResponse = await adminContext.request.post(`${apiUrl}/auth/login`, {
    data: { email: 'admin@meumip.local', password: 'admin' },
  });
  if (!loginResponse.ok()) {
    throw new Error(`Admin login failed: HTTP ${loginResponse.status()}`);
  }

  const productsResponse = await adminContext.request.get(`${apiUrl}/admin/products`);
  const ordersResponse = await adminContext.request.get(`${apiUrl}/admin/orders`);
  if (!productsResponse.ok() || !ordersResponse.ok()) {
    throw new Error('Could not read admin data before taking screenshots.');
  }
  const productsBody = await productsResponse.json();
  const ordersBody = await ordersResponse.json();
  const product = productsBody.data?.[0];
  const order = ordersBody.data?.[0];
  if (!product || !order) {
    throw new Error('A product and an order are required for detail screenshots.');
  }

  const adminPage = await adminContext.newPage();
  await capture(adminPage, '/orders', 'user-orders', 'order-list.png', '.order-list');
  await capture(
    adminPage,
    `/orders/${encodeURIComponent(order.orderCode)}`,
    'user-orders',
    'order-detail.png',
    '.order-grid',
  );
  await capture(adminPage, '/admin', 'admin-dashboard', 'dashboard.png', '.stats-grid');
  await capture(adminPage, '/admin/products', 'admin-product', 'product-list.png', '.product-table-wrap');
  await capture(adminPage, '/admin/products/new', 'admin-product', 'product-create.png', '.form-main');
  await capture(
    adminPage,
    `/admin/products/${product.id}/edit`,
    'admin-product',
    'product-detail-edit.png',
    '.form-main',
  );
  await capture(adminPage, '/admin/orders', 'admin-order', 'order-list.png', '.order-table-wrap');
  await capture(
    adminPage,
    `/admin/orders/${order.id}`,
    'admin-order',
    'order-detail.png',
    '.detail-layout',
  );
  await adminContext.close();
} finally {
  await browser.close();
}

console.log(JSON.stringify({ outputRoot, count: captured.length, captured }, null, 2));
