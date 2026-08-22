import { Component, inject } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProductService } from '../../../services/products/product.service';
import { BrandService } from '../../../services/brand/brand.service';
import { CategoryService } from '../../../services/category/category.service';

@Component({
  selector: 'app-add-product',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule],
  templateUrl: './add-product.component.html',
  styleUrl: './add-product.component.scss'
})

export class AddProductComponent {
  private readonly _ProductService = inject(ProductService)
  private readonly _BrandService = inject(BrandService)
  private readonly _CategoryService = inject(CategoryService)

  productForm: FormGroup;
  mainImageFile!: File | null;
  imagesFiles: File[] = [];
  imagesVariantsFiles: File[][] = [];
  brands: any[] = [];
  categories: any[] = [];
  isLoading:boolean = false

  phone:string = ''

  ngOnInit(): void {
    this.getBrands();
    this.getCategoies();
    this.addVariant();
  }

  getBrands(): void {
    this._BrandService.getAllBrands().subscribe(res => {
      this.brands = res;
    });
  }

  getCategoies(): void {
    this._CategoryService.getAllCategories().subscribe(res => {
      this.categories = res;
    });
  }

  constructor(private fb: FormBuilder) {

    this.productForm = this.fb.group({
      name: [''],
      brand: [''],
      category: [''],
      price: [''],

      rate: [0],

      variants: this.fb.array([]),

      details: this.fb.array([]),
      specifications: this.fb.array([]),
    });

    this.addDetail();
    this.addSpecification();
  }

  // ================= FILES =================

  onMainImageChange(event: any): void {
    const file = event.target.files[0];
    if (file) this.mainImageFile = file;
  }

  onImagesChange(event: any): void {
    const files = event.target.files;
    this.imagesFiles = Array.from(files);
  }

  removeImage(index: number): void {
    this.imagesFiles.splice(index, 1);
  }


  onVariantImagesSelected(event: Event, variantIndex: number) {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;
    const files = Array.from(input.files);
    if (!this.imagesVariantsFiles[variantIndex]) {
      this.imagesVariantsFiles[variantIndex] = [];
    }
    this.imagesVariantsFiles[variantIndex].push(...files);
    // optional preview / form controls
    files.forEach(() => {
      this.getVariantImages(variantIndex).push(
        this.fb.control('')
      );
    });
  }

// ================= FORM ARRAYS =================
// ======= Variants =======
  get variants(): FormArray {
    return this.productForm.get('variants') as FormArray;
  }
  // Add Color
  addVariant(){
    this.variants.push(
      this.fb.group({
        color: [''],
        colorCode: ['#000000'],
        images: this.fb.array([]),
        sizes: this.fb.array([])
      })
    );
    this.addSize(0)
  }
  // Remove Color
  removeVariant(index:number){
    this.variants.removeAt(index);

  }

  // Variant IMAGES
  getVariantImages(index:number):FormArray{
    return this.variants
      .at(index)
      .get('images') as FormArray;
  }
  addImage(variantIndex:number,url:string){
    this.getVariantImages(variantIndex)
    .push(
      this.fb.control(url)
    );
  }
  removeVariantImage(variantIndex:number,imageIndex:number){
    this.getVariantImages(variantIndex).removeAt(imageIndex);
  }

  // SIZES
  getSizes(index:number):FormArray{
    return this.variants
    .at(index)
    .get('sizes') as FormArray;
  }
  addSize(variantIndex:number){
    this.getSizes(variantIndex).push(this.fb.group({
        size:[
          '',
          Validators.required
        ],

        price:[
          0,
          Validators.required
        ],

        discount:[
          0
        ],

        stock:[
          0,
          Validators.required
        ]

      })

    );
  }
  removeVariantSize(
    variantIndex:number,
    sizeIndex:number
  ){
  this.getSizes(variantIndex)
  .removeAt(sizeIndex);
  }


  get details(): FormArray {
    return this.productForm.get('details') as FormArray;
  }

  addDetail(): void {
    this.details.push(this.fb.control(''));
  }

  get specifications(): FormArray {
    return this.productForm.get('specifications') as FormArray;
  }

  addSpecification(): void {
    this.specifications.push(this.fb.control(''));
  }

  // ================= CLOUDINARY =================

  uploadImage(file: File): Promise<string> {

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'glamify_upload');

    return fetch(
      'https://api.cloudinary.com/v1_1/glamify/image/upload',
      {
        method: 'POST',
        body: formData
      }
    )
      .then(res => res.json())
      .then(data => data.secure_url);

  }

  // ================= SUBMIT =================
  async submit(): Promise<void> {
    this.isLoading = true

    try {

      // MAIN IMAGE
      const mainImageUrl = await this.uploadImage(this.mainImageFile!);

      // MULTIPLE IMAGES
      const imagesUrls = await Promise.all(
        this.imagesFiles.map(file =>
          this.uploadImage(file)
        )
      );

      // VARIANTS IMAGES
      const variantsImagesUrls = await Promise.all(
        this.imagesVariantsFiles.map(images =>
          Promise.all(
            images.map(file =>
              this.uploadImage(file)
            )
          )
        )
      );

      // ADD IMAGES TO VARIANTS
      const variants = this.productForm.value.variants.map(
        (variant: any, index: number) => ({
          ...variant,
          images: variantsImagesUrls[index] || []
        })
      );


      // FINAL DATA
      const data = {
        ...this.productForm.value,
        image: mainImageUrl,
        images: imagesUrls,
        variants,
        createdAt: new Date()
      };

      // SAVE TO FIREBASE
      this._ProductService.addProduct(data).subscribe({
        next: (res) => {
          this.isLoading = false
          this.resetForm();
        },
        error: (err) => {
          this.isLoading = false
          console.log('Error:', err);
        }
      });
    }
    catch (error) {
      this.isLoading = false
      console.log('Upload Error:', error);
    }
  }


  resetForm(): void {
    this.productForm.reset({
      name: '',
      brand: '',
      category: '',
      rate: 0
    });

    // Clear FormArrays
    (this.productForm.get('variants') as FormArray).clear();
    (this.productForm.get('details') as FormArray).clear();
    (this.productForm.get('specifications') as FormArray).clear();

    // Clear uploaded files
    this.mainImageFile = null;
    this.imagesFiles = [];
    this.imagesVariantsFiles = [];
  }
}
