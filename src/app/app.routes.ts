import { Routes } from '@angular/router';
import { adminGuard } from './core/admin.guard';
import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/user/storefront/layout/storefront-layout').then((page) => page.StorefrontLayout),
    children: [
      {
        path: '',
        title: 'meumip — Lovely handmade things',
        loadComponent: () => import('./pages/user/home/home').then((page) => page.Home),
      },
      {
        path: 'products',
        title: 'Sản phẩm — meumip',
        loadComponent: () => import('./pages/user/products/products').then((page) => page.ProductsPage),
      },
      {
        path: 'products/:id',
        title: 'Chi tiết sản phẩm — meumip',
        loadComponent: () =>
          import('./pages/user/product-detail/product-detail').then((page) => page.ProductDetail),
      },
      {
        path: 'cart',
        title: 'Giỏ hàng — meumip',
        loadComponent: () => import('./pages/user/cart/cart').then((page) => page.CartPage),
      },
      {
        path: 'checkout',
        title: 'Thanh toán — meumip',
        loadComponent: () => import('./pages/user/checkout/checkout').then((page) => page.CheckoutPage),
      },
      {
        path: 'contact',
        title: 'Liên hệ — meumip',
        loadComponent: () => import('./pages/user/contact/contact').then((page) => page.ContactPage),
      },
      {
        path: 'info',
        title: 'Thông tin shop — meumip',
        loadComponent: () => import('./pages/user/info/info').then((page) => page.InfoPage),
      },
      { path: 'favorites', redirectTo: '/products' },
      {
        path: 'login',
        title: 'Đăng nhập — meumip',
        loadComponent: () => import('./pages/user/login/login').then((page) => page.LoginPage),
      },
      {
        path: 'register',
        title: 'Đăng ký — meumip',
        loadComponent: () => import('./pages/user/register/register').then((page) => page.RegisterPage),
      },
      {
        path: 'orders',
        title: 'Đơn hàng của bạn — meumip',
        canActivate: [authGuard],
        loadComponent: () => import('./pages/user/orders/orders').then((page) => page.OrdersPage),
      },
      {
        path: 'orders/:orderCode',
        title: 'Chi tiết đơn hàng — meumip',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./pages/user/order-detail/order-detail').then((page) => page.OrderDetailPage),
      },
    ],
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () => import('./pages/admin/layout/admin-layout').then((page) => page.AdminLayout),
    children: [
      {
        path: '',
        title: 'Quản trị — meumip',
        loadComponent: () =>
          import('./pages/admin/dashboard/admin-dashboard').then((page) => page.AdminDashboard),
      },
      {
        path: 'products',
        title: 'Quản lý sản phẩm — meumip',
        loadComponent: () =>
          import('./pages/admin/products/admin-products').then((page) => page.AdminProducts),
      },
      {
        path: 'products/new',
        title: 'Thêm sản phẩm — meumip',
        loadComponent: () =>
          import('./pages/admin/product-form/admin-product-form').then((page) => page.AdminProductForm),
      },
      {
        path: 'products/:id/edit',
        title: 'Sửa sản phẩm — meumip',
        loadComponent: () =>
          import('./pages/admin/product-form/admin-product-form').then((page) => page.AdminProductForm),
      },
      {
        path: 'slides',
        title: 'Quản lý slide — meumip',
        loadComponent: () => import('./pages/admin/slides/admin-slides').then((page) => page.AdminSlides),
      },
      {
        path: 'orders',
        title: 'Quản lý đơn hàng — meumip',
        loadComponent: () => import('./pages/admin/orders/admin-orders').then((page) => page.AdminOrders),
      },
      {
        path: 'orders/:id',
        title: 'Chi tiết đơn hàng — meumip',
        loadComponent: () =>
          import('./pages/admin/order-detail/admin-order-detail').then((page) => page.AdminOrderDetail),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
