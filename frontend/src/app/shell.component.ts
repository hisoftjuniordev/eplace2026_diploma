import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './core/auth.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  template: `
    <div class="flex h-screen bg-gray-50 overflow-hidden">

      <!-- ===== LEFT SIDEBAR ===== -->
      <aside class="w-56 bg-white border-r border-gray-200 flex flex-col flex-shrink-0 shadow-sm">

        <!-- Logo -->
        <div class="px-4 py-5 border-b border-gray-100">
          <div class="font-bold text-gray-900 text-base tracking-tight">ePlače 2026</div>
          <div class="text-xs text-gray-400 mt-0.5">SaaS obračun plač</div>
        </div>

        <!-- Navigation -->
        <nav class="flex-1 px-3 py-4 space-y-0.5">
          <a routerLink="/employees"
             routerLinkActive="bg-blue-50 text-blue-700 font-medium"
             [routerLinkActiveOptions]="{exact: false}"
             class="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-gray-600
                    hover:bg-gray-50 hover:text-gray-900 transition-colors">
            <span class="text-base">👥</span>
            <span>Delavci</span>
          </a>

          <a routerLink="/hours"
             routerLinkActive="bg-blue-50 text-blue-700 font-medium"
             class="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-gray-600
                    hover:bg-gray-50 hover:text-gray-900 transition-colors">
            <span class="text-base">🕐</span>
            <span>Mesečne ure</span>
          </a>

          <a *ngIf="auth.isSkrbnik()"
             routerLink="/payroll"
             routerLinkActive="bg-blue-50 text-blue-700 font-medium"
             class="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-gray-600
                    hover:bg-gray-50 hover:text-gray-900 transition-colors">
            <span class="text-base">💰</span>
            <span>Obračun plač</span>
          </a>

          <a *ngIf="auth.isSkrbnik()"
             routerLink="/job-positions"
             routerLinkActive="bg-blue-50 text-blue-700 font-medium"
             class="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-gray-600
                    hover:bg-gray-50 hover:text-gray-900 transition-colors">
            <span class="text-base">🗂️</span>
            <span>Delovna mesta</span>
          </a>

          <a *ngIf="auth.isSkrbnik()"
             routerLink="/payroll-params"
             routerLinkActive="bg-blue-50 text-blue-700 font-medium"
             class="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-gray-600
                    hover:bg-gray-50 hover:text-gray-900 transition-colors">
            <span class="text-base">📊</span>
            <span>Parametri</span>
          </a>

          <a *ngIf="auth.isSkrbnik()"
             routerLink="/settings"
             routerLinkActive="bg-blue-50 text-blue-700 font-medium"
             class="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-gray-600
                    hover:bg-gray-50 hover:text-gray-900 transition-colors">
            <span class="text-base">⚙️</span>
            <span>Nastavitve</span>
          </a>
        </nav>

        <!-- User info + Logout -->
        <div class="px-4 py-4 border-t border-gray-100">
          <div class="text-xs font-medium text-gray-700 truncate">
            {{ auth.user()?.ime }} {{ auth.user()?.priimek }}
          </div>
          <div class="text-xs text-gray-400 truncate mt-0.5 mb-1">{{ auth.user()?.email }}</div>
          <span class="inline-block text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded mb-2">
            {{ auth.user()?.vloga }}
          </span>
          <br>
          <button (click)="auth.logout()"
                  class="text-xs text-red-500 hover:text-red-700 transition-colors mt-1">
            Odjava
          </button>
        </div>
      </aside>

      <!-- ===== MAIN CONTENT ===== -->
      <main class="flex-1 overflow-y-auto">
        <router-outlet />
      </main>

    </div>
  `,
})
export class ShellComponent {
  constructor(public auth: AuthService) {}
}
