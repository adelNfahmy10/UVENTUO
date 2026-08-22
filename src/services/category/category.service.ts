import { inject, Injectable } from '@angular/core';
import { addDoc, collection, collectionData, deleteDoc, doc, Firestore, getDoc, setDoc, updateDoc } from '@angular/fire/firestore';
import { from, map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private readonly _Firestore = inject(Firestore);
  private readonly categoriesRef = collection(this._Firestore, 'categories');

  // ================= CREATE =================
  addCategory(data: any): Observable<void> {
    const id = doc(collection(this._Firestore, 'categories')).id;

    return from(
      setDoc(doc(this._Firestore, 'categories', id), {
        id,
        ...data,
      })
    );
  }

  // ================= GET ALL =================
  getAllCategories(): Observable<any> {
    return collectionData(this.categoriesRef, { idField: 'id' }) as Observable<any>;
  }

  // ================= GET BY ID =================
  getCategoryById(id: string): Observable<any> {
    const categoryDoc = doc(this._Firestore, 'categories', id);

    return from(getDoc(categoryDoc)).pipe(
      map((snap) => {
        if (snap.exists()) {
          return {
            id: snap.id,
            ...snap.data()
          } as any;
        } else {
          return null;
        }
      })
    );
  }

  // ================= UPDATE =================
  updateCategory(id: string, name: string): Observable<void> {
    const categoryDoc = doc(this._Firestore, 'categories', id);

    return from(
      updateDoc(categoryDoc, {
        name
      })
    );
  }

  // ================= DELETE =================
  deleteCategory(id: string): Observable<void> {
    const categoryDoc = doc(this._Firestore, 'categories', id);

    return from(deleteDoc(categoryDoc));
  }
}
