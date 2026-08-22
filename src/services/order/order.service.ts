import { inject, Injectable } from '@angular/core';
import { addDoc, collection, collectionData, doc, docData, Firestore, updateDoc } from '@angular/fire/firestore';
import { from, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private readonly _Firestore = inject(Firestore)

  createOrders(orderData: any): Observable<any> {
    const ordersRef = collection(this._Firestore, 'orders');

    return from(addDoc(ordersRef, orderData));
  }

  getOrders(): Observable<any[]> {
    const ordersRef = collection(this._Firestore, 'orders');
    return collectionData(ordersRef, { idField: 'id' }) as Observable<any[]>;
  }

  getOrderById(id: string): Observable<any> {
    const orderRef = doc(this._Firestore, `orders/${id}`);
    return docData(orderRef, { idField: 'id' });
  }

  updateOrderStatus(orderId: string, status: string): Observable<void> {
    const orderRef = doc(this._Firestore, 'orders', orderId);

    return from(
      updateDoc(orderRef, {
        status: status
      })
    );
  }
}
