import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';
import { catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const token = auth.getToken();

  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((err) => {
      // Only force-logout on 401 from auth endpoints (expired/invalid token),
      // not from data endpoints where 401 might be a permissions edge case.
      if (err.status === 401 && req.url.includes('/auth/')) {
        auth.logout();
      }
      return throwError(() => err);
    })
  );
};
