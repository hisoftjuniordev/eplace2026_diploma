import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

const API = environment.apiUrl;

interface Employee { id: string; ime: string; priimek: string; bruto_osnova: number; }

@Component({
  selector: 'app-payroll-wizard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="p-6">
      <div class="mb-6">
        <h1 class="text-xl font-semibold text-gray-900">Obračun plač</h1>
        <p class="text-sm text-gray-500 mt-0.5">Mesečni obračun plač za vse delavce</p>
      </div>

      <div class="max-w-2xl">
        <!-- Koraki -->
        <div class="flex items-center mb-8">
          <div *ngFor="let s of steps; let i = index" class="flex items-center">
            <div class="flex items-center gap-2">
              <div class="w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium"
                   [class.bg-blue-600]="korak() >= i + 1"
                   [class.text-white]="korak() >= i + 1"
                   [class.bg-gray-200]="korak() < i + 1"
                   [class.text-gray-600]="korak() < i + 1">
                {{ i + 1 }}
              </div>
              <span class="text-sm" [class.font-medium]="korak() === i + 1">{{ s }}</span>
            </div>
            <div *ngIf="i < steps.length - 1" class="mx-3 h-px bg-gray-300 w-12"></div>
          </div>
        </div>

        <!-- Korak 1: Izbira obdobja -->
        <div *ngIf="korak() === 1" class="bg-white rounded-lg shadow p-6">
          <h3 class="text-lg font-semibold mb-4">Izbira obdobja</h3>
          <form [formGroup]="periodForm" class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Leto</label>
                <input formControlName="leto" type="number" min="2024" max="2030" (change)="computeDatum()"
                  class="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Mesec</label>
                <select formControlName="mesec" (change)="computeDatum()" class="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none">
                  <option *ngFor="let m of meseci" [ngValue]="m.v">{{ m.l }}</option>
                </select>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Datum izplačila</label>
              <input formControlName="datum_izplacila" type="date"
                class="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
            </div>
            <div class="flex justify-end pt-2">
              <button (click)="computeDatum(); korak.set(2)" [disabled]="periodForm.invalid"
                class="bg-blue-600 text-white px-6 py-2 rounded-md text-sm hover:bg-blue-700 disabled:opacity-50">
                Naprej →
              </button>
            </div>
          </form>
        </div>

        <!-- Korak 2: Pregled delavcev -->
        <div *ngIf="korak() === 2" class="bg-white rounded-lg shadow p-6">
          <h3 class="text-lg font-semibold mb-4">Pregled delavcev</h3>
          <p class="text-sm text-gray-500 mb-4">Naslednji delavci bodo vključeni v obračun:</p>

          <div *ngIf="employees().length === 0" class="text-center py-8 text-gray-400">
            Ni delavcev za obračun.
          </div>

          <table *ngIf="employees().length > 0" class="w-full text-sm mb-4">
            <thead class="bg-gray-50">
              <tr>
                <th class="text-left px-3 py-2 font-medium text-gray-600">Delavec</th>
                <th class="text-right px-3 py-2 font-medium text-gray-600">Bruto osnova</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let e of employees()" class="border-t">
                <td class="px-3 py-2">{{ e.priimek }} {{ e.ime }}</td>
                <td class="px-3 py-2 text-right font-mono">{{ e.bruto_osnova | number:'1.2-2' }} €</td>
              </tr>
            </tbody>
          </table>

          <div class="flex justify-between pt-2">
            <button (click)="korak.set(1)" class="text-gray-600 px-4 py-2 rounded-md text-sm border hover:bg-gray-50">← Nazaj</button>
            <button (click)="korak.set(3)" [disabled]="employees().length === 0"
              class="bg-blue-600 text-white px-6 py-2 rounded-md text-sm hover:bg-blue-700 disabled:opacity-50">
              Naprej →
            </button>
          </div>
        </div>

        <!-- Korak 3: Sproži obračun -->
        <div *ngIf="korak() === 3" class="bg-white rounded-lg shadow p-6">
          <h3 class="text-lg font-semibold mb-2">Sproži obračun</h3>
          <div class="bg-blue-50 border border-blue-200 rounded p-4 mb-6 text-sm">
            <p class="font-medium text-blue-800">Povzetek:</p>
            <p class="text-blue-700 mt-1">Obdobje: {{ meseci[periodForm.value.mesec! - 1].l }} {{ periodForm.value.leto }}</p>
            <p class="text-blue-700">Datum izplačila: {{ periodForm.value.datum_izplacila }}</p>
            <p class="text-blue-700">Število delavcev: {{ employees().length }}</p>
          </div>

          <div *ngIf="error" class="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">{{ error }}</div>

          <div class="flex justify-between">
            <button (click)="korak.set(2)" class="text-gray-600 px-4 py-2 rounded-md text-sm border hover:bg-gray-50">← Nazaj</button>
            <button (click)="sprozObracun()" [disabled]="loading"
              class="bg-green-600 text-white px-6 py-2 rounded-md text-sm hover:bg-green-700 disabled:opacity-50 font-medium">
              {{ loading ? 'Sprožanje...' : '🚀 Sproži obračun' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class PayrollWizardComponent implements OnInit {

  korak = signal(1);
  steps = ['Obdobje', 'Pregled delavcev', 'Sproži obračun'];
  employees = signal<Employee[]>([]);
  loading = false;
  error = '';

  meseci = [
    { v: 1, l: 'Januar' }, { v: 2, l: 'Februar' }, { v: 3, l: 'Marec' },
    { v: 4, l: 'April' }, { v: 5, l: 'Maj' }, { v: 6, l: 'Junij' },
    { v: 7, l: 'Julij' }, { v: 8, l: 'Avgust' }, { v: 9, l: 'September' },
    { v: 10, l: 'Oktober' }, { v: 11, l: 'November' }, { v: 12, l: 'December' },
  ];

  periodForm = this.fb.group({
    leto:            [2026, [Validators.required, Validators.min(2024)]],
    mesec:           [1, [Validators.required]],
    datum_izplacila: ['2026-01-31', [Validators.required]],
  });

  constructor(private fb: FormBuilder, private http: HttpClient, private router: Router) {}

  ngOnInit() {
    this.periodForm.get('leto')!.valueChanges.subscribe(() => this.computeDatum());
    this.periodForm.get('mesec')!.valueChanges.subscribe(() => this.computeDatum());
    this.http.get<{ data: Employee[]; total: number }>(`${API}/employees`).subscribe({
      next: (res) => this.employees.set(res.data),
    });
  }

  computeDatum() {
    const { leto, mesec } = this.periodForm.value;
    if (leto && mesec) {
      const last = new Date(leto, mesec, 0);
      const yyyy = last.getFullYear();
      const mm   = String(last.getMonth() + 1).padStart(2, '0');
      const dd   = String(last.getDate()).padStart(2, '0');
      this.periodForm.patchValue({ datum_izplacila: `${yyyy}-${mm}-${dd}` }, { emitEvent: false });
    }
  }

  sprozObracun() {
    this.loading = true;
    this.error = '';
    this.http.post<{ id: string; status: string }>(`${API}/payroll/runs`, this.periodForm.value).subscribe({
      next: (res) => this.router.navigate(['/payroll', res.id, 'progress']),
      error: (err) => {
        if (err?.status === 409) {
          const { leto, mesec } = this.periodForm.value;
          this.http.get<{ id: string; leto: number; mesec: number }[]>(`${API}/payroll/runs`).subscribe({
            next: (runs) => {
              const existing = runs.find(r => r.leto === leto && r.mesec === mesec);
              if (existing) {
                this.router.navigate(['/payroll', existing.id, 'progress']);
              } else {
                this.error = err?.error?.error ?? 'Napaka pri sprožitvi obračuna';
                this.loading = false;
              }
            },
            error: () => {
              this.error = err?.error?.error ?? 'Napaka pri sprožitvi obračuna';
              this.loading = false;
            },
          });
          return;
        }
        this.error = err?.error?.error ?? 'Napaka pri sprožitvi obračuna';
        this.loading = false;
      },
    });
  }
}
