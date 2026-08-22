import { inject, Injectable } from '@angular/core';
import { addDoc, collection, collectionData, deleteDoc, doc, Firestore, getDoc, setDoc, updateDoc } from '@angular/fire/firestore';
import { from, map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BrandService {
 private readonly _Firestore = inject(Firestore);
  private readonly brandsRef = collection(this._Firestore, 'brands');

  // ================= CREATE =================
  addBrand(data:any): Observable<void> {
    const id = doc(collection(this._Firestore, 'brands')).id;

    return from(
      setDoc(doc(this._Firestore, 'brands', id), {
        id,
        ...data
      })
    );
  }

  // ================= GET ALL =================
  getAllBrands(): Observable<any> {
    return collectionData(this.brandsRef, { idField: 'id' }) as Observable<any>;
  }

  // ================= GET BY ID =================
  getBrandById(id: string): Observable<any> {
    const brandDoc = doc(this._Firestore, 'brands', id);

    return from(getDoc(brandDoc)).pipe(
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
  updateBrand(id: string, name: string): Observable<void> {
    const brandDoc = doc(this._Firestore, 'brands', id);

    return from(
      updateDoc(brandDoc, {
        name
      })
    );
  }

  // ================= DELETE =================
  deleteBrand(id: string): Observable<void> {
    const brandDoc = doc(this._Firestore, 'brands', id);

    return from(deleteDoc(brandDoc));
  }
}
