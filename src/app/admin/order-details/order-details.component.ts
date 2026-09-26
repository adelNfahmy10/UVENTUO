import { Component, inject, OnInit } from '@angular/core';
import { OrderService } from '../../../services/order/order.service';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-order-details',
  standalone: true,
  imports: [DecimalPipe, RouterLink],
  templateUrl: './order-details.component.html',
  styleUrl: './order-details.component.scss',
})
export class OrderDetailsComponent implements OnInit {
  private readonly _OrderService = inject(OrderService);
  private readonly _ActivatedRoute = inject(ActivatedRoute);

  orderId: string | null = '';
  orderDetails: any = {};

  ngOnInit(): void {
    this.getOrderById();
  }

  getOrderById(): void {
    this._ActivatedRoute.paramMap.subscribe({
      next: (params) => {
        this.orderId = params.get('id')!;
        this._OrderService.getOrderById(this.orderId).subscribe({
          next: (res) => {
            this.orderDetails = res;
            console.log(this.orderDetails);
          },
        });
      },
    });
  }
}
