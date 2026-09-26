import { Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import { CartService } from '../../services/cart/cart.service';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2'
import { OrderService } from '../../services/order/order.service';
import { serverTimestamp } from '@angular/fire/firestore';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, DecimalPipe],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.scss',
  schemas:[CUSTOM_ELEMENTS_SCHEMA]
})
export class CartComponent {
  private readonly _FormBuilder = inject(FormBuilder)
  private readonly _OrderService = inject(OrderService)
  private readonly _CartService = inject(CartService)
  private readonly _Router = inject(Router)

  cart = this.cartService.cartSignal;
  ShippingValue:number = 40

  // quantity لكل منتج (بداية 1)
  quantities: Record<number, number> = {};
  summaryOrder:any[]  = []
  subtotal:number = 0
  totalWithShipping:number = 0

  userId:string | null = localStorage.getItem('uvID') || null
  fullName:string | null = localStorage.getItem('fullName') || null
  email:string | null = localStorage.getItem('email') || null
  phone:string | null = localStorage.getItem('phone') || null

  constructor(private cartService: CartService) {
    // init quantities
    this.cart().forEach(item => {
      this.quantities[item.id] = 1;
    });
  }

  // حساب total لكل منتج
  productTotal(itemId: number, price: number) {
    return this.quantities[itemId] * price;
  }

  // حساب الكلي
  get totalPrice(): number {
    return this.cart().reduce((total, item) => {
      const price = Number(item?.selectedSize?.price) || 0;
      const discount = Number(item?.selectedSize?.discount) || 0;
      const quantity = Number(item?.quantity) || 1;

      return total + ((price - discount) * quantity);
    }, 0);
  }

  remove(itemId: number) {
    this.cartService.removeFromCart(itemId);
    delete this.quantities[itemId];
  }

  dataForm: FormGroup = this._FormBuilder.group({
    name: [
      '', [ Validators.required, Validators.minLength(3), Validators.maxLength(50), Validators.pattern(/^[a-zA-Z\u0621-\u064A\s]+$/)]
    ],
    phone: [
      '', [ Validators.required, Validators.pattern(/^[0-9]{10,15}$/)]
    ],
    email: [''],
    address: [
      '', [ Validators.required, Validators.minLength(3), Validators.maxLength(200)]
    ],
    note: [
      '', [ Validators.minLength(3), Validators.maxLength(200)]
    ]
  });

  checkOrder(): void {
    const cartItems = this.cart(); // جلب الكارت من الـ signal

    // بناء الـ order array مع total لكل منتج
    this.summaryOrder = cartItems.map(item => ({
      id: item.id,
      name: item.name,
      color: item?.selectedVariant?.color,
      size: item?.selectedSize?.size,
      quantity: item?.quantity,
      price: item?.selectedSize?.price - item?.selectedSize?.discount,
      total: (item?.selectedSize?.price - item?.selectedSize?.discount) * item?.quantity
    }));

    // total شامل
    this.subtotal = this.summaryOrder.reduce((sum, item) => sum + item.total, 0);

    // إضافة قيمة التوصيل
    this.totalWithShipping = this.subtotal + this.ShippingValue;
  }

  submitOrder(): void {
    // تحديث الـ summary قبل الإرسال
    this.checkOrder();

    // التأكد من صحة الفورم
    if (this.dataForm.invalid && !this.userId) {
      this.dataForm.markAllAsTouched();
      return;
    }

    Swal.fire({
      title: 'Submitting Order...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    let orderData = {}

    if(!this.userId){
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
    } else {
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


    console.log(orderData);


    this._OrderService.createOrders(orderData).subscribe({
      next: (res) => {
        Swal.close();
        Swal.fire({
          title: 'Order Successfully',
          text: 'Our team will contact you shortly',
          icon: "success",
          confirmButtonText: 'Done'
        }).then(()=>{
          this._Router.navigate(['/home']).then(() => {
            window.location.reload();
          });
        })

        this.submiteOrderInGoogleSheets();

        this.cartService.clearCart();
        this.quantities = {};
        this.summaryOrder = [];
        this.subtotal = 0;
        this.totalWithShipping = 0;
        this.dataForm.reset();
      },
      error: (err) => {
        Swal.close();

        Swal.fire({
          title: 'Error',
          text: 'Something went wrong, please try again.',
          icon: 'error'
        });
      }
    });

  }

  submiteOrderInGoogleSheets():void{
    // بناء بيانات الطلب
    const orderDataSheet = {
      orderId: Date.now(), // أو UUID
      name: this.dataForm.value.name,
      phone: this.dataForm.value.phone,
      address: this.dataForm.value.address,
      products: JSON.stringify(this.summaryOrder), // 👈 مهم
      count: this.summaryOrder.length,
      subtotal: this.subtotal,
      total: this.totalWithShipping,
      date: new Date().toISOString(), // 👈 مهم بدل object
      status: 'Pending',
    };

    const formData = new FormData()
    formData.append('OrderId', String(orderDataSheet.orderId)),
    formData.append('Date', orderDataSheet.date),
    formData.append('Name', orderDataSheet.name),
    formData.append('Phone', orderDataSheet.phone),
    formData.append('Address', orderDataSheet.address),
    formData.append('Products', orderDataSheet.products),
    formData.append('Count', String(orderDataSheet.count)),
    formData.append('SubTotal', String(orderDataSheet.subtotal)),
    formData.append('Total', String(orderDataSheet.total)),
    formData.append('Status',  orderDataSheet.status),

    this._CartService.orders(formData).subscribe({
      next:(res)=>{
        console.log('Done In Google Sheets');
      },
      error:(err)=>{
        console.log('Wrong Save In Google Sheets');
      }
    })
  }
}
