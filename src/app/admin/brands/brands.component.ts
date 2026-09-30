import { Component, OnInit, inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import Swal from 'sweetalert2';
import { ToastrService } from 'ngx-toastr';

import { BrandService } from '../../../services/brand/brand.service';

@Component({
  selector: 'app-brands',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './brands.component.html',
  styleUrl: './brands.component.scss',
})
export class BrandsComponent implements OnInit {
  private readonly _ToastrService = inject(ToastrService);

  brandForm: FormGroup;
  editBrandForm: FormGroup;

  brands: any[] = [];

  isLoading = false;
  isUpdating = false;

  editingBrand: any = null;

  constructor(
    private fb: FormBuilder,
    private brandService: BrandService,
  ) {
    // =========================
    // ADD FORM
    // =========================
    this.brandForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
    });

    // =========================
    // EDIT FORM
    // =========================
    this.editBrandForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
    });
  }

  // =========================
  // INIT
  // =========================
  ngOnInit(): void {
    this.getBrands();
  }

  // =========================
  // ADD BRAND
  // =========================
  submit(): void {
    if (this.brandForm.invalid) {
      this.brandForm.markAllAsTouched();

      this._ToastrService.error(
        'Please enter a valid brand name.',
        'Invalid Brand',
      );

      return;
    }

    this.isLoading = true;

    const name = this.brandForm.value.name?.trim();

    const data = {
      name,
      createdAt: new Date(),
    };

    this.brandService.addBrand(data).subscribe({
      next: () => {
        this._ToastrService.success(
          'Brand has been added successfully.',
          'Success',
        );

        this.brandForm.reset();

        this.isLoading = false;

        // Refresh list
        this.getBrands();
      },

      error: (err) => {
        console.error(err);

        this._ToastrService.error(
          'Something went wrong while adding the brand.',
          'Error',
        );

        this.isLoading = false;
      },
    });
  }

  // =========================
  // GET BRANDS
  // =========================
  getBrands(): void {
    this.brandService.getAllBrands().subscribe({
      next: (res: any[]) => {
        this.brands = res || [];
      },

      error: (err) => {
        console.error(err);

        this._ToastrService.error('Failed to load brands.', 'Error');
      },
    });
  }

  // =========================
  // OPEN EDIT MODAL
  // =========================
  updateBrand(brand: any): void {
    this.editingBrand = brand;

    this.editBrandForm.patchValue({
      name: brand.name,
    });
  }

  // =========================
  // CLOSE EDIT MODAL
  // =========================
  closeEditModal(): void {
    if (this.isUpdating) {
      return;
    }

    this.editingBrand = null;

    this.editBrandForm.reset();
  }

  // =========================
  // SAVE BRAND UPDATE
  // =========================
  saveBrandUpdate(): void {
    if (!this.editingBrand) {
      return;
    }

    if (this.editBrandForm.invalid) {
      this.editBrandForm.markAllAsTouched();

      return;
    }

    const newName = this.editBrandForm.value.name?.trim();

    if (!newName) {
      this.editBrandForm.markAllAsTouched();

      return;
    }

    // No changes
    if (newName === this.editingBrand.name) {
      this._ToastrService.info('No changes were made.', 'Nothing to update');

      this.closeEditModal();

      return;
    }

    this.isUpdating = true;

    this.brandService.updateBrand(this.editingBrand.id, newName).subscribe({
      next: () => {
        // Update UI immediately
        this.brands = this.brands.map((brand) =>
          brand.id === this.editingBrand.id
            ? {
                ...brand,
                name: newName,
              }
            : brand,
        );

        this._ToastrService.success(
          'Brand has been updated successfully.',
          'Updated',
        );

        this.isUpdating = false;

        this.closeEditModal();
      },

      error: (err) => {
        console.error(err);

        this._ToastrService.error('Failed to update the brand.', 'Error');

        this.isUpdating = false;
      },
    });
  }

  // =========================
  // DELETE BRAND
  // =========================
  deleteBrand(id: string): void {
    const brand = this.brands.find((item) => item.id === id);

    Swal.fire({
      title: 'Delete Brand?',

      html: `
        <div style="font-size:14px;color:#888;">
          Are you sure you want to delete
          <strong style="color:#111;">
            ${brand?.name || 'this brand'}
          </strong>?
          <br>
          This action cannot be undone.
        </div>
      `,

      icon: 'warning',

      showCancelButton: true,

      confirmButtonText: 'Yes, delete it',

      cancelButtonText: 'Cancel',

      confirmButtonColor: '#dc3545',

      cancelButtonColor: '#333',

      reverseButtons: true,
    }).then((result) => {
      if (!result.isConfirmed) {
        return;
      }

      this.brandService.deleteBrand(id).subscribe({
        next: () => {
          // Remove immediately from UI
          this.brands = this.brands.filter((brand) => brand.id !== id);

          this._ToastrService.success(
            'Brand has been deleted successfully.',
            'Deleted',
          );
        },

        error: (err) => {
          console.error(err);

          this._ToastrService.error(
            'Something went wrong while deleting the brand.',
            'Error',
          );
        },
      });
    });
  }
}
