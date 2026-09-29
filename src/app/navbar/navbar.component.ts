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
  private readonly _PLATFORM_ID = inject(PLATFORM_ID);
  private readonly _ProductService = inject(ProductService);
  private readonly _Router = inject(Router);
  private readonly _CartService = inject(CartService);

  cartCount = this._CartService.cartSignal;

  allProducts: Product[] = [];
  filteredProducts: Product[] = [];

  searchWord = '';
  searchToggle = false;

  userId: string | null = null;

  ngOnInit(): void {
    this.getUser();
    this.getAllProducts();
  }

  // =========================================================
  // USER
  // =========================================================

  private getUser(): void {
    if (!isPlatformBrowser(this._PLATFORM_ID)) {
      return;
    }

    this.userId = localStorage.getItem('uvID') || null;
  }

  // =========================================================
  // PRODUCTS
  // =========================================================

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

  // =========================================================
  // NAVBAR COLLAPSE
  // =========================================================

  closeNavbarMenu(menuId: string): void {
    if (!isPlatformBrowser(this._PLATFORM_ID)) {
      return;
    }

    const menu = document.getElementById(menuId);

    if (!menu) {
      return;
    }

    const toggler = document.querySelector(
      `[data-bs-target="#${menuId}"]`,
    ) as HTMLElement | null;

    if (!menu.classList.contains('show')) {
      return;
    }

    // Trigger Bootstrap's native collapse behavior
    toggler?.click();
  }

  // =========================================================
  // SEARCH
  // =========================================================

  toggleSearchBox(): void {
    this.searchToggle = !this.searchToggle;

    if (!this.searchToggle) {
      this.clearSearch();
    }
  }

  onSearch(): void {
    const value = this.searchWord.trim().toLowerCase();

    if (!value) {
      this.filteredProducts = [];
      return;
    }

    this.filteredProducts = this.allProducts.filter((product: any) => {
      const name = String(product?.name || '').toLowerCase();
      const brand = String(product?.brand || '').toLowerCase();
      console.log(product.mainPrice);

      return name.includes(value) || brand.includes(value);
    });
  }

  clearSearch(): void {
    this.searchWord = '';
    this.filteredProducts = [];
  }

  // =========================================================
  // PRODUCT NAVIGATION
  // =========================================================

  goToProduct(id: any): void {
    if (!id) {
      return;
    }

    this._Router.navigate(['/product-details', id]);

    this.clearSearch();
    this.searchToggle = false;
  }
}
