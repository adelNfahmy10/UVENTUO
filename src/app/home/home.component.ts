import { isPlatformBrowser } from '@angular/common';
import { Component, inject, PLATFORM_ID } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { Product } from '../../services/data/data.service';
import { CartService } from '../../services/cart/cart.service';
import { ProductService } from '../../services/products/product.service';
import { CategoryService } from '../../services/category/category.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  private readonly _Router = inject(Router);
  private readonly _ProductService = inject(ProductService);
  private readonly _CartService = inject(CartService);
  private readonly _PLATFORM_ID = inject(PLATFORM_ID);
  private readonly _CategoryService = inject(CategoryService);

  /* =========================================================
     DATA
  ========================================================== */

  categories: any[] = [];

  products: Product[] = [];

  isBrowser = false;

  /* =========================================================
     INIT
  ========================================================== */

  ngOnInit(): void {
    this.isBrowser = isPlatformBrowser(this._PLATFORM_ID);

    this.getCategoies();

    this.getAllProducts();
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this._PLATFORM_ID)) {
      return;
    }

    setTimeout(() => {
      this.initWow();
    }, 100);
  }

  private initWow(): void {
    const WOWClass = (window as any).WOW;

    if (!WOWClass) {
      console.warn('WOW.js is not loaded.');
      return;
    }

    new WOWClass({
      boxClass: 'wow',
      animateClass: 'animated',
      offset: 80,
      mobile: true,
      live: true,
      resetAnimation: false,
    }).init();
  }

  /* =========================================================
     CATEGORIES
  ========================================================== */

  getCategoies(): void {
    this._CategoryService.getAllCategories().subscribe({
      next: (res) => {
        this.categories = res || [];
      },

      error: (err) => {
        console.error('Error loading categories:', err);

        this.categories = [];
      },
    });
  }

  /* =========================================================
     PRODUCTS
  ========================================================== */

  getAllProducts(): void {
    this._ProductService.getAllProducts().subscribe({
      next: (res) => {
        this.products = res || [];
      },

      error: (err) => {
        console.error('Error loading products:', err);

        this.products = [];
      },
    });
  }

  /* =========================================================
     PRODUCTS BY CATEGORY
  ========================================================== */

  getProductsByCategory(categoryName: string): Product[] {
    if (!categoryName) {
      return [];
    }

    const normalizedCategory = categoryName.trim().toUpperCase();

    return this.products.filter((product: any) => {
      return product?.category?.trim().toUpperCase() === normalizedCategory;
    });
  }

  /* =========================================================
     DISPLAY PRICE

     New product structure:

     variants[]
       └── sizes[]
             ├── price
             ├── discount
             └── stock

     We show the lowest available
     effective price on the Home.
  ========================================================== */

  getDisplayPrice(product: any): number {
    const prices: number[] = [];

    /* -------------------------------------------------------
       NEW VARIANTS STRUCTURE
    ------------------------------------------------------- */

    if (Array.isArray(product?.variants)) {
      product.variants.forEach((variant: any) => {
        if (!Array.isArray(variant?.sizes)) {
          return;
        }

        variant.sizes.forEach((size: any) => {
          const price = Number(size?.price) || 0;

          const discount = Number(size?.discount) || 0;

          if (price > 0) {
            const finalPrice = Math.max(price - discount, 0);

            prices.push(finalPrice);
          }
        });
      });
    }

    /* -------------------------------------------------------
       NEW STRUCTURE RESULT
    ------------------------------------------------------- */

    if (prices.length > 0) {
      return Math.min(...prices);
    }

    /* -------------------------------------------------------
       OLD PRODUCT STRUCTURE FALLBACK
    ------------------------------------------------------- */

    const mainPrice = Number(product?.mainPrice) || 0;

    const discount = Number(product?.discount) || 0;

    if (mainPrice > 0) {
      return Math.max(mainPrice - discount, 0);
    }

    /* -------------------------------------------------------
       FINAL FALLBACK
    ------------------------------------------------------- */

    return 0;
  }

  /* =========================================================
     PRODUCT RATING
  ========================================================== */

  getStars(rate?: any) {
    const rating = Number(rate) || 0;

    const full = Math.floor(rating);

    const half = rating % 1 >= 0.5;

    const empty = Math.max(5 - full - (half ? 1 : 0), 0);

    return {
      fullStars: Array(full),
      halfStar: half,
      emptyStars: Array(empty),
    };
  }

  /* =========================================================
     SLIDER
  ========================================================== */

  scrollSlider(
    type: 'fragrance' | 'collection',
    index: number,
    direction: number,
  ): void {
    /*
      Slider scrolling requires the browser DOM.

      Prevent execution during SSR.
    */

    if (!this.isBrowser) {
      return;
    }

    const selector =
      type === 'collection'
        ? '[data-slider="collections"]'
        : `[data-slider="fragrance-${index}"]`;

    const slider = document.querySelector<HTMLElement>(selector);

    if (!slider) {
      return;
    }

    const slide = slider.firstElementChild as HTMLElement | null;

    if (!slide) {
      return;
    }

    const styles = window.getComputedStyle(slider);

    const gap =
      parseFloat(styles.columnGap || '0') || parseFloat(styles.gap || '0') || 0;

    const scrollAmount = slide.offsetWidth + gap;

    slider.scrollBy({
      left: scrollAmount * direction,
      behavior: 'smooth',
    });
  }

  /* =========================================================
     PRODUCT DETAILS
  ========================================================== */

  goToProductDetails(productId?: string): void {
    if (!productId) {
      return;
    }

    this._Router.navigate(['/product-details', productId]);
  }

  /* =========================================================
     CART
  ========================================================== */

  addToCart(product: any): void {
    if (!product) {
      return;
    }

    this._CartService.addToCart(product);
  }
}
