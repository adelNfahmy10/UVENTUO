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
        take(1),
      )
      .subscribe({
        next: (order) => {
          console.log('ORDER FROM FIRESTORE:', order);

          if (order.status === 'Paid' && order.paymentStatus === 'Paid') {
            console.log('Payment confirmed successfully');
            this._CartService.clearCart();
          } else {
            console.log('Payment is not confirmed in Firestore yet', {
              status: order.status,
              paymentStatus: order.paymentStatus,
            });
          }
        },
        error: (error) => {
          console.error('Failed to retrieve order:', error);
        },
      });
  }
}
