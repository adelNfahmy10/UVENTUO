import { inject, Injectable } from '@angular/core';
import { collection, doc, Firestore, getDoc, getDocs } from '@angular/fire/firestore';
import { from, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private firestore = inject(Firestore);

  // GET ALL USERS
  getAllUser() {
    const usersRef = collection(this.firestore, 'users');

    return from(getDocs(usersRef)).pipe(
      map((snapshot) => {
        return snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));
      })
    );
  }

  // GET USER BY ID
  getUserById(uid: string) {
    const userRef = doc(this.firestore, 'users', uid);

    return from(getDoc(userRef)).pipe(
      map((snapshot) => {
        if (snapshot.exists()) {
          return {
            id: snapshot.id,
            ...snapshot.data()
          };
        }

        return null;
      })
    );
  }
}
