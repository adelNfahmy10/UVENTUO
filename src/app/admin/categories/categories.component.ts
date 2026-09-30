import {
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  inject,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import Swal from 'sweetalert2';
import { ToastrService } from 'ngx-toastr';
import { from } from 'rxjs';

import { CategoryService } from '../../../services/category/category.service';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './categories.component.html',
  styleUrl: './categories.component.scss',
})
export class CategoriesComponent implements OnInit {
  private readonly _CategoryService = inject(CategoryService);
  private readonly _ToastrService = inject(ToastrService);

  @ViewChild('categoryImageInput')
  categoryImageInput?: ElementRef<HTMLInputElement>;

  @ViewChild('categoryNameInput')
  categoryNameInput?: ElementRef<HTMLInputElement>;

  categoryForm: FormGroup;

  categories: any[] = [];

  selectedImageFile: File | null = null;

  imagePreview: string | null = null;

  isLoading = false;

  editingCategory: any = null;

  constructor(private fb: FormBuilder) {
    this.categoryForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
    });
  }

  ngOnInit(): void {
    this.getCategories();
  }

  // =====================================================
  // GET CATEGORIES
  // =====================================================

  getCategories(): void {
    this._CategoryService.getAllCategories().subscribe({
      next: (res: any) => {
        this.categories = res || [];
      },

      error: (err) => {
        console.error(err);

        this._ToastrService.error('Unable to load categories.', 'Error');
      },
    });
  }

  // =====================================================
  // IMAGE SELECT
  // =====================================================

  onMainImageChange(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];

    // Validate type
    if (!file.type.startsWith('image/')) {
      this._ToastrService.error(
        'Please select a valid image file.',
        'Invalid Image',
      );

      input.value = '';
      return;
    }

    // Validate size - 5MB
    if (file.size > 5 * 1024 * 1024) {
      this._ToastrService.error(
        'Image size must be less than 5MB.',
        'Image Too Large',
      );

      input.value = '';
      return;
    }

    this.selectedImageFile = file;

    // Preview
    const reader = new FileReader();

    reader.onload = () => {
      this.imagePreview = reader.result as string;
    };

    reader.readAsDataURL(file);
  }

  // =====================================================
  // REMOVE SELECTED IMAGE
  // =====================================================

  removeSelectedImage(): void {
    this.selectedImageFile = null;

    // During edit, restore the old image
    if (this.editingCategory?.image) {
      this.imagePreview = this.editingCategory.image;
    } else {
      this.imagePreview = null;
    }

    if (this.categoryImageInput) {
      this.categoryImageInput.nativeElement.value = '';
    }
  }

  // =====================================================
  // CLOUDINARY UPLOAD
  // =====================================================

  uploadImage(file: File): Promise<string> {
    const formData = new FormData();

    formData.append('file', file);

    formData.append('upload_preset', 'glamify_upload');

    return fetch('https://api.cloudinary.com/v1_1/glamify/image/upload', {
      method: 'POST',
      body: formData,
    })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error('Cloudinary upload failed.');
        }

        return res.json();
      })
      .then((data) => {
        if (!data?.secure_url) {
          throw new Error('Cloudinary did not return an image URL.');
        }

        return data.secure_url;
      });
  }

  // =====================================================
  // ADD / UPDATE
  // =====================================================

  submit(): void {
    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();

      this._ToastrService.error('Please fill in the required fields.', 'Error');

      return;
    }

    this.isLoading = true;

    // ===================================================
    // UPDATE
    // ===================================================

    if (this.editingCategory) {
      this.updateExistingCategory();

      return;
    }

    // ===================================================
    // ADD
    // ===================================================

    if (!this.selectedImageFile) {
      this._ToastrService.error(
        'Please select a category image.',
        'Image Required',
      );

      this.isLoading = false;

      return;
    }

    from(this.uploadImage(this.selectedImageFile)).subscribe({
      next: (imageUrl: string) => {
        const data = {
          name: this.categoryForm.value.name.trim(),
          image: imageUrl,
          createdAt: new Date(),
        };

        this._CategoryService.addCategory(data).subscribe({
          next: () => {
            this._ToastrService.success(
              'Category added successfully.',
              'Success',
            );

            this.resetForm();

            this.getCategories();

            this.isLoading = false;
          },

          error: (err) => {
            console.error(err);

            this._ToastrService.error('Error adding category.', 'Error');

            this.isLoading = false;
          },
        });
      },

      error: (err) => {
        console.error(err);

        this._ToastrService.error('Error uploading image.', 'Error');

        this.isLoading = false;
      },
    });
  }

  // =====================================================
  // UPDATE EXISTING CATEGORY
  // =====================================================

  private updateExistingCategory(): void {
    const newName = this.categoryForm.value.name.trim();

    // -----------------------------------------------
    // No new image
    // -----------------------------------------------

    if (!this.selectedImageFile) {
      const data = {
        name: newName,
        image: this.editingCategory.image,
      };

      this._CategoryService
        .updateCategory(this.editingCategory.id, data)
        .subscribe({
          next: () => {
            this._ToastrService.success(
              'Category updated successfully.',
              'Success',
            );

            this.resetForm();

            this.getCategories();

            this.isLoading = false;
          },

          error: (err) => {
            console.error(err);

            this._ToastrService.error('Error updating category.', 'Error');

            this.isLoading = false;
          },
        });

      return;
    }

    // -----------------------------------------------
    // New image selected
    // -----------------------------------------------

    from(this.uploadImage(this.selectedImageFile)).subscribe({
      next: (imageUrl: string) => {
        const data = {
          name: newName,
          image: imageUrl,
        };

        this._CategoryService
          .updateCategory(this.editingCategory.id, data)
          .subscribe({
            next: () => {
              this._ToastrService.success(
                'Category updated successfully.',
                'Success',
              );

              this.resetForm();

              this.getCategories();

              this.isLoading = false;
            },

            error: (err) => {
              console.error(err);

              this._ToastrService.error('Error updating category.', 'Error');

              this.isLoading = false;
            },
          });
      },

      error: (err) => {
        console.error(err);

        this._ToastrService.error('Error uploading image.', 'Error');

        this.isLoading = false;
      },
    });
  }

  // =====================================================
  // START EDIT
  // =====================================================

  updateCategory(category: any): void {
    this.editingCategory = category;

    this.categoryForm.patchValue({
      name: category.name || '',
    });

    // Existing image
    this.imagePreview = category.image || null;

    // New image reset
    this.selectedImageFile = null;

    if (this.categoryImageInput) {
      this.categoryImageInput.nativeElement.value = '';
    }

    // Scroll to form
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }

  // =====================================================
  // CANCEL EDIT
  // =====================================================

  cancelEdit(): void {
    this.resetForm();
  }

  // =====================================================
  // RESET
  // =====================================================

  private resetForm(): void {
    this.categoryForm.reset();

    this.editingCategory = null;

    this.selectedImageFile = null;

    this.imagePreview = null;

    if (this.categoryImageInput) {
      this.categoryImageInput.nativeElement.value = '';
    }
  }

  // =====================================================
  // DELETE
  // =====================================================

  deleteCategory(id: string): void {
    Swal.fire({
      title: 'Delete Category?',
      text: 'This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#343434',
      confirmButtonText: 'Yes, Delete It',
      cancelButtonText: 'Cancel',
      background: '#111',
      color: '#f7f6f1',
    }).then((result) => {
      if (!result.isConfirmed) {
        return;
      }

      this._CategoryService.deleteCategory(id).subscribe({
        next: () => {
          this.categories = this.categories.filter(
            (category) => category.id !== id,
          );

          // If currently editing deleted category
          if (this.editingCategory?.id === id) {
            this.resetForm();
          }

          Swal.fire({
            title: 'Deleted!',
            text: 'Category has been deleted.',
            icon: 'success',
            timer: 1500,
            showConfirmButton: false,
            background: '#111',
            color: '#f7f6f1',
          });
        },

        error: (err) => {
          console.error(err);

          this._ToastrService.error('Error deleting category.', 'Error');
        },
      });
    });
  }

  // =====================================================
  // HELPERS
  // =====================================================

  formatFileSize(bytes: number): string {
    if (bytes === 0) {
      return '0 Bytes';
    }

    const units = ['Bytes', 'KB', 'MB', 'GB'];

    const i = Math.floor(Math.log(bytes) / Math.log(1024));

    return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + units[i];
  }

  categoryNameInputFocus(): void {
    const input = document.getElementById(
      'categoryName',
    ) as HTMLInputElement | null;

    input?.focus();
  }
}
