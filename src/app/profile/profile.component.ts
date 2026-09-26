import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth/auth.service';
import { ToastrService } from 'ngx-toastr';
import { Router, RouterLink } from '@angular/router';
import { OrderService } from '../../services/order/order.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit{
  private readonly _FormBuilder = inject(FormBuilder)
  private readonly _AuthService = inject(AuthService)
  private readonly _OrderService = inject(OrderService)
  private readonly _Router = inject(Router)
  private readonly _ToastrService = inject(ToastrService)

  step:boolean = false
  showPassword: boolean = false;
  showRePassword: boolean = false;

  userId:string | null = localStorage.getItem('uvID') || null
  fullName:string | null = localStorage.getItem('fullName') || null;
  email:string | null = localStorage.getItem('email') || null;
  phone:string | null = localStorage.getItem('phone') || null;

  ordersCount:number = 0

  ngOnInit(): void {
    this.getOrderByUserId()
  }

  loginForm:FormGroup = this._FormBuilder.group({
    email: ['', [Validators.email, Validators.required]],
    password: ['', Validators.required]
  });

  registerForm: FormGroup = this._FormBuilder.group({
      fullName: ['',[Validators.required,Validators.minLength(3),Validators.maxLength(50)]],

      phone: ['',[Validators.required,Validators.pattern(/^01[0125][0-9]{8}$/)]],

      email: ['',[Validators.required,Validators.email]],

      password: ['',[Validators.required,Validators.minLength(6)]],

      repassword: ['',[Validators.required]]
    },
    {
      validators: this.passwordMatchValidator
    }
  );

  passwordMatchValidator(group: FormGroup) {
    const password = group.get('password')?.value;
    const repassword = group.get('repassword')?.value;

    return password === repassword ? null : { passwordMismatch: true };
  }

  submitLogin(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this._ToastrService.error(
        'Please enter a valid email and password.',
        'Login Failed'
      );
      return;
    }

    const data = this.loginForm.value;

    this._AuthService.login(data).subscribe({
      next: (user) => {
        this._ToastrService.success(
          'Welcome back! You have successfully logged in.',
          'Login Successful'
        );

        this.loginForm.reset();
        this._Router.navigate(['/']).then(() => {
          window.location.reload();
        });
      },

      error: (err) => {
        this._ToastrService.error(
          'Incorrect email or password. Please try again.',
          'Login Failed'
        );
      }
    });
  }

  submitRegister(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();

      this._ToastrService.error(
        'Please fill in all required fields correctly.',
        'Registration Failed'
      );

      return;
    }

    if (
      this.registerForm.value.password !==
      this.registerForm.value.repassword
    ) {
      this._ToastrService.error(
        'Passwords do not match. Please try again.',
        'Registration Failed'
      );

      return;
    }

    const data = this.registerForm.value;

    this._AuthService.register(data).subscribe({
      next: (user) => {
        this._ToastrService.success(
          'Your account has been created successfully!',
          'Registration Successful'
        );
        this.registerForm.reset();
        this._Router.navigate(['/']).then(() => {
          window.location.reload();
        });
      },
      error: (err) => {
        switch (err.code) {
          case 'auth/email-already-in-use':
            this._ToastrService.error(
              'This email is already registered. Please use another email.',
              'Registration Failed'
            );
            break;

          case 'auth/invalid-email':
            this._ToastrService.error(
              'Please enter a valid email address.',
              'Registration Failed'
            );
            break;

          case 'auth/weak-password':
            this._ToastrService.error(
              'Password must be at least 6 characters.',
              'Registration Failed'
            );
            break;

          case 'auth/configuration-not-found':
            this._ToastrService.error(
              'Email/Password authentication is not enabled.',
              'Firebase Configuration Error'
            );
            break;

          default:
            this._ToastrService.error(
              'Unable to create your account. Please try again later.',
              'Registration Failed'
            );
        }
      }
    });
  }

  stepToggle():void{
    this.step = !this.step;
  }

  getOrderByUserId(): void {
    if (this.userId) {
      this._OrderService.getOrders().subscribe({
        next: (res) => {
          this.ordersCount = res.filter(
            (order: any) => order.uid === this.userId
          ).length
        },
        error: (err) => {
          console.error('Get User Orders Error:', err);
        }
      });
    }
  }

  logout():void{
    localStorage.clear();
    this._Router.navigate(['/']).then(() => {
      window.location.reload();
    });
  }
}
