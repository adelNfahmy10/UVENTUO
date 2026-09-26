import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter, withInMemoryScrolling, withViewTransitions } from '@angular/router';
import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { provideToastr } from 'ngx-toastr';
import { loadingInterceptor } from '../interceptors/loading/loading.interceptor';
import { NgxSpinnerModule } from 'ngx-spinner';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { environment } from '../environments/environment';


export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withInMemoryScrolling({scrollPositionRestoration:'top'}),
    withViewTransitions()),
    provideClientHydration(),
    provideHttpClient(withFetch(), withInterceptors([loadingInterceptor])),
    provideAnimations(),
    provideTranslateService({
      loader: provideTranslateHttpLoader({
        prefix: '/assets/i18n/',
        suffix: '.json'
      }),
      lang: 'en',
      fallbackLang: 'en'
    }),
    provideToastr(),
    importProvidersFrom(NgxSpinnerModule),

    provideFirebaseApp(() =>
      initializeApp(environment.firebase)
    ),

    provideAuth(() =>
      getAuth()
    ),

    provideFirestore(() =>
      getFirestore()
    )
  ]
};
