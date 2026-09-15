// Browser checks use intercepted API fixtures; no real orders or accounts are created.
// Start the app first: npm start -- --host 127.0.0.1
// Run: node scripts/verify-storefront.mjs
import { chromium } from 'playwright-core';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';

const base = process.env.APP_URL || 'http://127.0.0.1:4200';
const output = 'ui-screenshots-mobile/redesign';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: true });
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
const errors = [];
const requests = [];
let failProducts = false;
let showSlides = true;
let authenticatedAdmin = false;
let checkoutRequest = null;
const products = Array.from({ length: 125 }, (_, i) => ({
  id: i + 1, type: ['BLANK', 'KIT', 'MATERIAL'][i % 3], typeLabel: ['Phôi', 'Bộ kit', 'Nguyên liệu'][i % 3],
  name: ['Mèo mơ màng', 'Một vườn hoa nhỏ', 'Màu hồng kẹo ngọt', 'Thỏ ôm trái tim', 'Ngôi sao bé xinh'][i % 5] + ' ' + (i + 1),
  priceVnd: (126 - i) * 1000, primaryImageUrl: '/images/product-placeholder.svg', images: [], tags: i % 2 ? ['Khu vườn nhỏ'] : ['Mèo và thỏ'],
  description: 'Một món bé xinh dành cho góc sáng tạo của bạn.', kitComponents: [], includedBlankCount: 1,
}));
let cart = { id: 1, sessionId: 'storefront-browser-test', items: [], subtotalVnd: 0, itemCount: 0 };
const slideFixtures = [1, 2, 3].map(id => ({ id, title: ['Một chút dễ thương mỗi ngày', 'Tự tay làm nên điều bé xinh', 'Gói ghém một món quà nhỏ'][id - 1], eyebrow: 'meumip handmade', description: 'Khám phá những món đồ dành cho góc sáng tạo của bạn.', imageUrl: '/images/product-placeholder.svg', linkUrl: id === 3 ? 'https://www.instagram.com/' : '/products', linkLabel: 'Ghé xem cùng Mip', sortOrder: id, active: true }));
await context.route('**/api/**', async route => {
  const req = route.request();
  const url = new URL(req.url());
  requests.push(url.pathname + url.search);
  let data = null;
  if (url.pathname === '/api/auth/csrf') data = { headerName: 'X-CSRF-TOKEN', token: 'browser-csrf' };
  else if (url.pathname === '/api/auth/me') {
    if (!authenticatedAdmin) return route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ success: false, message: 'Guest fixture' }) });
    data = { id: 1, email: 'admin@example.com', displayName: 'Admin', avatarUrl: null, role: 'ADMIN' };
  }
  else if (url.pathname === '/api/home/slides') data = showSlides ? slideFixtures : [];
  else if (url.pathname === '/api/products') {
    if (failProducts) return route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ success: false, message: 'Fixture outage' }) });
    let list = [...products].reverse();
    if (url.searchParams.get('type')) list = list.filter(p => p.type === url.searchParams.get('type'));
    const page = Number(url.searchParams.get('page') || 0);
    const size = Math.min(100, Number(url.searchParams.get('size') || 100));
    data = list.slice(page * size, (page + 1) * size);
  } else if (/\/api\/products\/\d+$/.test(url.pathname)) data = products.find(p => p.id === Number(url.pathname.split('/').pop()));
  else if (url.pathname === '/api/cart/items' && req.method() === 'POST') {
    assert.equal(req.headers()['x-csrf-token'], 'browser-csrf', 'Cart write includes CSRF token');
    const body = req.postDataJSON();
    const product = products.find(p => p.id === body.productId);
    cart = { ...cart, items: [{ id: 1, itemType: product.type, itemTypeLabel: product.typeLabel, productId: product.id, productName: product.name, imageUrl: product.primaryImageUrl, unitPriceVnd: product.priceVnd, quantity: body.quantity, lineTotalVnd: product.priceVnd * body.quantity, selectedBlanks: [] }], itemCount: body.quantity, subtotalVnd: product.priceVnd * body.quantity };
    data = cart;
  } else if (url.pathname === '/api/cart') data = cart;
  else if (url.pathname === '/api/checkout') {
    assert.equal(req.headers()['x-csrf-token'], 'browser-csrf', 'Checkout includes CSRF token');
    checkoutRequest = req.postDataJSON();
    data = { order: { orderCode: 'TEST-001', customerEmail: checkoutRequest.email }, payment: { amountVnd: cart.subtotalVnd, bankCode: 'TEST BANK', bankAccountNumber: 'TEST ONLY', bankAccountName: 'TEST FIXTURE', transferContent: 'TEST-001', qrImageUrl: null } };
    cart = { ...cart, items: [], itemCount: 0, subtotalVnd: 0 };
  }
  await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ success: true, data }) });
});
const page = await context.newPage();
page.on('pageerror', error => errors.push(error.message));
async function ready() { await page.locator('app-catalog .product-card').first().waitFor(); await page.evaluate(() => document.fonts.ready); }
async function noOverflow(label) {
  const dimensions = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, content: document.documentElement.scrollWidth }));
  assert.ok(dimensions.content <= dimensions.viewport, `${label}: horizontal overflow ${JSON.stringify(dimensions)}`);
}
async function waitFor(check, message) {
  for (let i = 0; i < 40; i++) { if (await check()) return; await page.waitForTimeout(100); }
  throw Error(message);
}
async function captureTop(file, fullPage = true) {
  await page.evaluate(() => { document.activeElement?.blur(); window.scrollTo({ top: 0, behavior: 'instant' }); });
  await page.waitForTimeout(100);
  await page.screenshot({ path: output + '/' + file, fullPage });
}
try {
  await page.goto(base);
  await ready();
  assert.ok(requests.some(url => url.includes('page=1')), 'Read beyond first 100 products');
  assert.equal(await page.locator('.product-card').count(), 12);
  await noOverflow('390 home');
  await captureTop('home-390.png');
  await captureTop('home-390-viewport.png', false);

  await page.getByRole('button', { name: 'Mở menu', exact: true }).click();
  assert.equal(await page.locator('#shop-drawer').evaluate(el => el.open), true);
  assert.equal(await page.evaluate(() => document.body.style.overflow), 'hidden');
  const drawerDimensions = await page.locator('#shop-drawer').evaluate(el => [el.scrollHeight, el.clientHeight]);
  assert.ok(drawerDimensions[0] > drawerDimensions[1], 'Drawer scrolls independently');
  await page.screenshot({ path: output + '/menu-390.png' });
  await page.keyboard.press('Escape');
  await waitFor(() => page.evaluate(() => document.body.style.overflow === ''), 'Escape unlocks body scroll');
  assert.equal(await page.evaluate(() => document.activeElement?.getAttribute('aria-label')), 'Mở menu');

  await page.getByRole('button', { name: 'Mở menu', exact: true }).click();
  await page.locator('#shop-drawer').getByRole('button', { name: 'Ví voucher', exact: true }).click();
  await page.locator('.voucher-dialog[open]').waitFor();
  await page.waitForTimeout(100);
  assert.equal(await page.evaluate(() => document.body.style.overflow), 'hidden', 'Drawer-to-voucher transition remains locked');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Khám phá quà tặng thành viên' }).click();
  await page.locator('.voucher-dialog[open]').waitFor();
  assert.ok((await page.locator('.voucher-dialog').innerText()).includes('Sắp ra mắt'));
  await page.screenshot({ path: output + '/voucher-390.png' });
  await page.keyboard.press('Escape');

  await page.getByRole('button', { name: 'Hiển thị 3 cột' }).click();
  await waitFor(async () => (await page.locator('.products-grid').evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' ').length)) === 3, 'Grid switches to three columns');
  await page.reload(); await ready();
  assert.equal(await page.getByRole('button', { name: 'Hiển thị 3 cột' }).getAttribute('aria-pressed'), 'true');
  await page.getByRole('button', { name: 'Hiển thị 2 cột' }).click();
  await page.locator('.sort-filter select').selectOption('price-desc');
  await waitFor(async () => (await page.locator('.product-link').first().getAttribute('href')) === '/products/1', 'Sort uses products beyond first API page');
  await page.getByRole('button', { name: 'Trang cuối', exact: true }).click();
  await waitFor(async () => (await page.locator('.page-status').innerText()) === 'Trang 11 / 11', 'Last page');
  assert.equal(await page.locator('.product-card').count(), 5);
  await page.getByRole('button', { name: 'Phôi', exact: true }).click();
  await waitFor(async () => (await page.locator('.page-status').innerText()) === 'Trang 1 / 4', 'Category resets page');

  await page.getByRole('button', { name: 'Tìm sản phẩm', exact: true }).click();
  await page.locator('#shop-search').fill('meo mo mang');
  await page.locator('#shop-search').press('Enter');
  await page.waitForURL(url => url.pathname === '/products' && url.searchParams.get('q') === 'meo mo mang');
  await ready();
  assert.ok((await page.locator('.product-card h3').allTextContents()).every(name => name.startsWith('Mèo mơ màng')), 'Vietnamese accent-insensitive search');
  assert.ok(page.url().includes('q=meo'));
  await page.getByRole('button', { name: 'Tìm sản phẩm', exact: true }).click();
  await page.locator('#shop-search').fill('not-a-real-product'); await page.locator('#shop-search').press('Enter');
  await page.getByRole('heading', { name: 'Chưa tìm thấy món bạn cần' }).waitFor();

  await page.goto(base); await ready();
  await page.locator('.hero-slider').evaluate(target => {
    for (const [type, x] of [['touchstart', 300], ['touchend', 60]]) target.dispatchEvent(new TouchEvent(type, { bubbles: true, changedTouches: [new Touch({ identifier: 1, target, clientX: x, clientY: 200 })] }));
  });
  await waitFor(async () => (await page.getByRole('button', { name: 'Xem ảnh 2' }).getAttribute('aria-pressed')) === 'true', 'Touch swipe changes slide');
  await page.getByRole('button', { name: 'Xem ảnh 3' }).click();
  await waitFor(async () => (await page.locator('.slide:not([inert]) a').getAttribute('href')) === 'https://www.instagram.com/', 'External slide destination remains external');
  await page.evaluate(() => window.scrollTo(0, 500));
  await page.locator('.site-header.is-scrolled').waitFor();

  for (const width of [320, 390, 430, 768, 1440]) {
    await page.setViewportSize({ width, height: width > 800 ? 1000 : 844 });
    await page.goto(base); await ready();
    await noOverflow(width + ' home');
    await page.getByRole('button', { name: 'Hiển thị 3 cột' }).click();
    await noOverflow(width + ' compact grid');
    if (width === 320 || width === 1440) await captureTop('home-' + width + '.png');
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(base + '/products/1');
  await page.locator('.product-detail').waitFor();
  await page.locator('.add-button').click();
  await waitFor(() => Promise.resolve(cart.itemCount === 1), 'Add to cart retains API payload');
  await page.goto(base + '/cart'); await page.locator('.cart-item').waitFor(); await noOverflow('cart');
  await page.goto(base + '/checkout'); await page.locator('.checkout-form').waitFor(); await noOverflow('checkout');
  await page.locator('.submit-button').click();
  await page.locator('input.ng-invalid.ng-touched').first().waitFor();
  for (const [field, value] of Object.entries({ email: 'fixture@example.com', recipientName: 'Khách kiểm thử', recipientPhone: '0900000000', province: 'Hồ Chí Minh', addressLine: 'Địa chỉ kiểm thử' })) await page.locator('[formControlName="' + field + '"]').fill(value);
  await page.locator('.submit-button').click(); await page.locator('.order-success').waitFor();
  assert.equal(checkoutRequest.recipientName, 'Khách kiểm thử');
  assert.equal(checkoutRequest.cartSessionId, 'storefront-browser-test');
  await noOverflow('payment success');

  for (const route of [
    '/login',
    '/register',
    '/auth/verify-email',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/auth/mfa',
    '/auth/mfa-enrollment',
    '/contact',
    '/info',
    '/products/2',
  ]) {
    await page.goto(base + route); await page.waitForTimeout(200); await noOverflow(route);
  }

  await page.goto(base); await ready();
  const originalFooterBackground = await page.locator('.site-footer').evaluate(element => getComputedStyle(element).backgroundImage);
  await page.getByRole('button', { name: 'Đổi màu giao diện', exact: true }).click();
  await page.getByRole('button', { name: 'Màu Xanh lá', exact: true }).hover();
  assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), 'sage', 'Hover previews a theme');
  const themedFooterBackground = await page.locator('.site-footer').evaluate(element => getComputedStyle(element).backgroundImage);
  assert.notEqual(themedFooterBackground, originalFooterBackground, 'Dotted footer background uses the previewed theme');
  assert.equal(await page.evaluate(() => localStorage.getItem('meumip:theme:guest')), null, 'Preview is not persisted');
  await page.getByRole('button', { name: 'Hủy thay đổi', exact: true }).click();
  await waitFor(() => page.evaluate(() => document.documentElement.dataset.theme === 'rose'), 'Cancel restores the committed theme');

  await page.getByRole('button', { name: 'Đổi màu giao diện', exact: true }).click();
  await page.getByRole('button', { name: 'Màu Tím lavender', exact: true }).click();
  await page.getByRole('button', { name: 'Xác nhận màu này', exact: true }).click();
  assert.equal(await page.evaluate(() => localStorage.getItem('meumip:theme:guest')), 'lavender', 'Confirmed guest theme is persisted');
  await page.reload(); await ready();
  assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), 'lavender', 'Guest theme is restored after reload');

  authenticatedAdmin = true;
  for (const route of ['/admin/security', '/admin/users']) {
    await page.goto(base + route); await page.waitForTimeout(200); await noOverflow(route);
  }
  assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), 'rose', 'A signed-in user does not inherit the guest theme');
  await page.getByRole('button', { name: 'Mở menu quản trị', exact: true }).click();
  await page.getByRole('button', { name: 'Đổi màu giao diện', exact: true }).click();
  await page.getByRole('button', { name: 'Màu Xanh lá', exact: true }).click();
  await page.getByRole('button', { name: 'Xác nhận màu này', exact: true }).click();
  assert.equal(await page.evaluate(() => localStorage.getItem('meumip:theme:user:1')), 'sage', 'Signed-in theme is stored by user id');

  authenticatedAdmin = false;
  await page.goto(base); await ready();
  assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), 'lavender', 'Guest theme returns after signing out');
  await page.evaluate(() => {
    localStorage.setItem('meumip:theme:guest', 'rose');
    localStorage.removeItem('meumip:theme:user:1');
  });
  await page.reload(); await ready();
  await page.goto(base + '/orders'); await page.locator('.login-page').waitFor();
  assert.ok(page.url().includes('/login'), 'Purchase history keeps authentication guard');

  failProducts = true;
  await page.goto(base); await page.getByRole('button', { name: 'Thử lại', exact: true }).waitFor();
  failProducts = false;
  await page.getByRole('button', { name: 'Thử lại', exact: true }).click(); await ready();
  showSlides = false;
  await page.goto(base); await ready();
  await page.locator('.welcome-slide').waitFor();
  await captureTop('home-fallback-390.png');
  assert.deepEqual(errors, [], 'No unhandled browser errors');
  console.log('PASS: responsive layouts (320/390/430/768/1440), per-user themes, auth/admin security pages, CSRF writes, drawer/focus/scroll, vouchers, catalog, cart and checkout.');
  console.log('Screenshots: ' + output + ' (API fixtures, not production data).');
} finally { await browser.close(); }
