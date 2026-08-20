import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/auth.service';
import { environment } from '../../../environments/environment';

interface Employee {
  id: string;
  ime: string;
  priimek: string;
  davcna_stevilka: string;
  emso: string;
  bruto_osnova: number;
  trr: string;
  aktivno: boolean;
}

const API = environment.apiUrl;

@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="p-6">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 class="text-xl font-semibold text-gray-900">Delavci</h1>
          <p class="text-sm text-gray-500 mt-0.5">Kadrovska evidenca</p>
        </div>
        <div class="flex gap-2 items-center">
          <button (click)="toggleInactive()"
                  class="text-sm px-3 py-2 border rounded-md transition-colors"
                  [class.bg-gray-100]="showInactive()"
                  [class.text-gray-700]="showInactive()"
                  [class.text-gray-500]="!showInactive()">
            {{ showInactive() ? 'Skrij neaktivne' : 'Prikaži neaktivne' }}
          </button>
          <a *ngIf="auth.isSkrbnik()" routerLink="/employees/new"
             class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium">
            + Nov delavec
          </a>
        </div>
      </div>

      <div *ngIf="loading()" class="text-center py-12 text-gray-500">Nalaganje...</div>

      <div *ngIf="!loading() && employees().length === 0" class="text-center py-12 text-gray-400">
        Ni delavcev. Dodajte prvega delavca.
      </div>

      <div *ngIf="!loading() && employees().length > 0" class="bg-white rounded-lg shadow overflow-hidden">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 border-b">
              <tr>
                <th class="text-left px-4 py-3 font-medium text-gray-600">Priimek in ime</th>
                <th class="text-left px-4 py-3 font-medium text-gray-600">Davčna</th>
                <th class="text-left px-4 py-3 font-medium text-gray-600">EMŠO</th>
                <th class="text-right px-4 py-3 font-medium text-gray-600">Bruto osnova</th>
                <th class="text-center px-4 py-3 font-medium text-gray-600">Status</th>
                <th class="text-center px-4 py-3 font-medium text-gray-600">Akcije</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let emp of employees()" class="border-b hover:bg-gray-50"
                  [class.opacity-50]="!emp.aktivno">
                <td class="px-4 py-3 font-medium">{{ emp.priimek }} {{ emp.ime }}</td>
                <td class="px-4 py-3 text-gray-600">{{ emp.davcna_stevilka }}</td>
                <td class="px-4 py-3 text-gray-600">{{ emp.emso }}</td>
                <td class="px-4 py-3 text-right font-mono">{{ emp.bruto_osnova | number:'1.2-2' }} €</td>
                <td class="px-4 py-3 text-center">
                  <span class="inline-block text-xs px-2 py-0.5 rounded-full font-medium"
                        [class.bg-green-100]="emp.aktivno"
                        [class.text-green-700]="emp.aktivno"
                        [class.bg-gray-100]="!emp.aktivno"
                        [class.text-gray-500]="!emp.aktivno">
                    {{ emp.aktivno ? 'Aktiven' : 'Neaktiven' }}
                  </span>
                </td>
                <td class="px-4 py-3 text-center">
                  <div *ngIf="auth.isSkrbnik()" class="flex justify-center gap-2">
                    <a [routerLink]="['/employees', emp.id, 'edit']"
                       class="text-blue-600 hover:underline text-xs">Uredi</a>
                    <button (click)="deleteEmp(emp.id)"
                            class="text-red-600 hover:underline text-xs">Briši</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
    </div>
  `,
})
export class EmployeeListComponent implements OnInit {
  employees  = signal<Employee[]>([]);
  loading    = signal(true);
  showInactive = signal(false);

  constructor(public auth: AuthService, private http: HttpClient) {}

  ngOnInit() { this.load(); }

  toggleInactive() {
    this.showInactive.update(v => !v);
    this.load();
  }

  load() {
    this.loading.set(true);
    const params = this.showInactive() ? '?includeInactive=true' : '';
    this.http.get<{ data: Employee[]; total: number }>(`${API}/employees${params}`).subscribe({
      next: (res) => { this.employees.set(res.data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  deleteEmp(id: string) {
    if (!confirm('Res izbrisati delavca?')) return;
    this.http.delete(`${API}/employees/${id}`).subscribe({
      next: () => this.load(),
      error: (err) => alert(err?.error?.error ?? 'Napaka pri brisanju'),
    });
  }
}
