import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { BrandService } from '../../../services/brand/brand.service';

@Component({
  selector: 'app-brands',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './brands.component.html',
  styleUrl: './brands.component.scss'
})
export class BrandsComponent {
  brandForm: FormGroup;
  isLoading = false;
  brands: any[] = [];

  constructor(
    private fb: FormBuilder,
    private brandService: BrandService
  ) {
    this.brandForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]]
    });
  }

  ngOnInit(): void {
    this.getBrands();
  }

  submit(): void {

    if (this.brandForm.invalid) {
      this.brandForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;

    let data = {
      name: this.brandForm.value.name,
      createdAt: new Date()
    };

    this.brandService.addBrand(data).subscribe({
      next: () => {
        this.brandForm.reset();
        this.isLoading = false;
      },
      error: (err) => {
        console.log(err);
        this.isLoading = false;
      }
    });

  }


  getBrands(): void {
    this.brandService.getAllBrands().subscribe(res => {
      this.brands = res;
    });
  }

  deleteBrand(id: string): void {
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
        this.brandService.deleteBrand(id).subscribe({
          next: () => {
            // remove from UI
            this.brands = this.brands.filter(b => b.id !== id);

            // success alert
            Swal.fire({
              title: "Deleted!",
              text: "Brand has been deleted successfully.",
              icon: "success",
              timer: 1500,
              showConfirmButton: false
            });

          },
          error: (err) => {
            console.log(err);

            Swal.fire({
              title: "Error!",
              text: "Something went wrong while deleting.",
              icon: "error"
            });
          }
        });
      }
    });
  }

  updateBrand(brand: any): void {

    Swal.fire({
      title: 'Edit Brand',
      input: 'text',
      inputValue: brand.name,
      showCancelButton: true,
      confirmButtonText: 'Update',
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      inputValidator: (value) => {
        if (!value) {
          return 'Brand name is required!';
        }
        return null;
      }
    }).then((result) => {

      if (result.isConfirmed) {

        const newName = result.value;

        this.brandService.updateBrand(brand.id, newName).subscribe({
          next: () => {

            // update UI instantly
            this.brands = this.brands.map(b =>
              b.id === brand.id ? { ...b, name: newName } : b
            );

            Swal.fire({
              title: 'Updated!',
              text: 'Brand has been updated successfully.',
              icon: 'success',
              timer: 1500,
              showConfirmButton: false
            });

          },
          error: (err) => {
            console.log(err);

            Swal.fire({
              title: 'Error!',
              text: 'Failed to update brand.',
              icon: 'error'
            });
          }
        });

      }

    });
  }
}
