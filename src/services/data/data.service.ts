import { Injectable } from '@angular/core';

export interface Product {
  id: number;
  image: string;
  images?: string[];
  name: string;
  brand: string;
  category: string;
  mainPrice: number;
  discount?: number;
  details: any;
  specifications?: any;
  rate?: number;
  stock?: number;
}

@Injectable({
  providedIn: 'root',
})
export class DataService {
  private products: Product[] = [];

  // ================== Functions ==================
  getAllProducts(): Product[] {
    return this.products;
  }
  getProductsByCategory(categoryName: string): Product[] {
    return this.products.filter(
      (p) => p.category.toLowerCase() === categoryName.toLowerCase(),
    );
  }
  getProductsByBrand(brand: string): Product[] {
    return this.products.filter(
      (p) => p.brand.toLowerCase() === brand.toLowerCase(),
    );
  }

  getProductSkincare(): Product[] {
    return this.getProductsByCategory('Skincare');
  }
  getProductHaircare(): Product[] {
    return this.getProductsByCategory('haircare');
  }
  getProductPerfume(): Product[] {
    return this.getProductsByCategory('Perfumes');
  }
  getProductMakeup(): Product[] {
    return this.getProductsByCategory('Makeup');
  }
  getProductWatches(): Product[] {
    return this.getProductsByCategory('Watches');
  }
  getProductAccessories(): Product[] {
    return this.getProductsByCategory('Accessories');
  }

  getProductById(id: number): Product | undefined {
    return this.products.find((p) => p.id === id);
  }
}
