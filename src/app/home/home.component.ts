import { isPlatformBrowser } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, PLATFORM_ID } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DataService, Product } from '../../services/data/data.service';
import { CartService } from '../../services/cart/cart.service';
import { ToastrService } from 'ngx-toastr';
import { ProductService } from '../../services/products/product.service';
import { CategoryService } from '../../services/category/category.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  schemas:[CUSTOM_ELEMENTS_SCHEMA],
})
export class HomeComponent {
  private readonly _Router = inject(Router)
  private readonly _ProductService = inject(ProductService)
  private readonly _DataService = inject(DataService)
  private readonly _CartService = inject(CartService)
  private readonly _PLATFORM_ID = inject(PLATFORM_ID)
  private readonly _CategoryService = inject(CategoryService)

  categories:any[] = []
  getCategoies(): void {
    this._CategoryService.getAllCategories().subscribe(res => {
      this.categories = res;
    });
  }

  products:any[] = []
  isBrowser = false;
  allProducts: Product[] = [];
  scenCare: Product[] = [];
  hairCare: Product[] = [];
  makeUp: Product[] = [];
  perfume: Product[] = [];
  watches: Product[] = [];
  accessories: Product[] = [];

  // 1️⃣ للضغط على الكارت نفسه
  goToProductDetails() {
    this._Router.navigate(['/product-details']);
  }

  addToCart(product: any) {
    this._CartService.addToCart(product);
  }

  ngOnInit(): void {
    this.getCategoies();

    this.getAllProducts()
    this.isBrowser = isPlatformBrowser(this._PLATFORM_ID);
    this.allProducts = this._DataService.getAllProducts();
  }

  getAllProducts():void{
    this._ProductService.getAllProducts().subscribe({
      next:(res)=>{
        this.products = res
      }
    })
  }

  getProductsByCategory(categoryName: string): any[] {
    return this.products.filter(
      product =>
        product.category?.trim().toUpperCase() ===
        categoryName?.trim().toUpperCase()
    );
  }

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
}
