import { Component, inject, OnInit } from '@angular/core';
import {
  ReactiveFormsModule,
  FormsModule,
  UntypedFormArray,
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
} from '@angular/forms';

import { ActivatedRoute, Router } from '@angular/router';
import Swal from 'sweetalert2';

import { ProductService } from '../../../services/products/product.service';
import { BrandService } from '../../../services/brand/brand.service';
import { CategoryService } from '../../../services/category/category.service';

@Component({
  selector: 'app-update-product',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule],
  templateUrl: './update-product.component.html',
  styleUrl: './update-product.component.scss',
})
export class UpdateProductComponent implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly brandService = inject(BrandService);
  private readonly categoryService = inject(CategoryService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  productForm!: UntypedFormGroup;

  productId = '';

  brands: any[] = [];
  categories: any[] = [];

  isLoading = false;

  /* =====================================================
     FILES
  ===================================================== */

  newImagesFiles: File[] = [];

  /*
   * New images selected for every variant.
   *
   * Example:
   * newVariantImagesFiles[0] => files for Original
   * newVariantImagesFiles[1] => files for High Copy
   */
  newVariantImagesFiles: File[][] = [];

  /* =====================================================
     INIT
  ===================================================== */

  constructor(private fb: UntypedFormBuilder) {
    this.createForm();
  }

  ngOnInit(): void {
    this.productId = this.route.snapshot.paramMap.get('id') || '';

    this.getBrands();
    this.getCategories();

    if (this.productId) {
      this.getProductById(this.productId);
    }
  }

  /* =====================================================
     FORM
  ===================================================== */

  private createForm(): void {
    this.productForm = this.fb.group({
      name: ['', Validators.required],

      brand: ['', Validators.required],

      category: ['', Validators.required],

      rate: [0, [Validators.min(0), Validators.max(5)]],

      mainPrice: [0, [Validators.required, Validators.min(0)]],

      image: [''],

      images: this.fb.array([]),

      variants: this.fb.array([]),

      details: this.fb.array([]),

      specifications: this.fb.array([]),
    });
  }

  /* =====================================================
     GETTERS
  ===================================================== */

  get images(): UntypedFormArray {
    return this.productForm.get('images') as UntypedFormArray;
  }

  get variants(): UntypedFormArray {
    return this.productForm.get('variants') as UntypedFormArray;
  }

  get details(): UntypedFormArray {
    return this.productForm.get('details') as UntypedFormArray;
  }

  get specifications(): UntypedFormArray {
    return this.productForm.get('specifications') as UntypedFormArray;
  }

  /* =====================================================
     BRANDS
  ===================================================== */

  getBrands(): void {
    this.brandService.getAllBrands().subscribe({
      next: (res: any[]) => {
        this.brands = res || [];
      },

      error: (error) => {
        console.error('Error loading brands:', error);
      },
    });
  }

  /* =====================================================
     CATEGORIES
  ===================================================== */

  getCategories(): void {
    this.categoryService.getAllCategories().subscribe({
      next: (res: any[]) => {
        this.categories = res || [];
      },

      error: (error) => {
        console.error('Error loading categories:', error);
      },
    });
  }

  /* =====================================================
     GET PRODUCT
  ===================================================== */

  getProductById(id: string): void {
    this.isLoading = true;

    this.productService.getProductById(id).subscribe({
      next: (product: any) => {
        if (!product) {
          this.isLoading = false;

          Swal.fire({
            icon: 'error',
            title: 'Product Not Found',
            text: 'The requested product could not be found.',
          });

          this.router.navigate(['/all-products']);
          return;
        }

        this.loadProduct(product);

        this.isLoading = false;
      },

      error: (error) => {
        console.error('Error loading product:', error);

        this.isLoading = false;

        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to load product data.',
        });
      },
    });
  }

  /* =====================================================
     LOAD PRODUCT INTO FORM
  ===================================================== */

  private loadProduct(product: any): void {
    /*
     * Basic information
     */
    this.productForm.patchValue({
      name: product.name || '',

      brand: product.brand || '',

      category: product.category || '',

      rate: product.rate ?? 0,

      mainPrice: product.mainPrice ?? 0,

      image: product.image || '',
    });

    /* ===================================================
       PRODUCT IMAGES
    =================================================== */

    this.images.clear();

    if (Array.isArray(product.images)) {
      product.images.forEach((image: string) => {
        if (image) {
          this.images.push(this.fb.control(image));
        }
      });
    }

    /* ===================================================
       VARIANTS
    =================================================== */

    this.variants.clear();

    this.newVariantImagesFiles = [];

    if (Array.isArray(product.variants)) {
      product.variants.forEach((variant: any) => {
        this.addVariant(
          variant?.name || '',
          Array.isArray(variant?.images) ? variant.images : [],
          Array.isArray(variant?.sizes) ? variant.sizes : [],
        );
      });
    }

    /*
     * Keep at least one variant available
     */
    if (!this.variants.length) {
      this.addVariant();
    }

    /* ===================================================
       DETAILS
    =================================================== */

    this.details.clear();

    if (Array.isArray(product.details)) {
      product.details.forEach((detail: string) => {
        this.details.push(this.fb.control(detail || ''));
      });
    }

    if (!this.details.length) {
      this.addDetail();
    }

    /* ===================================================
       SPECIFICATIONS
    =================================================== */

    this.specifications.clear();

    if (Array.isArray(product.specifications)) {
      product.specifications.forEach((specification: string) => {
        this.specifications.push(this.fb.control(specification || ''));
      });
    }

    if (!this.specifications.length) {
      this.addSpecification();
    }
  }

  /* =====================================================
     PRODUCT IMAGES
  ===================================================== */

  onImagesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (!input.files?.length) {
      return;
    }

    const files = Array.from(input.files);

    this.newImagesFiles.push(...files);

    /*
     * Reset input so the same file can be selected again.
     */
    input.value = '';
  }

  getPendingImages(): File[] {
    return this.newImagesFiles;
  }

  removePendingImage(index: number): void {
    this.newImagesFiles.splice(index, 1);
  }

  removeImage(index: number): void {
    this.images.removeAt(index);
  }

  removeMainImage(): void {
    this.productForm.patchValue({
      image: '',
    });
  }

  setAsMainImage(image: string): void {
    this.productForm.patchValue({
      image,
    });
  }

  /* =====================================================
     VARIANTS
  ===================================================== */

  addVariant(name = '', images: string[] = [], sizes: any[] = []): void {
    const variantIndex = this.variants.length;

    const sizesArray = this.fb.array([]);

    /*
     * Existing sizes
     */
    if (sizes.length) {
      sizes.forEach((size: any) => {
        sizesArray.push(this.createSizeGroup(size));
      });
    } else {
      /*
       * New variant gets one empty size
       */
      sizesArray.push(this.createSizeGroup());
    }

    const variantGroup = this.fb.group({
      name: [name, Validators.required],

      images: this.fb.array(
        images.map((image: string) => this.fb.control(image)),
      ),

      sizes: sizesArray,
    });

    this.variants.push(variantGroup);

    this.newVariantImagesFiles[variantIndex] = [];
  }

  removeVariant(index: number): void {
    if (this.variants.length <= 1) {
      return;
    }

    this.variants.removeAt(index);

    this.newVariantImagesFiles.splice(index, 1);
  }

  /* =====================================================
     VARIANT IMAGES
  ===================================================== */

  getVariantImages(variantIndex: number): UntypedFormArray {
    return this.variants.at(variantIndex).get('images') as UntypedFormArray;
  }

  onVariantImagesSelected(event: Event, variantIndex: number): void {
    const input = event.target as HTMLInputElement;

    if (!input.files?.length) {
      return;
    }

    const files = Array.from(input.files);

    if (!this.newVariantImagesFiles[variantIndex]) {
      this.newVariantImagesFiles[variantIndex] = [];
    }

    this.newVariantImagesFiles[variantIndex].push(...files);

    input.value = '';
  }

  getPendingVariantImages(variantIndex: number): File[] {
    return this.newVariantImagesFiles[variantIndex] || [];
  }

  removePendingVariantImage(variantIndex: number, fileIndex: number): void {
    this.newVariantImagesFiles[variantIndex]?.splice(fileIndex, 1);
  }

  removeVariantImage(variantIndex: number, imageIndex: number): void {
    const imagesArray = this.getVariantImages(variantIndex);

    imagesArray.removeAt(imageIndex);
  }

  /* =====================================================
     SIZES
  ===================================================== */

  private createSizeGroup(size: any = {}): UntypedFormGroup {
    return this.fb.group({
      size: [size?.size ?? '', Validators.required],

      price: [size?.price ?? 0, [Validators.required, Validators.min(0)]],

      discount: [size?.discount ?? 0, Validators.min(0)],

      stock: [size?.stock ?? 0, [Validators.required, Validators.min(0)]],
    });
  }

  getSizes(variantIndex: number): UntypedFormArray {
    return this.variants.at(variantIndex).get('sizes') as UntypedFormArray;
  }

  addSize(variantIndex: number): void {
    this.getSizes(variantIndex).push(this.createSizeGroup());
  }

  removeVariantSize(variantIndex: number, sizeIndex: number): void {
    const sizes = this.getSizes(variantIndex);

    if (sizes.length <= 1) {
      return;
    }

    sizes.removeAt(sizeIndex);
  }

  /* =====================================================
     DETAILS
  ===================================================== */

  addDetail(): void {
    this.details.push(this.fb.control(''));
  }

  removeDetail(index: number): void {
    this.details.removeAt(index);
  }

  /* =====================================================
     SPECIFICATIONS
  ===================================================== */

  addSpecification(): void {
    this.specifications.push(this.fb.control(''));
  }

  removeSpecification(index: number): void {
    this.specifications.removeAt(index);
  }

  /* =====================================================
     CLOUDINARY
  ===================================================== */

  uploadImage(file: File): Promise<string> {
    const formData = new FormData();

    formData.append('file', file);

    formData.append('upload_preset', 'glamify_upload');

    return fetch('https://api.cloudinary.com/v1_1/glamify/image/upload', {
      method: 'POST',
      body: formData,
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error('Cloudinary upload failed');
        }

        return res.json();
      })
      .then((data) => data.secure_url);
  }

  /* =====================================================
     SUBMIT
  ===================================================== */

  async submit(): Promise<void> {
    if (this.isLoading) {
      return;
    }

    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();

      Swal.fire({
        icon: 'warning',
        title: 'Check the form',
        text: 'Please complete all required fields.',
      });

      return;
    }

    this.isLoading = true;

    try {
      const formValue = this.productForm.getRawValue();

      /* ================================================
         MAIN IMAGE
      ================================================ */

      const mainImageUrl = formValue.image || '';

      /* ================================================
         NEW PRODUCT GALLERY IMAGES
      ================================================ */

      const newImagesUrls = await Promise.all(
        this.newImagesFiles.map((file) => this.uploadImage(file)),
      );

      const existingImages = Array.isArray(formValue.images)
        ? formValue.images.filter((image: string) => !!image)
        : [];

      const finalImages = [...existingImages, ...newImagesUrls];

      /* ================================================
         VARIANTS
      ================================================ */

      const finalVariants = [];

      for (let index = 0; index < formValue.variants.length; index++) {
        const variant = formValue.variants[index];

        /*
         * Upload new images for this variant
         */
        const newVariantImages = await Promise.all(
          (this.newVariantImagesFiles[index] || []).map((file) =>
            this.uploadImage(file),
          ),
        );

        /*
         * Existing variant images
         */
        const existingVariantImages = Array.isArray(variant.images)
          ? variant.images.filter((image: string) => !!image)
          : [];

        const finalVariantImages = [
          ...existingVariantImages,
          ...newVariantImages,
        ];

        /*
         * Normalize sizes
         */
        const finalSizes = (variant.sizes || []).map((size: any) => ({
          size: size.size || '',

          price: Number(size.price) || 0,

          discount: Number(size.discount) || 0,

          stock: Number(size.stock) || 0,
        }));

        finalVariants.push({
          name: variant.name || '',

          images: finalVariantImages,

          sizes: finalSizes,
        });
      }

      /* ================================================
         FINAL PRODUCT OBJECT
      ================================================ */

      const data = {
        name: formValue.name || '',

        brand: formValue.brand || '',

        category: formValue.category || '',

        rate: Number(formValue.rate) || 0,

        mainPrice: Number(formValue.mainPrice) || 0,

        image: mainImageUrl,

        images: finalImages,

        variants: finalVariants,

        details: (formValue.details || []).filter((detail: string) =>
          detail?.trim(),
        ),

        specifications: (formValue.specifications || []).filter(
          (specification: string) => specification?.trim(),
        ),

        updatedAt: new Date(),
      };

      /* ================================================
         UPDATE
      ================================================ */

      this.productService.updateProduct(this.productId, data).subscribe({
        next: () => {
          this.isLoading = false;

          Swal.fire({
            icon: 'success',

            title: 'Product Updated',

            text: 'The product has been updated successfully.',

            confirmButtonColor: '#111111',
          }).then(() => {
            this.router.navigate(['/view-product/', this.productId]);
          });
        },

        error: (error) => {
          console.error('Error updating product:', error);

          this.isLoading = false;

          Swal.fire({
            icon: 'error',

            title: 'Update Failed',

            text: 'Something went wrong while updating the product.',
          });
        },
      });
    } catch (error) {
      console.error('Error preparing product update:', error);

      this.isLoading = false;

      Swal.fire({
        icon: 'error',

        title: 'Upload Failed',

        text: 'One or more images could not be uploaded.',
      });
    }
  }
}
