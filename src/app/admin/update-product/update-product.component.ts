import { Component, OnInit } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import Swal from 'sweetalert2';

import { ActivatedRoute, Router } from '@angular/router';

import { CategoryService } from '../../../services/category/category.service';
import { BrandService } from '../../../services/brand/brand.service';
import { ProductService } from '../../../services/products/product.service';

@Component({
  selector: 'app-update-product',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './update-product.component.html',
  styleUrl: './update-product.component.scss',
})
export class UpdateProductComponent implements OnInit {
  productForm!: FormGroup;

  productId = '';

  brands: any[] = [];
  categories: any[] = [];

  loading = true;
  submitting = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private brandService: BrandService,
    private categoryService: CategoryService,
  ) {}

  // =========================================================
  // INIT
  // =========================================================

  ngOnInit(): void {
    this.initForm();

    this.productId = this.route.snapshot.paramMap.get('id') || '';

    if (!this.productId) {
      this.loading = false;

      Swal.fire({
        title: 'Invalid Product',
        text: 'Product ID was not found.',
        icon: 'error',
        confirmButtonColor: '#fed100',
      });

      this.goBack();

      return;
    }

    this.getBrands();
    this.getCategories();
    this.getProductById();
  }

  // =========================================================
  // FORM
  // =========================================================

  initForm(): void {
    this.productForm = this.fb.group({
      name: ['', Validators.required],

      mainPrice: [0, [Validators.required, Validators.min(0)]],

      rate: [0, [Validators.min(0), Validators.max(5)]],

      brand: ['', Validators.required],
      category: ['', Validators.required],

      image: [''],

      images: this.fb.array([]),

      details: this.fb.array([]),

      specifications: this.fb.array([]),

      variants: this.fb.array([]),
    });
  }

  // =========================================================
  // FORM ARRAYS
  // =========================================================

  get imagesArray(): FormArray {
    return this.productForm.get('images') as FormArray;
  }

  get detailsArray(): FormArray {
    return this.productForm.get('details') as FormArray;
  }

  get specificationsArray(): FormArray {
    return this.productForm.get('specifications') as FormArray;
  }

  get variantsArray(): FormArray {
    return this.productForm.get('variants') as FormArray;
  }

  // =========================================================
  // VARIANT HELPERS
  // =========================================================

  getVariantImages(variantIndex: number): FormArray {
    return this.variantsArray.at(variantIndex).get('images') as FormArray;
  }

  getVariantSizes(variantIndex: number): FormArray {
    return this.variantsArray.at(variantIndex).get('sizes') as FormArray;
  }

  // =========================================================
  // LOAD PRODUCT
  // =========================================================

  getProductById(): void {
    this.productService.getProductById(this.productId).subscribe({
      next: (res) => {
        if (!res) {
          this.loading = false;

          Swal.fire({
            title: 'Product Not Found',
            text: 'The requested product could not be found.',
            icon: 'warning',
            confirmButtonColor: '#fed100',
          });

          this.goBack();

          return;
        }

        this.patchProduct(res);

        this.loading = false;
      },

      error: (error) => {
        console.error('Failed to load product:', error);

        this.loading = false;

        Swal.fire({
          title: 'Loading Failed',
          text: 'Unable to load this product.',
          icon: 'error',
          confirmButtonColor: '#fed100',
        });
      },
    });
  }

  private patchProduct(product: any): void {
    this.clearAllArrays();

    const productImages = Array.isArray(product?.images) ? product.images : [];

    const details = Array.isArray(product?.details) ? product.details : [];

    const specifications = Array.isArray(product?.specifications)
      ? product.specifications
      : [];

    const variants = Array.isArray(product?.variants) ? product.variants : [];

    let mainImage = product?.image || '';

    /*
     * If main image doesn't exist but there are images,
     * automatically use the first one.
     */
    if (!mainImage && productImages.length > 0) {
      mainImage = productImages[0];
    }

    this.productForm.patchValue({
      name: product?.name || '',

      mainPrice: this.toNumber(product?.mainPrice ?? product?.price),

      rate: this.toNumber(product?.rate),

      brand: product?.brand || '',

      category: product?.category || '',

      image: mainImage,
    });

    // Product Images
    productImages.forEach((image: string) => {
      this.imagesArray.push(this.fb.control(image));
    });

    // Details
    details.forEach((detail: string) => {
      this.detailsArray.push(this.fb.control(detail || ''));
    });

    // Specifications
    specifications.forEach((specification: string) => {
      this.specificationsArray.push(this.fb.control(specification || ''));
    });

    // Variants
    variants.forEach((variant: any) => {
      this.variantsArray.push(this.createVariantGroup(variant));
    });
  }

  // =========================================================
  // BRANDS
  // =========================================================

  getBrands(): void {
    this.brandService.getAllBrands().subscribe({
      next: (res) => {
        this.brands = Array.isArray(res) ? res : [];
      },

      error: (error) => {
        console.error('Failed to load brands:', error);

        this.brands = [];
      },
    });
  }

  // =========================================================
  // CATEGORIES
  // =========================================================

  getCategories(): void {
    this.categoryService.getAllCategories().subscribe({
      next: (res) => {
        this.categories = Array.isArray(res) ? res : [];
      },

      error: (error) => {
        console.error('Failed to load categories:', error);

        this.categories = [];
      },
    });
  }

  // =========================================================
  // PRODUCT IMAGES
  // =========================================================

  onImagesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    const files = input.files;

    if (!files || files.length === 0) {
      return;
    }

    const existingImages = this.imagesArray.value as string[];

    const existingSet = new Set(existingImages);

    const selectedFiles = Array.from(files);

    let processed = 0;

    selectedFiles.forEach((file) => {
      if (!file.type.startsWith('image/')) {
        processed++;

        if (processed === selectedFiles.length) {
          input.value = '';
        }

        return;
      }

      const reader = new FileReader();

      reader.onload = () => {
        const image = reader.result as string;

        if (image && !existingSet.has(image)) {
          this.imagesArray.push(this.fb.control(image));

          existingSet.add(image);

          /*
           * If there is no main image,
           * make the first uploaded image main.
           */
          if (!this.productForm.value.image) {
            this.productForm.patchValue({
              image,
            });
          }
        }

        processed++;

        if (processed === selectedFiles.length) {
          input.value = '';
        }
      };

      reader.onerror = () => {
        processed++;

        if (processed === selectedFiles.length) {
          input.value = '';
        }
      };

      reader.readAsDataURL(file);
    });
  }

  removeImage(index: number): void {
    if (index < 0 || index >= this.imagesArray.length) {
      return;
    }

    const removedImage = this.imagesArray.at(index).value;

    this.imagesArray.removeAt(index);

    const currentMain = this.productForm.value.image;

    if (removedImage === currentMain) {
      const nextImage =
        this.imagesArray.length > 0 ? this.imagesArray.at(0).value : '';

      this.productForm.patchValue({
        image: nextImage,
      });
    }
  }

  setAsMainImage(image: string): void {
    if (!image) {
      return;
    }

    this.productForm.patchValue({
      image,
    });
  }

  removeMainImage(): void {
    const currentMain = this.productForm.value.image;

    const images = this.imagesArray.value as string[];

    const alternative = images.find((image) => image !== currentMain) || '';

    this.productForm.patchValue({
      image: alternative,
    });
  }

  // =========================================================
  // DETAILS
  // =========================================================

  addDetail(): void {
    this.detailsArray.push(this.fb.control(''));
  }

  removeDetail(index: number): void {
    if (index < 0 || index >= this.detailsArray.length) {
      return;
    }

    this.detailsArray.removeAt(index);
  }

  // =========================================================
  // SPECIFICATIONS
  // =========================================================

  addSpecification(): void {
    this.specificationsArray.push(this.fb.control(''));
  }

  removeSpecification(index: number): void {
    if (index < 0 || index >= this.specificationsArray.length) {
      return;
    }

    this.specificationsArray.removeAt(index);
  }

  // =========================================================
  // VARIANTS
  // =========================================================

  createVariantGroup(variant?: any): FormGroup {
    const variantImages = Array.isArray(variant?.images) ? variant.images : [];

    const variantSizes = Array.isArray(variant?.sizes) ? variant.sizes : [];

    const imagesArray = this.fb.array(
      variantImages.map((image: string) => this.fb.control(image)),
    );

    const sizesArray = this.fb.array(
      variantSizes.map((size: any) => this.createSizeGroup(size)),
    );

    return this.fb.group({
      name: [variant?.name || '', Validators.required],

      images: imagesArray,

      sizes: sizesArray,
    });
  }

  createSizeGroup(size?: any): FormGroup {
    return this.fb.group({
      size: [size?.size ?? '', Validators.required],

      price: [
        this.toNumber(size?.price),
        [Validators.required, Validators.min(0)],
      ],

      discount: [this.toNumber(size?.discount), [Validators.min(0)]],

      stock: [this.toNumber(size?.stock), [Validators.min(0)]],
    });
  }

  addVariant(): void {
    this.variantsArray.push(this.createVariantGroup());
  }

  removeVariant(index: number): void {
    if (index < 0 || index >= this.variantsArray.length) {
      return;
    }

    this.variantsArray.removeAt(index);
  }

  // =========================================================
  // VARIANT IMAGES
  // =========================================================

  onVariantImagesSelected(event: Event, variantIndex: number): void {
    const input = event.target as HTMLInputElement;

    const files = input.files;

    if (!files || files.length === 0) {
      return;
    }

    const imagesArray = this.getVariantImages(variantIndex);

    const existingImages = imagesArray.value as string[];

    const existingSet = new Set(existingImages);

    const selectedFiles = Array.from(files);

    let processed = 0;

    selectedFiles.forEach((file) => {
      if (!file.type.startsWith('image/')) {
        processed++;

        if (processed === selectedFiles.length) {
          input.value = '';
        }

        return;
      }

      const reader = new FileReader();

      reader.onload = () => {
        const image = reader.result as string;

        if (image && !existingSet.has(image)) {
          imagesArray.push(this.fb.control(image));

          existingSet.add(image);
        }

        processed++;

        if (processed === selectedFiles.length) {
          input.value = '';
        }
      };

      reader.onerror = () => {
        processed++;

        if (processed === selectedFiles.length) {
          input.value = '';
        }
      };

      reader.readAsDataURL(file);
    });
  }

  removeVariantImage(variantIndex: number, imageIndex: number): void {
    const images = this.getVariantImages(variantIndex);

    if (imageIndex < 0 || imageIndex >= images.length) {
      return;
    }

    images.removeAt(imageIndex);
  }

  // =========================================================
  // VARIANT SIZES
  // =========================================================

  addSize(variantIndex: number): void {
    const sizes = this.getVariantSizes(variantIndex);

    sizes.push(this.createSizeGroup());
  }

  removeSize(variantIndex: number, sizeIndex: number): void {
    const sizes = this.getVariantSizes(variantIndex);

    if (sizeIndex < 0 || sizeIndex >= sizes.length) {
      return;
    }

    sizes.removeAt(sizeIndex);
  }

  // =========================================================
  // UPDATE
  // =========================================================

  submit(): void {
    if (this.submitting) {
      return;
    }

    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();

      Swal.fire({
        title: 'Incomplete Product',
        text: 'Please check the required fields.',
        icon: 'warning',
        confirmButtonColor: '#fed100',
      });

      return;
    }

    this.submitting = true;

    const formValue = this.productForm.getRawValue();

    const images = this.cleanStringArray(formValue.images);

    let mainImage = formValue.image || '';

    /*
     * Make sure main image exists
     * in product images.
     */
    if (mainImage && !images.includes(mainImage)) {
      images.unshift(mainImage);
    }

    /*
     * If main image is empty but images exist,
     * use first image.
     */
    if (!mainImage && images.length > 0) {
      mainImage = images[0];
    }

    const details = this.cleanStringArray(formValue.details);

    const specifications = this.cleanStringArray(formValue.specifications);

    const variants = this.normalizeVariants(formValue.variants);

    const data = {
      name: String(formValue.name || '').trim(),

      mainPrice: this.toNumber(formValue.mainPrice),

      rate: this.toNumber(formValue.rate),

      brand: formValue.brand || '',

      category: formValue.category || '',

      image: mainImage,

      images,

      details,

      specifications,

      variants,

      /*
       * IMPORTANT:
       * We intentionally don't send createdAt.
       * updateProduct should update the existing document
       * without replacing its original createdAt.
       */
      updatedAt: new Date(),
    };

    this.productService.updateProduct(this.productId, data).subscribe({
      next: () => {
        this.submitting = false;

        Swal.fire({
          title: 'Product Updated',
          text: 'Your changes have been saved successfully.',
          icon: 'success',
          timer: 1600,
          showConfirmButton: false,
          background: '#111',
          color: '#f7f6f1',
        }).then(() => {
          this.router.navigate(['/view-product']);
        });
      },

      error: (error) => {
        console.error('Failed to update product:', error);

        this.submitting = false;

        Swal.fire({
          title: 'Update Failed',
          text: 'Something went wrong while updating the product.',
          icon: 'error',
          confirmButtonColor: '#fed100',
          background: '#111',
          color: '#f7f6f1',
        });
      },
    });
  }

  // =========================================================
  // NORMALIZE VARIANTS
  // =========================================================

  private normalizeVariants(variants: any[]): any[] {
    if (!Array.isArray(variants)) {
      return [];
    }

    return variants
      .map((variant) => {
        const images = this.cleanStringArray(variant?.images);

        const sizes = Array.isArray(variant?.sizes)
          ? variant.sizes
              .map((size: any) => ({
                size: String(size?.size ?? '').trim(),

                price: this.toNumber(size?.price),

                discount: this.toNumber(size?.discount),

                stock: this.toNumber(size?.stock),
              }))
              .filter((size: any) => size.size !== '')
          : [];

        return {
          name: String(variant?.name || '').trim(),

          images,

          sizes,
        };
      })
      .filter(
        (variant) =>
          variant.name !== '' ||
          variant.images.length > 0 ||
          variant.sizes.length > 0,
      );
  }

  // =========================================================
  // HELPERS
  // =========================================================

  private cleanStringArray(values: any): string[] {
    if (!Array.isArray(values)) {
      return [];
    }

    return values.map((value) => String(value ?? '').trim()).filter(Boolean);
  }

  private toNumber(value: any): number {
    const numberValue = Number(value);

    return Number.isFinite(numberValue) ? numberValue : 0;
  }

  private clearAllArrays(): void {
    this.imagesArray.clear();
    this.detailsArray.clear();
    this.specificationsArray.clear();
    this.variantsArray.clear();
  }

  // =========================================================
  // NAVIGATION
  // =========================================================

  goBack(): void {
    this.router.navigate(['/view-product']);
  }
}
