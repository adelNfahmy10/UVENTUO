import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { DataService } from '../../services/data/data.service';
import { CartService } from '../../services/cart/cart.service';
import { ProductService } from '../../services/products/product.service';

@Component({
  selector: 'app-category',
  standalone: true,

  imports: [RouterLink, FormsModule, DecimalPipe],

  templateUrl: './category.component.html',
  styleUrl: './category.component.scss',
})
export class CategoryComponent implements OnInit {
  private readonly _ProductService = inject(ProductService);
  private readonly _DataService = inject(DataService);
  private readonly _CartService = inject(CartService);
  private readonly _ActivatedRoute = inject(ActivatedRoute);

  /* =========================================================
     PRODUCTS
  ========================================================= */

  allProducts: any[] = [];

  filteredProducts: any[] = [];

  paginatedProducts: any[] = [];

  categoryName = '';

  brands: string[] = [];

  /* =========================================================
     FILTERS
  ========================================================= */

  brandFilter = 'all';

  priceFilter = 2000;

  rateFilter = 0;

  priceMax = 2000;

  priceTrackPercentage = 100;

  /* =========================================================
     SORT
  ========================================================= */

  sortValue = 'all';

  /* =========================================================
     PAGINATION
  ========================================================= */

  currentPage = 1;

  itemsPerPage = 8;

  totalPages = 0;

  pages: number[] = [];

  /* =========================================================
     LIFECYCLE
  ========================================================= */

  ngOnInit(): void {
    this._ActivatedRoute.paramMap.subscribe({
      next: (params) => {
        const category = params.get('name');

        if (!category) {
          return;
        }

        this.categoryName = category;

        this.loadProducts();
      },
    });
  }

  /* =========================================================
     LOAD PRODUCTS
  ========================================================= */

  private loadProducts(): void {
    this._ProductService.getProductsByCategory(this.categoryName).subscribe({
      next: (products) => {
        console.log('PRODUCTS FROM API:', products);

        this.allProducts = Array.isArray(products) ? products : [];

        console.log('ALL PRODUCTS:', this.allProducts);
        console.log('COUNT:', this.allProducts.length);

        this.prepareBrands();
        this.preparePriceRange();

        // Reset
        this.brandFilter = 'all';
        this.rateFilter = 0;
        this.sortValue = 'all';
        this.currentPage = 1;

        // Apply filters
        this.applyFilters();

        console.log('FILTERED PRODUCTS:', this.filteredProducts);
        console.log('PAGINATED PRODUCTS:', this.paginatedProducts);
        console.log('TOTAL PAGES:', this.totalPages);
      },

      error: (error) => {
        console.error('Failed to load category products:', error);

        this.allProducts = [];
        this.filteredProducts = [];
        this.paginatedProducts = [];
        this.totalPages = 0;
        this.pages = [];
      },
    });
  }

  /* =========================================================
     BRANDS
  ========================================================= */

  private prepareBrands(): void {
    this.brands = Array.from(
      new Set(
        this.allProducts

          .map((product) => product?.brand)

          .filter(Boolean),
      ),
    ).sort((a, b) => String(a).localeCompare(String(b)));
  }

  /* =========================================================
     PRICE RANGE
  ========================================================= */

  private preparePriceRange(): void {
    const prices = this.allProducts
      .map((product) => Number(product?.price))
      .filter((price) => Number.isFinite(price));

    const highestPrice = prices.length ? Math.max(...prices) : 2000;

    this.priceMax = Math.max(2000, Math.ceil(highestPrice / 100) * 100);

    this.priceFilter = this.priceMax;

    this.priceTrackPercentage = 100;
  }

  /* =========================================================
     FILTERING
  ========================================================= */

  applyFilters(): void {
    let result = [...this.allProducts];

    console.log('START FILTER:', result.length);

    // BRAND
    if (this.brandFilter !== 'all') {
      result = result.filter((product) => product?.brand === this.brandFilter);
    }

    console.log('AFTER BRAND:', result.length);

    // PRICE
    if (this.priceFilter < this.priceMax) {
      result = result.filter((product) => {
        const price = Number(product?.price);

        return Number.isFinite(price) && price <= this.priceFilter;
      });
    }

    console.log('AFTER PRICE:', result.length);

    // RATING
    if (this.rateFilter > 0) {
      result = result.filter((product) => {
        const rate = Number(product?.rate);

        return Number.isFinite(rate) && rate >= this.rateFilter;
      });
    }

    console.log('AFTER RATING:', result.length);

    // SORT
    result = this.sortResult(result, this.sortValue);

    this.filteredProducts = result;

    this.currentPage = 1;

    this.updatePagination();
  }

  /* =========================================================
     SORT
  ========================================================= */

  sortProducts(): void {
    this.applyFilters();
  }

  private sortResult(products: any[], sort: string): any[] {
    const result = [...products];

    switch (sort) {
      case 'name-asc':
        result.sort((a, b) =>
          String(a?.name || '').localeCompare(String(b?.name || '')),
        );

        break;

      case 'name-desc':
        result.sort((a, b) =>
          String(b?.name || '').localeCompare(String(a?.name || '')),
        );

        break;

      case 'price-asc':
        result.sort((a, b) => this.getFinalPrice(a) - this.getFinalPrice(b));

        break;

      case 'price-desc':
        result.sort((a, b) => this.getFinalPrice(b) - this.getFinalPrice(a));

        break;

      case 'rate-asc':
        result.sort((a, b) => Number(a?.rate || 0) - Number(b?.rate || 0));

        break;

      case 'rate-desc':
        result.sort((a, b) => Number(b?.rate || 0) - Number(a?.rate || 0));

        break;

      case 'all':
      default:
        break;
    }

    return result;
  }

  /* =========================================================
     FINAL PRICE
  ========================================================= */

  getFinalPrice(product: any): number {
    const price = Number(product?.price || 0);

    const discount = Number(product?.discount || 0);

    return Math.max(0, price - discount);
  }

  /* =========================================================
     PRICE RANGE
  ========================================================= */

  updatePriceTrack(shouldFilter = true): void {
    if (!this.priceMax) {
      this.priceTrackPercentage = 0;

      return;
    }

    this.priceTrackPercentage = Math.min(
      100,
      Math.max(0, (this.priceFilter / this.priceMax) * 100),
    );

    if (shouldFilter) {
      this.applyFilters();
    }
  }

  /* =========================================================
     PAGINATION
  ========================================================= */

  updatePagination(): void {
    const source = this.filteredProducts;

    this.totalPages = Math.ceil(source.length / this.itemsPerPage);

    if (source.length === 0) {
      this.paginatedProducts = [];
      this.pages = [];
      this.currentPage = 1;
      return;
    }

    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }

    const startIndex = (this.currentPage - 1) * this.itemsPerPage;

    const endIndex = startIndex + this.itemsPerPage;

    this.paginatedProducts = source.slice(startIndex, endIndex);

    this.pages = Array.from(
      { length: this.totalPages },
      (_, index) => index + 1,
    );
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.currentPage) {
      return;
    }

    this.currentPage = page;

    this.updatePagination();

    /*
     * Bring the collection back into view
     * after changing page.
     */

    document.getElementById('category')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.goToPage(this.currentPage + 1);
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.goToPage(this.currentPage - 1);
    }
  }

  /* =========================================================
     RESET FILTERS
  ========================================================= */

  resetFilters(apply = true): void {
    this.brandFilter = 'all';

    this.rateFilter = 0;

    this.sortValue = 'all';

    this.priceFilter = this.priceMax;

    this.priceTrackPercentage = 100;

    this.currentPage = 1;

    if (apply) {
      this.applyFilters();
    }
  }

  /* =========================================================
     ACTIVE FILTERS
  ========================================================= */

  get hasActiveFilters(): boolean {
    return (
      this.brandFilter !== 'all' ||
      this.rateFilter !== 0 ||
      this.sortValue !== 'all' ||
      this.priceFilter < this.priceMax
    );
  }

  /* =========================================================
     SOLD OUT CATEGORY
  ========================================================= */

  get isSoldOutCategory(): boolean {
    return ['Makeup', 'Accessories', 'Watch'].includes(this.categoryName);
  }

  /* =========================================================
     RATING STARS
  ========================================================= */

  getStars(rate?: number) {
    const value = Number(rate || 0);

    const full = Math.floor(value);

    const half = value % 1 >= 0.5;

    const empty = Math.max(0, 5 - full - (half ? 1 : 0));

    return {
      fullStars: Array(full),

      halfStar: half,

      emptyStars: Array(empty),
    };
  }

  /* =========================================================
     CART
  ========================================================= */

  addToCart(product: any): void {
    this._CartService.addToCart(product);
  }
}
