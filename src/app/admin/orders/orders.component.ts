import { Component, inject, OnInit } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';

import { ToastrService } from 'ngx-toastr';

import { OrderService } from '../../../services/order/order.service';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [DecimalPipe, RouterLink, DatePipe],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.scss',
})
export class OrdersComponent implements OnInit {
  private readonly _OrderService = inject(OrderService);
  private readonly _ToastrService = inject(ToastrService);

  orders: any[] = [];

  userId: string | null = localStorage.getItem('uvID') || null;

  ngOnInit(): void {
    if (this.isAdmin()) {
      this.getAllOrders();
    } else {
      this.getOrderByUserId();
    }
  }

  // =========================================================
  // ADMIN CHECK
  // =========================================================

  isAdmin(): boolean {
    return this.userId === '4lxgOSRBz6YfSAF3K9QDQwNm4Z12';
  }

  // =========================================================
  // GET ALL ORDERS — ADMIN
  // =========================================================

  getAllOrders(): void {
    this._OrderService.getOrders().subscribe({
      next: (res) => {
        this.orders = res || [];

        console.log('All Orders:', this.orders);
      },

      error: (err) => {
        console.error('Get Orders Error:', err);

        this._ToastrService.error('Failed to load orders');
      },
    });
  }

  // =========================================================
  // GET USER ORDERS
  // =========================================================

  getOrderByUserId(): void {
    if (!this.userId) {
      this.orders = [];
      return;
    }

    this._OrderService.getOrders().subscribe({
      next: (res) => {
        this.orders = (res || []).filter(
          (order: any) => order?.uid === this.userId,
        );

        console.log('User Orders:', this.orders);
      },

      error: (err) => {
        console.error('Get User Orders Error:', err);

        this._ToastrService.error('Failed to load orders');
      },
    });
  }

  // =========================================================
  // UPDATE STATUS
  // =========================================================

  updateStatusOrder(orderId: string, status: string): void {
    if (!orderId || !status) {
      return;
    }

    this._OrderService.updateOrderStatus(orderId, status).subscribe({
      next: () => {
        const order = this.orders.find((item) => item?.id === orderId);

        if (order) {
          order.status = status;
        }

        this._ToastrService.success('Status updated successfully');
      },

      error: (err) => {
        console.error('Status Update Error:', err);

        this._ToastrService.error('Status update failed');
      },
    });
  }
}
