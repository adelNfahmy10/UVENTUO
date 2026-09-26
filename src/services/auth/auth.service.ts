import { inject, Injectable } from '@angular/core';
import { doc, Firestore, getDoc, setDoc } from '@angular/fire/firestore';
import { Auth, authState, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from '@angular/fire/auth';
import { from, switchMap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);

  // REGISTER
  register(data: any) {
    return from(
      createUserWithEmailAndPassword(
        this.auth,
        data.email,
        data.password
      )
    ).pipe(
      switchMap(async (userCredential) => {

        const user = userCredential.user;

        const userData = {
          uid: user.uid,
          fullName: data.fullName,
          phone: data.phone,
          email: data.email,
          role: data.role ?? 'user',
          createdAt: new Date()
        };

        await setDoc(
          doc(this.firestore, 'users', user.uid),
          userData
        );

        localStorage.setItem('uvID', user.uid);
        localStorage.setItem('fullName', userData.fullName);
        localStorage.setItem('phone', userData.phone);
        localStorage.setItem('email', userData.email);
        localStorage.setItem('role', userData.role);

        return userData;
      })
    );
  }

  // LOGIN
  login(data: any) {
    return from(
      signInWithEmailAndPassword(
        this.auth,
        data.email,
        data.password
      )
    ).pipe(
      switchMap(async (userCredential) => {
        const uid = userCredential.user.uid;

        const userRef = doc(this.firestore, 'users', uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          throw new Error('User data not found');
        }

        const userData = userSnap.data();

        localStorage.setItem('uvID', uid);
        localStorage.setItem('fullName', userData['fullName'] ?? '');
        localStorage.setItem('phone', userData['phone'] ?? '');
        localStorage.setItem('email', userData['email'] ?? '');
        localStorage.setItem('role', userData['role'] ?? 'user');

        return {
          uid,
          ...userData
        };
      })
    );
  }
}
