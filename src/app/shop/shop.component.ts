import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ProductService } from '../../services/products/product.service';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-shop',
  standalone: true,
  imports: [RouterLink, DecimalPipe],
  templateUrl: './shop.component.html',
  styleUrl: './shop.component.scss',
})
export class ShopComponent implements OnInit {
  private readonly _Router = inject(Router);
  private readonly _ProductService = inject(ProductService);

  products: any[] = [];

  ngOnInit(): void {
    this.getAllProducts();
  }

  getAllProducts(): void {
    this._ProductService.getAllProducts().subscribe({
      next: (res) => {
        this.products = res;
      },
    });
  }

  getStars(rate?: any) {
    const full = Math.floor(rate);
    const half = rate % 1 >= 0.5;
    const empty = 5 - full - (half ? 1 : 0);

    return {
      fullStars: Array(full),
      halfStar: half,
      emptyStars: Array(empty),
    };
  }
}
