import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { CategoryService } from '../../../services/category/category.service';
import { ToastrService } from 'ngx-toastr';
import { from } from 'rxjs';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './categories.component.html',
  styleUrl: './categories.component.scss'
})
export class CategoriesComponent {
  private readonly _CategoryService = inject(CategoryService)
  private readonly _ToastrService = inject(ToastrService)


  categoryForm: FormGroup;
  categories: any[] = [];
  mainImageFile!: File | null;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
  ) {

    this.categoryForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]]
    });

  }

  ngOnInit(): void {
    this.getCategories();
  }

  // ========= FILES =========
  onMainImageChange(event: any): void {
    const file = event.target.files[0];
    if (file) this.mainImageFile = file;
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

  // ================= ADD =================
  submit(): void {
    if (this.categoryForm.invalid) {
      this._ToastrService.error('Please fill in the required fields.', 'Error');
      this.categoryForm.markAllAsTouched();
      return;
    }

    if (!this.mainImageFile) {
      this._ToastrService.error('Please select a main image.', 'Error');
      return;
    }

    this.isLoading = true;

    from(this.uploadImage(this.mainImageFile)).subscribe({
      next: (mainImageUrl) => {

        const data = {
          ...this.categoryForm.value,
          image: mainImageUrl,
          createdAt: new Date()
        };

        this._CategoryService.addCategory(data).subscribe({
          next: () => {
            this._ToastrService.success('Category added successfully.', 'Success');
            this.categoryForm.reset();
            this.mainImageFile = null;
            this.getCategories();
            this.isLoading = false;
          },
          error: (err) => {
            this._ToastrService.error('Error adding category.', 'Error');
            console.log(err);
            this.isLoading = false;
          }
        });

      },
      error: (err) => {
        this._ToastrService.error('Error uploading image.', 'Error');
        console.log(err);
        this.isLoading = false;
      }
    });
  }


  // ================= GET ALL =================
  getCategories(): void {
    this._CategoryService.getAllCategories().subscribe((res:any) => {
      this.categories = res;
    });
  }

  // ================= DELETE =================
  deleteCategory(id: string): void {

    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!"
    }).then((result) => {

      if (result.isConfirmed) {

        this._CategoryService.deleteCategory(id).subscribe({
          next: () => {

            this.categories = this.categories.filter(c => c.id !== id);

            Swal.fire({
              title: "Deleted!",
              text: "Category has been deleted.",
              icon: "success",
              timer: 1500,
              showConfirmButton: false
            });

          }
        });

      }

    });

  }

  // ================= UPDATE =================
  updateCategory(category: any): void {

    Swal.fire({
      title: 'Edit Category',
      input: 'text',
      inputValue: category.name,
      showCancelButton: true,
      confirmButtonText: 'Update',
      inputValidator: (value) => {
        if (!value) return 'Category name is required!';
        return null;
      }
    }).then((result) => {

      if (result.isConfirmed) {

        const newName = result.value;

        this._CategoryService.updateCategory(category.id, newName).subscribe({
          next: () => {

            this.categories = this.categories.map(c =>
              c.id === category.id ? { ...c, name: newName } : c
            );

            Swal.fire({
              title: 'Updated!',
              icon: 'success',
              timer: 1500,
              showConfirmButton: false
            });

          }
        });

      }

    });

  }
}
