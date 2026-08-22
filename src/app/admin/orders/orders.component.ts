import { Component, inject, OnInit } from '@angular/core';
import { OrderService } from '../../../services/order/order.service';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../../services/auth/auth.service';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [DecimalPipe, RouterLink, DatePipe],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.scss'
})
export class OrdersComponent implements OnInit{
  private readonly _OrderService = inject(OrderService)
  private readonly _ToastrService = inject(ToastrService)

  orders:any[] = []
  userId:string | null = localStorage.getItem('chaosUID') || null

  ngOnInit(): void {
    this.getAllOrders()
    this.getOrderByUserId();
  }

  isAdmin(): boolean {
    return (
      this.userId === 'JZLlIb2UADfG1b8jyCNEzoCKRW22' ||
      this.userId === 'Pnaj8KD0JKWJG7GfvP4LyXx9nNN2'
    );
  }

  getAllOrders(): void {
    if (this.isAdmin()) {
      this._OrderService.getOrders().subscribe({
        next: (res) => {
          this.orders = res;
        },
        error: (err) => {
          console.error('Get Orders Error:', err);
        }
      });
    }
  }

  getOrderByUserId(): void {
    if (!this.isAdmin()) {
      this._OrderService.getOrders().subscribe({
        next: (res) => {
          this.orders = res.filter(
            (order: any) => order.uid === this.userId
          );

          console.log(this.orders);

        },
        error: (err) => {
          console.error('Get User Orders Error:', err);
        }
      });
    }
  }

  updateStatusOrder(orderId: string, status: string): void {

    this._OrderService.updateOrderStatus(orderId, status)
      .subscribe({
        next: () => {
          this._ToastrService.success('Status updated successfully');
        },
        error: (err) => {
          this._ToastrService.error('Status update failed');
        }
      });

  }
}
