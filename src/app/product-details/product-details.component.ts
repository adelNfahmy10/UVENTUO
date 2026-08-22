import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, PLATFORM_ID } from '@angular/core';
import { CartService } from '../../services/cart/cart.service';
import { DataService } from '../../services/data/data.service';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { ProductService } from '../../services/products/product.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './product-details.component.html',
  styleUrl: './product-details.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ProductDetailsComponent {
  private readonly _ProductService = inject(ProductService);
  private readonly _DataService = inject(DataService);
  private readonly _ActivatedRoute = inject(ActivatedRoute);
  private readonly _CartService = inject(CartService);
  private readonly _ToastrService = inject(ToastrService);
  private readonly _PLATFORM_ID = inject(PLATFORM_ID);

  isBrowser = false;
  product: any;
  productId!: any;
  productCategory!: string;
  productBrand!: string;
  relateProductsCategory:any [] = []
  relateProductsBrand:any [] = []
  quantity: number = 1;
  fullStars: number[] = [];
  halfStar: boolean = false;
  emptyStars: number[] = [];

  selectedVariant: any = null;
  selectedSize: any = null;

  ngOnInit() {
    this.isBrowser = isPlatformBrowser(this._PLATFORM_ID);
    this.getProduct()
  }

  getProduct():void{
    this._ActivatedRoute.paramMap.subscribe({
      next:(params)=>{
        this.productId = params.get('id');
        this._ProductService.getProductById(this.productId).subscribe({
          next:(res)=>{
            this.product = res
            this.selectedVariant = this.product?.variants?.[0] || null;
            this.selectedSize = this.selectedVariant?.sizes?.[0] || null;
            this.setRating();
          }
        })
      }
    })
  }

  selectVariant(variant: any): void {
    this.selectedVariant = variant;

    // أول Size بشكل تلقائي
    this.selectedSize = variant?.sizes?.[0] || null;
  }

  getProductImages(): string[] {
    return this.selectedVariant?.images?.length
      ? this.selectedVariant.images
      : this.product?.images || [this.product?.image];
  }

  setRating(): void {
    const rating = Math.max(
      0,
      Math.min(5, Number(this.product?.rate) || 0)
    );

    const full = Math.floor(rating);

    this.halfStar = rating % 1 >= 0.5;

    const empty = 5 - full - (this.halfStar ? 1 : 0);

    this.fullStars = Array(full).fill(0);
    this.emptyStars = Array(Math.max(0, empty)).fill(0);
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

  addToCart(): void {

    if (!this.selectedVariant) {
      this._ToastrService.warning('من فضلك اختر اللون');
      return;
    }

    if (!this.selectedSize) {
      this._ToastrService.warning('من فضلك اختر المقاس');
      return;
    }

    if (this.selectedSize.stock <= 0) {
      this._ToastrService.warning('هذا المقاس غير متوفر');
      return;
    }

    const cartItem = {
      ...this.product,

      selectedVariant: {
        color: this.selectedVariant.color,
        colorCode: this.selectedVariant.colorCode,
        images: this.selectedVariant.images
      },

      selectedSize: {
        size: this.selectedSize.size,
        price: this.selectedSize.price,
        discount: this.selectedSize.discount || 0,
        stock: this.selectedSize.stock
      },

      finalPrice:
        this.selectedSize.price -
        (this.selectedSize.discount || 0),

      quantity: this.quantity,
    };

    this._CartService.addToCart(cartItem);
  }

  addRelatedToCart(product:any) {
    this._CartService.addToCart(product);
  }

  increase(): void {
    if (
      this.selectedSize &&
      this.quantity < this.selectedSize.stock
    ) {
      this.quantity++;
    }
  }

  decrease(): void {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }
}
