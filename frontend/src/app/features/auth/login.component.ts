import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen bg-gray-50 flex items-center justify-center">
      <div class="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 class="text-2xl font-bold text-gray-800 mb-2">ePlače 2026</h1>
        <p class="text-gray-500 mb-6">Sistem za obračun plač</p>

        <form [formGroup]="form" (ngSubmit)="login()">
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              formControlName="email"
              type="email"
              class="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              [class.border-red-500]="form.get('email')?.invalid && form.get('email')?.touched"
              placeholder="admin@a.si"
            />
            <div *ngIf="form.get('email')?.invalid && form.get('email')?.touched" class="text-red-600 text-sm mt-1">
              Vnesite veljaven email
            </div>
          </div>

          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-1">Geslo</label>
            <input
              formControlName="password"
              type="password"
              class="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              [class.border-red-500]="form.get('password')?.invalid && form.get('password')?.touched"
            />
          </div>

          <div *ngIf="errorMsg" class="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
            {{ errorMsg }}
          </div>

          <button
            type="submit"
            [disabled]="form.invalid || loading"
            class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {{ loading ? 'Prijavljanje...' : 'Prijava' }}
          </button>
        </form>

        <p class="mt-4 text-xs text-gray-400 text-center">Testni dostop: admin&#64;a.si / Test1234!</p>
      </div>
    </div>
  `,
})
export class LoginComponent {
  form = this.fb.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });
  loading = false;
  errorMsg = '';

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {}

  login() {
    if (this.form.invalid) return;
    this.loading = true;
    this.errorMsg = '';
    const { email, password } = this.form.value;

    this.auth.login(email!, password!).subscribe({
      next: () => this.router.navigate(['/employees']),
      error: (err) => {
        this.errorMsg = err?.error?.error ?? 'Napaka pri prijavi';
        this.loading = false;
      },
    });
  }
}
