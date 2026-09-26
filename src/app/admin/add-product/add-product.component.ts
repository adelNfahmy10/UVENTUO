import { Component, inject } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import { ProductService } from '../../../services/products/product.service';
import { BrandService } from '../../../services/brand/brand.service';
import { CategoryService } from '../../../services/category/category.service';

@Component({
  selector: 'app-add-product',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormsModule
  ],
  templateUrl: './add-product.component.html',
  styleUrl: './add-product.component.scss'
})
export class AddProductComponent {

  private readonly _ProductService = inject(ProductService);
  private readonly _BrandService = inject(BrandService);
  private readonly _CategoryService = inject(CategoryService);

  productForm: FormGroup;

  // =========================================
  // PRODUCT FILES
  // =========================================

  mainImageFile: File | null = null;

  imagesFiles: File[] = [];

  // Images for every product variant
  //
  // Example:
  //
  // [
  //   [original-1.jpg, original-2.jpg],
  //   [high-copy-1.jpg, high-copy-2.jpg]
  // ]
  //
  imagesVariantsFiles: File[][] = [];


  // =========================================
  // DATA
  // =========================================

  brands: any[] = [];

  categories: any[] = [];

  isLoading = false;

  phone = '';


  // =========================================
  // CONSTRUCTOR
  // =========================================

  constructor(
    private fb: FormBuilder
  ) {

    this.productForm = this.fb.group({

      name: [
        '',
        Validators.required
      ],

      brand: [
        '',
        Validators.required
      ],

      category: [
        '',
        Validators.required
      ],

      rate: [
        0
      ],

      mainPrice: [
        0
      ],

      // =====================================
      // PRODUCT VARIANTS
      // =====================================

      variants: this.fb.array([]),

      // =====================================
      // DETAILS
      // =====================================

      details: this.fb.array([]),

      // =====================================
      // SPECIFICATIONS
      // =====================================

      specifications: this.fb.array([])

    });


    // Default detail
    this.addDetail();

    // Default specification
    this.addSpecification();

  }


  // =========================================
  // INIT
  // =========================================

  ngOnInit(): void {

    this.getBrands();

    this.getCategories();

    // Start with one variant
    this.addVariant();

  }


  // =========================================
  // BRANDS
  // =========================================

  getBrands(): void {

    this._BrandService
      .getAllBrands()
      .subscribe({

        next: (res) => {

          this.brands = res;

        },

        error: (err) => {

          console.error(
            'Error loading brands:',
            err
          );

        }

      });

  }


  // =========================================
  // CATEGORIES
  // =========================================

  getCategories(): void {

    this._CategoryService
      .getAllCategories()
      .subscribe({

        next: (res) => {

          this.categories = res;

        },

        error: (err) => {

          console.error(
            'Error loading categories:',
            err
          );

        }

      });

  }


  // =========================================
  // MAIN IMAGE
  // =========================================

  onMainImageChange(event: Event): void {

    const input =
      event.target as HTMLInputElement;

    if (!input.files?.length) {
      return;
    }

    this.mainImageFile =
      input.files[0];

  }


  // =========================================
  // PRODUCT GALLERY IMAGES
  // =========================================

  onImagesChange(event: Event): void {

    const input =
      event.target as HTMLInputElement;

    if (!input.files?.length) {
      return;
    }

    this.imagesFiles =
      Array.from(input.files);

  }


  removeImage(index: number): void {

    this.imagesFiles.splice(
      index,
      1
    );

  }


  // =========================================
  // VARIANTS
  // =========================================

  get variants(): FormArray {

    return this.productForm
      .get('variants') as FormArray;

  }


  /*
   * Add a new product variant.
   *
   * Examples:
   *
   * Original
   * High Copy
   * Tester
   * Inspired
   * etc.
   */

  addVariant(): void {

    const variantIndex =
      this.variants.length;


    const variant =
      this.fb.group({

        // Variant name
        //
        // Example:
        // Original
        // High Copy
        // Tester

        name: [
          '',
          Validators.required
        ],


        // Images belonging ONLY
        // to this variant

        images:
          this.fb.array([]),


        // Sizes belonging ONLY
        // to this variant

        sizes:
          this.fb.array([])

      });


    this.variants.push(
      variant
    );


    // Every new variant starts
    // with one size

    this.addSize(
      variantIndex
    );


    // Keep uploaded files array
    // synchronized with variants

    this.imagesVariantsFiles[
      variantIndex
    ] = [];

  }


  /*
   * Remove complete variant.
   *
   * This removes:
   *
   * - Variant name
   * - Variant images
   * - Variant sizes
   */

  removeVariant(
    index: number
  ): void {

    this.variants.removeAt(
      index
    );


    this.imagesVariantsFiles.splice(
      index,
      1
    );

  }


  // =========================================
  // VARIANT IMAGES
  // =========================================

  onVariantImagesSelected(
    event: Event,
    variantIndex: number
  ): void {

    const input =
      event.target as HTMLInputElement;

    if (!input.files?.length) {
      return;
    }


    const files =
      Array.from(input.files);


    if (
      !this.imagesVariantsFiles[
        variantIndex
      ]
    ) {

      this.imagesVariantsFiles[
        variantIndex
      ] = [];

    }


    this.imagesVariantsFiles[
      variantIndex
    ].push(
      ...files
    );

  }


  removeVariantImage(
    variantIndex: number,
    imageIndex: number
  ): void {

    if (
      !this.imagesVariantsFiles[
        variantIndex
      ]
    ) {
      return;
    }


    this.imagesVariantsFiles[
      variantIndex
    ].splice(
      imageIndex,
      1
    );

  }


  // =========================================
  // SIZES
  // =========================================

  getSizes(
    variantIndex: number
  ): FormArray {

    return this.variants
      .at(variantIndex)
      .get('sizes') as FormArray;

  }


  /*
   * Add a size to a specific variant.
   *
   * Example:
   *
   * Original
   *   ├── 50 ML
   *   ├── 100 ML
   *   └── 200 ML
   *
   * High Copy
   *   ├── 50 ML
   *   └── 100 ML
   */

  addSize(
    variantIndex: number
  ): void {

    this.getSizes(
      variantIndex
    ).push(

      this.fb.group({

        size: [
          '',
          Validators.required
        ],

        price: [
          0,
          [
            Validators.required,
            Validators.min(0)
          ]
        ],

        discount: [
          0,
          [
            Validators.min(0)
          ]
        ],

        stock: [
          0,
          [
            Validators.required,
            Validators.min(0)
          ]
        ]

      })

    );

  }


  /*
   * Remove a specific size
   * from a specific variant.
   */

  removeVariantSize(
    variantIndex: number,
    sizeIndex: number
  ): void {

    this.getSizes(
      variantIndex
    ).removeAt(
      sizeIndex
    );

  }


  // =========================================
  // DETAILS
  // =========================================

  get details(): FormArray {

    return this.productForm
      .get('details') as FormArray;

  }


  addDetail(): void {

    this.details.push(
      this.fb.control('')
    );

  }


  removeDetail(
    index: number
  ): void {

    this.details.removeAt(
      index
    );

  }


  // =========================================
  // SPECIFICATIONS
  // =========================================

  get specifications(): FormArray {

    return this.productForm
      .get('specifications') as FormArray;

  }


  addSpecification(): void {

    this.specifications.push(
      this.fb.control('')
    );

  }


  removeSpecification(
    index: number
  ): void {

    this.specifications.removeAt(
      index
    );

  }


  // =========================================
  // CLOUDINARY
  // =========================================

  uploadImage(
    file: File
  ): Promise<string> {

    const formData =
      new FormData();


    formData.append(
      'file',
      file
    );


    formData.append(
      'upload_preset',
      'glamify_upload'
    );


    return fetch(
      'https://api.cloudinary.com/v1_1/glamify/image/upload',
      {
        method: 'POST',
        body: formData
      }
    )
      .then(res => {

        if (!res.ok) {

          throw new Error(
            'Cloudinary upload failed'
          );

        }

        return res.json();

      })
      .then(data => {

        return data.secure_url;

      });

  }


  // =========================================
  // SUBMIT
  // =========================================

  async submit(): Promise<void> {

    /*
     * Prevent duplicate submissions.
     */

    if (this.isLoading) {
      return;
    }


    /*
     * Basic form validation.
     */

    if (
      this.productForm.invalid
    ) {

      this.productForm.markAllAsTouched();

      return;

    }


    /*
     * A product must have
     * a main image.
     */

    if (!this.mainImageFile) {

      console.error(
        'Main product image is required.'
      );

      return;

    }


    this.isLoading = true;


    try {

      // =====================================
      // MAIN IMAGE
      // =====================================

      const mainImageUrl =
        await this.uploadImage(
          this.mainImageFile
        );


      // =====================================
      // PRODUCT GALLERY
      // =====================================

      const imagesUrls =
        await Promise.all(

          this.imagesFiles.map(
            file =>
              this.uploadImage(file)
          )

        );


      // =====================================
      // VARIANT IMAGES
      // =====================================

      /*
       * Each index belongs to
       * one specific variant.
       *
       * Example:
       *
       * index 0 = Original images
       * index 1 = High Copy images
       */

      const variantsImagesUrls =
        await Promise.all(

          this.imagesVariantsFiles.map(
            images =>

              Promise.all(

                images.map(
                  file =>
                    this.uploadImage(file)
                )

              )

          )

        );


      // =====================================
      // BUILD FINAL VARIANTS
      // =====================================

      const variants =
        this.productForm.value.variants
          .map(
            (
              variant: any,
              index: number
            ) => ({

              /*
               * Variant name
               *
               * Example:
               * Original
               * High Copy
               */

              name:
                variant.name,


              /*
               * Images specific
               * to this variant.
               */

              images:
                variantsImagesUrls[
                  index
                ] || [],


              /*
               * Sizes specific
               * to this variant.
               *
               * Every size contains:
               *
               * size
               * price
               * discount
               * stock
               */

              sizes:
                variant.sizes || []

            })

          );


      // =====================================
      // FINAL PRODUCT
      // =====================================

      const data = {

        name:
          this.productForm.value.name,

        brand:
          this.productForm.value.brand,

        category:
          this.productForm.value.category,

        rate:
          this.productForm.value.rate,

        mainPrice:
          this.productForm.value.mainPrice,

        image:
          mainImageUrl,

        images:
          imagesUrls,

        variants,

        details:
          this.productForm.value.details || [],

        specifications:
          this.productForm.value.specifications || [],

        createdAt:
          new Date()

      };


      console.log(
        'FINAL PRODUCT DATA:',
        data
      );


      // =====================================
      // SAVE TO FIREBASE
      // =====================================

      this._ProductService
        .addProduct(data)
        .subscribe({

          next: () => {

            this.isLoading = false;

            this.resetForm();

          },

          error: (err) => {

            this.isLoading = false;

            console.error(
              'Error saving product:',
              err
            );

          }

        });

    }

    catch (error) {

      this.isLoading = false;

      console.error(
        'Upload Error:',
        error
      );

    }

  }


  // =========================================
  // RESET
  // =========================================

  resetForm(): void {

    /*
     * Reset normal fields.
     */

    this.productForm.patchValue({

      name: '',

      brand: '',

      category: '',

      rate: 0,

      mainPrice: 0,

    });


    /*
     * Clear variants.
     */

    this.variants.clear();


    /*
     * Clear details.
     */

    this.details.clear();


    /*
     * Clear specifications.
     */

    this.specifications.clear();


    /*
     * Clear files.
     */

    this.mainImageFile = null;

    this.imagesFiles = [];

    this.imagesVariantsFiles = [];


    /*
     * Re-create default form rows.
     */

    this.addVariant();

    this.addDetail();

    this.addSpecification();

  }

}
