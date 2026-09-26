import { isPlatformBrowser } from '@angular/common';

import { Component, inject, OnInit, PLATFORM_ID } from '@angular/core';

import { FormsModule } from '@angular/forms';

import { Router, RouterLink, RouterLinkActive } from '@angular/router';

import { CartService } from '../../services/cart/cart.service';

import { Product } from '../../services/data/data.service';

import { ProductService } from '../../services/products/product.service';

@Component({
  selector: 'app-navbar',

  standalone: true,

  imports: [RouterLink, RouterLinkActive, FormsModule],

  templateUrl: './navbar.component.html',

  styleUrl: './navbar.component.scss',
})
export class NavbarComponent implements OnInit {
  /* =====================================================
     SERVICES
  ====================================================== */

  private readonly _PLATFORM_ID = inject(PLATFORM_ID);

  private readonly _ProductService = inject(ProductService);

  private readonly _Router = inject(Router);

  private readonly _CartService = inject(CartService);

  /* =====================================================
     CART
  ====================================================== */

  cartCount = this._CartService.cartSignal;

  /* =====================================================
     PRODUCTS
  ====================================================== */

  allProducts: Product[] = [];

  filteredProducts: Product[] = [];

  /* =====================================================
     SEARCH
  ====================================================== */

  searchWord = '';

  searchToggle = false;

  /* =====================================================
     USER
  ====================================================== */

  userId: string | null = null;

  /* =====================================================
     INIT
  ====================================================== */

  ngOnInit(): void {
    this.getUser();

    this.getAllProducts();
  }

  /* =====================================================
     GET USER
  ====================================================== */

  private getUser(): void {
    if (!isPlatformBrowser(this._PLATFORM_ID)) {
      return;
    }

    this.userId = localStorage.getItem('uvID') || null;
  }

  /* =====================================================
     GET PRODUCTS
  ====================================================== */

  getAllProducts(): void {
    this._ProductService.getAllProducts().subscribe({
      next: (res) => {
        this.allProducts = res || [];

        this.filteredProducts = [];
      },

      error: (err) => {
        console.error('Error loading products:', err);

        this.allProducts = [];

        this.filteredProducts = [];
      },
    });
  }

  /* =====================================================
     TOGGLE SEARCH
  ====================================================== */

  toggleSearchBox(): void {
    this.searchToggle = !this.searchToggle;

    if (!this.searchToggle) {
      this.clearSearch();
    }
  }

  /* =====================================================
     SEARCH
  ====================================================== */

  onSearch(): void {
    const value = this.searchWord.trim().toLowerCase();

    if (!value) {
      this.filteredProducts = [];

      return;
    }

    this.filteredProducts = this.allProducts.filter((product: any) => {
      const name = String(product?.name || '').toLowerCase();

      const brand = String(product?.brand || '').toLowerCase();

      return name.includes(value) || brand.includes(value);
    });
  }

  /* =====================================================
     CLEAR SEARCH
  ====================================================== */

  clearSearch(): void {
    this.searchWord = '';

    this.filteredProducts = [];
  }

  /* =====================================================
     GO TO PRODUCT
  ====================================================== */

  goToProduct(id: any): void {
    if (!id) {
      return;
    }

    this._Router.navigate(['/product-details', id]);

    this.clearSearch();

    this.searchToggle = false;
  }
}
