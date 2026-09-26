import { isPlatformBrowser, NgClass, NgStyle } from '@angular/common';
import { Component, HostListener, inject, OnInit, PLATFORM_ID } from '@angular/core';
import { TranslateModule, TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Router, RouterLink, RouterLinkActive } from "@angular/router";
import { CartService } from '../../services/cart/cart.service';
import { DataService, Product } from '../../services/data/data.service';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms";
import { ToastrService } from 'ngx-toastr';
import { CategoryService } from '../../services/category/category.service';
import { ProductService } from '../../services/products/product.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [TranslateModule, TranslatePipe, RouterLink, FormsModule, ReactiveFormsModule, RouterLinkActive],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent implements OnInit{
  private readonly _PLATFORM_ID = inject(PLATFORM_ID)
  private readonly _ProductService = inject(ProductService)
  private readonly _TranslateService = inject(TranslateService)
  private readonly _Router = inject(Router)
  private readonly _CartService = inject(CartService)

  cartCount = this._CartService.cartSignal;
  allProducts: Product[] = [];
  filteredProducts: Product[] = [];
  categories:any[] = []
  navbarWidth:string = '100%'
  navbarTop:string = '0'
  background:string = 'transparent'
  searchWord:string = ''
  lastScrollTop = 0;
  isNavbarVisible = true;
  lang: string =  'en';
  searchToggle: boolean = false;
  userId:string | null = ''


  ngOnInit(): void {
    this._TranslateService.use(this.lang);
    if (isPlatformBrowser(this._PLATFORM_ID)) {
      this.updateHtmlAttributes();
    }
    this.getAllProducts()

    if (isPlatformBrowser(this._PLATFORM_ID)) {
      this.userId = localStorage.getItem('uvID') || null;
    }
  }

  toggleSearchBox():void {
    this.searchToggle = !this.searchToggle;
  }

  getAllProducts():void {
    this._ProductService.getAllProducts().subscribe({
      next:(res)=>{
        this.allProducts = res
        this.filteredProducts = this.allProducts;
      }
    })
  }

  onSearch() {
    const value = this.searchWord.trim().toLowerCase();

    // لو فاضي رجع كل المنتجات
    if (!value) {
      this.filteredProducts = this.allProducts;
      return;
    }

    this.filteredProducts = this.allProducts.filter(product =>
      product.name?.toLowerCase().includes(value) ||
      product.brand?.toLowerCase().includes(value)
    );

    console.log(this.filteredProducts);


  }

  goToProduct(id:any) {
    this._Router.navigate(['/product-details/', id]);
    this.searchWord = '';
  }

  // Translation Code
  switchLang() {
    this.lang = this.lang === 'en' ? 'ar' : 'en';
    localStorage.setItem('lang', this.lang);
    this._TranslateService.use(this.lang);
    this.updateHtmlAttributes();
  }

  updateHtmlAttributes() {
    const htmlTag = document.documentElement;
    htmlTag.setAttribute('dir', this.lang === 'ar' ? 'rtl' : 'ltr');
    htmlTag.setAttribute('lang', this.lang);
  }
}
