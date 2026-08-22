import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DataService } from '../../services/data/data.service';
import { CartService } from '../../services/cart/cart.service';
import { FormsModule } from '@angular/forms';
import { NgStyle } from '@angular/common';
import { ProductService } from '../../services/products/product.service';

@Component({
  selector: 'app-category',
  standalone: true,
  imports: [RouterLink, FormsModule, NgStyle],
  templateUrl: './category.component.html',
  styleUrl: './category.component.scss'
})
export class CategoryComponent implements OnInit{
  private readonly _ProductService = inject(ProductService)
  private readonly _DataService = inject(DataService)
  private readonly _CartService = inject(CartService)
  private readonly _ActivatedRoute = inject(ActivatedRoute)

  allProducts:any[] = []
  AllProductsByCategory!:any[];
  filteredProducts: any[] = [];
  categoryName:string = '';

  // Pagination
  currentPage: number = 1; // الصفحة الحالية
  itemsPerPage: number = 8; // عدد المنتجات في كل صفحة
  totalPages: number = 0; // مجموع الصفحات
  paginatedProducts: any[] = []; // المنتجات المعروضة في الصفحة الحالية

  // Filters
  brands: string[] = [];
  brandFilter: string = 'all';
  priceFilter: number = 10000;
  rateFilter: number = 0;

  ngOnInit(): void {
    this.getAllProductsByCategory()
    this.getProducts()
  }

  // Get Products
  getAllProductsByCategory():void{
    this._ActivatedRoute.paramMap.subscribe({
      next:(param:any)=>{
        this.categoryName = param.get('name')

        this.AllProductsByCategory = this._DataService.getProductsByCategory(this.categoryName)

        this.brands = Array.from(new Set(this.AllProductsByCategory.map(p => p.brand)));
        // تحديث Pagination بعد الفلتر
        this.applyFilters(); // هنا نطبق الفلاتر مباشرة (حتى لو فلتر البراند حالياً 'all')
      }
    })
  }

  getProducts():void{
    this._ActivatedRoute.paramMap.subscribe({
      next:(params)=>{
        this.categoryName = params.get('name')!
        this._ProductService.getProductsByCategory(this.categoryName).subscribe({
          next:(res)=>{
            this.allProducts = res;
            this.brands = Array.from(new Set(this.allProducts.map(p => p.brand)));
            this.applyFilters();
          }
        })
      }
    })
  }

  // Rate Products
  getStars(rate?: any) {
    const full = Math.floor(rate);
    const half = rate % 1 >= 0.5;
    const empty = 5 - full - (half ? 1 : 0);

    return {
      fullStars: Array(full),
      halfStar: half,
      emptyStars: Array(empty)
    };
  }

  // Add To Card
  addToCart(product: any) {
    this._CartService.addToCart(product);
  }

  // Sort
  sortProducts(event: any): void {
    const value = event.target.value;

    switch(value) {
      case 'name-asc':
        this.paginatedProducts.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        this.paginatedProducts.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'price-asc':
        this.paginatedProducts.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        this.paginatedProducts.sort((a, b) => b.price - a.price);
        break;
      case 'rate-asc':
        this.paginatedProducts.sort((a, b) => a.rate - b.rate);
        break;
      case 'rate-desc':
        this.paginatedProducts.sort((a, b) => b.rate - a.rate);
        break;
      default:
        // لو اختار All، ممكن ترجّع الـ array بدون تعديل أو تعمل reset من السيرفيس
        this.paginatedProducts = this._DataService.getProductsByCategory(this.categoryName);
        break;
    }
  }

  // Pagination
  updatePagination(): void {
    const source = this.filteredProducts.length ? this.filteredProducts : this.allProducts;

    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedProducts = source.slice(startIndex, endIndex);

    // حساب عدد الصفحات
    this.totalPages = Math.ceil(source.length / this.itemsPerPage);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  nextPage() {
    this.goToPage(this.currentPage + 1);
  }

  prevPage() {
    this.goToPage(this.currentPage - 1);
  }

  priceTrackPercentage: number = 100;

  updatePriceTrack() {
    const max = 2000;
    this.priceTrackPercentage = (this.priceFilter / max) * 100;
    this.applyFilters();
  }

  // Filters
  applyFilters(): void {
    // نبدأ بالـ AllProductsByCategory
    let filtered = [...this.allProducts];

    // فلتر حسب البراند
    if (this.brandFilter && this.brandFilter !== 'all') {
      filtered = filtered.filter(product => product.brand === this.brandFilter);
    }

    // فلتر حسب السعر (مثلاً أقل من أو يساوي قيمة priceFilter)
    filtered = filtered.filter(product => product.price <= this.priceFilter);

    // فلتر حسب الريت (مثلاً أكبر أو يساوي قيمة rateFilter)
    filtered = filtered.filter(product => {
      if (this.rateFilter == 0) return true;

      const rate = product.rate;

      if (!rate) return false;

      const selectedRate = Number(this.rateFilter);

      return rate >= selectedRate && rate < selectedRate + 1;
    });

    // تحديث الفلترد برودكتس
    this.filteredProducts = filtered;

    // إعادة حساب Pagination
    this.currentPage = 1; // نرجع الصفحة الأولى بعد أي فلتر
    this.updatePaginationAfterFilter();
  }

  // Pagination after filter
  updatePaginationAfterFilter(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;

    this.paginatedProducts = this.filteredProducts.slice(startIndex, endIndex);
    this.totalPages = Math.ceil(this.filteredProducts.length / this.itemsPerPage);
  }

  // مثال على التغيير عند اختيار فلتر
  onBrandChange(brand: string) {
    this.brandFilter = brand;

    this.applyFilters();
  }

  onPriceChange(price: number) {
    this.priceFilter = price;
    this.applyFilters();
  }

  onRateChange(rate: number) {
    this.rateFilter = rate;
    this.applyFilters();
  }
}
