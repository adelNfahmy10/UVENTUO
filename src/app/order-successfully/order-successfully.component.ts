import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { filter, take } from 'rxjs';
import { OrderService } from '../../services/order/order.service';
import { CartService } from '../../services/cart/cart.service';

@Component({
  selector: 'app-order-successfully',
  standalone: true,
  imports: [],
  templateUrl: './order-successfully.component.html',
  styleUrl: './order-successfully.component.scss',
})
export class OrderSuccessfullyComponent implements OnInit {
  private readonly _ActivatedRoute = inject(ActivatedRoute);
  private readonly _OrderService = inject(OrderService);
  private readonly _CartService = inject(CartService);

  ngOnInit(): void {
    const orderId = this._ActivatedRoute.snapshot.queryParamMap.get('orderId');

    if (!orderId) {
      console.error('Order ID is missing from the URL');
      return;
    }

    this._OrderService
      .getOrderById(orderId)
      .pipe(
        filter((order) => !!order),
        filter(
          (order) => order.status === 'Paid' && order.paymentStatus === 'Paid',
        ),
        take(1),
      )
      .subscribe({
        next: () => {
          localStorage.getItem('cart')
        },
        error: (error) => {
          console.error('Failed to verify order payment:', error);
        },
      });
  }
}
