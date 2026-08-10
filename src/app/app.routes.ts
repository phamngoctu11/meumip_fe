import { Routes } from '@angular/router';
import { adminGuard } from './core/admin.guard';
import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  {
    path: '',
    title: 'meumip — Lovely handmade things',
    loadComponent: () => import('./pages/home/home').then((page) => page.Home),
  },
  {
    path: 'products',
    title: 'Sản phẩm — meumip',
    loadComponent: () => import('./pages/home/home').then((page) => page.Home),
  },
  {
    path: 'products/:slug',
    title: 'Chi tiết sản phẩm — meumip',
    loadComponent: () =>
      import('./pages/product-detail/product-detail').then((page) => page.ProductDetail),
  },
  {
    path: 'cart',
    title: 'Giỏ hàng — meumip',
    loadComponent: () => import('./pages/cart/cart').then((page) => page.CartPage),
  },
  {
    path: 'checkout',
    title: 'Thanh toán — meumip',
    loadComponent: () => import('./pages/checkout/checkout').then((page) => page.CheckoutPage),
  },
  {
    path: 'contact',
    title: 'Liên hệ — meumip',
    loadComponent: () => import('./pages/contact/contact').then((page) => page.ContactPage),
  },
  {
    path: 'login',
    title: 'Đăng nhập — meumip',
    loadComponent: () => import('./pages/login/login').then((page) => page.LoginPage),
  },
  {
    path: 'register',
    title: 'Đăng ký — meumip',
    loadComponent: () => import('./pages/register/register').then((page) => page.RegisterPage),
  },
  {
    path: 'orders',
    title: 'Đơn hàng của bạn — meumip',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/orders/orders').then((page) => page.OrdersPage),
  },
  {
    path: 'orders/:orderCode',
    title: 'Chi tiết đơn hàng — meumip',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/order-detail/order-detail').then((page) => page.OrderDetailPage),
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./pages/admin/layout/admin-layout').then((page) => page.AdminLayout),
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
          import('./pages/admin/product-form/admin-product-form').then(
            (page) => page.AdminProductForm,
          ),
      },
      {
        path: 'products/:id/edit',
        title: 'Sửa sản phẩm — meumip',
        loadComponent: () =>
          import('./pages/admin/product-form/admin-product-form').then(
            (page) => page.AdminProductForm,
          ),
      },
      {
        path: 'orders',
        title: 'Quản lý đơn hàng — meumip',
        loadComponent: () =>
          import('./pages/admin/orders/admin-orders').then((page) => page.AdminOrders),
      },
      {
        path: 'orders/:id',
        title: 'Chi tiết đơn hàng — meumip',
        loadComponent: () =>
          import('./pages/admin/order-detail/admin-order-detail').then(
            (page) => page.AdminOrderDetail,
          ),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
