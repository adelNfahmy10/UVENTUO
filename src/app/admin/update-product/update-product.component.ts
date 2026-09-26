import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import Swal from 'sweetalert2';
import { CategoryService } from '../../../services/category/category.service';
import { BrandService } from '../../../services/brand/brand.service';
import { ProductService } from '../../../services/products/product.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-update-product',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './update-product.component.html',
  styleUrl: './update-product.component.scss',
})
export class UpdateProductComponent {
  productForm!: FormGroup;
  productId!: string;

  brands: any[] = [];
  categories: any[] = [];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private brandService: BrandService,
    private categoryService: CategoryService,
  ) {}

  ngOnInit(): void {
    this.initForm();

    this.productId = this.route.snapshot.paramMap.get('id')!;

    this.getBrands();
    this.getCategories();
    this.getProductById();
  }

  // ================= INIT FORM =================
  initForm(): void {
    this.productForm = this.fb.group({
      name: ['', Validators.required],
      price: [0, Validators.required],
      discount: [0],
      rate: [0],
      stock: [0],

      brand: ['', Validators.required],
      category: ['', Validators.required],

      image: [''],

      images: [[]],
      details: [[]],
      specifications: [[]],
    });
  }

  // ================= LOAD PRODUCT =================
  getProductById(): void {
    this.productService.getProductById(this.productId).subscribe((res) => {
      if (res) {
        this.productForm.patchValue({
          name: res.name,
          price: res.price,
          discount: res.discount,
          rate: res.rate,
          stock: res.stock,

          brand: res.brand,
          category: res.category,

          image: res.image,

          images: res.images || [],
          details: res.details || [],
          specifications: res.specifications || [],
        });
      }
    });
  }

  // ================= BRANDS =================
  getBrands(): void {
    this.brandService.getAllBrands().subscribe((res) => {
      this.brands = res;
    });
  }

  // ================= CATEGORIES =================
  getCategories(): void {
    this.categoryService.getAllCategories().subscribe((res) => {
      this.categories = res;
    });
  }

  // ================= IMAGE ACTIONS =================

  removeImage(index: number): void {
    const images = [...(this.productForm.value.images || [])];
    images.splice(index, 1);

    this.productForm.patchValue({ images });
  }

  removeMainImage(): void {
    this.productForm.patchValue({
      image: '',
    });
  }

  setAsMainImage(img: string): void {
    this.productForm.patchValue({
      image: img,
    });
  }

  onImagesSelected(event: any): void {
    const files: FileList = event.target.files;
    if (!files || files.length === 0) return;

    const currentImages = [...(this.productForm.value.images || [])];

    let loaded = 0;

    for (let i = 0; i < files.length; i++) {
      const reader = new FileReader();

      reader.onload = () => {
        currentImages.push(reader.result as string);
        loaded++;

        if (loaded === files.length) {
          this.productForm.patchValue({
            images: currentImages,
          });
        }
      };

      reader.readAsDataURL(files[i]);
    }
  }

  // ================= Details =================
  addDetail(): void {
    const details = [...(this.productForm.value.details || [])];
    details.push('');
    this.productForm.patchValue({ details });
  }

  removeDetail(index: number): void {
    const details = [...(this.productForm.value.details || [])];
    details.splice(index, 1);
    this.productForm.patchValue({ details });
  }

  updateDetail(index: number, event: any): void {
    const value = event.target.value;

    const details = [...(this.productForm.value.details || [])];
    details[index] = value;

    this.productForm.patchValue({ details });
  }

  // ================= Specifications =================
  addSpecification(): void {
    const specs = [...(this.productForm.value.specifications || [])];
    specs.push('');
    this.productForm.patchValue({ specifications: specs });
  }

  removeSpecification(index: number): void {
    const specs = [...(this.productForm.value.specifications || [])];
    specs.splice(index, 1);
    this.productForm.patchValue({ specifications: specs });
  }

  updateSpecification(index: number, event: any): void {
    const value = event.target.value;

    const specs = [...(this.productForm.value.specifications || [])];
    specs[index] = value;

    this.productForm.patchValue({ specifications: specs });
  }

  // ================= UPDATE =================
  submit(): void {
    if (this.productForm.invalid) return;

    const data = {
      ...this.productForm.value,
      createdAt: new Date(), // optional (لو عايز تحديث timestamp)
    };

    this.productService.updateProduct(this.productId, data).subscribe({
      next: () => {
        Swal.fire({
          title: 'Updated!',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
        });

        this.router.navigate(['/view-product']);
      },
      error: (err) => console.log(err),
    });
  }
}
