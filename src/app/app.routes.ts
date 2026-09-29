import { Routes } from '@angular/router';
import { CartComponent } from './cart/cart.component';
import { HomeComponent } from './home/home.component';
import { ProductDetailsComponent } from './product-details/product-details.component';
import { CategoryComponent } from './category/category.component';
import { AddProductComponent } from './admin/add-product/add-product.component';
import { ViewProductsComponent } from './admin/view-products/view-products.component';
import { UpdateProductComponent } from './admin/update-product/update-product.component';
import { BrandsComponent } from './admin/brands/brands.component';
import { CategoriesComponent } from './admin/categories/categories.component';
import { OrdersComponent } from './admin/orders/orders.component';
import { OrderDetailsComponent } from './admin/order-details/order-details.component';
import { AboutComponent } from './about/about.component';
import { ShopComponent } from './shop/shop.component';
import { ContactUsComponent } from './contact-us/contact-us.component';
import { ProfileComponent } from './profile/profile.component';
import { adminGuard } from '../guard/admin/admin.guard';
import { PrivacyPolicyComponent } from './privacy-policy/privacy-policy.component';
import { DeliveryPolicyComponent } from './delivery-policy/delivery-policy.component';
import { RefundPolicyComponent } from './refund-policy/refund-policy.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },

  {
    path: 'home',
    component: HomeComponent,
    title: 'Uvéntuo',
  },

  {
    path: 'cart',
    component: CartComponent,
    title: 'Uvéntuo | Cart',
  },

  {
    path: 'product-details/:id',
    component: ProductDetailsComponent,
    title: 'Uvéntuo | Product Details',
  },

  {
    path: 'category/:name',
    component: CategoryComponent,
    title: 'Uvéntuo | Category',
  },

  {
    path: 'view-product',
    component: ViewProductsComponent,
    title: 'Uvéntuo | View Products',
    canActivate: [adminGuard],
  },

  {
    path: 'add-product',
    component: AddProductComponent,
    title: 'Uvéntuo | Add Product',
    canActivate: [adminGuard],
  },

  {
    path: 'update-product/:id',
    component: UpdateProductComponent,
    title: 'Uvéntuo | Update Product',
    canActivate: [adminGuard],
  },

  {
    path: 'brands',
    component: BrandsComponent,
    title: 'Uvéntuo | Brands',
    canActivate: [adminGuard],
  },

  {
    path: 'categories',
    component: CategoriesComponent,
    title: 'Uvéntuo | Categories',
    canActivate: [adminGuard],
  },

  {
    path: 'orders',
    component: OrdersComponent,
    title: 'Uvéntuo | Orders',
  },

  {
    path: 'orders-deatils/:id',
    component: OrderDetailsComponent,
    title: 'Uvéntuo | Order Details',
  },

  {
    path: 'about-us',
    component: AboutComponent,
    title: 'Uvéntuo | About Us',
  },

  {
    path: 'privacy-policy',
    component: PrivacyPolicyComponent,
    title: 'Uvéntuo | Privacy Policy',
  },

  {
    path: 'delivery-policy',
    component: DeliveryPolicyComponent,
    title: 'Uvéntuo | Delivery Policy',
  },

  {
    path: 'refund-policy',
    component: RefundPolicyComponent,
    title: 'Uvéntuo | Refund Policy',
  },

  {
    path: 'contact-us',
    component: ContactUsComponent,
    title: 'Uvéntuo | Contact Us',
  },

  {
    path: 'shop',
    component: ShopComponent,
    title: 'Uvéntuo | Shop',
  },

  {
    path: 'profile',
    component: ProfileComponent,
    title: 'Uvéntuo | Profile',
  },
];
