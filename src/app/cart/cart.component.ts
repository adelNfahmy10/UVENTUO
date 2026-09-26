import { Component, CUSTOM_ELEMENTS_SCHEMA, inject } from '@angular/core';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';

import { serverTimestamp } from '@angular/fire/firestore';

import { CartService } from '../../services/cart/cart.service';
import { OrderService } from '../../services/order/order.service';

import Swal from 'sweetalert2';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, DecimalPipe],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class CartComponent {
  // =========================================================
  // INJECT SERVICES
  // =========================================================

  private readonly _FormBuilder = inject(FormBuilder);
  private readonly _OrderService = inject(OrderService);
  private readonly _CartService = inject(CartService);
  private readonly _Router = inject(Router);

  // =========================================================
  // CART
  // =========================================================

  cart = this._CartService.cartSignal;

  ShippingValue: number = 40;

  summaryOrder: any[] = [];

  subtotal: number = 0;

  totalWithShipping: number = 0;

  // =========================================================
  // USER DATA
  // =========================================================

  userId: string | null = localStorage.getItem('uvID') || null;

  fullName: string | null = localStorage.getItem('fullName') || null;

  email: string | null = localStorage.getItem('email') || null;

  phone: string | null = localStorage.getItem('phone') || null;

  // =========================================================
  // FORM
  // =========================================================

  dataForm: FormGroup = this._FormBuilder.group({
    name: [
      '',
      [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(50),
        Validators.pattern(/^[a-zA-Z\u0621-\u064A\s]+$/),
      ],
    ],

    phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10,15}$/)]],

    email: [''],

    address: [
      '',
      [Validators.required, Validators.minLength(3), Validators.maxLength(200)],
    ],

    note: ['', [Validators.minLength(3), Validators.maxLength(200)]],
  });

  // =========================================================
  // ITEM PRICE
  // =========================================================

  getItemPrice(item: any): number {
    const price = Number(item?.selectedSize?.price) || 0;

    const discount = Number(item?.selectedSize?.discount) || 0;

    return price - discount;
  }

  // =========================================================
  // ITEM TOTAL
  // =========================================================

  getItemTotal(item: any): number {
    const price = this.getItemPrice(item);

    const quantity = Number(item?.quantity) || 1;

    return price * quantity;
  }

  // =========================================================
  // CART TOTAL
  // =========================================================

  get totalPrice(): number {
    return this.cart().reduce((total, item) => {
      return total + this.getItemTotal(item);
    }, 0);
  }

  // =========================================================
  // REMOVE ITEM
  // =========================================================

  remove(cartItemId: string): void {
    this._CartService.removeFromCart(cartItemId);
  }

  // =========================================================
  // CHECK ORDER
  // =========================================================

  checkOrder(): void {
    const cartItems = this.cart();

    this.summaryOrder = cartItems.map((item) => ({
      cartItemId: item?.cartItemId,

      id: item?.id,

      name: item?.name,

      variantName: item?.selectedVariant?.name,

      size: item?.selectedSize?.size,

      quantity: Number(item?.quantity) || 1,

      price: this.getItemPrice(item),

      total: this.getItemTotal(item),
    }));

    // -------------------------------------------------------
    // SUBTOTAL
    // -------------------------------------------------------

    this.subtotal = this.summaryOrder.reduce(
      (sum, item) => sum + Number(item?.total || 0),
      0,
    );

    // -------------------------------------------------------
    // TOTAL
    // -------------------------------------------------------

    this.totalWithShipping = this.subtotal + this.ShippingValue;
  }

  // =========================================================
  // SUBMIT ORDER
  // =========================================================

  submitOrder(): void {
    // -------------------------------------------------------
    // PREPARE ORDER
    // -------------------------------------------------------

    this.checkOrder();

    // -------------------------------------------------------
    // VALIDATION - GUEST
    // -------------------------------------------------------

    if (this.dataForm.invalid && !this.userId) {
      this.dataForm.markAllAsTouched();

      return;
    }

    // -------------------------------------------------------
    // VALIDATION - LOGGED USER
    // -------------------------------------------------------

    if (this.userId && this.dataForm.get('address')?.invalid) {
      this.dataForm.markAllAsTouched();

      return;
    }

    // -------------------------------------------------------
    // LOADING
    // -------------------------------------------------------

    Swal.fire({
      title: 'Submitting Order...',

      allowOutsideClick: false,

      didOpen: () => {
        Swal.showLoading();
      },
    });

    // -------------------------------------------------------
    // ORDER DATA
    // -------------------------------------------------------

    let orderData: any;

    // =======================================================
    // GUEST ORDER
    // =======================================================

    if (!this.userId) {
      orderData = {
        name: this.dataForm.value.name,

        phone: this.dataForm.value.phone,

        address: this.dataForm.value.address,

        note: this.dataForm.value.note,

        products: this.summaryOrder,

        count: this.summaryOrder.length,

        subtotal: this.subtotal,

        total: this.totalWithShipping,

        date: serverTimestamp(),

        status: 'Pending',
      };
    }

    // =======================================================
    // LOGGED USER ORDER
    // =======================================================
    else {
      orderData = {
        uid: this.userId,

        name: this.fullName,

        phone: this.phone,

        email: this.email,

        address: this.dataForm.value.address,

        note: this.dataForm.value.note,

        products: this.summaryOrder,

        count: this.summaryOrder.length,

        subtotal: this.subtotal,

        total: this.totalWithShipping,

        date: serverTimestamp(),

        status: 'Pending',
      };
    }

    // -------------------------------------------------------
    // DEBUG
    // -------------------------------------------------------

    console.log('ORDER DATA:', orderData);

    // =======================================================
    // CREATE ORDER
    // =======================================================

    this._OrderService.createOrders(orderData).subscribe({
      // -----------------------------------------------------
      // SUCCESS
      // -----------------------------------------------------

      next: () => {
        Swal.close();

        // ---------------------------------------------------
        // GOOGLE SHEETS
        // ---------------------------------------------------

        this.submiteOrderInGoogleSheets();

        // ---------------------------------------------------
        // CLEAR CART
        // ---------------------------------------------------

        this._CartService.clearCart();

        this.summaryOrder = [];

        this.subtotal = 0;

        this.totalWithShipping = 0;

        this.dataForm.reset();

        // ---------------------------------------------------
        // SUCCESS MESSAGE
        // ---------------------------------------------------

        Swal.fire({
          title: 'Order Successfully',

          text: 'Our team will contact you shortly',

          icon: 'success',

          confirmButtonText: 'Done',
        }).then(() => {
          this._Router.navigate(['/home']).then(() => {
            window.location.reload();
          });
        });
      },

      // -----------------------------------------------------
      // ERROR
      // -----------------------------------------------------

      error: (error) => {
        console.error('CREATE ORDER ERROR:', error);

        Swal.close();

        Swal.fire({
          title: 'Error',

          text: 'Something went wrong, please try again.',

          icon: 'error',
        });
      },
    });
  }

  // =========================================================
  // GOOGLE SHEETS
  // =========================================================

  submiteOrderInGoogleSheets(): void {
    const orderDataSheet = {
      orderId: Date.now(),

      name: this.userId ? this.fullName : this.dataForm.value.name,

      phone: this.userId ? this.phone : this.dataForm.value.phone,

      address: this.dataForm.value.address,

      products: JSON.stringify(this.summaryOrder),

      count: this.summaryOrder.length,

      subtotal: this.subtotal,

      total: this.totalWithShipping,

      date: new Date().toISOString(),

      status: 'Pending',
    };

    // =======================================================
    // FORM DATA
    // =======================================================

    const formData = new FormData();

    formData.append('OrderId', String(orderDataSheet.orderId));

    formData.append('Date', orderDataSheet.date);

    formData.append('Name', orderDataSheet.name || '');

    formData.append('Phone', orderDataSheet.phone || '');

    formData.append('Address', orderDataSheet.address || '');

    formData.append('Products', orderDataSheet.products);

    formData.append('Count', String(orderDataSheet.count));

    formData.append('SubTotal', String(orderDataSheet.subtotal));

    formData.append('Total', String(orderDataSheet.total));

    formData.append('Status', orderDataSheet.status);

    // =======================================================
    // SEND TO GOOGLE SHEETS
    // =======================================================

    this._CartService.orders(formData).subscribe({
      next: () => {
        console.log('Done In Google Sheets');
      },

      error: (error) => {
        console.error('Wrong Save In Google Sheets:', error);
      },
    });
  }
}
