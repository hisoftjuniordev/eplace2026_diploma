import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

const API = environment.apiUrl;
const TOKEN_KEY = 'eplace_jwt';

export interface AuthUser {
  id: string;
  email: string;
  ime: string;
  priimek: string;
  vloga: string;
  tenantId: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _user = signal<AuthUser | null>(null);
  readonly user = this._user.asReadonly();
  readonly isLoggedIn = computed(() => !!this._user());
  readonly isSkrbnik = computed(() => ['Skrbnik', 'SistemskiAdmin'].includes(this._user()?.vloga ?? ''));

  constructor(private http: HttpClient, private router: Router) {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      const user = this.decodeToken(token);
      if (user) {
        this._user.set(user);
      } else {
        localStorage.removeItem(TOKEN_KEY);
      }
    }
  }

  login(email: string, password: string) {
    return this.http.post<{ token: string; user: AuthUser }>(`${API}/auth/login`, { email, password }).pipe(
      tap(({ token, user }) => {
        localStorage.setItem(TOKEN_KEY, token);
        this._user.set(user);
      })
    );
  }

  logout() {
    localStorage.removeItem(TOKEN_KEY);
    this._user.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  private decodeToken(token: string): AuthUser | null {
    try {
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      if (!payload.sub || !payload.email || Date.now() / 1000 > payload.exp) return null;
      return {
        id: payload.sub,
        email: payload.email,
        ime: payload.ime ?? '',
        priimek: payload.priimek ?? '',
        vloga: payload.vloga,
        tenantId: payload.tenantId,
      };
    } catch {
      return null;
    }
  }
}
