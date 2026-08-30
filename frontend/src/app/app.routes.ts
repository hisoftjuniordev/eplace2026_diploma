import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './core/auth.service';
import { Router } from '@angular/router';
import { ShellComponent } from './shell.component';

const authGuard = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isLoggedIn()) { router.navigate(['/login']); return false; }
  return true;
};

const skrbnikGuard = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isSkrbnik()) { router.navigate(['/employees']); return false; }
  return true;
};

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login.component').then((m) => m.LoginComponent),
  },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'employees', pathMatch: 'full' },
      {
        path: 'employees',
        loadComponent: () =>
          import('./features/employees/list.component').then((m) => m.EmployeeListComponent),
      },
      {
        path: 'employees/new',
        canActivate: [skrbnikGuard],
        loadComponent: () =>
          import('./features/employees/form.component').then((m) => m.EmployeeFormComponent),
      },
      {
        path: 'employees/:id/edit',
        canActivate: [skrbnikGuard],
        loadComponent: () =>
          import('./features/employees/form.component').then((m) => m.EmployeeFormComponent),
      },
      {
        path: 'hours',
        loadComponent: () =>
          import('./features/hours/hours.component').then((m) => m.HoursComponent),
      },
      {
        path: 'payroll',
        canActivate: [skrbnikGuard],
        loadComponent: () =>
          import('./features/payroll/wizard.component').then((m) => m.PayrollWizardComponent),
      },
      {
        path: 'payroll/:id/progress',
        loadComponent: () =>
          import('./features/payroll/progress.component').then((m) => m.PayrollProgressComponent),
      },
      {
        path: 'job-positions',
        canActivate: [skrbnikGuard],
        loadComponent: () =>
          import('./features/job-positions/job-positions.component').then((m) => m.JobPositionsComponent),
      },
      {
        path: 'settings',
        canActivate: [skrbnikGuard],
        loadComponent: () =>
          import('./features/settings/settings.component').then((m) => m.SettingsComponent),
      },
      {
        path: 'payroll-params',
        canActivate: [skrbnikGuard],
        loadComponent: () =>
          import('./features/payroll-params/payroll-params.component').then((m) => m.PayrollParamsComponent),
      },
      {
        path: 'payroll/:id/payslip/:empId',
        loadComponent: () =>
          import('./features/payroll/payslip.component').then((m) => m.PayslipComponent),
      },
    ],
  },
  { path: '**', redirectTo: '/employees' },
];
